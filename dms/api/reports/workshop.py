# Copyright (c) 2026, Mania and contributors
"""Workshop Operations reports — Spec §2.1–2.8."""

from __future__ import annotations

from collections import defaultdict

import frappe
from frappe import _
from frappe.utils import (
	cint,
	date_diff,
	flt,
	get_datetime,
	getdate,
	now_datetime,
	nowdate,
	strip_html,
	time_diff_in_hours,
)

from dms.api.reports.common import (
	OPEN_JOB_CARD_STATUSES,
	_apply_link_display_names,
	_apply_vin_numbers,
	_format_datetime_minute,
	_jc_dimension_conds,
	_jc_filters,
	_jc_sql_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_strip_html,
	_vin_link_filter_value,
)

# Spec §2.1 workflow buckets (display labels)
WIP_STATUS_BUCKETS = {
	"awaiting_inspection": ["Draft", "Open", "Estimation Pending"],
	"awaiting_estimate": ["Estimation Pending"],
	"awaiting_approval": ["Waiting Customer Approval", "Estimation Approved"],
	"awaiting_technician": ["Assigned", "Scheduled", "Open"],
	"diagnosis": ["Estimation Pending"],
	"awaiting_parts": ["Waiting Parts"],
	"repair": ["Repair In Progress"],
	"awaiting_qc": ["Repair Completed", "Road Test Completed", "QC In Progress"],
	"qc_failed": ["QC Failed", "Rework"],
	"ready_for_invoice": ["Completed"],
	"awaiting_payment": [],  # derived from payment_status
	"ready_for_delivery": ["Completed"],
}


def _hours_between(start, end):
	if not start or not end:
		return None
	try:
		hours = flt(time_diff_in_hours(get_datetime(end), get_datetime(start)))
	except Exception:
		return None
	if hours < 0:
		return None
	return round(hours, 2)


def _avg(values):
	vals = [v for v in values if v is not None]
	if not vals:
		return None
	return round(sum(vals) / len(vals), 2)


def _promise_alert(promised, now=None):
	"""Spec §2.1 visual alerts: normal / approaching / delayed / critically_delayed."""
	if not promised:
		return "normal"
	now = now or now_datetime()
	try:
		promised_dt = get_datetime(promised)
	except Exception:
		return "normal"
	hours_left = time_diff_in_hours(promised_dt, now)
	if hours_left < -24:
		return "critically_delayed"
	if hours_left < 0:
		return "delayed"
	if hours_left <= 4:
		return "approaching"
	return "normal"


def _latest_status_entered_map(jc_names):
	"""Map job_card → datetime when current status was entered (from status_log)."""
	if not jc_names or not frappe.db.exists("DocType", "DMS Job Card Status Log"):
		return {}
	rows = frappe.get_all(
		"DMS Job Card Status Log",
		filters={"parent": ["in", jc_names]},
		fields=["parent", "status", "changed_at"],
		order_by="changed_at desc",
		limit=len(jc_names) * 20,
	)
	out = {}
	for row in rows:
		if row.parent in out:
			continue
		out[row.parent] = get_datetime(row.changed_at) if row.changed_at else None
	return out


def _parts_summary_by_job(jc_names):
	"""Aggregate parts availability / reservation for WIP."""
	if not jc_names:
		return {}
	rows = frappe.get_all(
		"Job Card Part Item",
		filters={"parent": ["in", jc_names], "parenttype": "DMS Job Card"},
		fields=["parent", "line_status", "stock_available", "is_backordered", "quantity_requested"],
		limit=20000,
	)
	out = defaultdict(lambda: {"parts_lines": 0, "parts_reserved": 0, "parts_backordered": 0, "parts_short": 0})
	for r in rows:
		s = out[r.parent]
		s["parts_lines"] += 1
		st = (r.line_status or "").strip()
		if st in ("Reserved", "Issued", "Partially Issued"):
			s["parts_reserved"] += 1
		if cint(r.is_backordered) or st == "Backordered":
			s["parts_backordered"] += 1
		if flt(r.stock_available) < flt(r.quantity_requested):
			s["parts_short"] += 1
	return out


