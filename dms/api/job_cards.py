import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.api.utils import LIST_ORDER_LATEST_CREATED, add_branch_filter, resolve_dms_customer

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
	"qc_failed": ["QC Failed", "Rework"],
}


@frappe.whitelist()
def get_job_cards(limit=50, offset=0, status=None, filter=None, customer=None, search=None):
	from frappe.utils import now_datetime

	filters = {}
	if status:
		filters["status"] = status
	elif filter == "overdue":
		filters["status"] = ["in", JOB_CARD_FILTER_PRESETS["active"]]
		filters["promised_delivery_date_time"] = ["<", now_datetime()]
	elif filter and filter in JOB_CARD_FILTER_PRESETS:
		filters["status"] = ["in", JOB_CARD_FILTER_PRESETS[filter]]
	else:
		# Default list: hide cancelled so they stay out of the active queue
		filters["status"] = ["!=", "Cancelled"]
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

	filters = add_branch_filter(filters, doctype="DMS Job Card")

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
			"is_repeat_repair", "repeat_repair_reference",
			"amended_from",
			"creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)

	_attach_job_card_amendment_flags(job_cards)
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
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		never_requested_part_row_names,
	)

	data["parts_requests"] = list_parts_requests_for_job_card(name)
	never_requested = never_requested_part_row_names(data.get("parts") or [])
	for part in data.get("parts") or []:
		part["never_requested"] = part.get("name") in never_requested

	data["workshop_assigned"] = bool(
		(data.get("lead_technician") or "").strip() and (data.get("assigned_bay") or "").strip()
	)
	# Legacy rows used Assigned as a workflow status — normalize on read.
	if cint(data.get("docstatus")) == 2:
		data["status"] = "Cancelled"
	elif (data.get("status") or "").strip() == "Assigned":
		data["status"] = "Estimation Approved" if data.get("docstatus") == 1 else "Open"

	eligibility = _get_repeat_repair_eligibility(name, doc=doc)
	data["repeat_repair_eligible"] = eligibility.get("eligible")
	data["repeat_repair_eligibility"] = eligibility
	# Synthetic for UI — JC stores complaints on job_items, not a summary field.
	data["customer_complaint_summary"] = _job_card_complaint_text(doc)
	_attach_qc_section_classification(data.get("qc_results") or [], data.get("qc_checklist_template"))
	_attach_job_card_amendment_flags([data])
	_attach_original_stage_reuse(data, doc=doc)

	return data


def _get_after_repair_probation_days() -> int:
	return cint(frappe.db.get_single_value("DMS Settings", "after_repair_probation_period") or 0)


def _job_card_closure_date(jc):
	"""Best date for comeback window: delivery → completed → modified."""
	from frappe.utils import getdate

	for field in ("delivery_date_time", "completed_date_time", "modified"):
		val = jc.get(field) if hasattr(jc, "get") else None
		if val:
			return getdate(val)
	return None


def _get_repeat_repair_eligibility(source_job_card, doc=None):
	"""Whether a linked repeat job can be created from this completed/delivered JC."""
	from frappe.utils import date_diff, getdate, today

	name = (source_job_card or "").strip()
	if not name:
		return {"eligible": False, "reason": _("Job Card is required.")}

	jc = doc or frappe.get_doc("DMS Job Card", name)
	status = (jc.status or "").strip()
	probation_days = _get_after_repair_probation_days()

	result = {
		"eligible": False,
		"probation_days": probation_days,
		"source_status": status,
		"closure_date": None,
		"days_since_closure": None,
		"days_remaining": None,
		"reason": "",
	}

	if status not in ("Completed", "Delivered"):
		result["reason"] = _("Only Completed or Delivered job cards can start a repeat job.")
		return result

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
	)

	if is_internal_job_card(jc):
		result["reason"] = _("Internal job cards cannot start a customer repeat job.")
		return result

	if probation_days <= 0:
		result["reason"] = _(
			"Set After Repair Probation Period (Days) on DMS Settings before creating repeat jobs."
		)
		return result

	closure = _job_card_closure_date(jc)
	if not closure:
		result["reason"] = _("No completion/delivery date found on this job card.")
		return result

	days_since = date_diff(getdate(today()), getdate(closure))
	days_remaining = probation_days - days_since
	result["closure_date"] = str(getdate(closure))
	result["days_since_closure"] = days_since
	result["days_remaining"] = days_remaining

	if days_since < 0:
		result["reason"] = _("Closure date is in the future.")
		return result

	if days_since > probation_days:
		result["reason"] = _(
			"Comeback window expired ({0} days after repair; probation is {1} days)."
		).format(days_since, probation_days)
		return result

	result["eligible"] = True
	result["reason"] = _("Within probation period ({0} day(s) remaining).").format(
		max(0, days_remaining)
	)
	return result


@frappe.whitelist()
def get_repeat_repair_eligibility(source_job_card):
	return _get_repeat_repair_eligibility(source_job_card)


def _job_card_complaint_text(jc) -> str:
	"""Build complaint text from job items (JC has no customer_complaint_summary field)."""
	parts = []
	for item in jc.get("job_items") or []:
		desc = (getattr(item, "complaint_description", None) or "").strip()
		if desc:
			# Strip simple HTML if Text Editor was used
			if "<" in desc:
				from frappe.utils import strip_html

				desc = strip_html(desc).strip()
			if desc:
				parts.append(desc)
	if parts:
		return "\n".join(parts)
	notes = (getattr(jc, "service_advisor_notes", None) or "").strip()
	if notes and "<" in notes:
		from frappe.utils import strip_html

		notes = strip_html(notes).strip()
	return notes or ""


