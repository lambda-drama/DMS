import frappe
from frappe import _
from frappe.utils import cint, flt

def _resolve_job_card_currency(currency=None, company=None) -> str:
	"""Default ETB; fall back to company default currency when currency not sent."""
	cur = (currency or "").strip()
	if not cur and company:
		cur = (frappe.db.get_value("Company", company, "default_currency") or "").strip()
	if not cur:
		cur = "ETB"
	if not frappe.db.exists("Currency", cur):
		frappe.throw(_("Currency {0} is not defined in ERPNext.").format(frappe.bold(cur)))
	return cur


def _sync_workshop_warehouse_from_bay(doc, bay_name=None):
	"""Set workshop + warehouse from the service bay's linked WorkShop."""
	bay = (bay_name or getattr(doc, "assigned_bay", None) or "").strip()
	if not bay:
		return

	workshop = frappe.db.get_value("Service Bay", bay, "branch")
	if not workshop:
		return

	doc.workshop = workshop
	warehouse = frappe.db.get_value("WorkShop", workshop, "warehouse")
	if not warehouse:
		return

	company = getattr(doc, "company", None)
	if company:
		wh_company = frappe.db.get_value("Warehouse", warehouse, "company")
		if wh_company and wh_company != company:
			return

	doc.warehouse = warehouse


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


JOB_CARD_FILTER_PRESETS = {
	"active": [
		"Estimation Pending",
		"Estimation Approved",
		"Waiting Customer Approval",
		"Scheduled",
		"Repair In Progress",
		"Repair Completed",
		"Waiting Parts",
		"Road Test In Progress",
		"Road Test Completed",
		"QC In Progress",
		"QC Failed",
		"Rework",
	],
	"qc": ["QC In Progress", "QC Failed"],
}


@frappe.whitelist()
def get_job_cards(limit=50, offset=0, status=None, filter=None, customer=None, search=None):
	filters = {}
	if status:
		filters["status"] = status
	elif filter and filter in JOB_CARD_FILTER_PRESETS:
		filters["status"] = ["in", JOB_CARD_FILTER_PRESETS[filter]]
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
			"name", "status", "job_card_type", "posting_date", "company", "currency",
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

	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
		repair_session_start_ms,
	)

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("read")

	data = doc.as_dict()
	# Always read time logs from DB — rows may be inserted via start_repair db_insert.
	data["time_logs"] = frappe.get_all(
		"DMS Job Card Time Log",
		filters={"parent": name},
		fields=[
			"name",
			"technician",
			"start_time",
			"end_time",
			"duration_hours",
			"pause_reason",
			"job_item",
			"notes",
		],
		order_by="idx asc",
	)

	for row in data.get("time_logs") or []:
		if row.get("start_time"):
			row["start_time"] = str(row["start_time"])
		if row.get("end_time"):
			row["end_time"] = str(row["end_time"])
		if row.get("technician") and not row.get("technician_name"):
			row["technician_name"] = frappe.db.get_value(
				"Technician", row["technician"], "full_name"
			) or row["technician"]

	session_ms = repair_session_start_ms(data.get("time_logs"))
	data["repair_session_start_ms"] = session_ms

	if data.get("assigned_bay") and not (data.get("warehouse") or "").strip():
		_sync_workshop_warehouse_from_bay(doc, data.get("assigned_bay"))
		if doc.warehouse:
			frappe.db.set_value(
				"DMS Job Card",
				name,
				{"workshop": doc.workshop, "warehouse": doc.warehouse},
				update_modified=False,
			)
			data["workshop"] = doc.workshop
			data["warehouse"] = doc.warehouse

	from dms.dealer_management_system.doctype.dms_parts_request.parts_workflow import (
		list_parts_requests_for_job_card,
	)

	data["parts_requests"] = list_parts_requests_for_job_card(name)

	return data


