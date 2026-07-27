# Copyright (c) 2026, Mania and contributors
"""Service Advisor reports and dashboard (Suweys §3)."""

from __future__ import annotations

import datetime

import frappe
from frappe import _
from frappe.utils import (
	cint,
	flt,
	getdate,
	today,
)

from dms.api.reports.common import (
	_apply_link_display_names,
	_apply_vin_numbers,
	_jc_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_strip_html,
	_vin_link_filter_value,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
	compute_group_discount_amount,
)

# Submitted = presented to customer (spec denominator for conversion %)
SUBMITTED_ESTIMATE_STATUSES = (
	"Pending Customer Approval",
	"Accepted",
	"Rejected",
)
APPROVED_ESTIMATE_STATUSES = ("Accepted",)
# Partially accepted via customer_decision when status may still be Accepted / Pending
APPROVED_DECISIONS = ("Accepted", "Partially Accepted")
# Pending beyond this many days counts as expired for reporting
ESTIMATE_EXPIRY_DAYS = 30
CLOSED_JC_STATUSES = ("Completed", "Delivered", "Invoiced", "Closed")


def _estimate_filters(f):
	meta = frappe.get_meta("DMS Service Estimate")
	date_field = "posting_date" if meta.has_field("posting_date") else "creation"
	filters = {date_field: ["between", [f["from_date"], f["to_date"]]]}
	if f.get("company") and meta.has_field("company"):
		filters["company"] = f["company"]
	if f.get("branch") and meta.has_field("branch"):
		filters["branch"] = f["branch"]
	if f.get("service_advisor") and meta.has_field("service_advisor"):
		filters["service_advisor"] = f["service_advisor"]
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None and meta.has_field("vehicle_vin"):
		filters["vehicle_vin"] = ["in", vin_val] if isinstance(vin_val, list) else vin_val
	return filters, meta


def _is_expired_estimate(row, as_of=None) -> bool:
	"""Pending customer approval past ESTIMATE_EXPIRY_DAYS → expired."""
	if (row.get("status") or "") != "Pending Customer Approval":
		return False
	base = row.get("decision_date") or row.get("posting_date") or row.get("creation")
	if not base:
		return False
	try:
		return date_diff_safe(getdate(as_of or today()), getdate(base)) > ESTIMATE_EXPIRY_DAYS
	except Exception:
		return False


def date_diff_safe(d1, d2) -> int:
	from frappe.utils import date_diff

	return date_diff(d1, d2)


def _avg_csat_by_advisor(f) -> dict[str, float]:
	"""Map service_advisor → avg star score from Vehicle Delivery Note feedback.

	Delivery stars (1–5) seed the follow-up; advisor performance uses the delivery rating.
	"""
	if not frappe.db.exists("DocType", "Vehicle Delivery Note"):
		return {}

	meta = frappe.get_meta("Vehicle Delivery Note")
	fields = ["name", "job_card", "delivery_date_time"]
	if meta.has_field("customer_satisfaction_score"):
		fields.append("customer_satisfaction_score")
	if meta.has_field("customer_satisfaction_initial"):
		fields.append("customer_satisfaction_initial")

	# Prefer delivery datetime window; fall back to creation if needed
	date_filters = {
		"docstatus": 1,
		"delivery_date_time": [
			"between",
			[str(f["from_date"]) + " 00:00:00", str(f["to_date"]) + " 23:59:59"],
		],
	}
	rows = frappe.get_all(
		"Vehicle Delivery Note",
		filters=date_filters,
		fields=fields,
		limit=5000,
	)
	if not rows:
		# Some sites may have delivery_date only as date — retry via modified/creation
		rows = frappe.get_all(
			"Vehicle Delivery Note",
			filters={
				"docstatus": 1,
				"creation": ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]],
			},
			fields=fields,
			limit=5000,
		)

	jc_names = list({r.job_card for r in rows if r.get("job_card")})
	jc_advisor = {}
	if jc_names:
		jcs = frappe.get_all(
			"DMS Job Card",
			filters={"name": ["in", jc_names]},
			fields=["name", "service_advisor"],
		)
		_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})
		for jc in jcs:
			jc_advisor[jc.name] = jc.service_advisor

	from dms.dealer_management_system.doctype.vehicle_delivery_note.vehicle_delivery_note import (
		satisfaction_label_to_score,
	)

	acc: dict[str, list[float]] = {}
	for r in rows:
		adv = jc_advisor.get(r.job_card) if r.get("job_card") else None
		if not adv:
			continue
		score = cint(r.get("customer_satisfaction_score") or 0)
		if not (1 <= score <= 5):
			score = satisfaction_label_to_score(r.get("customer_satisfaction_initial")) or 0
		if 1 <= score <= 5:
			acc.setdefault(adv, []).append(float(score))
	return {k: round(sum(v) / len(v), 2) for k, v in acc.items() if v}


