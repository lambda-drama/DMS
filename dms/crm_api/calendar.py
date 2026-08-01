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
def get_calendar_events(from_date=None, to_date=None):
	"""Return mixed calendar events for the CRM calendar month/week view."""
	ensure_crm_read(ACTIVITY)

	if not from_date or not to_date:
		frappe.throw("from_date and to_date are required.")

	start = getdate(from_date)
	end = getdate(to_date)
	events = []

	# CRM activities
	if frappe.db.exists("DocType", ACTIVITY):
		rows = frappe.get_all(
			ACTIVITY,
			filters={
				"due_datetime": ["between", [str(start), str(end) + " 23:59:59"]],
			},
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
				}
			)

	# DMS service appointments (same records as DMS Appointments)
	if frappe.db.exists("DocType", APPOINTMENT):
		rows = frappe.get_all(
			APPOINTMENT,
			filters={
				"appointment_date_time": ["between", [str(start), str(end) + " 23:59:59"]],
			},
			fields=[
				"name",
				"customer",
				"customer_name",
				"appointment_date_time",
				"status",
				"vehicle",
			],
			limit=500,
		)
		for r in rows:
			label = r.get("customer_name") or None
			if not label and r.get("customer"):
				label = frappe.db.get_value("Customer", r.customer, "customer_name") or r.customer
			title = label or r.name
			events.append(
				{
					"id": r.name,
					"title": title,
					"start": str(r.appointment_date_time) if r.appointment_date_time else None,
					"type": "appointment",
					"subtype": "Service Appointment",
					"status": r.status,
					"ref_doctype": APPOINTMENT,
					"ref_name": r.name,
					"customer": r.customer,
				}
			)

	# CRM sales appointments linked to deals
	if frappe.db.exists("DocType", SALES_APPOINTMENT):
		rows = frappe.get_all(
			SALES_APPOINTMENT,
			filters={
				"appointment_datetime": ["between", [str(start), str(end) + " 23:59:59"]],
			},
			fields=[
				"name",
				"customer",
				"appointment_datetime",
				"status",
				"appointment_type",
				"opportunity",
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
				}
			)

	# CRM test drives
	if frappe.db.exists("DocType", TEST_DRIVE):
		rows = frappe.get_all(
			TEST_DRIVE,
			filters={
				"scheduled_datetime": ["between", [str(start), str(end) + " 23:59:59"]],
			},
			fields=[
				"name",
				"customer",
				"scheduled_datetime",
				"status",
				"opportunity",
				"vehicle_vin",
				"outcome",
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
				}
			)

	# Lead next actions due in range
	if frappe.db.exists("DocType", LEAD):
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
	if frappe.db.exists("DocType", OPP):
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
	return {"events": events, "from_date": str(start), "to_date": str(end)}
