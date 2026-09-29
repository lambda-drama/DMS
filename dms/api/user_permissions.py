"""DMS CRM User Settings management API — User Permission master page."""

import json

import frappe
from frappe import _

SETTINGS = "DMS CRM User Settings"
SECTION_FIELDS = {
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


def _get_settings():
	if not frappe.db.exists(SETTINGS):
		doc = frappe.new_doc(SETTINGS)
		doc.insert(ignore_permissions=True)
		return doc
	return frappe.get_doc(SETTINGS)


def _parse(data):
	if isinstance(data, str):
		data = json.loads(data) if data else {}
	return data or {}


@frappe.whitelist()
def get_user_permission_settings():
	doc = _get_settings()
	rows = []
	for row in doc.get("dms_crm_user") or []:
		r = {
			"name": row.name,
			"user": row.user,
			"full_name": frappe.db.get_value("User", row.user, "full_name") or row.user,
			"access_limited_to": row.access_limited_to or "",
			"can_edit_price": int(row.can_edit_price or 0),
			"can_view_dms_dashboard": int(row.can_view_dms_dashboard or 0),
			"can_view_dms_report": int(row.can_view_dms_report or 0),
			"lead_sales_person": int(row.lead_sales_person or 0),
		}
		for f in SECTION_FIELDS.values():
			r[f] = int(getattr(row, f, 0) or 0)
		rows.append(r)

	users = [
		{"user": u.user, "full_name": frappe.db.get_value("User", u.user, "full_name") or u.user}
		for u in (doc.get("users") or [])
		if u.user
	]
	from dms.dealer_management_system.utils.branch_permissions import (
		ensure_branch_company_field,
		list_user_branch_permission_rows,
	)

	ensure_branch_company_field()
	branch_permissions = list_user_branch_permission_rows()
	available_branches = []
	try:
		from dms.api.branches import list_branches

		available_branches = list_branches(limit=500).get("data") or []
	except frappe.PermissionError:
		available_branches = []
	return {
		"permission_rows": rows,
		"whitelisted_users": users,
		"branch_permissions": branch_permissions,
		"available_branches": available_branches,
	}


@frappe.whitelist()
def save_user_permission(data):
	data = _parse(data)
	user = (data.get("user") or "").strip()
	if not user:
		frappe.throw(_("User is required."))
	if not frappe.db.exists("User", user):
		frappe.throw(_("User {0} does not exist.").format(frappe.bold(user)))

	doc = _get_settings()
	doc.check_permission("write")

	whitelisted = {u.user for u in doc.get("users") or [] if u.user}
	if user not in whitelisted:
		frappe.throw(
			_("User {0} is not in the whitelist.").format(frappe.bold(user)), title=_("Not whitelisted")
		)

	row = None
	row_name = (data.get("name") or "").strip()
	for r in doc.get("dms_crm_user") or []:
		if row_name and r.name == row_name:
			row = r
			break
		if r.user == user:
			row = r
			break
	if row is None:
		row = doc.append("dms_crm_user", {"user": user})

	row.user = user
	row.access_limited_to = (data.get("access_limited_to") or "").strip()
	row.can_edit_price = 1 if data.get("can_edit_price") else 0
	row.can_view_dms_dashboard = 1 if data.get("can_view_dms_dashboard") else 0
	row.can_view_dms_report = 1 if data.get("can_view_dms_report") else 0
	row.lead_sales_person = 1 if data.get("lead_sales_person") else 0
	for f in SECTION_FIELDS.values():
		setattr(row, f, 1 if data.get(f) else 0)

	doc.save()
	frappe.db.commit()
	return {"ok": True, "name": row.name, "user": row.user}


@frappe.whitelist()
def delete_user_permission(name):
	if not name:
		frappe.throw(_("Row name is required."))
	doc = _get_settings()
	doc.check_permission("write")
	for r in list(doc.get("dms_crm_user") or []):
		if r.name == name:
			doc.get("dms_crm_user").remove(r)
			break
	doc.save()
	frappe.db.commit()
	return {"ok": True}


@frappe.whitelist()
def save_branch_user_permission(data):
	"""Create a Frappe User Permission (Allow = Branch) for a whitelisted user."""
	data = _parse(data)
	user = (data.get("user") or "").strip()
	branch = (data.get("branch") or "").strip()
	if not user:
		frappe.throw(_("User is required."))
	if not branch:
		frappe.throw(_("Branch is required."))

	doc = _get_settings()
	doc.check_permission("write")
	whitelisted = {u.user for u in doc.get("users") or [] if u.user}
	if user not in whitelisted:
		frappe.throw(
			_("User {0} is not in the whitelist.").format(frappe.bold(user)), title=_("Not whitelisted")
		)

	from dms.dealer_management_system.utils.branch_permissions import add_user_branch_permission

	name = add_user_branch_permission(user, branch)
	frappe.db.commit()
	return {"ok": True, "name": name, "user": user, "branch": branch}


@frappe.whitelist()
def delete_branch_user_permission(name):
	"""Remove a Frappe User Permission that restricted a user to a Branch."""
	if not name:
		frappe.throw(_("User Permission is required."))
	_get_settings().check_permission("write")
	from dms.dealer_management_system.utils.branch_permissions import delete_user_branch_permission

	delete_user_branch_permission(name)
	frappe.db.commit()
	return {"ok": True}
