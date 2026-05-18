import frappe
from frappe import _
from frappe.utils import cint

ASSIGNMENT_LOCKED_STATUSES = frozenset({
	"Repair In Progress",
	"Repair Completed",
	"Waiting Parts",
	"Road Test In Progress",
	"Road Test Completed",
	"QC In Progress",
	"QC Failed",
	"Rework",
	"Completed",
	"Delivered",
	"Cancelled",
})


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
		job_warehouse = (data.get("warehouse") or "").strip() or None
		for part in data["parts"]:
			part_warehouse = (part.get("warehouse") or "").strip() or job_warehouse
			doc.append("parts", {
				"item_code": part.get("item_code"),
				"quantity_requested": part.get("quantity_requested", 1),
				"unit_price": part.get("unit_price"),
				"warehouse": part_warehouse,
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

	assignment_fields = {"lead_technician", "assigned_bay", "assistant_technicians"}
	if doc.status in ASSIGNMENT_LOCKED_STATUSES and assignment_fields.intersection(data.keys()):
		frappe.throw(_("Cannot change technician or bay assignment after repair has started."))

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

	if "warehouse" in data and data.get("warehouse"):
		for row in doc.parts or []:
			row.warehouse = data["warehouse"]

	if "assistant_technicians" in data:
		rows = data["assistant_technicians"]
		if isinstance(rows, str):
			import json
			rows = json.loads(rows)
		_apply_assistant_technicians(doc, rows)

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


def _validate_job_card_before_submit(doc):
	"""Same mandatory checks as desk before_submit."""
	missing = []
	if not doc.lead_technician:
		missing.append(_("Lead Technician"))
	if not doc.service_advisor:
		missing.append(_("Service Advisor"))
	if not doc.schedule_start_time:
		missing.append(_("Schedule Start Time"))
	if not doc.schedule_end_time:
		missing.append(_("Schedule End Time"))

	if missing:
		frappe.throw(
			_("Please fill in the following before submitting: {0}").format(", ".join(missing))
		)

	for row in doc.assistant_technicians or []:
		if not row.technician:
			frappe.throw(_("Each Assistant Technician row must have a technician selected."))


def _apply_assistant_technicians(doc, rows):
	doc.set("assistant_technicians", [])
	for row in rows or []:
		if isinstance(row, str):
			import json
			row = json.loads(row)
		technician = (row.get("technician") or "").strip()
		if not technician:
			continue
		doc.append(
			"assistant_technicians",
			{
				"technician": technician,
				"role": row.get("role") or "Assistant",
			},
		)


@frappe.whitelist()
def approve_and_submit_job_card(
	name,
	approval_reference,
	approved_amount=None,
	customer_signature=None,
	schedule_start_time=None,
	schedule_end_time=None,
	lead_technician=None,
	assistant_technicians=None,
):
	"""Customer approval: validate schedule/technicians, save approval fields, submit document."""
	if isinstance(assistant_technicians, str):
		import json
		assistant_technicians = json.loads(assistant_technicians) if assistant_technicians else []

	if not name:
		frappe.throw(_("Job Card name is required"))
	if not (approval_reference or "").strip():
		frappe.throw(_("Approval Reference is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	if doc.docstatus != 0:
		frappe.throw(_("Job Card is already submitted."))

	if schedule_start_time:
		doc.schedule_start_time = schedule_start_time
	if schedule_end_time:
		doc.schedule_end_time = schedule_end_time
	if lead_technician:
		doc.lead_technician = lead_technician
	if assistant_technicians is not None:
		_apply_assistant_technicians(doc, assistant_technicians)

	if customer_signature:
		doc.customer_signature = customer_signature

	if not doc.customer_signature:
		frappe.throw(_("Customer signature is required before approval."))

	doc.customer_approval_status = "Approved"
	doc.approval_reference = approval_reference.strip()
	doc.status = "Estimation Approved"
	if approved_amount not in (None, ""):
		doc.approved_amount = approved_amount

	_validate_job_card_before_submit(doc)

	doc.save()
	doc.submit()
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": doc.status,
		"docstatus": doc.docstatus,
	}


@frappe.whitelist()
def get_road_test_templates():
	"""List active road test templates for the frontend picker."""
	return frappe.get_all(
		"Road Test Template",
		filters={"is_active": 1},
		fields=["name", "template_name", "template_type"],
		order_by="template_name asc",
	)


@frappe.whitelist()
def apply_road_test_template(name, template, force=0):
	"""Populate road_test_results from a Road Test Template (matches desk behaviour)."""
	if isinstance(force, str):
		force = force in ("1", "true", "True")

	if not name:
		frappe.throw(_("Job Card name is required"))
	if not template:
		frappe.throw(_("Road Test Template is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	existing = doc.road_test_results or []
	if existing and not force:
		frappe.throw(
			_("This job card already has road test results. Set force to replace them.")
		)

	template_doc = frappe.get_doc("Road Test Template", template)
	items = template_doc.test_items or []
	if not items:
		frappe.throw(_("This Road Test Template has no test items."))

	doc.road_test_template = template
	doc.set("road_test_results", [])
	for item in items:
		doc.append(
			"road_test_results",
			{
				"test_item": item.test_item,
				"test_description": item.test_item,
				"category": item.category,
				"test_condition": item.test_condition,
				"is_critical": item.is_critical,
				"result": "Pass",
				"tested_by": frappe.session.user,
				"tested_on": frappe.utils.now_datetime(),
			},
		)

	doc.save()
	frappe.db.commit()

	return {"road_test_template": doc.road_test_template, "road_test_results": doc.road_test_results}


def _resolve_qc_check_item_text(check_item_link):
	if not check_item_link:
		return ""
	return (
		frappe.db.get_value("QC Checklist Item Master", check_item_link, "qc_checklist_item")
		or check_item_link
	)


@frappe.whitelist()
def get_qc_checklist_templates():
	"""List active QC checklist templates for the frontend picker."""
	return frappe.get_all(
		"QC Checklist Template",
		filters={"is_active": 1},
		fields=["name", "checklist_name", "checklist_type"],
		order_by="checklist_name asc",
	)


@frappe.whitelist()
def apply_qc_checklist_template(name, template, force=0):
	"""Populate qc_results from a QC Checklist Template (matches desk behaviour)."""
	if isinstance(force, str):
		force = force in ("1", "true", "True")

	if not name:
		frappe.throw(_("Job Card name is required"))
	if not template:
		frappe.throw(_("QC Checklist Template is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	existing = doc.qc_results or []
	if existing and not force:
		frappe.throw(_("This job card already has QC results. Set force to replace them."))

	template_doc = frappe.get_doc("QC Checklist Template", template)
	items = template_doc.checklist_items or []
	if not items:
		frappe.throw(_("This QC Checklist Template has no lines in Checklist Items."))

	doc.qc_checklist_template = template
	doc.set("qc_results", [])
	for item in items:
		req_m = cint(item.requires_measurement)
		doc.append(
			"qc_results",
			{
				"check_item_text": _resolve_qc_check_item_text(item.check_item),
				"category": item.category,
				"is_mandatory": item.is_mandatory,
				"requires_photo": item.requires_photo,
				"requires_measurement": item.requires_measurement,
				"min_value": item.min_value if req_m else None,
				"max_value": item.max_value if req_m else None,
				"result": "Pass",
			},
		)

	doc.save()
	frappe.db.commit()

	return {
		"qc_checklist_template": doc.qc_checklist_template,
		"qc_results": doc.qc_results,
	}


@frappe.whitelist()
def save_qc_results(name, qc_checklist_template=None, results=None):
	"""Save QC template and result rows on a submitted job card."""
	if isinstance(results, str):
		import json
		results = json.loads(results) if results else []

	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	if qc_checklist_template:
		doc.qc_checklist_template = qc_checklist_template

	doc.set("qc_results", [])
	for row in results or []:
		if isinstance(row, str):
			import json
			row = json.loads(row)
		doc.append(
			"qc_results",
			{
				"check_item_text": row.get("check_item_text") or "",
				"category": row.get("category"),
				"is_mandatory": row.get("is_mandatory"),
				"requires_photo": row.get("requires_photo"),
				"requires_measurement": row.get("requires_measurement"),
				"min_value": row.get("min_value"),
				"max_value": row.get("max_value"),
				"result": row.get("result") or "Pass",
				"measurement_value": row.get("measurement_value"),
				"photo": row.get("photo"),
				"notes": row.get("notes") or "",
			},
		)

	doc.save()
	frappe.db.commit()

	return {
		"qc_checklist_template": doc.qc_checklist_template,
		"qc_results": doc.qc_results,
	}


@frappe.whitelist()
def save_road_test_results(name, road_test_template=None, results=None):
	"""Save road test template and result rows on a submitted job card."""
	if isinstance(results, str):
		import json
		results = json.loads(results) if results else []

	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	if road_test_template:
		doc.road_test_template = road_test_template

	doc.set("road_test_results", [])
	for row in results or []:
		if isinstance(row, str):
			import json
			row = json.loads(row)
		doc.append(
			"road_test_results",
			{
				"test_item": row.get("test_item"),
				"test_description": row.get("test_description") or row.get("test_item"),
				"category": row.get("category"),
				"test_condition": row.get("test_condition"),
				"is_critical": row.get("is_critical"),
				"result": row.get("result") or "Pass",
				"observations": row.get("observations") or "",
				"tested_by": row.get("tested_by") or frappe.session.user,
				"tested_on": row.get("tested_on") or frappe.utils.now_datetime(),
			},
		)

	doc.save()
	frappe.db.commit()

	return {"road_test_template": doc.road_test_template, "road_test_results": doc.road_test_results}
