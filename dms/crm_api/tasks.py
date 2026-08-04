# Copyright (c) 2026, Mania and contributors
"""CRM scheduled tasks."""

from __future__ import annotations


def reassign_unaccepted_leads():
	from dms.crm_api.assignment import reassign_unaccepted_leads as _run

	return _run()


def expire_quotations():
	"""Flag open CRM quotation records after their validity date."""
	import frappe
	from frappe.utils import today

	names = frappe.get_all(
		"DMS CRM Opportunity",
		filters={
			"quotation": ["is", "set"],
			"quotation_validity": ["<", today()],
			"quotation_customer_status": ["in", ["Draft", "Sent", "Viewed"]],
		},
		pluck="name",
	)
	for name in names:
		frappe.db.set_value(
			"DMS CRM Opportunity",
			name,
			"quotation_customer_status",
			"Expired",
			update_modified=False,
		)
	return len(names)


def ownership_journey_reminders():
	from dms.crm_api.ownership_journey import create_anniversary_and_service_reminders

	return create_anniversary_and_service_reminders()


def service_retention_daily():
	"""§10 — sync service due from VINs + run reminder sequence."""
	from dms.crm_api.service_retention import run_reminder_sequence, sync_service_due

	synced = sync_service_due(limit=500)
	reminders = run_reminder_sequence(limit=500)
	return {"sync": synced, "reminders": reminders}


def case_sla_daily():
	"""§12 — refresh case SLA breach flags and escalate."""
	from dms.crm_api.cases import check_case_slas

	return check_case_slas(limit=500)


def activity_engine_daily():
	"""§15 — recurring activity spawn + activity SLA breach flags."""
	from dms.crm_api.activities import mark_activity_sla_breaches, spawn_recurring_activities

	return {
		"recurring": spawn_recurring_activities(limit=200),
		"sla": mark_activity_sla_breaches(limit=500),
	}