def get_daily_wip_report(filters=None):
	"""§2.1 Work in Progress — live control for vehicles in workshop."""
	f = _parse_filters(filters)
	conds = {"status": ["in", OPEN_JOB_CARD_STATUSES]}
	conds.update(_jc_dimension_conds(f))

	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name",
			"status",
			"priority",
			"job_card_type",
			"customer_name",
			"vehicle_model",
			"vehicle_vin",
			"license_plate",
			"service_advisor",
			"lead_technician",
			"assigned_bay",
			"workshop",
			"promised_delivery_date_time",
			"opened_date_time",
			"schedule_end_time",
			"estimated_duration_hours",
			"reason_for_stop",
			"approved_amount",
			"customer_approval_status",
			"invoice",
			"payment_status",
			"net_amount",
			"branch",
			"company",
		],
		order_by="promised_delivery_date_time asc",
		limit=500,
	)

	_apply_link_display_names(
		rows,
		{"service_advisor": "Service Advisor", "lead_technician": "Technician"},
	)
	_apply_vin_numbers(rows)

	jc_names = [r.name for r in rows]
	status_entered = _latest_status_entered_map(jc_names)
	parts_map = _parts_summary_by_job(jc_names)
	now = now_datetime()
	today = getdate(nowdate())

	overdue = 0
	by_status = {}
	by_advisor = {}
	by_technician = {}
	by_bay = {}
	by_alert = {"normal": 0, "approaching": 0, "delayed": 0, "critically_delayed": 0}
	out = []

	for row in rows:
		opened = get_datetime(row.opened_date_time) if row.opened_date_time else None
		hours_in_workshop = (
			round(time_diff_in_hours(now, opened), 2) if opened else None
		)
		days_in_workshop = (
			round(hours_in_workshop / 24, 2) if hours_in_workshop is not None else None
		)
		alert = _promise_alert(row.promised_delivery_date_time, now)
		by_alert[alert] = by_alert.get(alert, 0) + 1
		if alert in ("delayed", "critically_delayed"):
			overdue += 1

		parts = parts_map.get(row.name) or {}
		waiting_reason = strip_html(row.reason_for_stop or "").strip()[:200] or None
		if not waiting_reason and row.status in ("Waiting Parts", "Waiting Customer Approval"):
			waiting_reason = row.status

		est_completion = row.schedule_end_time or row.promised_delivery_date_time

		item = {
			"name": row.name,
			"customer_name": row.customer_name,
			"vin_number": getattr(row, "vin_number", None) or row.vehicle_vin,
			"license_plate": row.license_plate,
			"vehicle_model": row.vehicle_model,
			"service_advisor": row.service_advisor,
			"lead_technician": row.lead_technician,
			"assigned_bay": row.assigned_bay,
			"workshop": row.workshop,
			"opened_date_time": _format_datetime_minute(row.opened_date_time),
			"status": row.status,
			"job_card_type": row.job_card_type,
			"estimated_duration_hours": flt(row.estimated_duration_hours),
			"estimated_completion": _format_datetime_minute(est_completion),
			"promised_delivery_date_time": _format_datetime_minute(row.promised_delivery_date_time),
			"days_in_workshop": days_in_workshop,
			"hours_in_workshop": hours_in_workshop,
			"waiting_reason": waiting_reason,
			"approved_amount": flt(row.approved_amount) or flt(row.net_amount),
			"parts_status": (
				_("Backordered")
				if parts.get("parts_backordered")
				else _("Short")
				if parts.get("parts_short")
				else _("Reserved")
				if parts.get("parts_reserved")
				else _("None")
				if not parts.get("parts_lines")
				else _("Requested")
			),
			"parts_lines": parts.get("parts_lines") or 0,
			"customer_approval_status": row.customer_approval_status or "—",
			"invoice": row.invoice or "",
			"payment_status": row.payment_status or "—",
			"alert": alert,
			"priority": row.priority,
			"branch": getattr(row, "branch", None) or "",
		}
		out.append(item)

		by_status[row.status] = by_status.get(row.status, 0) + 1
		advisor = row.service_advisor or _("Unassigned")
		by_advisor[advisor] = by_advisor.get(advisor, 0) + 1
		tech = row.lead_technician or _("Unassigned")
		by_technician[tech] = by_technician.get(tech, 0) + 1
		bay = row.assigned_bay or _("Unassigned")
		by_bay[bay] = by_bay.get(bay, 0) + 1

	# Awaiting payment derived
	awaiting_payment = sum(
		1
		for r in out
		if (r.get("payment_status") or "") in ("Unpaid", "Partially Paid")
		and r.get("status") in ("Completed", "Repair Completed", "QC In Progress")
	)

	return _result(
		"daily_wip",
		_("Work in Progress Report"),
		f,
		{
			"total_open": len(out),
			"overdue_promised": overdue,
			"awaiting_payment": awaiting_payment,
			"by_status": by_status,
			"by_advisor": by_advisor,
			"by_technician": by_technician,
			"by_bay": by_bay,
			"by_alert": by_alert,
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "license_plate", "label": _("Registration")},
			{"key": "vehicle_model", "label": _("Model")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "lead_technician", "label": _("Technician")},
			{"key": "assigned_bay", "label": _("Bay")},
			{"key": "opened_date_time", "label": _("Received")},
			{"key": "status", "label": _("Status")},
			{"key": "promised_delivery_date_time", "label": _("Promised")},
			{"key": "estimated_completion", "label": _("Est. Completion")},
			{"key": "days_in_workshop", "label": _("Days In")},
			{"key": "hours_in_workshop", "label": _("Hours In")},
			{"key": "waiting_reason", "label": _("Waiting Reason")},
			{"key": "approved_amount", "label": _("Approved Amt")},
			{"key": "parts_status", "label": _("Parts")},
			{"key": "customer_approval_status", "label": _("Approval")},
			{"key": "invoice", "label": _("Invoice")},
			{"key": "payment_status", "label": _("Payment")},
			{"key": "alert", "label": _("Alert")},
		],
		out,
	)


