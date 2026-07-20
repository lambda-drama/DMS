# Copyright (c) 2026, Mania and contributors
"""Report folder catalog (section → reports)."""

from frappe import _


def _report_catalog():
	"""Folder → section → reports (Suweys Aftersales Reports Spec §13 + Phase 1)."""
	return [
		{
			"id": "executive",
			"title": _("Executive"),
			"description": _("Performance KPIs"),
			"icon": "gauge",
			"reports": [
				{
					"id": "aftersales_dashboard",
					"title": _("Aftersales Performance"),
					"description": _("Vehicles, jobs, revenue mix, WIP risk and conversion KPIs."),
				},
				{
					"id": "aftersales_profitability",
					"title": _("Profitability"),
					"description": _("Sales, inventory cost and gross profit by job, customer, model and branch."),
				},
				{
					"id": "revenue_trend",
					"title": _("Revenue Trend"),
					"description": _("Daily and monthly revenue, YoY growth and branch / advisor mix."),
				},
				{
					"id": "budget_versus_actual",
					"title": _("Budget Versus Actual"),
					"description": _("Targets vs actuals with variance and achievement %."),
				},
				{
					"id": "service_revenue",
					"title": _("Service Revenue"),
					"description": _("Labor, parts and net by period."),
				},
			],
		},
		{
			"id": "workshop",
			"title": _("Workshop"),
			"description": _("Live operations"),
			"icon": "wrench",
			"reports": [
				{"id": "daily_wip", "title": _("Work in Progress"), "description": _("Open jobs by status and bay.")},
				{"id": "job_card_status", "title": _("Job Card Status"), "description": _("Status and ownership.")},
				{"id": "vehicle_turnaround", "title": _("Turnaround Time"), "description": _("Stage elapsed time.")},
				{"id": "aging", "title": _("Aging"), "description": _("Days open in workshop.")},
				{"id": "repeat_repair", "title": _("Comebacks"), "description": _("Repeat repairs by VIN.")},
			],
		},
		{
			"id": "advisor",
			"title": _("Service Advisor"),
			"description": _("Advisor KPIs"),
			"icon": "user-check",
			"reports": [
				{"id": "service_advisor_performance", "title": _("Advisor Performance"), "description": _("Jobs, sales and approval rate.")},
				{"id": "appointment_conversion", "title": _("Appointments"), "description": _("Booked, arrived and no-show.")},
			],
		},
		{
			"id": "technician",
			"title": _("Technician"),
			"description": _("Productivity"),
			"icon": "hard-hat",
			"reports": [
				{"id": "technician_productivity", "title": _("Productivity"), "description": _("Hours and efficiency.")},
			],
		},
		{
			"id": "parts",
			"title": _("Parts & Inventory"),
			"description": _("Stock and issues"),
			"icon": "package",
			"reports": [
				{"id": "spare_parts_stock", "title": _("Stock Availability"), "description": _("On-hand by warehouse."), "filter_type": "stock"},
				{"id": "parts_issued_per_job", "title": _("Parts Issued"), "description": _("Requested vs issued.")},
				{"id": "material_request_status", "title": _("Material Requests"), "description": _("Request status.")},
				{"id": "parts_fill_rate", "title": _("Fill Rate"), "description": _("Requested vs issued vs backorder.")},
			],
		},
		{
			"id": "warranty",
			"title": _("Warranty"),
			"description": _("Claims"),
			"icon": "shield",
			"reports": [
				{"id": "warranty", "title": _("Claim Status"), "description": _("Warranty jobs and value.")},
			],
		},
		{
			"id": "qc",
			"title": _("Quality Control"),
			"description": _("Pass / fail"),
			"icon": "clipboard-check",
			"reports": [
				{"id": "qc_failure", "title": _("QC Pass / Fail"), "description": _("Fail rate and reasons.")},
			],
		},
		{
			"id": "crm",
			"title": _("Customer & CRM"),
			"description": _("Follow-up"),
			"icon": "users",
			"reports": [
				{"id": "customer_follow_up", "title": _("Follow-Up"), "description": _("Due and completed.")},
				{"id": "customer_satisfaction", "title": _("Satisfaction"), "description": _("Ratings and complaints.")},
				{"id": "customer_retention", "title": _("Retention"), "description": _("Returning customers.")},
			],
		},
		{
			"id": "finance",
			"title": _("Finance"),
			"description": _("Billing"),
			"icon": "banknote",
			"reports": [
				{"id": "invoice_register", "title": _("Invoice Register"), "description": _("Tax, discount and outstanding.")},
				{"id": "unbilled_job_cards", "title": _("Unbilled Jobs"), "description": _("Completed without invoice.")},
				{"id": "service_revenue", "title": _("Service Revenue"), "description": _("Labour and parts revenue.")},
			],
		},
		{
			"id": "compliance",
			"title": _("Compliance"),
			"description": _("Audit"),
			"icon": "scroll-text",
			"reports": [
				{"id": "user_audit_trail", "title": _("Audit Trail"), "description": _("User activity on documents.")},
				{"id": "odometer_exception", "title": _("Odometer"), "description": _("Mileage exceptions.")},
			],
		},
	]

