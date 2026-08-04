"""Call Center workspace APIs — blueprint §11.2."""

from __future__ import annotations

import re

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

CALL_LOG = "DMS CRM Call Log"
SCRIPT = "DMS CRM Call Script"
QUALITY = "DMS CRM Call Quality Score"
ACTIVITY = "DMS CRM Activity"

DEFAULT_QUEUES = [
	"Inbound",
	"New Leads",
	"Callbacks",
	"Service Reminders",
	"Lapsed Customers",
	"Surveys",
	"Complaints",
]


def _queues_from_settings() -> list[str]:
	try:
		raw = frappe.db.get_single_value("DMS CRM Settings", "call_center_queues") or ""
	except Exception:
		raw = ""
	queues = [q.strip() for q in str(raw).split("\n") if q.strip()]
	return queues or list(DEFAULT_QUEUES)


def _normalize_phone(value: str | None) -> str:
	if not value:
		return ""
	digits = re.sub(r"\D+", "", str(value))
	# Keep last 9–12 digits for loose matching
	return digits[-12:] if len(digits) > 12 else digits


@frappe.whitelist()
def get_call_center_queues():
	ensure_crm_read(CALL_LOG)
	queues = _queues_from_settings()
	counts = {}
	meta = frappe.get_meta(CALL_LOG)
	has_queue = meta.has_field("custom_queue")
	for q in queues:
		if has_queue:
			counts[q] = frappe.db.count(CALL_LOG, {"custom_queue": q})
		else:
			counts[q] = 0
	# Also surface open callback activities
	callback_open = 0
	if frappe.db.exists("DocType", ACTIVITY):
		callback_open = frappe.db.count(
			ACTIVITY,
			{"disposition": "Callback", "status": "Open"},
		)
	return {
		"queues": queues,
		"counts": counts,
		"open_callbacks": callback_open,
		"enable_click_to_call": cint(
			frappe.db.get_single_value("DMS CRM Settings", "enable_click_to_call") or 0
		),
	}


