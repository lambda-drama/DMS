# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Job card creation and diagnostic invoicing from Service Estimate."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_to_date, flt, now_datetime, strip_html, today

from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
	_apply_dms_settings_dimensions_to_sales_invoice,
	_generate_invoice_no,
	normalize_warranty_application_type,
)
from dms.dealer_management_system.utils.company_letter_head import apply_company_letter_head
from dms.dealer_management_system.doctype.vehicle_inspection.vehicle_inspection import (
	_APPOINTMENT_PRIORITY_TO_JOB_CARD,
)
from dms.dealer_management_system.utils.document_links import linked_job_card_for_estimate


def get_default_diagnostic_fee() -> float:
	return flt(frappe.db.get_single_value("DMS Settings", "default_diagnostic_fee") or 3000)


def get_default_vat_rate() -> float:
	return flt(frappe.db.get_single_value("DMS Settings", "default_vat_rate") or 15)


def get_diagnostic_fee_item_code() -> str | None:
	item = frappe.db.get_single_value("DMS Settings", "diagnostic_fee_item")
	if item and frappe.db.exists("Item", item):
		return item
	return None


def _estimate_diagnosis_text(est) -> str:
	parts = []
	if strip_html(est.get("diagnosis_findings") or "").strip():
		parts.append(_("Problems found:\n{0}").format(est.diagnosis_findings))
	if strip_html(est.get("recommended_repairs") or "").strip():
		parts.append(_("Recommended repairs:\n{0}").format(est.recommended_repairs))
	if not parts and est.get("diagnosis_summary"):
		parts.append(est.diagnosis_summary)
	return "\n\n".join(parts)


def _job_card_type_from_estimate(est) -> str:
	"""Warranty application on the estimate means the job is a warranty job."""
	if normalize_warranty_application_type(est.get("warranty_application_type")):
		return "Warranty"
	return "Customer Paid"


def _apply_job_card_type_from_estimate(jc, est) -> None:
	"""Keep Customer Paid / Warranty in sync with the estimate; leave other types alone."""
	derived = _job_card_type_from_estimate(est)
	current = (jc.get("job_card_type") or "").strip()
	if derived == "Warranty" or current in ("", "Customer Paid", "Warranty"):
		jc.job_card_type = derived


