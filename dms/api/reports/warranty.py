# Copyright (c) 2026, Mania and contributors
"""Warranty reports and dashboard."""

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

def get_warranty_report(filters=None):
	f = _parse_filters(filters)
	conds = _jc_filters(
		f,
		{
			"docstatus": ["<", 2],
			"job_card_type": ["in", ["Warranty", "Goodwill", "Campaign/Recall"]],
		},
	)
	# Also include any job card with warranty application
	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "posting_date", "customer_name", "vehicle_model", "vehicle_vin", "license_plate",
			"job_card_type", "warranty_application_type", "warranty_status",
			"customer_approval_status", "payment_status", "net_amount", "invoice",
		],
		order_by="posting_date desc",
		limit=500,
	)

	extra = frappe.get_all(
		"DMS Job Card",
		filters={
			**_jc_filters(f, {"docstatus": ["<", 2]}),
			"warranty_application_type": ["is", "set"],
			"name": ["not in", [r.name for r in rows] or ["__none__"]],
		},
		fields=[
			"name", "posting_date", "customer_name", "vehicle_model", "vehicle_vin", "license_plate",
			"job_card_type", "warranty_application_type", "warranty_status",
			"customer_approval_status", "payment_status", "net_amount", "invoice",
		],
		limit=500,
	)
	seen = {r.name for r in rows}
	for r in extra:
		if r.name not in seen:
			rows.append(r)
			seen.add(r.name)

	approved = rejected = pending = 0
	reimbursement = 0.0
	for r in rows:
		status = (r.customer_approval_status or "").lower()
		if "approved" in status:
			approved += 1
		elif "rejected" in status or "declined" in status:
			rejected += 1
		else:
			pending += 1
		reimbursement += flt(r.net_amount)

	_apply_vin_numbers(rows)

	return {
		"report_id": "warranty",
		"title": "Warranty Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_jobs": len(rows),
			"approved": approved,
			"rejected": rejected,
			"pending": pending,
			"reimbursement_value": round(reimbursement, 2),
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "posting_date", "label": "Date"},
			{"key": "job_card_type", "label": "Type"},
			{"key": "warranty_application_type", "label": "Application"},
			{"key": "customer_approval_status", "label": "Approval"},
			{"key": "payment_status", "label": "Payment"},
			{"key": "net_amount", "label": "Value"},
		],
		"rows": rows,
	}


def get_warranty_dashboard(filters=None):
	f = _parse_filters(filters)
	w = get_warranty_report(f)
	return {
		"section_id": "warranty",
		"title": _("Warranty"),
		"filters": _report_filters_response(f),
		"summary": w["summary"],
	}


REPORT_HANDLERS = {
	"warranty": get_warranty_report,
}