def _parse_child_line_list(value):
	"""Accept list, JSON string, or None for labour/parts payloads from the client."""
	if value is None or value == "":
		return []
	if isinstance(value, str):
		import json

		value = value.strip()
		if not value or value in ("null", "undefined"):
			return []
		try:
			value = json.loads(value)
		except Exception:
			frappe.throw(_("Invalid labour/parts payload."))
	if isinstance(value, dict):
		return [value]
	if isinstance(value, (list, tuple)):
		return list(value)
	return []


@frappe.whitelist()
def create_repeat_job_card(source_job_card, customer_complaint_summary=None, labour=None, parts=None):
	"""
	Create a new Open job card linked to a Completed/Delivered one (comeback).
	Same VIN; complaint may match or differ. Warranty/billing left for the user.
	Optional labour / parts lines seed the Services and Parts tables on create.
	"""
	from frappe.utils import today

	source_name = (source_job_card or "").strip()
	if not source_name:
		frappe.throw(_("Source Job Card is required."))

	frappe.has_permission("DMS Job Card", "create", throw=True)
	frappe.has_permission("DMS Job Card", "read", source_name, throw=True)

	labour = _parse_child_line_list(labour)
	parts = _parse_child_line_list(parts)

	source = frappe.get_doc("DMS Job Card", source_name)
	eligibility = _get_repeat_repair_eligibility(source_name, doc=source)
	if not eligibility.get("eligible"):
		frappe.throw(eligibility.get("reason") or _("Not eligible for repeat repair."))

	complaint = (customer_complaint_summary or "").strip()
	if not complaint:
		complaint = _job_card_complaint_text(source)
	if not complaint:
		complaint = _("Repeat repair / comeback for {0}").format(source_name)

	advisor_notes = _("Repeat job linked to {0}").format(source_name)
	if complaint:
		advisor_notes = f"{advisor_notes}\n\n{complaint}"

	doc = frappe.get_doc({
		"doctype": "DMS Job Card",
		"job_card_type": source.job_card_type or "Repair",
		"posting_date": today(),
		"company": source.company,
		"currency": source.currency,
		"customer": source.customer,
		"vehicle_vin": source.vehicle_vin,
		"license_plate": source.license_plate,
		"current_odometer": source.current_odometer,
		"priority": "Comeback/Repeat Repair",
		"is_repeat_repair": 1,
		"repeat_repair_reference": source_name,
		"service_advisor": source.service_advisor,
		"workshop": source.workshop,
		"warehouse": source.warehouse,
		"warranty_status": source.warranty_status,
		# Leave billing/warranty application for the user on the new card.
		"warranty_application_type": "",
		"skip_vehicle_inspection": 1,
		"status": "Open",
		"service_advisor_notes": advisor_notes,
		"terms": source.terms,
		"terms_and_conditions": source.terms_and_conditions,
	})

	# Prefer an explicit complaint row when the user typed one in the dialog.
	user_complaint = (customer_complaint_summary or "").strip()
	if user_complaint:
		doc.append("job_items", {
			"complaint_description": user_complaint,
			"severity": "3 - Moderate",
		})
	else:
		for item in source.get("job_items") or []:
			desc = (getattr(item, "complaint_description", None) or "").strip()
			if not desc:
				continue
			doc.append("job_items", {
				"complaint_description": desc,
				"symptom_category": item.symptom_category,
				"severity": item.severity,
				"labor_operation": item.labor_operation,
			})

	if not doc.job_items:
		doc.append("job_items", {
			"complaint_description": complaint,
			"severity": "3 - Moderate",
		})

	for line in labour:
		_append_labour_line_payload(doc, line, default_complaint=complaint)

	job_warehouse = (source.warehouse or "").strip() or None
	for part in parts:
		_append_part_line_payload(doc, part, default_warehouse=job_warehouse)

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": doc.status,
		"is_repeat_repair": 1,
		"repeat_repair_reference": source_name,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
		"vehicle_vin": doc.vehicle_vin,
		"labour_count": len(doc.labour or []),
		"parts_count": len(doc.parts or []),
	}


_ADD_LABOUR_ALLOWED_STATUSES = frozenset(
	{
		"Open",
		"Assigned",
		"Estimation Approved",
		"Repair In Progress",
		"Waiting Parts",
		"Waiting Customer Approval",
		"Rework",
	}
)


def _labour_service_name(vehicle_service_item: str) -> str:
	vsi = (vehicle_service_item or "").strip()
	if not vsi:
		return ""
	name = frappe.db.get_value("Vehicle Service Item", vsi, "service_item") or ""
	code = ""
	meta = frappe.get_meta("Vehicle Service Item")
	if meta.has_field("custom_service_code"):
		code = frappe.db.get_value("Vehicle Service Item", vsi, "custom_service_code") or ""
	if meta.has_field("custom_item_name"):
		custom_name = frappe.db.get_value("Vehicle Service Item", vsi, "custom_item_name") or ""
		if custom_name:
			name = custom_name
	name = (name or vsi).strip()
	code = (code or "").strip()
	if code and name and code != name:
		return f"{code}: {name}"
	return name or code


