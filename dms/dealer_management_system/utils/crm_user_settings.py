# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Resolve workspace / Staff Audit access from DMS CRM User Settings."""

from __future__ import annotations

import frappe
from frappe import _

SETTINGS_DOCTYPE = "DMS CRM User Settings"
DETAIL_DOCTYPE = "DMS CRM User Detail"

FULL_ACCESS_ROLES = frozenset({"System Manager", "Dealer Manager"})


def _settings_ready() -> bool:
	return bool(
		frappe.db.exists("DocType", SETTINGS_DOCTYPE)
		and frappe.db.exists("DocType", DETAIL_DOCTYPE)
	)


def _has_full_access(user: str | None = None) -> bool:
	"""Administrator and System Manager bypass CRM User Settings limits."""
	user = user or frappe.session.user
	if not user or user in ("Guest", ""):
		return False
	if user == "Administrator":
		return True
	return bool(FULL_ACCESS_ROLES & set(frappe.get_roles(user)))


def get_audited_users() -> list[str]:
	"""Users whose activity appears in Staff Audit (DMS CRM User Settings child table)."""
	if not _settings_ready():
		return []
	rows = frappe.get_all(
		DETAIL_DOCTYPE,
		filters={
			"parent": SETTINGS_DOCTYPE,
			"parenttype": SETTINGS_DOCTYPE,
			"user": ["not in", ["", "Guest", "Administrator"]],
		},
		pluck="user",
	)
	# Preserve order uniqueness
	seen = set()
	out = []
	for u in rows:
		if u and u not in seen:
			seen.add(u)
			out.append(u)
	return out


def get_user_access_row(user: str | None = None) -> dict | None:
	"""Return the child-table row for user, or None if not listed."""
	user = user or frappe.session.user
	if not user or user in ("Guest", ""):
		return None
	if not _settings_ready():
		return None

	rows = frappe.get_all(
		DETAIL_DOCTYPE,
		filters={"parent": SETTINGS_DOCTYPE, "parenttype": SETTINGS_DOCTYPE, "user": user},
		fields=["user", "access_limited_to"],
		limit_page_length=1,
	)
	return rows[0] if rows else None


def get_workspace_access(user: str | None = None) -> dict:
	"""
	Workspace + Staff Audit flags for the session user.

	- listed: user appears in DMS CRM User Settings
	- can_view_staff_audit: listed, or Administrator / System Manager / Dealer Manager
	- access_limited_to: '' | 'DMS' | 'CRM'
	- can_access_dms / can_access_crm: based on access_limited_to when listed;
	  unlisted users keep both workspaces; System Manager / Dealer Manager / Administrator always both
	"""
	user = user or frappe.session.user
	if _has_full_access(user):
		return {
			"listed": True,
			"access_limited_to": "",
			"can_access_dms": True,
			"can_access_crm": True,
			"can_view_staff_audit": True,
			"can_switch_workspace": True,
		}

	row = get_user_access_row(user)
	if not row:
		return {
			"listed": False,
			"access_limited_to": "",
			"can_access_dms": True,
			"can_access_crm": True,
			"can_view_staff_audit": False,
			"can_switch_workspace": True,
		}

	limited = (row.get("access_limited_to") or "").strip()
	can_dms = limited != "CRM"
	can_crm = limited != "DMS"
	return {
		"listed": True,
		"access_limited_to": limited,
		"can_access_dms": can_dms,
		"can_access_crm": can_crm,
		"can_view_staff_audit": True,
		"can_switch_workspace": can_dms and can_crm,
	}


def can_view_staff_audit(user: str | None = None) -> bool:
	return bool(get_workspace_access(user).get("can_view_staff_audit"))


def require_staff_audit_access(user: str | None = None):
	if not can_view_staff_audit(user):
		frappe.throw(
			_("Only System Manager, Dealer Manager, or users listed in DMS CRM User Settings may view Staff Audit."),
			frappe.PermissionError,
		)


def require_workspace_access(workspace: str, user: str | None = None):
	"""workspace is 'dms' or 'crm'."""
	access = get_workspace_access(user)
	ws = (workspace or "").strip().lower()
	if ws == "crm" and not access["can_access_crm"]:
		frappe.throw(_("Your access is limited to DMS."), frappe.PermissionError)
	if ws == "dms" and not access["can_access_dms"]:
		frappe.throw(_("Your access is limited to CRM."), frappe.PermissionError)