def get_job_card_status_report(filters=None):
	"""§2.2 Job Card Status — ownership and age in current status."""
	f = _parse_filters(filters)
	conds = _jc_filters(f, {"docstatus": ["<", 2]})
	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name",
			"status",
			"job_card_type",
			"priority",
			"customer_name",
			"vehicle_vin",
			"vehicle_model",
			"service_advisor",
			"lead_technician",
			"opened_date_time",
			"completed_date_time",
			"promised_delivery_date_time",
			"invoice",
			"payment_status",
			"customer_approval_status",
			"is_repeat_repair",
		],
		order_by="modified desc",
		limit=2000,
	)
	_apply_link_display_names(
		rows, {"service_advisor": "Service Advisor", "lead_technician": "Technician"}
	)
	_apply_vin_numbers(rows)

	status_entered = _latest_status_entered_map([r.name for r in rows])
	now = now_datetime()

	by_status = {}
	awaiting = {
		"approval": 0,
		"parts": 0,
		"qc": 0,
		"invoice": 0,
		"payment": 0,
		"delivery": 0,
	}
	open_n = closed_n = cancelled_n = reopened_n = 0

	out = []
	for row in rows:
		st = row.status or "—"
		by_status[st] = by_status.get(st, 0) + 1
		if st == "Cancelled":
			cancelled_n += 1
		elif st in ("Completed", "Delivered"):
			closed_n += 1
		elif st in OPEN_JOB_CARD_STATUSES:
			open_n += 1
		if cint(row.is_repeat_repair):
			reopened_n += 1

		if st in ("Waiting Customer Approval",):
			awaiting["approval"] += 1
		if st == "Waiting Parts":
			awaiting["parts"] += 1
		if st in ("QC In Progress", "Repair Completed", "Road Test Completed"):
			awaiting["qc"] += 1
		if st == "Completed" and not (row.invoice or "").strip():
			awaiting["invoice"] += 1
		if (row.payment_status or "") in ("Unpaid", "Partially Paid") and st in (
			"Completed",
			"Delivered",
		):
			awaiting["payment"] += 1
		if st == "Completed" and (row.payment_status or "") in ("Paid", "Internal"):
			awaiting["delivery"] += 1

		entered = status_entered.get(row.name)
		if not entered and row.opened_date_time:
			entered = get_datetime(row.opened_date_time)
		age_hours = round(time_diff_in_hours(now, entered), 2) if entered else None
		age_days = round(age_hours / 24, 2) if age_hours is not None else None

		out.append(
			{
				"name": row.name,
				"status": st,
				"job_card_type": row.job_card_type,
				"customer_name": row.customer_name,
				"vin_number": getattr(row, "vin_number", None) or row.vehicle_vin,
				"service_advisor": row.service_advisor,
				"lead_technician": row.lead_technician,
				"age_in_status_hours": age_hours,
				"age_in_status_days": age_days,
				"promised_delivery_date_time": _format_datetime_minute(
					row.promised_delivery_date_time
				),
				"invoice": row.invoice or "",
				"payment_status": row.payment_status or "",
				"is_repeat_repair": cint(row.is_repeat_repair),
			}
		)

	return _result(
		"job_card_status",
		_("Job Card Status Report"),
		f,
		{
			"total_jobs": len(out),
			"open_jobs": open_n,
			"closed": closed_n,
			"cancelled": cancelled_n,
			"reopened": reopened_n,
			"by_status": by_status,
			"awaiting": awaiting,
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "status", "label": _("Status")},
			{"key": "job_card_type", "label": _("Classification")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "lead_technician", "label": _("Technician")},
			{"key": "age_in_status_days", "label": _("Days In Status")},
			{"key": "age_in_status_hours", "label": _("Hours In Status")},
			{"key": "promised_delivery_date_time", "label": _("Promised")},
			{"key": "invoice", "label": _("Invoice")},
			{"key": "payment_status", "label": _("Payment")},
		],
		out,
	)