def _append_labour_line_payload(doc, line, default_complaint=None):
	"""Append one Vehicle Labour Item row from a dict payload."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_estimated_hours,
		vehicle_service_item_labour_rate,
	)

	if isinstance(line, str):
		return None

	vsi = (line.get("vehicle_service_item") or "").strip()
	if not vsi:
		return None
	if not frappe.db.exists("Vehicle Service Item", vsi):
		frappe.throw(_("Vehicle Service Item {0} does not exist.").format(vsi))

	hours = flt(line.get("estimated_hours"))
	if hours <= 0:
		hours = vehicle_service_item_estimated_hours(vsi) or 1.0

	rate = flt(line.get("rate_per_hour"))
	if rate <= 0:
		rate = vehicle_service_item_labour_rate(vsi)

	complaint = (line.get("complaint") or "").strip() or (default_complaint or "")
	technician = (line.get("technician") or "").strip() or None
	service_name = (line.get("service_name") or "").strip() or _labour_service_name(vsi)

	doc.append(
		"labour",
		{
			"vehicle_service_item": vsi,
			"service_name": service_name,
			"technician": technician,
			"estimated_hours": hours,
			"rate_per_hour": rate,
			"complaint": complaint,
			"notes": (line.get("notes") or "").strip() or None,
			"is_warranty": 1 if line.get("is_warranty") else 0,
		},
	)
	return doc.labour[-1]


def _append_part_line_payload(doc, part, default_warehouse=None):
	"""Append one Job Card Part Item row from a dict payload."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		spare_part_default_selling_price,
	)

	if isinstance(part, str):
		return None

	item_code = (part.get("item_code") or "").strip()
	if not item_code:
		return None
	if not frappe.db.exists("Spare Part", item_code):
		frappe.throw(_("Spare Part {0} does not exist.").format(item_code))

	qty = flt(part.get("quantity_requested") or part.get("quantity") or 1)
	if qty <= 0:
		frappe.throw(_("Part quantity must be greater than zero."))

	price = flt(part.get("unit_price"))
	if price <= 0:
		price = spare_part_default_selling_price(item_code)

	bin_location = (part.get("bin_location") or "").strip()
	if not bin_location:
		bin_location = frappe.db.get_value("Spare Part", item_code, "bin_location") or ""

	warehouse = (part.get("warehouse") or "").strip() or (default_warehouse or None)

	doc.append(
		"parts",
		{
			"item_code": item_code,
			"quantity_requested": qty,
			"unit_price": price,
			"bin_location": bin_location,
			"warehouse": warehouse,
			"total_amount": round(qty * price, 2),
			"line_status": "Requested",
			"notes": (part.get("notes") or "").strip() or None,
			"is_warranty": 1 if part.get("is_warranty") else 0,
		},
	)
	return doc.parts[-1]


@frappe.whitelist()
def add_labour_line_to_job_card(
	job_card,
	vehicle_service_item,
	estimated_hours=None,
	rate_per_hour=None,
	technician=None,
	complaint=None,
	notes=None,
	is_warranty=0,
):
	"""Add a service/labour line to an open job card (same window as add extra part)."""
	vsi = (vehicle_service_item or "").strip()
	if not vsi:
		frappe.throw(_("Vehicle Service Item is required."))

	jc_name = (job_card or "").strip()
	if not jc_name:
		frappe.throw(_("Job Card is required."))

	jc = frappe.get_doc("DMS Job Card", jc_name)
	jc.check_permission("write")

	from dms.dealer_management_system.utils.price_permissions import (
		assert_price_allowed_if_changed,
	)
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_labour_rate,
	)

	default_rate = vehicle_service_item_labour_rate(vsi) if rate_per_hour is not None else 0
	assert_price_allowed_if_changed(default_rate, rate_per_hour)

	if jc.status not in _ADD_LABOUR_ALLOWED_STATUSES:
		frappe.throw(
			_("Cannot add labour when job card status is {0}.").format(jc.status or _("Unknown"))
		)

	if jc.invoice:
		frappe.throw(_("Cannot add labour after an invoice has been created."))

	row = _append_labour_line_payload(
		jc,
		{
			"vehicle_service_item": vsi,
			"estimated_hours": estimated_hours,
			"rate_per_hour": rate_per_hour,
			"technician": technician,
			"complaint": complaint,
			"notes": notes,
			"is_warranty": is_warranty,
		},
		default_complaint=_job_card_complaint_text(jc),
	)
	if not row:
		frappe.throw(_("Could not add labour line."))

	jc.flags.ignore_validate_update_after_submit = True
	if hasattr(jc, "calculate_costing_and_totals"):
		jc.calculate_costing_and_totals()
	jc.save(ignore_permissions=True)
	frappe.db.commit()

	return {
		"job_card": jc.name,
		"labour_row": row.name,
		"vehicle_service_item": row.vehicle_service_item,
		"service_name": row.service_name,
		"estimated_hours": row.estimated_hours,
		"rate_per_hour": row.rate_per_hour,
		"amount": row.amount,
		"total_labor_cost": jc.total_labor_cost,
		"total_amount": jc.total_amount,
		"net_amount": getattr(jc, "net_amount", None),
	}


