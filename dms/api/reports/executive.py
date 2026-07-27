# Copyright (c) 2026, Mania and contributors
"""Executive Management reports (Suweys Aftersales Spec §1.1–1.4)."""

from __future__ import annotations

from collections import defaultdict

import frappe
from frappe import _
from frappe.utils import add_years, cint, flt, getdate

from dms.api.reports.common import (
	OPEN_JOB_CARD_STATUSES,
	_apply_link_display_names,
	_apply_vin_numbers,
	_jc_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_vin_link_filter_value,
	_vin_sql_clause,
)

CLOSED_STATUSES = ("Completed", "Delivered")
CUSTOMER_PAY_TYPES = ("Customer Paid", "Insurance", "Goodwill", "Fleet Contract", "PDI")
WARRANTY_TYPES = ("Warranty", "Campaign/Recall")
INTERNAL_TYPES = ("Internal",)


def _pay_bucket(job_card_type: str | None) -> str:
	t = (job_card_type or "").strip()
	if t in WARRANTY_TYPES:
		return "warranty"
	if t in INTERNAL_TYPES:
		return "internal"
	if t in CUSTOMER_PAY_TYPES or not t:
		return "customer_pay"
	return "customer_pay"


def _fetch_job_cards(f, extra=None, fields=None, limit=3000):
	conds = _jc_filters(f, {"docstatus": ["<", 2]})
	if extra:
		conds.update(extra)
	default_fields = [
		"name",
		"posting_date",
		"status",
		"job_card_type",
		"customer",
		"customer_name",
		"vehicle_model",
		"vehicle_vin",
		"service_advisor",
		"lead_technician",
		"company",
		"branch",
		"currency",
		"total_labor_cost",
		"total_parts_cost",
		"discount_amount",
		"net_amount",
		"total_amount",
		"is_repeat_repair",
		"promised_delivery_date_time",
		"opened_date_time",
		"completed_date_time",
		"customer_satisfaction",
	]
	return frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=fields or default_fields,
		limit=limit,
	)


def _parts_cost_by_job(job_names):
	"""Direct parts cost at inventory valuation / last purchase (Spec §1.2)."""
	if not job_names:
		return {}
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		part_issue_qty,
		spare_part_unit_cost,
	)

	rows = frappe.get_all(
		"Job Card Part Item",
		filters={"parent": ["in", job_names], "parenttype": "DMS Job Card"},
		fields=[
			"parent",
			"item_code",
			"quantity_issued",
			"quantity_requested",
			"quantity_returned",
			"is_warranty",
		],
		limit=20000,
	)
	cost_cache = {}
	out = defaultdict(float)
	for row in rows:
		code = row.item_code
		if not code:
			continue
		if code not in cost_cache:
			cost_cache[code] = spare_part_unit_cost(code)
		qty = part_issue_qty(row)
		out[row.parent] += qty * cost_cache[code]
	return {k: round(v, 2) for k, v in out.items()}


def _estimate_conversion(f):
	"""Spec §3.2: Approved / Submitted × 100 (includes partially approved)."""
	if not frappe.db.exists("DocType", "DMS Service Estimate"):
		return 0.0, 0, 0
	from dms.api.reports.advisor import get_estimate_conversion_report

	rep = get_estimate_conversion_report(f)
	s = rep.get("summary") or {}
	return (
		flt(s.get("conversion_pct")),
		cint(s.get("estimates_approved", 0)) + cint(s.get("estimates_partially_approved", 0)),
		cint(s.get("estimates_submitted", 0)),
	)


def _csat_score(f):
	from dms.api.reports.crm import get_customer_satisfaction_report

	sat = get_customer_satisfaction_report(f)
	return flt(sat["summary"].get("avg_rating"))


def _tech_productivity_pct(f):
	from dms.api.reports.technician import get_technician_productivity_report

	prod = get_technician_productivity_report(f)
	return flt(prod["summary"].get("avg_efficiency_pct"))


