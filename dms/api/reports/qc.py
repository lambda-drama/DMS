# Copyright (c) 2026, Mania and contributors
"""Quality Control reports and dashboard."""

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

def get_qc_failure_report(filters=None):
	f = _parse_filters(filters)
	qc_rows = frappe.get_all(
		"DMS Job Card",
		filters={
			**_jc_filters(f),
			"status": ["in", ["QC In Progress", "QC Failed", "Rework", "Completed", "Delivered"]],
		},
		fields=[
			"name", "status", "vehicle_vin", "qc_fail_reason", "qc_result", "rework_required",
			"lead_technician", "service_advisor", "opened_date_time", "completed_date_time",
		],
		limit=300,
	)

	_apply_link_display_names(
		qc_rows,
		{"lead_technician": "Technician", "service_advisor": "Service Advisor"},
	)
	_apply_vin_numbers(qc_rows)

	failed = [
		r for r in qc_rows
		if (r.status in ("QC Failed", "Rework")) or cint(r.rework_required) == 1
	]

	total_qc = len(qc_rows)
	fail_count = len(failed)
	fail_rate = round((fail_count / total_qc) * 100, 1) if total_qc else 0

	by_reason = {}
	for r in failed:
		reason = r.qc_fail_reason or _("Unspecified")
		by_reason[reason] = by_reason.get(reason, 0) + 1

	return {
		"report_id": "qc_failure",
		"title": "QC Failure Report",
		"filters": _report_filters_response(f),
		"summary": {
			"fail_count": fail_count,
			"total_qc_jobs": total_qc,
			"fail_rate_pct": fail_rate,
			"by_reason": by_reason,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "qc_fail_reason", "label": "Fail Reason"},
			{"key": "lead_technician", "label": "Technician"},
			{"key": "service_advisor", "label": "Advisor"},
		],
		"rows": failed,
	}


def get_qc_dashboard(filters=None):
	f = _parse_filters(filters)
	qc = get_qc_failure_report(f)
	return {
		"section_id": "qc",
		"title": _("Quality Control"),
		"filters": _report_filters_response(f),
		"summary": {
			"fail_count": qc["summary"].get("fail_count", 0),
			"total_qc_jobs": qc["summary"].get("total_qc_jobs", 0),
			"fail_rate_pct": qc["summary"].get("fail_rate_pct", 0),
			"by_reason": qc["summary"].get("by_reason", {}),
		},
	}


REPORT_HANDLERS = {
	"qc_failure": get_qc_failure_report,
}
