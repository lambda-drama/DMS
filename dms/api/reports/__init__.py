# Copyright (c) 2026, Mania and contributors
"""DMS aftersales reports API — section packages + thin router."""

from __future__ import annotations

import frappe
from frappe import _

from dms.api.permissions import has_management_view_role
from dms.api.reports.catalog import _report_catalog
from dms.api.reports.common import _parse_filters

# Re-export helpers used by other modules (e.g. dashboard.py)
from dms.api.reports.common import (  # noqa: F401
	OPEN_JOB_CARD_STATUSES,
	_apply_link_display_names,
	_apply_vin_numbers,
	_jc_filters,
	_report_filters_response,
	_vin_link_filter_value,
)
from dms.api.reports.workshop import get_daily_wip_report  # noqa: F401
from dms.api.reports.executive import get_service_revenue_report  # noqa: F401
from dms.api.reports.warranty import get_warranty_report  # noqa: F401
from dms.api.reports.qc import get_qc_failure_report  # noqa: F401
from dms.api.reports.parts import get_parts_fill_rate_report  # noqa: F401
from dms.api.reports.advisor import get_appointment_conversion_report  # noqa: F401


def _all_handlers():
	from dms.api.reports import (
		advisor,
		compliance,
		crm,
		executive,
		finance,
		parts,
		qc,
		technician,
		warranty,
		workshop,
	)

	handlers = {}
	for mod in (
		executive,
		workshop,
		advisor,
		technician,
		parts,
		warranty,
		qc,
		crm,
		finance,
		compliance,
	):
		handlers.update(getattr(mod, "REPORT_HANDLERS", {}))
	return handlers


def _section_dashboard_fn(section_id):
	from dms.api.reports.advisor import get_advisor_dashboard
	from dms.api.reports.compliance import get_compliance_dashboard
	from dms.api.reports.crm import get_crm_dashboard
	from dms.api.reports.executive import get_executive_dashboard
	from dms.api.reports.finance import get_finance_dashboard
	from dms.api.reports.parts import get_parts_dashboard
	from dms.api.reports.qc import get_qc_dashboard
	from dms.api.reports.technician import get_technician_dashboard
	from dms.api.reports.warranty import get_warranty_dashboard
	from dms.api.reports.workshop import get_workshop_dashboard

	return {
		"executive": get_executive_dashboard,
		"workshop": get_workshop_dashboard,
		"advisor": get_advisor_dashboard,
		"technician": get_technician_dashboard,
		"parts": get_parts_dashboard,
		"warranty": get_warranty_dashboard,
		"qc": get_qc_dashboard,
		"crm": get_crm_dashboard,
		"finance": get_finance_dashboard,
		"compliance": get_compliance_dashboard,
	}.get(section_id)


@frappe.whitelist()
def list_reports():
	"""Catalog for the Reports hub — sections (folders) and reports."""
	if not has_management_view_role():
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	sections = _report_catalog()
	flat = []
	seen = set()
	for section in sections:
		for report in section.get("reports") or []:
			rid = report.get("id")
			if not rid or rid in seen:
				continue
			seen.add(rid)
			flat.append({**report, "section_id": section["id"], "section_title": section["title"]})
	return {"sections": sections, "reports": flat}


@frappe.whitelist()
def get_section_dashboard(section_id, filters=None):
	"""KPI + chart payload for a report section home."""
	if not has_management_view_role():
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	if isinstance(filters, str):
		import json
		filters = json.loads(filters) if filters else {}

	section_id = (section_id or "").strip()
	fn = _section_dashboard_fn(section_id) or _section_dashboard_fn("executive")
	dash = fn(filters)
	return {
		"section_id": section_id,
		"title": dash.get("title") or section_id,
		"filters": dash.get("filters") or {},
		"summary": dash.get("summary") or {},
	}


@frappe.whitelist()
def get_report(report_id, filters=None):
	"""Run a report by id."""
	if not has_management_view_role():
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	if isinstance(filters, str):
		import json
		filters = json.loads(filters) if filters else {}

	fn = _all_handlers().get((report_id or "").strip())
	if not fn:
		frappe.throw(_("Unknown report: {0}").format(report_id))
	return fn(filters)


@frappe.whitelist()
def get_brd_dashboard_kpis(filters=None):
	"""Summary KPIs for the home dashboard (BRD §20 highlights)."""
	f = _parse_filters(filters)
	wip = get_daily_wip_report(f)
	revenue = get_service_revenue_report(f)
	apt = get_appointment_conversion_report(f)
	qc = get_qc_failure_report(f)
	fill = get_parts_fill_rate_report(f)
	return {
		"from_date": str(f["from_date"]),
		"to_date": str(f["to_date"]),
		"open_job_cards": wip["summary"].get("total_open", 0),
		"overdue_promised": wip["summary"].get("overdue_promised", 0),
		"net_revenue": revenue["summary"].get("net_revenue", 0),
		"revenue_currency": revenue["summary"].get("revenue_currency"),
		"labour_revenue": revenue["summary"].get("labour_total", 0),
		"parts_revenue": revenue["summary"].get("parts_total", 0),
		"appointment_arrival_rate": apt["summary"].get("arrival_rate_pct", 0),
		"qc_fail_rate_pct": qc["summary"].get("fail_rate_pct", 0),
		"parts_fill_rate_pct": fill["summary"].get("fill_rate_pct", 0),
		"warranty_jobs": get_warranty_report(f)["summary"].get("total_jobs", 0),
	}
