# Copyright (c) 2026, Mania and contributors
"""CRM Activity APIs — dms.crm_api.activities (blueprint §15)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, now_datetime

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)
from dms.customer_relationship_management.doctype.dms_crm_activity.dms_crm_activity import (
	spawn_recurring_occurrence,
)

DOCTYPE = "DMS CRM Activity"


def _apply_payload(doc, payload: dict, *, allow_readonly=False):
	skip = {"assignment_history", "amended_from"}
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML", "Table")
		and df.fieldname not in skip
		and (allow_readonly or not df.read_only)
	}
	for key, value in (payload or {}).items():
		if key in allowed:
			doc.set(key, value)


def _enrich(row: dict) -> dict:
	row["owner_name"] = user_display_name(row.get("assigned_to"))
	row["customer_name"] = customer_display_name(row.get("customer"))
	due = row.get("due_datetime")
	status = row.get("status")
	row["is_overdue"] = bool(
		due
		and status in ("Open", "In Progress")
		and get_datetime(due) < now_datetime()
	)
	return row


@frappe.whitelist()
def get_activities(
	status=None,
	search=None,
	assigned_to=None,
	activity_type=None,
	overdue_only=0,
	mine=0,
	campaign=None,
	limit=50,
	offset=0,
):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	if activity_type and activity_type != "all":
		filters["activity_type"] = activity_type
	if campaign:
		filters["campaign"] = campaign
	if cint(mine):
		filters["assigned_to"] = frappe.session.user
	elif assigned_to:
		filters["assigned_to"] = assigned_to

	or_filters = None
	search = (search or "").strip()
	if search:
		or_filters = [
			["subject", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
		]

	fields = [
		"name",
		"activity_type",
		"subject",
		"status",
		"due_datetime",
		"assigned_to",
		"priority",
		"lead",
		"opportunity",
		"customer",
		"case",
		"campaign",
		"disposition",
		"sla_breached",
		"is_recurring",
		"modified",
	]
	meta = frappe.get_meta(DOCTYPE)
	fields = [f for f in fields if f == "name" or meta.has_field(f)]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by="due_datetime asc, modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	data = [_enrich(dict(r)) for r in rows]
	if cint(overdue_only):
		data = [r for r in data if r.get("is_overdue") or cint(r.get("sla_breached"))]

	# Summary for dashboards
	open_filters = {"status": ["in", ["Open", "In Progress"]]}
	summary = {
		"open": frappe.db.count(DOCTYPE, open_filters),
		"mine_open": frappe.db.count(
			DOCTYPE, {**open_filters, "assigned_to": frappe.session.user}
		),
		"overdue": frappe.db.count(
			DOCTYPE,
			{
				**open_filters,
				"due_datetime": ["<", now_datetime()],
			},
		),
		"breached": frappe.db.count(DOCTYPE, {**open_filters, "sla_breached": 1})
		if meta.has_field("sla_breached")
		else 0,
	}

	return {
		"data": data,
		"summary": summary,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_activity(name):
	ensure_crm_read(DOCTYPE)
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	_enrich(data)
	return data


@frappe.whitelist()
def create_activity(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload or not payload.get("subject"):
		frappe.throw(_("Activity subject is required."))
	doc = frappe.new_doc(DOCTYPE)
	_apply_payload(doc, payload, allow_readonly=True)
	if not doc.assigned_to:
		doc.assigned_to = frappe.session.user
	doc.insert()
	frappe.db.commit()
	return get_activity(doc.name)


@frappe.whitelist()
def update_activity(name, data=None):
	ensure_crm_write(DOCTYPE)
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	_apply_payload(doc, payload)
	doc.save()
	frappe.db.commit()
	return get_activity(doc.name)


@frappe.whitelist()
def complete_activity(name, disposition=None, outcome_notes=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Activity name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	doc.status = "Completed"
	doc.completed_on = now_datetime()
	if disposition:
		doc.disposition = disposition
	if outcome_notes is not None:
		doc.outcome_notes = outcome_notes
	doc.save()
	frappe.db.commit()
	return get_activity(doc.name)


@frappe.whitelist()
def reassign_activity(name, assigned_to=None, reason=None):
	ensure_crm_write(DOCTYPE)
	if not name or not assigned_to:
		frappe.throw(_("Activity and new assignee are required."))
	doc = frappe.get_doc(DOCTYPE, name)
	doc._reassign_reason = reason or "Reassigned via CRM"
	doc.assigned_to = assigned_to
	doc.save()
	frappe.db.commit()
	return get_activity(doc.name)


@frappe.whitelist()
def get_activity_form_options():
	ensure_crm_read(DOCTYPE)
	meta = frappe.get_meta(DOCTYPE)

	def opts(fieldname):
		df = meta.get_field(fieldname)
		if not df or not df.options:
			return []
		return [o for o in df.options.split("\n") if o.strip()]

	return {
		"activity_types": opts("activity_type"),
		"statuses": opts("status"),
		"priorities": opts("priority"),
		"dispositions": opts("disposition"),
		"recurrence_frequencies": opts("recurrence_frequency"),
	}


@frappe.whitelist()
def get_overdue_board(scope="mine", limit=50):
	"""Personal or manager overdue board (§15.2)."""
	ensure_crm_read(DOCTYPE)
	limit, _ = paginate(limit, 0)
	filters = {
		"status": ["in", ["Open", "In Progress"]],
		"due_datetime": ["<", now_datetime()],
	}
	scope = (scope or "mine").strip()
	is_manager = bool(
		set(frappe.get_roles()).intersection({"System Manager", "DMS CRM Manager"})
	) or frappe.session.user == "Administrator"
	if scope == "mine" or (scope == "team" and not is_manager):
		filters["assigned_to"] = frappe.session.user

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		fields=[
			"name",
			"subject",
			"activity_type",
			"due_datetime",
			"assigned_to",
			"priority",
			"customer",
			"lead",
			"opportunity",
			"case",
			"sla_breached",
		],
		order_by="due_datetime asc",
		limit_page_length=limit,
	)
	# Also next-action overdue on leads/opps for manager board
	next_actions = []
	if scope == "team" and is_manager:
		for dt, label_field in (
			("DMS CRM Lead", "lead_name"),
			("DMS CRM Opportunity", "title"),
		):
			if not frappe.db.exists("DocType", dt):
				continue
			na = frappe.get_all(
				dt,
				filters={
					"next_action_due": ["<", now_datetime()],
					"status": ["not in", ["Converted", "Lost", "Unqualified", "Won", "Cancelled", "Closed"]],
				},
				fields=["name", label_field, "next_action", "next_action_due", "status"],
				limit_page_length=30,
			)
			for r in na:
				next_actions.append(
					{
						"doctype": dt,
						"name": r.name,
						"title": r.get(label_field) or r.name,
						"next_action": r.next_action,
						"next_action_due": r.next_action_due,
						"status": r.status,
					}
				)

	return {
		"activities": [_enrich(dict(r)) for r in rows],
		"next_actions": next_actions,
		"can_view_team": is_manager,
	}


def spawn_recurring_activities(limit=200):
	"""Daily: spawn due recurring activity occurrences."""
	if not frappe.db.exists("DocType", DOCTYPE):
		return {"spawned": 0}
	names = frappe.get_all(
		DOCTYPE,
		filters={
			"is_recurring": 1,
			"status": ["!=", "Cancelled"],
			"next_occurrence_on": ["<=", now_datetime()],
		},
		pluck="name",
		limit_page_length=cint(limit) or 200,
	)
	spawned = 0
	for name in names:
		try:
			child = spawn_recurring_occurrence(name)
			if child:
				spawned += 1
		except Exception:
			frappe.log_error(frappe.get_traceback(), f"Recurring activity {name}")
	frappe.db.commit()
	return {"spawned": spawned, "checked": len(names)}


def mark_activity_sla_breaches(limit=500):
	"""Daily: flag open activities past due."""
	names = frappe.get_all(
		DOCTYPE,
		filters={
			"status": ["in", ["Open", "In Progress"]],
			"due_datetime": ["<", now_datetime()],
			"sla_breached": 0,
		},
		pluck="name",
		limit_page_length=cint(limit) or 500,
	)
	for name in names:
		frappe.db.set_value(DOCTYPE, name, "sla_breached", 1, update_modified=False)
	frappe.db.commit()
	return {"updated": len(names)}