def _follow_up_completion_by_advisor(f) -> dict[str, float]:
	if not frappe.db.exists("DocType", "Customer Follow Up"):
		return {}
	rows = frappe.get_all(
		"Customer Follow Up",
		filters={
			"creation": ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]],
		},
		fields=["job_card", "follow_up_completed_date", "contact_status"],
		limit=5000,
	)
	jc_names = list({r.job_card for r in rows if r.get("job_card")})
	jc_advisor = {}
	if jc_names:
		for jc in frappe.get_all(
			"DMS Job Card",
			filters={"name": ["in", jc_names]},
			fields=["name", "service_advisor"],
		):
			jc_advisor[jc.name] = jc.service_advisor

	stats: dict[str, dict] = {}
	for r in rows:
		adv = jc_advisor.get(r.job_card) if r.get("job_card") else None
		if not adv:
			continue
		bucket = stats.setdefault(adv, {"total": 0, "done": 0})
		bucket["total"] += 1
		done = bool(r.follow_up_completed_date) or (r.contact_status or "") == "Reached"
		if done:
			bucket["done"] += 1
	return {
		k: round(100.0 * v["done"] / v["total"], 1) if v["total"] else 0.0
		for k, v in stats.items()
	}


def _complaint_counts_by_advisor(f) -> dict[str, int]:
	if not frappe.db.exists("DocType", "Customer Follow Up"):
		return {}
	meta = frappe.get_meta("Customer Follow Up")
	if not meta.has_field("customer_complaint"):
		return {}
	rows = frappe.get_all(
		"Customer Follow Up",
		filters={
			"creation": ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]],
		},
		fields=["job_card", "customer_complaint"],
		limit=5000,
	)
	jc_names = list({r.job_card for r in rows if r.get("job_card")})
	jc_advisor = {}
	if jc_names:
		for jc in frappe.get_all(
			"DMS Job Card",
			filters={"name": ["in", jc_names]},
			fields=["name", "service_advisor"],
		):
			jc_advisor[jc.name] = jc.service_advisor
	out: dict[str, int] = {}
	for r in rows:
		adv = jc_advisor.get(r.job_card) if r.get("job_card") else None
		if not adv:
			continue
		if _strip_html(r.get("customer_complaint")):
			out[adv] = out.get(adv, 0) + 1
	return out


