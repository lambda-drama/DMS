"""Post-delivery ownership journey — blueprint §8.3."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, add_to_date, now_datetime, today


JOURNEY_STEPS = (
	{
		"key": "welcome_call",
		"activity_type": "Call",
		"subject": "24-48h welcome call & owner onboarding",
		"days": 2,
		"priority": "High",
	},
	{
		"key": "experience_check",
		"activity_type": "Survey",
		"subject": "7-day delivery experience check",
		"days": 7,
		"priority": "Medium",
	},
	{
		"key": "first_service",
		"activity_type": "Service Reminder",
		"subject": "First-service booking reminder",
		"days": 30,
		"priority": "Medium",
	},
	{
		"key": "referral",
		"activity_type": "Call",
		"subject": "Referral request after positive experience",
		"days": 45,
		"priority": "Low",
	},
	{
		"key": "anniversary",
		"activity_type": "Call",
		"subject": "Ownership anniversary / upgrade-trade-in check",
		"days": 365,
		"priority": "Medium",
	},
)


def spawn_post_delivery_journey(opportunity_name):
	"""Create follow-up CRM activities after a vehicle sale is Won."""
	opp = frappe.get_doc("DMS CRM Opportunity", opportunity_name)
	if not opp.customer:
		return []

	created = []
	welcome_name = None
	for step in JOURNEY_STEPS:
		if frappe.db.exists(
			"DMS CRM Activity",
			{"opportunity": opp.name, "subject": step["subject"]},
		):
			continue
		due = add_to_date(now_datetime(), days=step["days"])
		if step["key"] == "first_service" and opp.get("allocated_vin"):
			service_due = frappe.db.get_value(
				"VIN No", opp.allocated_vin, "next_service_due_date"
			)
			if service_due:
				due = f"{service_due} 09:00:00"
		activity = frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": step["activity_type"],
				"subject": step["subject"],
				"status": "Open",
				"due_datetime": due,
				"assigned_to": opp.opportunity_owner or frappe.session.user,
				"priority": step["priority"],
				"opportunity": opp.name,
				"customer": opp.customer,
				"reference_doctype": "DMS CRM Opportunity",
				"reference_name": opp.name,
				"outcome_notes": f"Auto-created ownership journey step: {step['key']}",
			}
		).insert(ignore_permissions=True)
		created.append(activity.name)
		if step["key"] == "welcome_call":
			welcome_name = activity.name

	if opp.delivery_readiness:
		values = {"status": "Delivered", "handover_on": now_datetime()}
		if welcome_name:
			values["welcome_activity"] = welcome_name
		frappe.db.set_value(
			"DMS CRM Delivery Readiness",
			opp.delivery_readiness,
			values,
			update_modified=False,
		)
	return created


def create_anniversary_and_service_reminders():
	"""Daily catch-up for first-service due reminders on delivered VINs."""
	created = 0
	vins = frappe.get_all(
		"VIN No",
		filters={
			"vehicle_status": "Delivered to Customer",
			"current_customer": ["is", "set"],
			"next_service_due_date": ["between", [today(), add_days(today(), 7)]],
		},
		fields=["name", "current_customer", "next_service_due_date"],
		limit=200,
	)
	for vin in vins:
		opp = frappe.db.get_value(
			"DMS CRM Opportunity",
			{"allocated_vin": vin.name, "status": "Won"},
			["name", "opportunity_owner"],
			as_dict=True,
		)
		subject = f"First-service due for {vin.name}"
		if frappe.db.exists(
			"DMS CRM Activity",
			{"customer": vin.current_customer, "subject": subject, "status": "Open"},
		):
			continue
		frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": "Service Reminder",
				"subject": subject,
				"status": "Open",
				"due_datetime": f"{vin.next_service_due_date} 09:00:00",
				"assigned_to": (opp.opportunity_owner if opp else None) or "Administrator",
				"priority": "Medium",
				"opportunity": opp.name if opp else None,
				"customer": vin.current_customer,
				"reference_doctype": "VIN No",
				"reference_name": vin.name,
			}
		).insert(ignore_permissions=True)
		created += 1
	return created
