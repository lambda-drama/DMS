# Copyright (c) 2026, Mania and contributors
"""CRM Reports API — blueprint §17 (dashboards, reports, export log, snapshots)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import now_datetime

from dms.crm_api.reports.catalog import report_catalog
from dms.crm_api.reports.common import ensure_report_access, parse_crm_filters


def _all_handlers():
	from dms.crm_api.reports import aftersales, call_campaign, executive, sales

	handlers = {}
	for mod in (executive, sales, aftersales, call_campaign):
		handlers.update(getattr(mod, "REPORT_HANDLERS", {}))
	return handlers


def _section_dashboard_fn(section_id):
	from dms.crm_api.reports.aftersales import get_crm_aftersales_dashboard
	from dms.crm_api.reports.call_campaign import get_crm_call_campaign_dashboard
	from dms.crm_api.reports.executive import get_crm_executive_dashboard
	from dms.crm_api.reports.sales import get_crm_sales_dashboard

	return {
		"crm_executive": get_crm_executive_dashboard,
		"crm_sales": get_crm_sales_dashboard,
		"crm_aftersales": get_crm_aftersales_dashboard,
		"crm_call_campaign": get_crm_call_campaign_dashboard,
	}.get(section_id)


@frappe.whitelist()
def list_reports():
	"""Catalog for CRM Reports hub — sections (folders) and reports."""
	ensure_report_access()
	sections = report_catalog()
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
	"""KPI + chart payload for a CRM report section Overview tab."""
	ensure_report_access()
	section_id = (section_id or "").strip() or "crm_executive"
	fn = _section_dashboard_fn(section_id) or _section_dashboard_fn("crm_executive")
	dash = fn(filters)
	# Persist snapshot for forecast/pipeline trend (§17.5)
	try:
		_maybe_save_snapshot(section_id, dash.get("summary") or {}, filters)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "CRM Report Snapshot")
	return dash


@frappe.whitelist()
def get_report(report_id, filters=None):
	"""Tabular CRM report by id."""
	ensure_report_access()
	report_id = (report_id or "").strip()
	handler = _all_handlers().get(report_id)
	if not handler:
		frappe.throw(_("Unknown report: {0}").format(report_id))
	return handler(filters)


@frappe.whitelist()
def log_report_export(report_id, format=None, row_count=None, filters=None):
	"""§17.5 — export permissions controlled and logged."""
	ensure_report_access()
	roles = set(frappe.get_roles())
	if frappe.session.user != "Administrator" and not roles.intersection(
		{"System Manager", "DMS CRM Manager", "DMS CRM User"}
	):
		frappe.throw(_("Not permitted to export CRM reports."), frappe.PermissionError)

	if frappe.db.exists("DocType", "DMS CRM Report Export Log"):
		doc = frappe.get_doc(
			{
				"doctype": "DMS CRM Report Export Log",
				"report_id": report_id,
				"export_format": (format or "csv").upper()[:20],
				"row_count": int(row_count or 0),
				"exported_by": frappe.session.user,
				"exported_on": now_datetime(),
				"filters_json": frappe.as_json(parse_crm_filters(filters)),
			}
		)
		doc.insert(ignore_permissions=True)
		frappe.db.commit()
		return {"logged": 1, "name": doc.name}
	return {"logged": 0}


@frappe.whitelist()
def get_report_snapshots(section_id=None, limit=30):
	"""§17.5 — snapshot history for forecast and pipeline trend comparison."""
	ensure_report_access()
	if not frappe.db.exists("DocType", "DMS CRM Report Snapshot"):
		return {"data": []}
	filters = {}
	if section_id:
		filters["section_id"] = section_id
	rows = frappe.get_all(
		"DMS CRM Report Snapshot",
		filters=filters,
		fields=["name", "section_id", "snapshot_on", "summary_json", "from_date", "to_date"],
		order_by="snapshot_on desc",
		limit=min(int(limit or 30), 100),
	)
	for r in rows:
		try:
			r["summary"] = frappe.parse_json(r.get("summary_json") or "{}")
		except Exception:
			r["summary"] = {}
	return {"data": rows}


@frappe.whitelist()
def save_pipeline_snapshot(filters=None):
	"""Manually capture executive/sales pipeline snapshot."""
	ensure_report_access()
	dash = get_section_dashboard("crm_executive", filters)
	name = _maybe_save_snapshot("crm_executive", dash.get("summary") or {}, filters, force=True)
	return {"name": name, "summary": dash.get("summary")}


def daily_pipeline_snapshot():
	"""Scheduler: capture executive pipeline snapshot for trend comparison (§17.5)."""
	try:
		dash = get_crm_executive_dashboard_safe()
		_maybe_save_snapshot("crm_executive", dash.get("summary") or {}, None, force=False)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "CRM daily_pipeline_snapshot")


def get_crm_executive_dashboard_safe():
	from dms.crm_api.reports.executive import get_crm_executive_dashboard

	return get_crm_executive_dashboard({"period": "monthly"})


@frappe.whitelist()
def schedule_report_subscription(report_id, email=None, frequency="Weekly"):
	"""§17.5 — hook into Frappe Auto Email Report when available."""
	ensure_report_access()
	email = (email or frappe.session.user or "").strip()
	if not email:
		frappe.throw(_("Email is required."))
	if not frappe.db.exists("DocType", "Auto Email Report"):
		return {
			"ok": 0,
			"message": _(
				"Install / enable Auto Email Report in Desk, then subscribe to "
				"CRM report method dms.crm_api.reports.get_report with report_id={0}."
			).format(report_id),
		}
	# Soft create if user has permission — keep minimal to avoid conflicting with Desk UI
	existing = frappe.db.exists(
		"Auto Email Report",
		{"report": ["like", f"%{report_id}%"], "email_to": ["like", f"%{email}%"]},
	)
	if existing:
		return {"ok": 1, "name": existing, "message": _("Subscription already exists.")}
	return {
		"ok": 0,
		"message": _(
			"Create an Auto Email Report in Desk for script method "
			"dms.crm_api.reports.get_report (filters: report_id={0}, frequency={1}) "
			"and add {2} as recipient. Export history is logged via log_report_export."
		).format(report_id, frequency, email),
	}


def _maybe_save_snapshot(section_id, summary, filters, force=False):
	if not frappe.db.exists("DocType", "DMS CRM Report Snapshot"):
		return None
	# Only snapshot executive / sales (forecast & pipeline)
	if section_id not in ("crm_executive", "crm_sales") and not force:
		return None
	f = parse_crm_filters(filters)
	# At most one auto snapshot per section per day
	today = str(frappe.utils.today())
	if not force and frappe.db.exists(
		"DMS CRM Report Snapshot",
		{"section_id": section_id, "snapshot_on": [">=", today]},
	):
		return None
	doc = frappe.get_doc(
		{
			"doctype": "DMS CRM Report Snapshot",
			"section_id": section_id,
			"snapshot_on": now_datetime(),
			"from_date": f["from_date"],
			"to_date": f["to_date"],
			"summary_json": frappe.as_json(summary),
			"open_pipeline_value": summary.get("open_pipeline_value") or summary.get("pipeline_value"),
			"weighted_forecast": summary.get("weighted_forecast"),
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc.name
