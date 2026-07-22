# Copyright (c) 2026, Mania and contributors
"""Technician performance reports — Spec §2.4–2.5."""

from __future__ import annotations

from collections import defaultdict

import frappe
from frappe import _
from frappe.utils import flt, get_datetime, time_diff_in_hours

from dms.api.reports.common import (
	_apply_link_display_names,
	_format_datetime_minute,
	_jc_sql_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_vin_sql_clause,
)


def get_technician_productivity_report(filters=None):
	"""§2.4 Technician Productivity."""
	f = _parse_filters(filters)
	technicians = frappe.get_all(
		"Technician",
		filters={"status": "Active"},
		fields=["name", "full_name", "efficiency_rating", "productivity_score"],
		order_by="full_name asc",
		limit=200,
	)
	tech_ids = [t.name for t in technicians]
	if not tech_ids:
		return _result("technician_productivity", _("Technician Productivity"), f, {}, [], [])

	vin_sql, vin_params = _vin_sql_clause(f, "jc.vehicle_vin")
	dim_sql, dim_params = _jc_sql_filters(f, "jc")
	params = {"from_date": f["from_date"], "to_date": f["to_date"], **vin_params, **dim_params}

	# Sold hours from labour lines
	sold_rows = frappe.db.sql(
		f"""
		SELECT l.technician,
			SUM(COALESCE(l.estimated_hours, 0)) AS sold_hours,
			SUM(COALESCE(l.amount, 0)) AS labor_sales
		FROM `tabVehicle Labour Item` l
		INNER JOIN `tabDMS Job Card` jc ON l.parent = jc.name
		WHERE l.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND l.technician IN %(techs)s
		  {vin_sql}{dim_sql}
		GROUP BY l.technician
		""",
		{**params, "techs": tech_ids},
		as_dict=True,
	)
	sold_map = {r.technician: r for r in sold_rows}

	# Clocked / productive from time logs (productive = duration without pause reason)
	log_rows = frappe.db.sql(
		f"""
		SELECT tl.technician,
			SUM(COALESCE(tl.duration_hours, 0)) AS clocked_hours,
			SUM(CASE WHEN IFNULL(tl.pause_reason, '') = '' THEN COALESCE(tl.duration_hours, 0) ELSE 0 END) AS productive_hours
		FROM `tabDMS Job Card Time Log` tl
		INNER JOIN `tabDMS Job Card` jc ON tl.parent = jc.name
		WHERE tl.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND tl.technician IN %(techs)s
		  {vin_sql}{dim_sql}
		GROUP BY tl.technician
		""",
		{**params, "techs": tech_ids},
		as_dict=True,
	)
	log_map = {r.technician: r for r in log_rows}

	# Jobs completed + avg repair time
	job_rows = frappe.db.sql(
		f"""
		SELECT jc.lead_technician AS technician,
			COUNT(*) AS jobs_completed,
			AVG(TIMESTAMPDIFF(HOUR, jc.repair_started_at, jc.completed_date_time)) AS avg_repair_hours
		FROM `tabDMS Job Card` jc
		WHERE jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.docstatus < 2
		  AND jc.status IN ('Completed', 'Delivered', 'Repair Completed')
		  AND jc.lead_technician IN %(techs)s
		  {vin_sql}{dim_sql}
		GROUP BY jc.lead_technician
		""",
		{**params, "techs": tech_ids},
		as_dict=True,
	)
	job_map = {r.technician: r for r in job_rows}

	# Comebacks + QC failures
	comeback_rows = frappe.db.sql(
		f"""
		SELECT jc.lead_technician AS technician, COUNT(*) AS comebacks
		FROM `tabDMS Job Card` jc
		WHERE jc.is_repeat_repair = 1
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.lead_technician IN %(techs)s
		  {vin_sql}{dim_sql}
		GROUP BY jc.lead_technician
		""",
		{**params, "techs": tech_ids},
		as_dict=True,
	)
	comeback_map = {r.technician: cint_safe(r.comebacks) for r in comeback_rows}

	qc_fail_rows = frappe.db.sql(
		f"""
		SELECT jc.lead_technician AS technician, COUNT(*) AS qc_fails
		FROM `tabDMS Job Card` jc
		WHERE jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND (jc.status IN ('QC Failed', 'Rework') OR jc.rework_required = 1)
		  AND jc.lead_technician IN %(techs)s
		  {vin_sql}{dim_sql}
		GROUP BY jc.lead_technician
		""",
		{**params, "techs": tech_ids},
		as_dict=True,
	)
	qc_map = {r.technician: cint_safe(r.qc_fails) for r in qc_fail_rows}

	# Parts consumed value
	parts_rows = frappe.db.sql(
		f"""
		SELECT jc.lead_technician AS technician, SUM(COALESCE(p.total_amount, 0)) AS parts_amount
		FROM `tabJob Card Part Item` p
		INNER JOIN `tabDMS Job Card` jc ON p.parent = jc.name
		WHERE p.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.lead_technician IN %(techs)s
		  {vin_sql}{dim_sql}
		GROUP BY jc.lead_technician
		""",
		{**params, "techs": tech_ids},
		as_dict=True,
	)
	parts_map = {r.technician: flt(r.parts_amount) for r in parts_rows}

	# Available hours heuristic: period calendar days × 8 (shift detail not fully modeled)
	period_days = max(1, (f["to_date"] - f["from_date"]).days + 1)
	default_available = period_days * 8.0

	rows = []
	for t in technicians:
		sold = sold_map.get(t.name)
		logs = log_map.get(t.name)
		jobs = job_map.get(t.name)
		sold_hours = flt(sold.sold_hours) if sold else 0
		labor_sales = flt(sold.labor_sales) if sold else 0
		clocked = flt(logs.clocked_hours) if logs else 0
		productive = flt(logs.productive_hours) if logs else clocked
		available = default_available
		idle = max(0, available - clocked)
		productivity_pct = round((productive / available) * 100, 1) if available else 0
		efficiency_pct = round((sold_hours / productive) * 100, 1) if productive else 0
		utilization_pct = round((clocked / available) * 100, 1) if available else 0
		rows.append({
			"technician": t.name,
			"full_name": t.full_name or t.name,
			"available_hours": round(available, 2),
			"clocked_hours": round(clocked, 2),
			"productive_hours": round(productive, 2),
			"sold_hours": round(sold_hours, 2),
			"idle_hours": round(idle, 2),
			"productivity_pct": productivity_pct,
			"efficiency_pct": efficiency_pct,
			"utilization_pct": utilization_pct,
			"jobs_completed": cint_safe(jobs.jobs_completed) if jobs else 0,
			"comebacks": comeback_map.get(t.name, 0),
			"qc_failures": qc_map.get(t.name, 0),
			"labor_sales": round(labor_sales, 2),
			"parts_consumed": round(parts_map.get(t.name, 0), 2),
			"avg_repair_hours": round(flt(jobs.avg_repair_hours), 2) if jobs and jobs.avg_repair_hours is not None else None,
		})

	return _result(
		"technician_productivity",
		_("Technician Productivity Report"),
		f,
		{
			"technician_count": len(rows),
			"total_sold_hours": round(sum(r["sold_hours"] for r in rows), 2),
			"total_labor_sales": round(sum(r["labor_sales"] for r in rows), 2),
			"avg_productivity_pct": round(sum(r["productivity_pct"] for r in rows) / len(rows), 1) if rows else 0,
			"avg_efficiency_pct": round(sum(r["efficiency_pct"] for r in rows) / len(rows), 1) if rows else 0,
		},
		[
			{"key": "full_name", "label": _("Technician")},
			{"key": "available_hours", "label": _("Available (h)")},
			{"key": "clocked_hours", "label": _("Clocked (h)")},
			{"key": "productive_hours", "label": _("Productive (h)")},
			{"key": "sold_hours", "label": _("Sold (h)")},
			{"key": "idle_hours", "label": _("Idle (h)")},
			{"key": "productivity_pct", "label": _("Productivity %")},
			{"key": "efficiency_pct", "label": _("Efficiency %")},
			{"key": "utilization_pct", "label": _("Utilization %")},
			{"key": "jobs_completed", "label": _("Jobs Done")},
			{"key": "comebacks", "label": _("Comebacks")},
			{"key": "qc_failures", "label": _("QC Fails")},
			{"key": "labor_sales", "label": _("Labor Sales")},
			{"key": "parts_consumed", "label": _("Parts $")},
			{"key": "avg_repair_hours", "label": _("Avg Repair (h)")},
		],
		rows,
	)


