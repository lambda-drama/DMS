# Copyright (c) 2026, Mania and contributors
"""Round-robin lead assignment — blueprint §5.3."""

from __future__ import annotations

from datetime import timedelta

import frappe
from frappe.utils import cint, get_datetime, now_datetime


POOL_DOCTYPE = "DMS CRM Lead Assignment Pool"


def round_robin_enabled() -> bool:
	try:
		settings = frappe.get_cached_doc("DMS CRM Settings")
	except Exception:
		return False
	return bool(cint(getattr(settings, "activate_round_robin_assignment", 0)))


def unaccepted_reassign_minutes() -> int:
	try:
		settings = frappe.get_cached_doc("DMS CRM Settings")
	except Exception:
		return 30
	return max(cint(getattr(settings, "unaccepted_reassign_minutes", None) or 30), 1)


def find_pool(branch: str | None, assigned_team: str | None) -> str | None:
	"""Prefer exact branch+team pool, then team-wide (blank branch) pool."""
	if not assigned_team:
		return None

	if branch:
		exact = frappe.db.get_value(
			POOL_DOCTYPE,
			{"assigned_team": assigned_team, "branch": branch, "active": 1},
			"name",
		)
		if exact:
			return exact

	for name, pool_branch in frappe.get_all(
		POOL_DOCTYPE,
		filters={"assigned_team": assigned_team, "active": 1},
		fields=["name", "branch"],
		as_list=True,
	):
		if not pool_branch:
			return name
	return None


def _eligible_users(pool, model: str | None = None, exclude: set[str] | None = None) -> list[str]:
	exclude = exclude or set()
	users: list[str] = []
	model_l = (model or "").strip().lower()

	for row in pool.users or []:
		if not row.active or not row.user or row.user in exclude:
			continue
		if row.user in users:
			continue
		if not frappe.db.get_value("User", row.user, "enabled"):
			continue
		competency = (row.model_competency or "").strip()
		if model_l and competency:
			tokens = [t.strip().lower() for t in competency.replace("\n", ",").split(",") if t.strip()]
			if tokens and not any(t in model_l or model_l in t for t in tokens):
				continue
		users.append(row.user)

	# If model filter emptied the pool, fall back to all active users
	if model_l and not users:
		for row in pool.users or []:
			if not row.active or not row.user or row.user in exclude:
				continue
			if row.user in users:
				continue
			if not frappe.db.get_value("User", row.user, "enabled"):
				continue
			users.append(row.user)
	return users


def pick_next_user(
	branch: str | None,
	assigned_team: str | None,
	*,
	model: str | None = None,
	exclude_user: str | None = None,
) -> tuple[str | None, str | None]:
	"""Return (user, pool_name) using round-robin on the matching pool."""
	pool_name = find_pool(branch, assigned_team)
	if not pool_name:
		return None, None

	frappe.db.sql(
		f"SELECT name FROM `tab{POOL_DOCTYPE}` WHERE name=%s FOR UPDATE",
		pool_name,
	)
	pool = frappe.get_doc(POOL_DOCTYPE, pool_name)
	exclude = {exclude_user} if exclude_user else set()
	users = _eligible_users(pool, model=model, exclude=exclude)
	if not users:
		return None, pool_name

	last = pool.last_user
	if last in users:
		start = (users.index(last) + 1) % len(users)
	else:
		start = 0
	next_user = users[start]

	pool.db_set(
		{
			"last_user": next_user,
			"last_assigned_on": now_datetime(),
		},
		update_modified=False,
	)
	return next_user, pool_name


def apply_round_robin(lead, *, force: bool = False, exclude_user: str | None = None) -> bool:
	"""Assign lead_owner via round-robin. Returns True if assigned."""
	if not force and not round_robin_enabled():
		return False
	if lead.get("accepted_on"):
		return False

	# Manual owner on create: skip RR unless forcing reassignment
	if not force and getattr(lead, "_skip_round_robin", False):
		return False

	user, pool_name = pick_next_user(
		lead.get("branch"),
		lead.get("assigned_team"),
		model=lead.get("model"),
		exclude_user=exclude_user or (lead.get("lead_owner") if force else None),
	)
	if not user:
		return False

	lead.lead_owner = user
	lead.assignment_method = "Round Robin"
	lead.assignment_pool = pool_name
	lead.assigned_on = now_datetime()
	lead.accepted_on = None
	if lead.status in (None, "", "New"):
		lead.status = "Assigned"
	return True


def mark_accepted(lead, when=None):
	if lead.get("accepted_on"):
		return
	lead.accepted_on = when or now_datetime()


def reassign_unaccepted_leads(limit: int = 50) -> dict:
	"""Scheduler: move unaccepted leads to the next pool user after N minutes."""
	if not round_robin_enabled():
		return {"skipped": True, "reason": "round_robin_disabled"}

	minutes = unaccepted_reassign_minutes()
	cutoff = get_datetime(now_datetime()) - timedelta(minutes=minutes)

	leads = frappe.get_all(
		"DMS CRM Lead",
		filters={
			"status": "Assigned",
			"assignment_method": "Round Robin",
			"assigned_on": ["<=", cutoff],
			"accepted_on": ["is", "not set"],
		},
		fields=["name", "lead_owner", "branch", "assigned_team", "model"],
		order_by="assigned_on asc",
		limit_page_length=limit,
	)

	reassigned = []
	failed = []
	for row in leads:
		try:
			doc = frappe.get_doc("DMS CRM Lead", row.name)
			if doc.accepted_on or doc.status != "Assigned":
				continue
			prev = doc.lead_owner
			ok = apply_round_robin(doc, force=True, exclude_user=prev)
			if not ok or doc.lead_owner == prev:
				failed.append({"name": row.name, "reason": "no_next_user"})
				continue
			doc.flags.from_assignment = True
			doc.flags.ignore_permissions = True
			doc.save()
			_notify_assignment(doc, previous=prev, reason="unaccepted_reassign")
			reassigned.append({"name": doc.name, "from": prev, "to": doc.lead_owner})
		except Exception:
			frappe.log_error(title=f"Lead reassign failed: {row.name}")
			failed.append({"name": row.name, "reason": "error"})

	if reassigned or failed:
		frappe.db.commit()
	return {"minutes": minutes, "reassigned": reassigned, "failed": failed}


def _notify_assignment(lead, previous: str | None = None, reason: str = "assign"):
	try:
		from frappe.desk.form.assign_to import _add as assign_to_add

		if previous and previous != lead.lead_owner:
			frappe.db.delete(
				"ToDo",
				{
					"reference_type": "DMS CRM Lead",
					"reference_name": lead.name,
					"allocated_to": previous,
					"status": "Open",
				},
			)
		assign_to_add(
			{
				"assign_to": [lead.lead_owner],
				"doctype": "DMS CRM Lead",
				"name": lead.name,
				"description": f"Lead assigned ({reason})",
				"notify": 1,
			},
			ignore_permissions=True,
		)
	except Exception:
		frappe.log_error(title=f"Lead assignment notify failed: {lead.name}")
