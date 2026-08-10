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


@frappe.whitelist()
def update_parts_advisor(name, data):
	"""Update editable Parts Advisor master fields from DMS UI."""
	if isinstance(data, str):
		import json

		data = json.loads(data)

	if not name:
		frappe.throw(_("Parts Advisor name is required"))

	doc = frappe.get_doc("Parts Advisor", name)
	doc.check_permission("write")

	updatable = [
		"first_name",
		"last_name",
		"phone",
		"email",
		"status",
		"date_of_joining",
		"internal_employee",
	]
	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()
	return {
		"name": doc.name,
		"full_name": doc.get("full_name") or doc.name,
		"status": doc.get("status"),
	}