def _period_revenue_buckets(jcs):
	"""Labour / parts / warranty / internal value from job-card selling totals."""
	labour = parts = consumables = sublet = warranty_rev = internal_value = 0.0
	by_type = defaultdict(float)
	for jc in jcs:
		lab = flt(jc.total_labor_cost)
		prt = flt(jc.total_parts_cost)
		net = flt(jc.net_amount or jc.total_amount)
		bucket = _pay_bucket(jc.job_card_type)
		by_type[bucket] += net
		if bucket == "internal":
			internal_value += lab + prt
			continue
		if bucket == "warranty":
			warranty_rev += lab + prt
		else:
			labour += lab
			parts += prt
	return {
		"labor_revenue": round(labour, 2),
		"parts_revenue": round(parts, 2),
		"consumables_revenue": round(consumables, 2),
		"sublet_revenue": round(sublet, 2),
		"warranty_revenue": round(warranty_rev, 2),
		"internal_work_value": round(internal_value, 2),
		"by_pay_mix": {
			"customer_pay": round(by_type["customer_pay"], 2),
			"warranty": round(by_type["warranty"], 2),
			"internal": round(by_type["internal"], 2),
		},
	}


def get_service_revenue_report(filters=None):
	"""Legacy labour/parts revenue table (also used by Finance)."""
	f = _parse_filters(filters)
	jcs = _fetch_job_cards(f)
	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})
	_apply_vin_numbers(jcs)

	labour_total = parts_total = discount_total = net_total = 0.0
	revenue_currencies = set()
	companies_seen = set()
	by_month = {}
	by_advisor = {}
	by_model = {}

	for jc in jcs:
		lab = flt(jc.total_labor_cost)
		prt = flt(jc.total_parts_cost)
		disc = flt(jc.discount_amount)
		net = flt(jc.net_amount or jc.total_amount)
		labour_total += lab
		parts_total += prt
		discount_total += disc
		net_total += net
		if jc.currency:
			revenue_currencies.add(jc.currency)
		if jc.company:
			companies_seen.add(jc.company)

		month = str(getdate(jc.posting_date))[:7] if jc.posting_date else "—"
		if month not in by_month:
			by_month[month] = {"labour": 0, "parts": 0, "discount": 0, "net": 0, "count": 0}
		by_month[month]["labour"] += lab
		by_month[month]["parts"] += prt
		by_month[month]["discount"] += disc
		by_month[month]["net"] += net
		by_month[month]["count"] += 1

		adv = jc.service_advisor or _("Unassigned")
		if adv not in by_advisor:
			by_advisor[adv] = {"labour": 0, "parts": 0, "net": 0, "count": 0}
		by_advisor[adv]["labour"] += lab
		by_advisor[adv]["parts"] += prt
		by_advisor[adv]["net"] += net
		by_advisor[adv]["count"] += 1

		mdl = jc.vehicle_model or _("Unknown")
		if mdl not in by_model:
			by_model[mdl] = {"labour": 0, "parts": 0, "net": 0, "count": 0}
		by_model[mdl]["labour"] += lab
		by_model[mdl]["parts"] += prt
		by_model[mdl]["net"] += net
		by_model[mdl]["count"] += 1

	vat_total = 0.0
	if frappe.db.exists("DocType", "Sales Invoice"):
		si_filters = {
			"posting_date": ["between", [f["from_date"], f["to_date"]]],
			"docstatus": 1,
		}
		if f.get("company"):
			si_filters["company"] = f["company"]
		if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
			inv_names = [jc.name for jc in jcs if jc.name]
			if inv_names:
				sis = frappe.get_all(
					"Sales Invoice",
					filters={**si_filters, "custom_dms_job_card": ["in", inv_names]},
					fields=["name", "total_taxes_and_charges"],
				)
				vat_total = sum(flt(s.total_taxes_and_charges) for s in sis)

	revenue_currency = None
	if len(revenue_currencies) == 1:
		revenue_currency = next(iter(revenue_currencies))
	elif f.get("company"):
		revenue_currency = frappe.db.get_value("Company", f["company"], "default_currency")
	elif len(companies_seen) == 1:
		only_company = next(iter(companies_seen))
		revenue_currency = frappe.db.get_value("Company", only_company, "default_currency")

	return {
		"report_id": "service_revenue",
		"title": _("Service Revenue Report"),
		"filters": _report_filters_response(f),
		"summary": {
			"labour_total": round(labour_total, 2),
			"parts_total": round(parts_total, 2),
			"discount_total": round(discount_total, 2),
			"vat_total": round(vat_total, 2),
			"net_revenue": round(net_total, 2),
			"revenue_currency": revenue_currency,
			"job_card_count": len(jcs),
			"by_month": by_month,
			"by_advisor": by_advisor,
			"by_model": by_model,
		},
		"columns": [
			{"key": "name", "label": _("Job Card")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "posting_date", "label": _("Date")},
			{"key": "vehicle_model", "label": _("Model")},
			{"key": "service_advisor", "label": _("Advisor")},
			{"key": "total_labor_cost", "label": _("Labour")},
			{"key": "total_parts_cost", "label": _("Parts")},
			{"key": "discount_amount", "label": _("Discount")},
			{"key": "net_amount", "label": _("Net")},
		],
		"rows": jcs,
	}


