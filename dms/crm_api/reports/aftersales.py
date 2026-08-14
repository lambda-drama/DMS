# Copyright (c) 2026, Mania and contributors
"""§17.3 Aftersales CRM Dashboard + retention / complaint / fleet reports."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, date_diff, flt, getdate, nowdate

from dms.crm_api.reports.kpis import compute_appendix_b_kpis
from dms.crm_api.reports.common import (
	ACCOUNT,
	ACTIVITY,
	CASE,
	DEFERRED,
	DELIVERY,
	REMINDER,
	SERVICE_DUE,
	age_bucket,
	col,
	creation_between,
	dt_exists,
	group_count,
	parse_crm_filters,
	result,
)

FOLLOW_UP = "Customer Follow Up"
SERVICE_APPOINTMENT = "Service Appointment"
ROW_LIMIT = 2000


def _fields_present(doctype: str, wanted: list[str]) -> list[str]:
	meta = frappe.get_meta(doctype)
	return [f for f in wanted if f == "name" or meta.has_field(f)]


def _branch_filter(f, meta, filt: dict):
	if f.get("branch") and meta.has_field("branch"):
		filt["branch"] = f["branch"]
	if f.get("company") and meta.has_field("company"):
		filt["company"] = f["company"]
	if f.get("model") and meta.has_field("model"):
		filt["model"] = f["model"]
	return filt


def get_crm_aftersales_dashboard(filters=None):
	f = parse_crm_filters(filters)
	summary = {
		"due": 0,
		"overdue": 0,
		"lapsed": 0,
		"reminders": 0,
		"deferred_open": 0,
		"open_cases": 0,
		"csat_avg": 0,
		"by_classification": [],
	}

	if dt_exists(SERVICE_DUE):
		rows = frappe.get_all(
			SERVICE_DUE,
			fields=["name", "classification", "branch", "model"],
			limit=5000,
		)
		if f.get("branch"):
			rows = [r for r in rows if not r.branch or r.branch == f["branch"]]
		if f.get("model"):
			rows = [r for r in rows if not r.model or r.model == f["model"]]
		summary["due"] = sum(1 for r in rows if (r.classification or "") in ("Due", "Upcoming"))
		summary["overdue"] = sum(
			1 for r in rows if (r.classification or "") in ("Overdue", "Severely Overdue")
		)
		summary["lapsed"] = sum(1 for r in rows if (r.classification or "") == "Lapsed")
		summary["by_classification"] = group_count(rows, "classification")

	if dt_exists(REMINDER):
		summary["reminders"] = frappe.db.count(REMINDER, {"creation": creation_between(f)})

	if dt_exists(DEFERRED):
		summary["deferred_open"] = frappe.db.count(
			DEFERRED, {"status": ["in", ["Open", "Follow-Up"]]}
		)

	if dt_exists(CASE):
		summary["open_cases"] = frappe.db.count(
			CASE, {"status": ["not in", ["Resolved", "Closed"]]}
		)

	scores = []
	if dt_exists(FOLLOW_UP):
		meta = frappe.get_meta(FOLLOW_UP)
		fu_fields = ["name"]
		for optional in ("nps_score", "customer_rating_score", "customer_rating", "creation"):
			if meta.has_field(optional):
				fu_fields.append(optional)
		for r in frappe.get_all(
			FOLLOW_UP,
			filters={"creation": creation_between(f)},
			fields=fu_fields,
			limit=3000,
		):
			val = r.get("nps_score") or r.get("customer_rating_score") or r.get("customer_rating")
			if val is not None and str(val).strip() != "":
				try:
					scores.append(flt(str(val).split("-")[0].strip()))
				except Exception:
					pass
	elif dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		if meta.has_field("post_resolution_satisfaction"):
			for r in frappe.get_all(
				CASE,
				filters={
					"creation": creation_between(f),
					"post_resolution_satisfaction": ["is", "set"],
				},
				fields=["post_resolution_satisfaction"],
				limit=2000,
			):
				scores.append(flt(r.post_resolution_satisfaction))
	elif dt_exists(DELIVERY):
		for r in frappe.get_all(
			DELIVERY,
			filters={"creation": creation_between(f), "satisfaction_score": ["is", "set"]},
			fields=["satisfaction_score"],
			limit=2000,
		):
			scores.append(flt(r.satisfaction_score))

	summary["csat_avg"] = round(sum(scores) / len(scores), 2) if scores else 0

	pack = compute_appendix_b_kpis(filters)
	for key in (
		"appointment_show_rate_pct",
		"service_retention_pct",
		"reminder_booking_rate_pct",
		"lapsed_recovery_rate_pct",
		"complaint_sla_compliance_pct",
		"first_contact_resolution_pct",
	):
		summary[key] = (pack.get("summary") or {}).get(key) or 0

	return {
		"section_id": "crm_aftersales",
		"title": _("Aftersales CRM"),
		"filters": {
			"from_date": str(f["from_date"]),
			"to_date": str(f["to_date"]),
		},
		"summary": summary,
	}


def _service_due_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Service Due classifications: Upcoming / Due / Overdue / Severely Overdue / Lapsed / Recovered / Inactive / Vehicle Sold / Unreachable. "
		"Filter by branch and model when present."
	)
	rows = []
	if dt_exists(SERVICE_DUE):
		meta = frappe.get_meta(SERVICE_DUE)
		fields = _fields_present(
			SERVICE_DUE,
			[
				"name",
				"customer",
				"vin",
				"classification",
				"status",
				"due_date",
				"effective_due_date",
				"branch",
				"model",
				"is_fleet",
				"service_appointment",
				"last_reminder_on",
			],
		)
		filt = {}
		_branch_filter(f, meta, filt)
		for r in frappe.get_all(
			SERVICE_DUE,
			filters=filt or None,
			fields=fields,
			order_by="due_date asc",
			limit=ROW_LIMIT,
		):
			rows.append(
				{
					"name": r.name,
					"customer": r.get("customer"),
					"vin": r.get("vin"),
					"classification": r.get("classification"),
					"status": r.get("status"),
					"due_date": str(r.get("due_date") or r.get("effective_due_date") or ""),
					"branch": r.get("branch"),
					"model": r.get("model"),
					"is_fleet": cint(r.get("is_fleet")),
					"appointment": r.get("service_appointment"),
					"last_reminder": str(r.get("last_reminder_on") or "")[:16],
					"_drill": {"view": "crm-service-due-detail", "params": {"name": r.name}},
				}
			)
	return result(
		"crm_service_due",
		_("Service Due & Overdue"),
		f,
		{
			"total": len(rows),
			"due": sum(1 for r in rows if (r["classification"] or "") in ("Due", "Upcoming")),
			"overdue": sum(
				1 for r in rows if (r["classification"] or "") in ("Overdue", "Severely Overdue")
			),
			"lapsed": sum(1 for r in rows if (r["classification"] or "") == "Lapsed"),
			"by_classification": group_count(rows, "classification"),
		},
		[
			col("name", "Service Due"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("classification", "Class"),
			col("status", "Status"),
			col("due_date", "Due"),
			col("branch", "Branch"),
			col("model", "Model"),
			col("is_fleet", "Fleet"),
			col("appointment", "Appointment"),
			col("last_reminder", "Last Reminder"),
		],
		rows,
		help_text=help_text,
	)


def _reminder_conversion_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Appendix B Reminder Booking Rate = appointments booked / customers successfully contacted × 100. "
		"Contacted = reminder status Sent/Delivered/Completed; booked = that customer has a service appointment."
	)
	rows = []
	booked = 0
	contacted = 0
	if dt_exists(REMINDER):
		fields = _fields_present(
			REMINDER,
			[
				"name",
				"service_due",
				"customer",
				"vin",
				"step_key",
				"label",
				"channel",
				"status",
				"sent_on",
				"activity",
				"creation",
			],
		)
		reminders = frappe.get_all(
			REMINDER,
			filters={"creation": creation_between(f)},
			fields=fields,
			order_by="creation desc",
			limit=ROW_LIMIT,
		)
		due_names = list({r.service_due for r in reminders if r.get("service_due")})
		appt_map = {}
		if due_names and dt_exists(SERVICE_DUE):
			for sd in frappe.get_all(
				SERVICE_DUE,
				filters={"name": ["in", due_names]},
				fields=["name", "service_appointment", "classification"],
			):
				appt_map[sd.name] = sd
		for r in reminders:
			sd = appt_map.get(r.get("service_due") or "")
			has_appt = bool(sd and sd.get("service_appointment"))
			st = (r.get("status") or "").lower()
			is_contacted = st in ("sent", "delivered", "completed", "answered", "connected")
			if is_contacted:
				contacted += 1
			if has_appt:
				booked += 1
			rows.append(
				{
					"name": r.name,
					"customer": r.get("customer"),
					"vin": r.get("vin"),
					"step": r.get("label") or r.get("step_key"),
					"channel": r.get("channel"),
					"status": r.get("status"),
					"sent_on": str(r.get("sent_on") or r.creation)[:16],
					"service_due": r.get("service_due"),
					"booked": "Yes" if has_appt else "No",
					"classification": sd.classification if sd else "",
					"_drill": {"view": "crm-reminder-log-detail", "params": {"name": r.name}},
				}
			)
	total = len(rows) or 1
	from dms.crm_api.reports.kpis import compute_appendix_b_kpis

	pack = compute_appendix_b_kpis(filters)
	kpi = next((k for k in pack["kpis"] if k["id"] == "reminder_booking_rate_pct"), {})
	return result(
		"crm_reminder_conversion",
		_("Reminder → Booking"),
		f,
		{
			"total": len(rows),
			"contacted": kpi.get("denominator") or contacted,
			"booked": kpi.get("numerator") or booked,
			"contact_rate_pct": round(100.0 * contacted / total, 1) if rows else 0,
			"booking_conversion_pct": kpi.get("value") or 0,
			"reminder_booking_rate_pct": kpi.get("value") or 0,
			"by_channel": group_count(rows, "channel"),
			"by_status": group_count(rows, "status"),
		},
		[
			col("name", "Reminder"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("step", "Step"),
			col("channel", "Channel"),
			col("status", "Status"),
			col("sent_on", "Sent"),
			col("service_due", "Service Due"),
			col("booked", "Booked"),
			col("classification", "Class"),
		],
		rows,
		help_text=help_text,
		definitions={
			"reminder_booking_rate_pct": "Customers with appointment / customers successfully contacted × 100",
			"booking_conversion_pct": "Same as Appendix B reminder booking rate",
		},
	)


def _appointment_capacity_report(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	show = next((k for k in pack["kpis"] if k["id"] == "appointment_show_rate_pct"), {})
	help_text = _(
		"Appendix B Appointment Show Rate = arrived appointments / confirmed appointments × 100 "
		"(Service Appointment + CRM Sales Appointment). Capacity minutes come from slot duration."
	)
	rows = []
	dt = None
	if dt_exists(SERVICE_APPOINTMENT):
		dt = SERVICE_APPOINTMENT
	elif dt_exists(ACTIVITY):
		dt = ACTIVITY

	if dt:
		meta = frappe.get_meta(dt)
		fields = ["name", "status", "creation"]
		for optional in (
			"customer",
			"customer_name",
			"branch",
			"appointment_date_time",
			"slot_duration_minutes",
			"estimated_duration_hours",
			"booking_agent",
			"subject",
			"activity_type",
			"disposition",
			"due_datetime",
			"no_show_reason",
		):
			if meta.has_field(optional):
				fields.append(optional)
		filt = {"creation": creation_between(f)}
		_branch_filter(f, meta, filt)
		if dt == ACTIVITY and meta.has_field("activity_type"):
			filt["activity_type"] = ["in", ["Appointment", "Meeting", "Service Appointment"]]
		for r in frappe.get_all(
			dt, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
		):
			status = r.get("status") or ""
			mins = cint(r.get("slot_duration_minutes") or 0)
			if not mins and r.get("estimated_duration_hours"):
				mins = int(flt(r.estimated_duration_hours) * 60)
			rows.append(
				{
					"name": r.name,
					"customer": r.get("customer_name") or r.get("customer"),
					"branch": r.get("branch"),
					"status": status,
					"slot_minutes": mins,
					"agent": r.get("booking_agent") or r.get("assigned_to"),
					"date": str(
						r.get("appointment_date_time") or r.get("due_datetime") or r.creation
					)[:16],
					"no_show_reason": r.get("no_show_reason") or r.get("disposition"),
					"_drill": {
						"view": "service-appointment-detail"
						if dt == SERVICE_APPOINTMENT
						else "crm-activity-detail",
						"params": {"name": r.name},
					},
				}
			)

	cancelled = sum(1 for r in rows if (r["status"] or "") in ("Cancelled", "Rescheduled"))
	no_shows = sum(1 for r in rows if (r["status"] or "") == "No-Show")
	completed = sum(1 for r in rows if (r["status"] or "") == "Completed")
	total_mins = sum(r["slot_minutes"] for r in rows)
	return result(
		"crm_appointment_capacity",
		_("Appointment Capacity"),
		f,
		{
			"total": len(rows),
			"completed": completed,
			"cancelled": cancelled,
			"no_shows": no_shows,
			"no_show_pct": round(100.0 * no_shows / len(rows), 1) if rows else 0,
			"cancel_pct": round(100.0 * cancelled / len(rows), 1) if rows else 0,
			"appointment_show_rate_pct": show.get("value") or 0,
			"arrived": show.get("numerator") or 0,
			"confirmed": show.get("denominator") or 0,
			"scheduled_minutes": total_mins,
			"by_status": group_count(rows, "status"),
			"by_branch": group_count(rows, "branch"),
		},
		[
			col("name", "Appointment"),
			col("customer", "Customer"),
			col("branch", "Branch"),
			col("status", "Status"),
			col("slot_minutes", "Slot (min)"),
			col("agent", "Agent"),
			col("date", "Date"),
			col("no_show_reason", "Reason"),
		],
		rows,
		help_text=help_text,
		definitions={
			"appointment_show_rate_pct": "Arrived / confirmed appointments × 100",
		},
	)


def _workshop_followup_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Post-workshop follow-up from Customer Follow Up when installed; else CRM Activities "
		"linked to a job_card. Completion = follow_up_completed_date or status Completed."
	)
	rows = []
	if dt_exists(FOLLOW_UP):
		fields = _fields_present(
			FOLLOW_UP,
			[
				"name",
				"customer",
				"job_card",
				"vehicle_vin",
				"follow_up_due_date",
				"follow_up_completed_date",
				"assigned_to",
				"contact_status",
				"customer_rating",
				"customer_rating_score",
				"nps_score",
				"case_status",
				"creation",
			],
		)
		for r in frappe.get_all(
			FOLLOW_UP,
			filters={"creation": creation_between(f)},
			fields=fields,
			order_by="follow_up_due_date desc",
			limit=ROW_LIMIT,
		):
			done = bool(r.get("follow_up_completed_date"))
			rows.append(
				{
					"name": r.name,
					"customer": r.get("customer"),
					"job_card": r.get("job_card"),
					"vin": r.get("vehicle_vin"),
					"due": str(r.get("follow_up_due_date") or ""),
					"completed": str(r.get("follow_up_completed_date") or ""),
					"status": "Completed" if done else (r.get("contact_status") or "Open"),
					"owner": r.get("assigned_to"),
					"rating": r.get("customer_rating_score") or r.get("customer_rating"),
					"nps": r.get("nps_score"),
					"_drill": {"view": "customer-follow-up-detail", "params": {"name": r.name}},
				}
			)
	elif dt_exists(ACTIVITY):
		meta = frappe.get_meta(ACTIVITY)
		filt = {"creation": creation_between(f)}
		if meta.has_field("job_card"):
			filt["job_card"] = ["is", "set"]
		elif meta.has_field("activity_type"):
			filt["activity_type"] = ["in", ["Follow Up", "Follow-Up", "Call"]]
		fields = _fields_present(
			ACTIVITY,
			[
				"name",
				"subject",
				"customer",
				"job_card",
				"vehicle_vin",
				"status",
				"assigned_to",
				"due_datetime",
				"completed_on",
				"disposition",
			],
		)
		for r in frappe.get_all(
			ACTIVITY, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
		):
			rows.append(
				{
					"name": r.name,
					"customer": r.get("customer"),
					"job_card": r.get("job_card"),
					"vin": r.get("vehicle_vin"),
					"due": str(r.get("due_datetime") or "")[:16],
					"completed": str(r.get("completed_on") or "")[:16],
					"status": r.get("status"),
					"owner": r.get("assigned_to"),
					"rating": None,
					"nps": None,
					"_drill": {"view": "crm-activity-detail", "params": {"name": r.name}},
				}
			)

	done = sum(1 for r in rows if r.get("completed") or (r.get("status") or "") == "Completed")
	return result(
		"crm_workshop_followup",
		_("Workshop Follow-Up"),
		f,
		{
			"total": len(rows),
			"completed": done,
			"outstanding": len(rows) - done,
			"completion_pct": round(100.0 * done / len(rows), 1) if rows else 0,
			"by_status": group_count(rows, "status"),
		},
		[
			col("name", "Follow Up"),
			col("customer", "Customer"),
			col("job_card", "Job Card"),
			col("vin", "VIN"),
			col("due", "Due"),
			col("completed", "Completed"),
			col("status", "Status"),
			col("owner", "Owner"),
			col("rating", "Rating"),
			col("nps", "NPS"),
		],
		rows,
		help_text=help_text,
	)


def _service_retention_cohort_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Retention cohort by due-month × model × branch. "
		"Appendix B: retained = eligible due vehicles that returned (appointment / Recovered) "
		"÷ eligible vehicles due (Upcoming / Due / Overdue / Severely Overdue)."
	)
	rows = []
	if dt_exists(SERVICE_DUE):
		fields = _fields_present(
			SERVICE_DUE,
			[
				"name",
				"customer",
				"vin",
				"classification",
				"due_date",
				"branch",
				"model",
				"service_appointment",
				"lifecycle_stage",
			],
		)
		meta = frappe.get_meta(SERVICE_DUE)
		filt = {}
		_branch_filter(f, meta, filt)
		raw = frappe.get_all(SERVICE_DUE, filters=filt or None, fields=fields, limit=ROW_LIMIT)
		buckets: dict[tuple, dict] = {}
		for r in raw:
			cohort = str(r.get("due_date") or "")[:7] or "Unscheduled"
			key = (cohort, r.get("branch") or "—", r.get("model") or "—")
			b = buckets.setdefault(
				key,
				{
					"cohort": cohort,
					"branch": key[1],
					"model": key[2],
					"total": 0,
					"retained": 0,
					"overdue": 0,
					"lapsed": 0,
					"booked": 0,
				},
			)
			cls = r.get("classification") or ""
			returned = bool(r.get("service_appointment")) or cls == "Recovered"
			if cls in ("Upcoming", "Due", "Overdue", "Severely Overdue"):
				b["total"] += 1
				if returned:
					b["retained"] += 1
			if cls in ("Overdue", "Severely Overdue"):
				b["overdue"] += 1
			elif cls == "Lapsed":
				b["lapsed"] += 1
			if r.get("service_appointment"):
				b["booked"] += 1
		for b in buckets.values():
			b["retention_pct"] = round(100.0 * b["retained"] / b["total"], 1) if b["total"] else 0
			rows.append(b)
		rows.sort(key=lambda x: (x["cohort"], x["branch"], x["model"]))

	pack = compute_appendix_b_kpis(filters)
	retention = next((k for k in pack["kpis"] if k["id"] == "service_retention_pct"), {})
	return result(
		"crm_service_retention_cohort",
		_("Service Retention Cohort"),
		f,
		{
			"total_cohorts": len(rows),
			"vehicles": retention.get("denominator") or sum(r["total"] for r in rows),
			"retained": retention.get("numerator") or sum(r["retained"] for r in rows),
			"avg_retention_pct": retention.get("value") or (
				round(sum(r["retention_pct"] for r in rows) / len(rows), 1) if rows else 0
			),
			"service_retention_pct": retention.get("value") or 0,
		},
		[
			col("cohort", "Cohort (month)"),
			col("branch", "Branch"),
			col("model", "Model"),
			col("total", "Vehicles"),
			col("retained", "Retained"),
			col("overdue", "Overdue"),
			col("lapsed", "Lapsed"),
			col("booked", "Booked"),
			col("retention_pct", "Retention %"),
		],
		rows,
		help_text=help_text,
		definitions={
			"service_retention_pct": "Eligible vehicles returning / eligible vehicles due × 100",
		},
	)


def _lapsed_recovery_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Appendix B: Recovered customers / lapsed customers targeted × 100. "
		"Recovered = classification Recovered (or Lapsed with a service appointment). "
		"Targeted = lapsed/recovered records that were reminded."
	)
	rows = []
	if dt_exists(SERVICE_DUE):
		meta = frappe.get_meta(SERVICE_DUE)
		filt = {"classification": ["in", ["Lapsed", "Recovered"]]}
		_branch_filter(f, meta, filt)
		fields = _fields_present(
			SERVICE_DUE,
			[
				"name",
				"customer",
				"vin",
				"due_date",
				"branch",
				"model",
				"status",
				"classification",
				"service_appointment",
				"last_reminder_on",
				"last_reminder_step",
				"modified",
			],
		)
		lapsed = frappe.get_all(
			SERVICE_DUE, filters=filt, fields=fields, order_by="due_date asc", limit=ROW_LIMIT
		)
		reminder_by_due = {}
		if dt_exists(REMINDER) and lapsed:
			names = [r.name for r in lapsed]
			for rem in frappe.get_all(
				REMINDER,
				filters={"service_due": ["in", names], "creation": creation_between(f)},
				fields=["service_due", "status", "channel", "sent_on"],
				limit=ROW_LIMIT,
			):
				reminder_by_due.setdefault(rem.service_due, []).append(rem)
		for r in lapsed:
			rems = reminder_by_due.get(r.name) or []
			recovered = (r.get("classification") or "") == "Recovered" or bool(
				r.get("service_appointment")
			)
			rows.append(
				{
					"name": r.name,
					"customer": r.get("customer"),
					"vin": r.get("vin"),
					"due_date": str(r.get("due_date") or ""),
					"branch": r.get("branch"),
					"model": r.get("model"),
					"status": r.get("status"),
					"reminders": len(rems),
					"last_reminder": str(r.get("last_reminder_on") or "")[:16],
					"recovered": "Yes" if recovered else "No",
					"appointment": r.get("service_appointment"),
					"_drill": {"view": "crm-service-due-detail", "params": {"name": r.name}},
				}
			)
	from dms.crm_api.reports.kpis import compute_appendix_b_kpis

	pack = compute_appendix_b_kpis(filters)
	kpi = next((k for k in pack["kpis"] if k["id"] == "lapsed_recovery_rate_pct"), {})
	recovered_n = kpi.get("numerator") or sum(1 for r in rows if r["recovered"] == "Yes")
	return result(
		"crm_lapsed_recovery",
		_("Lapsed Customer Recovery"),
		f,
		{
			"total": len(rows),
			"with_reminders": sum(1 for r in rows if r["reminders"]),
			"recovered": recovered_n,
			"targeted": kpi.get("denominator") or len(rows),
			"recovery_pct": kpi.get("value") or 0,
			"lapsed_recovery_rate_pct": kpi.get("value") or 0,
		},
		[
			col("name", "Service Due"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("due_date", "Due"),
			col("branch", "Branch"),
			col("model", "Model"),
			col("reminders", "Reminders"),
			col("last_reminder", "Last Reminder"),
			col("recovered", "Recovered"),
			col("appointment", "Appointment"),
		],
		rows,
		help_text=help_text,
	)


def _deferred_work_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Deferred-work conversion = Completed with recovered_value ÷ Open+Follow-Up+Completed. "
		"Quoted value = estimated_value; conversion value = recovered_value."
	)
	rows = []
	if dt_exists(DEFERRED):
		meta = frappe.get_meta(DEFERRED)
		filt = {"creation": creation_between(f)}
		_branch_filter(f, meta, filt)
		fields = _fields_present(
			DEFERRED,
			[
				"name",
				"title",
				"customer",
				"vin",
				"category",
				"urgency",
				"status",
				"estimated_value",
				"recovered_value",
				"expiry_date",
				"next_follow_up",
				"job_card",
				"closed_on",
			],
		)
		for r in frappe.get_all(
			DEFERRED, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
		):
			est = flt(r.get("estimated_value"))
			rec = flt(r.get("recovered_value"))
			rows.append(
				{
					"name": r.name,
					"title": r.get("title") or r.name,
					"customer": r.get("customer"),
					"vin": r.get("vin"),
					"category": r.get("category"),
					"urgency": r.get("urgency"),
					"status": r.get("status"),
					"estimated_value": est,
					"recovered_value": rec,
					"conversion_pct": round(100.0 * rec / est, 1) if est else 0,
					"expiry": str(r.get("expiry_date") or ""),
					"next_follow_up": str(r.get("next_follow_up") or ""),
					"job_card": r.get("job_card"),
					"_drill": {"view": "crm-deferred-work-detail", "params": {"name": r.name}},
				}
			)
	open_n = sum(1 for r in rows if (r["status"] or "") in ("Open", "Follow-Up"))
	completed = sum(1 for r in rows if (r["status"] or "") == "Completed")
	est_total = sum(r["estimated_value"] for r in rows)
	rec_total = sum(r["recovered_value"] for r in rows)
	return result(
		"crm_deferred_work",
		_("Deferred-Work Conversion"),
		f,
		{
			"total": len(rows),
			"open": open_n,
			"completed": completed,
			"estimated_value": round(est_total, 2),
			"recovered_value": round(rec_total, 2),
			"conversion_pct": round(100.0 * rec_total / est_total, 1) if est_total else 0,
			"by_status": group_count(rows, "status"),
			"by_category": group_count(rows, "category"),
		},
		[
			col("name", "Deferred Work"),
			col("title", "Title"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("category", "Category"),
			col("urgency", "Urgency"),
			col("status", "Status"),
			col("estimated_value", "Quoted"),
			col("recovered_value", "Recovered"),
			col("conversion_pct", "Conv %"),
			col("expiry", "Expiry"),
			col("next_follow_up", "Next FU"),
		],
		rows,
		help_text=help_text,
	)


def _csat_nps_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"CSAT / NPS from Customer Follow Up (nps_score, customer_rating), Case "
		"post_resolution_satisfaction, and Delivery satisfaction_score. "
		"NPS promoters ≥9, detractors ≤6; CSAT avg on 1–5 or raw score."
	)
	rows = []

	def _add(source, name, customer, score, nps, date, drill_view):
		rows.append(
			{
				"source": source,
				"name": name,
				"customer": customer,
				"score": score,
				"nps": nps,
				"date": date,
				"_drill": {"view": drill_view, "params": {"name": name}},
			}
		)

	if dt_exists(FOLLOW_UP):
		fields = _fields_present(
			FOLLOW_UP,
			[
				"name",
				"customer",
				"nps_score",
				"customer_rating",
				"customer_rating_score",
				"follow_up_completed_date",
				"creation",
			],
		)
		for r in frappe.get_all(
			FOLLOW_UP,
			filters={"creation": creation_between(f)},
			fields=fields,
			limit=ROW_LIMIT,
		):
			score = r.get("customer_rating_score") or r.get("customer_rating")
			nps = r.get("nps_score")
			if score is None and nps is None:
				continue
			try:
				score_n = flt(str(score).split("-")[0].strip()) if score is not None else None
			except Exception:
				score_n = None
			_add(
				"Follow Up",
				r.name,
				r.get("customer"),
				score_n,
				flt(nps) if nps is not None else None,
				str(r.get("follow_up_completed_date") or r.creation)[:16],
				"customer-follow-up-detail",
			)

	if dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		if meta.has_field("post_resolution_satisfaction"):
			for r in frappe.get_all(
				CASE,
				filters={
					"creation": creation_between(f),
					"post_resolution_satisfaction": ["is", "set"],
				},
				fields=["name", "customer", "post_resolution_satisfaction", "modified"],
				limit=ROW_LIMIT,
			):
				_add(
					"Case",
					r.name,
					r.customer,
					flt(r.post_resolution_satisfaction),
					None,
					str(r.modified)[:16],
					"crm-case-detail",
				)

	if dt_exists(DELIVERY):
		for r in frappe.get_all(
			DELIVERY,
			filters={"creation": creation_between(f), "satisfaction_score": ["is", "set"]},
			fields=["name", "customer", "satisfaction_score", "modified"],
			limit=ROW_LIMIT,
		):
			_add(
				"Delivery",
				r.name,
				r.customer,
				flt(r.satisfaction_score),
				None,
				str(r.modified)[:16],
				"crm-delivery-readiness-detail",
			)

	csat_scores = [flt(r["score"]) for r in rows if r.get("score") is not None]
	nps_scores = [flt(r["nps"]) for r in rows if r.get("nps") is not None]
	promoters = sum(1 for n in nps_scores if n >= 9)
	detractors = sum(1 for n in nps_scores if n <= 6)
	nps_pct = round(100.0 * (promoters - detractors) / len(nps_scores), 1) if nps_scores else 0
	return result(
		"crm_csat_nps",
		_("CSAT / NPS / CSI"),
		f,
		{
			"total": len(rows),
			"csat_avg": round(sum(csat_scores) / len(csat_scores), 2) if csat_scores else 0,
			"nps_avg": round(sum(nps_scores) / len(nps_scores), 2) if nps_scores else 0,
			"nps_pct": nps_pct,
			"promoters": promoters,
			"detractors": detractors,
			"by_source": group_count(rows, "source"),
		},
		[
			col("source", "Source"),
			col("name", "Ref"),
			col("customer", "Customer"),
			col("score", "CSAT"),
			col("nps", "NPS"),
			col("date", "Date"),
		],
		rows[:ROW_LIMIT],
		help_text=help_text,
		definitions={
			"nps_pct": "(Promoters − Detractors) ÷ responses × 100; promoters ≥9, detractors ≤6",
			"csat_avg": "Average of available satisfaction scores across sources",
		},
	)


def _complaint_aging_report(filters=None):
	f = parse_crm_filters(filters)
	pack = compute_appendix_b_kpis(filters)
	sla = next((k for k in pack["kpis"] if k["id"] == "complaint_sla_compliance_pct"), {})
	fcr = next((k for k in pack["kpis"] if k["id"] == "first_contact_resolution_pct"), {})
	help_text = _(
		"Appendix B Complaint SLA = cases resolved within SLA / resolved cases × 100. "
		"Table lists open Cases aged from opened_on/creation for operational follow-up."
	)
	rows = []
	today = getdate(nowdate())
	if dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		filt = {"status": ["not in", ["Resolved", "Closed"]]}
		_branch_filter(f, meta, filt)
		fields = _fields_present(
			CASE,
			[
				"name",
				"subject",
				"status",
				"priority",
				"category",
				"customer",
				"case_owner",
				"branch",
				"opened_on",
				"creation",
				"sla_breached",
				"response_breached",
				"resolution_breached",
				"response_deadline",
				"resolution_target",
			],
		)
		for r in frappe.get_all(
			CASE, filters=filt, fields=fields, order_by="creation asc", limit=ROW_LIMIT
		):
			opened = getdate(r.get("opened_on") or r.creation)
			days = date_diff(today, opened) if opened else 0
			breached = bool(
				cint(r.get("sla_breached"))
				or cint(r.get("response_breached"))
				or cint(r.get("resolution_breached"))
			)
			rows.append(
				{
					"name": r.name,
					"subject": r.get("subject"),
					"status": r.get("status"),
					"priority": r.get("priority"),
					"category": r.get("category"),
					"customer": r.get("customer"),
					"owner": r.get("case_owner"),
					"branch": r.get("branch"),
					"age_days": days,
					"age_bucket": age_bucket(days),
					"sla_breached": "Yes" if breached else "No",
					"_drill": {"view": "crm-case-detail", "params": {"name": r.name}},
				}
			)
	return result(
		"crm_complaint_aging",
		_("Complaint Aging & SLA"),
		f,
		{
			"total": len(rows),
			"breached": sum(1 for r in rows if r["sla_breached"] == "Yes"),
			"avg_age_days": round(sum(r["age_days"] for r in rows) / len(rows), 1) if rows else 0,
			"complaint_sla_compliance_pct": sla.get("value") or 0,
			"first_contact_resolution_pct": fcr.get("value") or 0,
			"resolved_within_sla": sla.get("numerator") or 0,
			"resolved_cases": sla.get("denominator") or 0,
			"by_age_bucket": group_count(rows, "age_bucket"),
			"by_priority": group_count(rows, "priority"),
		},
		[
			col("name", "Case"),
			col("subject", "Subject"),
			col("status", "Status"),
			col("priority", "Priority"),
			col("category", "Category"),
			col("customer", "Customer"),
			col("owner", "Owner"),
			col("age_days", "Age (days)"),
			col("age_bucket", "Bucket"),
			col("sla_breached", "SLA Breach"),
		],
		rows,
		help_text=help_text,
		definitions={
			"complaint_sla_compliance_pct": "Resolved within SLA / resolved cases × 100",
			"first_contact_resolution_pct": "Resolved without escalation / total cases × 100",
		},
	)


def _repeat_complaint_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Repeat complaints = same customer with ≥2 Cases in period (or reopened_on set). "
		"Comeback flag when case links a job_card and customer has prior open/closed case."
	)
	rows = []
	if dt_exists(CASE):
		meta = frappe.get_meta(CASE)
		filt = {"creation": creation_between(f)}
		_branch_filter(f, meta, filt)
		fields = _fields_present(
			CASE,
			[
				"name",
				"subject",
				"status",
				"customer",
				"vehicle_vin",
				"job_card",
				"category",
				"reopened_on",
				"reopen_reason",
				"creation",
				"branch",
			],
		)
		cases = frappe.get_all(
			CASE, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
		)
		by_customer: dict[str, list] = {}
		for c in cases:
			if c.get("customer"):
				by_customer.setdefault(c.customer, []).append(c)
		for customer, clist in by_customer.items():
			if len(clist) < 2 and not any(c.get("reopened_on") for c in clist):
				continue
			for c in clist:
				rows.append(
					{
						"name": c.name,
						"customer": customer,
						"subject": c.get("subject"),
						"status": c.get("status"),
						"vin": c.get("vehicle_vin"),
						"job_card": c.get("job_card"),
						"category": c.get("category"),
						"case_count": len(clist),
						"reopened": "Yes" if c.get("reopened_on") else "No",
						"reopen_reason": c.get("reopen_reason"),
						"created": str(c.creation)[:16],
						"_drill": {"view": "crm-case-detail", "params": {"name": c.name}},
					}
				)
	return result(
		"crm_repeat_complaint",
		_("Repeat Complaint / Comeback"),
		f,
		{
			"total": len(rows),
			"customers": len({r["customer"] for r in rows}),
			"reopened": sum(1 for r in rows if r["reopened"] == "Yes"),
			"by_category": group_count(rows, "category"),
		},
		[
			col("name", "Case"),
			col("customer", "Customer"),
			col("subject", "Subject"),
			col("status", "Status"),
			col("vin", "VIN"),
			col("job_card", "Job Card"),
			col("category", "Category"),
			col("case_count", "Cases"),
			col("reopened", "Reopened"),
			col("created", "Created"),
		],
		rows,
		help_text=help_text,
	)


def _next_service_at_delivery_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Deliveries in period checked for next-service booking: welcome_activity set, "
		"or matching Service Due with service_appointment for the same customer/VIN."
	)
	rows = []
	if dt_exists(DELIVERY):
		meta = frappe.get_meta(DELIVERY)
		filt = {"creation": creation_between(f)}
		_branch_filter(f, meta, filt)
		fields = _fields_present(
			DELIVERY,
			[
				"name",
				"customer",
				"opportunity",
				"booking",
				"vehicle_vin",
				"status",
				"handover_on",
				"welcome_activity",
				"satisfaction_score",
				"branch",
				"creation",
			],
		)
		dels = frappe.get_all(
			DELIVERY, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
		)
		vins = [d.vehicle_vin for d in dels if d.get("vehicle_vin")]
		customers = [d.customer for d in dels if d.get("customer")]
		sd_by_vin = {}
		sd_by_cust = {}
		if dt_exists(SERVICE_DUE) and (vins or customers):
			sd_fields = _fields_present(
				SERVICE_DUE,
				["name", "vin", "customer", "service_appointment", "due_date", "classification"],
			)
			seen_sd = set()
			batches = []
			if vins:
				batches.append({"vin": ["in", vins]})
			if customers:
				batches.append({"customer": ["in", customers]})
			for bf in batches:
				for sd in frappe.get_all(
					SERVICE_DUE, filters=bf, fields=sd_fields, limit=ROW_LIMIT
				):
					if sd.name in seen_sd:
						continue
					seen_sd.add(sd.name)
					if sd.get("vin"):
						sd_by_vin[sd.vin] = sd
					if sd.get("customer"):
						sd_by_cust.setdefault(sd.customer, sd)
		for d in dels:
			sd = sd_by_vin.get(d.get("vehicle_vin")) or sd_by_cust.get(d.get("customer"))
			booked = bool(d.get("welcome_activity") or (sd and sd.get("service_appointment")))
			rows.append(
				{
					"name": d.name,
					"customer": d.get("customer"),
					"vin": d.get("vehicle_vin"),
					"status": d.get("status"),
					"handover": str(d.get("handover_on") or "")[:16],
					"welcome_activity": d.get("welcome_activity"),
					"service_due": sd.name if sd else "",
					"next_due": str(sd.due_date) if sd and sd.get("due_date") else "",
					"appointment": sd.service_appointment if sd else "",
					"booked": "Yes" if booked else "No",
					"satisfaction": d.get("satisfaction_score"),
					"_drill": {"view": "crm-delivery-readiness-detail", "params": {"name": d.name}},
				}
			)
	booked_n = sum(1 for r in rows if r["booked"] == "Yes")
	return result(
		"crm_next_service_at_delivery",
		_("Next-Service at Delivery"),
		f,
		{
			"total": len(rows),
			"booked": booked_n,
			"booking_pct": round(100.0 * booked_n / len(rows), 1) if rows else 0,
		},
		[
			col("name", "Delivery"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("status", "Status"),
			col("handover", "Handover"),
			col("welcome_activity", "Welcome Activity"),
			col("service_due", "Service Due"),
			col("next_due", "Next Due"),
			col("appointment", "Appointment"),
			col("booked", "Booked"),
			col("satisfaction", "Satisfaction"),
		],
		rows,
		help_text=help_text,
	)


def _fleet_maintenance_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Fleet maintenance compliance from Account fleet_units and Service Due where "
		"is_fleet=1 or customer is linked to a DMS CRM Account. Compliance = not Overdue/Lapsed."
	)
	rows = []
	fleet_customers = set()
	if dt_exists(ACCOUNT):
		accounts = frappe.get_all(
			ACCOUNT,
			fields=["name", "account_name", "customer", "branch", "fleet_size", "company"],
			limit=1000,
		)
		if f.get("branch"):
			accounts = [a for a in accounts if not a.branch or a.branch == f["branch"]]
		if f.get("company"):
			accounts = [a for a in accounts if not a.company or a.company == f["company"]]
		for a in accounts:
			if a.get("customer"):
				fleet_customers.add(a.customer)
			# Expand child fleet units when table exists
			if dt_exists("DMS CRM Account Fleet Unit"):
				try:
					units = frappe.get_all(
						"DMS CRM Account Fleet Unit",
						filters={"parent": a.name},
						fields=["vehicle_vin", "model", "model_name", "quantity"],
						limit=500,
					)
				except Exception:
					units = []
				for u in units:
					rows.append(
						{
							"account": a.name,
							"account_name": a.account_name or a.name,
							"customer": a.customer,
							"vin": u.get("vehicle_vin"),
							"model": u.get("model_name") or u.get("model"),
							"quantity": cint(u.get("quantity") or 1),
							"source": "Fleet Unit",
							"classification": "",
							"due_date": "",
							"compliant": "",
							"_drill": {"view": "crm-account-detail", "params": {"name": a.name}},
						}
					)

	if dt_exists(SERVICE_DUE):
		meta = frappe.get_meta(SERVICE_DUE)
		filt = {}
		if meta.has_field("is_fleet"):
			filt["is_fleet"] = 1
		_branch_filter(f, meta, filt)
		fields = _fields_present(
			SERVICE_DUE,
			[
				"name",
				"customer",
				"vin",
				"classification",
				"due_date",
				"branch",
				"model",
				"is_fleet",
				"service_appointment",
				"status",
			],
		)
		sd_rows = frappe.get_all(
			SERVICE_DUE, filters=filt or None, fields=fields, limit=ROW_LIMIT
		)
		if not filt.get("is_fleet") and fleet_customers:
			extra = frappe.get_all(
				SERVICE_DUE,
				filters={"customer": ["in", list(fleet_customers)]},
				fields=fields,
				limit=ROW_LIMIT,
			)
			seen = {r.name for r in sd_rows}
			for e in extra:
				if e.name not in seen:
					sd_rows.append(e)
		elif fleet_customers and filt.get("is_fleet"):
			# also include fleet-account customers even if is_fleet unset
			extra = frappe.get_all(
				SERVICE_DUE,
				filters={"customer": ["in", list(fleet_customers)], "is_fleet": ["!=", 1]},
				fields=fields,
				limit=ROW_LIMIT,
			)
			seen = {r.name for r in sd_rows}
			for e in extra:
				if e.name not in seen:
					sd_rows.append(e)

		for r in sd_rows:
			cls = r.get("classification") or ""
			compliant = cls in ("Upcoming", "Due", "Inactive") or bool(r.get("service_appointment"))
			rows.append(
				{
					"account": "",
					"account_name": "",
					"customer": r.get("customer"),
					"vin": r.get("vin"),
					"model": r.get("model"),
					"quantity": 1,
					"source": "Service Due",
					"classification": cls,
					"due_date": str(r.get("due_date") or ""),
					"compliant": "Yes" if compliant else "No",
					"name": r.name,
					"_drill": {"view": "crm-service-due-detail", "params": {"name": r.name}},
				}
			)

	sd_only = [r for r in rows if r.get("source") == "Service Due"]
	compliant_n = sum(1 for r in sd_only if r.get("compliant") == "Yes")
	return result(
		"crm_fleet_maintenance",
		_("Fleet Maintenance Compliance"),
		f,
		{
			"total": len(rows),
			"service_due": len(sd_only),
			"compliant": compliant_n,
			"compliance_pct": round(100.0 * compliant_n / len(sd_only), 1) if sd_only else 0,
			"overdue": sum(
				1
				for r in sd_only
				if (r.get("classification") or "") in ("Overdue", "Severely Overdue", "Lapsed")
			),
			"by_classification": group_count(sd_only, "classification"),
		},
		[
			col("account", "Account"),
			col("account_name", "Account Name"),
			col("customer", "Customer"),
			col("vin", "VIN"),
			col("model", "Model"),
			col("source", "Source"),
			col("classification", "Class"),
			col("due_date", "Due"),
			col("compliant", "Compliant"),
		],
		rows[:ROW_LIMIT],
		help_text=help_text,
	)


REPORT_HANDLERS = {
	"crm_service_due": _service_due_report,
	"crm_reminder_conversion": _reminder_conversion_report,
	"crm_appointment_capacity": _appointment_capacity_report,
	"crm_workshop_followup": _workshop_followup_report,
	"crm_service_retention_cohort": _service_retention_cohort_report,
	"crm_lapsed_recovery": _lapsed_recovery_report,
	"crm_deferred_work": _deferred_work_report,
	"crm_csat_nps": _csat_nps_report,
	"crm_complaint_aging": _complaint_aging_report,
	"crm_repeat_complaint": _repeat_complaint_report,
	"crm_next_service_at_delivery": _next_service_at_delivery_report,
	"crm_fleet_maintenance": _fleet_maintenance_report,
}
