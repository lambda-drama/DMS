# Copyright (c) 2026, Mania and contributors
"""Customer Follow Up list / create / schedule APIs for the DMS frontend."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, getdate, now_datetime, today

from dms.api.utils import LIST_ORDER_LATEST_CREATED, resolve_dms_customer

DOCTYPE = "Customer Follow Up"


def _enrich_follow_up_row(row: dict) -> dict:
	customer = (row.get("customer") or "").strip()
	if customer and not row.get("customer_name"):
		row["customer_name"] = frappe.db.get_value("Customer", customer, "customer_name") or customer

	vin = (row.get("vehicle_vin") or "").strip()
	if vin and not row.get("license_plate"):
		row["license_plate"] = frappe.db.get_value("VIN No", vin, "plate_number") or ""
	if vin and not row.get("vehicle_model"):
		row["vehicle_model"] = (
			frappe.db.get_value("VIN No", vin, "model_name")
			or frappe.db.get_value("VIN No", vin, "model")
			or ""
		)

	due = row.get("follow_up_due_date")
	if due:
		try:
			row["is_overdue"] = (
				(row.get("contact_status") or "").strip() == "Pending"
				and getdate(due) < getdate(today())
			)
		except Exception:
			row["is_overdue"] = False
	else:
		row["is_overdue"] = False

	return row


@frappe.whitelist()
def get_follow_ups(
	status=None,
	filter=None,
	customer=None,
	search=None,
	limit=50,
	offset=0,
):
	"""Paginated Customer Follow Up list."""
	frappe.has_permission(DOCTYPE, "read", throw=True)

	filters = {}
	or_filters = []

	status = (status or "").strip()
	if status and status != "all":
		filters["contact_status"] = status

	customer = resolve_dms_customer(customer) if customer else None
	if customer:
		filters["customer"] = customer

	preset = (filter or "").strip().lower()
	if preset == "pending":
		filters["contact_status"] = "Pending"
	elif preset == "overdue":
		filters["contact_status"] = "Pending"
		filters["follow_up_due_date"] = ["<", today()]
	elif preset == "due_today":
		filters["follow_up_due_date"] = today()
	elif preset == "completed":
		filters["contact_status"] = "Reached"

	search = (search or "").strip()
	if search:
		or_filters = [
			["name", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
			["vehicle_vin", "like", f"%{search}%"],
			["job_card", "like", f"%{search}%"],
			["assigned_to", "like", f"%{search}%"],
			["contact_person_name", "like", f"%{search}%"],
		]
		# Also match customer name
		cust_names = frappe.get_all(
			"Customer",
			filters={"customer_name": ["like", f"%{search}%"]},
			pluck="name",
			limit=20,
		)
		if cust_names:
			or_filters.append(["customer", "in", cust_names])

	limit = max(1, min(cint_limit(limit), 200))
	offset = max(0, cint_limit(offset, default=0))

	kwargs = {
		"doctype": DOCTYPE,
		"filters": filters or None,
		"fields": [
			"name",
			"job_card",
			"delivery",
			"customer",
			"vehicle_vin",
			"follow_up_due_date",
			"follow_up_completed_date",
			"assigned_to",
			"contact_method",
			"contact_status",
			"case_status",
			"customer_rating",
			"customer_rating_score",
			"issue_resolved",
			"next_attempt_date",
			"creation",
			"modified",
		],
		"order_by": LIST_ORDER_LATEST_CREATED,
		"limit_page_length": limit,
		"limit_start": offset,
	}
	if or_filters:
		kwargs["or_filters"] = or_filters

	rows = frappe.get_all(**kwargs)
	total = frappe.db.count(DOCTYPE, filters=filters or None) if not or_filters else None
	if or_filters:
		# Approximate total with a second query
		total = len(
			frappe.get_all(
				DOCTYPE,
				filters=filters or None,
				or_filters=or_filters,
				pluck="name",
				limit=10000,
			)
		)

	data = [_enrich_follow_up_row(dict(r)) for r in rows]
	return {"data": data, "total": total or 0, "limit": limit, "offset": offset}


def cint_limit(value, default=50) -> int:
	from frappe.utils import cint

	try:
		return cint(value)
	except Exception:
		return default


@frappe.whitelist()
def get_follow_up(name):
	if not name:
		frappe.throw(_("Follow-up name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	doc.check_permission("read")
	data = doc.as_dict()
	return _enrich_follow_up_row(data)


@frappe.whitelist()
def create_follow_up(data=None):
	"""
	Create a standalone or job-linked follow-up.
	data: customer (or job_card), follow_up_due_date, contact_method, assigned_to, notes, …
	"""
	if isinstance(data, str):
		import json

		data = json.loads(data) if data else {}
	data = data or {}

	frappe.has_permission(DOCTYPE, "create", throw=True)

	job_card = (data.get("job_card") or "").strip() or None
	customer = resolve_dms_customer(data.get("customer")) if data.get("customer") else None
	vehicle_vin = (data.get("vehicle_vin") or "").strip() or None
	delivery = (data.get("delivery") or "").strip() or None

	if job_card:
		if not frappe.db.exists("DMS Job Card", job_card):
			frappe.throw(_("Job Card {0} does not exist.").format(job_card))
		if not customer:
			customer = frappe.db.get_value("DMS Job Card", job_card, "customer")
		if not vehicle_vin:
			vehicle_vin = frappe.db.get_value("DMS Job Card", job_card, "vehicle_vin")

	if not customer:
		frappe.throw(_("Customer is required (or link a Job Card)."))

	due = data.get("follow_up_due_date") or add_days(today(), 2)
	contact_method = (data.get("contact_method") or "Phone Call").strip() or "Phone Call"
	contact_status = (data.get("contact_status") or "Pending").strip() or "Pending"
	case_status = (data.get("case_status") or "Pending").strip() or "Pending"
	issue_resolved = (data.get("issue_resolved") or "N/A").strip() or "N/A"
	assigned_to = (data.get("assigned_to") or "").strip() or frappe.session.user

	notes = (data.get("contact_notes") or data.get("notes") or "").strip() or None

	doc = frappe.get_doc(
		{
			"doctype": DOCTYPE,
			"job_card": job_card,
			"delivery": delivery,
			"customer": customer,
			"vehicle_vin": vehicle_vin,
			"follow_up_due_date": due,
			"assigned_to": assigned_to,
			"contact_method": contact_method,
			"contact_status": contact_status,
			"case_status": case_status,
			"issue_resolved": issue_resolved,
			"contact_notes": notes,
			"contact_person_name": (data.get("contact_person_name") or "").strip() or None,
			"contact_phone_used": (data.get("contact_phone_used") or "").strip() or None,
			"next_attempt_date": data.get("next_attempt_date") or None,
			"follow_up_attempts": data.get("follow_up_attempts") or 1,
		}
	)
	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"customer": doc.customer,
		"customer_name": frappe.db.get_value("Customer", doc.customer, "customer_name"),
		"follow_up_due_date": str(doc.follow_up_due_date) if doc.follow_up_due_date else None,
		"contact_status": doc.contact_status,
		"case_status": doc.case_status,
	}


@frappe.whitelist()
def update_follow_up(name, data=None):
	if isinstance(data, str):
		import json

		data = json.loads(data) if data else {}
	data = data or {}

	if not name:
		frappe.throw(_("Follow-up name is required."))

	doc = frappe.get_doc(DOCTYPE, name)
	doc.check_permission("write")

	updatable = {
		"follow_up_due_date",
		"assigned_to",
		"contact_method",
		"contact_status",
		"contact_notes",
		"follow_up_attempts",
		"next_attempt_date",
		"contact_person_name",
		"contact_phone_used",
		"call_duration_minutes",
		"customer_rating",
		"customer_rating_score",
		"nps_score",
		"issue_resolved",
		"not_resolved_reason",
		"service_quality_rating",
		"technician_courtesy_rating",
		"advisor_courtesy_rating",
		"timeliness_rating",
		"customer_praise",
		"customer_complaint",
		"suggestions",
		"improvement_actions",
		"escalated_to_manager",
		"manager_feedback",
		"repeat_repair_risk",
		"repeat_repair_details",
		"new_issue_reported",
		"new_issue_details",
		"new_job_card_created",
		"case_status",
		"resolution_date",
		"job_card",
		"delivery",
		"customer",
		"vehicle_vin",
	}

	for key, value in data.items():
		if key not in updatable:
			continue
		if key == "customer" and value:
			value = resolve_dms_customer(value)
		doc.set(key, value)

	# Mark completed when reached/closed
	status = (doc.contact_status or "").strip()
	case = (doc.case_status or "").strip()
	if status == "Reached" or case in ("Resolved", "Closed"):
		if not doc.follow_up_completed_date:
			doc.follow_up_completed_date = now_datetime()
		if case in ("Resolved", "Closed") and not doc.resolution_date:
			doc.resolution_date = today()

	doc.save()
	frappe.db.commit()
	return get_follow_up(doc.name)


@frappe.whitelist()
def schedule_follow_up(name, follow_up_due_date=None, next_attempt_date=None, contact_notes=None):
	"""Reschedule due date / next attempt (callback)."""
	if not name:
		frappe.throw(_("Follow-up name is required."))

	doc = frappe.get_doc(DOCTYPE, name)
	doc.check_permission("write")

	if follow_up_due_date:
		doc.follow_up_due_date = follow_up_due_date
	if next_attempt_date:
		doc.next_attempt_date = next_attempt_date
		if (doc.contact_status or "").strip() == "Pending":
			doc.contact_status = "Callback Requested"
	if contact_notes is not None:
		note = (contact_notes or "").strip()
		if note:
			existing = (doc.contact_notes or "").strip()
			doc.contact_notes = f"{existing}\n{note}" if existing else note

	doc.save()
	frappe.db.commit()
	return get_follow_up(doc.name)
