# Copyright (c) 2026, Mania and contributors
"""Appendix B recommended KPI formulas for DMS CRM."""

from __future__ import annotations

from frappe import _
from frappe.utils import cint, date_diff, flt, getdate, time_diff_in_hours

import frappe

from dms.crm_api.reports.common import (
	CAMPAIGN,
	CASE,
	LEAD,
	OPP,
	REMINDER,
	SERVICE_DUE,
	TEST_DRIVE,
	col,
	creation_between,
	dim_filters,
	dt_exists,
	parse_crm_filters,
	result,
)

SERVICE_APPOINTMENT = "Service Appointment"
SALES_APPOINTMENT = "DMS CRM Sales Appointment"
MEMBER = "DMS CRM Campaign Member"

INVALID_LEAD = {"Duplicate", "Invalid"}
CONTACTED_LEAD = {"Contacted", "Qualified", "Converted", "Disqualified", "Nurture"}
QUALIFIED_LEAD = {"Qualified", "Converted"}

ARRIVED_SERVICE = {
	"Arrived",
	"In Inspection",
	"In Workshop",
	"Ready for Pickup",
	"Completed",
}
CONFIRMED_SERVICE = {
	"Confirmed",
	"Booked",
	"Reminder Sent",
	"No-Show",
} | ARRIVED_SERVICE

ARRIVED_SALES = {"Arrived", "Completed"}
CONFIRMED_SALES = {"Confirmed", "Arrived", "Completed", "No-Show"}

ELIGIBLE_DUE = {"Upcoming", "Due", "Overdue", "Severely Overdue"}
RETURNED_DUE_STATUS = {"Booked", "In Service", "Completed"}
CONTACTED_REMINDER = {"sent", "delivered", "completed", "answered", "connected"}
RESOLVED_CASE = {"Resolved", "Closed"}
NO_ESCALATION = {None, "", "None"}


def _pct(num, den) -> float:
	den = flt(den)
	if den <= 0:
		return 0.0
	return round(100.0 * flt(num) / den, 1)


def _kpi(kpi_id, label, formula, value, numerator=0, denominator=0, unit="%"):
	return {
		"id": kpi_id,
		"label": label,
		"formula": formula,
		"value": value,
		"numerator": numerator,
		"denominator": denominator,
		"unit": unit,
	}


def compute_appendix_b_kpis(filters=None) -> dict:
	"""Canonical Appendix B KPIs. `summary` is card-friendly; `kpis` is the formula table."""
	f = parse_crm_filters(filters)
	kpis = []
	summary = {}

	leads = _lead_rows(f)
	kpis.append(_lead_response(f, leads))
	kpis.append(_lead_contact_rate(f, leads))
	kpis.append(_qualification_rate(f, leads))
	kpis.append(_lead_to_sale(f, leads))
	kpis.append(_test_drive_conversion(f))
	kpis.append(_quotation_conversion(f))
	kpis.append(_avg_sales_cycle(f))
	kpis.append(_weighted_pipeline(f))
	kpis.append(_appointment_show_rate(f))
	kpis.append(_service_retention(f))
	kpis.append(_reminder_booking_rate(f))
	kpis.append(_lapsed_recovery_rate(f))
	kpis.append(_complaint_sla_compliance(f))
	kpis.append(_first_contact_resolution(f))
	kpis.append(_campaign_roi(f))
	kpis.append(_customer_lifetime_value(f))

	for row in kpis:
		summary[row["id"]] = row["value"]

	return {
		"from_date": str(f["from_date"]),
		"to_date": str(f["to_date"]),
		"kpis": kpis,
		"summary": summary,
	}


def _lead_rows(f):
	if not dt_exists(LEAD):
		return []
	fields = ["name", "status", "creation"]
	meta = frappe.get_meta(LEAD)
	for optional in (
		"assigned_on",
		"first_responded_on",
		"qualified_on",
		"lead_owner",
		"branch",
	):
		if meta.has_field(optional):
			fields.append(optional)
	return frappe.get_all(
		LEAD,
		filters={"creation": creation_between(f), **dim_filters(f)},
		fields=fields,
		limit=8000,
	)


def _valid_leads(rows):
	return [r for r in rows if (r.get("status") or "") not in INVALID_LEAD]


