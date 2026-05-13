import frappe
from frappe import _


@frappe.whitelist()
def get_job_cards(limit=50, offset=0, status=None, customer=None, search=None):
	filters = {}
	if status:
		filters["status"] = status
	if customer:
		filters["customer"] = customer

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer_name": ["like", f"%{search}%"],
			"license_plate": ["like", f"%{search}%"],
			"vehicle_model": ["like", f"%{search}%"],
		}

	total = len(frappe.get_all(
		"DMS Job Card",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	job_cards = frappe.get_all(
		"DMS Job Card",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "status", "job_card_type", "posting_date",
			"customer", "customer_name", "customer_mobile",
			"vehicle_vin", "vehicle_model", "license_plate",
			"current_odometer", "priority", "service_advisor",
			"lead_technician", "assigned_bay",
			"estimated_duration_hours", "actual_duration_hours",
			"total_labor_cost", "total_parts_cost", "total_amount",
			"customer_approval_status", "payment_status",
			"promised_delivery_date_time", "opened_date_time",
			"completed_date_time", "invoice", "docstatus",
			"creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="creation desc",
	)

	return {"data": job_cards, "total": total}


@frappe.whitelist()
def get_job_card(name):
	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("read")

	return doc.as_dict()


@frappe.whitelist()
def create_job_card(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc({
		"doctype": "DMS Job Card",
		"job_card_type": data.get("job_card_type"),
		"customer": data.get("customer"),
		"vehicle_vin": data.get("vehicle_vin"),
		"license_plate": data.get("license_plate"),
		"current_odometer": data.get("current_odometer"),
		"priority": data.get("priority", "Normal"),
		"service_advisor": data.get("service_advisor"),
		"lead_technician": data.get("lead_technician"),
		"assigned_bay": data.get("assigned_bay"),
		"workshop": data.get("workshop"),
		"warehouse": data.get("warehouse"),
		"company": data.get("company"),
		"estimated_duration_hours": data.get("estimated_duration_hours"),
		"promised_delivery_date_time": data.get("promised_delivery_date_time"),
		"appointment": data.get("appointment"),
		"inspection": data.get("inspection"),
		"warranty_status": data.get("warranty_status"),
		"warranty_expiry_date": data.get("warranty_expiry_date"),
		"warranty_application_type": data.get("warranty_application_type"),
		"customer_complaint_summary": data.get("customer_complaint_summary"),
		"service_advisor_notes": data.get("service_advisor_notes"),
		"internal_notes": data.get("internal_notes"),
		"schedule_start_time": data.get("schedule_start_time"),
		"schedule_end_time": data.get("schedule_end_time"),
	})

	if data.get("job_items"):
		for item in data["job_items"]:
			doc.append("job_items", {
				"complaint_description": item.get("complaint_description"),
				"symptom_category": item.get("symptom_category"),
				"severity": item.get("severity"),
				"labor_operation": item.get("labor_operation"),
			})

	if data.get("labour"):
		for line in data["labour"]:
			doc.append("labour", {
				"vehicle_service_item": line.get("vehicle_service_item"),
				"technician": line.get("technician"),
				"estimated_hours": line.get("estimated_hours"),
				"rate_per_hour": line.get("rate_per_hour"),
				"complaint": line.get("complaint"),
			})

	if data.get("parts"):
		for part in data["parts"]:
			doc.append("parts", {
				"item_code": part.get("item_code"),
				"quantity_requested": part.get("quantity_requested", 1),
				"unit_price": part.get("unit_price"),
			})

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": doc.status,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
	}


@frappe.whitelist()
def update_job_card(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	updatable_fields = [
		"priority", "service_advisor", "lead_technician", "assigned_bay",
		"estimated_duration_hours", "promised_delivery_date_time",
		"warranty_status", "warranty_expiry_date", "warranty_application_type",
		"customer_complaint_summary", "service_advisor_notes", "internal_notes",
		"schedule_start_time", "schedule_end_time", "workshop", "warehouse",
	]

	for field in updatable_fields:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def submit_job_card(name):
	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status, "docstatus": doc.docstatus}
