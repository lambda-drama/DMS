# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, now_datetime

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


def stamp_job_card_timestamp(job_card, fieldname, when=None, *, only_if_empty=True):
	"""Persist a permanent journey timestamp on DMS Job Card (never overwrite if set)."""
	name = job_card if isinstance(job_card, str) else getattr(job_card, "name", None)
	if not name or not fieldname:
		return False
	if not frappe.get_meta("DMS Job Card").has_field(fieldname):
		return False
	when = when or now_datetime()
	if only_if_empty:
		existing = frappe.db.get_value("DMS Job Card", name, fieldname)
		if existing:
			return False
	frappe.db.set_value("DMS Job Card", name, fieldname, when, update_modified=False)
	if not isinstance(job_card, str) and hasattr(job_card, "set"):
		job_card.set(fieldname, when)
	return True


def log_job_card_status_change(job_card, new_status, previous_status=None, when=None, notes=None):
	"""Append a permanent status-change row (Spec §2.3 — do not rely on editable text)."""
	name = job_card if isinstance(job_card, str) else getattr(job_card, "name", None)
	new_status = (new_status or "").strip()
	if not name or not new_status:
		return
	if not frappe.db.exists("DocType", "DMS Job Card Status Log"):
		return
	when = when or now_datetime()
	if previous_status is None:
		previous_status = frappe.db.get_value("DMS Job Card", name, "status") or ""
	if (previous_status or "") == new_status:
		# Still allow first log when table empty
		existing = frappe.db.count("DMS Job Card Status Log", {"parent": name})
		if existing:
			return

	idx = cint(frappe.db.sql(
		"SELECT MAX(idx) FROM `tabDMS Job Card Status Log` WHERE parent=%s", name
	)[0][0] or 0) + 1
	child = frappe.get_doc({
		"doctype": "DMS Job Card Status Log",
		"parent": name,
		"parenttype": "DMS Job Card",
		"parentfield": "status_log",
		"idx": idx,
		"status": new_status,
		"previous_status": previous_status or "",
		"changed_at": when,
		"changed_by": frappe.session.user,
		"notes": notes or "",
	})
	child.db_insert()

	# Mirror key journey stamps from status transitions
	status_to_field = {
		"Assigned": "technician_assigned_at",
		"Repair In Progress": "repair_started_at",
		"QC In Progress": "qc_started_at",
		"Repair Completed": "completed_date_time",
		"Completed": "completed_date_time",
		"Delivered": "delivery_date_time",
	}
	field = status_to_field.get(new_status)
	if field:
		stamp_job_card_timestamp(name, field, when)


