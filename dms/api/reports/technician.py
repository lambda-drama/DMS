# Copyright (c) 2026, Mania and contributors
"""Technician performance reports and dashboard."""

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
	_jc_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_strip_html,
	_vin_link_filter_value,
	_vin_sql_clause,
)

def get_technician_productivity_report(filters=None):
	f = _parse_filters(filters)
	tech_filters = {"status": "Active"}
	technicians = frappe.get_all(
		"Technician",
		filters=tech_filters,
		fields=[
			"name", "full_name", "efficiency_rating", "productivity_score",
			"total_sold_hours", "total_labor_hours", "total_idle_hours",
			"first_time_fix_rate", "customer_satisfaction_score",
		],
		order_by="full_name asc",
		limit=200,
	)

	vin_sql, vin_params = _vin_sql_clause(f, "jc.vehicle_vin")
	labour_hours = frappe.db.sql(
		f"""
		SELECT l.technician, SUM(COALESCE(l.estimated_hours, 0)) AS sold_hours
		FROM `tabVehicle Labour Item` l
		INNER JOIN `tabDMS Job Card` jc ON l.parent = jc.name
		WHERE l.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND l.technician IS NOT NULL AND l.technician != ''
		  {vin_sql}
		GROUP BY l.technician
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
		as_dict=True,
	)
	sold_by_tech = {r.technician: flt(r.sold_hours) for r in labour_hours}

	rows = []
	for t in technicians:
		sold = sold_by_tech.get(t.name, flt(t.total_sold_hours))
		actual = flt(t.total_labor_hours)
		idle = flt(t.total_idle_hours)
		available = sold + idle if (sold + idle) > 0 else actual or sold
		efficiency = flt(t.efficiency_rating)
		if not efficiency and available > 0:
			efficiency = round((sold / available) * 100, 1)
		rows.append({
			"technician": t.name,
			"full_name": t.full_name or t.name,
			"available_hours": round(available, 2),
			"sold_hours": round(sold, 2),
			"actual_hours": round(actual, 2),
			"idle_hours": round(idle, 2),
			"efficiency_pct": efficiency,
			"productivity_score": flt(t.productivity_score),
			"first_time_fix_rate": flt(t.first_time_fix_rate),
		})

	return {
		"report_id": "technician_productivity",
		"title": "Technician Productivity",
		"filters": _report_filters_response(f),
		"summary": {
			"technician_count": len(rows),
			"total_sold_hours": round(sum(r["sold_hours"] for r in rows), 2),
			"avg_efficiency_pct": round(
				sum(r["efficiency_pct"] for r in rows) / len(rows), 1
			) if rows else 0,
		},
		"columns": [
			{"key": "full_name", "label": "Technician"},
			{"key": "available_hours", "label": "Available Hrs"},
			{"key": "sold_hours", "label": "Sold Hrs"},
			{"key": "actual_hours", "label": "Actual Hrs"},
			{"key": "idle_hours", "label": "Idle Hrs"},
			{"key": "efficiency_pct", "label": "Efficiency %"},
			{"key": "productivity_score", "label": "Productivity"},
		],
		"rows": rows,
	}


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
		},
	}


REPORT_HANDLERS = {
	"technician_productivity": get_technician_productivity_report,
}
