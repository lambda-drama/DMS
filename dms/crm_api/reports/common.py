# Copyright (c) 2026, Mania and contributors
"""Shared helpers for CRM sales/aftersales reports (§17.5 standards)."""

from __future__ import annotations

from calendar import monthrange
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, get_first_day, getdate, nowdate

from dms.crm_api.common import ensure_crm_read

PERIOD_PRESETS = ("daily", "weekly", "monthly", "quarterly", "yearly")

LEAD = "DMS CRM Lead"
OPP = "DMS CRM Opportunity"
ACTIVITY = "DMS CRM Activity"
CASE = "DMS CRM Case"
CAMPAIGN = "DMS CRM Campaign"
BOOKING = "DMS CRM Booking"
REFERRAL = "DMS CRM Referral"
TEST_DRIVE = "DMS CRM Test Drive"
DELIVERY = "DMS CRM Delivery Readiness"
SERVICE_DUE = "DMS CRM Service Due"
REMINDER = "DMS CRM Reminder Log"
DEFERRED = "DMS CRM Deferred Work"
APPROVAL = "DMS CRM Approval Request"
TENDER = "DMS CRM Tender"
ACCOUNT = "DMS CRM Account"
APPOINTMENT = "DMS CRM Sales Appointment"
CALL_LOG = "DMS CRM Call Log"
CALL_QUALITY = "DMS CRM Call Quality Score"
ALLOCATION = "DMS CRM Allocation History"


def _dates_for_period(period: str, as_of=None):
	today = getdate(as_of or nowdate())
	period = (period or "").strip().lower()
	if period == "daily":
		return today, today
	if period == "weekly":
		start = today - timedelta(days=today.weekday())
		return start, start + timedelta(days=6)
	if period == "monthly":
		start = get_first_day(today)
		last = monthrange(today.year, today.month)[1]
		return start, today.replace(day=last)
	if period == "quarterly":
		q = (today.month - 1) // 3
		start_month = q * 3 + 1
		start = today.replace(month=start_month, day=1)
		end_month = start_month + 2
		end_day = monthrange(today.year, end_month)[1]
		return start, today.replace(month=end_month, day=end_day)
	if period == "yearly":
		return today.replace(month=1, day=1), today.replace(month=12, day=31)
	return add_days(today, -30), today


def parse_crm_filters(data=None):
	if isinstance(data, str):
		import json

		data = json.loads(data) if data else {}
	data = data or {}

	period = (data.get("period") or "").strip().lower() or None
	if period and period in PERIOD_PRESETS:
		from_date, to_date = _dates_for_period(period)
	else:
		period = None
		from_date = getdate(data.get("from_date") or add_days(nowdate(), -30))
		to_date = getdate(data.get("to_date") or nowdate())
	if from_date > to_date:
		from_date, to_date = to_date, from_date

	return {
		"from_date": from_date,
		"to_date": to_date,
		"period": period,
		"company": (data.get("company") or "").strip() or None,
		"country": (data.get("country") or "").strip() or None,
		"brand": (data.get("brand") or "").strip() or None,
		"branch": (data.get("branch") or "").strip() or None,
		"team": (data.get("team") or "").strip() or None,
		"owner": (data.get("owner") or data.get("lead_owner") or data.get("opportunity_owner") or "").strip()
		or None,
		"model": (data.get("model") or data.get("vehicle_model") or "").strip() or None,
		"source": (data.get("source") or "").strip() or None,
		"campaign": (data.get("campaign") or "").strip() or None,
	}


def filters_response(f):
	out = {"from_date": str(f["from_date"]), "to_date": str(f["to_date"])}
	for key in (
		"period",
		"company",
		"country",
		"brand",
		"branch",
		"team",
		"owner",
		"model",
		"source",
		"campaign",
	):
		if f.get(key):
			out[key] = f[key]
	return out


def dim_filters(f, *, owner_field="lead_owner", include_source=True, include_campaign=False):
	"""Common Link filters for CRM DocTypes."""
	conds = {}
	if f.get("company"):
		conds["company"] = f["company"]
	if f.get("branch"):
		conds["branch"] = f["branch"]
	if f.get("owner") and owner_field:
		conds[owner_field] = f["owner"]
	if f.get("model"):
		conds["model"] = f["model"]
	if include_source and f.get("source"):
		conds["source"] = f["source"]
	if include_campaign and f.get("campaign"):
		conds["campaign"] = f["campaign"]
	if f.get("brand"):
		conds["brand"] = f["brand"]
	return conds


def creation_between(f):
	return ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]]


def result(report_id, title, filters, summary, columns, rows, *, help_text=None, definitions=None):
	payload = {
		"report_id": report_id,
		"title": title,
		"filters": filters_response(filters),
		"summary": summary or {},
		"columns": columns or [],
		"rows": rows or [],
		"help_text": help_text or "",
		"definitions": definitions or {},
	}
	return payload


def empty_result(report_id, title, filters, columns, help_text=""):
	return result(report_id, title, filters, {"total": 0}, columns, [], help_text=help_text)


def ensure_report_access():
	"""CRM User or Manager can read reports (Lead as proxy permission)."""
	if frappe.session.user == "Administrator":
		return
	roles = set(frappe.get_roles())
	if roles.intersection({"System Manager", "DMS CRM Manager", "DMS CRM User"}):
		return
	ensure_crm_read(LEAD)


def dt_exists(name: str) -> bool:
	return bool(frappe.db.exists("DocType", name))


def col(key, label):
	return {"key": key, "label": label}


def pick_fields(doctype: str, required: list[str], optional: list[str] | tuple[str, ...] = ()):
	"""Return field list including only optional fields that exist on the DocType."""
	meta = frappe.get_meta(doctype)
	fields = list(required)
	for name in optional:
		if meta.has_field(name):
			fields.append(name)
	return fields


def group_count(rows, key):
	"""Return dict suitable for chartFromBreakdown (label → count)."""
	out: dict[str, int] = {}
	for r in rows:
		k = str(r.get(key) or "—")
		out[k] = out.get(k, 0) + 1
	return out


def group_count_list(rows, key):
	"""Sorted list form for tabular summaries."""
	out = group_count(rows, key)
	return [{"label": k, "value": v} for k, v in sorted(out.items(), key=lambda x: -x[1])]


def age_bucket(days: int) -> str:
	if days <= 1:
		return "0–1d"
	if days <= 3:
		return "2–3d"
	if days <= 7:
		return "4–7d"
	if days <= 14:
		return "8–14d"
	if days <= 30:
		return "15–30d"
	return "30d+"
