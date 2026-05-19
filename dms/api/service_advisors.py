import frappe
from frappe import _


@frappe.whitelist()
def get_service_advisors(search=None, status=None, limit=100):
	"""List service advisors for DMS UI (optional status filter)."""
	frappe.has_permission("Service Advisor", "read", throw=True)

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
		"Service Advisor",
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
			"workshop",
			"work_shift",
			"date_of_joining",
		],
		limit=int(limit),
		order_by="full_name asc",
	)


@frappe.whitelist()
def get_service_advisor(name):
	if not name:
		frappe.throw(_("Service Advisor name is required"))
	doc = frappe.get_doc("Service Advisor", name)
	doc.check_permission("read")
	return doc.as_dict()
