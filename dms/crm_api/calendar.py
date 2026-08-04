# Copyright (c) 2026, Mania and contributors
"""CRM calendar events — activities, service/sales appointments and test drives."""

from __future__ import annotations

import frappe
from frappe.utils import getdate

from dms.crm_api.common import ensure_crm_read

ACTIVITY = "DMS CRM Activity"
APPOINTMENT = "Service Appointment"
SALES_APPOINTMENT = "DMS CRM Sales Appointment"
TEST_DRIVE = "DMS CRM Test Drive"
LEAD = "DMS CRM Lead"
OPP = "DMS CRM Opportunity"


@frappe.whitelist()
def get_calendar_events(
	from_date=None,
	to_date=None,
	branch=None,
	advisor=None,
	bay=None,
	appointment_type=None,
	event_types=None,
):
	"""Return mixed calendar events for the CRM calendar month/week view.

	Optional filters (§11.1): branch, advisor, bay, appointment_type, event_types
	(comma-separated: appointment,sales_appointment,test_drive,activity,lead,opportunity).
	"""
	ensure_crm_read(ACTIVITY)

	if not from_date or not to_date:
		frappe.throw("from_date and to_date are required.")

	start = getdate(from_date)
	end = getdate(to_date)
	events = []
	allowed = None
	if event_types:
		allowed = {t.strip() for t in str(event_types).split(",") if t.strip()}

	def _want(kind: str) -> bool:
		return allowed is None or kind in allowed

	# CRM activities
	if _want("activity") and frappe.db.exists("DocType", ACTIVITY):
		filters = {
			"due_datetime": ["between", [str(start), str(end) + " 23:59:59"]],
		}
		if advisor:
			filters["assigned_to"] = advisor
		rows = frappe.get_all(
			ACTIVITY,
			filters=filters,
			fields=[
				"name",
				"subject",
				"activity_type",
				"status",
				"due_datetime",
				"assigned_to",
				"customer",
				"lead",
				"opportunity",
			],
			limit=500,
		)
		for r in rows:
			events.append(
				{
					"id": r.name,
					"title": r.subject or r.activity_type or r.name,
					"start": str(r.due_datetime) if r.due_datetime else None,
					"type": "activity",
					"subtype": r.activity_type,
					"status": r.status,
					"ref_doctype": ACTIVITY,
					"ref_name": r.name,
					"customer": r.customer,
					"branch": None,
					"advisor": r.assigned_to,
				}
			)

	# DMS service appointments (same records as DMS Appointments)
	if _want("appointment") and frappe.db.exists("DocType", APPOINTMENT):
		meta = frappe.get_meta(APPOINTMENT)
		filters = {
			"appointment_date_time": ["between", [str(start), str(end) + " 23:59:59"]],
		}
		if branch and meta.has_field("branch"):
			filters["branch"] = branch
		if advisor and meta.has_field("assigned_service_advisor"):
			filters["assigned_service_advisor"] = advisor
		if bay and meta.has_field("assigned_bay"):
			filters["assigned_bay"] = bay
		if appointment_type and meta.has_field("appointment_type"):
			filters["appointment_type"] = appointment_type

		fields = [
			"name",
			"customer",
			"customer_name",
			"appointment_date_time",
			"status",
			"vehicle",
		]
		for candidate in (
			"branch",
			"assigned_service_advisor",
			"assigned_bay",
			"appointment_type",
			"slot_duration_minutes",
			"booking_source",
		):
			if meta.has_field(candidate):
				fields.append(candidate)

		rows = frappe.get_all(
			APPOINTMENT,
			filters=filters,
			fields=fields,
			limit=500,
		)
		for r in rows:
			label = r.get("customer_name") or None
			if not label and r.get("customer"):
				label = frappe.db.get_value("Customer", r.customer, "customer_name") or r.customer
			subtype = r.get("appointment_type") or "Service Appointment"
			title = f"{label} · {subtype}" if label else r.name
			events.append(
				{
					"id": r.name,
					"title": title,
					"start": str(r.appointment_date_time) if r.appointment_date_time else None,
					"type": "appointment",
					"subtype": subtype,
					"status": r.status,
					"ref_doctype": APPOINTMENT,
					"ref_name": r.name,
					"customer": r.customer,
					"branch": r.get("branch"),
					"advisor": r.get("assigned_service_advisor"),
					"bay": r.get("assigned_bay"),
					"duration_minutes": r.get("slot_duration_minutes"),
				}
			)

	# CRM sales appointments linked to deals
	if _want("sales_appointment") and frappe.db.exists("DocType", SALES_APPOINTMENT):
		meta = frappe.get_meta(SALES_APPOINTMENT)
		filters = {
			"appointment_datetime": ["between", [str(start), str(end) + " 23:59:59"]],
		}
		if branch and meta.has_field("branch"):
			filters["branch"] = branch
		if advisor and meta.has_field("assigned_to"):
			filters["assigned_to"] = advisor
		if appointment_type and meta.has_field("appointment_type"):
			filters["appointment_type"] = appointment_type
		rows = frappe.get_all(
			SALES_APPOINTMENT,
			filters=filters,
			fields=[
				"name",
				"customer",
				"appointment_datetime",
				"status",
				"appointment_type",
				"opportunity",
				"assigned_to",
				"branch",
				"duration_minutes",
			],
			limit=500,
		)
		for r in rows:
			customer_name = None
			if r.get("customer"):
				customer_name = (
					frappe.db.get_value("Customer", r.customer, "customer_name") or r.customer
				)
			events.append(
				{
					"id": r.name,
					"title": customer_name or r.opportunity or r.name,
					"start": str(r.appointment_datetime) if r.appointment_datetime else None,
					"type": "sales_appointment",
					"subtype": r.appointment_type or "Sales Appointment",
					"status": r.status,
					"ref_doctype": SALES_APPOINTMENT,
					"ref_name": r.name,
					"customer": r.customer,
					"opportunity": r.opportunity,
					"branch": r.get("branch"),
					"advisor": r.get("assigned_to"),
					"duration_minutes": r.get("duration_minutes"),
				}
			)

	# CRM test drives
	if _want("test_drive") and frappe.db.exists("DocType", TEST_DRIVE):
		meta = frappe.get_meta(TEST_DRIVE)
		filters = {
			"scheduled_datetime": ["between", [str(start), str(end) + " 23:59:59"]],
		}
		if branch and meta.has_field("branch"):
			filters["branch"] = branch
		if advisor and meta.has_field("assigned_to"):
			filters["assigned_to"] = advisor
		rows = frappe.get_all(
			TEST_DRIVE,
			filters=filters,
			fields=[
				"name",
				"customer",
				"scheduled_datetime",
				"status",
				"opportunity",
				"vehicle_vin",
				"outcome",
				"assigned_to",
				"branch",
			],
			limit=500,
		)
		for r in rows:
			customer_name = None
			if r.get("customer"):
				customer_name = (
					frappe.db.get_value("Customer", r.customer, "customer_name") or r.customer
				)
			title = customer_name or r.opportunity or r.name
			if r.vehicle_vin:
				title = f"{title} · {r.vehicle_vin}"
			events.append(
				{
					"id": r.name,
					"title": title,
					"start": str(r.scheduled_datetime) if r.scheduled_datetime else None,
					"type": "test_drive",
					"subtype": "Test Drive",
					"status": r.status,
					"ref_doctype": TEST_DRIVE,
					"ref_name": r.name,
					"customer": r.customer,
					"opportunity": r.opportunity,
					"branch": r.get("branch"),
					"advisor": r.get("assigned_to"),
				}
			)

	# Lead next actions due in range
	if _want("lead") and frappe.db.exists("DocType", LEAD):
		rows = frappe.get_all(
			LEAD,
			filters={
				"next_action_due": ["between", [str(start), str(end) + " 23:59:59"]],
				"status": ["not in", ["Converted", "Disqualified", "Duplicate", "Invalid"]],
			},
			fields=["name", "lead_name", "next_action", "next_action_due", "status"],
			limit=300,
		)
		for r in rows:
			events.append(
				{
					"id": f"lead-{r.name}",
					"title": r.next_action or f"Lead: {r.lead_name}",
					"start": str(r.next_action_due) if r.next_action_due else None,
					"type": "lead",
					"subtype": "Lead Follow-up",
					"status": r.status,
					"ref_doctype": LEAD,
					"ref_name": r.name,
					"customer": None,
				}
			)

	# Opportunity next actions
	if _want("opportunity") and frappe.db.exists("DocType", OPP):
		rows = frappe.get_all(
			OPP,
			filters={
				"next_action_due": ["between", [str(start), str(end) + " 23:59:59"]],
				"status": "Open",
			},
			fields=["name", "title", "next_action", "next_action_due", "stage"],
			limit=300,
		)
		for r in rows:
			events.append(
				{
					"id": f"opp-{r.name}",
					"title": r.next_action or f"Deal: {r.title}",
					"start": str(r.next_action_due) if r.next_action_due else None,
					"type": "opportunity",
					"subtype": "Deal Follow-up",
					"status": r.stage,
					"ref_doctype": OPP,
					"ref_name": r.name,
					"customer": None,
				}
			)

	events.sort(key=lambda e: e.get("start") or "")
	return {
		"events": events,
		"from_date": str(start),
		"to_date": str(end),
		"filters": {
			"branch": branch,
			"advisor": advisor,
			"bay": bay,
			"appointment_type": appointment_type,
			"event_types": event_types,
		},
	}
