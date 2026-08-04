"""Seed DMS CRM Settings reminder sequence defaults (§10)."""

import frappe
from frappe.utils import cint


def execute():
	if not frappe.db.exists("DocType", "DMS CRM Settings"):
		return
	if not frappe.db.exists("DocType", "DMS CRM Reminder Sequence Step"):
		return
	doc = frappe.get_single("DMS CRM Settings")
	if not doc.meta.has_field("enable_service_retention"):
		return
	changed = False
	# Existing Single docs ignore JSON defaults for new Check fields (stay 0).
	if not cint(doc.enable_service_retention):
		doc.enable_service_retention = 1
		changed = True
	if doc.meta.has_field("default_average_daily_km") and not doc.default_average_daily_km:
		doc.default_average_daily_km = 40
		changed = True
	if doc.meta.has_field("upcoming_days") and not cint(doc.upcoming_days):
		doc.upcoming_days = 30
		changed = True
	if doc.meta.has_field("severely_overdue_days") and not cint(doc.severely_overdue_days):
		doc.severely_overdue_days = 30
		changed = True
	if doc.meta.has_field("lapsed_days") and not cint(doc.lapsed_days):
		doc.lapsed_days = 90
		changed = True
	if doc.meta.has_field("enable_workshop_journey_events") and not cint(
		doc.enable_workshop_journey_events
	):
		doc.enable_workshop_journey_events = 1
		changed = True
	if not doc.get("service_reminder_sequence"):
		doc._seed_reminder_sequence()
		changed = True
	if changed:
		doc.save(ignore_permissions=True)
