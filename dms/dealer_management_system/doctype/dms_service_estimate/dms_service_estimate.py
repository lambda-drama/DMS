# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Service Estimate workflow: diagnosis → estimation → customer decision → job card or diagnostic invoice."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, now_datetime, strip_html, today

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	apply_vehicle_labour_row_pricing,
	is_labour_row_billable,
	is_part_row_billable,
	part_issue_qty,
	spare_part_default_selling_price,
)
from dms.dealer_management_system.doctype.dms_service_estimate.estimate_utils import (
	create_diagnostic_invoice_from_estimate,
	get_default_diagnostic_fee,
	get_default_vat_rate,
	make_dms_job_card_from_estimate,
)
from dms.dealer_management_system.utils.document_links import linked_job_card_for_estimate


class DMSServiceEstimate(Document):
	def validate(self):
		if self.warranty_application_type != "Discount":
			from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
				clear_split_discount_fields,
			)

			clear_split_discount_fields(self)

		self.calculate_totals()

	def calculate_totals(self):
		total_labor = 0.0
		total_parts = 0.0

		for row in self.labour or []:
			row.amount = apply_vehicle_labour_row_pricing(row)
			if is_labour_row_billable(row):
				total_labor += flt(row.amount)

		for row in self.parts or []:
			if not row.item_code:
				continue
			qty = part_issue_qty(row)
			if flt(row.unit_price or 0) <= 0:
				row.unit_price = spare_part_default_selling_price(row.item_code)
			row.total_amount = round(qty * flt(row.unit_price or 0), 2)
			if is_part_row_billable(row):
				total_parts += flt(row.total_amount)

		self.total_labor_cost = round(total_labor, 2)
		self.total_parts_cost = round(total_parts, 2)
		self.apply_warranty_application()

		vat_rate = flt(self.vat_rate if self.vat_rate is not None else get_default_vat_rate())
		self.vat_amount = round(self.total_before_vat * vat_rate / 100.0, 2)
		self.grand_total = round(self.total_before_vat + self.vat_amount, 2)

	def apply_warranty_application(self):
		from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
			job_card_combined_discount_amount,
		)

		warranty_application_type = self.warranty_application_type
		total_labor = flt(self.total_labor_cost or 0)
		total_parts = flt(self.total_parts_cost or 0)
		total_amount = round(total_labor + total_parts, 2)

		if warranty_application_type == "All Invoice":
			self.total_before_vat = 0
		elif warranty_application_type == "Spare Part":
			self.total_before_vat = round(total_labor, 2)
		elif warranty_application_type == "Labour":
			self.total_before_vat = round(total_parts, 2)
		elif warranty_application_type == "Discount":
			discount_amount = job_card_combined_discount_amount(self)
			self.discount_amount = discount_amount
			self.total_before_vat = round(total_amount - discount_amount, 2)
		else:
			self.discount_amount = 0
			self.total_before_vat = round(total_amount, 2)


def _ensure_estimate_writable(doc: Document):
	if doc.status in ("Accepted", "Rejected", "Cancelled"):
		frappe.throw(
			_("Service Estimate {0} is {1} and cannot be modified.").format(
				frappe.bold(doc.name), doc.status
			)
		)


def _has_diagnosis_text(doc) -> bool:
	for field in ("diagnosis_findings", "recommended_repairs", "diagnosis_summary"):
		if strip_html(doc.get(field) or "").strip():
			return True
	return False