def get_aftersales_dashboard_report(filters=None):
	"""§1.1 Aftersales Performance Dashboard."""
	from dms.api.reports.workshop import get_daily_wip_report

	f = _parse_filters(filters)
	jcs = _fetch_job_cards(f)
	wip = get_daily_wip_report(f)
	rev_buckets = _period_revenue_buckets(jcs)

	opened = len(jcs)
	closed = [jc for jc in jcs if jc.status in CLOSED_STATUSES]
	cancelled = sum(1 for jc in jcs if jc.status == "Cancelled")
	reopened = sum(1 for jc in jcs if cint(jc.is_repeat_repair) or jc.status in ("Rework", "QC Failed"))
	vehicles_received = len({jc.vehicle_vin for jc in jcs if jc.vehicle_vin})

	customer_pay_closed = [
		jc
		for jc in closed
		if _pay_bucket(jc.job_card_type) == "customer_pay"
	]
	customer_pay_net = sum(flt(jc.net_amount or jc.total_amount) for jc in customer_pay_closed)
	avg_ro = round(customer_pay_net / len(customer_pay_closed), 2) if customer_pay_closed else 0.0

	invoiced = sum(flt(jc.net_amount or jc.total_amount) for jc in jcs if jc.status in CLOSED_STATUSES)
	# Prefer submitted SI totals when available
	revenue_currency = None
	if frappe.db.exists("DocType", "Sales Invoice") and frappe.get_meta("Sales Invoice").has_field(
		"custom_dms_job_card"
	):
		si_filters = {
			"posting_date": ["between", [f["from_date"], f["to_date"]]],
			"docstatus": 1,
		}
		if f.get("company"):
			si_filters["company"] = f["company"]
		sis = frappe.get_all(
			"Sales Invoice",
			filters=si_filters,
			fields=["grand_total", "custom_dms_job_card", "currency"],
			limit=5000,
		)
		linked = [s for s in sis if s.custom_dms_job_card]
		if linked:
			invoiced = sum(flt(s.grand_total) for s in linked)
			currencies = {s.currency for s in linked if s.currency}
			if len(currencies) == 1:
				revenue_currency = next(iter(currencies))

	if not revenue_currency:
		jc_currencies = {jc.currency for jc in jcs if jc.currency}
		if len(jc_currencies) == 1:
			revenue_currency = next(iter(jc_currencies))
		elif f.get("company"):
			revenue_currency = frappe.db.get_value("Company", f["company"], "default_currency")
		else:
			companies = {jc.company for jc in jcs if jc.company}
			if len(companies) == 1:
				revenue_currency = frappe.db.get_value(
					"Company", next(iter(companies)), "default_currency"
				)

	waiting_parts = sum(1 for jc in jcs if jc.status == "Waiting Parts")
	# Live WIP delayed / waiting parts (current workshop, not only period)
	wip_waiting = 0
	for st, cnt in (wip["summary"].get("by_status") or {}).items():
		if st == "Waiting Parts":
			wip_waiting = cint(cnt)
	delayed = cint(wip["summary"].get("overdue_promised", 0))
	in_workshop = cint(wip["summary"].get("total_open", 0))

	est_rate, est_accepted, est_decided = _estimate_conversion(f)
	csat = _csat_score(f)
	ftf_denom = len(closed) or 1
	repeat_closed = sum(1 for jc in closed if cint(jc.is_repeat_repair))
	ftf_rate = round(max(0.0, (1 - (repeat_closed / ftf_denom)) * 100), 1) if closed else 0.0

	by_status = {}
	by_day = defaultdict(float)
	by_month = defaultdict(lambda: {"net": 0.0, "count": 0})
	for jc in jcs:
		by_status[jc.status] = by_status.get(jc.status, 0) + 1
		d = str(getdate(jc.posting_date)) if jc.posting_date else None
		m = d[:7] if d else None
		net = flt(jc.net_amount or jc.total_amount)
		if d:
			by_day[d] += net
		if m:
			by_month[m]["net"] += net
			by_month[m]["count"] += 1

	rows = [
		{"metric": _("Total vehicles received"), "value": vehicles_received},
		{"metric": _("Job cards opened"), "value": opened},
		{"metric": _("Job cards closed"), "value": len(closed)},
		{"metric": _("Job cards cancelled"), "value": cancelled},
		{"metric": _("Job cards reopened / rework"), "value": reopened},
		{"metric": _("Total invoiced revenue"), "value": round(invoiced, 2)},
		{"metric": _("Labor revenue"), "value": rev_buckets["labor_revenue"]},
		{"metric": _("Parts revenue"), "value": rev_buckets["parts_revenue"]},
		{"metric": _("Consumables revenue"), "value": rev_buckets["consumables_revenue"]},
		{"metric": _("Sublet revenue"), "value": rev_buckets["sublet_revenue"]},
		{"metric": _("Warranty revenue"), "value": rev_buckets["warranty_revenue"]},
		{"metric": _("Internal work value"), "value": rev_buckets["internal_work_value"]},
		{"metric": _("Average repair order value"), "value": avg_ro},
		{"metric": _("Vehicles in workshop"), "value": in_workshop},
		{"metric": _("Delayed vehicles"), "value": delayed},
		{"metric": _("Jobs waiting for parts"), "value": wip_waiting or waiting_parts},
		{"metric": _("Customer satisfaction score"), "value": csat},
		{"metric": _("Estimate conversion rate %"), "value": est_rate},
		{"metric": _("First-time-fix rate %"), "value": ftf_rate},
	]

	return _result(
		"aftersales_dashboard",
		_("Aftersales Performance Dashboard"),
		f,
		{
			"vehicles_received": vehicles_received,
			"jobs_opened": opened,
			"jobs_closed": len(closed),
			"jobs_cancelled": cancelled,
			"jobs_reopened": reopened,
			"invoiced_revenue": round(invoiced, 2),
			"labor_revenue": rev_buckets["labor_revenue"],
			"parts_revenue": rev_buckets["parts_revenue"],
			"consumables_revenue": rev_buckets["consumables_revenue"],
			"sublet_revenue": rev_buckets["sublet_revenue"],
			"warranty_revenue": rev_buckets["warranty_revenue"],
			"internal_work_value": rev_buckets["internal_work_value"],
			"avg_repair_order": avg_ro,
			"open_job_cards": in_workshop,
			"overdue_promised": delayed,
			"waiting_parts": wip_waiting or waiting_parts,
			"csat_score": csat,
			"estimate_conversion_pct": est_rate,
			"estimates_accepted": est_accepted,
			"estimates_decided": est_decided,
			"first_time_fix_pct": ftf_rate,
			"net_revenue": round(sum(flt(jc.net_amount or jc.total_amount) for jc in jcs), 2),
			"revenue_currency": revenue_currency,
			"by_status": by_status,
			"by_pay_mix": rev_buckets["by_pay_mix"],
			"by_month": {k: dict(v) for k, v in sorted(by_month.items())},
			"by_day": dict(sorted(by_day.items())),
			"labour_revenue": rev_buckets["labor_revenue"],
		},
		[
			{"key": "metric", "label": _("KPI")},
			{"key": "value", "label": _("Value")},
		],
		rows,
	)