def get_vehicle_turnaround_report(filters=None):
	"""§2.3 Vehicle Turnaround Time — stage durations from permanent timestamps only."""
	f = _parse_filters(filters)
	conds = _jc_filters(f, {"docstatus": ["<", 2]})
	jcs = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "customer_name", "vehicle_vin", "vehicle_model", "status",
			"appointment", "inspection", "service_estimate",
			"opened_date_time", "technician_assigned_at", "repair_started_at",
			"completed_date_time", "qc_started_at", "qc_checked_date",
			"invoice", "invoiced_at", "delivery_date_time",
			"service_advisor", "lead_technician", "creation",
		],
		order_by="modified desc",
		limit=1000,
	)
	if not jcs:
		return _result("vehicle_turnaround", _("Vehicle Turnaround Time"), f, {"jobs_measured": 0}, [], [])

	_apply_vin_numbers(jcs)
	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor", "lead_technician": "Technician"})

	jc_names = [r.name for r in jcs]
	appointments = list({r.appointment for r in jcs if r.appointment})
	inspections = list({r.inspection for r in jcs if r.inspection})
	estimates = list({r.service_estimate for r in jcs if r.service_estimate})
	invoices = list({r.invoice for r in jcs if r.invoice})

	sa_map = {}
	if appointments:
		for row in frappe.get_all("Service Appointment", filters={"name": ["in", appointments]}, fields=["name", "arrived_date_time"]):
			sa_map[row.name] = row
	insp_map = {}
	if inspections:
		for row in frappe.get_all(
			"Vehicle Inspection",
			filters={"name": ["in", inspections]},
			fields=["name", "inspection_date", "inspection_completed_date", "creation"],
		):
			insp_map[row.name] = row
	est_map = {}
	if estimates:
		for row in frappe.get_all(
			"DMS Service Estimate",
			filters={"name": ["in", estimates]},
			fields=["name", "creation", "diagnosis_completed_date", "decision_date"],
		):
			est_map[row.name] = row

	repair_start_map = {}
	if jc_names:
		for row in frappe.get_all(
			"DMS Job Card Time Log",
			filters={"parent": ["in", jc_names], "parenttype": "DMS Job Card"},
			fields=["parent", "start_time"],
			order_by="start_time asc",
			limit=20000,
		):
			if row.start_time and row.parent not in repair_start_map:
				repair_start_map[row.parent] = row.start_time

	si_map = {}
	if invoices and frappe.db.exists("DocType", "Sales Invoice"):
		for row in frappe.get_all("Sales Invoice", filters={"name": ["in", invoices]}, fields=["name", "creation"]):
			si_map[row.name] = row

	delivery_map = {}
	if jc_names and frappe.db.exists("DocType", "Vehicle Delivery Note"):
		for row in frappe.get_all(
			"Vehicle Delivery Note",
			filters={"job_card": ["in", jc_names], "docstatus": ["<", 2]},
			fields=["job_card", "delivery_date_time"],
			order_by="creation desc",
			limit=2000,
		):
			if row.job_card and row.job_card not in delivery_map and row.delivery_date_time:
				delivery_map[row.job_card] = row.delivery_date_time

	stage_keys = [
		"hours_arrival_to_inspection", "hours_inspection_to_estimate",
		"hours_estimate_to_approval", "hours_approval_to_job_card",
		"hours_job_card_to_assignment", "hours_assignment_to_repair",
		"hours_repair_start_to_completion", "hours_completion_to_qc",
		"hours_qc_to_invoice", "hours_invoice_to_delivery", "hours_arrival_to_delivery",
	]
	stage_buckets = {k: [] for k in stage_keys}
	out = []
	for jc in jcs:
		sa = sa_map.get(jc.appointment) if jc.appointment else None
		insp = insp_map.get(jc.inspection) if jc.inspection else None
		est = est_map.get(jc.service_estimate) if jc.service_estimate else None
		si = si_map.get(jc.invoice) if jc.invoice else None

		t_arrival = get_datetime(sa.arrived_date_time) if sa and sa.arrived_date_time else None
		t_insp_start = t_insp_done = None
		if insp:
			t_insp_start = get_datetime(insp.inspection_date or insp.creation)
			t_insp_done = get_datetime(insp.inspection_completed_date) if insp.inspection_completed_date else t_insp_start
		t_estimate = get_datetime(est.creation) if est else None
		t_estimate_ready = t_approval = None
		if est:
			t_estimate_ready = get_datetime(est.diagnosis_completed_date) if est.diagnosis_completed_date else t_estimate
			t_approval = get_datetime(est.decision_date) if est.decision_date else None
		t_jc = get_datetime(jc.opened_date_time or jc.creation)
		t_assigned = get_datetime(jc.technician_assigned_at) if getattr(jc, "technician_assigned_at", None) else None
		t_repair_start = None
		if getattr(jc, "repair_started_at", None):
			t_repair_start = get_datetime(jc.repair_started_at)
		elif repair_start_map.get(jc.name):
			t_repair_start = get_datetime(repair_start_map[jc.name])
		t_complete = get_datetime(jc.completed_date_time) if jc.completed_date_time else None
		t_qc = get_datetime(jc.qc_checked_date) if jc.qc_checked_date else None
		if not t_qc and getattr(jc, "qc_started_at", None):
			t_qc = get_datetime(jc.qc_started_at)
		t_invoice = get_datetime(jc.invoiced_at) if getattr(jc, "invoiced_at", None) else (
			get_datetime(si.creation) if si and si.creation else None
		)
		t_delivery = None
		if jc.delivery_date_time:
			t_delivery = get_datetime(jc.delivery_date_time)
		elif delivery_map.get(jc.name):
			t_delivery = get_datetime(delivery_map[jc.name])

		row = {
			"name": jc.name,
			"customer_name": jc.customer_name,
			"vin_number": getattr(jc, "vin_number", None) or jc.vehicle_vin,
			"vehicle_model": jc.vehicle_model,
			"status": jc.status,
			"service_advisor": jc.service_advisor,
			"lead_technician": jc.lead_technician,
			"hours_arrival_to_inspection": _hours_between(t_arrival, t_insp_start),
			"hours_inspection_to_estimate": _hours_between(t_insp_done, t_estimate),
			"hours_estimate_to_approval": _hours_between(t_estimate_ready, t_approval),
			"hours_approval_to_job_card": _hours_between(t_approval, t_jc),
			"hours_job_card_to_assignment": _hours_between(t_jc, t_assigned),
			"hours_assignment_to_repair": _hours_between(t_assigned, t_repair_start),
			"hours_repair_start_to_completion": _hours_between(t_repair_start, t_complete),
			"hours_completion_to_qc": _hours_between(t_complete, t_qc),
			"hours_qc_to_invoice": _hours_between(t_qc, t_invoice),
			"hours_invoice_to_delivery": _hours_between(t_invoice, t_delivery),
			"hours_arrival_to_delivery": _hours_between(t_arrival or t_insp_start or t_jc, t_delivery),
		}
		for k in stage_keys:
			stage_buckets[k].append(row[k])
		out.append(row)

	summary = {
		"jobs_measured": len(out),
		"avg_arrival_to_inspection_h": _avg(stage_buckets["hours_arrival_to_inspection"]),
		"avg_inspection_to_estimate_h": _avg(stage_buckets["hours_inspection_to_estimate"]),
		"avg_estimate_to_approval_h": _avg(stage_buckets["hours_estimate_to_approval"]),
		"avg_approval_to_job_card_h": _avg(stage_buckets["hours_approval_to_job_card"]),
		"avg_repair_start_to_completion_h": _avg(stage_buckets["hours_repair_start_to_completion"]),
		"avg_completion_to_qc_h": _avg(stage_buckets["hours_completion_to_qc"]),
		"avg_qc_to_invoice_h": _avg(stage_buckets["hours_qc_to_invoice"]),
		"avg_invoice_to_delivery_h": _avg(stage_buckets["hours_invoice_to_delivery"]),
		"avg_arrival_to_delivery_h": _avg(stage_buckets["hours_arrival_to_delivery"]),
		"avg_arrival_to_delivery_days": (
			round(_avg(stage_buckets["hours_arrival_to_delivery"]) / 24, 2)
			if _avg(stage_buckets["hours_arrival_to_delivery"]) is not None else None
		),
	}
	return _result(
		"vehicle_turnaround", _("Vehicle Turnaround Time"), f, summary,
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "status", "label": _("Status")},
			{"key": "hours_arrival_to_inspection", "label": _("Arrival→Insp (h)")},
			{"key": "hours_inspection_to_estimate", "label": _("Insp→Estimate (h)")},
			{"key": "hours_estimate_to_approval", "label": _("Estimate→Approval (h)")},
			{"key": "hours_approval_to_job_card", "label": _("Approval→JC (h)")},
			{"key": "hours_job_card_to_assignment", "label": _("JC→Assign (h)")},
			{"key": "hours_assignment_to_repair", "label": _("Assign→Repair (h)")},
			{"key": "hours_repair_start_to_completion", "label": _("Repair→Done (h)")},
			{"key": "hours_completion_to_qc", "label": _("Done→QC (h)")},
			{"key": "hours_qc_to_invoice", "label": _("QC→Invoice (h)")},
			{"key": "hours_invoice_to_delivery", "label": _("Invoice→Delivery (h)")},
			{"key": "hours_arrival_to_delivery", "label": _("Arrival→Delivery (h)")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "lead_technician", "label": _("Technician")},
		],
		out,
	)


