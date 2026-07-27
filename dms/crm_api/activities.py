# Copyright (c) 2026, Mania and contributors
"""CRM Activity APIs — dms.crm_api.activities."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import now_datetime

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Activity"


@frappe.whitelist()
def get_activities(status=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status

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
			"activity_type",
			"subject",
			"status",
			"due_datetime",
			"assigned_to",
			"priority",
			"lead",
			"opportunity",
			"customer",
			"disposition",
			"modified",
		],
		order_by="due_datetime asc, modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	data = []
	for r in rows:
		row = dict(r)
		row["owner_name"] = user_display_name(row.get("assigned_to"))
		row["customer_name"] = customer_display_name(row.get("customer"))
		data.append(row)

	return {
		"data": data,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def create_activity(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload or not payload.get("subject"):
		frappe.throw(_("Activity subject is required."))
	doc = frappe.new_doc(DOCTYPE)
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")
	}
	for key, value in payload.items():
		if key in allowed:
			doc.set(key, value)
	if not doc.assigned_to:
		doc.assigned_to = frappe.session.user
	doc.insert()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def complete_activity(name, disposition=None, outcome_notes=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Activity name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	doc.status = "Completed"
	doc.completed_on = now_datetime()
	if disposition:
		doc.disposition = disposition
	if outcome_notes:
		doc.outcome_notes = outcome_notes
	doc.save()
	frappe.db.commit()
	return doc.as_dict()