@frappe.whitelist()
def create_job_card(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	company = (data.get("company") or "").strip() or None
	currency = _resolve_job_card_currency(data.get("currency"), company)

	posting_date = data.get("posting_date") or None

	doc = frappe.get_doc({
		"doctype": "DMS Job Card",
		"job_card_type": data.get("job_card_type"),
		"posting_date": posting_date,
		"company": company,
		"currency": currency,
		"customer": resolve_dms_customer(data.get("customer")),
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
		"skip_vehicle_inspection": 1 if data.get("skip_vehicle_inspection") else 0,
		"inspection": data.get("inspection"),
		"warranty_status": data.get("warranty_status"),
		"warranty_expiry_date": data.get("warranty_expiry_date"),
		"warranty_application_type": data.get("warranty_application_type"),
		"service_advisor_notes": data.get("service_advisor_notes"),
		"internal_notes": data.get("internal_notes"),
		"terms": data.get("terms"),
		"terms_and_conditions": data.get("terms_and_conditions"),
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
	else:
		summary = (data.get("customer_complaint_summary") or "").strip()
		if summary:
			doc.append("job_items", {
				"complaint_description": summary,
				"severity": "3 - Moderate",
			})
			if not (data.get("service_advisor_notes") or "").strip():
				doc.service_advisor_notes = summary

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
			part_code = part.get("item_code")
			bin_location = (part.get("bin_location") or "").strip()
			if not bin_location and part_code:
				bin_location = frappe.db.get_value("Spare Part", part_code, "bin_location") or ""
			doc.append("parts", {
				"item_code": part_code,
				"quantity_requested": part.get("quantity_requested", 1),
				"unit_price": part.get("unit_price"),
				"bin_location": bin_location,
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

	# Persist UI odometer even if DocType fetch_from still overwrites on insert
	# (before migrate picks up fetch_if_empty).
	odo = data.get("current_odometer")
	if odo is not None and odo != "":
		odo = cint(odo)
		if odo >= 0 and cint(doc.current_odometer or 0) != odo:
			frappe.db.set_value(
				"DMS Job Card", doc.name, "current_odometer", odo, update_modified=False
			)
			doc.current_odometer = odo
		doc.sync_vin_odometer_from_job_card()

	frappe.db.commit()

	result = {
		"name": doc.name,
		"status": doc.status,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
		"current_odometer": doc.current_odometer,
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
		"posting_date",
		"priority", "service_advisor", "lead_technician", "assigned_bay",
		"estimated_duration_hours", "promised_delivery_date_time",
		"warranty_status", "warranty_expiry_date", "warranty_application_type",
		"service_advisor_notes", "internal_notes",
		"terms", "terms_and_conditions",
		"schedule_start_time", "schedule_end_time", "workshop", "warehouse",
		"current_odometer",
		"license_plate",
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


def _qc_section_map_from_template(template_name):
	if not template_name or not frappe.db.exists("QC Checklist Template", template_name):
		return {}
	template = frappe.get_doc("QC Checklist Template", template_name)
	mapping = {}
	for item in template.checklist_items or []:
		text = _resolve_qc_check_item_text(item.check_item)
		section = item.get("section_classification") or ""
		if text and section:
			mapping[text] = section
	return mapping


def _attach_qc_section_classification(qc_results, template_name):
	"""Fill missing section_classification from the template so existing job cards group correctly."""
	if not qc_results:
		return qc_results
	mapping = _qc_section_map_from_template(template_name)
	if not mapping:
		return qc_results
	for row in qc_results:
		if row.get("section_classification"):
			continue
		text = row.get("check_item_text") or ""
		if text in mapping:
			row["section_classification"] = mapping[text]
	return qc_results


def _qc_result_dict_from_template_item(item):
	req_m = cint(item.requires_measurement)
	return {
		"check_item_text": _resolve_qc_check_item_text(item.check_item),
		"category": item.category,
		"section_classification": item.get("section_classification") or "",
		"is_mandatory": item.is_mandatory,
		"requires_photo": item.requires_photo,
		"requires_measurement": item.requires_measurement,
		"min_value": item.min_value if req_m else None,
		"max_value": item.max_value if req_m else None,
		"result": "Pass",
	}


def _serialize_qc_results(doc):
	results = [row.as_dict() for row in (doc.qc_results or [])]
	_attach_qc_section_classification(results, doc.qc_checklist_template)
	return results


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
		doc.append("qc_results", _qc_result_dict_from_template_item(item))

	doc.save()
	frappe.db.commit()

	return {
		"qc_checklist_template": doc.qc_checklist_template,
		"qc_results": _serialize_qc_results(doc),
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
				"section_classification": row.get("section_classification") or "",
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
		"qc_results": _serialize_qc_results(doc),
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


def _cancel_incomplete_parts_requests_for_job_card(job_card: str):
	"""Mark all outstanding parts requests for a job card as Cancelled.

	Used when a job card is completed — any in-progress parts requests are no longer needed.
	Issued / Received requests are also marked Cancelled since the parts were already moved
	to the job card and are considered consumed.
	"""
	from dms.dealer_management_system.doctype.dms_parts_request.parts_workflow import (
		_CANCELLABLE_PARTS_REQUEST_STATUSES,
		cancel_parts_request,
	)

	# Cancellable (before issue) — release job card part lines
	open_prs = frappe.get_all(
		"DMS Parts Request",
		filters={
			"job_card": job_card,
			"status": ["in", list(_CANCELLABLE_PARTS_REQUEST_STATUSES)],
		},
		pluck="name",
	)
	for pr_name in open_prs:
		try:
			cancel_parts_request(pr_name)
		except Exception:
			frappe.log_error(frappe.get_traceback(), "complete_job_card cancel parts request")

	# Issued / Received requests — stock already transferred to the job, just mark cancelled
	issued_prs = frappe.get_all(
		"DMS Parts Request",
		filters={
			"job_card": job_card,
			"status": ["in", ["Issued", "Received", "Partially Issued"]],
		},
		pluck="name",
	)
	for pr_name in issued_prs:
		frappe.db.set_value(
			"DMS Parts Request",
			pr_name,
			"status",
			"Cancelled",
			update_modified=True,
		)


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
	if not doc.get("qc_started_at"):
		doc.qc_started_at = doc.qc_checked_date
	doc.status = "Completed"
	doc.flags.ignore_validate_update_after_submit = True
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	_cancel_incomplete_parts_requests_for_job_card(doc.name)
	return {"status": doc.status, "material_issue": doc.material_issue}


@frappe.whitelist()
def start_job_card_qc(name):
	"""Move job card into QC and stamp qc_started_at (§2.3 TAT)."""
	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")
	now = frappe.utils.now_datetime()
	doc.status = "QC In Progress"
	if not doc.get("qc_started_at"):
		doc.qc_started_at = now
	doc.flags.ignore_validate_update_after_submit = True
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"status": doc.status, "qc_started_at": str(doc.qc_started_at)}


def _apply_job_card_cancel_reason(doc, reason):
	if not reason:
		return
	note = (doc.internal_notes or "").strip()
	cancel_note = _("Cancelled: {0}").format(reason)
	doc.internal_notes = f"{note}\n{cancel_note}".strip() if note else cancel_note


@frappe.whitelist()
def cancel_job_card(name, reason=None):
	"""Cancel a saved job card at any point so it can be filtered out (no delete).

	Submitted cards use standard Frappe cancel (docstatus 2) in addition to
	status=Cancelled. Drafts only change status. Linked stock transfers from
	parts issue / WIP / material issue are reversed first.
	"""
	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
		log_job_card_status_change,
		reverse_job_card_cancel_side_effects,
	)
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		get_active_job_card_invoice,
	)

	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	if not (doc.has_permission("write") or doc.has_permission("cancel")):
		frappe.throw(_("Not permitted to cancel this Job Card"))

	if cint(doc.docstatus) == 2:
		frappe.throw(_("Job card is already cancelled."))
	if doc.status == "Delivered":
		frappe.throw(_("Job card is already {0}.").format(doc.status))
	# status=Cancelled but still submitted: finish with standard cancel below.
	if doc.status == "Cancelled" and cint(doc.docstatus) != 1:
		frappe.throw(_("Job card is already {0}.").format(doc.status))

	reason = (reason or "").strip()
	prev = doc.status

	cancelled_stock = reverse_job_card_cancel_side_effects(doc.name)

	active_inv = get_active_job_card_invoice(doc.name)
	if active_inv and cint(frappe.db.get_value("Sales Invoice", active_inv, "docstatus")) == 1:
		frappe.throw(
			_("Cancel Sales Invoice {0} first, then cancel this job card.").format(
				frappe.bold(active_inv)
			)
		)

	if cint(doc.docstatus) == 1:
		# Reload after side-effect writes so cancel does not hit a timestamp mismatch.
		doc = frappe.get_doc("DMS Job Card", doc.name)
		_apply_job_card_cancel_reason(doc, reason)
		doc.status = "Cancelled"
		doc.flags.cancel_reason = reason or None
		# Existing DMS cancel was write-based; cancel perm may not be synced on all sites.
		doc.flags.ignore_permissions = True
		doc.flags.skip_cancel_side_effects = True
		doc.cancel()
	else:
		updates = {"status": "Cancelled"}
		if reason:
			note = (doc.internal_notes or "").strip()
			cancel_note = _("Cancelled: {0}").format(reason)
			updates["internal_notes"] = f"{note}\n{cancel_note}".strip() if note else cancel_note
		frappe.db.set_value("DMS Job Card", doc.name, updates, update_modified=True)
		log_job_card_status_change(doc.name, "Cancelled", previous_status=prev, notes=reason or None)

	frappe.db.commit()
	doc.reload()
	return {
		"name": doc.name,
		"status": doc.status,
		"docstatus": doc.docstatus,
		"cancelled_stock_entries": cancelled_stock,
	}


def _attach_job_card_amendment_flags(rows):
	"""Mark cancelled cards that already have an official Amend (amended_from)."""
	if not rows:
		return
	names = [row.get("name") for row in rows if row.get("name")]
	amended_as_map = {}
	if names:
		for link in frappe.get_all(
			"DMS Job Card",
			filters={"amended_from": ["in", names]},
			fields=["name", "amended_from"],
		):
			amended_as_map.setdefault(link.amended_from, link.name)
	for row in rows:
		amended_as = amended_as_map.get(row.get("name"))
		row["already_amended"] = 1 if amended_as else 0
		row["amended_as"] = amended_as or None


def _reset_copied_job_card_runtime_fields(doc, source_name, *, as_amend=False):
	"""Turn a copied cancelled job card into a fresh draft (Amend or New Version)."""
	from frappe.utils import now_datetime, today

	doc.name = None
	doc.docstatus = 0
	# Amend keeps the Frappe link; New Version is an independent copy.
	doc.amended_from = source_name if as_amend else None
	# Both Amend and New Version remember the cancelled source for stage reuse.
	if doc.meta.has_field("original_job_card"):
		doc.original_job_card = source_name
	# Amend reopens work; New Version starts as a fresh draft.
	doc.status = "Open" if as_amend else "Draft"
	doc.posting_date = today()
	doc.opened_date_time = now_datetime()

	for field, value in (
		("completed_date_time", None),
		("technician_assigned_at", None),
		("repair_started_at", None),
		("qc_started_at", None),
		("invoiced_at", None),
		("delivery_date_time", None),
		("invoice", None),
		("material_issue", None),
		("wip_material_transfer", None),
		("payment_status", "Unpaid"),
		("payment_reference", None),
		("customer_approval_status", "Pending"),
		("approval_reference", None),
		("approval_attachment", None),
		("approved_amount", None),
		("customer_signature", None),
		("delivered_to", None),
		("delivered_to_phone", None),
		("final_odometer", None),
		("qc_result", None),
		("qc_fail_reason", None),
		("qc_inspector", None),
		("qc_checked_date", None),
		("rt_result", None),
		("road_test_note", None),
		("rework_required", 0),
		("actual_duration_hours", None),
		("total_hours", None),
		("release_blocked", 0),
		("release_block_reason", None),
		("reason_for_stop", None),
		("customer_satisfaction", None),
	):
		if doc.meta.has_field(field):
			doc.set(field, value)

	for table in ("time_logs", "status_log", "qc_results", "road_test_results"):
		if doc.meta.has_field(table):
			doc.set(table, [])

	part_meta = frappe.get_meta("Job Card Part Item")
	for row in doc.get("parts") or []:
		for field, value in (
			("quantity_issued", 0),
			("quantity_returned", 0),
			("line_status", "Requested"),
			("parts_request", None),
			("material_request", None),
			("is_backordered", 0),
			("backorder_eta", None),
			("backorder_quantity", 0),
			("old_part_received", 0),
			("old_part_photo", None),
			("stock_available", None),
		):
			if part_meta.has_field(field):
				row.set(field, value)

	labour_meta = frappe.get_meta("Vehicle Labour Item")
	for row in doc.get("labour") or []:
		if labour_meta.has_field("actual_hours"):
			row.set("actual_hours", None)
		if labour_meta.has_field("line_status"):
			row.set("line_status", "Open")

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
		prepare_internal_job_card,
	)

	if is_internal_job_card(doc):
		prepare_internal_job_card(doc)


def _copy_cancelled_job_card(name, *, as_amend: bool):
	"""Copy a cancelled job card into a new draft.

	Amend (as_amend=True): Frappe amendment — sets amended_from, one per source.
	New Version: independent copy (new series name), allowed even after Amend.
	"""
	from frappe.model.document import copy_doc

	source_name = (name or "").strip()
	if not source_name:
		frappe.throw(_("Job Card name is required"))

	source = frappe.get_doc("DMS Job Card", source_name)
	source.check_permission("read")
	frappe.has_permission("DMS Job Card", "create", throw=True)

	if (source.status or "").strip() != "Cancelled" and cint(source.docstatus) != 2:
		if as_amend:
			frappe.throw(_("Only cancelled job cards can be amended."))
		frappe.throw(_("Only cancelled job cards can create a New Version."))

	if as_amend:
		existing = frappe.db.exists("DMS Job Card", {"amended_from": source_name})
		if existing:
			frappe.throw(
				_("This job card is already amended as {0}.").format(frappe.bold(existing))
			)

	new_doc = copy_doc(source, ignore_no_copy=True)
	_reset_copied_job_card_runtime_fields(new_doc, source_name, as_amend=as_amend)
	new_doc.insert()
	frappe.db.commit()

	return {
		"name": new_doc.name,
		"status": new_doc.status,
		"amended_from": new_doc.amended_from,
		"original_job_card": new_doc.get("original_job_card") or source_name,
		"customer": new_doc.customer,
		"customer_name": new_doc.customer_name,
	}


@frappe.whitelist()
def amend_job_card(name):
	"""Frappe-style Amend: new draft linked via amended_from (one per cancelled card)."""
	return _copy_cancelled_job_card(name, as_amend=True)


@frappe.whitelist()
def create_job_card_new_version(name):
	"""Independent duplicate of a cancelled job card (new naming-series name)."""
	return _copy_cancelled_job_card(name, as_amend=False)


_ORIGINAL_STAGES = ("customer_approval", "repair", "road_test", "qc")
_CHILD_COPY_SKIP = {
	"name",
	"owner",
	"creation",
	"modified",
	"modified_by",
	"parent",
	"parentfield",
	"parenttype",
	"idx",
	"docstatus",
}
_LAYOUT_FIELDTYPES = {
	"Section Break",
	"Column Break",
	"Tab Break",
	"HTML",
	"Heading",
	"Fold",
}


def _resolve_original_job_card_name(doc) -> str:
	return (doc.get("original_job_card") or doc.get("amended_from") or "").strip()


def _copy_child_table(target, source, table_field, extra_skip=None):
	"""Copy a child table's data fields onto target (new row names)."""
	skip = set(_CHILD_COPY_SKIP)
	if extra_skip:
		skip.update(extra_skip)

	target.set(table_field, [])
	rows = source.get(table_field) or []
	if not rows:
		return

	df = target.meta.get_field(table_field)
	if not df or not df.options:
		return

	meta = frappe.get_meta(df.options)
	copyable = [
		field.fieldname
		for field in meta.fields
		if field.fieldname not in skip and field.fieldtype not in _LAYOUT_FIELDTYPES
	]
	for row in rows:
		payload = {}
		for fieldname in copyable:
			payload[fieldname] = row.get(fieldname) if isinstance(row, dict) else row.get(fieldname)
		target.append(table_field, payload)


def _copy_labour_actuals(target, source):
	labour_meta = frappe.get_meta("Vehicle Labour Item")
	src_rows = list(source.get("labour") or [])
	for idx, row in enumerate(target.get("labour") or []):
		if idx >= len(src_rows):
			break
		src = src_rows[idx]
		if labour_meta.has_field("actual_hours"):
			row.actual_hours = src.get("actual_hours") if isinstance(src, dict) else src.actual_hours
		if labour_meta.has_field("line_status"):
			row.line_status = src.get("line_status") if isinstance(src, dict) else src.line_status


def _copy_approval_fields(target, source):
	for field in (
		"customer_approval_status",
		"approval_reference",
		"approval_attachment",
		"approved_amount",
		"customer_signature",
		"schedule_start_time",
		"schedule_end_time",
	):
		if not target.meta.has_field(field):
			continue
		value = source.get(field)
		if value not in (None, ""):
			target.set(field, value)

	if target.meta.has_field("lead_technician") and source.get("lead_technician") and not target.lead_technician:
		target.lead_technician = source.lead_technician
	if target.meta.has_field("assigned_bay") and source.get("assigned_bay") and not target.assigned_bay:
		target.assigned_bay = source.assigned_bay
	if target.meta.has_field("service_advisor") and source.get("service_advisor") and not target.service_advisor:
		target.service_advisor = source.service_advisor


def _original_has_customer_approval(source, is_internal: bool) -> bool:
	if is_internal:
		return False
	status = (source.get("customer_approval_status") or "").strip()
	return (
		status == "Approved"
		or bool(source.get("customer_signature"))
		or bool(source.get("approval_reference"))
	)


def _original_has_repair(source) -> bool:
	logs = source.get("time_logs") or []
	has_logs = False
	for row in logs:
		start = row.get("start_time") if isinstance(row, dict) else row.get("start_time")
		if start:
			has_logs = True
			break
	return bool(
		has_logs
		or source.get("repair_started_at")
		or source.get("completed_date_time")
		or flt(source.get("actual_duration_hours"))
		or flt(source.get("total_hours"))
	)


def _original_has_road_test(source) -> bool:
	result = (source.get("rt_result") or "").strip()
	if result in ("Pass", "Fail"):
		return True
	for row in source.get("road_test_results") or []:
		value = row.get("result") if isinstance(row, dict) else row.get("result")
		if value:
			return True
	return False


def _original_has_qc(source) -> bool:
	result = (source.get("qc_result") or "").strip()
	if result in ("Pass", "Fail"):
		return True
	for row in source.get("qc_results") or []:
		value = row.get("result") if isinstance(row, dict) else row.get("result")
		if value:
			return True
	return False


def _original_stage_reuse_payload(doc) -> dict:
	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
	)

	original_name = _resolve_original_job_card_name(doc)
	empty = {
		"customer_approval": {"available": False},
		"repair": {"available": False},
		"road_test": {"available": False},
		"qc": {"available": False},
	}
	if not original_name or not frappe.db.exists("DMS Job Card", original_name):
		return empty

	source = frappe.get_doc("DMS Job Card", original_name)
	internal = is_internal_job_card(doc)
	return {
		"customer_approval": {"available": _original_has_customer_approval(source, internal)},
		"repair": {"available": _original_has_repair(source)},
		"road_test": {"available": _original_has_road_test(source)},
		"qc": {"available": _original_has_qc(source)},
	}


def _attach_original_stage_reuse(data, doc=None):
	"""Expose the cancelled source + which stages can be reused on Amend / New Version."""
	original_name = _resolve_original_job_card_name(doc or data)
	data["original_job_card"] = original_name or None
	data["original_stage_reuse"] = _original_stage_reuse_payload(doc or data)


def _assert_current_status(doc, allowed, stage_label):
	status = (doc.status or "").strip()
	if status not in allowed:
		frappe.throw(
			_("Cannot copy {0} from the main job card while this card is {1}.").format(
				stage_label, frappe.bold(status or _("unknown"))
			)
		)


def _save_workflow_doc(doc):
	if cint(doc.docstatus) == 1:
		doc.flags.ignore_validate_update_after_submit = True
		doc.save(ignore_permissions=True)
	else:
		doc.save()


def _apply_original_customer_approval(doc, source):
	_assert_current_status(doc, {"Draft", "Open", "Estimation Pending"}, _("customer approval"))
	if cint(doc.docstatus) != 0:
		frappe.throw(_("Job Card is already submitted."))

	_copy_approval_fields(doc, source)
	if not doc.schedule_start_time:
		from frappe.utils import add_to_date, now_datetime

		doc.schedule_start_time = now_datetime()
		end = doc.promised_delivery_date_time
		if not end and flt(doc.estimated_duration_hours):
			end = add_to_date(doc.schedule_start_time, hours=flt(doc.estimated_duration_hours))
		if not end:
			end = add_to_date(doc.schedule_start_time, hours=48)
		doc.schedule_end_time = doc.schedule_end_time or end
	if not (doc.approval_reference or "").strip():
		doc.approval_reference = _("Copied from {0}").format(source.name)
	doc.customer_approval_status = "Approved"
	doc.status = "Estimation Approved"
	_validate_job_card_before_submit(doc)
	doc.save()
	doc.submit()


def _apply_original_repair(doc, source):
	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
		_assert_workshop_warehouse_for_repair,
		_duration_hours,
		_ensure_job_card_submitted_for_repair,
		_is_open_time_log,
		log_job_card_status_change,
	)
	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
	)
	from frappe.utils import now_datetime

	_assert_current_status(
		doc,
		{
			"Draft",
			"Open",
			"Estimation Approved",
			"Repair In Progress",
			"Waiting Parts",
			"Waiting Customer Approval",
		},
		_("repair"),
	)

	if not is_internal_job_card(doc) and cint(doc.docstatus) == 0:
		_copy_approval_fields(doc, source)
		if (source.get("customer_approval_status") or "").strip() == "Approved":
			doc.customer_approval_status = "Approved"
			if not (doc.approval_reference or "").strip():
				doc.approval_reference = _("Copied from {0}").format(source.name)

	_assert_workshop_warehouse_for_repair(doc)
	if cint(doc.docstatus) == 0:
		doc = _ensure_job_card_submitted_for_repair(doc)

	_copy_child_table(doc, source, "time_logs", extra_skip={"job_item"})
	now = now_datetime()
	total_hours = 0.0
	for row in doc.get("time_logs") or []:
		if _is_open_time_log(row):
			row.end_time = now
			row.duration_hours = _duration_hours(row.start_time, row.end_time)
		total_hours += flt(row.duration_hours)

	if source.get("repair_started_at"):
		doc.repair_started_at = source.repair_started_at
	elif not doc.get("repair_started_at"):
		doc.repair_started_at = now

	doc.completed_date_time = source.get("completed_date_time") or now
	doc.actual_duration_hours = source.get("actual_duration_hours") or total_hours
	doc.total_hours = source.get("total_hours") or total_hours
	if doc.meta.has_field("total_labor_hours") and source.get("total_labor_hours"):
		doc.total_labor_hours = source.total_labor_hours

	_copy_labour_actuals(doc, source)

	prev = doc.status
	doc.status = "Repair Completed"
	_save_workflow_doc(doc)
	log_job_card_status_change(
		doc.name,
		"Repair Completed",
		previous_status=prev,
		notes=_("Copied from main job card {0}").format(source.name),
	)