def get_aftersales_profitability_report(filters=None):
	"""§1.2 Aftersales Profitability — sales, cost, gross profit."""
	f = _parse_filters(filters)
	jcs = _fetch_job_cards(f)
	_apply_link_display_names(
		jcs,
		{"service_advisor": "Service Advisor", "lead_technician": "Technician"},
	)
	_apply_vin_numbers(jcs)
	parts_cost_map = _parts_cost_by_job([jc.name for jc in jcs])

	rows = []
	totals = {
		"labor_sales": 0.0,
		"labor_cost": 0.0,
		"parts_sales": 0.0,
		"parts_cost": 0.0,
		"consumables_sales": 0.0,
		"consumables_cost": 0.0,
		"sublet_sales": 0.0,
		"sublet_cost": 0.0,
	}
	by_branch = defaultdict(lambda: {"sales": 0.0, "cost": 0.0, "count": 0})
	by_model = defaultdict(lambda: {"sales": 0.0, "cost": 0.0, "count": 0})
	by_customer = defaultdict(lambda: {"sales": 0.0, "cost": 0.0, "count": 0})

	for jc in jcs:
		labor_sales = flt(jc.total_labor_cost)
		parts_sales = flt(jc.total_parts_cost)
		# Labour direct cost not tracked separately yet — cost = 0 until cost rates exist
		labor_cost = 0.0
		parts_cost = flt(parts_cost_map.get(jc.name, 0))
		net_sales = flt(jc.net_amount or jc.total_amount)
		direct_cost = labor_cost + parts_cost
		gp = round(net_sales - direct_cost, 2)
		gp_pct = round((gp / net_sales) * 100, 1) if net_sales else 0.0

		totals["labor_sales"] += labor_sales
		totals["labor_cost"] += labor_cost
		totals["parts_sales"] += parts_sales
		totals["parts_cost"] += parts_cost

		branch = jc.branch or _("—")
		by_branch[branch]["sales"] += net_sales
		by_branch[branch]["cost"] += direct_cost
		by_branch[branch]["count"] += 1
		model = jc.vehicle_model or _("Unknown")
		by_model[model]["sales"] += net_sales
		by_model[model]["cost"] += direct_cost
		by_model[model]["count"] += 1
		cust = jc.customer_name or jc.customer or _("Unknown")
		by_customer[cust]["sales"] += net_sales
		by_customer[cust]["cost"] += direct_cost
		by_customer[cust]["count"] += 1

		rows.append(
			{
				"name": jc.name,
				"posting_date": jc.posting_date,
				"customer_name": cust,
				"vehicle_model": model,
				"branch": branch,
				"job_card_type": jc.job_card_type,
				"labor_sales": round(labor_sales, 2),
				"labor_cost": round(labor_cost, 2),
				"parts_sales": round(parts_sales, 2),
				"parts_cost": round(parts_cost, 2),
				"consumables_sales": 0,
				"consumables_cost": 0,
				"sublet_sales": 0,
				"sublet_cost": 0,
				"net_sales": round(net_sales, 2),
				"direct_cost": round(direct_cost, 2),
				"gross_profit": gp,
				"gross_profit_pct": gp_pct,
			}
		)

	net_sales_total = sum(r["net_sales"] for r in rows)
	direct_cost_total = sum(r["direct_cost"] for r in rows)
	gp_total = round(net_sales_total - direct_cost_total, 2)
	gp_pct_total = round((gp_total / net_sales_total) * 100, 1) if net_sales_total else 0.0

	def _gp_map(src):
		out = {}
		for k, v in src.items():
			sales = flt(v["sales"])
			cost = flt(v["cost"])
			gp = sales - cost
			out[k] = {
				"sales": round(sales, 2),
				"cost": round(cost, 2),
				"gross_profit": round(gp, 2),
				"gross_profit_pct": round((gp / sales) * 100, 1) if sales else 0.0,
				"count": v["count"],
				"net": round(gp, 2),
			}
		return out

	return _result(
		"aftersales_profitability",
		_("Aftersales Profitability Report"),
		f,
		{
			**{k: round(v, 2) for k, v in totals.items()},
			"net_sales": round(net_sales_total, 2),
			"direct_cost": round(direct_cost_total, 2),
			"gross_profit": gp_total,
			"gross_profit_pct": gp_pct_total,
			"job_card_count": len(rows),
			"by_branch": _gp_map(by_branch),
			"by_model": _gp_map(by_model),
			"by_customer": _gp_map(by_customer),
		},
		[
			{"key": "name", "label": _("Job Card")},
			{"key": "posting_date", "label": _("Date")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vehicle_model", "label": _("Model")},
			{"key": "branch", "label": _("Branch")},
			{"key": "labor_sales", "label": _("Labor Sales")},
			{"key": "labor_cost", "label": _("Labor Cost")},
			{"key": "parts_sales", "label": _("Parts Sales")},
			{"key": "parts_cost", "label": _("Parts Cost")},
			{"key": "net_sales", "label": _("Net Sales")},
			{"key": "direct_cost", "label": _("Direct Cost")},
			{"key": "gross_profit", "label": _("Gross Profit")},
			{"key": "gross_profit_pct", "label": _("GP %")},
		],
		rows,
	)


def _bucket_revenue(jcs, grain="month"):
	"""grain: day | month"""
	buckets = defaultdict(lambda: {"net": 0.0, "labour": 0.0, "parts": 0.0, "count": 0})
	for jc in jcs:
		if not jc.posting_date:
			continue
		d = getdate(jc.posting_date)
		key = str(d) if grain == "day" else f"{d.year:04d}-{d.month:02d}"
		net = flt(jc.net_amount or jc.total_amount)
		buckets[key]["net"] += net
		buckets[key]["labour"] += flt(jc.total_labor_cost)
		buckets[key]["parts"] += flt(jc.total_parts_cost)
		buckets[key]["count"] += 1
	return {k: {**v, "net": round(v["net"], 2)} for k, v in sorted(buckets.items())}


def get_revenue_trend_report(filters=None):
	"""§1.3 Revenue Trend — daily/monthly, YoY, growth, mix."""
	f = _parse_filters(filters)
	jcs = _fetch_job_cards(f)
	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})
	_apply_vin_numbers(jcs)

	# Prior-year same window for YoY
	py_from = add_years(f["from_date"], -1)
	py_to = add_years(f["to_date"], -1)
	py_filters = {**f, "from_date": py_from, "to_date": py_to}
	py_jcs = _fetch_job_cards(py_filters)

	current_net = sum(flt(jc.net_amount or jc.total_amount) for jc in jcs)
	prior_net = sum(flt(jc.net_amount or jc.total_amount) for jc in py_jcs)
	growth_pct = round(((current_net - prior_net) / prior_net) * 100, 1) if prior_net else 0.0

	by_day = _bucket_revenue(jcs, "day")
	by_month = _bucket_revenue(jcs, "month")
	by_month_prior = _bucket_revenue(py_jcs, "month")

	by_job_type = defaultdict(lambda: {"net": 0.0, "count": 0})
	by_model = defaultdict(lambda: {"net": 0.0, "count": 0})
	by_advisor = defaultdict(lambda: {"net": 0.0, "count": 0})
	by_branch = defaultdict(lambda: {"net": 0.0, "count": 0})

	for jc in jcs:
		net = flt(jc.net_amount or jc.total_amount)
		jt = jc.job_card_type or _("Unknown")
		by_job_type[jt]["net"] += net
		by_job_type[jt]["count"] += 1
		mdl = jc.vehicle_model or _("Unknown")
		by_model[mdl]["net"] += net
		by_model[mdl]["count"] += 1
		adv = jc.service_advisor or _("Unassigned")
		by_advisor[adv]["net"] += net
		by_advisor[adv]["count"] += 1
		br = jc.branch or _("—")
		by_branch[br]["net"] += net
		by_branch[br]["count"] += 1

	def _round_map(src):
		return {
			k: {"net": round(v["net"], 2), "count": v["count"]}
			for k, v in sorted(src.items(), key=lambda x: -x[1]["net"])
		}

	# Budget vs actual placeholder on trend (targets = prior year month when present)
	budget_vs_actual = {}
	for month, cur in by_month.items():
		# prior year month key
		try:
			y, m = month.split("-")
			py_key = f"{int(y) - 1}-{m}"
		except Exception:
			py_key = None
		target = flt((by_month_prior.get(py_key) or {}).get("net"))
		actual = flt(cur.get("net"))
		budget_vs_actual[month] = {
			"actual": actual,
			"budget": target,
			"variance": round(actual - target, 2),
			"achievement_pct": round((actual / target) * 100, 1) if target else 0.0,
			"net": actual,
		}

	rows = []
	for day, vals in by_day.items():
		rows.append(
			{
				"period": day,
				"grain": "day",
				"revenue": vals["net"],
				"labour": round(vals["labour"], 2),
				"parts": round(vals["parts"], 2),
				"job_cards": vals["count"],
			}
		)

	return _result(
		"revenue_trend",
		_("Revenue Trend Report"),
		f,
		{
			"current_revenue": round(current_net, 2),
			"prior_year_revenue": round(prior_net, 2),
			"yoy_growth_pct": growth_pct,
			"job_card_count": len(jcs),
			"by_day": by_day,
			"by_month": by_month,
			"by_month_prior_year": by_month_prior,
			"budget_versus_actual": budget_vs_actual,
			"by_job_type": _round_map(by_job_type),
			"by_model": _round_map(by_model),
			"by_advisor": _round_map(by_advisor),
			"by_branch": _round_map(by_branch),
			"target_source": "prior_year",
		},
		[
			{"key": "period", "label": _("Period")},
			{"key": "grain", "label": _("Grain")},
			{"key": "revenue", "label": _("Revenue")},
			{"key": "labour", "label": _("Labour")},
			{"key": "parts", "label": _("Parts")},
			{"key": "job_cards", "label": _("Jobs")},
		],
		rows,
	)


