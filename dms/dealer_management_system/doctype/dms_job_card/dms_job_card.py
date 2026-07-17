# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	is_labour_row_billable,
	is_part_row_billable,
	part_issue_qty,
	spare_part_default_selling_price,
	apply_vehicle_labour_row_pricing,
)

SEVERITY_NORMALIZATION_MAP = {
	"low": "1 - Low",
	"1 - low": "1 - Low",
	"minor": "2 - Minor",
	"2 - minor": "2 - Minor",
	"moderate": "3 - Moderate",
	"3 - moderate": "3 - Moderate",
	"high": "4 - High",
	"4 - high": "4 - High",
	"safety critical": "5 - Safety Critical",
	"safety-critical": "5 - Safety Critical",
	"5 - safety critical": "5 - Safety Critical",
}


class DMSJobCard(Document):
	def before_validate(self):
		# Must run before Frappe's select-option validation.
		self.normalize_job_item_severity()

	def validate(self):
		if self.warranty_application_type != "Discount":
			from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
				clear_split_discount_fields,
			)

			clear_split_discount_fields(self)

		self.apply_job_card_warehouse_to_parts()
		self.ensure_qc_results_from_template()
		self.validate_qc_measurements()
		self.validate_inspection_for_job_type()
		self.validate_internal_workflow()
		self.calculate_costing_and_totals()

	def validate_internal_workflow(self):
		from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
			is_internal_job_card,
			prepare_internal_job_card,
		)

		if is_internal_job_card(self):
			prepare_internal_job_card(self)

	def validate_inspection_for_job_type(self):
		from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
			is_internal_job_card,
		)

		if is_internal_job_card(self):
			return
		if cint(self.get("skip_vehicle_inspection")):
			return
		if not (self.inspection or "").strip():
			frappe.throw(_("Vehicle Inspection is required for this job card type."))

	def normalize_job_item_severity(self):
		"""Backfill legacy severity values (e.g. 'Low') to current select options."""
		for row in self.job_items or []:
			severity = (row.severity or "").strip()
			if not severity:
				continue
			normalized = SEVERITY_NORMALIZATION_MAP.get(severity.lower())
			if normalized:
				row.severity = normalized

	def apply_job_card_warehouse_to_parts(self):
		"""Default each spare-part line warehouse from the job card header when not set."""
		if not self.warehouse:
			return
		for row in self.parts or []:
			if not row.item_code:
				continue
			if not (row.warehouse or "").strip():
				row.warehouse = self.warehouse

	def before_submit(self):
		if not self.company:
			frappe.throw(_("Set Company before submitting the Job Card."))

	def calculate_costing_and_totals(self):
		"""Totals exclude warranty labour/parts.

		• total_labor_cost — billable labour (hours × rate).
		• total_parts_cost — billable parts amount from the parts table.
		• total_amount / net_amount — customer subtotal before/after discount.
		"""
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

			if not is_part_row_billable(row):
				continue

			total_parts += flt(row.total_amount)

		self.total_labor_cost = round(total_labor, 2)
		self.total_parts_cost = round(total_parts, 2)
		self.total_amount = round(total_labor + total_parts, 2)

		from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
			apply_internal_job_card_billing,
			is_internal_job_card,
		)

		if is_internal_job_card(self):
			apply_internal_job_card_billing(self)
			return

		self.apply_warranty_application()

	def apply_warranty_application(self):
		from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
			job_card_combined_discount_amount,
		)

		warranty_application_type = self.warranty_application_type
		total_labor = flt(self.total_labor_cost or 0)
		total_parts = flt(self.total_parts_cost or 0)
		total_amount = flt(self.total_amount or 0)
		discount_amount = flt(self.discount_amount or 0)

		if warranty_application_type == "All Invoice":
			self.net_amount = 0
		elif warranty_application_type == "Spare Part":
			self.net_amount = round(total_labor, 2)
		elif warranty_application_type == "Labour":
			self.net_amount = round(total_parts, 2)
		elif warranty_application_type == "Discount":
			discount_amount = job_card_combined_discount_amount(self)
			self.discount_amount = discount_amount
			if discount_amount < 1:
				frappe.throw(
					_(
						"Set a labour and/or parts discount (total at least 1) when "
						"Warranty Application Type is Discount."
					)
				)
			self.net_amount = round(total_amount - discount_amount, 2)
		else:
			self.net_amount = round(total_amount - discount_amount, 2)

	def ensure_qc_results_from_template(self):
		"""When a template is set and results are empty, copy lines (no link to template child names)."""
		if not self.qc_checklist_template:
			return
		if self.qc_results:
			return
		template = frappe.get_doc("QC Checklist Template", self.qc_checklist_template)
		for item in template.get("checklist_items") or []:
			display = item.get("check_item")
			if display:
				display = (
					frappe.db.get_value("QC Checklist Item Master", display, "qc_checklist_item") or display
				)

			req_m = cint(item.get("requires_measurement"))
			self.append(
				"qc_results",
				{
					"check_item_text": display or "",
					"category": item.get("category"),
					"is_mandatory": item.get("is_mandatory"),
					"requires_photo": item.get("requires_photo"),
					"requires_measurement": item.get("requires_measurement"),
					"min_value": item.min_value if req_m else None,
					"max_value": item.max_value if req_m else None,
					"result": "Pass",
				},
			)

	def validate_qc_measurements(self):
		"""Use min/max copied onto each QC result row (no checklist_item link)."""
		for result in self.qc_results or []:
			if not cint(getattr(result, "requires_measurement", 0)):
				continue
			if getattr(result, "measurement_value", None) is None:
				continue

			fail = False
			min_v = getattr(result, "min_value", None)
			max_v = getattr(result, "max_value", None)
			if min_v is not None and result.measurement_value < min_v:
				fail = True
			if max_v is not None and result.measurement_value > max_v:
				fail = True
			if fail:
				result.result = "Fail"