def get_aging_report(filters=None):
	f = _parse_filters(filters)
	today = getdate(nowdate())
	aging_filters = {"status": ["in", OPEN_JOB_CARD_STATUSES]}
	aging_filters.update(_jc_dimension_conds(f))
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		aging_filters["vehicle_vin"] = ["in", vin_val]

	rows = frappe.get_all(
		"DMS Job Card",
		filters=aging_filters,
		fields=[
			"name", "status", "customer_name", "vehicle_vin", "license_plate", "vehicle_model",
			"opened_date_time", "reason_for_stop", "assigned_bay", "lead_technician",
			"promised_delivery_date_time",
		],
		order_by="opened_date_time asc",
		limit=500,
	)
	_apply_link_display_names(rows, {"lead_technician": "Technician"})
	_apply_vin_numbers(rows)

	buckets = {"0-3 days": 0, "4-7 days": 0, "8-14 days": 0, "15+ days": 0}
	aged_rows = []
	for jc in rows:
		opened = getdate(jc.opened_date_time) if jc.opened_date_time else today
		days = date_diff(today, opened)
		if days <= 3:
			buckets["0-3 days"] += 1
		elif days <= 7:
			buckets["4-7 days"] += 1
		elif days <= 14:
			buckets["8-14 days"] += 1
		else:
			buckets["15+ days"] += 1
		aged_rows.append({
			**jc,
			"vin_number": getattr(jc, "vin_number", None) or jc.vehicle_vin,
			"days_open": days,
			"reason_for_stop": strip_html(jc.reason_for_stop or "")[:200],
		})

	return _result(
		"aging", _("Aging Report"), f,
		{"total_in_workshop": len(rows), "by_age_bucket": buckets},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "days_open", "label": _("Days Open")},
			{"key": "status", "label": _("Status")},
			{"key": "reason_for_stop", "label": _("Hold Reason")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "lead_technician", "label": _("Technician")},
		],
		aged_rows,
	)


