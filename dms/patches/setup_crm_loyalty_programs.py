# Copyright (c) 2026, Mania and contributors
"""Seed ERPNext Loyalty Programs + Pricing Rules and wire DMS CRM Loyalty Settings."""


def execute():
	import frappe

	if not frappe.db.exists("DocType", "Loyalty Program"):
		return
	if not frappe.db.exists("DocType", "DMS CRM Loyalty Settings"):
		return

	from dms.crm_api.loyalty import setup_loyalty_engine

	try:
		setup_loyalty_engine(create_pricing_rules=True)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "setup_crm_loyalty_programs")