def _lead_response(f, rows=None):
	rows = rows if rows is not None else _lead_rows(f)
	hours = []
	for r in rows:
		resp = r.get("first_responded_on")
		if resp and r.creation:
			hours.append(flt(time_diff_in_hours(resp, r.creation)))
	avg = round(sum(hours) / len(hours), 2) if hours else 0
	return _kpi(
		"lead_response_hours",
		_("Lead Response Time"),
		_("First meaningful response timestamp − lead creation timestamp"),
		avg,
		round(sum(hours), 2) if hours else 0,
		len(hours),
		"hours",
	)


def _lead_contact_rate(f, rows=None):
	valid = _valid_leads(rows if rows is not None else _lead_rows(f))
	assigned = [
		r
		for r in valid
		if r.get("assigned_on") or (r.get("status") or "") not in ("New", "")
	]
	contacted = [r for r in valid if (r.get("status") or "") in CONTACTED_LEAD]
	return _kpi(
		"lead_contact_rate_pct",
		_("Lead Contact Rate"),
		_("Leads contacted / leads assigned × 100"),
		_pct(len(contacted), len(assigned)),
		len(contacted),
		len(assigned),
	)


def _qualification_rate(f, rows=None):
	valid = _valid_leads(rows if rows is not None else _lead_rows(f))
	contacted = [r for r in valid if (r.get("status") or "") in CONTACTED_LEAD]
	qualified = [
		r
		for r in valid
		if (r.get("status") or "") in QUALIFIED_LEAD or r.get("qualified_on")
	]
	return _kpi(
		"qualification_rate_pct",
		_("Qualification Rate"),
		_("Qualified leads / contacted leads × 100"),
		_pct(len(qualified), len(contacted)),
		len(qualified),
		len(contacted),
	)