def _read_optional_targets(filters):
	"""Optional explicit targets from filters; else None (use prior-year fallback)."""
	keys = (
		"target_labor_revenue",
		"target_parts_revenue",
		"target_job_cards",
		"target_vehicle_intake",
		"target_csat",
		"target_technician_productivity",
		"target_parts_gross_margin_pct",
	)
	out = {}
	src = filters or {}
	for k in keys:
		if src.get(k) not in (None, ""):
			out[k] = flt(src.get(k))
	return out


def get_budget_versus_actual_report(filters=None):
	"""§1.4 Budget Versus Actual.

	Until a budget master exists, targets default to the prior-year same period
	(unless explicit target_* filters are passed).
	"""
	raw = filters if isinstance(filters, dict) else {}
	if isinstance(filters, str):
		import json

		raw = json.loads(filters) if filters else {}

	f = _parse_filters(raw)
	explicit = _read_optional_targets(raw)

	jcs = _fetch_job_cards(f)
	py_f = {**f, "from_date": add_years(f["from_date"], -1), "to_date": add_years(f["to_date"], -1)}
	py_jcs = _fetch_job_cards(py_f)

	rev = _period_revenue_buckets(jcs)
	py_rev = _period_revenue_buckets(py_jcs)

	closed = [jc for jc in jcs if jc.status in CLOSED_STATUSES]
	py_closed = [jc for jc in py_jcs if jc.status in CLOSED_STATUSES]
	vehicles = len({jc.vehicle_vin for jc in jcs if jc.vehicle_vin})
	py_vehicles = len({jc.vehicle_vin for jc in py_jcs if jc.vehicle_vin})

	csat = _csat_score(f)
	py_csat = _csat_score(py_f)
	tech_prod = _tech_productivity_pct(f)
	py_tech_prod = _tech_productivity_pct(py_f)

	parts_sales = rev["parts_revenue"]
	parts_cost_map = _parts_cost_by_job([jc.name for jc in jcs])
	parts_cost = sum(parts_cost_map.values())
	parts_gm_pct = (
		round(((parts_sales - parts_cost) / parts_sales) * 100, 1) if parts_sales else 0.0
	)
	py_parts_sales = py_rev["parts_revenue"]
	py_parts_cost = sum(_parts_cost_by_job([jc.name for jc in py_jcs]).values())
	py_parts_gm = (
		round(((py_parts_sales - py_parts_cost) / py_parts_sales) * 100, 1)
		if py_parts_sales
		else 0.0
	)

	def metric(name, actual, target, unit=""):
		actual = flt(actual)
		target = flt(target)
		variance = round(actual - target, 2)
		achievement = round((actual / target) * 100, 1) if target else 0.0
		return {
			"metric": name,
			"target": round(target, 2),
			"actual": round(actual, 2),
			"variance": variance,
			"variance_pct": round((variance / target) * 100, 1) if target else 0.0,
			"achievement_pct": achievement,
			"unit": unit,
		}

	target_source = "explicit" if explicit else "prior_year"
	rows = [
		metric(
			_("Labor revenue"),
			rev["labor_revenue"],
			explicit.get("target_labor_revenue", py_rev["labor_revenue"]),
			"amount",
		),
		metric(
			_("Parts revenue"),
			rev["parts_revenue"],
			explicit.get("target_parts_revenue", py_rev["parts_revenue"]),
			"amount",
		),
		metric(
			_("Job card volume (closed)"),
			len(closed),
			explicit.get("target_job_cards", len(py_closed)),
			"count",
		),
		metric(
			_("Vehicle intake"),
			vehicles,
			explicit.get("target_vehicle_intake", py_vehicles),
			"count",
		),
		metric(
			_("Customer satisfaction"),
			csat,
			explicit.get("target_csat", py_csat),
			"score",
		),
		metric(
			_("Technician productivity"),
			tech_prod,
			explicit.get("target_technician_productivity", py_tech_prod),
			"%",
		),
		metric(
			_("Parts gross margin %"),
			parts_gm_pct,
			explicit.get("target_parts_gross_margin_pct", py_parts_gm),
			"%",
		),
	]

	return _result(
		"budget_versus_actual",
		_("Budget Versus Actual Report"),
		f,
		{
			"target_source": target_source,
			"labor_revenue_actual": rev["labor_revenue"],
			"labor_revenue_target": rows[0]["target"],
			"parts_revenue_actual": rev["parts_revenue"],
			"parts_revenue_target": rows[1]["target"],
			"job_cards_actual": len(closed),
			"job_cards_target": rows[2]["target"],
			"vehicle_intake_actual": vehicles,
			"vehicle_intake_target": rows[3]["target"],
			"csat_actual": csat,
			"csat_target": rows[4]["target"],
			"tech_productivity_actual": tech_prod,
			"tech_productivity_target": rows[5]["target"],
			"parts_gm_pct_actual": parts_gm_pct,
			"parts_gm_pct_target": rows[6]["target"],
			"by_metric_achievement": {r["metric"]: r["achievement_pct"] for r in rows},
		},
		[
			{"key": "metric", "label": _("Metric")},
			{"key": "target", "label": _("Target")},
			{"key": "actual", "label": _("Actual")},
			{"key": "variance", "label": _("Variance")},
			{"key": "variance_pct", "label": _("Variance %")},
			{"key": "achievement_pct", "label": _("Achievement %")},
		],
		rows,
	)