def get_service_advisor_performance_report(filters=None):
	"""§3.1 Service Advisor Performance."""
	f = _parse_filters(filters)
	conds = _jc_filters(f, {"docstatus": ["<", 2]})
	jc_fields = [
		"name",
		"service_advisor",
		"status",
		"vehicle_vin",
		"job_card_type",
		"total_labor_cost",
		"total_parts_cost",
		"discount_amount",
		"net_amount",
		"total_amount",
		"customer_approval_status",
		"is_repeat_repair",
		"service_estimate",
	]
	jc_meta = frappe.get_meta("DMS Job Card")
	for opt in ("consumables_discount_amount", "goodwill_discount_amount"):
		if jc_meta.has_field(opt):
			jc_fields.append(opt)

	jcs = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=jc_fields,
		limit=5000,
	)
	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})

	# Estimates in period (for created / approved conversion)
	est_by_advisor: dict[str, dict] = {}
	if frappe.db.exists("DocType", "DMS Service Estimate"):
		est_filters, _est_meta = _estimate_filters(f)
		ests = frappe.get_all(
			"DMS Service Estimate",
			filters=est_filters,
			fields=[
				"name",
				"service_advisor",
				"status",
				"customer_decision",
				"grand_total",
				"estimate_type",
			],
			limit=5000,
		)
		_apply_link_display_names(ests, {"service_advisor": "Service Advisor"})
		for e in ests:
			key = e.service_advisor or _("Unassigned")
			bucket = est_by_advisor.setdefault(
				key,
				{"created": 0, "approved": 0, "submitted": 0, "upsell": 0.0},
			)
			bucket["created"] += 1
			decision = (e.customer_decision or "").strip()
			if e.status in APPROVED_ESTIMATE_STATUSES or decision in APPROVED_DECISIONS:
				bucket["approved"] += 1
			if e.status in SUBMITTED_ESTIMATE_STATUSES or decision in (
				"Accepted",
				"Partially Accepted",
				"Rejected",
			):
				bucket["submitted"] += 1
			if (e.estimate_type or "") == "Supplementary" and (
				e.status in APPROVED_ESTIMATE_STATUSES or decision in APPROVED_DECISIONS
			):
				bucket["upsell"] += flt(e.grand_total)

	csat = _avg_csat_by_advisor(f)
	fu_pct = _follow_up_completion_by_advisor(f)
	complaints = _complaint_counts_by_advisor(f)

	by_advisor = {}
	vins_by_advisor: dict[str, set] = {}
	for jc in jcs:
		key = jc.service_advisor or _("Unassigned")
		bucket = by_advisor.setdefault(
			key,
			{
				"advisor": key,
				"vehicles_received": 0,
				"jobs_opened": 0,
				"jobs_closed": 0,
				"labour_sales": 0.0,
				"parts_sales": 0.0,
				"discounts": 0.0,
				"total_sales": 0.0,
				"net_sales": 0.0,
				"approved": 0,
				"repeat_repairs": 0,
			},
		)
		bucket["jobs_opened"] += 1
		vins_by_advisor.setdefault(key, set())
		if jc.vehicle_vin:
			vins_by_advisor[key].add(jc.vehicle_vin)
		if jc.status in CLOSED_JC_STATUSES:
			bucket["jobs_closed"] += 1
		bucket["labour_sales"] += flt(jc.total_labor_cost)
		bucket["parts_sales"] += flt(jc.total_parts_cost)
		bucket["discounts"] += flt(jc.discount_amount)
		gross = flt(jc.total_amount) or (flt(jc.total_labor_cost) + flt(jc.total_parts_cost))
		bucket["total_sales"] += gross
		bucket["net_sales"] += flt(jc.net_amount or jc.total_amount)
		if (jc.customer_approval_status or "") == "Approved":
			bucket["approved"] += 1
		if cint(jc.is_repeat_repair):
			bucket["repeat_repairs"] += 1

	# Merge estimate-only advisors
	all_keys = set(by_advisor) | set(est_by_advisor)
	rows = []
	for key in all_keys:
		bucket = by_advisor.get(
			key,
			{
				"advisor": key,
				"vehicles_received": 0,
				"jobs_opened": 0,
				"jobs_closed": 0,
				"labour_sales": 0.0,
				"parts_sales": 0.0,
				"discounts": 0.0,
				"total_sales": 0.0,
				"net_sales": 0.0,
				"approved": 0,
				"repeat_repairs": 0,
			},
		)
		bucket["advisor"] = key
		bucket["vehicles_received"] = len(vins_by_advisor.get(key, set())) or bucket["jobs_opened"]
		est = est_by_advisor.get(key, {})
		bucket["estimates_created"] = est.get("created", 0)
		bucket["estimates_approved"] = est.get("approved", 0)
		submitted = est.get("submitted", 0) or 0
		bucket["approval_conversion_pct"] = (
			round(100.0 * est.get("approved", 0) / submitted, 1) if submitted else 0.0
		)
		opened = bucket["jobs_opened"] or 1
		bucket["avg_ro"] = round(bucket["net_sales"] / opened, 2)
		bucket["upselling_revenue"] = round(est.get("upsell", 0.0), 2)
		bucket["customer_satisfaction_score"] = csat.get(key)
		bucket["complaints"] = complaints.get(key, 0)
		bucket["repeat_repair_rate_pct"] = (
			round(100.0 * bucket["repeat_repairs"] / opened, 1) if bucket["jobs_opened"] else 0.0
		)
		bucket["follow_up_completion_pct"] = fu_pct.get(key)
		rows.append(bucket)

	rows.sort(key=lambda r: r["net_sales"], reverse=True)

	return _result(
		"service_advisor_performance",
		_("Service Advisor Performance"),
		f,
		{
			"advisor_count": len(rows),
			"total_jobs": sum(r["jobs_opened"] for r in rows),
			"total_vehicles": sum(r["vehicles_received"] for r in rows),
			"total_net_sales": round(sum(r["net_sales"] for r in rows), 2),
			"avg_approval_conversion_pct": (
				round(
					sum(r["approval_conversion_pct"] for r in rows) / len(rows),
					1,
				)
				if rows
				else 0
			),
		},
		[
			{"key": "advisor", "label": _("Advisor")},
			{"key": "vehicles_received", "label": _("Vehicles Received")},
			{"key": "estimates_created", "label": _("Estimates Created")},
			{"key": "estimates_approved", "label": _("Estimates Approved")},
			{"key": "approval_conversion_pct", "label": _("Approval Conv. %")},
			{"key": "jobs_opened", "label": _("JC Opened")},
			{"key": "jobs_closed", "label": _("JC Closed")},
			{"key": "total_sales", "label": _("Total Sales")},
			{"key": "labour_sales", "label": _("Labour")},
			{"key": "parts_sales", "label": _("Parts")},
			{"key": "avg_ro", "label": _("Avg RO")},
			{"key": "discounts", "label": _("Discounts")},
			{"key": "upselling_revenue", "label": _("Upselling")},
			{"key": "customer_satisfaction_score", "label": _("Customer Satisfaction")},
			{"key": "complaints", "label": _("Complaints")},
			{"key": "repeat_repair_rate_pct", "label": _("Repeat %")},
			{"key": "follow_up_completion_pct", "label": _("Follow-up %")},
		],
		rows,
	)


