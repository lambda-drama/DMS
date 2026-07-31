# Copyright (c) 2026, Mania and contributors
"""CRM Call Log APIs — dms.crm_api.call_logs (DMS CRM Call Log)."""

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

DOCTYPE = "DMS CRM Call Log"

LIST_FIELDS = [
	"name",
	"id",
	"`from`",
	"`to`",
	"type",
	"status",
	"duration",
	"telephony_medium",
	"start_time",
	"end_time",
	"caller",
	"receiver",
	"recording_url",
	"note",
	"reference_doctype",
	"reference_docname",
	"creation",
	"modified",
]

WRITABLE = {
	"from",
	"to",
	"type",
	"status",
	"duration",
	"medium",
	"telephony_medium",
	"start_time",
	"end_time",
	"caller",
	"receiver",
	"recording_url",
	"note",
	"reference_doctype",
	"reference_docname",
}


def _parse_helpers():
	from crm.fcrm.doctype.dms_crm_call_log.dms_crm_call_log import parse_call_log

	return parse_call_log


def _enrich_row(row: dict) -> dict:
	parse_call_log = _parse_helpers()
	row = parse_call_log(row)
	row["caller_name"] = user_display_name(row.get("caller"))
	row["receiver_name"] = user_display_name(row.get("receiver"))
	return row