def _apply_original_road_test(doc, source):
	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
		log_job_card_status_change,
	)

	_assert_current_status(doc, {"Repair Completed", "Road Test In Progress"}, _("road test"))
	_copy_child_table(doc, source, "road_test_results")
	if source.get("road_test_template"):
		doc.road_test_template = source.road_test_template
	doc.road_test_note = source.get("road_test_note")
	result = (source.get("rt_result") or "").strip() or "Pass"
	doc.rt_result = result
	prev = doc.status
	if result == "Fail":
		doc.rework_required = 1
		doc.status = "Rework"
	else:
		doc.rt_result = "Pass"
		doc.status = "Road Test Completed"
	_save_workflow_doc(doc)
	log_job_card_status_change(
		doc.name,
		doc.status,
		previous_status=prev,
		notes=_("Copied from main job card {0}").format(source.name),
	)


def _apply_original_qc(doc, source):
	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
		log_job_card_status_change,
	)
	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		complete_internal_job_card,
		is_internal_job_card,
	)

	_assert_current_status(doc, {"Road Test Completed", "QC In Progress", "QC Failed"}, _("QC"))
	_copy_child_table(doc, source, "qc_results")
	for field in (
		"qc_checklist_template",
		"qc_inspector",
		"qc_fail_reason",
		"qc_checked_date",
		"qc_started_at",
	):
		if doc.meta.has_field(field) and source.get(field) not in (None, ""):
			doc.set(field, source.get(field))

	result = (source.get("qc_result") or "").strip() or "Pass"
	prev = doc.status

	if result == "Fail":
		doc.qc_result = "Fail"
		doc.rework_required = 1
		doc.status = "Rework"
		_save_workflow_doc(doc)
		log_job_card_status_change(
			doc.name,
			doc.status,
			previous_status=prev,
			notes=_("Copied from main job card {0}").format(source.name),
		)
		return

	if is_internal_job_card(doc):
		_save_workflow_doc(doc)
		complete_internal_job_card(doc)
		return

	doc.qc_result = "Pass"
	if not doc.get("qc_checked_date"):
		doc.qc_checked_date = frappe.utils.now_datetime()
	if not doc.get("qc_started_at"):
		doc.qc_started_at = doc.qc_checked_date
	doc.status = "Completed"
	_save_workflow_doc(doc)
	log_job_card_status_change(
		doc.name,
		"Completed",
		previous_status=prev,
		notes=_("Copied from main job card {0}").format(source.name),
	)
	_cancel_incomplete_parts_requests_for_job_card(doc.name)