def get_estimate_conversion_report(filters=None):
	"""§3.2 Estimate Conversion Report."""
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "DMS Service Estimate"):
		return _result("estimate_conversion", _("Estimate Conversion"), f, {"total": 0}, [], [])

	est_filters, meta = _estimate_filters(f)
	fields = [
		"name",
		"posting_date",
		"status",
		"customer_decision",
		"customer",
		"customer_name",
		"vehicle_vin",
		"service_advisor",
		"grand_total",
		"total_before_vat",
		"creation",
		"decision_date",
		"estimate_type",
	]
	for opt in ("rejection_reason", "lost_sale_follow_up_date", "lost_sale_status"):
		if meta.has_field(opt):
			fields.append(opt)

	ests = frappe.get_all(
		"DMS Service Estimate",
		filters=est_filters,
		fields=fields,
		order_by="posting_date desc",
		limit=5000,
	)
	_apply_link_display_names(ests, {"service_advisor": "Service Advisor"})
	_apply_vin_numbers(ests)

	created = len(ests)
	approved = 0
	rejected = 0
	partial = 0
	expired = 0
	quoted_value = 0.0
	approved_value = 0.0
	lost_revenue = 0.0
	submitted = 0
	by_reason: dict[str, int] = {}

	by_advisor: dict[str, dict] = {}

	for e in ests:
		decision = (e.customer_decision or "").strip()
		status = (e.status or "").strip()
		value = flt(e.grand_total or e.total_before_vat)
		quoted_value += value

		is_submitted = status in SUBMITTED_ESTIMATE_STATUSES or decision in (
			"Accepted",
			"Partially Accepted",
			"Rejected",
		)
		if is_submitted:
			submitted += 1

		is_expired = _is_expired_estimate(e)
		row_approved_value = 0.0
		row_lost = 0.0
		if is_expired:
			expired += 1
			category = "Expired"
		elif status == "Accepted" or decision == "Accepted":
			approved += 1
			approved_value += value
			row_approved_value = value
			category = "Approved"
		elif decision == "Partially Accepted":
			partial += 1
			row_approved_value = value * 0.5
			approved_value += row_approved_value
			category = "Partially Approved"
		elif status == "Rejected" or decision == "Rejected":
			rejected += 1
			lost_revenue += value
			row_lost = value
			category = "Rejected"
		elif status == "Pending Customer Approval":
			category = "Pending"
		else:
			category = status or decision or "—"

		reason = (e.get("rejection_reason") or "") if category in ("Rejected", "Partially Approved") else ""
		if reason:
			by_reason[reason] = by_reason.get(reason, 0) + 1

		adv_key = e.service_advisor or _("Unassigned")
		bucket = by_advisor.setdefault(
			adv_key,
			{
				"advisor": adv_key,
				"estimates_created": 0,
				"estimates_submitted": 0,
				"estimates_approved": 0,
				"estimates_partially_approved": 0,
				"estimates_rejected": 0,
				"estimates_expired": 0,
				"quoted_value": 0.0,
				"approved_value": 0.0,
				"lost_revenue": 0.0,
				"rejection_reasons": {},
			},
		)
		bucket["estimates_created"] += 1
		bucket["quoted_value"] += value
		bucket["approved_value"] += row_approved_value
		bucket["lost_revenue"] += row_lost
		if is_submitted:
			bucket["estimates_submitted"] += 1
		if category == "Approved":
			bucket["estimates_approved"] += 1
		elif category == "Partially Approved":
			bucket["estimates_partially_approved"] += 1
		elif category == "Rejected":
			bucket["estimates_rejected"] += 1
		elif category == "Expired":
			bucket["estimates_expired"] += 1
		if reason:
			bucket["rejection_reasons"][reason] = bucket["rejection_reasons"].get(reason, 0) + 1

	rows = []
	for bucket in by_advisor.values():
		sub = bucket["estimates_submitted"] or 0
		converted = bucket["estimates_approved"] + bucket["estimates_partially_approved"]
		bucket["conversion_pct"] = round(100.0 * converted / sub, 1) if sub else 0.0
		reasons = bucket.pop("rejection_reasons", {}) or {}
		top_reason = max(reasons.items(), key=lambda x: x[1])[0] if reasons else ""
		bucket["rejection_reason"] = top_reason or None
		bucket["quoted_value"] = round(bucket["quoted_value"], 2)
		bucket["approved_value"] = round(bucket["approved_value"], 2)
		bucket["lost_revenue"] = round(bucket["lost_revenue"], 2)
		rows.append(bucket)

	rows.sort(key=lambda r: r["conversion_pct"], reverse=True)

	conversion_pct = (
		round(100.0 * (approved + partial) / submitted, 1) if submitted else 0.0
	)

	return _result(
		"estimate_conversion",
		_("Estimate Conversion"),
		f,
		{
			"estimates_created": created,
			"estimates_approved": approved,
			"estimates_rejected": rejected,
			"estimates_partially_approved": partial,
			"estimates_expired": expired,
			"estimates_submitted": submitted,
			"quoted_value": round(quoted_value, 2),
			"approved_value": round(approved_value, 2),
			"lost_revenue": round(lost_revenue, 2),
			"conversion_pct": conversion_pct,
			"by_rejection_reason": by_reason,
		},
		[
			{"key": "advisor", "label": _("Advisor")},
			{"key": "estimates_created", "label": _("Created")},
			{"key": "estimates_approved", "label": _("Approved")},
			{"key": "estimates_partially_approved", "label": _("Partial")},
			{"key": "estimates_rejected", "label": _("Rejected")},
			{"key": "estimates_expired", "label": _("Expired")},
			{"key": "quoted_value", "label": _("Quoted Value")},
			{"key": "approved_value", "label": _("Approved Value")},
			{"key": "lost_revenue", "label": _("Lost Revenue")},
			{"key": "conversion_pct", "label": _("Conversion %")},
			{"key": "rejection_reason", "label": _("Top Rejection Reason")},
		],
		rows,
	)