@frappe.whitelist()
def get_call_logs(
	status=None,
	type=None,
	search=None,
	limit=50,
	offset=0,
):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	call_type = (type or "").strip()
	if call_type and call_type != "all":
		filters["type"] = call_type

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["from", "like", f"%{search}%"],
			["to", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["id", "like", f"%{search}%"],
			["reference_docname", "like", f"%{search}%"],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters or None,
		fields=[
			"name",
			"id",
			"from",
			"to",
			"type",
			"status",
			"duration",
			"telephony_medium",
			"start_time",
			"end_time",
			"caller",
			"receiver",
			"recording_url",
			"note",
			"reference_doctype",
			"reference_docname",
			"creation",
			"modified",
		],
		order_by="creation desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	data = [_enrich_row(dict(r)) for r in rows]
	return {
		"data": data,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_call_log(name: str):
	ensure_crm_read(DOCTYPE)
	if not name or not frappe.db.exists(DOCTYPE, name):
		frappe.throw(_("Call log not found."))

	doc = frappe.get_doc(DOCTYPE, name)
	call = doc.as_dict()
	call = _enrich_row(call)

	notes = []
	tasks = []

	if call.get("note") and frappe.db.exists("FCRM Note", call.get("note")):
		notes.append(frappe.get_doc("FCRM Note", call.get("note")).as_dict())

	if call.get("reference_doctype") == "DMS CRM Lead" and call.get("reference_docname"):
		call["_lead"] = call.get("reference_docname")
	elif call.get("reference_doctype") == "DMS CRM Opportunity" and call.get("reference_docname"):
		call["_deal"] = call.get("reference_docname")

	for link in call.get("links") or []:
		ldt = link.get("link_doctype")
		lname = link.get("link_name")
		if not ldt or not lname:
			continue
		if ldt == "DMS CRM Activity" and frappe.db.exists(ldt, lname):
			tasks.append(frappe.get_doc(ldt, lname).as_dict())
		elif ldt == "FCRM Note" and frappe.db.exists(ldt, lname):
			notes.append(frappe.get_doc(ldt, lname).as_dict())
		elif ldt == "DMS CRM Lead":
			call["_lead"] = lname
		elif ldt == "DMS CRM Opportunity":
			call["_deal"] = lname

	call["_tasks"] = tasks
	call["_notes"] = notes
	if call.get("recording_url"):
		call["recording_url_path"] = call.get("recording_url")
	return call


@frappe.whitelist()
def create_call_log(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data) or {}
	if not payload.get("from") or not payload.get("to"):
		frappe.throw(_("From and To numbers are required."))
	if not payload.get("type"):
		frappe.throw(_("Call type is required."))
	if not payload.get("status"):
		payload["status"] = "Completed"

	doc = frappe.new_doc(DOCTYPE)
	for key, value in payload.items():
		if key in WRITABLE:
			doc.set(key, value)

	if not doc.start_time:
		doc.start_time = now_datetime()
	if doc.type == "Outgoing" and not doc.caller:
		doc.caller = frappe.session.user
	if doc.type == "Incoming" and not doc.receiver:
		doc.receiver = frappe.session.user
	if not doc.reference_doctype:
		doc.reference_doctype = "DMS CRM Lead"

	# duration may arrive as seconds or HH:MM:SS string
	if payload.get("duration") not in (None, ""):
		doc.duration = _normalize_duration(payload.get("duration"))

	doc.insert()

	lead = (payload.get("lead") or "").strip()
	opportunity = (payload.get("opportunity") or "").strip()
	if lead:
		doc.reference_doctype = "DMS CRM Lead"
		doc.reference_docname = lead
		doc.link_with_reference_doc("DMS CRM Lead", lead)
		doc.save()
	elif opportunity:
		doc.reference_doctype = "DMS CRM Opportunity"
		doc.reference_docname = opportunity
		doc.link_with_reference_doc("DMS CRM Opportunity", opportunity)
		doc.save()

	note_title = (payload.get("note_title") or "").strip()
	note_content = (payload.get("note_content") or "").strip()
	if note_title or note_content:
		_attach_note(doc, {"title": note_title or "Call Note", "content": note_content})

	frappe.db.commit()
	return get_call_log(doc.name)


@frappe.whitelist()
def update_call_log(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Call log name is required."))
	payload = parse_json(data) or {}
	doc = frappe.get_doc(DOCTYPE, name)
	for key, value in payload.items():
		if key in WRITABLE:
			if key == "duration":
				doc.duration = _normalize_duration(value)
			else:
				doc.set(key, value)
	doc.save()
	frappe.db.commit()
	return get_call_log(doc.name)


@frappe.whitelist()
def create_lead_from_call_log(call_log, lead_details=None):
	ensure_crm_write(DOCTYPE)
	ensure_crm_create("DMS CRM Lead")

	call_log_name = None
	if isinstance(call_log, dict):
		call_log_name = call_log.get("name") or call_log.get("id")
	elif isinstance(call_log, str):
		text = call_log.strip()
		if text.startswith("{"):
			parsed = parse_json(text)
			if isinstance(parsed, dict):
				call_log_name = parsed.get("name") or parsed.get("id")
			else:
				call_log_name = text
		else:
			call_log_name = text

	if not call_log_name:
		frappe.throw(_("A valid call log is required."))

	call_log_name = _resolve_call_name(call_log_name)
	call_doc = frappe.get_doc(DOCTYPE, call_log_name)
	details = parse_json(lead_details) or {}
	if details and not isinstance(details, dict):
		frappe.throw(_("Invalid lead details supplied."))

	meta = frappe.get_meta("DMS CRM Lead")
	valid = {df.fieldname for df in meta.fields}
	sanitized = {k: v for k, v in details.items() if k in valid}

	phone = call_doc.get("from") if call_doc.type == "Incoming" else call_doc.get("to")
	if "mobile_no" in valid and not sanitized.get("mobile_no"):
		sanitized["mobile_no"] = phone or ""
	if "first_name" in valid and not sanitized.get("first_name"):
		sanitized["first_name"] = _("Lead from call {0}").format(sanitized.get("mobile_no") or call_doc.name)
	if "source" in valid and not sanitized.get("source"):
		sanitized["source"] = "Phone Call"
	if "lead_owner" in valid and not sanitized.get("lead_owner"):
		sanitized["lead_owner"] = frappe.session.user

	lead = frappe.new_doc("DMS CRM Lead")
	lead.update(sanitized)
	lead.insert()

	call_doc.reference_doctype = "DMS CRM Lead"
	call_doc.reference_docname = lead.name
	call_doc.link_with_reference_doc("DMS CRM Lead", lead.name)
	call_doc.save()
	frappe.db.commit()
	return {"lead": lead.name, "call_log": call_doc.name}


@frappe.whitelist()
def add_note_to_call_log(call_log, note=None):
	ensure_crm_write(DOCTYPE)
	name = _resolve_call_name(call_log)
	payload = parse_json(note) or {}
	doc = frappe.get_doc(DOCTYPE, name)
	_note = _attach_note(doc, payload)
	frappe.db.commit()
	return _note.as_dict() if hasattr(_note, "as_dict") else _note


@frappe.whitelist()
def add_task_to_call_log(call_log, task=None):
	"""Attach a DMS CRM Activity (task) to the call log."""
	ensure_crm_write(DOCTYPE)
	ensure_crm_create("DMS CRM Activity")
	name = _resolve_call_name(call_log)
	payload = parse_json(task) or {}
	doc = frappe.get_doc(DOCTYPE, name)

	activity_name = (payload.get("name") or "").strip()
	notes = payload.get("outcome_notes") or payload.get("description") or payload.get("content")
	if activity_name and frappe.db.exists("DMS CRM Activity", activity_name):
		activity = frappe.get_doc("DMS CRM Activity", activity_name)
		for key in ("subject", "due_datetime", "priority", "status", "assigned_to", "outcome_notes"):
			if key == "outcome_notes" and notes not in (None, ""):
				activity.set("outcome_notes", notes)
			elif payload.get(key) not in (None, ""):
				activity.set(key, payload.get(key))
		activity.save()
	else:
		subject = (payload.get("subject") or payload.get("title") or "").strip()
		if not subject:
			frappe.throw(_("Activity subject is required."))
		activity = frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": payload.get("activity_type") or "Call",
				"subject": subject,
				"outcome_notes": notes,
				"status": payload.get("status") or "Open",
				"priority": payload.get("priority") or "Medium",
				"assigned_to": payload.get("assigned_to") or frappe.session.user,
				"due_datetime": payload.get("due_datetime") or payload.get("due_date"),
				"lead": doc.reference_docname if doc.reference_doctype == "DMS CRM Lead" else None,
				"opportunity": doc.reference_docname
				if doc.reference_doctype == "DMS CRM Opportunity"
				else None,
			}
		)
		activity.insert()

	doc.link_with_reference_doc("DMS CRM Activity", activity.name)
	doc.save()
	frappe.db.commit()
	return activity.as_dict()


@frappe.whitelist()
def get_call_log_form_options():
	ensure_crm_read(DOCTYPE)
	users = frappe.get_all(
		"User",
		filters={"enabled": 1, "user_type": "System User"},
		fields=["name", "full_name"],
		order_by="full_name asc",
		limit_page_length=200,
	)
	return {
		"statuses": [
			"Initiated",
			"Ringing",
			"In Progress",
			"Completed",
			"Failed",
			"Busy",
			"No Answer",
			"Queued",
			"Canceled",
		],
		"types": ["Incoming", "Outgoing"],
		"telephony_mediums": ["Manual", "Twilio", "Exotel"],
		"users": [{"value": u.name, "label": u.full_name or u.name} for u in users],
		"reference_doctypes": ["DMS CRM Lead", "DMS CRM Opportunity", "Customer", "Contact"],
	}


def _resolve_call_name(call_log) -> str:
	data = parse_json(call_log) or call_log
	if isinstance(data, dict):
		name = data.get("name") or data.get("id")
	else:
		name = data
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Call log is required."))
	if frappe.db.exists(DOCTYPE, name):
		return name
	# allow lookup by telephony id
	by_id = frappe.db.get_value(DOCTYPE, {"id": name}, "name")
	if by_id:
		return by_id
	frappe.throw(_("Call log {0} not found.").format(name))


def _attach_note(call_doc, payload: dict):
	if not frappe.db.exists("DocType", "FCRM Note"):
		frappe.throw(_("FCRM Note is not available. Install/enable Frappe CRM notes."))

	note_name = (payload.get("name") or "").strip()
	title = (payload.get("title") or "Call Note").strip()
	content = payload.get("content") or ""

	if note_name and frappe.db.exists("FCRM Note", note_name):
		note = frappe.get_doc("FCRM Note", note_name)
		if title:
			note.title = title
		if content is not None:
			note.content = content
		note.save(ignore_permissions=True)
	else:
		note = frappe.get_doc(
			{
				"doctype": "FCRM Note",
				"title": title,
				"content": content,
			}
		).insert(ignore_permissions=True)

	call_doc.note = note.name
	call_doc.link_with_reference_doc("FCRM Note", note.name)
	call_doc.save()
	return note


def _normalize_duration(value):
	if value in (None, ""):
		return 0
	if isinstance(value, (int, float)):
		return cint(value)
	text = str(value).strip()
	if text.isdigit():
		return cint(text)
	# HH:MM:SS or MM:SS
	parts = [cint(p) for p in text.split(":")]
	if len(parts) == 3:
		return parts[0] * 3600 + parts[1] * 60 + parts[2]
	if len(parts) == 2:
		return parts[0] * 60 + parts[1]
	return cint(text) if text else 0
