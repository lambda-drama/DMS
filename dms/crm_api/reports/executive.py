# Copyright (c) 2026, Mania and contributors
"""§17.1 Executive CRM Dashboard + overview reports."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, date_diff, flt, getdate, nowdate, time_diff_in_hours

from dms.crm_api.reports.kpis import compute_appendix_b_kpis
from dms.crm_api.reports.common import (
	ACTIVITY,
	CAMPAIGN,
	CASE,
	DELIVERY,
	LEAD,
	OPP,
	SERVICE_DUE,
	col,
	creation_between,
	dim_filters,
	dt_exists,
	group_count,
	parse_crm_filters,
	result,
)


def get_crm_executive_dashboard(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	summary = {
		"lead_response_hours": 0,
		"lead_contact_rate_pct": 0,
		"qualification_rate_pct": 0,
		"lead_to_sale_pct": 0,
		"test_drive_conversion_pct": 0,
		"quotation_conversion_pct": 0,
		"avg_sales_cycle_days": 0,
		"weighted_pipeline": 0,
		"appointment_show_rate_pct": 0,
		"service_retention_pct": 0,
		"reminder_booking_rate_pct": 0,
		"lapsed_recovery_rate_pct": 0,
		"complaint_sla_compliance_pct": 0,
		"first_contact_resolution_pct": 0,
		"campaign_roi_pct": 0,
		"customer_lifetime_value": 0,
		"new_leads": 0,
		"qualified_leads": 0,
		"open_pipeline_value": 0,
		"deliveries": 0,
		"open_complaints": 0,
		"by_status": [],
		"by_month": [],
		"by_branch": [],
	}
	summary.update(pack.get("summary") or {})

	if dt_exists(LEAD):
		lead_filters = {"creation": creation_between(f), **dim_filters(f)}
		meta = frappe.get_meta(LEAD)
		fields = ["name", "status", "branch", "creation"]
		for optional in ("sla_status", "qualified_on", "source", "lead_owner", "model"):
			if meta.has_field(optional):
				fields.append(optional)
		leads = frappe.get_all(
			LEAD,
			filters=lead_filters,
			fields=fields,
			limit=5000,
		)
		summary["new_leads"] = len(leads)
		summary["qualified_leads"] = sum(
			1
			for r in leads
			if r.get("qualified_on") or (r.get("status") or "") in ("Qualified", "Converted")
		)
		sla_rows = [r for r in leads if r.get("sla_status")]
		if sla_rows:
			met = sum(1 for r in sla_rows if r.sla_status in ("Met", "Within SLA", "On Track"))
			summary["response_sla_met_pct"] = round(100.0 * met / len(sla_rows), 1)
		summary["by_status"] = group_count(leads, "status")
		summary["by_branch"] = group_count(leads, "branch")

	if dt_exists(OPP):
		opp_filters = {
			"status": ["not in", ["Lost", "Cancelled"]],
			**dim_filters(f, owner_field="opportunity_owner", include_source=False),
		}
		opp_meta = frappe.get_meta(OPP)
		opp_fields = ["name", "status", "stage", "branch", "creation"]
		for optional in ("expected_value", "probability", "opportunity_owner", "model"):
			if opp_meta.has_field(optional):
				opp_fields.append(optional)
		opps = frappe.get_all(
			OPP,
			filters=opp_filters,
			fields=opp_fields,
			limit=5000,
		)
		open_opps = [o for o in opps if (o.get("status") or "") not in ("Won",)]
		summary["open_pipeline_value"] = round(sum(flt(o.get("expected_value")) for o in open_opps), 2)

	if dt_exists(DELIVERY):
		d_meta = frappe.get_meta(DELIVERY)
		d_fields = ["name", "status"]
		if d_meta.has_field("satisfaction_score"):
			d_fields.append("satisfaction_score")
		dels = frappe.get_all(
			DELIVERY,
			filters={"creation": creation_between(f)},
			fields=d_fields,
			limit=2000,
		)
		summary["deliveries"] = len(dels)
		scores = [flt(d.satisfaction_score) for d in dels if d.get("satisfaction_score")]
		summary["avg_satisfaction"] = round(sum(scores) / len(scores), 2) if scores else 0

	if dt_exists(SERVICE_DUE):
		for classification, key in (
			("Upcoming", "service_upcoming"),
			("Overdue", "service_overdue"),
			("Lapsed", "service_lapsed"),
		):
			try:
				summary[key] = frappe.db.count(SERVICE_DUE, {"classification": classification})
			except Exception:
				summary[key] = 0

	if dt_exists(ACTIVITY):
		appts = frappe.get_all(
			ACTIVITY,
			filters={
				"activity_type": ["in", ["Appointment", "Meeting", "Call"]],
				"creation": creation_between(f),
			},
			fields=["name", "status", "disposition"]
			if frappe.get_meta(ACTIVITY).has_field("disposition")
			else ["name", "status"],
			limit=3000,
		)
		summary["appointments"] = len(appts)
		summary["no_shows"] = sum(
			1
			for a in appts
			if (a.get("disposition") or "").lower() in ("no show", "no-show", "noshow")
			or (a.get("status") or "") == "No Show"
		)

	if dt_exists(CASE):
		summary["open_complaints"] = frappe.db.count(
			CASE, {"status": ["not in", ["Resolved", "Closed"]]}
		)
		if frappe.get_meta(CASE).has_field("sla_status"):
			summary["sla_breaches"] = frappe.db.count(
				CASE, {"sla_status": ["in", ["Breached", "Breach"]]}
			)

	if dt_exists(CAMPAIGN):
		c_meta = frappe.get_meta(CAMPAIGN)
		c_fields = ["name"]
		for optional in ("leads_generated", "response_count", "campaign_revenue", "budget", "roi_pct"):
			if c_meta.has_field(optional):
				c_fields.append(optional)
		camps = frappe.get_all(
			CAMPAIGN,
			filters={"creation": creation_between(f)},
			fields=c_fields,
			limit=500,
		)
		summary["campaign_leads"] = sum(cint(c.get("leads_generated") or c.get("response_count")) for c in camps)

	# Appendix B formulas always win over convenience counts
	summary.update(pack.get("summary") or {})
	summary["weighted_forecast"] = summary.get("weighted_pipeline") or 0

	return {
		"section_id": "crm_executive",
		"title": _("Executive CRM"),
		"filters": {
			"from_date": str(f["from_date"]),
			"to_date": str(f["to_date"]),
		},
		"summary": summary,
	}


def _pipeline_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"New leads in period; SLA met % where sla_status is Met/On Track; "
		"qualified = status Qualified/Converted or qualified_on set; open pipeline from Opportunities."
	)
	rows = []
	if dt_exists(LEAD):
		meta = frappe.get_meta(LEAD)
		fields = [
			"name",
			"lead_name",
			"status",
			"source",
			"branch",
			"lead_owner",
			"creation",
			"model",
		]
		if meta.has_field("sla_status"):
			fields.append("sla_status")
		leads = frappe.get_all(
			LEAD,
			filters={"creation": creation_between(f), **dim_filters(f)},
			fields=fields,
			order_by="creation desc",
			limit=2000,
		)
		for r in leads:
			rows.append(
				{
					"name": r.name,
					"lead_name": r.lead_name,
					"status": r.status,
					"source": r.source,
					"branch": r.branch,
					"owner": r.lead_owner,
					"sla_status": r.sla_status,
					"model": r.model,
					"created": str(r.creation)[:16] if r.creation else "",
					"_drill": {"view": "crm-lead-detail", "params": {"name": r.name}},
				}
			)
	summary = {
		"total": len(rows),
		"by_status": group_count(rows, "status"),
		"by_sla": group_count(rows, "sla_status"),
	}
	return result(
		"crm_exec_pipeline",
		_("Pipeline & Lead SLA"),
		f,
		summary,
		[
			col("name", "Lead"),
			col("lead_name", "Name"),
			col("status", "Status"),
			col("sla_status", "SLA"),
			col("source", "Source"),
			col("branch", "Branch"),
			col("owner", "Owner"),
			col("model", "Model"),
			col("created", "Created"),
		],
		rows,
		help_text=help_text,
		definitions={
			"response_sla_met_pct": "Share of leads with sla_status in Met / Within SLA / On Track",
			"qualified_leads": "Leads with Qualified/Converted status or qualified_on timestamp",
		},
	)


def _forecast_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Weighted forecast = expected_value × probability%. Grouped by branch, model and month."
	)
	rows = []
	if dt_exists(OPP):
		opps = frappe.get_all(
			OPP,
			filters={
				"status": ["not in", ["Lost", "Cancelled", "Won"]],
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=[
				"name",
				"title",
				"branch",
				"model",
				"expected_value",
				"probability",
				"opportunity_owner",
				"expected_close_date",
				"stage",
			],
			limit=3000,
		)
		for o in opps:
			weighted = flt(o.expected_value) * flt(o.probability or 0) / 100.0
			month = str(o.expected_close_date)[:7] if o.expected_close_date else "Unscheduled"
			rows.append(
				{
					"name": o.name,
					"title": o.title or o.name,
					"branch": o.branch,
					"model": o.model,
					"month": month,
					"owner": o.opportunity_owner,
					"stage": o.stage,
					"expected_value": flt(o.expected_value),
					"probability": flt(o.probability),
					"weighted": round(weighted, 2),
					"_drill": {"view": "crm-opportunity-detail", "params": {"name": o.name}},
				}
			)
	return result(
		"crm_exec_forecast",
		_("Sales Forecast"),
		f,
		{
			"total": len(rows),
			"weighted_forecast": round(sum(r["weighted"] for r in rows), 2),
			"pipeline_value": round(sum(r["expected_value"] for r in rows), 2),
			"by_branch": group_count(rows, "branch"),
			"by_month": group_count(rows, "month"),
		},
		[
			col("name", "Opportunity"),
			col("title", "Title"),
			col("branch", "Branch"),
			col("model", "Model"),
			col("month", "Month"),
			col("owner", "Owner"),
			col("stage", "Stage"),
			col("expected_value", "Value"),
			col("probability", "Prob %"),
			col("weighted", "Weighted"),
		],
		rows,
		help_text=help_text,
	)


def _conversion_report(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	sale = next((k for k in pack["kpis"] if k["id"] == "lead_to_sale_pct"), {})
	cycle = next((k for k in pack["kpis"] if k["id"] == "avg_sales_cycle_days"), {})
	help_text = _(
		"Appendix B: Lead-to-sale = Won opportunities / valid leads × 100 "
		"(valid excludes Duplicate and Invalid). "
		"Average sales cycle = days from lead creation to won date."
	)
	won = []
	if dt_exists(OPP):
		fields = ["name", "title", "creation", "modified", "opportunity_owner", "branch", "expected_value"]
		if frappe.get_meta(OPP).has_field("lead"):
			fields.append("lead")
		won = frappe.get_all(
			OPP,
			filters={
				"status": "Won",
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=fields,
			limit=2000,
		)
	lead_created = {}
	lead_ids = [w.lead for w in won if w.get("lead")]
	if lead_ids and dt_exists(LEAD):
		for row in frappe.get_all(LEAD, filters={"name": ["in", lead_ids]}, fields=["name", "creation"]):
			lead_created[row.name] = row.creation
	rows = []
	for w in won:
		start = lead_created.get(w.get("lead")) or w.creation
		cycle_days = date_diff(getdate(w.modified), getdate(start)) if start else None
		rows.append(
			{
				"name": w.name,
				"title": w.title or w.name,
				"owner": w.opportunity_owner,
				"branch": w.branch,
				"value": flt(w.expected_value),
				"cycle_days": cycle_days,
				"_drill": {"view": "crm-opportunity-detail", "params": {"name": w.name}},
			}
		)
	return result(
		"crm_exec_conversion",
		_("Lead-to-Sale Conversion"),
		f,
		{
			"valid_leads": sale.get("denominator") or 0,
			"won": sale.get("numerator") or len(rows),
			"lead_to_sale_pct": sale.get("value") or 0,
			"avg_sales_cycle_days": cycle.get("value") or 0,
		},
		[
			col("name", "Opportunity"),
			col("title", "Title"),
			col("owner", "Owner"),
			col("branch", "Branch"),
			col("value", "Value"),
			col("cycle_days", "Cycle (days)"),
		],
		rows,
		help_text=help_text,
		definitions={
			"lead_to_sale_pct": "Won opportunities / valid leads × 100",
			"avg_sales_cycle_days": "Average days from lead creation to won date",
		},
	)


def _delivery_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _("Deliveries from DMS CRM Delivery Readiness; satisfaction from satisfaction_score.")
	rows = []
	if dt_exists(DELIVERY):
		for d in frappe.get_all(
			DELIVERY,
			filters={"creation": creation_between(f)},
			fields=["name", "opportunity", "customer", "status", "satisfaction_score", "modified"],
			order_by="modified desc",
			limit=2000,
		):
			rows.append(
				{
					"name": d.name,
					"opportunity": d.opportunity,
					"customer": d.customer,
					"status": d.status,
					"satisfaction": d.satisfaction_score,
					"updated": str(d.modified)[:16] if d.modified else "",
					"_drill": {"view": "crm-delivery-readiness-detail", "params": {"name": d.name}},
				}
			)
	scores = [flt(r["satisfaction"]) for r in rows if r.get("satisfaction")]
	return result(
		"crm_exec_delivery",
		_("Deliveries & Satisfaction"),
		f,
		{"total": len(rows), "avg_satisfaction": round(sum(scores) / len(scores), 2) if scores else 0},
		[
			col("name", "Delivery"),
			col("opportunity", "Opportunity"),
			col("customer", "Customer"),
			col("status", "Status"),
			col("satisfaction", "Satisfaction"),
			col("updated", "Updated"),
		],
		rows,
		help_text=help_text,
	)


def _service_retention_overview(filters=None):
	f = parse_crm_filters(filters)
	help_text = _("Service due classifications: Upcoming / Due / Overdue / Severely Overdue / Lapsed / Recovered / Inactive / Vehicle Sold / Unreachable from DMS CRM Service Due.")
	rows = []
	if dt_exists(SERVICE_DUE):
		for r in frappe.get_all(
			SERVICE_DUE,
			fields=["name", "customer", "vin", "classification", "due_date", "branch", "model"],
			order_by="due_date asc",
			limit=3000,
		):
			if f.get("branch") and r.branch and r.branch != f["branch"]:
				continue
			if f.get("model") and r.model and r.model != f["model"]:
				continue
			rows.append(
				{
					"name": r.name,
					"customer": r.customer,
					"vin": r.vin,
					"classification": r.classification,
					"due_date": str(r.due_date) if r.due_date else "",
					"branch": r.branch,
					"model": r.model,
				}
			)
	return result(
		"crm_exec_service_retention",
		_("Service Retention Overview"),
		f,
		{"total": len(rows), "by_classification": group_count(rows, "classification")},
		[
			col("name", "Service Due"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("classification", "Class"),
			col("due_date", "Due"),
			col("branch", "Branch"),
			col("model", "Model"),
		],
		rows,
		help_text=help_text,
	)


def _appointments_overview(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	show = next((k for k in pack["kpis"] if k["id"] == "appointment_show_rate_pct"), {})
	help_text = _(
		"Appendix B show rate = Arrived appointments / confirmed appointments × 100. "
		"Uses Service Appointment (workshop) plus DMS CRM Sales Appointment. "
		"Confirmed includes Confirmed/Booked/Reminder Sent/Arrived/Completed/No-Show."
	)
	rows = []
	dt = ACTIVITY if dt_exists(ACTIVITY) else None
	# Prefer sales appointments when present
	if dt_exists("DMS CRM Sales Appointment"):
		dt = "DMS CRM Sales Appointment"
	if dt:
		fields = ["name", "status", "creation"]
		meta = frappe.get_meta(dt)
		for optional in ("subject", "disposition", "customer", "branch", "activity_type", "appointment_date"):
			if meta.has_field(optional):
				fields.append(optional)
		filt = {"creation": creation_between(f)}
		if meta.has_field("branch") and f.get("branch"):
			filt["branch"] = f["branch"]
		for r in frappe.get_all(dt, filters=filt, fields=fields, order_by="creation desc", limit=2000):
			rows.append(
				{
					"name": r.name,
					"subject": r.get("subject") or r.name,
					"status": r.status,
					"disposition": r.get("disposition"),
					"customer": r.get("customer"),
					"branch": r.get("branch"),
					"type": r.get("activity_type"),
					"date": str(r.get("appointment_date") or r.creation)[:16],
				}
			)
	no_shows = sum(
		1
		for r in rows
		if (r.get("disposition") or "").lower() in ("no show", "no-show")
		or (r.get("status") or "") == "No Show"
	)
	return result(
		"crm_exec_appointments",
		_("Appointments Overview"),
		f,
		{
			"total": len(rows),
			"no_shows": no_shows,
			"no_show_pct": round(100.0 * no_shows / len(rows), 1) if rows else 0,
			"appointment_show_rate_pct": show.get("value") or 0,
			"arrived": show.get("numerator") or 0,
			"confirmed": show.get("denominator") or 0,
		},
		[
			col("name", "Ref"),
			col("subject", "Subject"),
			col("status", "Status"),
			col("disposition", "Disposition"),
			col("customer", "Customer"),
			col("branch", "Branch"),
			col("date", "Date"),
		],
		rows,
		help_text=help_text,
	)


def _complaints_overview(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	sla = next((k for k in pack["kpis"] if k["id"] == "complaint_sla_compliance_pct"), {})
	fcr = next((k for k in pack["kpis"] if k["id"] == "first_contact_resolution_pct"), {})
	help_text = _(
		"Appendix B Complaint SLA = cases resolved within SLA / resolved cases × 100. "
		"First Contact Resolution = cases resolved without follow-up escalation / total cases × 100. "
		"Open-case counts remain operational."
	)
	rows = []
	if dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		fields = ["name", "subject", "status", "priority", "customer", "creation", "modified"]
		for optional in ("sla_status", "branch", "resolution_satisfaction", "case_owner"):
			if meta.has_field(optional):
				fields.append(optional)
		filt = {"creation": creation_between(f)}
		if meta.has_field("branch") and f.get("branch"):
			filt["branch"] = f["branch"]
		for r in frappe.get_all(CASE, filters=filt, fields=fields, order_by="modified desc", limit=2000):
			rows.append(
				{
					"name": r.name,
					"subject": r.subject,
					"status": r.status,
					"priority": r.priority,
					"sla_status": r.get("sla_status"),
					"customer": r.customer,
					"owner": r.get("case_owner"),
					"satisfaction": r.get("resolution_satisfaction"),
					"_drill": {"view": "crm-case-detail", "params": {"name": r.name}},
				}
			)
	return result(
		"crm_exec_complaints",
		_("Complaints Overview"),
		f,
		{
			"total": len(rows),
			"open": sum(1 for r in rows if r["status"] not in ("Resolved", "Closed")),
			"breached": sum(1 for r in rows if (r.get("sla_status") or "") in ("Breached", "Breach")),
			"complaint_sla_compliance_pct": sla.get("value") or 0,
			"first_contact_resolution_pct": fcr.get("value") or 0,
			"resolved_within_sla": sla.get("numerator") or 0,
			"resolved_cases": sla.get("denominator") or 0,
		},
		[
			col("name", "Case"),
			col("subject", "Subject"),
			col("status", "Status"),
			col("priority", "Priority"),
			col("sla_status", "SLA"),
			col("customer", "Customer"),
			col("owner", "Owner"),
			col("satisfaction", "Satisfaction"),
		],
		rows,
		help_text=help_text,
		definitions={
			"complaint_sla_compliance_pct": "Resolved within SLA / resolved cases × 100",
			"first_contact_resolution_pct": "Resolved without escalation / total cases × 100",
		},
	)


def _campaigns_overview(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	roi = next((k for k in pack["kpis"] if k["id"] == "campaign_roi_pct"), {})
	help_text = _(
		"Appendix B Campaign ROI = (attributed gross benefit − campaign cost) / campaign cost × 100. "
		"Benefit = campaign_revenue (member attributed sales); cost = budget."
	)
	rows = []
	if dt_exists(CAMPAIGN):
		meta = frappe.get_meta(CAMPAIGN)
		fields = ["name", "campaign_name", "status", "creation"]
		for optional in (
			"leads_generated",
			"campaign_revenue",
			"budget",
			"roi_pct",
			"channel",
			"branch",
		):
			if meta.has_field(optional):
				fields.append(optional)
		filt = {"creation": creation_between(f)}
		if f.get("campaign"):
			filt["name"] = f["campaign"]
		for r in frappe.get_all(CAMPAIGN, filters=filt, fields=fields, limit=500):
			benefit = flt(r.get("campaign_revenue"))
			cost = flt(r.get("budget"))
			row_roi = round(100.0 * (benefit - cost) / cost, 1) if cost else flt(r.get("roi_pct"))
			rows.append(
				{
					"name": r.name,
					"campaign_name": r.get("campaign_name") or r.name,
					"status": r.status,
					"leads": cint(r.get("leads_generated")),
					"revenue": benefit,
					"cost": cost,
					"roi_pct": row_roi,
					"channel": r.get("channel"),
					"_drill": {"view": "crm-campaign-detail", "params": {"name": r.name}},
				}
			)
	return result(
		"crm_exec_campaigns",
		_("Campaign ROI Overview"),
		f,
		{
			"total": len(rows),
			"leads": sum(r["leads"] for r in rows),
			"revenue": round(sum(r["revenue"] for r in rows), 2),
			"cost": round(sum(r["cost"] for r in rows), 2),
			"campaign_roi_pct": roi.get("value") or 0,
		},
		[
			col("name", "Campaign"),
			col("campaign_name", "Name"),
			col("status", "Status"),
			col("leads", "Leads"),
			col("revenue", "Attributed Benefit"),
			col("cost", "Cost (Budget)"),
			col("roi_pct", "ROI %"),
			col("channel", "Channel"),
		],
		rows,
		help_text=help_text,
		definitions={"campaign_roi_pct": "(attributed benefit − budget) / budget × 100"},
	)


def _customer_value_overview(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	ltv = next((k for k in pack["kpis"] if k["id"] == "customer_lifetime_value"), {})
	help_text = _(
		"Appendix B Customer Lifetime Value is accumulated (all-time) invoiced contribution "
		"per customer. Aftersales is shown separately from job cards and is not added into LTV "
		"to avoid double-counting invoiced workshop work."
	)
	rows = []
	if frappe.db.exists("DocType", "Sales Invoice"):
		si_rows = frappe.db.sql(
			"""
			SELECT customer, SUM(base_grand_total) AS revenue, COUNT(*) AS invoices
			FROM `tabSales Invoice`
			WHERE docstatus = 1 AND is_return = 0
			GROUP BY customer
			ORDER BY revenue DESC
			LIMIT 200
			""",
			as_dict=True,
		)
		jc_by_customer = {}
		if frappe.db.exists("DocType", "DMS Job Card"):
			jc_meta = frappe.get_meta("DMS Job Card")
			if jc_meta.has_field("customer") and jc_meta.has_field("total_amount"):
				for jc in frappe.db.sql(
					"""
					SELECT customer, SUM(total_amount) AS aftersales
					FROM `tabDMS Job Card`
					WHERE docstatus < 2 AND customer IS NOT NULL AND customer != ''
					GROUP BY customer
					""",
					as_dict=True,
				):
					jc_by_customer[jc.customer] = flt(jc.aftersales)
		open_opp_customers = set()
		if dt_exists(OPP):
			open_opp_customers = {
				r.customer
				for r in frappe.get_all(
					OPP,
					filters={"status": ["not in", ["Won", "Lost", "Cancelled"]], "customer": ["is", "set"]},
					fields=["customer"],
					limit=5000,
				)
				if r.customer
			}
		for r in si_rows:
			cname = frappe.db.get_value("Customer", r.customer, "customer_name") or r.customer
			aftersales = jc_by_customer.get(r.customer) or 0
			rows.append(
				{
					"customer": r.customer,
					"customer_name": cname,
					"revenue": round(flt(r.revenue), 2),
					"aftersales": round(aftersales, 2),
					"lifetime_value": round(flt(r.revenue), 2),
					"invoices": cint(r.invoices),
					"repurchase_opportunity": "Yes" if r.customer in open_opp_customers else "No",
					"_drill": {"view": "crm-customer-detail", "params": {"name": r.customer}},
				}
			)
	return result(
		"crm_exec_customer_value",
		_("Customer Lifetime Value"),
		f,
		{
			"total": len(rows),
			"revenue": round(sum(r["lifetime_value"] for r in rows), 2),
			"customer_lifetime_value": ltv.get("value") or 0,
			"customers": ltv.get("denominator") or 0,
		},
		[
			col("customer", "Customer"),
			col("customer_name", "Name"),
			col("revenue", "Sales"),
			col("aftersales", "Aftersales"),
			col("lifetime_value", "Lifetime Value"),
			col("invoices", "Invoices"),
			col("repurchase_opportunity", "Repurchase Opp"),
		],
		rows,
		help_text=help_text,
		definitions={"customer_lifetime_value": "Accumulated invoiced sales / customers"},
	)


REPORT_HANDLERS = {
	"crm_exec_pipeline": _pipeline_report,
	"crm_exec_forecast": _forecast_report,
	"crm_exec_conversion": _conversion_report,
	"crm_exec_delivery": _delivery_report,
	"crm_exec_service_retention": _service_retention_overview,
	"crm_exec_appointments": _appointments_overview,
	"crm_exec_complaints": _complaints_overview,
	"crm_exec_campaigns": _campaigns_overview,
	"crm_exec_customer_value": _customer_value_overview,
}
