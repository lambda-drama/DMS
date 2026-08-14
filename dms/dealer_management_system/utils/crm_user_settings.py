# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Resolve workspace / Staff Audit access from DMS CRM User Settings."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint

SETTINGS_DOCTYPE = "DMS CRM User Settings"
DETAIL_DOCTYPE = "DMS CRM User Detail"

FULL_ACCESS_ROLES = frozenset({"System Manager", "Dealer Manager"})
DESK_ACCESS_ROLES = frozenset({*FULL_ACCESS_ROLES, "Administrator"})

# Report catalog section id → DMS CRM User Detail checkbox
REPORT_SECTION_FIELDS: dict[str, str] = {
	"executive": "view_executive_report",
	"workshop": "view_workshop",
	"advisor": "view_service_advisor_report",
	"technician": "view_technician_report",
	"parts": "view_parts_and_inventory",
	"warranty": "view_warranty",
	"qc": "view_quality_control",
	"crm": "view_customer_and_crm",
	"finance": "view_finance",
	"compliance": "view_compliance",
}

REPORT_SECTION_FIELDNAMES = tuple(REPORT_SECTION_FIELDS.values())


def _settings_ready() -> bool:
	return bool(
		frappe.db.exists("DocType", SETTINGS_DOCTYPE)
		and frappe.db.exists("DocType", DETAIL_DOCTYPE)
	)


def _detail_meta_fieldnames() -> set[str]:
	if not frappe.db.exists("DocType", DETAIL_DOCTYPE):
		return set()
	return {df.fieldname for df in frappe.get_meta(DETAIL_DOCTYPE).fields}


def _has_full_access(user: str | None = None) -> bool:
	"""Administrator, System Manager, and Dealer Manager bypass CRM User Settings limits."""
	user = user or frappe.session.user
	if not user or user in ("Guest", ""):
		return False
	if user == "Administrator":
		return True
	return bool(FULL_ACCESS_ROLES & set(frappe.get_roles(user)))


def can_open_desk(user: str | None = None) -> bool:
	"""Open Desk in DMS / CRM UI is limited to Dealer Manager, System Manager, Administrator."""
	user = user or frappe.session.user
	if not user or user in ("Guest", ""):
		return False
	if user == "Administrator":
		return True
	return bool(DESK_ACCESS_ROLES & set(frappe.get_roles(user)))


def get_lead_sales_persons() -> list[str]:
	"""Users ticked Lead Sales Person on DMS CRM User Detail — Lead Owner dropdown."""
	if not _settings_ready():
		return []
	if "lead_sales_person" not in _detail_meta_fieldnames():
		return []
	rows = frappe.get_all(
		DETAIL_DOCTYPE,
		filters={
			"parent": SETTINGS_DOCTYPE,
			"parenttype": SETTINGS_DOCTYPE,
			"lead_sales_person": 1,
			"user": ["not in", ["", "Guest"]],
		},
		pluck="user",
	)
	# Keep only enabled system users, preserve listing order uniqueness
	seen: set[str] = set()
	out: list[str] = []
	for name in rows:
		if not name or name in seen:
			continue
		if not frappe.db.get_value("User", name, "enabled"):
			continue
		seen.add(name)
		out.append(name)
	return out


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

	available = _detail_meta_fieldnames()
	fields = ["user", "access_limited_to", "can_view_dms_dashboard", "can_view_dms_report"]
	for fieldname in REPORT_SECTION_FIELDNAMES:
		if fieldname in available:
			fields.append(fieldname)

	rows = frappe.get_all(
		DETAIL_DOCTYPE,
		filters={"parent": SETTINGS_DOCTYPE, "parenttype": SETTINGS_DOCTYPE, "user": user},
		fields=fields,
		limit_page_length=1,
	)
	return rows[0] if rows else None


def can_view_dms_dashboard(user: str | None = None) -> bool:
	"""
	Home Dashboard access.
	Dealer Manager / System Manager / Administrator always allowed.
	Listed users need Can View DMS Dashboard checked.
	"""
	if _has_full_access(user):
		return True
	row = get_user_access_row(user)
	if not row:
		return False
	return bool(cint(row.get("can_view_dms_dashboard")))


