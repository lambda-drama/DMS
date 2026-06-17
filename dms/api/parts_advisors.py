import frappe
from frappe import _


@frappe.whitelist()
def get_parts_advisors(search=None, status=None, limit=100):
	"""List parts advisors for DMS UI."""
	frappe.has_permission("Parts Advisor", "read", throw=True)

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
		}

	return frappe.get_all(
		"Parts Advisor",
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
			"advisor_code",
			"internal_employee",
			"employee_id",
			"date_of_joining",
		],
		limit=int(limit),
		order_by="full_name asc",
	)


@frappe.whitelist()
def get_parts_advisor(name):
	if not name:
		frappe.throw(_("Parts Advisor name is required"))
	doc = frappe.get_doc("Parts Advisor", name)
	doc.check_permission("read")
	return doc.as_dict()