def get_bay_utilization_report(filters=None):
	"""§2.6 Bay Utilization — occupancy from live bay + job cards."""
	f = _parse_filters(filters)
	bay_filters = {"is_active": 1}
	if f.get("branch") and frappe.get_meta("Service Bay").has_field("branch"):
		bay_filters["branch"] = f["branch"]

	bays = frappe.get_all(
		"Service Bay",
		filters=bay_filters,
		fields=[
			"name", "bay_number", "bay_name", "branch", "bay_type",
			"current_status", "current_job_card", "current_vehicle",
			"current_technician", "occupied_from", "estimated_free_time",
		],
		order_by="bay_number asc",
		limit=200,
	)

	# Live occupancy from open job cards
	open_by_bay = defaultdict(list)
	jc_conds = {"status": ["in", OPEN_JOB_CARD_STATUSES], "assigned_bay": ["!=", ""]}
	jc_conds.update(_jc_dimension_conds(f))
	for jc in frappe.get_all(
		"DMS Job Card",
		filters=jc_conds,
		fields=["name", "assigned_bay", "status", "vehicle_vin", "opened_date_time"],
		limit=1000,
	):
		open_by_bay[jc.assigned_bay].append(jc)

	total = len(bays)
	occupied = 0
	available = 0
	blocked = 0
	waiting_parts_in_bay = 0
	rows = []
	now = now_datetime()

	for bay in bays:
		live = open_by_bay.get(bay.name) or open_by_bay.get(bay.bay_number) or []
		status = (bay.current_status or "").strip() or ("Occupied" if live else "Available")
		if live and status == "Available":
			status = "Occupied"
		is_occ = status == "Occupied" or bool(live)
		is_blocked = status in ("Maintenance", "Reserved", "Cleaning")
		if is_occ:
			occupied += 1
		elif is_blocked:
			blocked += 1
		else:
			available += 1

		wp = sum(1 for j in live if j.status == "Waiting Parts")
		waiting_parts_in_bay += wp

		occupied_from = bay.occupied_from
		if not occupied_from and live:
			starts = [get_datetime(j.opened_date_time) for j in live if j.opened_date_time]
			occupied_from = min(starts) if starts else None
		idle_hours = None
		if status == "Available" and bay.estimated_free_time:
			try:
				idle_hours = round(max(0, time_diff_in_hours(now, get_datetime(bay.estimated_free_time))), 2)
			except Exception:
				idle_hours = None
		occ_hours = (
			round(time_diff_in_hours(now, get_datetime(occupied_from)), 2)
			if occupied_from and is_occ else None
		)

		rows.append({
			"bay": bay.bay_name or bay.bay_number or bay.name,
			"bay_type": bay.bay_type,
			"branch": bay.branch or "",
			"status": status,
			"current_job_card": (live[0].name if live else bay.current_job_card) or "",
			"vehicles": len(live),
			"waiting_parts_vehicles": wp,
			"occupied_hours": occ_hours,
			"idle_hours": idle_hours,
			"blocked": 1 if is_blocked else 0,
		})

	util_pct = round((occupied / total) * 100, 1) if total else 0
	return _result(
		"bay_utilization", _("Bay Utilization Report"), f,
		{
			"total_bays": total,
			"occupied_bays": occupied,
			"available_bays": available,
			"blocked_bays": blocked,
			"utilization_pct": util_pct,
			"avg_occupancy": util_pct,
			"vehicles_waiting_parts_in_bay": waiting_parts_in_bay,
			"vehicles_per_bay": round(sum(r["vehicles"] for r in rows) / total, 2) if total else 0,
		},
		[
			{"key": "bay", "label": _("Bay")},
			{"key": "bay_type", "label": _("Type")},
			{"key": "status", "label": _("Status")},
			{"key": "current_job_card", "label": _("Job Card")},
			{"key": "vehicles", "label": _("Vehicles")},
			{"key": "waiting_parts_vehicles", "label": _("Waiting Parts")},
			{"key": "occupied_hours", "label": _("Occupied (h)")},
			{"key": "idle_hours", "label": _("Idle (h)")},
			{"key": "blocked", "label": _("Blocked")},
		],
		rows,
	)