def get_lost_sales_report(filters=None):
	"""§3.3 Lost Sales — recommended work/parts not approved."""
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "DMS Service Estimate"):
		return _result("lost_sales", _("Lost Sales"), f, {"total": 0}, [], [])

	est_filters, meta = _estimate_filters(f)
	# Rejected or partially accepted only
	est_filters["customer_decision"] = ["in", ["Rejected", "Partially Accepted"]]

	fields = [
		"name",
		"posting_date",
		"customer",
		"customer_name",
		"vehicle_vin",
		"license_plate",
		"service_advisor",
		"grand_total",
		"total_labor_cost",
		"total_parts_cost",
		"customer_decision",
		"status",
	]
	for opt in ("rejection_reason", "lost_sale_follow_up_date", "lost_sale_status"):
		if meta.has_field(opt):
			fields.append(opt)

	ests = frappe.get_all(
		"DMS Service Estimate",
		filters=est_filters,
		fields=fields,
		order_by="posting_date desc",
		limit=2000,
	)
	# Also include status=Rejected with empty decision
	alt_filters = {**est_filters}
	alt_filters.pop("customer_decision", None)
	alt_filters["status"] = "Rejected"
	extra = frappe.get_all(
		"DMS Service Estimate",
		filters=alt_filters,
		fields=fields,
		limit=2000,
	)
	seen = {e.name for e in ests}
	for e in extra:
		if e.name not in seen:
			ests.append(e)
			seen.add(e.name)

	_apply_link_display_names(ests, {"service_advisor": "Service Advisor"})
	_apply_vin_numbers(ests)

	est_names = [e.name for e in ests]
	labour_by: dict[str, list] = {n: [] for n in est_names}
	parts_by: dict[str, list] = {n: [] for n in est_names}

	if est_names:
		for row in frappe.get_all(
			"Vehicle Labour Item",
			filters={"parent": ["in", est_names], "parenttype": "DMS Service Estimate"},
			fields=["parent", "service_name", "vehicle_service_item", "amount", "estimated_hours"],
			limit=10000,
		):
			labour_by.setdefault(row.parent, []).append(row)
		for row in frappe.get_all(
			"Job Card Part Item",
			filters={"parent": ["in", est_names], "parenttype": "DMS Service Estimate"},
			fields=["parent", "item_code", "part_name", "total_amount", "quantity_requested", "unit_price"],
			limit=10000,
		):
			parts_by.setdefault(row.parent, []).append(row)

	rows = []
	total_lost = 0.0
	for e in ests:
		reason = e.get("rejection_reason") or ""
		follow_up = e.get("lost_sale_follow_up_date")
		status = e.get("lost_sale_status") or (
			"Open" if (e.customer_decision or e.status) in ("Rejected", "Partially Accepted") else ""
		)
		customer = e.customer_name or e.customer
		vin = e.get("vin_number") or e.vehicle_vin
		advisor = e.service_advisor or ""

		labours = labour_by.get(e.name) or []
		parts = parts_by.get(e.name) or []

		if not labours and not parts:
			value = flt(e.grand_total)
			total_lost += value
			rows.append(
				{
					"estimate": e.name,
					"customer_name": customer,
					"vin_number": vin,
					"license_plate": e.license_plate,
					"advisor": advisor,
					"line_type": _("Estimate"),
					"recommended_work": _("Full estimate rejected"),
					"recommended_part": "",
					"quoted_value": round(value, 2),
					"rejection_reason": reason,
					"follow_up_date": follow_up,
					"current_status": status,
				}
			)
			continue

		for lab in labours:
			value = flt(lab.amount)
			total_lost += value
			rows.append(
				{
					"estimate": e.name,
					"customer_name": customer,
					"vin_number": vin,
					"license_plate": e.license_plate,
					"advisor": advisor,
					"line_type": _("Labour"),
					"recommended_work": lab.service_name or lab.vehicle_service_item,
					"recommended_part": "",
					"quoted_value": round(value, 2),
					"rejection_reason": reason,
					"follow_up_date": follow_up,
					"current_status": status,
				}
			)
		for part in parts:
			value = flt(part.total_amount) or (
				flt(part.unit_price) * flt(part.quantity_requested or 1)
			)
			total_lost += value
			rows.append(
				{
					"estimate": e.name,
					"customer_name": customer,
					"vin_number": vin,
					"license_plate": e.license_plate,
					"advisor": advisor,
					"line_type": _("Part"),
					"recommended_work": "",
					"recommended_part": part.part_name or part.item_code,
					"quoted_value": round(value, 2),
					"rejection_reason": reason,
					"follow_up_date": follow_up,
					"current_status": status,
				}
			)

	return _result(
		"lost_sales",
		_("Lost Sales"),
		f,
		{
			"total_lines": len(rows),
			"estimates": len(ests),
			"lost_value": round(total_lost, 2),
		},
		[
			{"key": "estimate", "label": _("Estimate")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("Vehicle / VIN")},
			{"key": "line_type", "label": _("Type")},
			{"key": "recommended_work", "label": _("Recommended Work")},
			{"key": "recommended_part", "label": _("Recommended Part")},
			{"key": "quoted_value", "label": _("Quoted Value")},
			{"key": "rejection_reason", "label": _("Rejection Reason")},
			{"key": "follow_up_date", "label": _("Follow-up Date")},
			{"key": "current_status", "label": _("Status")},
			{"key": "advisor", "label": _("Advisor")},
		],
		rows,
	)


