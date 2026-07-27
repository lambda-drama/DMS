# Copyright (c) 2026, Mania and contributors
"""CRM Opportunity APIs — dms.crm_api.opportunities."""

from __future__ import annotations

import frappe
from frappe import _

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Opportunity"

LIST_FIELDS = [
	"name",
	"title",
	"stage",
	"status",
	"customer",
	"lead",
	"opportunity_owner",
	"expected_value",
	"probability",
	"expected_close_date",
	"model",
	"next_action_due",
	"creation",
	"modified",
]


def _enrich(row: dict) -> dict:
	row["owner_name"] = user_display_name(row.get("opportunity_owner"))
	row["customer_name"] = customer_display_name(row.get("customer"))
	return row


@frappe.whitelist()
def get_opportunities(status=None, stage=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	stage = (stage or "").strip()
	if stage and stage != "all":
		filters["stage"] = stage

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["title", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["model", "like", f"%{search}%"],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters or None,
		fields=LIST_FIELDS,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	total = frappe.db.count(DOCTYPE, filters=filters)
	return {
		"data": [_enrich(dict(r)) for r in rows],
		"total": total,
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_opportunity(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Opportunity name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["owner_name"] = user_display_name(doc.opportunity_owner)
	data["customer_name"] = customer_display_name(doc.customer)
	return data


@frappe.whitelist()
def create_opportunity(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload:
		frappe.throw(_("Opportunity data is required."))
	doc = frappe.new_doc(DOCTYPE)
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")
	}
	for key, value in payload.items():
		if key in allowed:
			doc.set(key, value)
	if not doc.opportunity_owner:
		doc.opportunity_owner = frappe.session.user
	if not doc.status:
		doc.status = "Open"
	if not doc.stage:
		doc.stage = "New"
	doc.insert()
	frappe.db.commit()
	return get_opportunity(doc.name)


@frappe.whitelist()
def update_opportunity(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Opportunity name is required."))
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML") and not df.read_only
	}
	for key, value in payload.items():
		if key in allowed:
			doc.set(key, value)
	doc.save()
	frappe.db.commit()
	return get_opportunity(doc.name)
