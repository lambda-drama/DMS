# Copyright (c) 2026, Mania and contributors
"""CRM Sales Appointments — showroom / sales visits (DMS CRM Sales Appointment)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Sales Appointment"
OPP = "DMS CRM Opportunity"

LIST_FIELDS = [
	"name",
	"opportunity",
	"customer",
	"appointment_datetime",
	"duration_minutes",
	"status",
	"appointment_type",
	"assigned_to",
	"company",
	"branch",
	"agenda",
	"modified",
]


def _enrich(row: dict) -> dict:
	row["customer_name"] = customer_display_name(row.get("customer"))
	row["owner_name"] = user_display_name(row.get("assigned_to"))
	if row.get("opportunity"):
		row["opportunity_title"] = (
			frappe.db.get_value(OPP, row["opportunity"], "title") or row["opportunity"]
		)
	return row


def _default_company():
	try:
		settings = frappe.get_cached_doc("DMS CRM Settings")
		return settings.default_company
	except Exception:
		return None


def _parse_datetime(value):
	if not value:
		return value
	text = str(value).replace("T", " ").strip()
	if len(text) == 16:
		text += ":00"
	return text


@frappe.whitelist()
def get_appointments(status=None, search=None, customer=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	if customer:
		filters["customer"] = customer

	or_filters = None
	search = (search or "").strip()
	if search:
		or_filters = [
			["name", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
			["opportunity", "like", f"%{search}%"],
			["agenda", "like", f"%{search}%"],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=LIST_FIELDS,
		order_by="appointment_datetime desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	return {
		"data": [_enrich(dict(r)) for r in rows],
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_appointment(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Appointment name is required."))
	data = frappe.get_doc(DOCTYPE, name).as_dict()
	return _enrich(data)


@frappe.whitelist()
def get_form_options():
	ensure_crm_read(DOCTYPE)
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies
	from dms.dealer_management_system.utils.branch_permissions import get_dms_branches

	meta = frappe.get_meta(DOCTYPE)

	def opts(fieldname, fallback=None):
		df = meta.get_field(fieldname)
		raw = (df.options or "") if df else ""
		values = [o.strip() for o in raw.split("\n") if o.strip()]
		return values or list(fallback or [])

	companies = get_dms_companies()
	default_company = _default_company()
	if default_company not in companies:
		default_company = companies[0] if companies else None
	branches = [row["name"] for row in get_dms_branches(company=default_company, limit=500)]
	users = frappe.get_all(
		"User",
		filters={"enabled": 1, "user_type": "System User"},
		fields=["name", "full_name"],
		order_by="full_name asc",
		limit_page_length=200,
	)
	return {
		"statuses": opts("status"),
		"appointment_types": opts("appointment_type"),
		"companies": companies,
		"default_company": default_company,
		"branches": branches,
		"users": [{"value": u.name, "label": u.full_name or u.name} for u in users],
	}


@frappe.whitelist()
def create_appointment(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	payload["appointment_datetime"] = _parse_datetime(payload.get("appointment_datetime"))
	if not payload.get("appointment_datetime"):
		frappe.throw(_("Appointment date and time are required."))

	customer = (payload.get("customer") or "").strip()
	opportunity = (payload.get("opportunity") or "").strip()
	company = (payload.get("company") or "").strip()
	branch = payload.get("branch")
	assigned_to = payload.get("assigned_to") or frappe.session.user

	if opportunity:
		if not frappe.db.exists(OPP, opportunity):
			frappe.throw(_("Deal {0} was not found.").format(opportunity))
		opp = frappe.get_doc(OPP, opportunity)
		customer = customer or opp.customer
		company = company or opp.company
		branch = branch or opp.branch
		assigned_to = payload.get("assigned_to") or opp.opportunity_owner or assigned_to

	if not customer:
		frappe.throw(_("Select a customer (or a deal that already has a customer)."))
	if not company:
		company = _default_company()
	if not company:
		frappe.throw(_("Company is required."))

	doc = frappe.get_doc(
		{
			"doctype": DOCTYPE,
			"opportunity": opportunity or None,
			"customer": customer,
			"appointment_datetime": payload.get("appointment_datetime"),
			"duration_minutes": cint(payload.get("duration_minutes") or 60),
			"status": payload.get("status") or "Scheduled",
			"appointment_type": payload.get("appointment_type") or "Showroom Appointment",
			"assigned_to": assigned_to,
			"company": company,
			"branch": branch,
			"agenda": payload.get("agenda"),
		}
	)
	doc.insert()

	if opportunity:
		opp = frappe.get_doc(OPP, opportunity)
		if not opp.sales_appointment:
			opp.sales_appointment = doc.name
		if (opp.stage or "") in ("", "New", "Qualified"):
			opp.stage = "Appointment Scheduled"
		opp.save()

	frappe.db.commit()
	return _enrich(doc.as_dict())


@frappe.whitelist()
def update_appointment(name, data=None):
	ensure_crm_write(DOCTYPE)
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	if "appointment_datetime" in payload:
		payload["appointment_datetime"] = _parse_datetime(payload.get("appointment_datetime"))
	for fieldname in (
		"appointment_datetime",
		"duration_minutes",
		"status",
		"appointment_type",
		"assigned_to",
		"agenda",
		"outcome_notes",
		"branch",
	):
		if fieldname in payload:
			doc.set(fieldname, payload.get(fieldname))
	if payload.get("status") == "Completed" and not doc.completed_on:
		doc.completed_on = now_datetime()
	doc.save()
	frappe.db.commit()
	return _enrich(doc.as_dict())
