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