def make_dms_job_card_from_estimate(
	estimate_name: str,
	lead_technician: str | None = None,
	assigned_bay: str | None = None,
	schedule_start_time: str | None = None,
	schedule_end_time: str | None = None,
) -> str:
	if not frappe.has_permission("DMS Service Estimate", "read", doc=estimate_name):
		frappe.throw(_("Not permitted to read this Service Estimate"), frappe.PermissionError)
	if not frappe.has_permission("DMS Job Card", "create"):
		frappe.throw(_("Not permitted to create DMS Job Card"), frappe.PermissionError)

	est = frappe.get_doc("DMS Service Estimate", estimate_name)

	if est.customer_decision != "Accepted":
		frappe.throw(_("Only accepted estimates can create a Job Card."))

	existing_jc = linked_job_card_for_estimate(est.name)
	if existing_jc and frappe.db.exists("DMS Job Card", existing_jc):
		return existing_jc

	jc = frappe.new_doc("DMS Job Card")
	jc.update(
		{
			"job_card_type": _job_card_type_from_estimate(est),
			"status": "Open",
			"inspection": est.inspection,
			"service_estimate": est.name,
			"appointment": est.appointment,
			"customer": est.customer,
			"vehicle_vin": est.vehicle_vin,
			"license_plate": est.license_plate,
			"service_advisor": est.service_advisor,
			"company": est.company,
			"currency": est.currency,
			"service_advisor_notes": est.service_advisor_notes or "",
			"internal_notes": est.internal_notes or "",
			"customer_approval_status": "Approved",
			"approved_amount": est.grand_total,
			"customer_signature": est.customer_signature,
			"posting_date": today(),
			"opened_date_time": now_datetime(),
			"warranty_status": est.warranty_status,
			"warranty_expiry_date": est.warranty_expiry_date,
			"warranty_application_type": est.warranty_application_type,
			"labour_discount_type": est.labour_discount_type,
			"labour_discount_value": est.labour_discount_value,
			"parts_discount_type": est.parts_discount_type,
			"parts_discount_value": est.parts_discount_value,
			"discount_amount": est.discount_amount,
		}
	)

	if est.inspection:
		odometer = frappe.db.get_value("Vehicle Inspection", est.inspection, "odometer")
		if odometer is not None:
			jc.current_odometer = odometer

	sa_doc = None
	if est.appointment:
		try:
			sa_doc = frappe.get_doc("Service Appointment", est.appointment)
		except frappe.DoesNotExistError:
			sa_doc = None

	if sa_doc:
		jc.assigned_bay = assigned_bay or sa_doc.get("assigned_bay")
		if sa_doc.get("estimated_duration_hours") is not None:
			jc.estimated_duration_hours = sa_doc.estimated_duration_hours

		priority_key = (sa_doc.get("priority") or "").strip()
		jc.priority = _APPOINTMENT_PRIORITY_TO_JOB_CARD.get(priority_key, "Normal")

		jc.promised_delivery_date_time = (
			sa_doc.get("promised_delivery_date_time")
			or sa_doc.get("appointment_date_time")
			or add_to_date(now_datetime(), hours=48)
		)

		if not lead_technician:
			tech_rows = [r for r in (sa_doc.get("technicians") or []) if r.get("technician")]
			for row in tech_rows:
				role = (row.get("role") or "").strip().lower()
				if "lead" in role:
					lead_technician = row.technician
					break
			if tech_rows and not lead_technician:
				lead_technician = tech_rows[0].technician
	else:
		jc.priority = "Normal"
		jc.promised_delivery_date_time = add_to_date(now_datetime(), hours=48)

	if lead_technician:
		jc.lead_technician = lead_technician
	if assigned_bay:
		jc.assigned_bay = assigned_bay

	from dms.api.job_cards import _sync_workshop_warehouse_from_bay

	if jc.assigned_bay:
		_sync_workshop_warehouse_from_bay(jc, jc.assigned_bay)

	if schedule_start_time:
		jc.schedule_start_time = schedule_start_time
	if schedule_end_time:
		jc.schedule_end_time = schedule_end_time

	if est.diagnosis_findings or est.recommended_repairs or est.get("diagnosis_summary"):
		jc.service_advisor_notes = _estimate_diagnosis_text(est)

	has_job_row = False
	if est.inspection:
		inv = frappe.get_doc("Vehicle Inspection", est.inspection)
		for row in inv.get("customer_complaints") or []:
			jc.append(
				"job_items",
				{
					"complaint_description": row.get("customer_exact_words") or _("(No description)"),
					"symptom_category": row.get("symptom_category"),
					"severity": row.get("severity"),
				},
			)
			has_job_row = True

	if not has_job_row:
		jc.append(
			"job_items",
			{
				"complaint_description": _("Work approved from Service Estimate {0}").format(
					frappe.bold(est.name)
				),
			},
		)

	for row in est.get("labour") or []:
		if not row.vehicle_service_item:
			continue
		jc.append(
			"labour",
			{
				"vehicle_service_item": row.vehicle_service_item,
				"service_name": row.service_name,
				"complaint": row.complaint,
				"diagnosis": row.diagnosis or _estimate_diagnosis_text(est),
				"technician": row.technician or lead_technician,
				"estimated_hours": row.estimated_hours,
				"rate_per_hour": row.rate_per_hour,
				"amount": row.amount,
				"is_warranty": row.is_warranty,
				"notes": row.notes,
			},
		)

	for row in est.get("parts") or []:
		if not row.item_code:
			continue
		jc.append(
			"parts",
			{
				"item_code": row.item_code,
				"part_name": row.part_name,
				"quantity_requested": row.quantity_requested,
				"unit_price": row.unit_price,
				"total_amount": row.total_amount,
				"is_warranty": row.is_warranty,
				"notes": row.notes,
				"line_status": "Requested",
			},
		)

	jc.insert()

	return jc.name