def get_repair_delay_report(filters=None):
	"""§2.7 Repair Delay — jobs past promised completion."""
	f = _parse_filters(filters)
	now = now_datetime()
	conds = {
		"status": ["in", OPEN_JOB_CARD_STATUSES],
		"promised_delivery_date_time": ["<", now],
	}
	conds.update(_jc_dimension_conds(f))

	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "status", "customer_name", "vehicle_vin", "vehicle_model", "license_plate",
			"promised_delivery_date_time", "reason_for_stop", "delay_department",
			"delay_corrective_action", "customer_notified", "service_advisor", "lead_technician",
			"assigned_bay", "opened_date_time",
		],
		order_by="promised_delivery_date_time asc",
		limit=500,
	)
	_apply_link_display_names(rows, {"service_advisor": "Service Advisor", "lead_technician": "Technician"})
	_apply_vin_numbers(rows)

	out = []
	by_dept = {}
	for r in rows:
		promised = get_datetime(r.promised_delivery_date_time) if r.promised_delivery_date_time else None
		delay_h = round(time_diff_in_hours(now, promised), 2) if promised else None
		dept = (getattr(r, "delay_department", None) or "").strip() or _("Unassigned")
		by_dept[dept] = by_dept.get(dept, 0) + 1
		# Infer department from status when blank
		inferred = dept
		if dept == _("Unassigned"):
			if r.status == "Waiting Parts":
				inferred = "Parts"
			elif r.status == "Waiting Customer Approval":
				inferred = "Customer"
			elif r.status in ("QC In Progress", "QC Failed"):
				inferred = "QC"
			elif r.status == "Repair In Progress":
				inferred = "Workshop"
			else:
				inferred = "Service Advisor"
		out.append({
			"name": r.name,
			"customer_name": r.customer_name,
			"vin_number": getattr(r, "vin_number", None) or r.vehicle_vin,
			"vehicle_model": r.vehicle_model,
			"promised_delivery_date_time": _format_datetime_minute(r.promised_delivery_date_time),
			"status": r.status,
			"delay_hours": delay_h,
			"delay_days": round(delay_h / 24, 2) if delay_h is not None else None,
			"delay_department": inferred,
			"delay_reason": strip_html(r.reason_for_stop or "")[:300] or r.status,
			"corrective_action": getattr(r, "delay_corrective_action", None) or "",
			"customer_notified": "Yes" if cint(getattr(r, "customer_notified", 0)) else "No",
			"service_advisor": r.service_advisor,
			"lead_technician": r.lead_technician,
		})

	return _result(
		"repair_delay", _("Repair Delay Report"), f,
		{
			"delayed_jobs": len(out),
			"avg_delay_hours": _avg([r["delay_hours"] for r in out]),
			"by_department": by_dept,
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "vehicle_model", "label": _("Model")},
			{"key": "promised_delivery_date_time", "label": _("Promised")},
			{"key": "status", "label": _("Status")},
			{"key": "delay_hours", "label": _("Delay (h)")},
			{"key": "delay_days", "label": _("Delay (d)")},
			{"key": "delay_department", "label": _("Department")},
			{"key": "delay_reason", "label": _("Reason")},
			{"key": "corrective_action", "label": _("Corrective Action")},
			{"key": "customer_notified", "label": _("Customer Notified")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "lead_technician", "label": _("Technician")},
		],
		out,
	)


