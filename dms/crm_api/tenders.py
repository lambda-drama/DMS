"""Tender and framework agreement APIs — blueprint §9.2 / §9.3 commercial."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, getdate, today

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

TENDER = "DMS CRM Tender"
AGREEMENT = "DMS CRM Framework Agreement"

TENDER_FIELDS = (
	"title",
	"account",
	"customer",
	"issuing_body",
	"tender_category",
	"status",
	"company",
	"branch",
	"account_owner",
	"open_date",
	"close_date",
	"bid_deadline",
	"estimated_value",
	"currency",
	"opportunity",
	"framework_agreement",
	"technical_requirements",
	"commercial_requirements",
	"financing_method",
	"delivery_schedule_notes",
	"aftersales_commitments",
	"bid_version",
	"notes",
)

AGREEMENT_FIELDS = (
	"agreement_title",
	"agreement_number",
	"account",
	"customer",
	"status",
	"company",
	"branch",
	"valid_from",
	"valid_to",
	"max_units",
	"max_value",
	"currency",
	"sla_terms",
	"utilization_units",
	"utilization_value",
	"renewal_alert_days",
	"notes",
)


@frappe.whitelist()
def get_tenders(status=None, search=None, limit=50, offset=0):
	ensure_crm_read(TENDER)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"title": ["like", q],
			"customer": ["like", q],
			"issuing_body": ["like", q],
		}
	rows = frappe.get_all(
		TENDER,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"title",
			"customer",
			"account",
			"tender_category",
			"status",
			"bid_deadline",
			"estimated_value",
			"account_owner",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["customer_name"] = customer_display_name(row.customer)
		row["owner_name"] = user_display_name(row.account_owner)
	return {
		"data": rows,
		"total": frappe.db.count(TENDER, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_tender(name):
	ensure_crm_read(TENDER)
	doc = frappe.get_doc(TENDER, name)
	data = doc.as_dict()
	data["customer_name"] = customer_display_name(doc.customer)
	data["owner_name"] = user_display_name(doc.account_owner)
	return data


@frappe.whitelist()
def create_tender(data=None):
	ensure_crm_create(TENDER)
	payload = parse_json(data)
	if not payload.get("title"):
		frappe.throw(_("Tender title is required."))
	if not payload.get("customer") and payload.get("account"):
		payload["customer"] = frappe.db.get_value(
			"DMS CRM Account", payload["account"], "customer"
		)
	if not payload.get("customer"):
		frappe.throw(_("Customer is required."))
	doc = frappe.new_doc(TENDER)
	_apply_tender(doc, payload)
	if not doc.account_owner:
		doc.account_owner = frappe.session.user
	doc.insert()
	frappe.db.commit()
	return get_tender(doc.name)


@frappe.whitelist()
def update_tender(name, data=None):
	ensure_crm_write(TENDER)
	doc = frappe.get_doc(TENDER, name)
	_apply_tender(doc, parse_json(data))
	doc.save()
	frappe.db.commit()
	return get_tender(doc.name)


def _apply_tender(doc, payload: dict):
	for field in TENDER_FIELDS:
		if field in payload:
			doc.set(field, payload.get(field))
	if "requirements" in payload:
		doc.set("requirements", [])
		for row in payload.get("requirements") or []:
			doc.append(
				"requirements",
				{
					"model": row.get("model"),
					"specification": row.get("specification"),
					"quantity": row.get("quantity") or 1,
					"unit_estimate": row.get("unit_estimate"),
					"notes": row.get("notes"),
				},
			)


@frappe.whitelist()
def get_framework_agreements(status=None, search=None, limit=50, offset=0):
	ensure_crm_read(AGREEMENT)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"agreement_title": ["like", q],
			"agreement_number": ["like", q],
			"customer": ["like", q],
		}
	rows = frappe.get_all(
		AGREEMENT,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"agreement_title",
			"agreement_number",
			"customer",
			"account",
			"status",
			"valid_from",
			"valid_to",
			"max_units",
			"max_value",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["customer_name"] = customer_display_name(row.customer)
		row["renewal_due"] = _renewal_due(row)
	return {
		"data": rows,
		"total": frappe.db.count(AGREEMENT, filters=filters),
		"limit": limit,
		"offset": offset,
	}


def _renewal_due(row) -> bool:
	if not row.get("valid_to") or row.get("status") != "Active":
		return False
	alert_days = (
		frappe.db.get_value(AGREEMENT, row.name, "renewal_alert_days") or 60
	)
	return getdate(row.valid_to) <= getdate(add_days(today(), alert_days))


@frappe.whitelist()
def get_framework_agreement(name):
	ensure_crm_read(AGREEMENT)
	doc = frappe.get_doc(AGREEMENT, name)
	data = doc.as_dict()
	data["customer_name"] = customer_display_name(doc.customer)
	data["renewal_due"] = _renewal_due(data)
	return data


@frappe.whitelist()
def create_framework_agreement(data=None):
	ensure_crm_create(AGREEMENT)
	payload = parse_json(data)
	if not payload.get("agreement_title"):
		frappe.throw(_("Agreement title is required."))
	if not payload.get("customer") and payload.get("account"):
		payload["customer"] = frappe.db.get_value(
			"DMS CRM Account", payload["account"], "customer"
		)
	if not payload.get("customer"):
		frappe.throw(_("Customer is required."))
	doc = frappe.new_doc(AGREEMENT)
	_apply_agreement(doc, payload)
	doc.insert()
	frappe.db.commit()
	return get_framework_agreement(doc.name)


@frappe.whitelist()
def update_framework_agreement(name, data=None):
	ensure_crm_write(AGREEMENT)
	doc = frappe.get_doc(AGREEMENT, name)
	_apply_agreement(doc, parse_json(data))
	doc.save()
	frappe.db.commit()
	return get_framework_agreement(doc.name)


def _apply_agreement(doc, payload: dict):
	for field in AGREEMENT_FIELDS:
		if field in payload:
			doc.set(field, payload.get(field))


@frappe.whitelist()
def get_tender_form_options():
	ensure_crm_read(TENDER)
	tmeta = frappe.get_meta(TENDER)
	return {
		"categories": _opts(tmeta, "tender_category"),
		"statuses": _opts(tmeta, "status"),
		"financing_methods": _opts(tmeta, "financing_method"),
		"agreement_statuses": _opts(frappe.get_meta(AGREEMENT), "status"),
	}


def _opts(meta, fieldname):
	df = meta.get_field(fieldname)
	if not df or not df.options:
		return []
	return [o for o in df.options.split("\n") if o.strip()]
