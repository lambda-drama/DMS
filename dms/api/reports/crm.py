# Copyright (c) 2026, Mania and contributors
"""Customer & CRM reports and dashboard."""

from __future__ import annotations

import datetime

import frappe
from frappe import _
from frappe.utils import (
	cint,
	date_diff,
	flt,
	get_datetime,
	getdate,
	nowdate,
	time_diff_in_hours,
)

from dms.api.reports.common import (
	OPEN_JOB_CARD_STATUSES,
	_apply_link_display_names,
	_apply_vin_numbers,
	_bulk_full_names,
	_jc_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_strip_html,
	_vin_link_filter_value,
	_vin_sql_clause,
)


def _rating_stars(value) -> float | None:
	"""Parse score Int or Select label like '4 - Satisfied' → 4.0."""
	from dms.dealer_management_system.doctype.customer_follow_up.customer_follow_up import (
		rating_label_to_score,
	)

	parsed = rating_label_to_score(value)
	return float(parsed) if parsed is not None else None


def get_customer_follow_up_report(filters=None):
	"""§3.5 Customer Follow-Up Report."""
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "Customer Follow Up"):
		return _result("customer_follow_up", _("Customer Follow-Up"), f, {"total": 0}, [], [])

	meta = frappe.get_meta("Customer Follow Up")
	fields = ["name", "customer", "job_card", "follow_up_due_date", "follow_up_completed_date"]
	for optional in (
		"vehicle_vin",
		"delivery",
		"customer_rating",
		"customer_rating_score",
		"customer_complaint",
		"issue_resolved",
		"contact_status",
		"case_status",
		"nps_score",
		"assigned_to",
	):
		if meta.has_field(optional):
			fields.append(optional)

	rows = frappe.get_all(
		"Customer Follow Up",
		filters={
			"creation": ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]],
		},
		fields=fields,
		order_by="follow_up_due_date desc",
		limit=2000,
	)

	# Display name from Customer link (no customer_name field on this DocType)
	customer_ids = list({r.customer for r in rows if r.get("customer")})
	customer_names = {}
	if customer_ids:
		for c in frappe.get_all(
			"Customer",
			filters={"name": ["in", customer_ids]},
			fields=["name", "customer_name"],
		):
			customer_names[c.name] = c.customer_name or c.name

	jc_names = list({r.job_card for r in rows if r.get("job_card")})
	next_service_map = {}
	if jc_names and frappe.db.exists("DocType", "DMS Job Card"):
		jc_meta = frappe.get_meta("DMS Job Card")
		jc_fields = ["name"]
		if jc_meta.has_field("next_service_due_date"):
			jc_fields.append("next_service_due_date")
		if jc_meta.has_field("next_service_due_km"):
			jc_fields.append("next_service_due_km")
		for jc in frappe.get_all("DMS Job Card", filters={"name": ["in", jc_names]}, fields=jc_fields):
			parts = []
			if jc.get("next_service_due_date"):
				parts.append(str(jc.next_service_due_date))
			if jc.get("next_service_due_km"):
				parts.append(f"{cint(jc.next_service_due_km)} km")
			next_service_map[jc.name] = " · ".join(parts) if parts else ""

	# Fallback: VIN next service
	vin_field = "vehicle_vin" if meta.has_field("vehicle_vin") else None
	vin_ids = list({r.get(vin_field) for r in rows if vin_field and r.get(vin_field)})
	vin_next = {}
	if vin_ids and frappe.db.exists("DocType", "VIN No"):
		vin_meta = frappe.get_meta("VIN No")
		vfields = ["name"]
		if vin_meta.has_field("next_service_due_date"):
			vfields.append("next_service_due_date")
		if vin_meta.has_field("next_service_due_km"):
			vfields.append("next_service_due_km")
		for v in frappe.get_all("VIN No", filters={"name": ["in", vin_ids]}, fields=vfields):
			parts = []
			if v.get("next_service_due_date"):
				parts.append(str(v.next_service_due_date))
			if v.get("next_service_due_km"):
				parts.append(f"{cint(v.next_service_due_km)} km")
			vin_next[v.name] = " · ".join(parts) if parts else ""

	delivered = 0
	complaints_raised = 0
	complaints_resolved = 0
	for row in rows:
		row["customer_name"] = customer_names.get(row.get("customer"), row.get("customer") or "")
		row["contact_result"] = row.get("contact_status") or row.get("case_status") or ""
		score = _rating_stars(row.get("customer_rating_score")) or _rating_stars(row.get("customer_rating"))
		row["customer_rating_score"] = cint(score) if score is not None else None
		complaint = _strip_html(row.get("customer_complaint"))
		row["complaint_raised"] = _("Yes") if complaint else _("No")
		if complaint:
			complaints_raised += 1
			resolved = (row.get("issue_resolved") or "").strip()
			if resolved == "Yes":
				complaints_resolved += 1
				row["complaint_resolved"] = _("Yes")
			else:
				row["complaint_resolved"] = resolved or _("No")
		else:
			row["complaint_resolved"] = "—"

		if row.get("delivery") or row.get("job_card"):
			delivered += 1
		row["vehicle_delivered"] = _("Yes") if (row.get("delivery") or row.get("job_card")) else _("No")

		ns = ""
		if row.get("job_card"):
			ns = next_service_map.get(row.job_card, "")
		if not ns and vin_field and row.get(vin_field):
			ns = vin_next.get(row.get(vin_field), "")
		row["next_service_reminder"] = ns or "—"

	if vin_field:
		_apply_vin_numbers(rows, link_field=vin_field, output_field="vin_number")
	else:
		for row in rows:
			row["vin_number"] = ""

	due = sum(1 for r in rows if r.follow_up_due_date and not r.follow_up_completed_date)
	done = sum(1 for r in rows if r.follow_up_completed_date)
	return _result(
		"customer_follow_up",
		_("Customer Follow-Up"),
		f,
		{
			"total": len(rows),
			"vehicles_delivered": delivered,
			"completed": done,
			"outstanding": due,
			"completion_pct": round(100.0 * done / len(rows), 1) if rows else 0,
			"complaints_raised": complaints_raised,
			"complaints_resolved": complaints_resolved,
		},
		[
			{"key": "name", "label": _("Follow Up")},
			{"key": "customer_name", "label": _("Customer")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "vehicle_delivered", "label": _("Delivered")},
			{"key": "job_card", "label": _("Job Card")},
			{"key": "follow_up_due_date", "label": _("Due")},
			{"key": "follow_up_completed_date", "label": _("Completed")},
			{"key": "contact_result", "label": _("Contact Result")},
			{"key": "customer_rating_score", "label": _("Satisfaction")},
			{"key": "complaint_raised", "label": _("Complaint")},
			{"key": "complaint_resolved", "label": _("Complaint Resolved")},
			{"key": "next_service_reminder", "label": _("Next Service")},
		],
		rows,
	)