@frappe.whitelist()
def make_service_estimate_from_inspection(source_name: str) -> str:
	if not frappe.has_permission("Vehicle Inspection", "read", doc=source_name):
		frappe.throw(_("Not permitted to read this Vehicle Inspection"), frappe.PermissionError)
	if not frappe.has_permission("DMS Service Estimate", "create"):
		frappe.throw(_("Not permitted to create DMS Service Estimate"), frappe.PermissionError)

	inv = frappe.get_doc("Vehicle Inspection", source_name)
	if inv.docstatus != 1:
		frappe.throw(_("Submit the Vehicle Inspection before starting diagnosis."))

	existing = frappe.db.get_value(
		"DMS Service Estimate",
		{"inspection": inv.name, "status": ["not in", ["Rejected", "Cancelled"]]},
		"name",
	)
	if existing:
		frappe.throw(
			_("An active Service Estimate {0} already exists for this inspection.").format(
				frappe.bold(existing)
			)
		)

	if not inv.customer:
		frappe.throw(_("Customer is required on the Vehicle Inspection."))
	if not inv.vin_chassis:
		frappe.throw(_("VIN / Chassis Number is required on the Vehicle Inspection."))

	est = frappe.new_doc("DMS Service Estimate")
	est.update(
		{
			"inspection": inv.name,
			"appointment": inv.appointment,
			"customer": inv.customer,
			"vehicle_vin": inv.vin_chassis,
			"license_plate": inv.license_plate,
			"service_advisor": inv.service_advisor,
			"company": inv.company,
			"service_advisor_notes": inv.service_advisor_notes or "",
			"internal_notes": inv.internal_notes or "",
			"diagnostic_fee": get_default_diagnostic_fee(),
			"status": "Diagnosis In Progress",
			"posting_date": today(),
		}
	)

	if inv.company:
		est.currency = frappe.db.get_value("Company", inv.company, "default_currency")

	est.insert()

	return est.name


@frappe.whitelist()
def complete_diagnosis(
	estimate_name: str,
	diagnosis_findings: str | None = None,
	recommended_repairs: str | None = None,
) -> dict:
	doc = frappe.get_doc("DMS Service Estimate", estimate_name)
	doc.check_permission("write")
	_ensure_estimate_writable(doc)

	if doc.status not in ("Draft", "Diagnosis In Progress"):
		frappe.throw(_("Diagnosis can only be completed from Diagnosis In Progress status."))

	if diagnosis_findings is not None:
		doc.diagnosis_findings = diagnosis_findings
	if recommended_repairs is not None:
		doc.recommended_repairs = recommended_repairs

	if not _has_diagnosis_text(doc):
		frappe.throw(_("Enter the problems found and/or recommended repairs before completing diagnosis."))

	doc.diagnosis_completed_date = now_datetime()
	doc.status = "Diagnosis Complete"
	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def start_estimation(estimate_name: str) -> dict:
	doc = frappe.get_doc("DMS Service Estimate", estimate_name)
	doc.check_permission("write")
	_ensure_estimate_writable(doc)

	if doc.status not in ("Diagnosis Complete", "Estimation In Progress"):
		frappe.throw(_("Start estimation after diagnosis is complete."))

	doc.status = "Estimation In Progress"
	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status}


def get_bilingual_customer_terms() -> dict:
	from dms.dealer_management_system.utils.customer_terms import get_bilingual_customer_terms as _get

	return _get()


def _require_and_record_terms_acceptance(doc, terms_accepted: int | bool) -> None:
	from dms.dealer_management_system.utils.customer_terms import require_and_record_terms_acceptance

	require_and_record_terms_acceptance(doc, terms_accepted)


@frappe.whitelist()
def submit_for_customer_approval(estimate_name: str) -> dict:
	doc = frappe.get_doc("DMS Service Estimate", estimate_name)
	doc.check_permission("write")
	_ensure_estimate_writable(doc)

	if doc.status not in ("Diagnosis Complete", "Estimation In Progress"):
		frappe.throw(_("Complete diagnosis and add labour/parts before sending to customer."))

	if not doc.get("labour") and not doc.get("parts"):
		frappe.throw(_("Add at least one labour or parts line before submitting for customer approval."))

	doc.calculate_totals()
	if doc.warranty_application_type == "Discount":
		gross = flt(doc.total_labor_cost or 0) + flt(doc.total_parts_cost or 0)
		if gross > 0 and flt(doc.discount_amount or 0) < 1:
			frappe.throw(
				_(
					"Set a labour and/or parts discount (total at least 1) when "
					"Warranty Application Type is Discount."
				)
			)
	doc.status = "Pending Customer Approval"
	doc.customer_decision = "Pending"
	doc.save()
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": doc.status,
		"total_before_vat": doc.total_before_vat,
		"grand_total": doc.grand_total,
	}