@frappe.whitelist()
def create_job_card(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	company = (data.get("company") or "").strip() or None
	currency = _resolve_job_card_currency(data.get("currency"), company)

	doc = frappe.get_doc({
		"doctype": "DMS Job Card",
		"job_card_type": data.get("job_card_type"),
		"company": company,
		"currency": currency,
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

	from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
		apply_discount_fields_from_payload,
	)

	apply_discount_fields_from_payload(doc, data)
	if (
		data.get("discount_amount") is not None
		and not data.get("labour_discount")
		and not data.get("parts_discount")
		and not data.get("labour_discount_type")
		and not data.get("parts_discount_type")
		and flt(data.get("discount_amount")) > 0
	):
		doc.parts_discount_type = "Amount"
		doc.parts_discount_value = flt(data.get("discount_amount"))

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

	if data.get("assigned_bay"):
		_sync_workshop_warehouse_from_bay(doc, data.get("assigned_bay"))

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
		prepare_internal_job_card,
	)

	if is_internal_job_card(doc):
		prepare_internal_job_card(doc)

	doc.insert()
	frappe.db.commit()

	result = {
		"name": doc.name,
		"status": doc.status,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
	}

	if is_internal_job_card(doc):
		from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
			bootstrap_internal_job_card_to_repair,
		)

		boot = bootstrap_internal_job_card_to_repair(doc.name)
		result["status"] = boot["status"]
		result["repair_started"] = boot.get("repair_started")

	return result


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
		"discount_amount",
		"labour_discount_type",
		"labour_discount_value",
		"parts_discount_type",
		"parts_discount_value",
	]

	for field in updatable_fields:
		if field in data:
			doc.set(field, data[field])

	from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
		apply_discount_fields_from_payload,
	)

	if any(k in data for k in ("labour_discount", "parts_discount")):
		apply_discount_fields_from_payload(doc, data)

	if "currency" in data:
		doc.currency = _resolve_job_card_currency(
			data.get("currency"), doc.company or data.get("company")
		)

	if "warehouse" in data and data.get("warehouse"):
		for row in doc.parts or []:
			row.warehouse = data["warehouse"]

	if "assistant_technicians" in data:
		rows = data["assistant_technicians"]
		if isinstance(rows, str):
			import json
			rows = json.loads(rows)
		_apply_assistant_technicians(doc, rows)

	if "assigned_bay" in data:
		_sync_workshop_warehouse_from_bay(doc, data.get("assigned_bay"))

	doc.save()
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": doc.status,
		"workshop": doc.workshop,
		"warehouse": doc.warehouse,
	}


@frappe.whitelist()
def submit_job_card(name):
	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("submit")

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
		prepare_internal_job_card,
	)

	if is_internal_job_card(doc):
		prepare_internal_job_card(doc)
		doc.save()

	doc.submit()

	if is_internal_job_card(doc):
		from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
			bootstrap_internal_job_card_to_repair,
		)

		bootstrap_internal_job_card_to_repair(doc.name)
		doc.reload()
	else:
		frappe.db.commit()
		return {"name": doc.name, "status": doc.status, "docstatus": doc.docstatus}

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
		fields=["name", "template_name", "template_type", "is_default"],
		order_by="is_default desc, template_name asc",
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
		fields=["name", "checklist_name", "checklist_type", "is_default"],
		order_by="is_default desc, checklist_name asc",
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


@frappe.whitelist()
def pass_job_card_qc(name):
	"""Pass QC and complete the job card. Internal jobs also create a Material Issue."""
	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		complete_internal_job_card,
		is_internal_job_card,
	)

	if is_internal_job_card(doc):
		return complete_internal_job_card(doc)

	doc.qc_result = "Pass"
	doc.qc_checked_date = frappe.utils.now_datetime()
	doc.status = "Completed"
	doc.flags.ignore_validate_update_after_submit = True
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"status": doc.status, "material_issue": doc.material_issue}