def sync_job_card_from_accepted_estimate(est) -> str | None:
	"""Push accepted estimate lines and warranty totals to the linked job card."""
	if est.status != "Accepted":
		return None

	if est.estimate_type == "Supplementary":
		return None

	jc_name = linked_job_card_for_estimate(est.name)
	if not jc_name or not frappe.db.exists("DMS Job Card", jc_name):
		return None

	jc = frappe.get_doc("DMS Job Card", jc_name)
	jc.check_permission("write")

	if jc.invoice:
		frappe.throw(
			_("Cannot update the job card — invoice {0} already exists.").format(frappe.bold(jc.invoice))
		)

	blocked_statuses = {"Invoiced", "Delivered", "Closed", "Cancelled"}
	if jc.status in blocked_statuses:
		frappe.throw(_("Cannot update job card in status {0}.").format(frappe.bold(jc.status)))

	for row in jc.parts or []:
		line_status = (row.line_status or "").strip()
		if line_status and line_status not in ("Requested",):
			frappe.throw(_("Cannot sync — parts on the job card are already issued or consumed."))

	if frappe.db.exists(
		"DMS Service Estimate",
		{"parent_job_card": jc_name, "status": "Accepted", "name": ["!=", est.name]},
	):
		frappe.throw(
			_("Cannot replace job card lines — supplementary approved work exists on this job card.")
		)

	jc.set("labour", [])
	for row in est.get("labour") or []:
		if not row.vehicle_service_item:
			continue
		jc.append(
			"labour",
			{
				"vehicle_service_item": row.vehicle_service_item,
				"service_name": row.service_name,
				"complaint": row.complaint,
				"diagnosis": row.diagnosis or _estimate_diagnosis_text(est),
				"technician": row.technician or jc.lead_technician,
				"estimated_hours": row.estimated_hours,
				"rate_per_hour": row.rate_per_hour,
				"amount": row.amount,
				"is_warranty": row.is_warranty,
				"notes": row.notes,
			},
		)

	jc.set("parts", [])
	for row in est.get("parts") or []:
		if not row.item_code:
			continue
		jc.append(
			"parts",
			{
				"item_code": row.item_code,
				"part_name": row.part_name,
				"quantity_requested": row.quantity_requested,
				"unit_price": row.unit_price,
				"total_amount": row.total_amount,
				"is_warranty": row.is_warranty,
				"notes": row.notes,
				"line_status": "Requested",
				"warehouse": jc.warehouse,
			},
		)

	jc.warranty_application_type = est.warranty_application_type
	_apply_job_card_type_from_estimate(jc, est)
	jc.labour_discount_type = est.labour_discount_type
	jc.labour_discount_value = est.labour_discount_value
	jc.parts_discount_type = est.parts_discount_type
	jc.parts_discount_value = est.parts_discount_value
	jc.discount_amount = est.discount_amount
	jc.approved_amount = est.grand_total
	diagnosis = _estimate_diagnosis_text(est)
	if diagnosis:
		jc.service_advisor_notes = diagnosis

	if hasattr(jc, "calculate_costing_and_totals"):
		jc.calculate_costing_and_totals()

	jc.flags.ignore_validate_update_after_submit = True
	jc.save(ignore_permissions=True)

	return jc.name


def create_diagnostic_invoice_from_estimate(estimate_name: str, submit: bool = True) -> str:
	"""Create Sales Invoice for diagnostic fee when customer rejects the repair estimate."""
	if "erpnext" not in frappe.get_installed_apps():
		frappe.throw(_("ERPNext is required to create Sales Invoices."))

	est = frappe.get_doc("DMS Service Estimate", estimate_name)

	if est.customer_decision != "Rejected":
		frappe.throw(_("Diagnostic invoice is only created when the customer rejects the estimate."))

	if est.diagnostic_invoice and frappe.db.exists("Sales Invoice", est.diagnostic_invoice):
		return est.diagnostic_invoice

	if not est.customer:
		frappe.throw(_("Customer is required on the Service Estimate."))
	if not est.company:
		frappe.throw(_("Company is required on the Service Estimate."))

	fee = flt(est.diagnostic_fee or get_default_diagnostic_fee())
	if fee <= 0:
		frappe.throw(_("Diagnostic fee must be greater than zero."))

	item_code = get_diagnostic_fee_item_code()
	if not item_code:
		frappe.throw(
			_(
				"Set a Diagnostic Fee Item in DMS Settings (link to an ERPNext Item) "
				"before invoicing the diagnostic fee."
			)
		)

	si = frappe.new_doc("Sales Invoice")
	si.custom_invoice_no = _generate_invoice_no(est.company)
	si.company = est.company
	si.customer = est.customer
	si.posting_date = today()
	si.due_date = si.posting_date
	si.remarks = _("Diagnostic fee — Service Estimate {0} (customer declined repair)").format(est.name)

	if hasattr(si, "custom_dms_service_estimate"):
		si.custom_dms_service_estimate = est.name

	si.append(
		"items",
		{
			"item_code": item_code,
			"qty": 1,
			"rate": fee,
			"description": _("Vehicle diagnosis fee — {0}").format(est.name),
		},
	)

	if hasattr(si, "ignore_pricing_rule"):
		si.ignore_pricing_rule = 1

	si.set_missing_values()
	_apply_dms_settings_dimensions_to_sales_invoice(si, est.company)
	apply_company_letter_head(si, est.company)
	si.run_method("calculate_taxes_and_totals")
	si.insert()

	if submit:
		si.submit()

	return si.name