@frappe.whitelist()
def accept_estimate(
	estimate_name: str,
	customer_signature: str | None = None,
	lead_technician: str | None = None,
	assigned_bay: str | None = None,
	schedule_start_time: str | None = None,
	schedule_end_time: str | None = None,
	start_repair: int | bool = 0,
	terms_accepted: int | bool = 0,
) -> dict:
	doc = frappe.get_doc("DMS Service Estimate", estimate_name)
	doc.check_permission("write")

	if doc.estimate_type == "Supplementary":
		from dms.dealer_management_system.doctype.dms_additional_work_request.additional_work_workflow import (
			accept_supplementary_estimate_and_update_job_card,
		)

		if not customer_signature:
			frappe.throw(_("Customer signature is required to accept the estimate."))

		_require_and_record_terms_acceptance(doc, terms_accepted)
		result = accept_supplementary_estimate_and_update_job_card(
			estimate_name,
			customer_signature,
			terms_doc=doc.terms_and_conditions,
			terms_ar_doc=getattr(doc, "terms_and_conditions_ar", None),
		)
		return {"name": doc.name, "status": "Accepted", "job_card": result["job_card"]}

	if doc.status != "Pending Customer Approval":
		frappe.throw(_("Estimate must be pending customer approval before acceptance."))

	if not customer_signature:
		frappe.throw(_("Customer signature is required to accept the estimate."))

	_require_and_record_terms_acceptance(doc, terms_accepted)

	missing = []
	if not lead_technician:
		missing.append(_("Lead Technician"))
	if not assigned_bay:
		missing.append(_("Assigned Service Bay"))
	if cint(start_repair):
		if not schedule_start_time:
			missing.append(_("Schedule Start Time"))
		if not schedule_end_time:
			missing.append(_("Schedule End Time"))
	if missing:
		frappe.throw(
			_("Please fill in the following before creating the job card: {0}").format(
				", ".join(missing)
			)
		)

	existing_jc = linked_job_card_for_estimate(doc.name)
	if existing_jc and frappe.db.exists("DMS Job Card", existing_jc):
		frappe.throw(_("Job Card {0} already exists for this estimate.").format(existing_jc))

	doc.customer_signature = customer_signature
	doc.customer_decision = "Accepted"
	doc.decision_date = now_datetime()
	doc.diagnostic_fee_voided = 1
	doc.status = "Accepted"
	doc.save()

	jc_name = make_dms_job_card_from_estimate(
		doc.name,
		lead_technician=lead_technician,
		assigned_bay=assigned_bay,
		schedule_start_time=schedule_start_time,
		schedule_end_time=schedule_end_time,
	)

	if cint(start_repair):
		from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import start_repair

		start_repair(jc_name)

	frappe.db.commit()

	return {"name": doc.name, "status": "Accepted", "job_card": jc_name}


@frappe.whitelist()
def reject_estimate(
	estimate_name: str,
	rejection_signature: str | None = None,
	terms_accepted: int | bool = 0,
	rejection_reason: str | None = None,
	lost_sale_follow_up_date=None,
) -> dict:
	doc = frappe.get_doc("DMS Service Estimate", estimate_name)
	doc.check_permission("write")

	if doc.status != "Pending Customer Approval":
		frappe.throw(_("Estimate must be pending customer approval before rejection."))

	if not rejection_signature:
		frappe.throw(_("Customer signature is required to reject the estimate."))

	_require_and_record_terms_acceptance(doc, terms_accepted)

	if doc.diagnostic_invoice and frappe.db.exists("Sales Invoice", doc.diagnostic_invoice):
		frappe.throw(_("Diagnostic invoice already created for this estimate."))

	doc.rejection_signature = rejection_signature
	if rejection_reason:
		doc.rejection_reason = rejection_reason
	if lost_sale_follow_up_date:
		doc.lost_sale_follow_up_date = lost_sale_follow_up_date
	if not doc.lost_sale_status:
		doc.lost_sale_status = "Open"
	doc.customer_decision = "Rejected"
	doc.decision_date = now_datetime()
	doc.status = "Rejected"
	doc.save()

	invoice_name = create_diagnostic_invoice_from_estimate(doc.name)
	frappe.db.set_value(
		"DMS Service Estimate", doc.name, "diagnostic_invoice", invoice_name, update_modified=True
	)
	frappe.db.commit()

	return {"name": doc.name, "status": "Rejected", "diagnostic_invoice": invoice_name}
