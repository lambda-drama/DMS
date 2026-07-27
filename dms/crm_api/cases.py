# Copyright (c) 2026, Mania and contributors
"""CRM Case APIs — dms.crm_api.cases."""

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

DOCTYPE = "DMS CRM Case"


@frappe.whitelist()
def get_cases(status=None, priority=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	priority = (priority or "").strip()
	if priority and priority != "all":
		filters["priority"] = priority

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["subject", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters or None,
		fields=[
			"name",
			"subject",
			"category",
			"priority",
			"status",
			"customer",
			"case_owner",
			"response_deadline",
			"sla_breached",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	data = []
	for r in rows:
		row = dict(r)
		row["owner_name"] = user_display_name(row.get("case_owner"))
		row["customer_name"] = customer_display_name(row.get("customer"))
		data.append(row)

	return {
		"data": data,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def create_case(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload or not payload.get("subject"):
		frappe.throw(_("Case subject is required."))
	doc = frappe.new_doc(DOCTYPE)
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")
	}
	for key, value in payload.items():
		if key in allowed:
			doc.set(key, value)
	if not doc.case_owner:
		doc.case_owner = frappe.session.user
	doc.insert()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def update_case(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Case name is required."))
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
	return doc.as_dict()