def get_repeat_repair_report(filters=None):
	"""§2.8 Repeat Repair / Comeback."""
	f = _parse_filters(filters)
	# Optional return window (days) from filters payload
	raw = filters if isinstance(filters, dict) else {}
	if isinstance(filters, str):
		import json
		raw = json.loads(filters) if filters else {}
	window_days = cint(raw.get("return_window_days") or raw.get("return_window") or 0)

	dim_sql, dim_params = _jc_sql_filters(f, "jc")
	params = {"from_date": f["from_date"], "to_date": f["to_date"], **dim_params}

	rows = frappe.db.sql(
		f"""
		SELECT
			jc.name, jc.posting_date, jc.vehicle_vin, jc.vehicle_model, jc.license_plate,
			jc.lead_technician, jc.service_advisor, jc.repeat_repair_reference,
			jc.job_card_type, jc.net_amount, jc.total_parts_cost, jc.total_labor_cost,
			jc.warranty_application_type,
			(
				SELECT ji.complaint_description FROM `tabJob Card Item` ji
				WHERE ji.parent = jc.name AND ji.parenttype = 'DMS Job Card'
				ORDER BY ji.idx ASC LIMIT 1
			) AS complaint_description,
			(
				SELECT ji.symptom_category FROM `tabJob Card Item` ji
				WHERE ji.parent = jc.name AND ji.parenttype = 'DMS Job Card'
				ORDER BY ji.idx ASC LIMIT 1
			) AS symptom_category
		FROM `tabDMS Job Card` jc
		WHERE jc.is_repeat_repair = 1
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.docstatus < 2
		  {dim_sql}
		ORDER BY jc.posting_date DESC
		LIMIT 300
		""",
		params,
		as_dict=True,
	)

	_apply_link_display_names(rows, {"lead_technician": "Technician", "service_advisor": "Service Advisor"})
	_apply_vin_numbers(rows)

	# Original complaints + window filter
	orig_names = [r.repeat_repair_reference for r in rows if r.repeat_repair_reference]
	orig_map = {}
	orig_dates = {}
	if orig_names:
		for o in frappe.get_all(
			"DMS Job Card",
			filters={"name": ["in", orig_names]},
			fields=["name", "posting_date"],
		):
			orig_dates[o.name] = o.posting_date
		orig_complaints = frappe.db.sql(
			"""
			SELECT parent, complaint_description FROM `tabJob Card Item`
			WHERE parent IN %(names)s AND parenttype = 'DMS Job Card'
			ORDER BY idx ASC
			""",
			{"names": orig_names},
			as_dict=True,
		)
		for c in orig_complaints:
			if c.parent not in orig_map:
				orig_map[c.parent] = _strip_html(c.complaint_description)[:400]

	# Parts on repeat JC
	parts_by_jc = defaultdict(list)
	if rows:
		for p in frappe.get_all(
			"Job Card Part Item",
			filters={"parent": ["in", [r.name for r in rows]], "parenttype": "DMS Job Card"},
			fields=["parent", "item_code", "part_name", "quantity_issued", "total_amount"],
			limit=5000,
		):
			parts_by_jc[p.parent].append(
				f"{p.item_code or p.part_name}×{flt(p.quantity_issued) or 1}"
			)

	out = []
	by_vin = {}
	by_tech = {}
	total_cost = 0.0
	for r in rows:
		ref = r.repeat_repair_reference
		if window_days and ref and orig_dates.get(ref) and r.posting_date:
			gap = date_diff(getdate(r.posting_date), getdate(orig_dates[ref]))
			if gap > window_days:
				continue
		cost = flt(r.net_amount) or (flt(r.total_parts_cost) + flt(r.total_labor_cost))
		total_cost += cost
		warranty = (r.warranty_application_type or "").strip()
		classification = "Warranty" if warranty else (
			"Goodwill" if (r.job_card_type or "") == "Goodwill" else (r.job_card_type or "Customer Paid")
		)
		vin = r.vin_number or r.vehicle_vin or "—"
		by_vin[vin] = by_vin.get(vin, 0) + 1
		tech = r.lead_technician or "—"
		by_tech[tech] = by_tech.get(tech, 0) + 1
		out.append({
			"name": r.name,
			"posting_date": r.posting_date,
			"repeat_repair_reference": ref or "",
			"original_complaint": orig_map.get(ref, ""),
			"repeat_complaint": _strip_html(r.complaint_description)[:400],
			"symptom_category": r.symptom_category or "",
			"vin_number": vin,
			"vehicle_model": r.vehicle_model,
			"lead_technician": r.lead_technician,
			"service_advisor": r.service_advisor,
			"parts_replaced": ", ".join(parts_by_jc.get(r.name) or [])[:300],
			"comeback_cost": round(cost, 2),
			"classification": classification,
			"root_cause": r.symptom_category or "",
			"corrective_action": "",
		})

	return _result(
		"repeat_repair", _("Repeat Repair and Comeback Report"), f,
		{
			"total_repeat_repairs": len(out),
			"total_comeback_cost": round(total_cost, 2),
			"by_vin": by_vin,
			"by_technician": by_tech,
			"return_window_days": window_days or None,
		},
		[
			{"key": "name", "label": _("Repeat JC")},
			{"key": "repeat_repair_reference", "label": _("Original JC")},
			{"key": "posting_date", "label": _("Date")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "original_complaint", "label": _("Original Complaint")},
			{"key": "repeat_complaint", "label": _("Repeat Complaint")},
			{"key": "lead_technician", "label": _("Technician")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "parts_replaced", "label": _("Parts Replaced")},
			{"key": "comeback_cost", "label": _("Comeback Cost")},
			{"key": "classification", "label": _("Classification")},
			{"key": "root_cause", "label": _("Root Cause")},
		],
		out,
	)


def get_workshop_dashboard(filters=None):
	f = _parse_filters(filters)
	wip = get_daily_wip_report(f)
	aging = get_aging_report(f)
	delay = get_repair_delay_report(f)
	return {
		"section_id": "workshop",
		"title": _("Workshop"),
		"filters": _report_filters_response(f),
		"summary": {
			"open_job_cards": wip["summary"].get("total_open", 0),
			"overdue_promised": wip["summary"].get("overdue_promised", 0),
			"delayed_jobs": delay["summary"].get("delayed_jobs", 0),
			"total_in_workshop": aging["summary"].get("total_in_workshop", 0),
			"by_status": wip["summary"].get("by_status", {}),
			"by_bay": wip["summary"].get("by_bay", {}),
			"by_alert": wip["summary"].get("by_alert", {}),
			"by_age_bucket": aging["summary"].get("by_age_bucket", {}),
		},
	}


REPORT_HANDLERS = {
	"daily_wip": get_daily_wip_report,
	"job_card_status": get_job_card_status_report,
	"vehicle_turnaround": get_vehicle_turnaround_report,
	"aging": get_aging_report,
	"bay_utilization": get_bay_utilization_report,
	"repair_delay": get_repair_delay_report,
	"repeat_repair": get_repeat_repair_report,
}
