import frappe
from frappe import _


@frappe.whitelist()
def get_inspections(limit=50, offset=0, customer=None, date=None, search=None):
	filters = {}
	if customer:
		filters["customer"] = customer
	if date:
		filters["inspection_date"] = ["like", f"{date}%"]

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer": ["like", f"%{search}%"],
			"license_plate": ["like", f"%{search}%"],
		}

	total = len(frappe.get_all(
		"Vehicle Inspection",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	inspections = frappe.get_all(
		"Vehicle Inspection",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "customer", "vin_chassis",
			"license_plate", "model_year", "inspection_date",
			"service_advisor", "customer_vehicle",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="inspection_date desc",
	)

	return {"data": inspections, "total": total}


@frappe.whitelist()
def get_inspection(name):
	if not name:
		frappe.throw(_("Inspection name is required"))

	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("read")

	return doc.as_dict()


@frappe.whitelist()
def create_inspection(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc({
		"doctype": "Vehicle Inspection",
		"customer": data.get("customer"),
		"vehicle_vin": data.get("vehicle_vin"),
		"license_plate": data.get("license_plate"),
		"current_odometer": data.get("current_odometer"),
		"inspection_date": data.get("inspection_date"),
		"inspector": data.get("inspector"),
		"appointment": data.get("appointment"),
		"fuel_level": data.get("fuel_level"),
		"customer_concerns": data.get("customer_concerns"),
		"company": data.get("company"),
	})

	for table_field in [
		"exterior_items", "interior_items", "underbody_items",
		"engine_bay_items", "tire_items", "warning_lights",
	]:
		if data.get(table_field):
			for row in data[table_field]:
				doc.append(table_field, row)

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
		"inspection_date": str(doc.inspection_date),
	}


@frappe.whitelist()
def update_inspection(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("write")

	updatable = [
		"inspector", "fuel_level", "overall_condition",
		"customer_concerns", "inspector_notes",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()

	return {"name": doc.name}


@frappe.whitelist()
def submit_inspection(name):
	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "docstatus": doc.docstatus}