def cint_safe(v):
	try:
		return int(v or 0)
	except Exception:
		return 0


def get_technician_time_analysis_report(filters=None):
	"""§2.5 Technician Time Analysis — transaction-level time logs."""
	f = _parse_filters(filters)
	vin_sql, vin_params = _vin_sql_clause(f, "jc.vehicle_vin")
	dim_sql, dim_params = _jc_sql_filters(f, "jc")
	params = {"from_date": f["from_date"], "to_date": f["to_date"], **vin_params, **dim_params}

	rows = frappe.db.sql(
		f"""
		SELECT
			tl.name AS time_log,
			tl.technician,
			tl.start_time,
			tl.end_time,
			tl.duration_hours,
			tl.pause_reason,
			tl.notes,
			jc.name AS job_card,
			jc.vehicle_vin,
			jc.vehicle_model,
			jc.status AS job_status,
			(
				SELECT SUM(COALESCE(l.estimated_hours, 0))
				FROM `tabVehicle Labour Item` l
				WHERE l.parent = jc.name AND l.parenttype = 'DMS Job Card'
				  AND (l.technician = tl.technician OR IFNULL(l.technician, '') = '')
			) AS standard_hours
		FROM `tabDMS Job Card Time Log` tl
		INNER JOIN `tabDMS Job Card` jc ON tl.parent = jc.name
		WHERE tl.parenttype = 'DMS Job Card'
		  AND DATE(tl.start_time) BETWEEN %(from_date)s AND %(to_date)s
		  {vin_sql}{dim_sql}
		ORDER BY tl.start_time DESC
		LIMIT 2000
		""",
		params,
		as_dict=True,
	)

	_apply_link_display_names(rows, {"technician": "Technician"})
	from dms.api.reports.common import _apply_vin_numbers
	# Map vehicle_vin → vin_number on rows
	for r in rows:
		r["vehicle_vin_link"] = r.vehicle_vin
	_apply_vin_numbers(rows, link_field="vehicle_vin")

	out = []
	by_pause = defaultdict(int)
	for r in rows:
		actual = flt(r.duration_hours)
		standard = flt(r.standard_hours)
		variance = round(actual - standard, 2) if standard else None
		pause = (r.pause_reason or "").strip() or _("—")
		if r.pause_reason:
			by_pause[r.pause_reason] += 1
		out.append({
			"time_log": r.time_log,
			"job_card": r.job_card,
			"technician": r.technician,
			"vin_number": getattr(r, "vin_number", None) or r.vehicle_vin,
			"vehicle_model": r.vehicle_model,
			"clock_in": _format_datetime_minute(r.start_time),
			"clock_out": _format_datetime_minute(r.end_time) if r.end_time else "",
			"actual_hours": round(actual, 2),
			"standard_hours": round(standard, 2) if standard else None,
			"variance_hours": variance,
			"pause_reason": pause,
			"notes": r.notes or "",
			"job_status": r.job_status,
		})

	return _result(
		"technician_time_analysis",
		_("Technician Time Analysis Report"),
		f,
		{
			"time_log_count": len(out),
			"total_actual_hours": round(sum(r["actual_hours"] for r in out), 2),
			"by_pause_reason": dict(by_pause),
		},
		[
			{"key": "job_card", "label": _("Job Card")},
			{"key": "technician", "label": _("Technician")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "clock_in", "label": _("Clock In / Start")},
			{"key": "clock_out", "label": _("Clock Out / End")},
			{"key": "actual_hours", "label": _("Actual (h)")},
			{"key": "standard_hours", "label": _("Standard (h)")},
			{"key": "variance_hours", "label": _("Variance (h)")},
			{"key": "pause_reason", "label": _("Pause Reason")},
			{"key": "notes", "label": _("Notes")},
		],
		out,
	)


def get_technician_dashboard(filters=None):
	f = _parse_filters(filters)
	prod = get_technician_productivity_report(f)
	return {
		"section_id": "technician",
		"title": _("Technician Performance"),
		"filters": _report_filters_response(f),
		"summary": {
			"technician_count": prod["summary"].get("technician_count", 0),
			"total_sold_hours": prod["summary"].get("total_sold_hours", 0),
			"avg_efficiency_pct": prod["summary"].get("avg_efficiency_pct", 0),
			"avg_productivity_pct": prod["summary"].get("avg_productivity_pct", 0),
			"total_labor_sales": prod["summary"].get("total_labor_sales", 0),
		},
	}


REPORT_HANDLERS = {
	"technician_productivity": get_technician_productivity_report,
	"technician_time_analysis": get_technician_time_analysis_report,
}
