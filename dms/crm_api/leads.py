# Copyright (c) 2026, Mania and contributors
"""CRM Lead APIs — dms.crm_api.leads (not dms.api.*)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from dms.crm_api.common import (
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Lead"

LIST_FIELDS = [
	"name",
	"lead_name",
	"status",
	"priority",
	"source",
	"mobile_no",
	"email",
	"organization_name",
	"lead_owner",
	"model",
	"next_action",
	"next_action_due",
	"lead_score",
	"customer",
	"creation",
	"modified",
]


def _enrich(row: dict) -> dict:
	row["owner_name"] = user_display_name(row.get("lead_owner"))
	return row


@frappe.whitelist()
def get_leads(status=None, priority=None, source=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)

	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	priority = (priority or "").strip()
	if priority and priority != "all":
		filters["priority"] = priority
	source = (source or "").strip()
	if source and source != "all":
		filters["source"] = source

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["lead_name", "like", f"%{search}%"],
			["mobile_no", "like", f"%{search}%"],
			["email", "like", f"%{search}%"],
			["organization_name", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
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
def get_lead(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Lead name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["owner_name"] = user_display_name(doc.lead_owner)
	return data


@frappe.whitelist()
def create_lead(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload:
		frappe.throw(_("Lead data is required."))

	doc = frappe.new_doc(DOCTYPE)
	allowed = {df.fieldname for df in frappe.get_meta(DOCTYPE).fields if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")}
	for key, value in payload.items():
		if key in allowed:
			doc.set(key, value)

	if not doc.lead_owner:
		doc.lead_owner = frappe.session.user
	if not doc.status:
		doc.status = "New"

	doc.insert()
	frappe.db.commit()
	return get_lead(doc.name)


@frappe.whitelist()
def update_lead(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Lead name is required."))
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
	return get_lead(doc.name)


@frappe.whitelist()
def convert_lead_to_opportunity(name, data=None):
	"""Create DMS CRM Opportunity from lead and mark lead Converted."""
	ensure_crm_write(DOCTYPE)
	ensure_crm_create("DMS CRM Opportunity")
	if not name:
		frappe.throw(_("Lead name is required."))

	lead = frappe.get_doc(DOCTYPE, name)
	payload = parse_json(data)

	opp = frappe.new_doc("DMS CRM Opportunity")
	opp.title = payload.get("title") or f"{lead.lead_name} — {lead.model or 'Opportunity'}"
	opp.lead = lead.name
	opp.customer = lead.customer
	opp.opportunity_owner = lead.lead_owner or frappe.session.user
	opp.company = lead.company
	opp.branch = lead.branch
	opp.brand = lead.brand
	opp.model = lead.model
	opp.variant = lead.variant
	opp.quantity = cint(lead.quantity) or 1
	opp.stage = "Qualified"
	opp.status = "Open"
	opp.next_action = payload.get("next_action") or "Follow up"
	opp.next_action_due = payload.get("next_action_due") or now_datetime()
	opp.insert()

	lead.status = "Converted"
	lead.opportunity = opp.name
	lead.save()
	frappe.db.commit()

	return {"lead": get_lead(lead.name), "opportunity": opp.name}