@frappe.whitelist()
def make_sales_invoice_from_job_card(
	job_card,
	due_date=None,
	submit=0,
	warranty_application_type=None,
	discount_amount=None,
	labour_discount=None,
	parts_discount=None,
	rate_overrides=None,
	apply_taxes=0,
):
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_sales_invoice_from_dms_job_card,
	)

	job_card_name = (job_card or "").strip()
	if not job_card_name:
		frappe.throw(_("Job Card name is required."))

	frappe.has_permission("Sales Invoice", "create", throw=True)
	frappe.has_permission("DMS Job Card", "read", job_card_name, throw=True)

	return create_sales_invoice_from_dms_job_card(
		job_card_name,
		due_date=due_date or None,
		submit=bool(int(submit or 0)),
		warranty_application_type=warranty_application_type,
		discount_amount=discount_amount,
		labour_discount=labour_discount,
		parts_discount=parts_discount,
		rate_overrides=rate_overrides,
		apply_taxes=bool(int(apply_taxes or 0)),
	)


@frappe.whitelist()
def get_job_card_part_stock_available(spare_part: str | None = None, warehouse: str | None = None):
	"""Qty on hand for the Spare Part's linked ERP Item (replaces invalid fetch_from on actual_qty)."""
	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_item_stock_balance,
		resolve_spare_part_erp_item_code,
	)

	spare_part = (spare_part or "").strip()
	if not spare_part or not frappe.db.exists("Spare Part", spare_part):
		return None

	erp_item = resolve_spare_part_erp_item_code(spare_part)
	if not erp_item:
		return None

	warehouse = (warehouse or "").strip() or None
	return get_dms_item_stock_balance(erp_item, warehouse)


@frappe.whitelist()
def get_job_card_part_unit_price(spare_part: str | None = None):
	"""Default unit price for a Job Card part row (same logic as dms.api.common.get_spare_part_price)."""
	spare_part = (spare_part or "").strip()
	if not spare_part or not frappe.db.exists("Spare Part", spare_part):
		return 0
	
	return spare_part_default_selling_price(spare_part)


