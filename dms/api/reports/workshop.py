# Copyright (c) 2026, Mania and contributors
"""Workshop Operations reports and dashboard."""

from __future__ import annotations

import datetime

import frappe
from frappe import _
from frappe.utils import (
	cint,
	date_diff,
	flt,
	get_datetime,
	getdate,
	nowdate,
	time_diff_in_hours,
)

from dms.api.reports.common import (
	OPEN_JOB_CARD_STATUSES,
	_apply_link_display_names,
	_apply_vin_numbers,
	_bulk_full_names,
	_jc_dimension_conds,
	_jc_filters,
	_jc_sql_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_strip_html,
	_vin_link_filter_value,
	_vin_sql_clause,
)

def get_daily_wip_report(filters=None):
	f = _parse_filters(filters)
	conds = {"status": ["in", OPEN_JOB_CARD_STATUSES]}
	conds.update(_jc_dimension_conds(f))

	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "status", "priority", "customer_name", "vehicle_model",
			"vehicle_vin", "license_plate", "service_advisor", "lead_technician", "assigned_bay",
			"promised_delivery_date_time", "opened_date_time", "posting_date",
		],
		order_by="promised_delivery_date_time asc",
		limit=500,
	)

	_apply_link_display_names(
		rows,
		{"service_advisor": "Service Advisor", "lead_technician": "Technician"},
	)
	_apply_vin_numbers(rows)

	today = getdate(nowdate())
	overdue = 0
	by_status = {}
	by_advisor = {}
	by_technician = {}
	by_bay = {}

	for row in rows:
		if row.promised_delivery_date_time:
			pd = getdate(row.promised_delivery_date_time)
			if pd < today:
				overdue += 1
		by_status[row.status] = by_status.get(row.status, 0) + 1
		advisor = row.service_advisor or _("Unassigned")
		by_advisor[advisor] = by_advisor.get(advisor, 0) + 1
		tech = row.lead_technician or _("Unassigned")
		by_technician[tech] = by_technician.get(tech, 0) + 1
		bay = row.assigned_bay or _("Unassigned")
		by_bay[bay] = by_bay.get(bay, 0) + 1

	return {
		"report_id": "daily_wip",
		"title": "Daily WIP Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_open": len(rows),
			"overdue_promised": overdue,
			"by_status": by_status,
			"by_advisor": by_advisor,
			"by_technician": by_technician,
			"by_bay": by_bay,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "customer_name", "label": "Customer"},
			{"key": "vehicle_model", "label": "Model"},
			{"key": "service_advisor", "label": "Advisor"},
			{"key": "lead_technician", "label": "Technician"},
			{"key": "assigned_bay", "label": "Bay"},
			{"key": "promised_delivery_date_time", "label": "Promised Delivery"},
		],
		"rows": rows,
	}

def get_job_card_status_report(filters=None):
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
			"posting_date",
		],
		order_by="modified desc",
		limit=2000,
	)
	_apply_link_display_names(
		rows, {"service_advisor": "Service Advisor", "lead_technician": "Technician"}
	)
	_apply_vin_numbers(rows)

	by_status = {}
	for row in rows:
		by_status[row.status or "—"] = by_status.get(row.status or "—", 0) + 1
		opened = get_datetime(row.opened_date_time) if row.opened_date_time else None
		row["days_in_status"] = (
			round(time_diff_in_hours(frappe.utils.now_datetime(), opened) / 24, 1) if opened else None
		)

	return _result(
		"job_card_status",
		_("Job Card Status Report"),
		f,
		{
			"total_jobs": len(rows),
			"open_jobs": sum(1 for r in rows if (r.status or "") in OPEN_JOB_CARD_STATUSES),
			"completed": sum(1 for r in rows if r.status == "Completed"),
			"cancelled": sum(1 for r in rows if r.status == "Cancelled"),
			"by_status": by_status,
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "status", "label": _("Status")},
			{"key": "job_card_type", "label": _("Type")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "lead_technician", "label": _("Technician")},
			{"key": "days_in_status", "label": _("Days Open")},
			{"key": "promised_delivery_date_time", "label": _("Promised")},
		],
		rows,
	)

def get_vehicle_turnaround_report(filters=None):
	"""Stage durations from available job-card timestamps (best-effort)."""
	f = _parse_filters(filters)
	conds = _jc_filters(
		f,
		{
			"docstatus": ["<", 2],
			"status": ["in", ["Completed", "Delivered", "QC In Progress", "Repair Completed"]],
		},
	)
	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name",
			"customer_name",
			"vehicle_vin",
			"vehicle_model",
			"status",
			"opened_date_time",
			"schedule_start_time",
			"completed_date_time",
			"promised_delivery_date_time",
			"service_advisor",
			"lead_technician",
		],
		order_by="completed_date_time desc",
		limit=1000,
	)
	_apply_vin_numbers(rows)
	_apply_link_display_names(
		rows, {"service_advisor": "Service Advisor", "lead_technician": "Technician"}
	)

	total_hours = []
	out = []
	for row in rows:
		opened = get_datetime(row.opened_date_time) if row.opened_date_time else None
		started = get_datetime(row.schedule_start_time) if row.schedule_start_time else None
		completed = get_datetime(row.completed_date_time) if row.completed_date_time else None
		open_to_start = (
			round(time_diff_in_hours(started, opened), 2) if opened and started else None
		)
		start_to_complete = (
			round(time_diff_in_hours(completed, started), 2) if started and completed else None
		)
		total = round(time_diff_in_hours(completed, opened), 2) if opened and completed else None
		if total is not None:
			total_hours.append(total)
		out.append(
			{
				**row,
				"hours_open_to_start": open_to_start,
				"hours_repair": start_to_complete,
				"hours_total": total,
			}
		)

	avg_total = round(sum(total_hours) / len(total_hours), 2) if total_hours else 0
	return _result(
		"vehicle_turnaround",
		_("Vehicle Turnaround Time"),
		f,
		{
			"jobs_measured": len(total_hours),
			"avg_total_hours": avg_total,
			"avg_total_days": round(avg_total / 24, 2) if avg_total else 0,
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "status", "label": _("Status")},
			{"key": "hours_open_to_start", "label": _("Open→Start (h)")},
			{"key": "hours_repair", "label": _("Repair (h)")},
			{"key": "hours_total", "label": _("Total (h)")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "lead_technician", "label": _("Technician")},
		],
		out,
	)

