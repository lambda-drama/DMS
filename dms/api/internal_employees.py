import frappe
from frappe import _


@frappe.whitelist()
def get_internal_employees(search=None, status=None, limit=100):
	"""List DMS internal employees for linking on parts advisors and other DMS screens."""
	frappe.has_permission("DMS Internal Employee", "read", throw=True)

	filters = {}
	if status and status != "all":
		filters["status"] = status

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"full_name": ["like", f"%{search}%"],
			"phone": ["like", f"%{search}%"],
			"email": ["like", f"%{search}%"],
			"employee_code": ["like", f"%{search}%"],
		}

	return frappe.get_all(
		"DMS Internal Employee",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name",
			"full_name",
			"first_name",
			"last_name",
			"email",
			"phone",
			"status",
			"employee",
			"employee_code",
		],
		limit=int(limit),
		order_by="full_name asc",
	)


@frappe.whitelist()
def get_internal_employee(name):
	if not name:
		frappe.throw(_("DMS Internal Employee name is required"))
	doc = frappe.get_doc("DMS Internal Employee", name)
	doc.check_permission("read")
	return doc.as_dict()