def get_executive_dashboard(filters=None):
	"""Section home for Executive folder — mirrors §1.1 summary + chart series."""
	dash = get_aftersales_dashboard_report(filters)
	trend = get_revenue_trend_report(filters)
	profit = get_aftersales_profitability_report(filters)
	budget = get_budget_versus_actual_report(filters)
	summary = dict(dash.get("summary") or {})
	summary["yoy_growth_pct"] = trend["summary"].get("yoy_growth_pct")
	summary["prior_year_revenue"] = trend["summary"].get("prior_year_revenue")
	summary["gross_profit"] = profit["summary"].get("gross_profit")
	summary["gross_profit_pct"] = profit["summary"].get("gross_profit_pct")
	summary["budget_achievement_avg"] = (
		round(
			sum(r["achievement_pct"] for r in budget["rows"]) / len(budget["rows"]),
			1,
		)
		if budget.get("rows")
		else 0
	)
	summary["by_job_type"] = trend["summary"].get("by_job_type")
	summary["by_branch"] = trend["summary"].get("by_branch")
	summary["by_branch_gp"] = profit["summary"].get("by_branch")
	return {
		"section_id": "executive",
		"title": _("Aftersales Performance Dashboard"),
		"filters": dash.get("filters") or {},
		"summary": summary,
	}


REPORT_HANDLERS = {
	"aftersales_dashboard": get_aftersales_dashboard_report,
	"aftersales_profitability": get_aftersales_profitability_report,
	"revenue_trend": get_revenue_trend_report,
	"budget_versus_actual": get_budget_versus_actual_report,
	"service_revenue": get_service_revenue_report,
}