def reverse_job_card_cancel_side_effects(job_card_name: str) -> list[str]:
	"""Reverse stock and cancel parts requests. Idempotent."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
		cancel_job_card_stock_transfers,
	)
	from dms.dealer_management_system.doctype.dms_parts_request.parts_workflow import (
		_CANCELLABLE_PARTS_REQUEST_STATUSES,
		cancel_parts_request,
	)

	cancelled_stock = cancel_job_card_stock_transfers(job_card_name)

	open_prs = frappe.get_all(
		"DMS Parts Request",
		filters={
			"job_card": job_card_name,
			"status": ["in", list(_CANCELLABLE_PARTS_REQUEST_STATUSES)],
		},
		pluck="name",
	)
	for pr_name in open_prs:
		try:
			cancel_parts_request(pr_name)
		except Exception:
			frappe.log_error(frappe.get_traceback(), "cancel_job_card parts request")

	issued_prs = frappe.get_all(
		"DMS Parts Request",
		filters={
			"job_card": job_card_name,
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

	return cancelled_stock


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

		from dms.dealer_management_system.doctype.dms_job_card_terms.dms_job_card_terms import (
			apply_job_card_terms,
		)

		apply_job_card_terms(self)
		self.apply_job_card_warehouse_to_parts()
		self.ensure_qc_results_from_template()
		self.validate_qc_measurements()
		self.validate_inspection_for_job_type()
		self.validate_internal_workflow()
		self.calculate_costing_and_totals()
		self.stamp_journey_timestamps()
		self._queue_status_log()

	def after_insert(self):
		if self.status:
			log_job_card_status_change(self.name, self.status, previous_status="")
		self.sync_vin_odometer_from_job_card()

	def copy_attachments_from_amended_from(self):
		"""Copy files from the cancelled source. Missing disks files must not block Amend."""
		from frappe.desk.form.load import get_attachments

		if not self.amended_from:
			return

		for attach_item in get_attachments(self.doctype, self.amended_from):
			file_url = attach_item.file_url
			try:
				file_doc = frappe.get_doc("File", attach_item.name)
				if not file_doc.is_remote_file and not file_doc.exists_on_disk():
					frappe.logger("dms").warning(
						"Amend %s: skip missing attachment %s",
						self.amended_from,
						file_url,
					)
					continue
				file_doc.create_attachment_copy(
					self.doctype, self.name, ignore_permissions=True
				)
			except Exception:
				frappe.logger("dms").warning(
					"Amend %s: could not copy attachment %s",
					self.amended_from,
					file_url,
					exc_info=True,
				)

	def on_update(self):
		pending = getattr(self.flags, "pending_status_log", None)
		if pending:
			log_job_card_status_change(
				self.name,
				pending.get("status"),
				previous_status=pending.get("previous_status"),
			)
			self.flags.pending_status_log = None
		if self.has_value_changed("current_odometer"):
			self.sync_vin_odometer_from_job_card()

	def sync_vin_odometer_from_job_card(self):
		"""Push job-card odometer to VIN when higher (UI reading must stick on vehicle)."""
		vin = (self.vehicle_vin or "").strip()
		odo = self.current_odometer
		if not vin or odo is None or odo == "":
			return
		if not frappe.db.exists("VIN No", vin):
			return
		new_odo = cint(odo)
		if new_odo <= 0:
			return
		old_odo = cint(frappe.db.get_value("VIN No", vin, "current_odometer") or 0)
		if new_odo < old_odo:
			return
		if new_odo == old_odo:
			return
		values = {"current_odometer": new_odo}
		if frappe.get_meta("VIN No").has_field("odometer_last_updated"):
			values["odometer_last_updated"] = now_datetime()
		frappe.db.set_value("VIN No", vin, values, update_modified=True)

	def _queue_status_log(self):
		if self.is_new():
			return
		if not self.has_value_changed("status"):
			return
		prev = self.get_db_value("status")
		self.flags.pending_status_log = {
			"status": self.status,
			"previous_status": prev or "",
		}

	def before_cancel(self):
		"""Desk or API cancel: keep workflow status in sync with docstatus 2."""
		self.status = "Cancelled"
		if not getattr(self.flags, "skip_cancel_side_effects", False):
			reverse_job_card_cancel_side_effects(self.name)

	def on_cancel(self):
		prev = None
		before = self.get_doc_before_save()
		if before:
			prev = before.status
		log_job_card_status_change(
			self.name,
			"Cancelled",
			previous_status=prev,
			notes=getattr(self.flags, "cancel_reason", None),
		)

	def stamp_journey_timestamps(self):
		"""Auto-stamp permanent TAT fields from document state (first write wins)."""
		now = now_datetime()
		if self.lead_technician and not self.get("technician_assigned_at"):
			self.technician_assigned_at = now
		if self.status == "QC In Progress" and not self.get("qc_started_at"):
			self.qc_started_at = now
		if self.invoice and not self.get("invoiced_at"):
			self.invoiced_at = now
		if self.status == "Delivered" and not self.get("delivery_date_time"):
			self.delivery_date_time = now

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
			# Discount is optional — if none set yet, charge full amount.
			if discount_amount < 1:
				self.net_amount = round(total_amount, 2)
			else:
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
					"section_classification": item.get("section_classification") or "",
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
	posting_date=None,
	exclude_rows=None,
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
		posting_date=posting_date or None,
		exclude_rows=exclude_rows,
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
from frappe.utils import add_to_date, flt, get_datetime, now_datetime, time_diff_in_hours


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


def _duration_hours(start_time, end_time) -> float:
	"""Hours between two datetimes; never negative (guards timezone/clock glitches)."""
	if not start_time or not end_time:
		return 0.0
	try:
		hours = flt(time_diff_in_hours(get_datetime(end_time), get_datetime(start_time)))
	except Exception:
		return 0.0
	return round(max(0.0, hours), 2)


def _close_open_time_logs(job_card, open_logs=None, end_time=None):
	"""Close open repair logs using server time (same TZ as start_time stamps).

	Client-sent end_time/duration are ignored for the clock — browsers often send
	UTC via toISOString while start_time was stamped with now_datetime() (system TZ),
	which produces negative durations.
	"""
	end_time = end_time or now_datetime()
	if isinstance(open_logs, str):
		open_logs = json.loads(open_logs) if open_logs else []

	payload_by_name = {}
	for log in open_logs or []:
		name = (log or {}).get("name")
		if name:
			payload_by_name[name] = log

	rows = frappe.get_all(
		"DMS Job Card Time Log",
		filters={"parent": job_card},
		fields=["name", "start_time", "end_time"],
	)

	# If client named specific open logs, close those; otherwise close every open log.
	targets = []
	for row in rows:
		if not _is_open_time_log(row):
			continue
		if payload_by_name and row.name not in payload_by_name:
			continue
		targets.append(row)

	closed = []
	for row in targets:
		meta = payload_by_name.get(row.name) or {}
		row_update = {
			"end_time": end_time,
			"duration_hours": _duration_hours(row.start_time, end_time),
		}
		if meta.get("pause_reason"):
			row_update["pause_reason"] = meta.get("pause_reason")
		if meta.get("notes"):
			row_update["notes"] = meta.get("notes")
		frappe.db.set_value(
			"DMS Job Card Time Log",
			row.name,
			row_update,
			update_modified=False,
		)
		closed.append(row.name)
	return closed, end_time


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
	if not doc.assigned_bay:
		missing.append(_("Assigned Service Bay"))
	if not doc.service_advisor:
		missing.append(_("Service Advisor"))
	if missing:
		frappe.throw(
			_("Please fill in the following before starting repair: {0}").format(", ".join(missing))
		)


def _assert_workshop_warehouse_for_repair(doc):
	from dms.api.job_cards import _sync_workshop_warehouse_from_bay
	from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
		resolve_workshop_warehouse,
	)

	if (doc.assigned_bay or "").strip() and not (doc.warehouse or "").strip():
		_sync_workshop_warehouse_from_bay(doc, doc.assigned_bay)
		if doc.name and doc.docstatus == 1 and ((doc.workshop or "").strip() or (doc.warehouse or "").strip()):
			updates = {}
			if doc.workshop:
				updates["workshop"] = doc.workshop
			if doc.warehouse:
				updates["warehouse"] = doc.warehouse
			if updates:
				frappe.db.set_value("DMS Job Card", doc.name, updates, update_modified=False)

	if resolve_workshop_warehouse(doc):
		return

	workshop = (doc.workshop or "").strip()
	if workshop:
		frappe.throw(
			_("Kindly add a warehouse on Workshop {0} before starting repair.").format(
				frappe.bold(workshop)
			),
			title=_("Warehouse required"),
		)
	frappe.throw(
		_("Assign a service bay linked to a Workshop with a warehouse before starting repair."),
		title=_("Warehouse required"),
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
	_assert_workshop_warehouse_for_repair(doc)
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
	if not doc.get("repair_started_at"):
		doc.repair_started_at = repair_started_at
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
		prev = frappe.db.get_value("DMS Job Card", job_card, "status")
		frappe.db.set_value("DMS Job Card", job_card, "status", "Repair In Progress", update_modified=True)
		log_job_card_status_change(job_card, "Repair In Progress", previous_status=prev)
		frappe.db.commit()
		return "ok"

	_insert_repair_time_logs(job_card, technicians)
	prev = frappe.db.get_value("DMS Job Card", job_card, "status")
	frappe.db.set_value("DMS Job Card", job_card, "status", "Repair In Progress", update_modified=True)
	log_job_card_status_change(job_card, "Repair In Progress", previous_status=prev)
	frappe.db.commit()
	return "ok"


@frappe.whitelist()
def pause_repair(job_card, new_status, open_logs=None):
	prev = frappe.db.get_value("DMS Job Card", job_card, "status")
	_close_open_time_logs(job_card, open_logs=open_logs)
	frappe.db.set_value("DMS Job Card", job_card, "status", new_status, update_modified=True)
	log_job_card_status_change(job_card, new_status, previous_status=prev)
	frappe.db.commit()
	return "ok"


@frappe.whitelist()
def stop_repair(job_card, open_logs=None, completed_date_time=None):
	# Always stamp completion with server time so it matches start_time timezone.
	prev = frappe.db.get_value("DMS Job Card", job_card, "status")
	_, completed_at = _close_open_time_logs(job_card, open_logs=open_logs)

	all_logs = frappe.get_all(
		"DMS Job Card Time Log",
		filters={"parent": job_card},
		fields=["duration_hours"],
	)
	total_hours = round(sum(flt(l.duration_hours) for l in all_logs), 2)

	frappe.db.set_value(
		"DMS Job Card",
		job_card,
		{
			"status": "Repair Completed",
			"actual_duration_hours": total_hours,
			"total_hours": total_hours,
			"completed_date_time": completed_at,
		},
		update_modified=True,
	)
	log_job_card_status_change(job_card, "Repair Completed", previous_status=prev, when=completed_at)

	frappe.db.commit()
	return "ok"