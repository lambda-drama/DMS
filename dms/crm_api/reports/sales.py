# Copyright (c) 2026, Mania and contributors
"""§17.2 Sales CRM report handlers — leads, pipeline, bookings and delivery."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, date_diff, flt, getdate, nowdate, time_diff_in_hours

from dms.crm_api.reports.common import (
	ACCOUNT,
	ALLOCATION,
	APPROVAL,
	BOOKING,
	DELIVERY,
	LEAD,
	OPP,
	REFERRAL,
	TENDER,
	TEST_DRIVE,
	age_bucket,
	col,
	creation_between,
	dim_filters,
	dt_exists,
	empty_result,
	group_count,
	parse_crm_filters,
	result,
)

OPEN_OPP_STATUSES = ("Open", "On Hold")
CLOSED_LEAD_STATUSES = ("Converted", "Disqualified", "Duplicate", "Invalid")
FUNNEL_STAGES = (
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
	"Won",
)


def _meta_fields(doctype: str, required: list[str], optional: list[str]) -> list[str]:
	meta = frappe.get_meta(doctype)
	fields = list(required)
	for name in optional:
		if meta.has_field(name) and name not in fields:
			fields.append(name)
	return fields


def _lead_response_field(meta) -> str | None:
	for candidate in ("first_responded_on", "first_response_on", "response_on"):
		if meta.has_field(candidate):
			return candidate
	return None


def _quotation_opp_field() -> str | None:
	"""Custom field on Quotation that links back to DMS CRM Opportunity."""
	if not dt_exists("Quotation"):
		return None
	meta = frappe.get_meta("Quotation")
	for candidate in (
		"custom_dms_crm_opportunity",
		"dms_opportunity",
		"custom_opportunity",
		"dms_crm_opportunity",
	):
		if meta.has_field(candidate):
			return candidate
	return None


def get_crm_sales_dashboard(filters=None):
	f = parse_crm_filters(filters)
	summary = {
		"open_opportunities": 0,
		"pipeline_value": 0,
		"weighted_forecast": 0,
		"won_in_period": 0,
		"lost_in_period": 0,
		"test_drives": 0,
		"bookings": 0,
		"by_stage": [],
	}

	if dt_exists(OPP):
		opp_filters = {
			"status": ["in", list(OPEN_OPP_STATUSES)],
			**dim_filters(f, owner_field="opportunity_owner", include_source=False),
		}
		opps = frappe.get_all(
			OPP,
			filters=opp_filters,
			fields=["name", "stage", "expected_value", "probability", "status"],
			limit=5000,
		)
		open_opps = [o for o in opps if (o.get("status") or "") not in ("Won", "Lost", "Cancelled")]
		summary["open_opportunities"] = len(open_opps)
		summary["pipeline_value"] = round(sum(flt(o.get("expected_value")) for o in open_opps), 2)
		summary["weighted_forecast"] = round(
			sum(flt(o.get("expected_value")) * flt(o.get("probability") or 0) / 100.0 for o in open_opps),
			2,
		)
		summary["by_stage"] = group_count(open_opps, "stage")
		summary["won_in_period"] = frappe.db.count(
			OPP,
			{
				"status": "Won",
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
		)
		summary["lost_in_period"] = frappe.db.count(
			OPP,
			{
				"status": "Lost",
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
		)

	if dt_exists(TEST_DRIVE):
		td_filters = {"creation": creation_between(f)}
		meta = frappe.get_meta(TEST_DRIVE)
		if meta.has_field("branch") and f.get("branch"):
			td_filters["branch"] = f["branch"]
		if meta.has_field("company") and f.get("company"):
			td_filters["company"] = f["company"]
		summary["test_drives"] = frappe.db.count(TEST_DRIVE, td_filters)

	if dt_exists(BOOKING):
		bk_filters = {"creation": creation_between(f)}
		meta = frappe.get_meta(BOOKING)
		if meta.has_field("branch") and f.get("branch"):
			bk_filters["branch"] = f["branch"]
		if meta.has_field("company") and f.get("company"):
			bk_filters["company"] = f["company"]
		summary["bookings"] = frappe.db.count(BOOKING, bk_filters)

	return {
		"section_id": "crm_sales",
		"title": _("Sales CRM"),
		"filters": {
			"from_date": str(f["from_date"]),
			"to_date": str(f["to_date"]),
		},
		"summary": summary,
	}


def _lead_source(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Leads created in period. Conversion % in summary = Converted ÷ total. "
		"by_source aggregates count and converted share per source."
	)
	columns = [
		col("name", "Lead"),
		col("lead_name", "Name"),
		col("status", "Status"),
		col("source", "Source"),
		col("owner", "Owner"),
		col("branch", "Branch"),
		col("model", "Model"),
		col("created", "Created"),
	]
	if not dt_exists(LEAD):
		return empty_result("crm_lead_source", _("Lead Source Performance"), f, columns, help_text=help_text)

	fields = _meta_fields(
		LEAD,
		["name", "status", "source", "creation"],
		["lead_name", "lead_owner", "branch", "company", "model", "opportunity"],
	)
	leads = frappe.get_all(
		LEAD,
		filters={"creation": creation_between(f), **dim_filters(f)},
		fields=fields,
		order_by="creation desc",
		limit=2000,
	)

	by_source: dict[str, dict] = {}
	rows = []
	converted_total = 0
	for r in leads:
		src = r.get("source") or "—"
		bucket = by_source.setdefault(src, {"label": src, "value": 0, "converted": 0})
		bucket["value"] += 1
		status = r.get("status") or ""
		if status == "Converted":
			bucket["converted"] += 1
			converted_total += 1
		rows.append(
			{
				"name": r.name,
				"lead_name": r.get("lead_name"),
				"status": status,
				"source": src,
				"owner": r.get("lead_owner"),
				"branch": r.get("branch"),
				"model": r.get("model"),
				"created": str(r.creation)[:16] if r.creation else "",
				"_drill": {"view": "crm-lead-detail", "params": {"name": r.name}},
			}
		)

	source_summary = []
	for src, b in sorted(by_source.items(), key=lambda x: -x[1]["value"]):
		source_summary.append(
			{
				"label": b["label"],
				"value": b["value"],
				"converted": b["converted"],
				"conversion_pct": round(100.0 * b["converted"] / b["value"], 1) if b["value"] else 0,
			}
		)

	return result(
		"crm_lead_source",
		_("Lead Source Performance"),
		f,
		{
			"total": len(rows),
			"converted": converted_total,
			"conversion_pct": round(100.0 * converted_total / len(rows), 1) if rows else 0,
			"by_source": source_summary,
		},
		columns,
		rows,
		help_text=help_text,
		definitions={"conversion_pct": "Converted ÷ Leads × 100"},
	)


def _lead_response(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"First response hours = first_responded_on − creation (or first_response_on / response_on). "
		"SLA met when sla_status is First Response Completed / Met / Within SLA / On Track."
	)
	columns = [
		col("name", "Lead"),
		col("lead_name", "Name"),
		col("status", "Status"),
		col("sla_status", "SLA"),
		col("response_hours", "Response (h)"),
		col("response_by", "Response By"),
		col("owner", "Owner"),
		col("source", "Source"),
		col("branch", "Branch"),
		col("created", "Created"),
	]
	if not dt_exists(LEAD):
		return empty_result("crm_lead_response", _("Lead Response Time"), f, columns, help_text=help_text)

	meta = frappe.get_meta(LEAD)
	resp_field = _lead_response_field(meta)
	optional = ["lead_name", "lead_owner", "branch", "source", "sla_status", "response_by", "model"]
	if resp_field:
		optional.append(resp_field)
	fields = _meta_fields(LEAD, ["name", "status", "creation"], optional)

	leads = frappe.get_all(
		LEAD,
		filters={"creation": creation_between(f), **dim_filters(f)},
		fields=fields,
		order_by="creation desc",
		limit=2000,
	)

	rows = []
	hours_list = []
	sla_met = 0
	sla_tracked = 0
	for r in leads:
		resp_on = r.get(resp_field) if resp_field else None
		hours = None
		if resp_on and r.creation:
			hours = round(flt(time_diff_in_hours(resp_on, r.creation)), 2)
			hours_list.append(hours)
		sla = r.get("sla_status") or ""
		if sla:
			sla_tracked += 1
			if sla in ("First Response Completed", "Met", "Within SLA", "On Track"):
				sla_met += 1
		rows.append(
			{
				"name": r.name,
				"lead_name": r.get("lead_name"),
				"status": r.status,
				"sla_status": sla,
				"response_hours": hours,
				"response_by": str(r.get("response_by") or "")[:16] if r.get("response_by") else "",
				"owner": r.get("lead_owner"),
				"source": r.get("source"),
				"branch": r.get("branch"),
				"created": str(r.creation)[:16] if r.creation else "",
				"_drill": {"view": "crm-lead-detail", "params": {"name": r.name}},
			}
		)

	avg_hours = round(sum(hours_list) / len(hours_list), 2) if hours_list else 0
	return result(
		"crm_lead_response",
		_("Lead Response Time"),
		f,
		{
			"total": len(rows),
			"responded": len(hours_list),
			"avg_response_hours": avg_hours,
			"sla_met_pct": round(100.0 * sla_met / sla_tracked, 1) if sla_tracked else 0,
		},
		columns,
		rows,
		help_text=help_text,
	)


def _lead_aging(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Open leads (not Converted/Disqualified/Duplicate/Invalid) aged from creation to today. "
		"Buckets: 0–1d, 2–3d, 4–7d, 8–14d, 15–30d, 30d+."
	)
	columns = [
		col("name", "Lead"),
		col("lead_name", "Name"),
		col("status", "Status"),
		col("age_days", "Age (days)"),
		col("age_bucket", "Bucket"),
		col("owner", "Owner"),
		col("source", "Source"),
		col("branch", "Branch"),
		col("model", "Model"),
		col("created", "Created"),
	]
	if not dt_exists(LEAD):
		return empty_result("crm_lead_aging", _("Lead Aging & Stale"), f, columns, help_text=help_text)

	fields = _meta_fields(
		LEAD,
		["name", "status", "creation"],
		["lead_name", "lead_owner", "branch", "source", "model", "next_action_due"],
	)
	filt = {
		"status": ["not in", list(CLOSED_LEAD_STATUSES)],
		**dim_filters(f),
	}
	leads = frappe.get_all(LEAD, filters=filt, fields=fields, order_by="creation asc", limit=2000)

	today = getdate(nowdate())
	rows = []
	for r in leads:
		created = getdate(r.creation) if r.creation else today
		days = date_diff(today, created)
		rows.append(
			{
				"name": r.name,
				"lead_name": r.get("lead_name"),
				"status": r.status,
				"age_days": days,
				"age_bucket": age_bucket(days),
				"owner": r.get("lead_owner"),
				"source": r.get("source"),
				"branch": r.get("branch"),
				"model": r.get("model"),
				"created": str(r.creation)[:16] if r.creation else "",
				"_drill": {"view": "crm-lead-detail", "params": {"name": r.name}},
			}
		)

	stale = sum(1 for r in rows if r["age_days"] > 14)
	return result(
		"crm_lead_aging",
		_("Lead Aging & Stale"),
		f,
		{
			"total": len(rows),
			"stale_over_14d": stale,
			"by_bucket": group_count(rows, "age_bucket"),
			"by_status": group_count(rows, "status"),
		},
		columns,
		rows,
		help_text=help_text,
	)


def _sales_funnel(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Funnel counts opportunities by stage (open book + Won in period). "
		"Stage conversion % = count at/after stage ÷ count at previous stage."
	)
	columns = [
		col("stage", "Stage"),
		col("count", "Count"),
		col("value", "Value"),
		col("conversion_pct", "Vs Prior %"),
	]
	if not dt_exists(OPP):
		return empty_result("crm_sales_funnel", _("Sales Funnel Conversion"), f, columns, help_text=help_text)

	fields = _meta_fields(
		OPP,
		["name", "stage", "status", "expected_value", "creation"],
		["title", "opportunity_owner", "branch", "model", "probability"],
	)
	# Current pipeline + won/lost in period for funnel shape
	opps = frappe.get_all(
		OPP,
		filters={
			"status": ["not in", ["Cancelled"]],
			**dim_filters(f, owner_field="opportunity_owner", include_source=True),
		},
		fields=fields,
		limit=2000,
	)

	stage_counts: dict[str, dict] = {s: {"stage": s, "count": 0, "value": 0.0} for s in FUNNEL_STAGES}
	detail = []
	for o in opps:
		stage = o.get("stage") or "New"
		if stage not in stage_counts:
			stage_counts[stage] = {"stage": stage, "count": 0, "value": 0.0}
		stage_counts[stage]["count"] += 1
		stage_counts[stage]["value"] += flt(o.get("expected_value"))
		detail.append(
			{
				"name": o.name,
				"title": o.get("title") or o.name,
				"stage": stage,
				"status": o.status,
				"value": flt(o.get("expected_value")),
				"owner": o.get("opportunity_owner"),
				"branch": o.get("branch"),
				"_drill": {"view": "crm-opportunity-detail", "params": {"name": o.name}},
			}
		)

	ordered = [stage_counts[s] for s in FUNNEL_STAGES if stage_counts[s]["count"] or s in FUNNEL_STAGES[:1]]
	# Include any extra stages not in canonical list
	for s, b in stage_counts.items():
		if s not in FUNNEL_STAGES and b["count"]:
			ordered.append(b)

	rows = []
	prev = None
	for b in ordered:
		b["value"] = round(b["value"], 2)
		if prev and prev["count"]:
			b["conversion_pct"] = round(100.0 * b["count"] / prev["count"], 1)
		else:
			b["conversion_pct"] = 100.0 if b["count"] else 0
		rows.append(b)
		prev = b

	return result(
		"crm_sales_funnel",
		_("Sales Funnel Conversion"),
		f,
		{"total": len(opps), "by_stage": [{"label": r["stage"], "value": r["count"]} for r in rows]},
		columns,
		rows,
		help_text=help_text,
	)


def _opportunity_pipeline(filters=None):
	f = parse_crm_filters(filters)
	help_text = _("Open opportunities; weighted = expected_value × probability%.")
	columns = [
		col("name", "Opportunity"),
		col("title", "Title"),
		col("stage", "Stage"),
		col("status", "Status"),
		col("expected_value", "Value"),
		col("probability", "Prob %"),
		col("weighted", "Weighted"),
		col("owner", "Owner"),
		col("customer", "Customer"),
		col("model", "Model"),
		col("branch", "Branch"),
	]
	if not dt_exists(OPP):
		return empty_result(
			"crm_opportunity_pipeline", _("Opportunity Pipeline & Forecast"), f, columns, help_text=help_text
		)

	fields = _meta_fields(
		OPP,
		["name", "status", "stage", "expected_value", "probability"],
		["title", "opportunity_owner", "customer", "model", "branch", "expected_close_date", "source"],
	)
	opps = frappe.get_all(
		OPP,
		filters={
			"status": ["in", list(OPEN_OPP_STATUSES)],
			**dim_filters(f, owner_field="opportunity_owner", include_source=True),
		},
		fields=fields,
		order_by="expected_value desc",
		limit=2000,
	)

	rows = []
	for o in opps:
		weighted = flt(o.expected_value) * flt(o.probability or 0) / 100.0
		rows.append(
			{
				"name": o.name,
				"title": o.get("title") or o.name,
				"stage": o.stage,
				"status": o.status,
				"expected_value": flt(o.expected_value),
				"probability": flt(o.probability),
				"weighted": round(weighted, 2),
				"owner": o.get("opportunity_owner"),
				"customer": o.get("customer"),
				"model": o.get("model"),
				"branch": o.get("branch"),
				"_drill": {"view": "crm-opportunity-detail", "params": {"name": o.name}},
			}
		)

	return result(
		"crm_opportunity_pipeline",
		_("Opportunity Pipeline & Forecast"),
		f,
		{
			"total": len(rows),
			"pipeline_value": round(sum(r["expected_value"] for r in rows), 2),
			"weighted_forecast": round(sum(r["weighted"] for r in rows), 2),
			"by_stage": group_count(rows, "stage"),
		},
		columns,
		rows,
		help_text=help_text,
	)


def _salesperson_performance(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Per owner: leads created in period, open opportunities, wins in period, "
		"avg cycle days (Won modified − creation)."
	)
	columns = [
		col("owner", "Owner"),
		col("leads", "Leads"),
		col("open_opps", "Open Opps"),
		col("won", "Won"),
		col("lost", "Lost"),
		col("won_value", "Won Value"),
		col("avg_cycle_days", "Avg Cycle (d)"),
		col("pipeline_value", "Open Pipeline"),
	]
	owners: dict[str, dict] = {}

	def _bucket(owner: str):
		key = owner or "—"
		return owners.setdefault(
			key,
			{
				"owner": key,
				"leads": 0,
				"open_opps": 0,
				"won": 0,
				"lost": 0,
				"won_value": 0.0,
				"pipeline_value": 0.0,
				"_cycles": [],
			},
		)

	if dt_exists(LEAD):
		for r in frappe.get_all(
			LEAD,
			filters={"creation": creation_between(f), **dim_filters(f)},
			fields=["lead_owner"],
			limit=5000,
		):
			_bucket(r.lead_owner)["leads"] += 1

	if dt_exists(OPP):
		open_opps = frappe.get_all(
			OPP,
			filters={
				"status": ["in", list(OPEN_OPP_STATUSES)],
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=["opportunity_owner", "expected_value"],
			limit=5000,
		)
		for o in open_opps:
			b = _bucket(o.opportunity_owner)
			b["open_opps"] += 1
			b["pipeline_value"] += flt(o.expected_value)

		closed = frappe.get_all(
			OPP,
			filters={
				"status": ["in", ["Won", "Lost"]],
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=["opportunity_owner", "status", "expected_value", "creation", "modified"],
			limit=2000,
		)
		for o in closed:
			b = _bucket(o.opportunity_owner)
			if o.status == "Won":
				b["won"] += 1
				b["won_value"] += flt(o.expected_value)
				if o.creation and o.modified:
					b["_cycles"].append(date_diff(getdate(o.modified), getdate(o.creation)))
			else:
				b["lost"] += 1

	rows = []
	for b in sorted(owners.values(), key=lambda x: (-x["won"], -x["leads"])):
		cycles = b.pop("_cycles")
		b["won_value"] = round(b["won_value"], 2)
		b["pipeline_value"] = round(b["pipeline_value"], 2)
		b["avg_cycle_days"] = round(sum(cycles) / len(cycles), 1) if cycles else 0
		rows.append(b)

	return result(
		"crm_salesperson_performance",
		_("Salesperson Performance"),
		f,
		{
			"owners": len(rows),
			"leads": sum(r["leads"] for r in rows),
			"won": sum(r["won"] for r in rows),
			"won_value": round(sum(r["won_value"] for r in rows), 2),
		},
		columns,
		rows[:2000],
		help_text=help_text,
	)


def _test_drive_conversion(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Test drives in period. Converted when linked opportunity is Won/Booked or booking exists / "
		"outcome is Interested or Quotation Requested."
	)
	columns = [
		col("name", "Test Drive"),
		col("status", "Status"),
		col("outcome", "Outcome"),
		col("customer", "Customer"),
		col("opportunity", "Opportunity"),
		col("opp_status", "Opp Status"),
		col("booking", "Booking"),
		col("converted", "Converted"),
		col("branch", "Branch"),
		col("scheduled", "Scheduled"),
	]
	if not dt_exists(TEST_DRIVE):
		return empty_result(
			"crm_test_drive_conversion", _("Test-Drive Conversion"), f, columns, help_text=help_text
		)

	meta = frappe.get_meta(TEST_DRIVE)
	fields = _meta_fields(
		TEST_DRIVE,
		["name", "status", "creation"],
		[
			"opportunity",
			"customer",
			"branch",
			"company",
			"outcome",
			"scheduled_datetime",
			"quotation",
			"assigned_to",
		],
	)
	# Test Drive has no lead field in schema — optional check
	if meta.has_field("lead"):
		fields.append("lead")

	filt = {"creation": creation_between(f)}
	if meta.has_field("branch") and f.get("branch"):
		filt["branch"] = f["branch"]
	if meta.has_field("company") and f.get("company"):
		filt["company"] = f["company"]

	drives = frappe.get_all(TEST_DRIVE, filters=filt, fields=fields, order_by="creation desc", limit=2000)

	opp_ids = list({d.opportunity for d in drives if d.get("opportunity")})
	opp_map = {}
	booking_by_opp = {}
	if opp_ids and dt_exists(OPP):
		for o in frappe.get_all(
			OPP,
			filters={"name": ["in", opp_ids]},
			fields=["name", "status", "stage", "booking"],
		):
			opp_map[o.name] = o
	if opp_ids and dt_exists(BOOKING):
		for b in frappe.get_all(
			BOOKING,
			filters={"opportunity": ["in", opp_ids], "status": ["!=", "Cancelled"]},
			fields=["name", "opportunity"],
			limit=2000,
		):
			booking_by_opp.setdefault(b.opportunity, b.name)

	rows = []
	converted = 0
	for d in drives:
		opp = opp_map.get(d.get("opportunity")) if d.get("opportunity") else None
		opp_status = opp.status if opp else ""
		booking = (opp.booking if opp and opp.get("booking") else None) or booking_by_opp.get(
			d.get("opportunity")
		)
		outcome = (d.get("outcome") or "").strip()
		is_converted = bool(
			booking
			or opp_status == "Won"
			or (opp and (opp.get("stage") or "") in ("Booking / Deposit", "Order Confirmed", "Won"))
			or outcome in ("Interested", "Quotation Requested", "Booked")
		)
		if is_converted:
			converted += 1
		row = {
			"name": d.name,
			"status": d.status,
			"outcome": outcome,
			"customer": d.get("customer"),
			"opportunity": d.get("opportunity"),
			"opp_status": opp_status,
			"booking": booking or "",
			"converted": _("Yes") if is_converted else _("No"),
			"branch": d.get("branch"),
			"scheduled": str(d.get("scheduled_datetime") or d.creation)[:16],
			"_drill": {"view": "crm-test-drive-detail", "params": {"name": d.name}},
		}
		if d.get("lead"):
			row["lead"] = d.lead
		rows.append(row)

	return result(
		"crm_test_drive_conversion",
		_("Test-Drive Conversion"),
		f,
		{
			"total": len(rows),
			"converted": converted,
			"conversion_pct": round(100.0 * converted / len(rows), 1) if rows else 0,
		},
		columns,
		rows,
		help_text=help_text,
	)


def _quotation_conversion(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Quotations linked to DMS CRM Opportunity via custom_dms_crm_opportunity (or similar). "
		"Converted when opportunity is Won / has booking, or Quotation status is Ordered."
	)
	columns = [
		col("name", "Quotation"),
		col("customer", "Customer"),
		col("status", "Quote Status"),
		col("grand_total", "Total"),
		col("opportunity", "Opportunity"),
		col("opp_status", "Opp Status"),
		col("booking", "Booking"),
		col("converted", "Converted"),
		col("transaction_date", "Date"),
	]

	opp_field = _quotation_opp_field()
	# Fallback: opportunities that already have a quotation link
	if not opp_field and not (dt_exists(OPP) and frappe.get_meta(OPP).has_field("quotation")):
		return empty_result(
			"crm_quotation_conversion",
			_("Quotation Conversion"),
			f,
			columns,
			help_text=_(
				"No Quotation↔Opportunity link found. Add custom field custom_dms_crm_opportunity on Quotation, "
				"or use Opportunity.quotation."
			),
		)

	rows = []
	if opp_field and dt_exists("Quotation"):
		q_meta = frappe.get_meta("Quotation")
		q_fields = ["name", "status", "transaction_date", "grand_total", opp_field]
		for optional in ("party_name", "customer_name"):
			if q_meta.has_field(optional):
				q_fields.append(optional)
		quotes = frappe.get_all(
			"Quotation",
			filters={
				"transaction_date": ["between", [str(f["from_date"]), str(f["to_date"])]],
				"docstatus": ["<", 2],
				opp_field: ["is", "set"],
			},
			fields=q_fields,
			order_by="transaction_date desc",
			limit=2000,
		)
		opp_ids = list({q.get(opp_field) for q in quotes if q.get(opp_field)})
		opp_map = {}
		if opp_ids and dt_exists(OPP):
			for o in frappe.get_all(
				OPP,
				filters={"name": ["in", opp_ids]},
				fields=["name", "status", "stage", "booking"],
			):
				opp_map[o.name] = o
		for q in quotes:
			opp_name = q.get(opp_field)
			opp = opp_map.get(opp_name) if opp_name else None
			converted = bool(
				(opp and (opp.status == "Won" or opp.get("booking")))
				or (q.status or "") == "Ordered"
			)
			row = {
				"name": q.name,
				"customer": q.get("customer_name") or q.get("party_name"),
				"status": q.status,
				"grand_total": flt(q.grand_total),
				"opportunity": opp_name,
				"opp_status": opp.status if opp else "",
				"booking": opp.booking if opp and opp.get("booking") else "",
				"converted": _("Yes") if converted else _("No"),
				"transaction_date": str(q.transaction_date) if q.transaction_date else "",
			}
			if opp_name:
				row["_drill"] = {"view": "crm-opportunity-detail", "params": {"name": opp_name}}
			rows.append(row)
	elif dt_exists(OPP):
		# Use Opportunity.quotation as the quote list
		fields = _meta_fields(
			OPP,
			["name", "status", "stage", "quotation"],
			["title", "customer", "booking", "expected_value", "quotation_customer_status", "branch"],
		)
		opps = frappe.get_all(
			OPP,
			filters={
				"quotation": ["is", "set"],
				"modified": creation_between(f),
				**dim_filters(f, owner_field="opportunity_owner", include_source=False),
			},
			fields=fields,
			limit=2000,
		)
		for o in opps:
			converted = o.status == "Won" or bool(o.get("booking"))
			rows.append(
				{
					"name": o.quotation,
					"customer": o.get("customer"),
					"status": o.get("quotation_customer_status") or "",
					"grand_total": flt(o.get("expected_value")),
					"opportunity": o.name,
					"opp_status": o.status,
					"booking": o.get("booking") or "",
					"converted": _("Yes") if converted else _("No"),
					"transaction_date": "",
					"_drill": {"view": "crm-opportunity-detail", "params": {"name": o.name}},
				}
			)

	converted_n = sum(1 for r in rows if r["converted"] == _("Yes"))
	return result(
		"crm_quotation_conversion",
		_("Quotation Conversion"),
		f,
		{
			"total": len(rows),
			"converted": converted_n,
			"conversion_pct": round(100.0 * converted_n / len(rows), 1) if rows else 0,
		},
		columns,
		rows,
		help_text=help_text,
	)


def _lost_opportunity(filters=None):
	f = parse_crm_filters(filters)
	help_text = _("Lost opportunities in period (status=Lost), analysed by lost_reason and stage.")
	columns = [
		col("name", "Opportunity"),
		col("title", "Title"),
		col("stage", "Stage"),
		col("lost_reason", "Lost Reason"),
		col("lost_value", "Lost Value"),
		col("owner", "Owner"),
		col("customer", "Customer"),
		col("model", "Model"),
		col("branch", "Branch"),
		col("competitor", "Competitor"),
	]
	if not dt_exists(OPP):
		return empty_result("crm_lost_opportunity", _("Lost Opportunity Analysis"), f, columns, help_text=help_text)

	fields = _meta_fields(
		OPP,
		["name", "status", "stage", "modified"],
		[
			"title",
			"lost_reason",
			"lost_value",
			"expected_value",
			"opportunity_owner",
			"customer",
			"model",
			"branch",
			"competitor",
			"source",
		],
	)
	opps = frappe.get_all(
		OPP,
		filters={
			"status": "Lost",
			"modified": creation_between(f),
			**dim_filters(f, owner_field="opportunity_owner", include_source=True),
		},
		fields=fields,
		order_by="modified desc",
		limit=2000,
	)

	rows = []
	for o in opps:
		value = flt(o.get("lost_value")) or flt(o.get("expected_value"))
		rows.append(
			{
				"name": o.name,
				"title": o.get("title") or o.name,
				"stage": o.stage,
				"lost_reason": o.get("lost_reason") or "—",
				"lost_value": value,
				"owner": o.get("opportunity_owner"),
				"customer": o.get("customer"),
				"model": o.get("model"),
				"branch": o.get("branch"),
				"competitor": o.get("competitor"),
				"_drill": {"view": "crm-opportunity-detail", "params": {"name": o.name}},
			}
		)

	return result(
		"crm_lost_opportunity",
		_("Lost Opportunity Analysis"),
		f,
		{
			"total": len(rows),
			"lost_value": round(sum(r["lost_value"] for r in rows), 2),
			"by_reason": group_count(rows, "lost_reason"),
			"by_stage": group_count(rows, "stage"),
		},
		columns,
		rows,
		help_text=help_text,
	)


def _discount_approval(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Approval requests in period (discount / exception). Turnaround hours = decided_on − requested_on."
	)
	columns = [
		col("name", "Request"),
		col("title", "Title"),
		col("approval_type", "Type"),
		col("status", "Status"),
		col("amount", "Amount"),
		col("requested_by", "Requested By"),
		col("approver", "Approver"),
		col("turnaround_hours", "Turnaround (h)"),
		col("opportunity", "Opportunity"),
		col("customer", "Customer"),
	]
	if not dt_exists(APPROVAL):
		return empty_result("crm_discount_approval", _("Discount & Approval"), f, columns, help_text=help_text)

	meta = frappe.get_meta(APPROVAL)
	fields = _meta_fields(
		APPROVAL,
		["name", "status", "creation"],
		[
			"title",
			"approval_type",
			"requested_by",
			"requested_on",
			"approver",
			"decided_on",
			"amount",
			"reason",
			"opportunity",
			"customer",
			"lead",
			"booking",
			"branch",
			"company",
		],
	)
	filt = {"creation": creation_between(f)}
	if meta.has_field("branch") and f.get("branch"):
		filt["branch"] = f["branch"]
	if meta.has_field("company") and f.get("company"):
		filt["company"] = f["company"]
	if f.get("owner") and meta.has_field("requested_by"):
		filt["requested_by"] = f["owner"]

	reqs = frappe.get_all(APPROVAL, filters=filt, fields=fields, order_by="creation desc", limit=2000)
	rows = []
	for r in reqs:
		hours = None
		start = r.get("requested_on") or r.creation
		end = r.get("decided_on")
		if start and end:
			hours = round(flt(time_diff_in_hours(end, start)), 2)
		rows.append(
			{
				"name": r.name,
				"title": r.get("title") or r.name,
				"approval_type": r.get("approval_type"),
				"status": r.status,
				"amount": flt(r.get("amount")),
				"requested_by": r.get("requested_by"),
				"approver": r.get("approver"),
				"turnaround_hours": hours,
				"opportunity": r.get("opportunity"),
				"customer": r.get("customer"),
				"_drill": {"view": "crm-approval-detail", "params": {"name": r.name}},
			}
		)

	pending = sum(1 for r in rows if (r["status"] or "") in ("Pending", "Open", "Requested"))
	return result(
		"crm_discount_approval",
		_("Discount & Approval"),
		f,
		{
			"total": len(rows),
			"pending": pending,
			"approved": sum(1 for r in rows if (r["status"] or "") == "Approved"),
			"rejected": sum(1 for r in rows if (r["status"] or "") == "Rejected"),
			"by_type": group_count(rows, "approval_type"),
		},
		columns,
		rows,
		help_text=help_text,
	)


def _booking_cancellation(filters=None):
	f = parse_crm_filters(filters)
	help_text = _("Bookings created in period; cancellation rate = Cancelled ÷ total bookings.")
	columns = [
		col("name", "Booking"),
		col("status", "Status"),
		col("customer", "Customer"),
		col("opportunity", "Opportunity"),
		col("vehicle_model", "Model"),
		col("deposit_amount", "Deposit"),
		col("cancellation_reason", "Cancel Reason"),
		col("branch", "Branch"),
		col("booking_date", "Booking Date"),
	]
	if not dt_exists(BOOKING):
		return empty_result(
			"crm_booking_cancellation", _("Booking & Cancellation"), f, columns, help_text=help_text
		)

	meta = frappe.get_meta(BOOKING)
	fields = _meta_fields(
		BOOKING,
		["name", "status", "creation"],
		[
			"customer",
			"opportunity",
			"branch",
			"company",
			"vehicle_model",
			"deposit_amount",
			"booking_date",
			"cancellation_reason",
			"refund_required",
			"refund_reference",
			"vehicle_vin",
		],
	)
	filt = {"creation": creation_between(f)}
	if meta.has_field("branch") and f.get("branch"):
		filt["branch"] = f["branch"]
	if meta.has_field("company") and f.get("company"):
		filt["company"] = f["company"]

	bookings = frappe.get_all(BOOKING, filters=filt, fields=fields, order_by="creation desc", limit=2000)
	rows = []
	cancelled = 0
	for b in bookings:
		is_cancel = (b.status or "") == "Cancelled"
		if is_cancel:
			cancelled += 1
		rows.append(
			{
				"name": b.name,
				"status": b.status,
				"customer": b.get("customer"),
				"opportunity": b.get("opportunity"),
				"vehicle_model": b.get("vehicle_model"),
				"deposit_amount": flt(b.get("deposit_amount")),
				"cancellation_reason": b.get("cancellation_reason") or "",
				"branch": b.get("branch"),
				"booking_date": str(b.get("booking_date") or "")[:10],
				"_drill": {"view": "crm-booking-detail", "params": {"name": b.name}},
			}
		)

	return result(
		"crm_booking_cancellation",
		_("Booking & Cancellation"),
		f,
		{
			"total": len(rows),
			"cancelled": cancelled,
			"active": len(rows) - cancelled,
			"cancellation_pct": round(100.0 * cancelled / len(rows), 1) if rows else 0,
			"by_status": group_count(rows, "status"),
		},
		columns,
		rows,
		help_text=help_text,
	)


def _allocation_waiting(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Bookings waiting for vehicle allocation (status Allocation Pending / Confirmed without VIN). "
		"Allocation History child table is summarised when present on the booking."
	)
	columns = [
		col("name", "Booking"),
		col("status", "Status"),
		col("customer", "Customer"),
		col("opportunity", "Opportunity"),
		col("vehicle_model", "Model"),
		col("vehicle_vin", "VIN"),
		col("factory_order_reference", "Factory Order"),
		col("wait_days", "Wait (days)"),
		col("branch", "Branch"),
		col("booking_date", "Booking Date"),
	]
	if not dt_exists(BOOKING):
		return empty_result(
			"crm_allocation_waiting", _("Allocation Waiting List"), f, columns, help_text=help_text
		)

	meta = frappe.get_meta(BOOKING)
	fields = _meta_fields(
		BOOKING,
		["name", "status", "creation"],
		[
			"customer",
			"opportunity",
			"branch",
			"company",
			"vehicle_model",
			"vehicle_vin",
			"factory_order_reference",
			"booking_date",
			"allocated_on",
			"allocation_switch_requested",
		],
	)
	filt = {
		"status": ["in", ["Confirmed", "Allocation Pending", "Deposit Pending"]],
	}
	if meta.has_field("branch") and f.get("branch"):
		filt["branch"] = f["branch"]
	if meta.has_field("company") and f.get("company"):
		filt["company"] = f["company"]

	bookings = frappe.get_all(BOOKING, filters=filt, fields=fields, order_by="creation asc", limit=2000)
	today = getdate(nowdate())
	rows = []
	for b in bookings:
		# Still waiting if no VIN allocated yet, or explicitly Allocation Pending
		has_vin = bool(b.get("vehicle_vin"))
		if has_vin and (b.status or "") != "Allocation Pending" and not b.get("allocation_switch_requested"):
			continue
		start = getdate(b.get("booking_date") or b.creation)
		rows.append(
			{
				"name": b.name,
				"status": b.status,
				"customer": b.get("customer"),
				"opportunity": b.get("opportunity"),
				"vehicle_model": b.get("vehicle_model"),
				"vehicle_vin": b.get("vehicle_vin") or "",
				"factory_order_reference": b.get("factory_order_reference") or "",
				"wait_days": date_diff(today, start),
				"branch": b.get("branch"),
				"booking_date": str(b.get("booking_date") or "")[:10],
				"_drill": {"view": "crm-booking-detail", "params": {"name": b.name}},
			}
		)

	return result(
		"crm_allocation_waiting",
		_("Allocation Waiting List"),
		f,
		{
			"total": len(rows),
			"avg_wait_days": round(sum(r["wait_days"] for r in rows) / len(rows), 1) if rows else 0,
			"by_status": group_count(rows, "status"),
			"allocation_history_available": dt_exists(ALLOCATION),
		},
		columns,
		rows,
		help_text=help_text,
	)


def _delivery_schedule(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Delivery readiness records in period (or open schedule). "
		"Uses ready_on / handover_on / delivery_appointment when present."
	)
	columns = [
		col("name", "Delivery"),
		col("status", "Status"),
		col("customer", "Customer"),
		col("opportunity", "Opportunity"),
		col("vehicle_vin", "VIN"),
		col("payment_status", "Payment"),
		col("pdi_status", "PDI"),
		col("scheduled", "Scheduled"),
		col("ready_on", "Ready On"),
		col("branch", "Branch"),
	]
	if not dt_exists(DELIVERY):
		return empty_result(
			"crm_delivery_schedule", _("Delivery Schedule & Readiness"), f, columns, help_text=help_text
		)

	meta = frappe.get_meta(DELIVERY)
	fields = _meta_fields(
		DELIVERY,
		["name", "status", "creation"],
		[
			"opportunity",
			"customer",
			"booking",
			"branch",
			"company",
			"vehicle_vin",
			"payment_status",
			"documentation_status",
			"pdi_status",
			"delivery_appointment",
			"ready_on",
			"handover_on",
			"blocked_reason",
			"satisfaction_score",
		],
	)
	filt = {"creation": creation_between(f)}
	if meta.has_field("branch") and f.get("branch"):
		filt["branch"] = f["branch"]
	if meta.has_field("company") and f.get("company"):
		filt["company"] = f["company"]

	recs = frappe.get_all(DELIVERY, filters=filt, fields=fields, order_by="creation desc", limit=2000)
	rows = []
	for d in recs:
		scheduled = d.get("delivery_appointment") or d.get("ready_on") or d.get("handover_on")
		rows.append(
			{
				"name": d.name,
				"status": d.status,
				"customer": d.get("customer"),
				"opportunity": d.get("opportunity"),
				"vehicle_vin": d.get("vehicle_vin"),
				"payment_status": d.get("payment_status"),
				"pdi_status": d.get("pdi_status"),
				"scheduled": str(scheduled)[:16] if scheduled else "",
				"ready_on": str(d.get("ready_on") or "")[:16],
				"branch": d.get("branch"),
				"_drill": {"view": "crm-delivery-readiness-detail", "params": {"name": d.name}},
			}
		)

	return result(
		"crm_delivery_schedule",
		_("Delivery Schedule & Readiness"),
		f,
		{"total": len(rows), "by_status": group_count(rows, "status")},
		columns,
		rows,
		help_text=help_text,
	)


def _referral_conversion(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Referrals in period. Converted when referred_lead / referred_opportunity / referred_customer is set "
		"or status indicates Converted/Won. Rewarded when reward_paid is set."
	)
	columns = [
		col("name", "Referral"),
		col("status", "Status"),
		col("referrer_customer", "Referrer"),
		col("referred_name", "Referred"),
		col("referred_lead", "Lead"),
		col("referred_opportunity", "Opportunity"),
		col("converted", "Converted"),
		col("reward_paid", "Reward Paid"),
		col("reward_points", "Points"),
		col("branch", "Branch"),
	]
	if not dt_exists(REFERRAL):
		return empty_result(
			"crm_referral_conversion", _("Referral Conversion"), f, columns, help_text=help_text
		)

	meta = frappe.get_meta(REFERRAL)
	fields = _meta_fields(
		REFERRAL,
		["name", "status", "creation"],
		[
			"referrer_customer",
			"referred_name",
			"referred_lead",
			"referred_opportunity",
			"referred_customer",
			"reward_paid",
			"reward_points",
			"rewarded_on",
			"branch",
			"company",
			"source_channel",
		],
	)
	filt = {"creation": creation_between(f)}
	if meta.has_field("branch") and f.get("branch"):
		filt["branch"] = f["branch"]
	if meta.has_field("company") and f.get("company"):
		filt["company"] = f["company"]

	refs = frappe.get_all(REFERRAL, filters=filt, fields=fields, order_by="creation desc", limit=2000)
	rows = []
	converted_n = 0
	rewarded_n = 0
	for r in refs:
		converted = bool(
			r.get("referred_opportunity")
			or r.get("referred_customer")
			or (r.get("status") or "") in ("Converted", "Won", "Rewarded", "Completed")
		)
		rewarded = cint(r.get("reward_paid")) or bool(r.get("rewarded_on"))
		if converted:
			converted_n += 1
		if rewarded:
			rewarded_n += 1
		rows.append(
			{
				"name": r.name,
				"status": r.status,
				"referrer_customer": r.get("referrer_customer"),
				"referred_name": r.get("referred_name"),
				"referred_lead": r.get("referred_lead") or "",
				"referred_opportunity": r.get("referred_opportunity") or "",
				"converted": _("Yes") if converted else _("No"),
				"reward_paid": _("Yes") if rewarded else _("No"),
				"reward_points": cint(r.get("reward_points")),
				"branch": r.get("branch"),
				"_drill": {"view": "crm-referral-detail", "params": {"name": r.name}},
			}
		)

	return result(
		"crm_referral_conversion",
		_("Referral Conversion"),
		f,
		{
			"total": len(rows),
			"converted": converted_n,
			"rewarded": rewarded_n,
			"conversion_pct": round(100.0 * converted_n / len(rows), 1) if rows else 0,
		},
		columns,
		rows,
		help_text=help_text,
	)


def _fleet_pipeline(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Fleet / Tender opportunities plus open tenders and active accounts. "
		"Pipeline value from Fleet/Tender opportunity_type or linked account/tender."
	)
	columns = [
		col("record_type", "Type"),
		col("name", "Name"),
		col("title", "Title"),
		col("status", "Status"),
		col("account", "Account"),
		col("value", "Value"),
		col("owner", "Owner"),
		col("branch", "Branch"),
		col("bid_deadline", "Bid Deadline"),
	]
	rows = []

	if dt_exists(OPP):
		meta = frappe.get_meta(OPP)
		fields = _meta_fields(
			OPP,
			["name", "status", "stage", "expected_value"],
			[
				"title",
				"opportunity_type",
				"account",
				"tender",
				"opportunity_owner",
				"branch",
				"bid_deadline",
				"customer",
			],
		)
		filt = {
			"status": ["not in", ["Lost", "Cancelled"]],
			**dim_filters(f, owner_field="opportunity_owner", include_source=False),
		}
		if meta.has_field("opportunity_type"):
			filt["opportunity_type"] = ["in", ["Fleet", "Tender"]]
		opps = frappe.get_all(OPP, filters=filt, fields=fields, limit=2000)
		for o in opps:
			rows.append(
				{
					"record_type": "Opportunity",
					"name": o.name,
					"title": o.get("title") or o.name,
					"status": o.status,
					"stage": o.get("stage"),
					"account": o.get("account") or o.get("customer"),
					"value": flt(o.expected_value),
					"owner": o.get("opportunity_owner"),
					"branch": o.get("branch"),
					"bid_deadline": str(o.get("bid_deadline") or "")[:16],
					"_drill": {"view": "crm-opportunity-detail", "params": {"name": o.name}},
				}
			)

	if dt_exists(TENDER):
		meta = frappe.get_meta(TENDER)
		fields = _meta_fields(
			TENDER,
			["name", "status", "creation"],
			[
				"title",
				"account",
				"customer",
				"estimated_value",
				"account_owner",
				"branch",
				"bid_deadline",
				"close_date",
				"opportunity",
			],
		)
		filt = {"creation": creation_between(f)}
		if meta.has_field("branch") and f.get("branch"):
			filt["branch"] = f["branch"]
		if meta.has_field("company") and f.get("company"):
			filt["company"] = f["company"]
		tenders = frappe.get_all(TENDER, filters=filt, fields=fields, limit=2000)
		for t in tenders:
			rows.append(
				{
					"record_type": "Tender",
					"name": t.name,
					"title": t.get("title") or t.name,
					"status": t.status,
					"account": t.get("account") or t.get("customer"),
					"value": flt(t.get("estimated_value")),
					"owner": t.get("account_owner"),
					"branch": t.get("branch"),
					"bid_deadline": str(t.get("bid_deadline") or t.get("close_date") or "")[:16],
					"_drill": {"view": "crm-tender-detail", "params": {"name": t.name}},
				}
			)

	if dt_exists(ACCOUNT) and len(rows) < 2000:
		meta = frappe.get_meta(ACCOUNT)
		fields = _meta_fields(
			ACCOUNT,
			["name", "status"],
			["account_name", "account_type", "account_owner", "branch", "fleet_size", "customer"],
		)
		filt = {"status": ["in", ["Prospect", "Active", "Strategic"]]}
		if meta.has_field("branch") and f.get("branch"):
			filt["branch"] = f["branch"]
		accounts = frappe.get_all(ACCOUNT, filters=filt, fields=fields, limit=min(500, 2000 - len(rows)))
		for a in accounts:
			rows.append(
				{
					"record_type": "Account",
					"name": a.name,
					"title": a.get("account_name") or a.name,
					"status": a.status,
					"account": a.name,
					"value": 0,
					"owner": a.get("account_owner"),
					"branch": a.get("branch"),
					"bid_deadline": "",
					"_drill": {"view": "crm-account-detail", "params": {"name": a.name}},
				}
			)

	rows = rows[:2000]
	opp_rows = [r for r in rows if r["record_type"] == "Opportunity"]
	return result(
		"crm_fleet_pipeline",
		_("Fleet Pipeline & Tender"),
		f,
		{
			"total": len(rows),
			"opportunities": len(opp_rows),
			"pipeline_value": round(sum(r["value"] for r in opp_rows), 2),
			"tenders": sum(1 for r in rows if r["record_type"] == "Tender"),
			"accounts": sum(1 for r in rows if r["record_type"] == "Account"),
			"by_type": group_count(rows, "record_type"),
		},
		columns,
		rows,
		help_text=help_text,
	)


REPORT_HANDLERS = {
	"crm_lead_source": _lead_source,
	"crm_lead_response": _lead_response,
	"crm_lead_aging": _lead_aging,
	"crm_sales_funnel": _sales_funnel,
	"crm_opportunity_pipeline": _opportunity_pipeline,
	"crm_salesperson_performance": _salesperson_performance,
	"crm_test_drive_conversion": _test_drive_conversion,
	"crm_quotation_conversion": _quotation_conversion,
	"crm_lost_opportunity": _lost_opportunity,
	"crm_discount_approval": _discount_approval,
	"crm_booking_cancellation": _booking_cancellation,
	"crm_allocation_waiting": _allocation_waiting,
	"crm_delivery_schedule": _delivery_schedule,
	"crm_referral_conversion": _referral_conversion,
	"crm_fleet_pipeline": _fleet_pipeline,
}