def _lead_to_sale(f, rows=None):
	valid_n = len(_valid_leads(rows if rows is not None else _lead_rows(f)))
	won_n = 0
	if dt_exists(OPP):
		won_n = frappe.db.count(
			OPP,
			{
				"status": "Won",
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
		)
	return _kpi(
		"lead_to_sale_pct",
		_("Lead-to-Sale Conversion"),
		_("Won opportunities / valid leads × 100 (excludes Duplicate / Invalid)"),
		_pct(won_n, valid_n),
		won_n,
		valid_n,
	)


def _test_drive_conversion(f):
	completed = []
	sold = 0
	if dt_exists(TEST_DRIVE):
		meta = frappe.get_meta(TEST_DRIVE)
		fields = ["name", "status", "customer", "opportunity"]
		filt = {"status": "Completed", "creation": creation_between(f)}
		if meta.has_field("branch") and f.get("branch"):
			filt["branch"] = f["branch"]
		completed = frappe.get_all(TEST_DRIVE, filters=filt, fields=fields, limit=4000)
		opp_ids = list({d.opportunity for d in completed if d.get("opportunity")})
		won_opps = set()
		if opp_ids and dt_exists(OPP):
			won_opps = set(
				frappe.get_all(
					OPP,
					filters={"name": ["in", opp_ids], "status": "Won"},
					pluck="name",
				)
			)
		cust_ids = list({d.customer for d in completed if d.get("customer")})
		won_cust = set()
		if cust_ids and dt_exists(OPP):
			won_cust = {
				r.customer
				for r in frappe.get_all(
					OPP,
					filters={"customer": ["in", cust_ids], "status": "Won"},
					fields=["customer"],
					limit=4000,
				)
			}
		for d in completed:
			if (d.get("opportunity") in won_opps) or (d.get("customer") in won_cust):
				sold += 1
	return _kpi(
		"test_drive_conversion_pct",
		_("Test-Drive Conversion"),
		_("Sales from customers who completed a test drive / completed test drives × 100"),
		_pct(sold, len(completed)),
		sold,
		len(completed),
	)


def _quotation_opp_field():
	if not dt_exists("Quotation"):
		return None
	meta = frappe.get_meta("Quotation")
	for candidate in (
		"custom_dms_crm_opportunity",
		"dms_opportunity",
		"custom_opportunity",
		"dms_crm_opportunity",
		"opportunity",
	):
		if meta.has_field(candidate):
			return candidate
	return None


def _quotation_conversion(f):
	issued = 0
	won = 0
	opp_field = _quotation_opp_field()
	if opp_field and dt_exists("Quotation"):
		quotes = frappe.get_all(
			"Quotation",
			filters={
				"transaction_date": ["between", [str(f["from_date"]), str(f["to_date"])]],
				"docstatus": ["<", 2],
			},
			fields=["name", opp_field],
			limit=4000,
		)
		issued = len(quotes)
		opp_ids = list({q.get(opp_field) for q in quotes if q.get(opp_field)})
		if opp_ids and dt_exists(OPP):
			won = frappe.db.count(OPP, {"name": ["in", opp_ids], "status": "Won"})
	elif dt_exists(OPP) and frappe.get_meta(OPP).has_field("quotation"):
		opps = frappe.get_all(
			OPP,
			filters={
				"quotation": ["is", "set"],
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=["name", "status"],
			limit=4000,
		)
		issued = len(opps)
		won = sum(1 for o in opps if o.status == "Won")
	return _kpi(
		"quotation_conversion_pct",
		_("Quotation Conversion"),
		_("Won opportunities / quotations issued × 100"),
		_pct(won, issued),
		won,
		issued,
	)


def _avg_sales_cycle(f):
	cycles = []
	if dt_exists(OPP):
		fields = ["name", "creation", "modified", "lead"]
		if not frappe.get_meta(OPP).has_field("lead"):
			fields = ["name", "creation", "modified"]
		won = frappe.get_all(
			OPP,
			filters={
				"status": "Won",
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=fields,
			limit=4000,
		)
		lead_ids = [w.lead for w in won if w.get("lead")]
		lead_created = {}
		if lead_ids and dt_exists(LEAD):
			for row in frappe.get_all(
				LEAD, filters={"name": ["in", lead_ids]}, fields=["name", "creation"]
			):
				lead_created[row.name] = row.creation
		for w in won:
			start = lead_created.get(w.get("lead")) or w.creation
			if start and w.modified:
				cycles.append(date_diff(getdate(w.modified), getdate(start)))
	avg = round(sum(cycles) / len(cycles), 1) if cycles else 0
	return _kpi(
		"avg_sales_cycle_days",
		_("Average Sales Cycle"),
		_("Average days from lead creation to won date"),
		avg,
		sum(cycles) if cycles else 0,
		len(cycles),
		"days",
	)


def _weighted_pipeline(f):
	total = 0.0
	count = 0
	if dt_exists(OPP):
		rows = frappe.get_all(
			OPP,
			filters={
				"status": ["in", ["Open", "On Hold"]],
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=["expected_value", "probability"],
			limit=8000,
		)
		count = len(rows)
		total = sum(flt(r.expected_value) * flt(r.probability or 0) / 100.0 for r in rows)
	return _kpi(
		"weighted_pipeline",
		_("Weighted Pipeline"),
		_("Sum of opportunity value × stage probability"),
		round(total, 2),
		round(total, 2),
		count,
		"value",
	)


def _appointment_show_rate(f):
	arrived = 0
	confirmed = 0
	if dt_exists(SERVICE_APPOINTMENT):
		rows = frappe.get_all(
			SERVICE_APPOINTMENT,
			filters={"creation": creation_between(f)},
			fields=["status"],
			limit=8000,
		)
		for r in rows:
			st = r.status or ""
			if st in CONFIRMED_SERVICE:
				confirmed += 1
			if st in ARRIVED_SERVICE:
				arrived += 1
	if dt_exists(SALES_APPOINTMENT):
		rows = frappe.get_all(
			SALES_APPOINTMENT,
			filters={"creation": creation_between(f)},
			fields=["status"],
			limit=4000,
		)
		for r in rows:
			st = r.status or ""
			if st in CONFIRMED_SALES:
				confirmed += 1
			if st in ARRIVED_SALES:
				arrived += 1
	return _kpi(
		"appointment_show_rate_pct",
		_("Appointment Show Rate"),
		_("Arrived appointments / confirmed appointments × 100"),
		_pct(arrived, confirmed),
		arrived,
		confirmed,
	)


def _service_retention(f):
	eligible = 0
	returned = 0
	if dt_exists(SERVICE_DUE):
		fields = ["name", "classification", "status", "service_appointment"]
		meta = frappe.get_meta(SERVICE_DUE)
		if meta.has_field("job_card"):
			fields.append("job_card")
		rows = frappe.get_all(SERVICE_DUE, fields=fields, limit=8000)
		for r in rows:
			cls = r.get("classification") or ""
			if cls not in ELIGIBLE_DUE:
				continue
			eligible += 1
			if (
				r.get("service_appointment")
				or r.get("job_card")
				or (r.get("status") or "") in RETURNED_DUE_STATUS
			):
				returned += 1
	return _kpi(
		"service_retention_pct",
		_("Service Retention"),
		_("Eligible vehicles returning within the service window / eligible vehicles due × 100"),
		_pct(returned, eligible),
		returned,
		eligible,
	)


def _reminder_booking_rate(f):
	contacted_customers = set()
	booked_customers = set()
	if dt_exists(REMINDER):
		fields = ["name", "status", "customer", "service_due"]
		rows = frappe.get_all(
			REMINDER,
			filters={"creation": creation_between(f)},
			fields=fields,
			limit=8000,
		)
		due_ids = list({r.service_due for r in rows if r.get("service_due")})
		due_map = {}
		if due_ids and dt_exists(SERVICE_DUE):
			for sd in frappe.get_all(
				SERVICE_DUE,
				filters={"name": ["in", due_ids]},
				fields=["name", "customer", "service_appointment"],
			):
				due_map[sd.name] = sd
		for r in rows:
			if (r.get("status") or "").lower() not in CONTACTED_REMINDER:
				continue
			sd = due_map.get(r.get("service_due") or "")
			cust = r.get("customer") or (sd.customer if sd else None)
			if not cust:
				continue
			contacted_customers.add(cust)
			if sd and sd.get("service_appointment"):
				booked_customers.add(cust)
	return _kpi(
		"reminder_booking_rate_pct",
		_("Reminder Booking Rate"),
		_("Appointments booked / customers successfully contacted × 100"),
		_pct(len(booked_customers), len(contacted_customers)),
		len(booked_customers),
		len(contacted_customers),
	)


def _lapsed_recovery_rate(f):
	targeted = 0
	recovered = 0
	if dt_exists(SERVICE_DUE):
		fields = ["name", "classification", "service_appointment", "last_reminder_on"]
		rows = frappe.get_all(SERVICE_DUE, fields=fields, limit=8000)
		reminded = set()
		if dt_exists(REMINDER):
			reminded = set(
				frappe.get_all(
					REMINDER,
					filters={"creation": creation_between(f), "service_due": ["is", "set"]},
					pluck="service_due",
					limit=8000,
				)
			)
		for r in rows:
			cls = r.get("classification") or ""
			is_recovered = cls == "Recovered" or (
				cls == "Lapsed" and r.get("service_appointment")
			)
			is_targeted = (
				cls in ("Lapsed", "Recovered")
				and (r.get("last_reminder_on") or r.name in reminded or is_recovered)
			)
			if is_targeted:
				targeted += 1
			if is_recovered and is_targeted:
				recovered += 1
	return _kpi(
		"lapsed_recovery_rate_pct",
		_("Lapsed Recovery Rate"),
		_("Recovered customers / lapsed customers targeted × 100"),
		_pct(recovered, targeted),
		recovered,
		targeted,
	)


def _complaint_sla_compliance(f):
	resolved = 0
	within = 0
	if dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		fields = ["name", "status", "sla_breached", "resolution_breached"]
		filt = {"status": ["in", list(RESOLVED_CASE)]}
		if meta.has_field("opened_on"):
			filt["opened_on"] = creation_between(f)
		else:
			filt["creation"] = creation_between(f)
		rows = frappe.get_all(CASE, filters=filt, fields=fields, limit=4000)
		resolved = len(rows)
		for r in rows:
			if not cint(r.get("sla_breached")) and not cint(r.get("resolution_breached")):
				within += 1
	return _kpi(
		"complaint_sla_compliance_pct",
		_("Complaint SLA Compliance"),
		_("Cases resolved within SLA / resolved cases × 100"),
		_pct(within, resolved),
		within,
		resolved,
	)


def _first_contact_resolution(f):
	total = 0
	fcr = 0
	if dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		fields = ["name", "status", "escalation_level", "escalated_on"]
		filt = {"creation": creation_between(f)}
		if meta.has_field("opened_on"):
			filt = {"opened_on": creation_between(f)}
		rows = frappe.get_all(CASE, filters=filt, fields=fields, limit=4000)
		total = len(rows)
		for r in rows:
			if (r.get("status") or "") not in RESOLVED_CASE:
				continue
			if r.get("escalated_on"):
				continue
			if (r.get("escalation_level") or "None") not in NO_ESCALATION:
				continue
			fcr += 1
	return _kpi(
		"first_contact_resolution_pct",
		_("First Contact Resolution"),
		_("Cases resolved without follow-up escalation / total cases × 100"),
		_pct(fcr, total),
		fcr,
		total,
	)


def _campaign_roi(f):
	benefit = 0.0
	cost = 0.0
	if dt_exists(CAMPAIGN):
		meta = frappe.get_meta(CAMPAIGN)
		fields = ["name", "budget", "campaign_revenue"]
		if meta.has_field("roi_pct"):
			fields.append("roi_pct")
		rows = frappe.get_all(
			CAMPAIGN,
			filters={"creation": creation_between(f)},
			fields=fields,
			limit=1000,
		)
		for r in rows:
			rev = flt(r.get("campaign_revenue"))
			if not rev and dt_exists(MEMBER) and frappe.get_meta(MEMBER).has_field("attributed_revenue"):
				rev = flt(
					sum(
						flt(m.attributed_revenue)
						for m in frappe.get_all(
							MEMBER,
							filters={"campaign": r.name, "attributed_revenue": [">", 0]},
							fields=["attributed_revenue"],
							limit=5000,
						)
					)
				)
			benefit += rev
			cost += flt(r.get("budget"))
	roi = round(100.0 * (benefit - cost) / cost, 1) if cost else 0
	return _kpi(
		"campaign_roi_pct",
		_("Campaign ROI"),
		_("(Attributed gross benefit − campaign cost) / campaign cost × 100"),
		roi,
		round(benefit, 2),
		round(cost, 2),
	)


def _customer_lifetime_value(f):
	"""Average accumulated invoiced contribution per customer (Appendix B)."""
	total = 0.0
	customers = 0
	if frappe.db.exists("DocType", "Sales Invoice"):
		all_row = frappe.db.sql(
			"""
			SELECT COALESCE(SUM(base_grand_total), 0), COUNT(DISTINCT customer)
			FROM `tabSales Invoice`
			WHERE docstatus = 1 AND is_return = 0
			"""
		)[0]
		total = flt(all_row[0])
		customers = cint(all_row[1])
		if not customers:
			period_row = frappe.db.sql(
				"""
				SELECT COALESCE(SUM(base_grand_total), 0), COUNT(DISTINCT customer)
				FROM `tabSales Invoice`
				WHERE docstatus = 1 AND is_return = 0 AND posting_date BETWEEN %s AND %s
				""",
				(str(f["from_date"]), str(f["to_date"])),
			)[0]
			total, customers = flt(period_row[0]), cint(period_row[1])
	avg = round(total / customers, 2) if customers else 0
	return _kpi(
		"customer_lifetime_value",
		_("Customer Lifetime Value"),
		_("Configurable accumulated customer contribution (invoiced sales) / customers"),
		avg,
		round(total, 2),
		customers,
		"value",
	)


def appendix_b_kpi_report(filters=None):
	"""Tabular Appendix B KPI pack with formula, value, numerator and denominator."""
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	rows = []
	for k in pack["kpis"]:
		rows.append(
			{
				"kpi": k["label"],
				"formula": k["formula"],
				"value": k["value"],
				"unit": k["unit"],
				"numerator": k["numerator"],
				"denominator": k["denominator"],
			}
		)
	return result(
		"crm_appendix_b_kpis",
		_("Appendix B KPIs"),
		f,
		{
			"kpis": len(rows),
			**{k["id"]: k["value"] for k in pack["kpis"]},
		},
		[
			col("kpi", "KPI"),
			col("formula", "Formula"),
			col("value", "Value"),
			col("unit", "Unit"),
			col("numerator", "Numerator"),
			col("denominator", "Denominator"),
		],
		rows,
		help_text=_(
			"Blueprint Appendix B recommended KPI formulas. "
			"Valid leads exclude Duplicate and Invalid. "
			"Test-drive conversion uses completed drives only. "
			"Show rate uses Service Appointment + CRM Sales Appointment."
		),
		definitions={k["id"]: k["formula"] for k in pack["kpis"]},
	)


REPORT_HANDLERS = {
	"crm_appendix_b_kpis": appendix_b_kpi_report,
}