def get_customer_satisfaction_report(filters=None):
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "Customer Follow Up"):
		return {
			"report_id": "customer_satisfaction",
			"title": _("Customer Satisfaction"),
			"filters": _report_filters_response(f),
			"summary": {"follow_up_count": 0, "avg_rating": 0, "complaints": 0, "issues_resolved": 0},
			"columns": [],
			"rows": [],
		}

	meta = frappe.get_meta("Customer Follow Up")
	fu_filters = {
		"follow_up_completed_date": ["between", [f["from_date"], f["to_date"]]],
	}
	vin_val = _vin_link_filter_value(f)
	vin_field = "vehicle_vin" if meta.has_field("vehicle_vin") else ("vin" if meta.has_field("vin") else None)
	if vin_val is not None and vin_field:
		fu_filters[vin_field] = ["in", vin_val]

	fields = ["name", "job_card", "customer", "customer_rating", "customer_complaint", "issue_resolved"]
	if meta.has_field("customer_rating_score"):
		fields.append("customer_rating_score")
	for optional in (
		"vehicle_vin",
		"nps_score",
		"service_quality_rating",
		"advisor_courtesy_rating",
		"technician_courtesy_rating",
		"timeliness_rating",
		"assigned_to",
	):
		if meta.has_field(optional):
			fields.append(optional)

	follow_ups = frappe.get_all(
		"Customer Follow Up",
		filters=fu_filters,
		fields=fields,
		limit=500,
	)
	if vin_field:
		_apply_vin_numbers(follow_ups, link_field=vin_field, output_field="vin_number")
	else:
		for row in follow_ups:
			row["vin_number"] = ""

	for row in follow_ups:
		score = None
		if meta.has_field("customer_rating_score"):
			raw_score = row.get("customer_rating_score") if isinstance(row, dict) else row.customer_rating_score
			score = _rating_stars(raw_score)
		if score is None:
			raw = row.get("customer_rating") if isinstance(row, dict) else row.customer_rating
			score = _rating_stars(raw)
		if isinstance(row, dict):
			row["rating_stars"] = score
			row["customer_rating_score"] = cint(score) if score is not None else None
		else:
			row.rating_stars = score
			row.customer_rating_score = cint(score) if score is not None else None

	ratings = []
	for r in follow_ups:
		stars = r.get("rating_stars") if isinstance(r, dict) else getattr(r, "rating_stars", None)
		if stars is not None:
			ratings.append(flt(stars))
	avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0
	complaints = sum(1 for r in follow_ups if r.customer_complaint)
	resolved = sum(
		1
		for r in follow_ups
		if str(r.issue_resolved or "").strip().lower() in ("yes", "1", "true")
	)

	vin_sql, vin_params = _vin_sql_clause(f, "COALESCE(cf.vehicle_vin, jc.vehicle_vin)")
	has_score = meta.has_field("customer_rating_score")
	avg_expr = (
		"AVG(NULLIF(cf.customer_rating_score, 0))"
		if has_score
		else "AVG(CAST(SUBSTRING_INDEX(TRIM(cf.customer_rating), ' ', 1) AS DECIMAL(4,2)))"
	)
	rating_filter = (
		"AND IFNULL(cf.customer_rating_score, 0) > 0"
		if has_score
		else "AND cf.customer_rating IS NOT NULL AND TRIM(cf.customer_rating) != ''"
	)
	by_advisor = frappe.db.sql(
		f"""
		SELECT jc.service_advisor,
			{avg_expr} AS avg_rating,
			COUNT(*) AS cnt
		FROM `tabCustomer Follow Up` cf
		LEFT JOIN `tabDMS Job Card` jc ON cf.job_card = jc.name
		WHERE cf.follow_up_completed_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.service_advisor IS NOT NULL
		  {rating_filter}
		  {vin_sql}
		GROUP BY jc.service_advisor
		ORDER BY avg_rating DESC
		LIMIT 20
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
		as_dict=True,
	)

	advisor_map = _bulk_full_names(
		"Service Advisor", [r.service_advisor for r in by_advisor if r.service_advisor]
	)
	for row in by_advisor:
		if row.service_advisor:
			row.service_advisor = advisor_map.get(row.service_advisor, row.service_advisor)
		row.avg_rating = round(flt(row.avg_rating), 2)

	return {
		"report_id": "customer_satisfaction",
		"title": _("Customer Satisfaction"),
		"filters": _report_filters_response(f),
		"summary": {
			"follow_up_count": len(follow_ups),
			"avg_rating": avg_rating,
			"complaints": complaints,
			"issues_resolved": resolved,
			"by_advisor": by_advisor,
		},
		"columns": [
			{"key": "job_card", "label": _("Job Card")},
			{"key": "vin_number", "label": _("VIN")},
			{"key": "customer_rating_score", "label": _("Rating")},
			{"key": "customer_rating", "label": _("Rating label")},
			{"key": "nps_score", "label": _("NPS")},
			{"key": "issue_resolved", "label": _("Resolved")},
			{"key": "customer_complaint", "label": _("Complaint")},
		],
		"rows": follow_ups,
	}

def get_customer_retention_report(filters=None):
	f = _parse_filters(filters)
	vin_sql, vin_params = _vin_sql_clause(f, "vehicle_vin")
	# Customers with more than one job card in period (per VIN when filtered)
	repeat_customers = frappe.db.sql(
		f"""
		SELECT customer, customer_name, vehicle_vin, COUNT(*) AS visit_count,
			SUM(COALESCE(net_amount, total_amount, 0)) AS total_spent
		FROM `tabDMS Job Card`
		WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND customer IS NOT NULL AND customer != ''
		  AND docstatus < 2
		  {vin_sql}
		GROUP BY customer, vehicle_vin
		HAVING COUNT(*) > 1
		ORDER BY visit_count DESC
		LIMIT 100
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
		as_dict=True,
	)
	_apply_vin_numbers(repeat_customers)

	unique_customers = frappe.db.sql(
		f"""
		SELECT COUNT(DISTINCT customer) FROM `tabDMS Job Card`
		WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND customer IS NOT NULL AND docstatus < 2
		  {vin_sql}
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
	)[0][0]

	first_from_appointment = frappe.db.count(
		"Service Appointment",
		{
			"appointment_date_time": ["between", [
				datetime.datetime.combine(f["from_date"], datetime.time.min),
				datetime.datetime.combine(f["to_date"], datetime.time.max),
			]],
			"status": ["in", ["Completed", "In Workshop", "Ready for Pickup"]],
		},
	)

	return {
		"report_id": "customer_retention",
		"title": "Customer Retention",
		"filters": _report_filters_response(f),
		"summary": {
			"unique_customers": int(unique_customers or 0),
			"returning_customers": len(repeat_customers),
			"retention_rate_pct": round(
				(len(repeat_customers) / int(unique_customers)) * 100, 1
			) if unique_customers else 0,
			"completed_appointments": first_from_appointment,
		},
		"columns": [
			{"key": "customer_name", "label": "Customer"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "visit_count", "label": "Visits"},
			{"key": "total_spent", "label": "Total Spent"},
		],
		"rows": repeat_customers,
	}


def get_crm_dashboard(filters=None):
	f = _parse_filters(filters)
	fu = get_customer_follow_up_report(f)
	sat = get_customer_satisfaction_report(f)
	ret = get_customer_retention_report(f)
	return {
		"section_id": "crm",
		"title": _("Customer & CRM"),
		"filters": _report_filters_response(f),
		"summary": {
			"follow_ups": fu["summary"].get("total", 0),
			"outstanding": fu["summary"].get("outstanding", 0),
			"avg_rating": sat["summary"].get("avg_rating", 0),
			"retention_rate_pct": ret["summary"].get("retention_rate_pct", 0),
		},
	}


REPORT_HANDLERS = {
	"customer_follow_up": get_customer_follow_up_report,
	"customer_satisfaction": get_customer_satisfaction_report,
	"customer_retention": get_customer_retention_report,
}
