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

CUSTOM_LIST_FIELDS = (
	"custom_queue",
	"custom_disposition",
	"custom_customer",
	"custom_callback_datetime",
	"custom_callback_owner",
)


def _list_fields():
	meta = frappe.get_meta(DOCTYPE)
	fields = list(LIST_FIELDS)
	for fieldname in CUSTOM_LIST_FIELDS:
		if meta.has_field(fieldname):
			fields.append(fieldname)
	return fields

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
	"custom_queue",
	"custom_disposition",
	"custom_customer",
	"custom_callback_datetime",
	"custom_callback_owner",
	"custom_call_script",
	"custom_campaign",
	"custom_activity",
}


def _parse_helpers():
	from crm.fcrm.doctype.dms_crm_call_log.dms_crm_call_log import parse_call_log

	return parse_call_log


def _enrich_row(row: dict) -> dict:
	parse_call_log = _parse_helpers()
	row = parse_call_log(row)
	row["caller_name"] = user_display_name(row.get("caller"))
	row["receiver_name"] = user_display_name(row.get("receiver"))
	_attach_party_labels(row)
	return row


def _attach_party_labels(row: dict) -> None:
	"""Expose lead / contact display names for call log UI."""
	ref_dt = row.get("reference_doctype")
	ref_name = row.get("reference_docname")
	if ref_dt == "DMS CRM Lead" and ref_name:
		row["_lead"] = ref_name
		row["_lead_label"] = (
			frappe.db.get_value("DMS CRM Lead", ref_name, "lead_name") or ref_name
		)
	elif ref_dt == "Contact" and ref_name:
		row["_contact"] = ref_name
		first = frappe.db.get_value("Contact", ref_name, "first_name") or ""
		last = frappe.db.get_value("Contact", ref_name, "last_name") or ""
		full = f"{first} {last}".strip()
		row["_contact_label"] = full or ref_name
	elif ref_dt == "DMS CRM Opportunity" and ref_name:
		row["_deal"] = ref_name
		row["_deal_label"] = (
			frappe.db.get_value("DMS CRM Opportunity", ref_name, "title")
			or frappe.db.get_value("DMS CRM Opportunity", ref_name, "customer_name")
			or ref_name
		)

	for link in row.get("links") or []:
		ldt = link.get("link_doctype") if isinstance(link, dict) else getattr(link, "link_doctype", None)
		lname = link.get("link_name") if isinstance(link, dict) else getattr(link, "link_name", None)
		if not ldt or not lname:
			continue
		if ldt == "DMS CRM Lead" and not row.get("_lead"):
			row["_lead"] = lname
			row["_lead_label"] = frappe.db.get_value("DMS CRM Lead", lname, "lead_name") or lname
		elif ldt == "Contact" and not row.get("_contact"):
			row["_contact"] = lname
			first = frappe.db.get_value("Contact", lname, "first_name") or ""
			last = frappe.db.get_value("Contact", lname, "last_name") or ""
			row["_contact_label"] = f"{first} {last}".strip() or lname
		elif ldt == "DMS CRM Opportunity" and not row.get("_deal"):
			row["_deal"] = lname


def _link_party(doc, doctype: str, name: str, *, required: bool = False):
	"""Set primary reference and child Dynamic Link for lead/contact/deal."""
	name = (name or "").strip()
	if not name:
		if required:
			frappe.throw(_("{0} is required.").format(doctype))
		return False
	if not frappe.db.exists(doctype, name):
		if required:
			frappe.throw(_("{0} {1} not found.").format(doctype, name))
		# Optional party — ignore typos / stale ids instead of blocking the call log
		frappe.msgprint(
			_("{0} {1} was not found — call log saved without that link.").format(doctype, name),
			indicator="orange",
			alert=True,
		)
		return False
	doc.reference_doctype = doctype
	doc.reference_docname = name
	if hasattr(doc, "link_with_reference_doc"):
		doc.link_with_reference_doc(doctype, name)
	return True


def _linked_lead_name(doc) -> str | None:
	if getattr(doc, "reference_doctype", None) == "DMS CRM Lead" and getattr(doc, "reference_docname", None):
		return (doc.reference_docname or "").strip() or None
	for row in getattr(doc, "links", None) or []:
		if getattr(row, "link_doctype", None) == "DMS CRM Lead" and getattr(row, "link_name", None):
			return (row.link_name or "").strip() or None
	return None


