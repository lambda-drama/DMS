# Copyright (c) 2026, Mania and contributors
"""CRM Reports catalog — blueprint §17."""

from frappe import _


def report_catalog():
	"""Sections mirror DMS Reports hub: Overview dashboard → report tabs."""
	return [
		{
			"id": "crm_executive",
			"title": _("Executive CRM"),
			"description": _("§17.1 pipeline, forecast, retention, campaigns and value"),
			"icon": "gauge",
			"reports": [
				{
					"id": "crm_appendix_b_kpis",
					"title": _("Appendix B KPIs"),
					"description": _("Recommended KPI formulas: response, conversion, retention, SLA and ROI."),
				},
				{
					"id": "crm_exec_pipeline",
					"title": _("Pipeline & Lead SLA"),
					"description": _("New leads, response SLA, qualified leads and open pipeline."),
				},
				{
					"id": "crm_exec_forecast",
					"title": _("Sales Forecast"),
					"description": _("Forecast by branch, model, team and month."),
				},
				{
					"id": "crm_exec_conversion",
					"title": _("Lead-to-Sale Conversion"),
					"description": _("Conversion rate and average sales cycle."),
				},
				{
					"id": "crm_exec_delivery",
					"title": _("Deliveries & Satisfaction"),
					"description": _("Vehicle deliveries and post-delivery satisfaction."),
				},
				{
					"id": "crm_exec_service_retention",
					"title": _("Service Retention Overview"),
					"description": _("Upcoming, overdue and lapsed vehicles."),
				},
				{
					"id": "crm_exec_appointments",
					"title": _("Appointments Overview"),
					"description": _("Appointments, no-shows and workshop conversion."),
				},
				{
					"id": "crm_exec_complaints",
					"title": _("Complaints Overview"),
					"description": _("Open complaints, SLA compliance and first-contact resolution."),
				},
				{
					"id": "crm_exec_campaigns",
					"title": _("Campaign ROI Overview"),
					"description": _("Campaign leads, revenue, cost and ROI."),
				},
				{
					"id": "crm_exec_customer_value",
					"title": _("Customer Lifetime Value"),
					"description": _("LTV and repurchase opportunities."),
				},
			],
		},
		{
			"id": "crm_sales",
			"title": _("Sales CRM"),
			"description": _("§17.2 lead, opportunity, booking and delivery reports"),
			"icon": "handshake",
			"reports": [
				{"id": "crm_lead_source", "title": _("Lead Source Performance"), "description": _("Leads and conversion by source.")},
				{"id": "crm_lead_response", "title": _("Lead Response Time"), "description": _("First meaningful response − lead creation.")},
				{"id": "crm_lead_contact_rate", "title": _("Lead Contact Rate"), "description": _("Contacted leads / assigned leads.")},
				{"id": "crm_qualification_rate", "title": _("Qualification Rate"), "description": _("Qualified leads / contacted leads.")},
				{"id": "crm_lead_aging", "title": _("Lead Aging & Stale"), "description": _("Open leads by age bucket.")},
				{"id": "crm_sales_funnel", "title": _("Sales Funnel Conversion"), "description": _("Stage-to-stage conversion.")},
				{"id": "crm_opportunity_pipeline", "title": _("Opportunity Pipeline & Forecast"), "description": _("Open pipeline with weighted forecast.")},
				{"id": "crm_salesperson_performance", "title": _("Salesperson Performance"), "description": _("Leads, opportunities, wins and cycle by owner.")},
				{"id": "crm_test_drive_conversion", "title": _("Test-Drive Conversion"), "description": _("Won sales from completed test drives / completed test drives.")},
				{"id": "crm_quotation_conversion", "title": _("Quotation Conversion"), "description": _("Won opportunities / quotations issued.")},
				{"id": "crm_lost_opportunity", "title": _("Lost Opportunity Analysis"), "description": _("Lost deals by reason and stage.")},
				{"id": "crm_discount_approval", "title": _("Discount & Approval"), "description": _("Approval requests for discounts and exceptions.")},
				{"id": "crm_booking_cancellation", "title": _("Booking & Cancellation"), "description": _("Bookings created vs cancelled.")},
				{"id": "crm_allocation_waiting", "title": _("Allocation Waiting List"), "description": _("Vehicles / customers waiting for allocation.")},
				{"id": "crm_delivery_schedule", "title": _("Delivery Schedule & Readiness"), "description": _("Delivery readiness status and schedule.")},
				{"id": "crm_referral_conversion", "title": _("Referral Conversion"), "description": _("Referrals to lead / won / rewarded.")},
				{"id": "crm_fleet_pipeline", "title": _("Fleet Pipeline & Tender"), "description": _("Fleet accounts, tenders and status.")},
			],
		},
		{
			"id": "crm_aftersales",
			"title": _("Aftersales CRM"),
			"description": _("§17.3 retention, appointments, complaints and fleet"),
			"icon": "wrench",
			"reports": [
				{"id": "crm_service_due", "title": _("Service Due & Overdue"), "description": _("Due, overdue and lapsed service.")},
				{"id": "crm_reminder_conversion", "title": _("Reminder → Booking"), "description": _("Appointments booked / customers successfully contacted.")},
				{"id": "crm_appointment_capacity", "title": _("Appointment Capacity"), "description": _("Capacity, cancellation and no-show.")},
				{"id": "crm_workshop_followup", "title": _("Workshop Follow-Up"), "description": _("Post-workshop customer follow-up.")},
				{"id": "crm_service_retention_cohort", "title": _("Service Retention Cohort"), "description": _("Retention by cohort / model / branch.")},
				{"id": "crm_lapsed_recovery", "title": _("Lapsed Customer Recovery"), "description": _("Lapsed customers and recovery actions.")},
				{"id": "crm_deferred_work", "title": _("Deferred-Work Conversion"), "description": _("Deferred work quoted vs converted.")},
				{"id": "crm_csat_nps", "title": _("CSAT / NPS / CSI"), "description": _("Customer satisfaction scores.")},
				{"id": "crm_complaint_aging", "title": _("Complaint Aging & SLA"), "description": _("Resolved within SLA / resolved cases; open-case aging.")},
				{"id": "crm_repeat_complaint", "title": _("Repeat Complaint / Comeback"), "description": _("Repeat complaints and comeback trend.")},
				{"id": "crm_next_service_at_delivery", "title": _("Next-Service at Delivery"), "description": _("Next service booked at delivery.")},
				{"id": "crm_fleet_maintenance", "title": _("Fleet Maintenance Compliance"), "description": _("Fleet units due / overdue.")},
			],
		},
		{
			"id": "crm_call_campaign",
			"title": _("Call Center & Campaigns"),
			"description": _("§17.4 calls, agents, campaigns and attribution"),
			"icon": "phone",
			"reports": [
				{"id": "crm_calls_attempted", "title": _("Calls Attempted / Connected"), "description": _("Attempted, connected and completed calls.")},
				{"id": "crm_contact_appointment_rate", "title": _("Contact & Appointment Rate"), "description": _("Contact rate and appointment rate.")},
				{"id": "crm_agent_productivity", "title": _("Agent Productivity"), "description": _("Calls and average handling time by agent.")},
				{"id": "crm_disposition_analysis", "title": _("Disposition Analysis"), "description": _("Outcomes by disposition.")},
				{"id": "crm_callback_compliance", "title": _("Callback Compliance"), "description": _("Callbacks due vs completed on time.")},
				{"id": "crm_call_quality", "title": _("Call Quality Scores"), "description": _("Quality / coaching scores.")},
				{"id": "crm_campaign_funnel", "title": _("Campaign Audience Funnel"), "description": _("Audience, delivery, response and conversion.")},
				{"id": "crm_channel_effectiveness", "title": _("Channel Effectiveness"), "description": _("Performance by channel.")},
				{"id": "crm_cost_per_outcome", "title": _("Cost per Lead / Appt / Sale"), "description": _("Campaign unit economics.")},
				{"id": "crm_revenue_attribution", "title": _("Revenue Attribution & ROI"), "description": _("Attributed revenue and ROI.")},
			],
		},
	]
