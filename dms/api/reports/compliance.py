# Copyright (c) 2026, Mania and contributors
"""Compliance & Audit reports and dashboard."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import flt

from dms.api.reports.common import (
	_parse_filters,
	_report_filters_response,
	_result,
	_vin_link_filter_value,
)
from dms.api.utils import get_dms_companies

AUDIT_REF_DOCTYPES = (
	"DMS Job Card",
	"Sales Invoice",
	"DMS Parts Request",
	"Vehicle Inspection",
	"DMS Service Estimate",
	"Customer Follow Up",
	"Vehicle Delivery Note",
)


def _company_from_user_permission(perm) -> str | None:
	if isinstance(perm, dict):
		return perm.get("doc") or perm.get("for_value")
	return getattr(perm, "doc", None) or getattr(perm, "for_value", None)


def get_permitted_dms_companies(user: str | None = None) -> list[str]:
	"""DMS Settings companies ∩ Company User Permissions for this user.

	Administrator sees all DMS Settings companies.
	Users with no Company user permission see nothing (strict).
	"""
	dms = [c for c in get_dms_companies() if c]
	if not dms:
		return []

	user = user or frappe.session.user
	if not user or user == "Guest":
		return []
	if user == "Administrator":
		return dms

	perms = frappe.permissions.get_user_permissions(user).get("Company") or []
	if not perms:
		return []

	dms_set = set(dms)
	allowed = []
	for perm in perms:
		company = _company_from_user_permission(perm)
		if company and company in dms_set and company not in allowed:
			allowed.append(company)
	return allowed


def get_users_tied_to_companies(companies: list[str]) -> set[str]:
	"""Users with User Permission Allow=Company for any of the given companies."""
	if not companies:
		return set()
	rows = frappe.get_all(
		"User Permission",
		filters={"allow": "Company", "for_value": ["in", list(companies)]},
		fields=["user"],
		limit_page_length=0,
	)
	users = {r.user for r in rows if r.user}
	if frappe.session.user and frappe.session.user != "Guest":
		users.add(frappe.session.user)
	return users


def _bulk_document_companies(pairs: list[tuple[str, str]]) -> dict[tuple[str, str], str | None]:
	"""Map (doctype, name) → company, including job-card fallback for related docs."""
	resolved: dict[tuple[str, str], str | None] = {}
	by_dt: dict[str, list[str]] = {}
	for dt, name in pairs:
		if not dt or not name:
			continue
		by_dt.setdefault(dt, []).append(name)

	job_card_ids: set[str] = set()
	pending_jc: list[tuple[str, str, str]] = []

	for dt, names in by_dt.items():
		unique = list({n for n in names if n})
		if not unique or not frappe.db.exists("DocType", dt):
			continue
		meta = frappe.get_meta(dt)
		fields = ["name"]
		has_company = meta.has_field("company")
		has_job_card = meta.has_field("job_card")
		if has_company:
			fields.append("company")
		if has_job_card:
			fields.append("job_card")

		rows = frappe.get_all(
			dt, filters={"name": ["in", unique]}, fields=fields, limit_page_length=0
		)
		for row in rows:
			key = (dt, row.name)
			if has_company and row.get("company"):
				resolved[key] = row.company
			elif has_job_card and row.get("job_card"):
				job_card_ids.add(row.job_card)
				pending_jc.append((dt, row.name, row.job_card))
			else:
				resolved[key] = None

	jc_company = {}
	if job_card_ids:
		for jc in frappe.get_all(
			"DMS Job Card",
			filters={"name": ["in", list(job_card_ids)]},
			fields=["name", "company"],
			limit_page_length=0,
		):
			jc_company[jc.name] = jc.company

	for dt, name, jc in pending_jc:
		resolved[(dt, name)] = jc_company.get(jc)

	return resolved


def get_user_audit_trail_report(filters=None):
	f = _parse_filters(filters)
	columns = [
		{"key": "timestamp", "label": _("When")},
		{"key": "user", "label": _("User")},
		{"key": "action", "label": _("Action")},
		{"key": "doctype", "label": _("Document Type")},
		{"key": "document", "label": _("Document")},
		{"key": "company", "label": _("Company")},
		{"key": "detail", "label": _("Detail")},
	]

	allowed_companies = get_permitted_dms_companies()
	if not allowed_companies:
		return _result(
			"user_audit_trail",
			_("User Activity / Audit Trail"),
			f,
			{
				"events": 0,
				"message": _("No DMS companies in your permission scope."),
			},
			columns,
			[],
		)

	if f.get("company"):
		if f["company"] not in allowed_companies:
			return _result(
				"user_audit_trail",
				_("User Activity / Audit Trail"),
				f,
				{"events": 0, "message": _("Company not permitted.")},
				columns,
				[],
			)
		allowed_companies = [f["company"]]

	allowed_company_set = set(allowed_companies)
	tied_users = get_users_tied_to_companies(allowed_companies)
	date_range = ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]]
	raw_events = []

	if frappe.db.exists("DocType", "Version"):
		versions = frappe.get_all(
			"Version",
			filters={
				"creation": date_range,
				"ref_doctype": ["in", list(AUDIT_REF_DOCTYPES)],
			},
			fields=["name", "ref_doctype", "docname", "owner", "creation", "data"],
			order_by="creation desc",
			limit=1500,
		)
		for v in versions:
			if tied_users and v.owner not in tied_users:
				continue
			raw_events.append(
				{
					"user": v.owner,
					"action": _("Updated"),
					"doctype": v.ref_doctype,
					"document": v.docname,
					"timestamp": v.creation,
					"detail": (v.data or "")[:180],
				}
			)

	if frappe.db.exists("DocType", "Activity Log"):
		logs = frappe.get_all(
			"Activity Log",
			filters={
				"creation": date_range,
				"reference_doctype": ["in", list(AUDIT_REF_DOCTYPES)],
			},
			fields=["user", "subject", "operation", "reference_doctype", "reference_name", "creation"],
			order_by="creation desc",
			limit=800,
		)
		for log in logs:
			actor = log.user or ""
			if tied_users and actor and actor not in tied_users:
				continue
			raw_events.append(
				{
					"user": actor,
					"action": log.operation or log.subject,
					"doctype": log.reference_doctype,
					"document": log.reference_name,
					"timestamp": log.creation,
					"detail": log.subject,
				}
			)

	pairs = [
		(e["doctype"], e["document"])
		for e in raw_events
		if e.get("doctype") and e.get("document")
	]
	company_map = _bulk_document_companies(pairs)

	rows = []
	for event in raw_events:
		dt, name = event.get("doctype"), event.get("document")
		company = company_map.get((dt, name)) if dt and name else None
		if not company or company not in allowed_company_set:
			continue
		event["company"] = company
		rows.append(event)

	rows.sort(key=lambda r: str(r.get("timestamp") or ""), reverse=True)
	rows = rows[:800]

	return _result(
		"user_audit_trail",
		_("User Activity / Audit Trail"),
		f,
		{
			"events": len(rows),
			"companies": len(allowed_companies),
			"users_in_scope": len(tied_users),
		},
		columns,
		rows,
	)


def get_odometer_exception_report(filters=None):
	f = _parse_filters(filters)
	exceptions = []

	insp_filters = {
		"inspection_date": ["between", [f["from_date"], f["to_date"]]],
		"docstatus": 1,
	}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		insp_filters["vin_chassis"] = ["in", vin_val]

	allowed_companies = get_permitted_dms_companies()
	insp_meta = (
		frappe.get_meta("Vehicle Inspection")
		if frappe.db.exists("DocType", "Vehicle Inspection")
		else None
	)
	if insp_meta and insp_meta.has_field("company"):
		if not allowed_companies:
			return {
				"report_id": "odometer_exception",
				"title": _("Odometer Exception Report"),
				"filters": _report_filters_response(f),
				"summary": {
					"exception_count": 0,
					"rollback": 0,
					"unreadable": 0,
					"high_jump": 0,
				},
				"columns": [],
				"rows": [],
			}
		insp_filters["company"] = ["in", allowed_companies]

	inspections = frappe.get_all(
		"Vehicle Inspection",
		filters=insp_filters,
		fields=["name", "vin_chassis", "odometer", "inspection_date", "license_plate"],
		order_by="vin_chassis, inspection_date",
		limit=1000,
	)
	vin_display = f.get("vin_number_map") or {}

	prev_by_vin = {}
	for inv in inspections:
		vin = inv.vin_chassis
		vin_label = (
			vin_display.get(vin) or frappe.db.get_value("VIN No", vin, "vin_number") if vin else ""
		)
		if not vin_label and vin:
			vin_label = vin
		odo = flt(inv.odometer)
		if odo <= 0:
			exceptions.append(
				{
					"type": "Unreadable / Missing",
					"document": inv.name,
					"vin": vin_label or vin,
					"odometer": odo,
					"detail": _("No odometer reading on inspection"),
					"date": inv.inspection_date,
				}
			)
			continue
		if vin in prev_by_vin:
			prev = prev_by_vin[vin]
			if odo < prev:
				exceptions.append(
					{
						"type": "Rollback",
						"document": inv.name,
						"vin": vin_label or vin,
						"odometer": odo,
						"detail": _("Dropped from {0} to {1} km").format(prev, odo),
						"date": inv.inspection_date,
					}
				)
			elif odo - prev > 50000:
				exceptions.append(
					{
						"type": "High Jump",
						"document": inv.name,
						"vin": vin_label or vin,
						"odometer": odo,
						"detail": _("Jump of {0} km since last reading").format(odo - prev),
						"date": inv.inspection_date,
					}
				)
		prev_by_vin[vin] = odo

	return {
		"report_id": "odometer_exception",
		"title": _("Odometer Exception Report"),
		"filters": _report_filters_response(f),
		"summary": {
			"exception_count": len(exceptions),
			"rollback": sum(1 for e in exceptions if e["type"] == "Rollback"),
			"unreadable": sum(1 for e in exceptions if "Unreadable" in e["type"]),
			"high_jump": sum(1 for e in exceptions if e["type"] == "High Jump"),
		},
		"columns": [
			{"key": "type", "label": _("Exception")},
			{"key": "document", "label": _("Document")},
			{"key": "vin", "label": _("VIN")},
			{"key": "odometer", "label": _("Reading")},
			{"key": "detail", "label": _("Detail")},
			{"key": "date", "label": _("Date")},
		],
		"rows": exceptions,
	}


def get_compliance_dashboard(filters=None):
	f = _parse_filters(filters)
	audit = get_user_audit_trail_report(f)
	odo = get_odometer_exception_report(f)
	return {
		"section_id": "compliance",
		"title": _("Compliance & Audit"),
		"filters": _report_filters_response(f),
		"summary": {
			"audit_events": audit["summary"].get("events", 0),
			"odometer_exceptions": odo["summary"].get("exception_count", 0),
			"rollback": odo["summary"].get("rollback", 0),
		},
	}


REPORT_HANDLERS = {
	"user_audit_trail": get_user_audit_trail_report,
	"odometer_exception": get_odometer_exception_report,
}
