import frappe
from frappe import _
from frappe.utils import now_datetime


@frappe.whitelist()
def get_appointments(limit=50, offset=0, status=None, date=None, search=None):
	filters = {}
	if status:
		filters["appointment_status"] = status
	if date:
		filters["appointment_date_time"] = ["like", f"{date}%"]

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer_name": ["like", f"%{search}%"],
			"license_plate": ["like", f"%{search}%"],
		}

	total = len(frappe.get_all(
		"Service Appointment",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	appointments = frappe.get_all(
		"Service Appointment",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "booking_source", "appointment_date_time",
			"promised_delivery_date_time", "estimated_duration_hours",
			"priority", "customer", "customer_name", "primary_phone",
			"customer_email", "vehicle", "vin_chassis", "license_plate",
			"current_odometer", "warranty_status",
			"customer_complaint_summary", "preferred_advisor",
			"vehicle_arrival_status", "appointment_status",
			"assigned_service_advisor", "assigned_bay",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="appointment_date_time desc",
	)

	if appointments:
		names = [a.name for a in appointments]
		service_rows = frappe.get_all(
			"Service Type Item",
			filters={
				"parent": ["in", names],
				"parenttype": "Service Appointment",
				"parentfield": "service_type_requested",
			},
			fields=["parent", "service_type", "estimated_hours", "is_urgent"],
			order_by="idx asc",
		)
		by_parent = {}
		for row in service_rows:
			by_parent.setdefault(row.parent, []).append({
				"service_type": row.service_type,
				"estimated_hours": row.estimated_hours,
				"is_urgent": row.is_urgent,
			})
		for apt in appointments:
			apt["service_type_requested"] = by_parent.get(apt.name, [])

	return {"data": appointments, "total": total}


@frappe.whitelist()
def get_appointment(name):
	if not name:
		frappe.throw(_("Appointment name is required"))

	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("read")

	return doc.as_dict()


@frappe.whitelist()
def create_appointment(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	vehicle = data.get("vehicle")
	vin_chassis = data.get("vin_chassis")

	# vehicle links to Item; vin_chassis links to VIN No (often same string as vin_number)
	if vin_chassis:
		if not frappe.db.exists("VIN No", vin_chassis):
			# Legacy: client sent vin_number instead of VIN No doc name
			vin_name = frappe.db.get_value("VIN No", {"vin_number": vin_chassis}, "name")
			if vin_name:
				vin_chassis = vin_name

		if not vehicle or not frappe.db.exists("Item", vehicle):
			linked_item = frappe.db.get_value("VIN No", vin_chassis, "linked_item")
			if linked_item:
				vehicle = linked_item

	if vin_chassis and not vehicle:
		frappe.throw(_("Selected vehicle has no linked model item. Update the VIN record first."))

	doc = frappe.get_doc({
		"doctype": "Service Appointment",
		"booking_source": data.get("booking_source", "Walk-in"),
		"booking_reference": data.get("booking_reference"),
		"appointment_date_time": data.get("appointment_date_time"),
		"promised_delivery_date_time": data.get("promised_delivery_date_time"),
		"estimated_duration_hours": data.get("estimated_duration_hours"),
		"priority": data.get("priority", "Normal"),
		"customer": data.get("customer"),
		"vehicle": vehicle,
		"vin_chassis": vin_chassis,
		"license_plate": data.get("license_plate"),
		"current_odometer": data.get("current_odometer"),
		"customer_complaint_summary": data.get("customer_complaint_summary"),
		"preferred_advisor": data.get("preferred_advisor"),
		"preferred_technician": data.get("preferred_technician"),
		"special_instructions": data.get("special_instructions"),
		"company": data.get("company"),
	})

	if data.get("service_type_requested"):
		for svc in data["service_type_requested"]:
			doc.append("service_type_requested", {
				"service_type": svc.get("service_type"),
				"description": svc.get("description"),
				"estimated_hours": svc.get("estimated_hours"),
				"is_warranty": svc.get("is_warranty"),
			})

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
		"appointment_date_time": str(doc.appointment_date_time),
		"appointment_status": doc.appointment_status,
	}


@frappe.whitelist()
def update_appointment(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("write")

	updatable = [
		"appointment_date_time", "promised_delivery_date_time",
		"estimated_duration_hours", "priority", "customer_complaint_summary",
		"preferred_advisor", "preferred_technician", "special_instructions",
		"assigned_service_advisor", "assigned_bay", "vehicle_arrival_status",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "appointment_status": doc.appointment_status}


@frappe.whitelist()
def submit_appointment(name):
	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "docstatus": doc.docstatus}


@frappe.whitelist()
def mark_arrived(name):
	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("write")
	doc.vehicle_arrival_status = "Arrived"
	doc.arrived_date_time = now_datetime()
	doc.appointment_status = "Arrived"
	doc.save()
	frappe.db.commit()

	return {
		"name": doc.name,
		"appointment_status": doc.appointment_status,
		"arrived_date_time": str(doc.arrived_date_time),
	}