def can_view_dms_report(user: str | None = None) -> bool:
	"""
	DMS Reports master switch (+ Net Revenue on dashboard).
	Dealer Manager / System Manager / Administrator always allowed.
	Listed users need Can View DMS Report checked.
	"""
	if _has_full_access(user):
		return True
	row = get_user_access_row(user)
	if not row:
		return False
	return bool(cint(row.get("can_view_dms_report")))


def get_allowed_dms_report_sections(user: str | None = None) -> list[str] | None:
	"""
	Allowed DMS report section ids.

	Returns:
	- None → all sections (full-access roles, or master report flag with no section boxes)
	- [] → no report sections
	- list → only those section ids
	"""
	if _has_full_access(user):
		return None

	if not can_view_dms_report(user):
		return []

	row = get_user_access_row(user)
	if not row:
		return []

	available = _detail_meta_fieldnames()
	selected: list[str] = []
	for section_id, fieldname in REPORT_SECTION_FIELDS.items():
		if fieldname not in available:
			continue
		if cint(row.get(fieldname)):
			selected.append(section_id)

	# Master flag on + no section boxes → all reports
	if not selected:
		return None
	return selected


def can_view_dms_report_section(section_id: str, user: str | None = None) -> bool:
	"""Whether the user may open a specific report section (e.g. finance)."""
	section_id = (section_id or "").strip()
	if not section_id:
		return False
	if not can_view_dms_report(user):
		return False
	allowed = get_allowed_dms_report_sections(user)
	if allowed is None:
		return True
	return section_id in allowed


def get_workspace_access(user: str | None = None) -> dict:
	"""
	Workspace + Staff Audit flags for the session user.

	- listed: user appears in DMS CRM User Settings
	- can_view_staff_audit: listed, or Administrator / System Manager / Dealer Manager
	- access_limited_to: '' | 'DMS' | 'CRM'
	- can_access_dms / can_access_crm: based on access_limited_to when listed;
	  unlisted users keep both workspaces; System Manager / Dealer Manager / Administrator always both
	- can_view_dms_dashboard / can_view_dms_report: see helpers above
	- allowed_dms_report_sections: null = all, [] = none, else section ids
	"""
	user = user or frappe.session.user
	allowed_sections = get_allowed_dms_report_sections(user)

	if _has_full_access(user):
		return {
			"listed": True,
			"access_limited_to": "",
			"can_access_dms": True,
			"can_access_crm": True,
			"can_view_staff_audit": True,
			"can_switch_workspace": True,
			"can_view_dms_dashboard": True,
			"can_view_dms_report": True,
			"allowed_dms_report_sections": None,
			"can_open_desk": True,
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
			"can_view_dms_dashboard": False,
			"can_view_dms_report": False,
			"allowed_dms_report_sections": [],
			"can_open_desk": can_open_desk(user),
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
		"can_view_dms_dashboard": bool(cint(row.get("can_view_dms_dashboard"))),
		"can_view_dms_report": bool(cint(row.get("can_view_dms_report"))),
		"allowed_dms_report_sections": allowed_sections,
		"can_open_desk": can_open_desk(user),
	}


def can_view_staff_audit(user: str | None = None) -> bool:
	return bool(get_workspace_access(user).get("can_view_staff_audit"))


def require_staff_audit_access(user: str | None = None):
	if not can_view_staff_audit(user):
		frappe.throw(
			_("Only System Manager, Dealer Manager, or users listed in DMS CRM User Settings may view Staff Audit."),
			frappe.PermissionError,
		)


def require_dms_dashboard_access(user: str | None = None):
	if not can_view_dms_dashboard(user):
		frappe.throw(_("Not permitted to view the DMS Dashboard."), frappe.PermissionError)


def require_dms_report_access(user: str | None = None):
	if not can_view_dms_report(user):
		frappe.throw(_("Not permitted to view DMS Reports."), frappe.PermissionError)


def require_dms_report_section_access(section_id: str, user: str | None = None):
	require_dms_report_access(user)
	section_id = (section_id or "").strip()
	if not can_view_dms_report_section(section_id, user):
		frappe.throw(
			_("Not permitted to view the {0} report section.").format(section_id or _("selected")),
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
