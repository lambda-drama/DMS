"""DMS UI permissions — mirrors Frappe DocPerm / role permissions for the frontend."""

import frappe
from frappe.permissions import get_role_permissions
from frappe.utils import cint

# UI view id -> DocType (None = computed separately)
DMS_VIEW_DOCTYPES: dict[str, str | None] = {
	"appointments": "Service Appointment",
	"inspections": "Vehicle Inspection",
	"service-estimates": "DMS Service Estimate",
	"job-cards": "DMS Job Card",
	"parts-requisitions": "DMS Parts Request",
	"technicians": "Technician",
	"service-advisors": "Service Advisor",
	"parts-advisors": "Parts Advisor",
	"spare-parts": "Spare Part",
	"vehicle-services": "Vehicle Service Item",
	"item-prices": "Item Price",
	"job-card-terms": "DMS Job Card Terms",
	"sales-invoice-tc": "DMS Sales Invoice TC",
	"user-permissions": "DMS CRM User Settings",
	"advanced-permissions": None,
	"deliveries": "Vehicle Delivery Note",
	"customers": "Customer",
	"vehicles": "VIN No",
	"invoices": "Sales Invoice",
	"follow-ups": "Customer Follow Up",
	"stock-entry": "Stock Entry",
	"stock-reconciliation": "Stock Reconciliation",
	"material-request": "Material Request",
	"purchase-receipt": "Purchase Receipt",
	"spare-part-sales": "Sales Invoice",
	"proforma-invoices": "Sales Order",
	"inventory-dashboard": "Stock Entry",
	"dashboard": None,
	"reports": None,
	"settings": None,
}

DMS_MANAGEMENT_VIEW_ROLES = frozenset({"Dealer Manager", "System Manager", "Administrator"})


def has_management_view_role(user: str | None = None) -> bool:
	"""Dashboard and Reports are limited to dealer / system / admin roles."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	if user == "Administrator":
		return True
	return bool(DMS_MANAGEMENT_VIEW_ROLES.intersection(frappe.get_roles(user)))


DMS_NAV_HIDE_FIELDS = {
	"stock-entry": "hide_stock_entry",
	"stock-reconciliation": "hide_stock_reconciliation",
	"material-request": "hide_material_request",
	"pending-material-requests": "hide_material_request",
	"purchase-receipt": "hide_purchase_receipt",
}


def _flags_for_doctype(doctype: str, user: str | None = None) -> dict:
	meta = frappe.get_meta(doctype)
	perms = get_role_permissions(meta, user=user)

	read = cint(perms.get("read", 0))
	select = cint(perms.get("select", 0))

	return {
		"doctype": doctype,
		"select": select,
		"read": read,
		"write": cint(perms.get("write", 0)),
		"create": cint(perms.get("create", 0)),
		"delete": cint(perms.get("delete", 0)),
		"submit": cint(perms.get("submit", 0)),
		"cancel": cint(perms.get("cancel", 0)),
		"report": cint(perms.get("report", 0)),
		"export": cint(perms.get("export", 0)),
		"visible": bool(read or select),
	}


def _apply_dms_nav_visibility(out: dict) -> dict:
	"""Hide Master screens when toggled on DMS Settings."""
	try:
		settings = frappe.get_single("DMS Settings")
		meta = frappe.get_meta("DMS Settings")
	except Exception:
		return out

	for view, fieldname in DMS_NAV_HIDE_FIELDS.items():
		module = out.get(view)
		if not module or not meta.has_field(fieldname):
			continue
		if not cint(getattr(settings, fieldname, 0)):
			continue
		module["visible"] = False
		module["read"] = 0
		module["select"] = 0
		module["create"] = 0
		module["write"] = 0
		module["submit"] = 0
		module["cancel"] = 0
		module["delete"] = 0
	return out


@frappe.whitelist()
def get_dms_ui_permissions():
	"""
	Return permission flags per DMS UI module for the current session user.
	Used to show/hide nav items and create/edit actions like Desk.
	"""
	user = frappe.session.user
	if not user or user == "Guest":
		return {}

	out: dict[str, dict] = {}

	for view, doctype in DMS_VIEW_DOCTYPES.items():
		if not doctype:
			continue
		out[view] = _flags_for_doctype(doctype, user)

	management_access = has_management_view_role(user)

	from dms.dealer_management_system.utils.crm_user_settings import (
		can_view_dms_dashboard,
		can_view_dms_report,
		get_allowed_dms_report_sections,
	)

	dashboard_visible = can_view_dms_dashboard(user)
	reports_visible = can_view_dms_report(user)
	allowed_report_sections = get_allowed_dms_report_sections(user)

	out["dashboard"] = {
		"doctype": None,
		"visible": dashboard_visible,
		"read": int(dashboard_visible),
		"select": 0,
		"write": 0,
		"create": 0,
		"delete": 0,
		"submit": 0,
	}

	out["reports"] = {
		"doctype": None,
		"visible": reports_visible,
		"read": int(reports_visible),
		"select": 0,
		"report": int(reports_visible),
		"write": 0,
		"create": 0,
		"allowed_sections": allowed_report_sections,
	}

	out["settings"] = {
		"doctype": None,
		"visible": management_access,
		"read": int(management_access),
		"write": int(management_access),
		"create": 0,
		"delete": 0,
	}

	out["advanced-permissions"] = {
		"doctype": None,
		"visible": management_access,
		"read": int(management_access),
		"write": int(management_access),
		"create": 0,
		"delete": 0,
	}

	from dms.dealer_management_system.utils.price_permissions import can_edit_price

	out["can_edit_price"] = {
		"doctype": None,
		"visible": int(can_edit_price(user)),
		"read": int(can_edit_price(user)),
		"write": int(can_edit_price(user)),
		"create": 0,
		"delete": 0,
	}

	return _apply_dms_nav_visibility(out)