@frappe.whitelist()
def apply_original_job_card_stage(name, stage):
	"""Copy one completed stage from the cancelled main job card onto this Amend / New Version."""
	stage = (stage or "").strip()
	if stage not in _ORIGINAL_STAGES:
		frappe.throw(_("Unknown stage {0}.").format(frappe.bold(stage or "")))
	if not name:
		frappe.throw(_("Job Card name is required"))

	doc = frappe.get_doc("DMS Job Card", name)
	doc.check_permission("write")

	original_name = _resolve_original_job_card_name(doc)
	if not original_name:
		frappe.throw(_("This job card is not an amendment or new version of another job card."))
	if not frappe.db.exists("DMS Job Card", original_name):
		frappe.throw(_("Main job card {0} was not found.").format(frappe.bold(original_name)))

	source = frappe.get_doc("DMS Job Card", original_name)
	source.check_permission("read")

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
	)

	if stage == "customer_approval":
		if not _original_has_customer_approval(source, is_internal_job_card(doc)):
			frappe.throw(_("The main job card has no customer approval to copy."))
		_apply_original_customer_approval(doc, source)
	elif stage == "repair":
		if not _original_has_repair(source):
			frappe.throw(_("The main job card has no repair details to copy."))
		_apply_original_repair(doc, source)
	elif stage == "road_test":
		if not _original_has_road_test(source):
			frappe.throw(_("The main job card has no road test to copy."))
		_apply_original_road_test(doc, source)
	else:
		if not _original_has_qc(source):
			frappe.throw(_("The main job card has no QC results to copy."))
		_apply_original_qc(doc, source)

	frappe.db.commit()
	doc.reload()
	return {
		"name": doc.name,
		"status": doc.status,
		"docstatus": doc.docstatus,
		"original_job_card": original_name,
	}


@frappe.whitelist()
def get_job_card_terms(search=None, limit=50):
	"""List DMS Job Card Terms for the job card UI (default first)."""
	if not frappe.db.exists("DocType", "DMS Job Card Terms"):
		return []

	filters = {}
	or_filters = None
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"title": ["like", f"%{search}%"],
		}

	rows = frappe.get_all(
		"DMS Job Card Terms",
		filters=filters or None,
		or_filters=or_filters,
		fields=["name", "title", "default", "terms_and_conditions"],
		limit=int(limit),
		order_by="title asc",
	)
	rows.sort(key=lambda row: (0 if cint(row.get("default")) else 1, (row.title or row.name or "").lower()))
	return [
		{
			"name": row.name,
			"title": row.title or row.name,
			"is_default": cint(row.get("default")),
			"terms_and_conditions": row.get("terms_and_conditions") or "",
		}
		for row in rows
	]