def get_discount_report(filters=None):
	"""§3.4 Discount Report — revenue leakage control."""
	f = _parse_filters(filters)
	conds = _jc_filters(f, {"docstatus": ["<", 2]})
	meta = frappe.get_meta("DMS Job Card")
	fields = [
		"name",
		"posting_date",
		"customer",
		"customer_name",
		"service_advisor",
		"total_labor_cost",
		"total_parts_cost",
		"total_amount",
		"discount_amount",
		"labour_discount_type",
		"labour_discount_value",
		"parts_discount_type",
		"parts_discount_value",
		"net_amount",
		"warranty_application_type",
	]
	for opt in (
		"consumables_discount_amount",
		"goodwill_discount_amount",
		"discount_reason",
		"discount_approved_by",
	):
		if meta.has_field(opt):
			fields.append(opt)

	jcs = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=fields,
		order_by="posting_date desc",
		limit=5000,
	)
	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})

	rows = []
	total_disc = 0.0
	for jc in jcs:
		labour_disc = compute_group_discount_amount(
			flt(jc.total_labor_cost),
			jc.labour_discount_type,
			jc.labour_discount_value,
		)
		parts_disc = compute_group_discount_amount(
			flt(jc.total_parts_cost),
			jc.parts_discount_type,
			jc.parts_discount_value,
		)
		cons_disc = flt(jc.get("consumables_discount_amount"))
		goodwill = flt(jc.get("goodwill_discount_amount"))
		amount = flt(jc.discount_amount) or (labour_disc + parts_disc + cons_disc + goodwill)
		if amount <= 0 and cons_disc <= 0 and goodwill <= 0:
			continue

		gross = flt(jc.total_amount) or (flt(jc.total_labor_cost) + flt(jc.total_parts_cost))
		pct = round(100.0 * amount / gross, 2) if gross else 0.0
		total_disc += amount
		rows.append(
			{
				"job_card": jc.name,
				"posting_date": jc.posting_date,
				"customer_name": jc.customer_name or jc.customer,
				"advisor": jc.service_advisor or "",
				"discount_amount": round(amount, 2),
				"discount_pct": pct,
				"labour_discount": round(labour_disc, 2),
				"parts_discount": round(parts_disc, 2),
				"consumables_discount": round(cons_disc, 2),
				"goodwill_discount": round(goodwill, 2),
				"approved_by": jc.get("discount_approved_by") or "",
				"reason": jc.get("discount_reason") or "",
				"gross": round(gross, 2),
				"net_amount": round(flt(jc.net_amount or jc.total_amount), 2),
			}
		)

	return _result(
		"discount_report",
		_("Discount Report"),
		f,
		{
			"discounted_jobs": len(rows),
			"total_discount": round(total_disc, 2),
			"avg_discount": round(total_disc / len(rows), 2) if rows else 0.0,
		},
		[
			{"key": "job_card", "label": _("Job Card")},
			{"key": "posting_date", "label": _("Date")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "advisor", "label": _("Service Advisor")},
			{"key": "discount_amount", "label": _("Discount Amount")},
			{"key": "discount_pct", "label": _("Discount %")},
			{"key": "labour_discount", "label": _("Labour Disc.")},
			{"key": "parts_discount", "label": _("Parts Disc.")},
			{"key": "consumables_discount", "label": _("Consumables Disc.")},
			{"key": "goodwill_discount", "label": _("Goodwill Disc.")},
			{"key": "approved_by", "label": _("Approved By")},
			{"key": "reason", "label": _("Reason")},
		],
		rows,
	)


