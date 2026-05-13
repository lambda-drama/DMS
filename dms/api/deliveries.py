import frappe
from frappe import _


@frappe.whitelist()
def get_deliveries(limit=50, offset=0, search=None):
	filters = {}

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer": ["like", f"%{search}%"],
			"vehicle_vin": ["like", f"%{search}%"],
		}

	deliveries = frappe.get_all(
		"Vehicle Delivery Note",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "job_card", "customer",
			"vehicle_vin", "vehicle_model", "license_plate",
			"delivered_by", "delivery_date_time",
			"final_odometer_km", "next_service_due_km",
			"next_service_due_date",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="creation desc",
	)

	return deliveries


@frappe.whitelist()
def get_delivery(name):
	if not name:
		frappe.throw(_("Delivery name is required"))

	doc = frappe.get_doc("Vehicle Delivery Note", name)
	doc.check_permission("read")

	return doc.as_dict()


@frappe.whitelist()
def create_delivery(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc({
		"doctype": "Vehicle Delivery Note",
		"job_card": data.get("job_card"),
		"customer": data.get("customer"),
		"vehicle_vin": data.get("vehicle_vin"),
		"license_plate": data.get("license_plate"),
		"delivery_date": data.get("delivery_date"),
		"delivered_by": data.get("delivered_by"),
		"received_by": data.get("received_by"),
		"received_by_phone": data.get("received_by_phone"),
		"final_odometer_km": data.get("final_odometer_km"),
		"next_service_due_km": data.get("next_service_due_km"),
		"next_service_due_date": data.get("next_service_due_date"),
		"delivery_notes": data.get("delivery_notes"),
		"company": data.get("company"),
	})

	if data.get("checklist_items"):
		for item in data["checklist_items"]:
			doc.append("checklist_items", item)

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"job_card": doc.job_card,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
		"status": doc.status,
	}


@frappe.whitelist()
def update_delivery(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Vehicle Delivery Note", name)
	doc.check_permission("write")

	updatable = [
		"delivery_date", "delivered_by", "received_by",
		"received_by_phone", "final_odometer_km",
		"next_service_due_km", "next_service_due_date",
		"delivery_notes",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def submit_delivery(name):
	doc = frappe.get_doc("Vehicle Delivery Note", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "docstatus": doc.docstatus}
