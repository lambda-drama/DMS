# Copyright (c) 2026, Mania and contributors
"""Finance & Cashier reports and dashboard."""

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

def get_invoice_register_report(filters=None):
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "Sales Invoice"):
		return _result("invoice_register", _("Invoice Register"), f, {"total": 0}, [], [])

	from frappe.query_builder import DocType, Order
	from dms.api.invoices import _dms_sales_invoice_condition
	from dms.api.utils import get_dms_companies
	from dms.dealer_management_system.utils.branch_permissions import apply_branch_filter_to_qb

	dms_cond = _dms_sales_invoice_condition()
	if dms_cond is None:
		return _result("invoice_register", _("Invoice Register"), f, {"total": 0}, [], [])

	SI = DocType("Sales Invoice")
	fields = [
		SI.name,
		SI.customer,
		SI.customer_name,
		SI.posting_date,
		SI.due_date,
		SI.grand_total,
		SI.outstanding_amount,
		SI.status,
		SI.currency,
		SI.docstatus,
		SI.net_total,
		SI.total_taxes_and_charges,
		SI.discount_amount,
	]
	si_meta = frappe.get_meta("Sales Invoice")
	if si_meta.has_field("custom_dms_job_card"):
		fields.append(SI.custom_dms_job_card.as_("job_card"))

	query = (
		frappe.qb.from_(SI)
		.select(*fields)
		.where(dms_cond)
		.where(SI.docstatus < 2)
		.where(SI.posting_date >= f["from_date"])
		.where(SI.posting_date <= f["to_date"])
		.orderby(SI.posting_date, order=Order.desc)
		.limit(2000)
	)
	if f.get("company"):
		query = query.where(SI.company == f["company"])
	else:
		companies = get_dms_companies()
		if companies:
			query = query.where(SI.company.isin(companies))
	query = apply_branch_filter_to_qb(query, SI, doctype="Sales Invoice")
	rows = query.run(as_dict=True)

	return _result(
		"invoice_register",
		_("Invoice Register"),
		f,
		{
			"invoice_count": len(rows),
			"grand_total": round(sum(flt(r.grand_total) for r in rows), 2),
			"outstanding": round(sum(flt(r.outstanding_amount) for r in rows), 2),
			"tax_total": round(sum(flt(r.total_taxes_and_charges) for r in rows), 2),
		},
		[
			{"key": "name", "label": _("Invoice")},
			{"key": "job_card", "label": _("Job Card")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "posting_date", "label": _("Date")},
			{"key": "net_total", "label": _("Net")},
			{"key": "total_taxes_and_charges", "label": _("Tax")},
			{"key": "discount_amount", "label": _("Discount")},
			{"key": "grand_total", "label": _("Grand Total")},
			{"key": "outstanding_amount", "label": _("Outstanding")},
			{"key": "status", "label": _("Status")},
		],
		rows,
	)

def get_unbilled_job_cards_report(filters=None):
	f = _parse_filters(filters)
	conds = _jc_filters(
		f,
		{
			"docstatus": 1,
			"status": ["in", ["Completed", "Delivered"]],
			"job_card_type": ["!=", "Internal"],
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
			"completed_date_time",
			"total_labor_cost",
			"total_parts_cost",
			"net_amount",
			"total_amount",
			"invoice",
			"service_advisor",
			"company",
		],
		limit=2000,
	)
	_apply_vin_numbers(rows)

	unbilled = []
	today = getdate(nowdate())
	for row in rows:
		invoice = (row.invoice or "").strip()
		active = False
		if invoice and frappe.db.exists("Sales Invoice", invoice):
			if cint(frappe.db.get_value("Sales Invoice", invoice, "docstatus")) != 2:
				active = True
		if active:
			continue
		completed = getdate(row.completed_date_time) if row.completed_date_time else None
		days = date_diff(today, completed) if completed else None
		unbilled.append(
			{
				**row,
				"unbilled_value": flt(row.net_amount or row.total_amount),
				"days_outstanding": days,
				"reason": _("No active invoice"),
			}
		)

	return _result(
		"unbilled_job_cards",
		_("Unbilled Job Cards"),
		f,
		{
			"unbilled_count": len(unbilled),
			"unbilled_value": round(sum(flt(r["unbilled_value"]) for r in unbilled), 2),
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "status", "label": _("Status")},
			{"key": "completed_date_time", "label": _("Completed")},
			{"key": "total_labor_cost", "label": _("Labour")},
			{"key": "total_parts_cost", "label": _("Parts")},
			{"key": "unbilled_value", "label": _("Unbilled Value")},
			{"key": "days_outstanding", "label": _("Days")},
			{"key": "reason", "label": _("Reason")},
		],
		unbilled,
	)


def get_finance_dashboard(filters=None):
	f = _parse_filters(filters)
	inv = get_invoice_register_report(f)
	unb = get_unbilled_job_cards_report(f)
	from dms.api.reports.executive import get_service_revenue_report
	rev = get_service_revenue_report(f)
	return {
		"section_id": "finance",
		"title": _("Finance & Cashier"),
		"filters": _report_filters_response(f),
		"summary": {
			"invoice_count": inv["summary"].get("invoice_count", 0),
			"grand_total": inv["summary"].get("grand_total", 0),
			"outstanding": inv["summary"].get("outstanding", 0),
			"unbilled_count": unb["summary"].get("unbilled_count", 0),
			"unbilled_value": unb["summary"].get("unbilled_value", 0),
			"net_revenue": rev["summary"].get("net_revenue", 0),
			"by_month": rev["summary"].get("by_month", {}),
		},
	}


def _service_revenue_handler(filters=None):
	from dms.api.reports.executive import get_service_revenue_report

	return get_service_revenue_report(filters)


REPORT_HANDLERS = {
	"invoice_register": get_invoice_register_report,
	"unbilled_job_cards": get_unbilled_job_cards_report,
	"service_revenue": _service_revenue_handler,
}