@frappe.whitelist()
def get_queue_calls(queue=None, status=None, search=None, limit=50, offset=0):
	ensure_crm_read(CALL_LOG)
	limit, offset = paginate(limit, offset)
	filters = {}
	meta = frappe.get_meta(CALL_LOG)
	if queue and queue != "all" and meta.has_field("custom_queue"):
		filters["custom_queue"] = queue
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"from": ["like", q],
			"to": ["like", q],
			"id": ["like", q],
		}
	fields = [
		"name",
		"id",
		"`from`",
		"`to`",
		"type",
		"status",
		"duration",
		"start_time",
		"caller",
		"receiver",
		"recording_url",
		"note",
	]
	for candidate in (
		"custom_queue",
		"custom_disposition",
		"custom_customer",
		"custom_callback_datetime",
		"custom_callback_owner",
		"custom_call_script",
	):
		if meta.has_field(candidate):
			fields.append(candidate)
	rows = frappe.get_all(
		CALL_LOG,
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["caller_name"] = user_display_name(row.get("caller"))
		if row.get("custom_customer"):
			row["customer_name"] = customer_display_name(row.custom_customer)
	return {
		"data": rows,
		"total": frappe.db.count(CALL_LOG, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def lookup_customer_by_phone(phone=None):
	"""Customer 360 pop-up for inbound match."""
	ensure_crm_read("Customer")
	phone = (phone or "").strip()
	if not phone:
		frappe.throw(_("Phone number is required."))
	norm = _normalize_phone(phone)
	if len(norm) < 6:
		return {"matched": False, "customers": []}

	# Match Customer mobile / phone and Contact phones
	customers = frappe.db.sql(
		"""
		select name, customer_name, mobile_no, email_id, customer_group, territory
		from `tabCustomer`
		where replace(replace(replace(replace(ifnull(mobile_no,''),'+',''),' ',''),'-',''),'(','')
			like %(like)s
		   or replace(replace(replace(replace(ifnull(email_id,''),'+',''),' ',''),'-',''),'(','')
			like %(like)s
		limit 10
		""",
		{"like": f"%{norm[-9:]}%"},
		as_dict=True,
	)
	if not customers and frappe.db.exists("DocType", "Contact"):
		contact_customers = frappe.db.sql(
			"""
			select distinct c.link_name as name
			from `tabContact` ct
			inner join `tabDynamic Link` c on c.parent = ct.name and c.link_doctype = 'Customer'
			where replace(replace(replace(replace(ifnull(ct.mobile_no,''),'+',''),' ',''),'-',''),'(','')
				like %(like)s
			   or replace(replace(replace(replace(ifnull(ct.phone,''),'+',''),' ',''),'-',''),'(','')
				like %(like)s
			limit 10
			""",
			{"like": f"%{norm[-9:]}%"},
			as_dict=True,
		)
		for row in contact_customers:
			cust = frappe.db.get_value(
				"Customer",
				row.name,
				["name", "customer_name", "mobile_no", "email_id", "customer_group", "territory"],
				as_dict=True,
			)
			if cust:
				customers.append(cust)

	if not customers:
		return {"matched": False, "customers": [], "phone": phone}

	primary = customers[0]
	open_activities = []
	if frappe.db.exists("DocType", ACTIVITY):
		open_activities = frappe.get_all(
			ACTIVITY,
			filters={"customer": primary.name, "status": "Open"},
			fields=["name", "subject", "activity_type", "due_datetime", "priority", "disposition"],
			order_by="due_datetime asc",
			limit=10,
		)
	return {
		"matched": True,
		"phone": phone,
		"customer": primary,
		"customers": customers,
		"open_activities": open_activities,
	}


@frappe.whitelist()
def set_call_disposition(name, data=None):
	"""Set disposition; when Callback, require datetime+owner and spawn Activity."""
	ensure_crm_write(CALL_LOG)
	payload = parse_json(data)
	doc = frappe.get_doc(CALL_LOG, name)
	disposition = payload.get("disposition") or payload.get("custom_disposition")
	if not disposition:
		frappe.throw(_("Disposition is required."))

	if hasattr(doc, "custom_disposition") or frappe.get_meta(CALL_LOG).has_field("custom_disposition"):
		doc.custom_disposition = disposition
	if payload.get("queue") is not None and frappe.get_meta(CALL_LOG).has_field("custom_queue"):
		doc.custom_queue = payload.get("queue")
	if payload.get("customer") and frappe.get_meta(CALL_LOG).has_field("custom_customer"):
		doc.custom_customer = payload.get("customer")
	if payload.get("call_script") and frappe.get_meta(CALL_LOG).has_field("custom_call_script"):
		doc.custom_call_script = payload.get("call_script")
	if payload.get("campaign") and frappe.get_meta(CALL_LOG).has_field("custom_campaign"):
		doc.custom_campaign = payload.get("campaign")
	if payload.get("note") is not None:
		doc.note = payload.get("note")

	activity_name = None
	case_name = None
	if disposition == "Callback":
		cb_dt = payload.get("callback_datetime") or payload.get("custom_callback_datetime")
		cb_owner = payload.get("callback_owner") or payload.get("custom_callback_owner")
		if not cb_dt or not cb_owner:
			frappe.throw(_("Callback requires date/time and owner."))
		doc.custom_callback_datetime = cb_dt
		doc.custom_callback_owner = cb_owner
		activity = frappe.get_doc(
			{
				"doctype": ACTIVITY,
				"activity_type": "Call",
				"subject": f"Callback: {doc.get('from') or doc.get('to') or doc.name}",
				"status": "Open",
				"priority": "High",
				"disposition": "Callback",
				"due_datetime": cb_dt,
				"assigned_to": cb_owner,
				"customer": getattr(doc, "custom_customer", None),
				"reference_doctype": CALL_LOG,
				"reference_name": doc.name,
				"outcome_notes": payload.get("note") or doc.note,
			}
		)
		activity.insert(ignore_permissions=True)
		activity_name = activity.name
		if frappe.get_meta(CALL_LOG).has_field("custom_activity"):
			doc.custom_activity = activity_name
	elif disposition == "Complaint":
		# §12 — open Case + follow-up Activity
		customer = getattr(doc, "custom_customer", None) or payload.get("customer")
		case_doc = frappe.get_doc(
			{
				"doctype": "DMS CRM Case",
				"subject": (payload.get("subject") or f"Complaint from call {doc.name}")[:140],
				"customer": customer,
				"source": "Call Center",
				"category": payload.get("category") or "General Request",
				"priority": payload.get("priority") or "High",
				"customer_statement": payload.get("note") or doc.note,
				"status": "New",
				"related_doctype": CALL_LOG,
				"related_name": doc.name,
			}
		)
		case_doc.insert(ignore_permissions=True)
		activity = frappe.get_doc(
			{
				"doctype": ACTIVITY,
				"activity_type": "Complaint Update",
				"subject": f"Complaint from call {doc.name}",
				"status": "Open",
				"priority": "High",
				"disposition": "Complaint",
				"due_datetime": now_datetime(),
				"customer": customer,
				"case": case_doc.name,
				"reference_doctype": CALL_LOG,
				"reference_name": doc.name,
			}
		)
		activity.insert(ignore_permissions=True)
		activity_name = activity.name
		case_name = case_doc.name

	doc.save()
	frappe.db.commit()
	out = {"name": doc.name, "activity": activity_name, "disposition": disposition}
	if case_name:
		out["case"] = case_name
	return out


@frappe.whitelist()
def get_call_scripts(purpose=None, language=None, queue=None):
	ensure_crm_read(SCRIPT)
	filters = {"is_active": 1}
	if purpose and purpose != "all":
		filters["purpose"] = purpose
	if language:
		filters["language"] = language
	if queue:
		filters["queue"] = queue
	return frappe.get_all(
		SCRIPT,
		filters=filters,
		fields=["name", "script_name", "purpose", "language", "campaign", "queue", "opening_line"],
		order_by="script_name asc",
		limit=100,
	)


@frappe.whitelist()
def get_call_script(name):
	ensure_crm_read(SCRIPT)
	return frappe.get_doc(SCRIPT, name).as_dict()


@frappe.whitelist()
def create_quality_score(data=None):
	ensure_crm_create(QUALITY)
	payload = parse_json(data)
	if not payload.get("call_log"):
		frappe.throw(_("Call Log is required."))
	if payload.get("score") is None:
		frappe.throw(_("Score is required."))
	doc = frappe.get_doc(
		{
			"doctype": QUALITY,
			"call_log": payload["call_log"],
			"score": cint(payload["score"]),
			"scored_by": payload.get("scored_by") or frappe.session.user,
			"coaching_notes": payload.get("coaching_notes"),
			"compliance_passed": cint(payload.get("compliance_passed", 1)),
			"compliance_notes": payload.get("compliance_notes"),
		}
	)
	doc.insert()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def click_to_call(phone=None, customer=None, queue=None):
	"""Create an outgoing call-log stub for dialer / softphone integration."""
	ensure_crm_create(CALL_LOG)
	if not cint(frappe.db.get_single_value("DMS CRM Settings", "enable_click_to_call") or 0):
		frappe.throw(_("Click-to-call is disabled in DMS CRM Settings."))
	phone = (phone or "").strip()
	if not phone:
		frappe.throw(_("Phone is required."))
	doc = frappe.get_doc(
		{
			"doctype": CALL_LOG,
			"type": "Outgoing",
			"status": "Initiated",
			"to": phone,
			"caller": frappe.session.user,
			"start_time": now_datetime(),
			"telephony_medium": "Manual",
		}
	)
	if frappe.get_meta(CALL_LOG).has_field("custom_customer") and customer:
		doc.custom_customer = customer
	if frappe.get_meta(CALL_LOG).has_field("custom_queue") and queue:
		doc.custom_queue = queue
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return {
		"call_log": doc.name,
		"phone": phone,
		"dial_uri": f"tel:{phone}",
	}