def get_appointment_conversion_report(filters=None):
	f = _parse_filters(filters)
	start = datetime.datetime.combine(f["from_date"], datetime.time.min)
	end = datetime.datetime.combine(f["to_date"], datetime.time.max)

	apt_filters = {"appointment_date_time": ["between", [start, end]]}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		apt_filters["vin_chassis"] = ["in", vin_val]

	apts = frappe.get_all(
		"Service Appointment",
		filters=apt_filters,
		fields=["name", "status", "booking_source", "customer_name", "vin_chassis"],
		limit=5000,
	)
	_apply_vin_numbers(apts, link_field="vin_chassis")

	by_status = {}
	walk_in = 0
	for a in apts:
		st = a.status or "Booked"
		by_status[st] = by_status.get(st, 0) + 1
		if (a.booking_source or "").lower() in ("walk-in", "walk in", "walkin"):
			walk_in += 1

	total = len(apts) or 1
	arrived = sum(
		by_status.get(s, 0)
		for s in ("Arrived", "In Inspection", "In Workshop", "Ready for Pickup", "Completed")
	)
	no_show = by_status.get("No-Show", 0)
	rescheduled = by_status.get("Rescheduled", 0)
	booked = by_status.get("Booked", 0) + by_status.get("Reminder Sent", 0)

	return {
		"report_id": "appointment_conversion",
		"title": "Appointment Conversion",
		"filters": _report_filters_response(f),
		"summary": {
			"total": len(apts),
			"booked": booked,
			"arrived": arrived,
			"no_show": no_show,
			"rescheduled": rescheduled,
			"walk_in": walk_in,
			"walk_in_pct": round((walk_in / total) * 100, 1),
			"arrival_rate_pct": round((arrived / total) * 100, 1),
			"by_status": by_status,
		},
		"columns": [
			{"key": "name", "label": "Appointment"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "booking_source", "label": "Source"},
			{"key": "customer_name", "label": "Customer"},
		],
		"rows": apts[:200],
	}


