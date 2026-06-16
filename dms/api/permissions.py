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
	"deliveries": "Vehicle Delivery Note",
	"customers": "Customer",
	"vehicles": "VIN No",
	"invoices": "Sales Invoice",
	"stock-entry": "Stock Entry",
	"stock-reconciliation": "Stock Reconciliation",
	"purchase-receipt": "Purchase Receipt",
	"dashboard": None,
	"reports": None,
	"settings": None,
}

# Views backed by a DocType (excludes dashboard / reports / settings)
DOCTYPE_VIEWS = tuple(v for v, dt in DMS_VIEW_DOCTYPES.items() if dt)


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

	dashboard_visible = any(out.get(v, {}).get("visible") for v in DOCTYPE_VIEWS)
	reports_visible = any(out.get(v, {}).get("report") for v in DOCTYPE_VIEWS)

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
	}

	out["settings"] = {
		"doctype": None,
		"visible": True,
		"read": 1,
		"write": 1,
		"create": 0,
		"delete": 0,
	}

	return out