def get_aging_report(filters=None):
	f = _parse_filters(filters)
	today = getdate(nowdate())
	aging_filters = {"status": ["in", OPEN_JOB_CARD_STATUSES]}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		aging_filters["vehicle_vin"] = ["in", vin_val]

	rows = frappe.get_all(
		"DMS Job Card",
		filters=aging_filters,
		fields=[
			"name", "status", "customer_name", "vehicle_vin", "license_plate", "vehicle_model",
			"opened_date_time", "reason_for_stop", "assigned_bay", "lead_technician",
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
		aged_rows.append({**jc, "days_open": days})

	return {
		"report_id": "aging",
		"title": "Aging Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_in_workshop": len(rows),
			"by_age_bucket": buckets,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "days_open", "label": "Days Open"},
			{"key": "status", "label": "Status"},
			{"key": "reason_for_stop", "label": "Hold Reason"},
			{"key": "customer_name", "label": "Customer"},
			{"key": "lead_technician", "label": "Technician"},
		],
		"rows": aged_rows,
	}

def get_repeat_repair_report(filters=None):
	f = _parse_filters(filters)
	dim_sql, dim_params = _jc_sql_filters(f, "jc")
	params = {"from_date": f["from_date"], "to_date": f["to_date"], **dim_params}

	rows = frappe.db.sql(
		f"""
		SELECT
			jc.name,
			jc.posting_date,
			jc.vehicle_vin,
			jc.vehicle_model,
			jc.license_plate,
			jc.lead_technician,
			jc.repeat_repair_reference,
			(
				SELECT ji.complaint_description
				FROM `tabJob Card Item` ji
				WHERE ji.parent = jc.name
				  AND ji.parenttype = 'DMS Job Card'
				  AND ji.parentfield = 'job_items'
				ORDER BY ji.idx ASC
				LIMIT 1
			) AS complaint_description,
			(
				SELECT ji.symptom_category
				FROM `tabJob Card Item` ji
				WHERE ji.parent = jc.name
				  AND ji.parenttype = 'DMS Job Card'
				  AND ji.parentfield = 'job_items'
				ORDER BY ji.idx ASC
				LIMIT 1
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

	_apply_link_display_names(rows, {"lead_technician": "Technician"})
	_apply_vin_numbers(rows)

	by_vin = {}
	by_model = {}
	by_tech = {}
	by_category = {}
	for r in rows:
		r.complaint_description = _strip_html(r.complaint_description)[:500]
		vin = r.vin_number or r.vehicle_vin or "—"
		by_vin[vin] = by_vin.get(vin, 0) + 1
		mdl = r.vehicle_model or "—"
		by_model[mdl] = by_model.get(mdl, 0) + 1
		tech = r.lead_technician or "—"
		by_tech[tech] = by_tech.get(tech, 0) + 1
		cat = (r.symptom_category or "").strip() or _("Uncategorized")
		by_category[cat] = by_category.get(cat, 0) + 1

	return {
		"report_id": "repeat_repair",
		"title": "Repeat Repair Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_repeat_repairs": len(rows),
			"by_vin": by_vin,
			"by_model": by_model,
			"by_technician": by_tech,
			"by_symptom_category": by_category,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "posting_date", "label": "Date"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "vehicle_model", "label": "Model"},
			{"key": "symptom_category", "label": "Symptom category"},
			{"key": "complaint_description", "label": "Complaint"},
			{"key": "lead_technician", "label": "Technician"},
			{"key": "repeat_repair_reference", "label": "Reference JC"},
		],
		"rows": rows,
	}


def get_workshop_dashboard(filters=None):
	"""Section home KPIs for Workshop Operations."""
	f = _parse_filters(filters)
	wip = get_daily_wip_report(f)
	aging = get_aging_report(f)
	return {
		"section_id": "workshop",
		"title": _("Workshop"),
		"filters": _report_filters_response(f),
		"summary": {
			"open_job_cards": wip["summary"].get("total_open", 0),
			"overdue_promised": wip["summary"].get("overdue_promised", 0),
			"total_in_workshop": aging["summary"].get("total_in_workshop", 0),
			"by_status": wip["summary"].get("by_status", {}),
			"by_bay": wip["summary"].get("by_bay", {}),
			"by_age_bucket": aging["summary"].get("by_age_bucket", {}),
		},
	}


REPORT_HANDLERS = {
	"daily_wip": get_daily_wip_report,
	"job_card_status": get_job_card_status_report,
	"vehicle_turnaround": get_vehicle_turnaround_report,
	"aging": get_aging_report,
	"repeat_repair": get_repeat_repair_report,
}
