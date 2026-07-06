# Copyright (c) 2026, Mania and contributors

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import today

@frappe.whitelist()
def create_additional_work_request(job_card: str, description: str, reason: str | None = None, raised_by: str | None = None):
	jc = frappe.get_doc("DMS Job Card", job_card)
	jc.check_permission("read")

	if not description:
		frappe.throw(_("Work description is required."))

	doc = frappe.new_doc("DMS Additional Work Request")
	doc.job_card = jc.name
	doc.customer = jc.customer
	doc.vehicle_vin = jc.vehicle_vin
	doc.raised_by = raised_by or jc.lead_technician
	doc.description = description
	doc.reason = reason
	doc.status = "Pending Customer Approval"
	doc.insert(ignore_permissions=True)

	if jc.status == "Repair In Progress":
		jc.status = "Waiting Customer Approval"
		jc.flags.ignore_validate_update_after_submit = True
		jc.save(ignore_permissions=True)

	frappe.db.commit()
	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def create_supplementary_estimate_from_awr(awr_name: str):
	"""Service advisor creates supplementary estimate from additional work request."""
	awr = frappe.get_doc("DMS Additional Work Request", awr_name)
	awr.check_permission("read")

	if awr.supplementary_estimate:
		return {"name": awr.supplementary_estimate}

	jc = frappe.get_doc("DMS Job Card", awr.job_card)
	est = frappe.new_doc("DMS Service Estimate")
	est.estimate_type = "Supplementary"
	est.status = "Estimation In Progress"
	est.parent_job_card = jc.name
	est.additional_work_request = awr.name
	est.parent_estimate = jc.service_estimate
	est.inspection = jc.inspection
	est.appointment = jc.appointment
	est.customer = jc.customer
	est.vehicle_vin = jc.vehicle_vin
	est.license_plate = jc.license_plate
	est.service_advisor = jc.service_advisor
	est.company = jc.company
	est.currency = jc.currency
	est.posting_date = today()
	est.diagnostic_fee = 0
	est.diagnostic_fee_voided = 1
	est.diagnosis_findings = awr.description
	est.recommended_repairs = awr.reason or awr.description
	est.internal_notes = _("Supplementary estimate for additional work on {0}").format(jc.name)
	est.insert(ignore_permissions=True)

	frappe.db.set_value(
		"DMS Additional Work Request",
		awr.name,
		"supplementary_estimate",
		est.name,
		update_modified=True,
	)
	frappe.db.commit()
	return {"name": est.name, "additional_work_request": awr.name}


@frappe.whitelist()
def accept_supplementary_estimate_and_update_job_card(
	estimate_name: str,
	customer_signature: str,
	terms_doc: str | None = None,
	terms_ar_doc: str | None = None,
):
	"""Customer approves supplementary estimate — append lines to existing job card."""
	est = frappe.get_doc("DMS Service Estimate", estimate_name)
	est.check_permission("write")

	if est.estimate_type != "Supplementary":
		frappe.throw(_("This action is only for supplementary estimates."))
	if est.status != "Pending Customer Approval":
		frappe.throw(_("Supplementary estimate must be pending customer approval."))
	if not est.parent_job_card:
		frappe.throw(_("Parent Job Card is missing on the supplementary estimate."))
	if not customer_signature:
		frappe.throw(_("Customer signature is required."))

	jc = frappe.get_doc("DMS Job Card", est.parent_job_card)
	jc.check_permission("write")

	est.customer_signature = customer_signature
	est.customer_decision = "Accepted"
	est.status = "Accepted"
	if terms_doc:
		est.terms_and_conditions = terms_doc
		est.terms_accepted = 1
		est.terms_accepted_at = frappe.utils.now_datetime()
	if terms_ar_doc and frappe.get_meta("DMS Service Estimate").has_field("terms_and_conditions_ar"):
		est.terms_and_conditions_ar = terms_ar_doc
	est.save()

	for row in est.get("labour") or []:
		if not row.vehicle_service_item:
			continue
		jc.append(
			"labour",
			{
				"vehicle_service_item": row.vehicle_service_item,
				"service_name": row.service_name,
				"estimated_hours": row.estimated_hours,
				"rate_per_hour": row.rate_per_hour,
				"amount": row.amount,
				"technician": row.technician or jc.lead_technician,
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
				"line_status": "Requested",
				"notes": row.notes,
			},
		)

	if hasattr(jc, "calculate_costing_and_totals"):
		jc.calculate_costing_and_totals()

	jc.flags.ignore_validate_update_after_submit = True
	if jc.status == "Waiting Customer Approval":
		jc.status = "Repair In Progress"
	jc.save(ignore_permissions=True)

	if est.additional_work_request:
		frappe.db.set_value(
			"DMS Additional Work Request",
			est.additional_work_request,
			"status",
			"Approved",
			update_modified=True,
		)

	frappe.db.commit()
	return {"estimate": est.name, "job_card": jc.name, "status": jc.status}


@frappe.whitelist()
def list_additional_work_requests_for_job_card(job_card: str):
	return frappe.get_all(
		"DMS Additional Work Request",
		filters={"job_card": job_card},
		fields=[
			"name",
			"status",
			"posting_date",
			"description",
			"reason",
			"raised_by",
			"supplementary_estimate",
		],
		order_by="creation desc",
	)