"""
Add these three whitelisted methods to:
dms/dealer_management_system/doctype/dms_job_card/dms_job_card.py

The key pattern: frappe.db.set_value() for scalar fields on the parent,
and direct frappe.db operations for child table rows.
"""

import frappe
import json
from frappe import _
from frappe.utils import add_to_date, get_datetime, now_datetime, flt


def _time_log_has_active_end(end_time) -> bool:
	if not end_time:
		return False
	if isinstance(end_time, str) and end_time.startswith("0000-00-00"):
		return False
	return True


def _is_open_time_log(row) -> bool:
	if isinstance(row, dict):
		start_time = row.get("start_time")
		end_time = row.get("end_time")
	else:
		start_time = getattr(row, "start_time", None)
		end_time = getattr(row, "end_time", None)
	return bool(start_time) and not _time_log_has_active_end(end_time)


def repair_session_start_ms(time_logs) -> int | None:
	"""UTC epoch ms for the earliest open repair time log (for live timer)."""
	open_logs = [row for row in (time_logs or []) if _is_open_time_log(row)]
	if not open_logs:
		return None

	starts = []
	for row in open_logs:
		start_time = row.get("start_time") if isinstance(row, dict) else row.start_time
		try:
			starts.append(get_datetime(start_time))
		except Exception:
			continue

	if not starts:
		return None

	return int(min(starts).timestamp() * 1000)


def _repair_technicians(doc):
	technicians = []
	if doc.lead_technician:
		technicians.append(doc.lead_technician)
	for row in doc.assistant_technicians or []:
		tech = (row.technician or "").strip()
		if tech and tech not in technicians:
			technicians.append(tech)
	return technicians


def _insert_repair_time_logs(job_card, technicians, start_time=None):
	start_time = start_time or now_datetime()
	existing = frappe.get_all(
		"DMS Job Card Time Log",
		filters={"parent": job_card},
		fields=["name"],
	)
	base_idx = len(existing)
	for offset, technician in enumerate(technicians, start=1):
		child = frappe.new_doc("DMS Job Card Time Log")
		child.update({
			"parent": job_card,
			"parenttype": "DMS Job Card",
			"parentfield": "time_logs",
			"idx": base_idx + offset,
			"technician": technician,
			"start_time": start_time,
		})
		child.db_insert()


def _technicians_from_time_log_payload(time_logs, doc):
	technicians = []
	for log in time_logs or []:
		tech = (log.get("technician") or "").strip()
		if tech and tech not in technicians:
			technicians.append(tech)
	if technicians:
		return technicians
	return _repair_technicians(doc)


def _validate_required_for_repair_submit(doc):
	missing = []
	if not doc.lead_technician:
		missing.append(_("Lead Technician"))
	if not doc.service_advisor:
		missing.append(_("Service Advisor"))
	if missing:
		frappe.throw(
			_("Please fill in the following before starting repair: {0}").format(", ".join(missing))
		)


