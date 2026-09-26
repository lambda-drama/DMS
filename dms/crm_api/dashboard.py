# Copyright (c) 2026, Mania and contributors
"""CRM dashboard aggregates — Phase 1 sales CRM."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, cint, flt, getdate, today

from dms.crm_api.common import ensure_crm_read, user_display_name

LEAD = "DMS CRM Lead"
OPP = "DMS CRM Opportunity"
ACT = "DMS CRM Activity"
CASE = "DMS CRM Case"


def _count(doctype, filters=None):
	if not frappe.db.exists("DocType", doctype):
		return 0
	return frappe.db.count(doctype, filters=filters or {})


@frappe.whitelist()
def get_dashboard():
	"""Overview KPIs for the CRM workspace home."""
	ensure_crm_read(LEAD)

	open_lead_statuses = [
		"New",
		"Assigned",
		"Contact Attempted",
		"Contacted",
		"Qualified",
		"Nurture",
	]
	open_opp_filter = {"status": "Open"}
	today_str = today()

	stats = {
		"leads_total": _count(LEAD),
		"leads_open": _count(LEAD, {"status": ["in", open_lead_statuses]}),
		"leads_hot": _count(LEAD, {"priority": "Hot", "status": ["in", open_lead_statuses]}),
		"leads_new_7d": _count(
			LEAD,
			{"creation": [">=", add_days(today_str, -7)]},
		),
		"opportunities_open": _count(OPP, open_opp_filter),
		"opportunities_won": _count(OPP, {"status": "Won"}),
		"pipeline_value": 0.0,
		"activities_open": _count(ACT, {"status": "Open"}),
		"activities_overdue": 0,
		"approvals_pending": 0,
		"cases_open": _count(
			CASE,
			{"status": ["not in", ["Resolved", "Closed"]]},
		),
		"contacts": frappe.db.count("Contact") if frappe.db.exists("DocType", "Contact") else 0,
		"customers": 0,
	}

	if frappe.db.exists("DocType", "Customer"):
		groups = []
		if frappe.db.exists("DocType", "Customer Group") and frappe.get_meta("Customer Group").has_field(
			"custom_is_vehicle_customer"
		):
			groups = frappe.get_all(
				"Customer Group",
				filters={"custom_is_vehicle_customer": 1},
				pluck="name",
			)
		if groups:
			stats["customers"] = frappe.db.count(
				"Customer", {"disabled": 0, "customer_group": ["in", groups]}
			)

	if frappe.db.exists("DocType", OPP):
		rows = frappe.get_all(
			OPP,
			filters=open_opp_filter,
			fields=["expected_value", "probability"],
			limit=5000,
		)
		stats["pipeline_value"] = sum(flt(r.expected_value) * flt(r.probability) / 100.0 for r in rows)

	try:
		from dms.crm_api.reports.kpis import compute_appendix_b_kpis

		stats["appendix_b"] = compute_appendix_b_kpis(None).get("summary") or {}
	except Exception:
		stats["appendix_b"] = {}

	if frappe.db.exists("DocType", ACT):
		from frappe.utils import now_datetime

		stats["activities_open"] = _count(ACT, {"status": ["in", ["Open", "In Progress"]]})
		stats["activities_overdue"] = frappe.db.count(
			ACT,
			{
				"status": ["in", ["Open", "In Progress"]],
				"due_datetime": ["<", now_datetime()],
			},
		)
		stats["approvals_pending"] = (
			frappe.db.count("DMS CRM Approval Request", {"status": "Pending"})
			if frappe.db.exists("DocType", "DMS CRM Approval Request")
			else 0
		)

	# Lead target gauge — from DMS CRM Settings (0 = no configured target)
	month_start = getdate(today_str).replace(day=1)
	leads_this_month = _count(LEAD, {"creation": [">=", month_start]})
	lead_target = 0
	if frappe.db.exists("DocType", "DMS CRM Settings"):
		lead_target = cint(frappe.db.get_single_value("DMS CRM Settings", "monthly_lead_target") or 0)
	lead_target_configured = lead_target > 0
	if not lead_target_configured:
		# Avoid a fake "100" target in production — gauge tracks actual intake.
		lead_target = max(leads_this_month, 1)
	stats["lead_target"] = lead_target
	stats["lead_target_configured"] = 1 if lead_target_configured else 0
	stats["leads_this_month"] = leads_this_month
	stats["lead_target_remaining"] = max(lead_target - leads_this_month, 0) if lead_target_configured else 0

	my_leads = []
	if frappe.db.exists("DocType", LEAD):
		my_leads = frappe.get_all(
			LEAD,
			filters={"lead_owner": frappe.session.user, "status": ["in", open_lead_statuses]},
			fields=[
				"name",
				"lead_name",
				"status",
				"source",
				"organization_name",
				"lead_owner",
				"next_action_due",
				"modified",
			],
			order_by="modified desc",
			limit=10,
		)
		for row in my_leads:
			row["owner_name"] = user_display_name(row.get("lead_owner"))

	stage_pipeline = []
	if frappe.db.exists("DocType", OPP):
		for stage in (
			"New",
			"Contact Attempted",
			"Contacted",
			"Qualified",
			"Appointment Scheduled",
			"Test Drive",
			"Quotation Submitted",
			"Negotiation",
			"Booking / Deposit",
			"Order Confirmed",
			"Nurture",
		):
			stage_pipeline.append(
				{
					"stage": stage,
					"count": _count(OPP, {"status": "Open", "stage": stage}),
				}
			)

	return {
		"stats": stats,
		"my_leads": my_leads,
		"stage_pipeline": stage_pipeline,
		"user": {
			"name": frappe.session.user,
			"full_name": user_display_name(frappe.session.user),
		},
	}
