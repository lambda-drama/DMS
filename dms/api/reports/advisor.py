# Copyright (c) 2026, Mania and contributors
"""Service Advisor reports and dashboard."""

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

def get_service_advisor_performance_report(filters=None):
	f = _parse_filters(filters)
	conds = _jc_filters(f, {"docstatus": ["<", 2]})
	jcs = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name",
			"service_advisor",
			"status",
			"job_card_type",
			"total_labor_cost",
			"total_parts_cost",
			"discount_amount",
			"net_amount",
			"total_amount",
			"customer_approval_status",
		],
		limit=3000,
	)
	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})

	by_advisor = {}
	for jc in jcs:
		key = jc.service_advisor or _("Unassigned")
		bucket = by_advisor.setdefault(
			key,
			{
				"advisor": key,
				"vehicles_received": 0,
				"jobs_closed": 0,
				"labour_sales": 0.0,
				"parts_sales": 0.0,
				"discounts": 0.0,
				"net_sales": 0.0,
				"approved": 0,
			},
		)
		bucket["vehicles_received"] += 1
		if jc.status in ("Completed", "Delivered"):
			bucket["jobs_closed"] += 1
		bucket["labour_sales"] += flt(jc.total_labor_cost)
		bucket["parts_sales"] += flt(jc.total_parts_cost)
		bucket["discounts"] += flt(jc.discount_amount)
		bucket["net_sales"] += flt(jc.net_amount or jc.total_amount)
		if (jc.customer_approval_status or "") == "Approved":
			bucket["approved"] += 1

	rows = []
	for bucket in by_advisor.values():
		recv = bucket["vehicles_received"] or 1
		bucket["avg_ro"] = round(bucket["net_sales"] / recv, 2)
		bucket["approval_rate_pct"] = round(100.0 * bucket["approved"] / recv, 1)
		rows.append(bucket)
	rows.sort(key=lambda r: r["net_sales"], reverse=True)

	return _result(
		"service_advisor_performance",
		_("Service Advisor Performance"),
		f,
		{
			"advisor_count": len(rows),
			"total_jobs": len(jcs),
			"total_net_sales": round(sum(r["net_sales"] for r in rows), 2),
		},
		[
			{"key": "advisor", "label": _("Advisor")},
			{"key": "vehicles_received", "label": _("Jobs")},
			{"key": "jobs_closed", "label": _("Closed")},
			{"key": "labour_sales", "label": _("Labour")},
			{"key": "parts_sales", "label": _("Parts")},
			{"key": "discounts", "label": _("Discounts")},
			{"key": "net_sales", "label": _("Net Sales")},
			{"key": "avg_ro", "label": _("Avg RO")},
			{"key": "approval_rate_pct", "label": _("Approval %")},
		],
		rows,
	)

def get_appointment_conversion_report(filters=None):
	f = _parse_filters(filters)
	start = datetime.datetime.combine(f["from_date"], datetime.time.min)
	end = datetime.datetime.combine(f["to_date"], datetime.time.max)

	apt_filters = {"appointment_date_time": ["between", [start, end]]}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		apt_filters["vin_chassis"] = ["in", vin_val]

	apts = frappe.get_all(
		"Service Appointment",
		filters=apt_filters,
		fields=["name", "status", "booking_source", "customer_name", "vin_chassis"],
		limit=5000,
	)
	_apply_vin_numbers(apts, link_field="vin_chassis")

	by_status = {}
	walk_in = 0
	for a in apts:
		st = a.status or "Booked"
		by_status[st] = by_status.get(st, 0) + 1
		if (a.booking_source or "").lower() in ("walk-in", "walk in", "walkin"):
			walk_in += 1

	total = len(apts) or 1
	arrived = sum(
		by_status.get(s, 0)
		for s in ("Arrived", "In Inspection", "In Workshop", "Ready for Pickup", "Completed")
	)
	no_show = by_status.get("No-Show", 0)
	rescheduled = by_status.get("Rescheduled", 0)
	booked = by_status.get("Booked", 0) + by_status.get("Reminder Sent", 0)

	return {
		"report_id": "appointment_conversion",
		"title": "Appointment Conversion",
		"filters": _report_filters_response(f),
		"summary": {
			"total": len(apts),
			"booked": booked,
			"arrived": arrived,
			"no_show": no_show,
			"rescheduled": rescheduled,
			"walk_in": walk_in,
			"walk_in_pct": round((walk_in / total) * 100, 1),
			"arrival_rate_pct": round((arrived / total) * 100, 1),
			"by_status": by_status,
		},
		"columns": [
			{"key": "name", "label": "Appointment"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "booking_source", "label": "Source"},
			{"key": "customer_name", "label": "Customer"},
		],
		"rows": apts[:200],
	}


def get_advisor_dashboard(filters=None):
	f = _parse_filters(filters)
	perf = get_service_advisor_performance_report(f)
	apt = get_appointment_conversion_report(f)
	return {
		"section_id": "advisor",
		"title": _("Service Advisor"),
		"filters": _report_filters_response(f),
		"summary": {
			"advisor_count": perf["summary"].get("advisor_count", 0),
			"total_jobs": perf["summary"].get("total_jobs", 0),
			"total_net_sales": perf["summary"].get("total_net_sales", 0),
			"arrival_rate_pct": apt["summary"].get("arrival_rate_pct", 0),
			"by_status": apt["summary"].get("by_status", {}),
		},
	}


REPORT_HANDLERS = {
	"service_advisor_performance": get_service_advisor_performance_report,
	"appointment_conversion": get_appointment_conversion_report,
}