from dms.api.reports.crm import get_customer_follow_up_report


def get_advisor_dashboard(filters=None):
	f = _parse_filters(filters)
	perf = get_service_advisor_performance_report(f)
	apt = get_appointment_conversion_report(f)
	conv = get_estimate_conversion_report(f)
	lost = get_lost_sales_report(f)
	disc = get_discount_report(f)
	follow = get_customer_follow_up_report(f)
	return {
		"section_id": "advisor",
		"title": _("Service Advisor"),
		"filters": _report_filters_response(f),
		"summary": {
			"advisor_count": perf["summary"].get("advisor_count", 0),
			"total_jobs": perf["summary"].get("total_jobs", 0),
			"total_net_sales": perf["summary"].get("total_net_sales", 0),
			"arrival_rate_pct": apt["summary"].get("arrival_rate_pct", 0),
			"estimate_conversion_pct": conv["summary"].get("conversion_pct", 0),
			"lost_sales_value": lost["summary"].get("lost_value", 0),
			"total_discount": disc["summary"].get("total_discount", 0),
			"follow_up_completion_pct": follow["summary"].get("completion_pct", 0),
			"by_status": apt["summary"].get("by_status", {}),
		},
	}


REPORT_HANDLERS = {
	"service_advisor_performance": get_service_advisor_performance_report,
	"estimate_conversion": get_estimate_conversion_report,
	"lost_sales": get_lost_sales_report,
	"discount_report": get_discount_report,
	"customer_follow_up": get_customer_follow_up_report,
	"appointment_conversion": get_appointment_conversion_report,
}