def _ensure_job_card_submitted_for_repair(doc):
	"""Submit draft job cards when repair starts (schedule times auto-filled if missing)."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
		is_internal_job_card,
		prepare_internal_job_card,
	)

	if doc.docstatus == 1:
		return doc

	doc.check_permission("submit")
	_validate_required_for_repair_submit(doc)

	if is_internal_job_card(doc):
		prepare_internal_job_card(doc)

	if not doc.schedule_start_time:
		doc.schedule_start_time = now_datetime()
	if not doc.schedule_end_time:
		end = doc.promised_delivery_date_time
		if not end and flt(doc.estimated_duration_hours):
			end = add_to_date(doc.schedule_start_time, hours=flt(doc.estimated_duration_hours))
		if not end:
			end = add_to_date(doc.schedule_start_time, hours=48)
		doc.schedule_end_time = end

	doc.save()
	doc.submit()
	doc.reload()
	return doc


@frappe.whitelist()
def start_repair(job_card, time_logs=None):
	doc = frappe.get_doc("DMS Job Card", job_card)
	doc.check_permission("write")
	doc = _ensure_job_card_submitted_for_repair(doc)

	if isinstance(time_logs, str):
		time_logs = json.loads(time_logs) if time_logs else []

	technicians = _technicians_from_time_log_payload(time_logs, doc)
	if not technicians:
		frappe.throw(_("Assign a lead technician before starting repair."))

	repair_started_at = now_datetime()

	# Fresh repair session — replace any existing logs.
	frappe.db.delete("DMS Job Card Time Log", {"parent": job_card})
	doc.reload()

	for tech in technicians:
		doc.append(
			"time_logs",
			{
				"technician": tech,
				"start_time": repair_started_at,
			},
		)

	doc.status = "Repair In Progress"
	doc.flags.ignore_validate_update_after_submit = True
	doc.save()

	frappe.db.commit()

	return {
		"status": "ok",
		"repair_session_start_ms": int(repair_started_at.timestamp() * 1000),
	}


@frappe.whitelist()
def resume_repair(job_card):
	"""Resume repair after pause — append new open time logs without deleting history."""
	doc = frappe.get_doc("DMS Job Card", job_card)
	doc.check_permission("write")
	doc = _ensure_job_card_submitted_for_repair(doc)

	technicians = _repair_technicians(doc)
	if not technicians:
		frappe.throw(_("Assign a lead technician before resuming repair."))

	open_logs = frappe.get_all(
		"DMS Job Card Time Log",
		filters={"parent": job_card, "end_time": ["is", "not set"]},
		pluck="name",
	)
	if open_logs:
		frappe.db.set_value("DMS Job Card", job_card, "status", "Repair In Progress", update_modified=True)
		frappe.db.commit()
		return "ok"

	_insert_repair_time_logs(job_card, technicians)
	frappe.db.set_value("DMS Job Card", job_card, "status", "Repair In Progress", update_modified=True)
	frappe.db.commit()
	return "ok"


@frappe.whitelist()
def pause_repair(job_card, new_status, open_logs=None):
    if isinstance(open_logs, str):
        open_logs = json.loads(open_logs) if open_logs else []

    for log in (open_logs or []):
        row_update = {
            "end_time": log.get("end_time"),
            "duration_hours": flt(log.get("duration_hours")),
            "pause_reason": log.get("pause_reason"),
        }
        if log.get("notes"):
            row_update["notes"] = log.get("notes")
        frappe.db.set_value(
            "DMS Job Card Time Log",
            log.get("name"),
            row_update,
            update_modified=False,
        )

    frappe.db.set_value("DMS Job Card", job_card, "status", new_status, update_modified=True)
    frappe.db.commit()
    return "ok"


@frappe.whitelist()
def stop_repair(job_card, open_logs=None, completed_date_time=None):
    if isinstance(open_logs, str):
        open_logs = json.loads(open_logs) if open_logs else []

    for log in (open_logs or []):
        frappe.db.set_value(
            "DMS Job Card Time Log", log.get("name"),
            {
                "end_time": log.get("end_time"),
                "duration_hours": flt(log.get("duration_hours")),
            },
            update_modified=False
        )

    # Sum ALL logs including previously paused ones
    all_logs = frappe.get_all(
        "DMS Job Card Time Log",
        filters={"parent": job_card},
        fields=["duration_hours"]
    )
    total_hours = sum(flt(l.duration_hours) for l in all_logs)

    frappe.db.set_value("DMS Job Card", job_card, {
        "status": "Repair Completed",
        "actual_duration_hours": total_hours,
        "total_hours": total_hours,
        "completed_date_time": completed_date_time or now_datetime(),
    }, update_modified=True)

    frappe.db.commit()
    return "ok"