def _maybe_advance_linked_lead(doc):
	"""Move lead pipeline when a call is logged.

	- Completed call → Contacted (from New / Assigned / Contact Attempted)
	- Other call outcomes → Contact Attempted (from New / Assigned)
	Never moves a later stage backward.
	"""
	lead_name = _linked_lead_name(doc)
	if not lead_name or not frappe.db.exists("DMS CRM Lead", lead_name):
		return

	call_status = (getattr(doc, "status", None) or "").strip()
	if call_status == "Completed":
		target = "Contacted"
		advance_from = {"New", "Assigned", "Contact Attempted", ""}
		default_action = "Follow up after call"
	else:
		target = "Contact Attempted"
		advance_from = {"New", "Assigned", ""}
		default_action = "Retry contact call"

	current = (frappe.db.get_value("DMS CRM Lead", lead_name, "status") or "").strip()
	if current not in advance_from:
		return

	lead = frappe.get_doc("DMS CRM Lead", lead_name)
	lead.status = target
	if not (lead.next_action or "").strip():
		lead.next_action = default_action
	if not lead.next_action_due:
		lead.next_action_due = now_datetime()
	lead.flags.ignore_permissions = True
	lead.save()


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

	_attach_party_labels(call)

	for link in call.get("links") or []:
		ldt = link.get("link_doctype")
		lname = link.get("link_name")
		if not ldt or not lname:
			continue
		if ldt == "DMS CRM Activity" and frappe.db.exists(ldt, lname):
			tasks.append(frappe.get_doc(ldt, lname).as_dict())
		elif ldt == "FCRM Note" and frappe.db.exists(ldt, lname):
			notes.append(frappe.get_doc(ldt, lname).as_dict())
		elif ldt == "DMS CRM Lead" and not call.get("_lead"):
			call["_lead"] = lname
			call["_lead_label"] = frappe.db.get_value("DMS CRM Lead", lname, "lead_name") or lname
		elif ldt == "Contact" and not call.get("_contact"):
			call["_contact"] = lname
			first = frappe.db.get_value("Contact", lname, "first_name") or ""
			last = frappe.db.get_value("Contact", lname, "last_name") or ""
			call["_contact_label"] = f"{first} {last}".strip() or lname
		elif ldt == "DMS CRM Opportunity" and not call.get("_deal"):
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
	# Do not default reference_doctype when no party is linked — Lead is optional.

	# duration may arrive as seconds or HH:MM:SS string
	if payload.get("duration") not in (None, ""):
		doc.duration = _normalize_duration(payload.get("duration"))

	# Clear stale Dynamic Link values unless a valid party is supplied below
	lead = (payload.get("lead") or "").strip()
	contact = (payload.get("contact") or "").strip()
	opportunity = (payload.get("opportunity") or "").strip()
	ref_name = (payload.get("reference_docname") or "").strip()
	if not (lead or contact or opportunity or ref_name):
		doc.reference_doctype = None
		doc.reference_docname = None

	doc.insert()

	if lead:
		if _link_party(doc, "DMS CRM Lead", lead):
			doc.save()
	elif contact:
		if _link_party(doc, "Contact", contact):
			doc.save()
	elif opportunity:
		if _link_party(doc, "DMS CRM Opportunity", opportunity):
			doc.save()
	elif payload.get("reference_doctype") and ref_name:
		if _link_party(doc, payload["reference_doctype"], ref_name):
			doc.save()

	note_title = (payload.get("note_title") or "").strip()
	note_content = (payload.get("note_content") or "").strip()
	if note_title or note_content:
		_attach_note(doc, {"title": note_title or "Call Note", "content": note_content})

	_maybe_advance_linked_lead(doc)

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

	lead = (payload.get("lead") or "").strip() if "lead" in payload else None
	contact = (payload.get("contact") or "").strip() if "contact" in payload else None
	opportunity = (payload.get("opportunity") or "").strip() if "opportunity" in payload else None

	# Explicit empty lead/contact clears the optional party link
	if lead is not None and lead == "" and contact is not None and contact == "":
		doc.reference_doctype = None
		doc.reference_docname = None
	elif lead:
		_link_party(doc, "DMS CRM Lead", lead)
	elif contact:
		_link_party(doc, "Contact", contact)
	elif opportunity:
		_link_party(doc, "DMS CRM Opportunity", opportunity)
	elif "reference_doctype" in payload or "reference_docname" in payload:
		ref_dt = (payload.get("reference_doctype") or doc.reference_doctype or "").strip()
		ref_name = (payload.get("reference_docname") or "").strip()
		if ref_dt and ref_name:
			_link_party(doc, ref_dt, ref_name)
		elif not ref_name:
			doc.reference_doctype = None
			doc.reference_docname = None

	doc.save()
	_maybe_advance_linked_lead(doc)
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
	from dms.dealer_management_system.utils.crm_user_settings import get_lead_sales_persons

	sales_person_ids = get_lead_sales_persons()
	users = []
	if sales_person_ids:
		users = frappe.get_all(
			"User",
			filters={"name": ["in", sales_person_ids], "enabled": 1},
			fields=["name", "full_name"],
			order_by="full_name asc",
			limit_page_length=200,
		)
	# Fallback: if no CRM user settings yet, show enabled system users so the
	# caller dropdown still works for managers / legacy setups.
	if not users:
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
		"leads": _lead_options(limit=100),
	}


def _lead_options(limit: int = 100) -> list[dict]:
	"""Compact lead list for Call Log Lead dropdown (optional link)."""
	if not frappe.db.exists("DocType", "DMS CRM Lead"):
		return []
	rows = frappe.get_all(
		"DMS CRM Lead",
		fields=["name", "lead_name", "mobile_no", "status", "organization_name"],
		order_by="modified desc",
		limit_page_length=cint(limit) or 100,
		ignore_permissions=True,
	)
	out = []
	for row in rows:
		label = row.lead_name or row.organization_name or row.name
		out.append(
			{
				"value": row.name,
				"label": label,
				"description": " · ".join(
					p for p in [row.mobile_no, row.status, row.name] if p
				),
				"mobile": row.mobile_no or "",
			}
		)
	return out


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
