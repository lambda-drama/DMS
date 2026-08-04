# Copyright (c) 2026, Mania and contributors
"""CRM Approval Request APIs — blueprint §15.3."""

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
from dms.customer_relationship_management.doctype.dms_crm_approval_request.dms_crm_approval_request import (
	user_can_approve,
)

DOCTYPE = "DMS CRM Approval Request"


def _apply(doc, payload):
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")
		and not df.read_only
	}
	for key, value in (payload or {}).items():
		if key in allowed and key != "status":
			doc.set(key, value)


@frappe.whitelist()
def get_approvals(status=None, approval_type=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	if approval_type and approval_type != "all":
		filters["approval_type"] = approval_type
	or_filters = None
	search = (search or "").strip()
	if search:
		or_filters = [["title", "like", f"%{search}%"], ["name", "like", f"%{search}%"]]
	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"title",
			"approval_type",
			"status",
			"requested_by",
			"requested_on",
			"amount",
			"customer",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for r in rows:
		r["requester_name"] = user_display_name(r.get("requested_by"))
		r["customer_name"] = customer_display_name(r.get("customer"))
	return {
		"data": rows,
		"pending": frappe.db.count(DOCTYPE, {"status": "Pending"}),
		"can_approve": user_can_approve(),
		"total": frappe.db.count(DOCTYPE, filters=filters),
	}


@frappe.whitelist()
def get_approval(name):
	ensure_crm_read(DOCTYPE)
	data = frappe.get_doc(DOCTYPE, name).as_dict()
	data["requester_name"] = user_display_name(data.get("requested_by"))
	data["approver_name"] = user_display_name(data.get("approver"))
	data["customer_name"] = customer_display_name(data.get("customer"))
	data["can_approve"] = user_can_approve()
	return data


@frappe.whitelist()
def create_approval(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload.get("title") or not payload.get("approval_type") or not payload.get("reason"):
		frappe.throw(_("Title, approval type and reason are required."))
	doc = frappe.new_doc(DOCTYPE)
	_apply(doc, payload)
	doc.status = "Pending"
	doc.requested_by = frappe.session.user
	doc.requested_on = now_datetime()
	doc.insert()
	frappe.db.commit()
	return get_approval(doc.name)


@frappe.whitelist()
def decide_approval(name, decision=None, decision_notes=None):
	ensure_crm_write(DOCTYPE)
	if not user_can_approve():
		frappe.throw(_("Only a DMS CRM Manager can decide approvals."), frappe.PermissionError)
	decision = (decision or "").strip().title()
	if decision not in ("Approved", "Rejected"):
		frappe.throw(_("Decision must be Approved or Rejected."))
	doc = frappe.get_doc(DOCTYPE, name)
	if doc.status != "Pending":
		frappe.throw(_("Only pending requests can be decided."))
	doc.status = decision
	doc.decision_notes = decision_notes
	doc.save()
	frappe.db.commit()
	return get_approval(doc.name)


@frappe.whitelist()
def get_approval_form_options():
	ensure_crm_read(DOCTYPE)
	df = frappe.get_meta(DOCTYPE).get_field("approval_type")
	types = [o for o in (df.options or "").split("\n") if o.strip()] if df else []
	return {
		"approval_types": types,
		"statuses": ["Pending", "Approved", "Rejected", "Cancelled"],
		"can_approve": user_can_approve(),
	}
