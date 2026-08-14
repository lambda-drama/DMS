# Copyright (c) 2026, Mania and contributors
"""CRM Case APIs — dms.crm_api.cases (blueprint §12)."""

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
from dms.customer_relationship_management.doctype.dms_crm_case.dms_crm_case import (
	ESCALATION_BY_PRIORITY,
	user_can_close_protected,
)

DOCTYPE = "DMS CRM Case"


def _apply_payload(doc, payload: dict, *, allow_readonly=False):
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")
		and (allow_readonly or not df.read_only)
	}
	for key, value in (payload or {}).items():
		if key in allowed:
			doc.set(key, value)


def _enrich(row: dict) -> dict:
	row["owner_name"] = user_display_name(row.get("case_owner"))
	row["customer_name"] = customer_display_name(row.get("customer"))
	row["manager_name"] = user_display_name(row.get("manager"))
	return row


@frappe.whitelist()
def get_cases(status=None, priority=None, category=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	priority = (priority or "").strip()
	if priority and priority != "all":
		filters["priority"] = priority
	category = (category or "").strip()
	if category and category != "all":
		filters["category"] = category

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["subject", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
		]

	fields = [
		"name",
		"subject",
		"category",
		"priority",
		"status",
		"customer",
		"case_owner",
		"response_deadline",
		"resolution_target",
		"sla_breached",
		"escalation_level",
		"safety_impact",
		"protected_escalation",
		"vehicle_off_road",
		"opened_on",
		"modified",
	]
	meta = frappe.get_meta(DOCTYPE)
	fields = [f for f in fields if f == "name" or meta.has_field(f)]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters or None,
		fields=fields,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	summary = {}
	for p in ("Critical", "High", "Medium", "Low"):
		summary[p] = frappe.db.count(
			DOCTYPE, {"priority": p, "status": ["not in", ["Closed", "Resolved"]]}
		)
	summary["breached"] = frappe.db.count(
		DOCTYPE, {"sla_breached": 1, "status": ["not in", ["Closed", "Resolved"]]}
	)

	return {
		"data": [_enrich(dict(r)) for r in rows],
		"summary": summary,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_case(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Case name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	_enrich(data)
	data["can_close_protected"] = user_can_close_protected()
	data["activities"] = []
	if frappe.db.exists("DocType", "DMS CRM Activity"):
		data["activities"] = frappe.get_all(
			"DMS CRM Activity",
			filters={"case": doc.name},
			fields=["name", "subject", "activity_type", "status", "due_datetime", "disposition"],
			order_by="modified desc",
			limit=30,
		)
	return data


@frappe.whitelist()
def create_case(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload or not payload.get("subject"):
		frappe.throw(_("Case subject is required."))
	doc = frappe.new_doc(DOCTYPE)
	_apply_payload(doc, payload, allow_readonly=True)
	if not doc.case_owner:
		doc.case_owner = frappe.session.user
	if not doc.next_action:
		doc.next_action = "Acknowledge and investigate"
	if not doc.next_action_due:
		doc.next_action_due = now_datetime()
	doc.insert()
	frappe.db.commit()
	return get_case(doc.name)


@frappe.whitelist()
def update_case(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Case name is required."))
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	_apply_payload(doc, payload)
	doc.save()
	frappe.db.commit()
	return get_case(doc.name)


@frappe.whitelist()
def escalate_case(name, level=None, notes=None):
	ensure_crm_write(DOCTYPE)
	doc = frappe.get_doc(DOCTYPE, name)
	doc.escalation_level = level or ESCALATION_BY_PRIORITY.get(doc.priority) or "Department Manager"
	doc.escalated_on = now_datetime()
	if notes:
		doc.evidence_notes = ((doc.evidence_notes or "") + f"\n[Escalation] {notes}").strip()
	doc.save()
	# Notify manager / owner via activity
	if frappe.db.exists("DocType", "DMS CRM Activity"):
		frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": "Complaint Update",
				"subject": f"Escalated to {doc.escalation_level}: {doc.subject}",
				"status": "Open",
				"priority": "High" if doc.priority in ("Critical", "High") else "Medium",
				"customer": doc.customer,
				"case": doc.name,
				"assigned_to": doc.manager or doc.case_owner,
				"due_datetime": now_datetime(),
				"outcome_notes": notes,
			}
		).insert(ignore_permissions=True)
	frappe.db.commit()
	return get_case(doc.name)


@frappe.whitelist()
def check_case_slas(limit=200):
	"""Daily: refresh breach flags and auto-escalate open cases past SLA."""
	ensure_crm_write(DOCTYPE)
	names = frappe.get_all(
		DOCTYPE,
		filters={"status": ["not in", ["Resolved", "Closed"]]},
		pluck="name",
		limit_page_length=cint_limit(limit),
	)
	updated = 0
	for name in names:
		doc = frappe.get_doc(DOCTYPE, name)
		before = (doc.sla_breached, doc.escalation_level)
		doc._apply_breach_flags()
		if (doc.sla_breached, doc.escalation_level) != before:
			doc.save(ignore_permissions=True)
			updated += 1
	frappe.db.commit()
	return {"checked": len(names), "updated": updated}


def cint_limit(limit):
	from frappe.utils import cint

	return max(1, min(cint(limit) or 200, 500))


@frappe.whitelist()
def get_case_form_options():
	ensure_crm_read(DOCTYPE)
	meta = frappe.get_meta(DOCTYPE)

	def opts(fieldname):
		df = meta.get_field(fieldname)
		if not df or not df.options:
			return []
		return [o for o in df.options.split("\n") if o.strip()]

	return {
		"categories": opts("category"),
		"priorities": opts("priority"),
		"statuses": opts("status"),
		"sources": opts("source"),
		"departments": opts("responsible_department"),
		"escalation_levels": opts("escalation_level"),
		"closure_codes": opts("closure_code"),
		"satisfaction": opts("post_resolution_satisfaction"),
	}


@frappe.whitelist()
def create_case_from_complaint(activity=None, call_log=None, data=None):
	"""Create a Case from Activity disposition Complaint or Call Center."""
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	customer = payload.get("customer")
	subject = payload.get("subject") or "Customer complaint"
	source = payload.get("source") or "Call Center"

	if activity and frappe.db.exists("DMS CRM Activity", activity):
		act = frappe.get_doc("DMS CRM Activity", activity)
		customer = customer or act.customer
		subject = subject or act.subject or "Complaint from activity"
		if act.case:
			return get_case(act.case)

	doc = frappe.get_doc(
		{
			"doctype": DOCTYPE,
			"subject": subject[:140],
			"customer": customer,
			"source": source,
			"category": payload.get("category") or "General Request",
			"priority": payload.get("priority") or "High",
			"customer_statement": payload.get("customer_statement") or payload.get("notes"),
			"vehicle_vin": payload.get("vehicle_vin"),
			"status": "New",
		}
	)
	doc.insert()
	if activity and frappe.db.exists("DMS CRM Activity", activity):
		frappe.db.set_value("DMS CRM Activity", activity, "case", doc.name)
	frappe.db.commit()
	return get_case(doc.name)
