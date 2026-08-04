# Copyright (c) 2026, Mania and contributors
"""§17.4 Call Center & Campaigns Dashboard + call / campaign reports."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, get_datetime, getdate, time_diff_in_seconds

from dms.crm_api.reports.common import (
	ACTIVITY,
	CALL_LOG,
	CALL_QUALITY,
	CAMPAIGN,
	col,
	creation_between,
	dt_exists,
	group_count,
	parse_crm_filters,
	result,
)

MEMBER = "DMS CRM Campaign Member"
ROW_LIMIT = 2000

# Connected / completed dispositions commonly used on Call Log / Activity
COMPLETED_STATUSES = {"Completed", "Answered"}
CONNECTED_DISPOSITIONS = {
	"Connected",
	"Appointment Set",
	"Appointment",
	"Interested",
	"Callback",
	"Completed",
	"Sale",
	"Qualified",
}
APPOINTMENT_DISPOSITIONS = {
	"Appointment Set",
	"Appointment",
	"Booked",
	"Test Drive Booked",
}


def _fields_present(doctype: str, wanted: list[str]) -> list[str]:
	meta = frappe.get_meta(doctype)
	out = []
	for f in wanted:
		if f == "name" or f.startswith("`"):
			out.append(f)
		elif meta.has_field(f.replace("`", "")):
			out.append(f)
	return out


def _call_source(filters):
	"""Prefer DMS CRM Call Log; fall back to Activity type=Call."""
	f = filters
	if dt_exists(CALL_LOG):
		meta = frappe.get_meta(CALL_LOG)
		fields = [
			"name",
			"status",
			"duration",
			"creation",
			"type",
			"start_time",
		]
		for optional in (
			"caller",
			"receiver",
			"custom_disposition",
			"custom_customer",
			"custom_queue",
			"custom_callback_datetime",
			"custom_callback_owner",
			"note",
			"id",
		):
			if meta.has_field(optional):
				fields.append(optional)
		filt = {"creation": creation_between(f)}
		if f.get("owner") and meta.has_field("caller"):
			filt["caller"] = f["owner"]
		rows = frappe.get_all(
			CALL_LOG,
			filters=filt,
			fields=fields,
			order_by="creation desc",
			limit=ROW_LIMIT,
		)
		out = []
		for r in rows:
			disp = r.get("custom_disposition") or ""
			agent = r.get("caller") or r.get("receiver") or ""
			out.append(
				{
					"name": r.name,
					"source": CALL_LOG,
					"status": r.get("status") or "",
					"disposition": disp,
					"duration": cint(r.get("duration") or 0),
					"agent": agent,
					"customer": r.get("custom_customer"),
					"queue": r.get("custom_queue"),
					"callback_datetime": r.get("custom_callback_datetime"),
					"callback_owner": r.get("custom_callback_owner"),
					"created": r.creation,
					"start_time": r.get("start_time"),
					"type": r.get("type"),
					"_drill": {"view": "crm-call-log-detail", "params": {"name": r.name}},
				}
			)
		return out

	if dt_exists(ACTIVITY):
		meta = frappe.get_meta(ACTIVITY)
		filt = {"creation": creation_between(f)}
		if meta.has_field("activity_type"):
			filt["activity_type"] = "Call"
		if f.get("owner") and meta.has_field("assigned_to"):
			filt["assigned_to"] = f["owner"]
		if f.get("campaign") and meta.has_field("campaign"):
			filt["campaign"] = f["campaign"]
		fields = _fields_present(
			ACTIVITY,
			[
				"name",
				"subject",
				"status",
				"disposition",
				"assigned_to",
				"customer",
				"campaign",
				"due_datetime",
				"completed_on",
				"creation",
			],
		)
		rows = frappe.get_all(
			ACTIVITY, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
		)
		out = []
		for r in rows:
			duration = 0
			if r.get("due_datetime") and r.get("completed_on"):
				try:
					duration = max(
						0,
						int(
							time_diff_in_seconds(
								get_datetime(r.completed_on), get_datetime(r.due_datetime)
							)
						),
					)
				except Exception:
					duration = 0
			out.append(
				{
					"name": r.name,
					"source": ACTIVITY,
					"status": r.get("status") or "",
					"disposition": r.get("disposition") or "",
					"duration": duration,
					"agent": r.get("assigned_to") or "",
					"customer": r.get("customer"),
					"queue": "",
					"callback_datetime": r.get("due_datetime")
					if (r.get("disposition") or "") == "Callback"
					else None,
					"callback_owner": r.get("assigned_to")
					if (r.get("disposition") or "") == "Callback"
					else None,
					"created": r.creation,
					"start_time": r.get("due_datetime"),
					"type": "Call",
					"campaign": r.get("campaign"),
					"_drill": {"view": "crm-activity-detail", "params": {"name": r.name}},
				}
			)
		return out
	return []


def _is_connected(row) -> bool:
	st = (row.get("status") or "").strip()
	disp = (row.get("disposition") or "").strip()
	if st in COMPLETED_STATUSES or st in ("Connected", "Answered"):
		return True
	if disp in CONNECTED_DISPOSITIONS:
		return True
	if cint(row.get("duration")) > 0 and st not in ("Failed", "No Answer", "Busy", "Cancelled"):
		return True
	return False


def _is_completed(row) -> bool:
	st = (row.get("status") or "").strip()
	disp = (row.get("disposition") or "").strip()
	if st in COMPLETED_STATUSES:
		return True
	if disp in ("Completed", "Appointment Set", "Sale", "Qualified", "Interested"):
		return True
	return False


def _is_appointment(row) -> bool:
	disp = (row.get("disposition") or "").strip()
	return disp in APPOINTMENT_DISPOSITIONS


def get_crm_call_campaign_dashboard(filters=None):
	f = parse_crm_filters(filters)
	summary = {
		"calls_attempted": 0,
		"connected": 0,
		"completed": 0,
		"contact_rate_pct": 0,
		"appointments_set": 0,
		"avg_handle_minutes": 0,
		"campaigns_active": 0,
		"by_disposition": [],
	}

	calls = _call_source(f)
	summary["calls_attempted"] = len(calls)
	connected = [c for c in calls if _is_connected(c)]
	completed = [c for c in calls if _is_completed(c)]
	appts = [c for c in calls if _is_appointment(c)]
	summary["connected"] = len(connected)
	summary["completed"] = len(completed)
	summary["appointments_set"] = len(appts)
	summary["contact_rate_pct"] = (
		round(100.0 * len(connected) / len(calls), 1) if calls else 0
	)
	durs = [c["duration"] for c in connected if c.get("duration")]
	summary["avg_handle_minutes"] = (
		round(sum(durs) / len(durs) / 60.0, 2) if durs else 0
	)
	summary["by_disposition"] = group_count(calls, "disposition")

	if dt_exists(CAMPAIGN):
		summary["campaigns_active"] = frappe.db.count(
			CAMPAIGN, {"status": ["in", ["Active", "Running", "In Progress", "Approved"]]}
		)

	return {
		"section_id": "crm_call_campaign",
		"title": _("Call Center & Campaigns"),
		"filters": {
			"from_date": str(f["from_date"]),
			"to_date": str(f["to_date"]),
		},
		"summary": summary,
	}


def _calls_attempted_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Calls attempted from DMS CRM Call Log (else Activity type=Call). "
		"Connected = status Completed/Connected/Answered or disposition in Connected set, "
		"or duration > 0. Contact rate = connected ÷ attempted × 100."
	)
	calls = _call_source(f)
	rows = []
	for c in calls:
		rows.append(
			{
				**c,
				"connected": "Yes" if _is_connected(c) else "No",
				"completed": "Yes" if _is_completed(c) else "No",
				"duration_min": round(cint(c.get("duration")) / 60.0, 2),
				"created": str(c.get("created") or "")[:16],
			}
		)
	connected_n = sum(1 for r in rows if r["connected"] == "Yes")
	completed_n = sum(1 for r in rows if r["completed"] == "Yes")
	return result(
		"crm_calls_attempted",
		_("Calls Attempted / Connected"),
		f,
		{
			"total": len(rows),
			"connected": connected_n,
			"completed": completed_n,
			"contact_rate_pct": round(100.0 * connected_n / len(rows), 1) if rows else 0,
			"by_status": group_count(rows, "status"),
			"by_disposition": group_count(rows, "disposition"),
		},
		[
			col("name", "Call"),
			col("agent", "Agent"),
			col("customer", "Customer"),
			col("status", "Status"),
			col("disposition", "Disposition"),
			col("duration_min", "Duration (min)"),
			col("connected", "Connected"),
			col("completed", "Completed"),
			col("queue", "Queue"),
			col("created", "Created"),
		],
		rows,
		help_text=help_text,
		definitions={
			"contact_rate_pct": "connected ÷ attempted × 100",
		},
	)


def _contact_appointment_rate_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Contact rate = connected ÷ attempted × 100. "
		"Appointment rate = appointment-set dispositions ÷ connected × 100 "
		"(fallback ÷ attempted if no connected)."
	)
	calls = _call_source(f)
	rows = []
	for c in calls:
		rows.append(
			{
				"name": c["name"],
				"agent": c.get("agent"),
				"customer": c.get("customer"),
				"disposition": c.get("disposition"),
				"status": c.get("status"),
				"connected": "Yes" if _is_connected(c) else "No",
				"appointment": "Yes" if _is_appointment(c) else "No",
				"created": str(c.get("created") or "")[:16],
				"_drill": c.get("_drill"),
			}
		)
	attempted = len(rows)
	connected_n = sum(1 for r in rows if r["connected"] == "Yes")
	appt_n = sum(1 for r in rows if r["appointment"] == "Yes")
	base = connected_n or attempted or 1
	return result(
		"crm_contact_appointment_rate",
		_("Contact & Appointment Rate"),
		f,
		{
			"attempted": attempted,
			"connected": connected_n,
			"appointments": appt_n,
			"contact_rate_pct": round(100.0 * connected_n / attempted, 1) if attempted else 0,
			"appointment_rate_pct": round(100.0 * appt_n / base, 1) if attempted else 0,
			"by_disposition": group_count(rows, "disposition"),
			"by_agent": group_count(rows, "agent"),
		},
		[
			col("name", "Call"),
			col("agent", "Agent"),
			col("customer", "Customer"),
			col("status", "Status"),
			col("disposition", "Disposition"),
			col("connected", "Connected"),
			col("appointment", "Appointment"),
			col("created", "Created"),
		],
		rows,
		help_text=help_text,
		definitions={
			"contact_rate_pct": "connected ÷ attempted × 100",
			"appointment_rate_pct": "appointments ÷ connected × 100",
		},
	)


def _agent_productivity_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Agent productivity: calls attempted, connected, completed, appointments, "
		"and average handle time (AHT = sum(duration of connected) ÷ connected ÷ 60 minutes)."
	)
	calls = _call_source(f)
	by_agent: dict[str, dict] = {}
	for c in calls:
		agent = c.get("agent") or "—"
		b = by_agent.setdefault(
			agent,
			{
				"agent": agent,
				"attempted": 0,
				"connected": 0,
				"completed": 0,
				"appointments": 0,
				"duration_sec": 0,
			},
		)
		b["attempted"] += 1
		if _is_connected(c):
			b["connected"] += 1
			b["duration_sec"] += cint(c.get("duration"))
		if _is_completed(c):
			b["completed"] += 1
		if _is_appointment(c):
			b["appointments"] += 1

	rows = []
	for b in by_agent.values():
		aht = round(b["duration_sec"] / b["connected"] / 60.0, 2) if b["connected"] else 0
		rows.append(
			{
				**b,
				"contact_rate_pct": round(100.0 * b["connected"] / b["attempted"], 1)
				if b["attempted"]
				else 0,
				"avg_handle_minutes": aht,
				"_drill": {"view": "crm-agent", "params": {"user": b["agent"]}},
			}
		)
	rows.sort(key=lambda x: -x["attempted"])
	return result(
		"crm_agent_productivity",
		_("Agent Productivity"),
		f,
		{
			"agents": len(rows),
			"attempted": sum(r["attempted"] for r in rows),
			"connected": sum(r["connected"] for r in rows),
			"appointments": sum(r["appointments"] for r in rows),
		},
		[
			col("agent", "Agent"),
			col("attempted", "Attempted"),
			col("connected", "Connected"),
			col("completed", "Completed"),
			col("appointments", "Appointments"),
			col("contact_rate_pct", "Contact %"),
			col("avg_handle_minutes", "AHT (min)"),
		],
		rows,
		help_text=help_text,
	)


def _disposition_analysis_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Outcomes by custom_disposition (Call Log) or disposition (Activity). "
		"Share % = count ÷ total attempted × 100."
	)
	calls = _call_source(f)
	buckets: dict[str, int] = {}
	for c in calls:
		key = c.get("disposition") or c.get("status") or "—"
		buckets[key] = buckets.get(key, 0) + 1
	total = len(calls) or 1
	rows = [
		{
			"disposition": k,
			"count": v,
			"share_pct": round(100.0 * v / total, 1),
		}
		for k, v in sorted(buckets.items(), key=lambda x: -x[1])
	]
	return result(
		"crm_disposition_analysis",
		_("Disposition Analysis"),
		f,
		{"total": len(calls), "dispositions": len(rows)},
		[
			col("disposition", "Disposition"),
			col("count", "Count"),
			col("share_pct", "Share %"),
		],
		rows,
		help_text=help_text,
	)


def _callback_compliance_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Callbacks from Call Log custom_callback_datetime / disposition=Callback, "
		"or Activity disposition=Callback. On-time = completed_on/status Completed "
		"before or on callback datetime; overdue if past due and still open."
	)
	rows = []
	today = getdate()

	if dt_exists(CALL_LOG):
		meta = frappe.get_meta(CALL_LOG)
		if meta.has_field("custom_callback_datetime") or meta.has_field("custom_disposition"):
			fields = ["name", "status", "creation", "caller"]
			for optional in (
				"custom_disposition",
				"custom_callback_datetime",
				"custom_callback_owner",
				"custom_customer",
			):
				if meta.has_field(optional):
					fields.append(optional)
			filt = {"creation": creation_between(f)}
			if meta.has_field("custom_disposition"):
				filt["custom_disposition"] = "Callback"
			for r in frappe.get_all(
				CALL_LOG, filters=filt, fields=fields, order_by="creation desc", limit=ROW_LIMIT
			):
				cb = r.get("custom_callback_datetime")
				st = (r.get("status") or "").strip()
				done = st in COMPLETED_STATUSES
				on_time = False
				overdue = False
				if cb:
					cb_d = getdate(cb)
					if done:
						on_time = True
					elif cb_d < today:
						overdue = True
				rows.append(
					{
						"name": r.name,
						"source": CALL_LOG,
						"customer": r.get("custom_customer"),
						"owner": r.get("custom_callback_owner") or r.get("caller"),
						"callback_due": str(cb)[:16] if cb else "",
						"status": st,
						"on_time": "Yes" if on_time else ("Overdue" if overdue else "Pending"),
						"_drill": {"view": "crm-call-log-detail", "params": {"name": r.name}},
					}
				)

	if not rows and dt_exists(ACTIVITY):
		meta = frappe.get_meta(ACTIVITY)
		filt = {"creation": creation_between(f)}
		if meta.has_field("disposition"):
			filt["disposition"] = "Callback"
		fields = _fields_present(
			ACTIVITY,
			[
				"name",
				"customer",
				"assigned_to",
				"status",
				"due_datetime",
				"completed_on",
				"disposition",
			],
		)
		for r in frappe.get_all(
			ACTIVITY, filters=filt, fields=fields, order_by="due_datetime asc", limit=ROW_LIMIT
		):
			due = r.get("due_datetime")
			done = bool(r.get("completed_on")) or (r.get("status") or "") == "Completed"
			overdue = False
			on_time = False
			if due:
				if done:
					try:
						on_time = get_datetime(r.completed_on) <= get_datetime(due)
					except Exception:
						on_time = True
				elif getdate(due) < today:
					overdue = True
			rows.append(
				{
					"name": r.name,
					"source": ACTIVITY,
					"customer": r.get("customer"),
					"owner": r.get("assigned_to"),
					"callback_due": str(due)[:16] if due else "",
					"status": r.get("status"),
					"on_time": "Yes" if on_time else ("Overdue" if overdue else "Pending"),
					"_drill": {"view": "crm-activity-detail", "params": {"name": r.name}},
				}
			)

	due_n = len(rows)
	on_time_n = sum(1 for r in rows if r["on_time"] == "Yes")
	overdue_n = sum(1 for r in rows if r["on_time"] == "Overdue")
	return result(
		"crm_callback_compliance",
		_("Callback Compliance"),
		f,
		{
			"total": due_n,
			"on_time": on_time_n,
			"overdue": overdue_n,
			"pending": sum(1 for r in rows if r["on_time"] == "Pending"),
			"compliance_pct": round(100.0 * on_time_n / due_n, 1) if due_n else 0,
		},
		[
			col("name", "Ref"),
			col("source", "Source"),
			col("customer", "Customer"),
			col("owner", "Owner"),
			col("callback_due", "Callback Due"),
			col("status", "Status"),
			col("on_time", "Compliance"),
		],
		rows,
		help_text=help_text,
	)


def _call_quality_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Call quality / coaching scores from DMS CRM Call Quality Score. "
		"Avg score and compliance_passed rate."
	)
	rows = []
	if dt_exists(CALL_QUALITY):
		fields = _fields_present(
			CALL_QUALITY,
			[
				"name",
				"call_log",
				"scored_by",
				"scored_on",
				"score",
				"compliance_passed",
				"coaching_notes",
				"creation",
			],
		)
		filt = {"creation": creation_between(f)}
		for r in frappe.get_all(
			CALL_QUALITY, filters=filt, fields=fields, order_by="scored_on desc", limit=ROW_LIMIT
		):
			rows.append(
				{
					"name": r.name,
					"call_log": r.get("call_log"),
					"scored_by": r.get("scored_by"),
					"scored_on": str(r.get("scored_on") or r.creation)[:16],
					"score": flt(r.get("score")),
					"compliance": "Yes" if cint(r.get("compliance_passed")) else "No",
					"notes": (r.get("coaching_notes") or "")[:120],
					"_drill": {"view": "crm-call-quality-detail", "params": {"name": r.name}},
				}
			)
	scores = [r["score"] for r in rows if r.get("score") is not None]
	passed = sum(1 for r in rows if r["compliance"] == "Yes")
	return result(
		"crm_call_quality",
		_("Call Quality Scores"),
		f,
		{
			"total": len(rows),
			"avg_score": round(sum(scores) / len(scores), 2) if scores else 0,
			"compliance_pct": round(100.0 * passed / len(rows), 1) if rows else 0,
		},
		[
			col("name", "Score"),
			col("call_log", "Call Log"),
			col("scored_by", "Scored By"),
			col("scored_on", "Scored On"),
			col("score", "Score"),
			col("compliance", "Compliance"),
			col("notes", "Coaching Notes"),
		],
		rows,
		help_text=help_text,
	)


def _campaign_funnel_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Campaign audience funnel: members → delivered → opened → response → "
		"appointment → sale (from DMS CRM Campaign metrics). "
		"Member statuses from DMS CRM Campaign Member when present."
	)
	rows = []
	if dt_exists(CAMPAIGN):
		fields = _fields_present(
			CAMPAIGN,
			[
				"name",
				"campaign_name",
				"status",
				"channel",
				"members_count",
				"control_group_count",
				"delivered_count",
				"opened_count",
				"response_count",
				"appointment_count",
				"test_drive_count",
				"quotation_count",
				"booking_count",
				"sale_count",
				"workshop_visit_count",
				"branch",
				"creation",
			],
		)
		filt = {"creation": creation_between(f)}
		if f.get("campaign"):
			filt["name"] = f["campaign"]
		if f.get("branch"):
			meta = frappe.get_meta(CAMPAIGN)
			if meta.has_field("branch"):
				filt["branch"] = f["branch"]
		for r in frappe.get_all(CAMPAIGN, filters=filt, fields=fields, limit=500):
			members = cint(r.get("members_count"))
			delivered = cint(r.get("delivered_count"))
			responded = cint(r.get("response_count"))
			appts = cint(r.get("appointment_count"))
			sales = cint(r.get("sale_count"))
			rows.append(
				{
					"name": r.name,
					"campaign_name": r.get("campaign_name") or r.name,
					"status": r.get("status"),
					"channel": r.get("channel"),
					"members": members,
					"delivered": delivered,
					"opened": cint(r.get("opened_count")),
					"response": responded,
					"appointments": appts,
					"sales": sales,
					"delivery_pct": round(100.0 * delivered / members, 1) if members else 0,
					"response_pct": round(100.0 * responded / max(delivered, 1), 1)
					if members
					else 0,
					"conversion_pct": round(100.0 * sales / members, 1) if members else 0,
					"_drill": {"view": "crm-campaign-detail", "params": {"name": r.name}},
				}
			)

		# Enrich with live member counts when child exists and metrics empty
		if dt_exists(MEMBER):
			for row in rows:
				if row["members"]:
					continue
				row["members"] = frappe.db.count(MEMBER, {"campaign": row["name"]})
				row["response"] = frappe.db.count(
					MEMBER, {"campaign": row["name"], "response": ["is", "set"]}
				)
				row["sales"] = frappe.db.count(MEMBER, {"campaign": row["name"], "converted": 1})

	return result(
		"crm_campaign_funnel",
		_("Campaign Audience Funnel"),
		f,
		{
			"total": len(rows),
			"members": sum(r["members"] for r in rows),
			"delivered": sum(r["delivered"] for r in rows),
			"responses": sum(r["response"] for r in rows),
			"sales": sum(r["sales"] for r in rows),
		},
		[
			col("name", "Campaign"),
			col("campaign_name", "Name"),
			col("status", "Status"),
			col("channel", "Channel"),
			col("members", "Audience"),
			col("delivered", "Delivered"),
			col("opened", "Opened"),
			col("response", "Response"),
			col("appointments", "Appts"),
			col("sales", "Sales"),
			col("delivery_pct", "Delivery %"),
			col("response_pct", "Response %"),
			col("conversion_pct", "Conv %"),
		],
		rows,
		help_text=help_text,
	)


def _channel_effectiveness_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Channel effectiveness = leads/responses/appointments/sales and ROI by campaign channel. "
		"Cost per lead = budget ÷ response_count (or members); ROI % from campaign.roi_pct."
	)
	rows = []
	if dt_exists(CAMPAIGN):
		fields = _fields_present(
			CAMPAIGN,
			[
				"name",
				"campaign_name",
				"channel",
				"status",
				"budget",
				"members_count",
				"response_count",
				"appointment_count",
				"sale_count",
				"campaign_revenue",
				"roi_pct",
				"cost_per_lead",
				"creation",
			],
		)
		filt = {"creation": creation_between(f)}
		if f.get("campaign"):
			filt["name"] = f["campaign"]
		camps = frappe.get_all(CAMPAIGN, filters=filt, fields=fields, limit=500)
		by_ch: dict[str, dict] = {}
		for c in camps:
			ch = c.get("channel") or "—"
			b = by_ch.setdefault(
				ch,
				{
					"channel": ch,
					"campaigns": 0,
					"members": 0,
					"responses": 0,
					"appointments": 0,
					"sales": 0,
					"budget": 0.0,
					"revenue": 0.0,
				},
			)
			b["campaigns"] += 1
			b["members"] += cint(c.get("members_count"))
			b["responses"] += cint(c.get("response_count"))
			b["appointments"] += cint(c.get("appointment_count"))
			b["sales"] += cint(c.get("sale_count"))
			b["budget"] += flt(c.get("budget"))
			b["revenue"] += flt(c.get("campaign_revenue"))
		for b in by_ch.values():
			b["budget"] = round(b["budget"], 2)
			b["revenue"] = round(b["revenue"], 2)
			b["cost_per_lead"] = (
				round(b["budget"] / b["responses"], 2) if b["responses"] else 0
			)
			b["roi_pct"] = (
				round(100.0 * (b["revenue"] - b["budget"]) / b["budget"], 1)
				if b["budget"]
				else 0
			)
			b["response_pct"] = (
				round(100.0 * b["responses"] / b["members"], 1) if b["members"] else 0
			)
			rows.append(b)
		rows.sort(key=lambda x: -x["revenue"])

	return result(
		"crm_channel_effectiveness",
		_("Channel Effectiveness"),
		f,
		{
			"channels": len(rows),
			"revenue": round(sum(r["revenue"] for r in rows), 2),
			"budget": round(sum(r["budget"] for r in rows), 2),
		},
		[
			col("channel", "Channel"),
			col("campaigns", "Campaigns"),
			col("members", "Audience"),
			col("responses", "Responses"),
			col("appointments", "Appts"),
			col("sales", "Sales"),
			col("budget", "Budget"),
			col("revenue", "Revenue"),
			col("cost_per_lead", "Cost / Lead"),
			col("roi_pct", "ROI %"),
			col("response_pct", "Response %"),
		],
		rows,
		help_text=help_text,
		definitions={
			"cost_per_lead": "budget ÷ responses",
			"roi_pct": "(revenue − budget) ÷ budget × 100",
		},
	)


def _cost_per_outcome_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Unit economics per campaign: "
		"cost_per_lead = budget ÷ response_count (fallback members); "
		"cost_per_appointment = budget ÷ appointment_count; "
		"cost_per_sale = budget ÷ sale_count. Uses stored cost_per_* when present."
	)
	rows = []
	if dt_exists(CAMPAIGN):
		fields = _fields_present(
			CAMPAIGN,
			[
				"name",
				"campaign_name",
				"channel",
				"status",
				"budget",
				"members_count",
				"response_count",
				"appointment_count",
				"sale_count",
				"cost_per_lead",
				"cost_per_appointment",
				"cost_per_sale",
				"campaign_revenue",
				"creation",
			],
		)
		filt = {"creation": creation_between(f)}
		if f.get("campaign"):
			filt["name"] = f["campaign"]
		for r in frappe.get_all(CAMPAIGN, filters=filt, fields=fields, limit=500):
			budget = flt(r.get("budget"))
			responses = cint(r.get("response_count")) or cint(r.get("members_count"))
			appts = cint(r.get("appointment_count"))
			sales = cint(r.get("sale_count"))
			cpl = flt(r.get("cost_per_lead")) or (round(budget / responses, 2) if responses else 0)
			cpa = flt(r.get("cost_per_appointment")) or (
				round(budget / appts, 2) if appts else 0
			)
			cps = flt(r.get("cost_per_sale")) or (round(budget / sales, 2) if sales else 0)
			rows.append(
				{
					"name": r.name,
					"campaign_name": r.get("campaign_name") or r.name,
					"channel": r.get("channel"),
					"status": r.get("status"),
					"budget": budget,
					"responses": responses,
					"appointments": appts,
					"sales": sales,
					"cost_per_lead": cpl,
					"cost_per_appointment": cpa,
					"cost_per_sale": cps,
					"revenue": flt(r.get("campaign_revenue")),
					"_drill": {"view": "crm-campaign-detail", "params": {"name": r.name}},
				}
			)
	return result(
		"crm_cost_per_outcome",
		_("Cost per Lead / Appt / Sale"),
		f,
		{
			"total": len(rows),
			"budget": round(sum(r["budget"] for r in rows), 2),
			"avg_cost_per_lead": round(
				sum(r["cost_per_lead"] for r in rows) / len(rows), 2
			)
			if rows
			else 0,
			"avg_cost_per_sale": round(
				sum(r["cost_per_sale"] for r in rows) / len(rows), 2
			)
			if rows
			else 0,
		},
		[
			col("name", "Campaign"),
			col("campaign_name", "Name"),
			col("channel", "Channel"),
			col("budget", "Budget"),
			col("responses", "Leads/Responses"),
			col("appointments", "Appts"),
			col("sales", "Sales"),
			col("cost_per_lead", "Cost / Lead"),
			col("cost_per_appointment", "Cost / Appt"),
			col("cost_per_sale", "Cost / Sale"),
			col("revenue", "Revenue"),
		],
		rows,
		help_text=help_text,
		definitions={
			"cost_per_lead": "budget ÷ response_count (or members)",
			"cost_per_appointment": "budget ÷ appointment_count",
			"cost_per_sale": "budget ÷ sale_count",
		},
	)


def _revenue_attribution_report(filters=None):
	f = parse_crm_filters(filters)
	help_text = _(
		"Revenue attribution & ROI: campaign_revenue and attributed_revenue from members. "
		"ROI % = (revenue − budget) ÷ budget × 100. "
		"Member attributed_revenue summed when Campaign Member DocType exists."
	)
	rows = []
	if dt_exists(CAMPAIGN):
		fields = _fields_present(
			CAMPAIGN,
			[
				"name",
				"campaign_name",
				"channel",
				"status",
				"budget",
				"campaign_revenue",
				"roi_pct",
				"sale_count",
				"booking_count",
				"members_count",
				"creation",
			],
		)
		filt = {"creation": creation_between(f)}
		if f.get("campaign"):
			filt["name"] = f["campaign"]
		for r in frappe.get_all(CAMPAIGN, filters=filt, fields=fields, limit=500):
			budget = flt(r.get("budget"))
			revenue = flt(r.get("campaign_revenue"))
			member_attr = 0.0
			if dt_exists(MEMBER) and frappe.get_meta(MEMBER).has_field("attributed_revenue"):
				for m in frappe.get_all(
					MEMBER,
					filters={"campaign": r.name, "attributed_revenue": [">", 0]},
					fields=["attributed_revenue"],
					limit=ROW_LIMIT,
				):
					member_attr += flt(m.attributed_revenue)
			if not revenue and member_attr:
				revenue = member_attr
			roi = flt(r.get("roi_pct"))
			if not roi and budget:
				roi = round(100.0 * (revenue - budget) / budget, 1)
			rows.append(
				{
					"name": r.name,
					"campaign_name": r.get("campaign_name") or r.name,
					"channel": r.get("channel"),
					"status": r.get("status"),
					"budget": budget,
					"campaign_revenue": flt(r.get("campaign_revenue")),
					"member_attributed": round(member_attr, 2),
					"revenue": round(revenue, 2),
					"roi_pct": roi,
					"sales": cint(r.get("sale_count")),
					"bookings": cint(r.get("booking_count")),
					"_drill": {"view": "crm-campaign-detail", "params": {"name": r.name}},
				}
			)

	total_rev = sum(r["revenue"] for r in rows)
	total_budget = sum(r["budget"] for r in rows)
	return result(
		"crm_revenue_attribution",
		_("Revenue Attribution & ROI"),
		f,
		{
			"total": len(rows),
			"revenue": round(total_rev, 2),
			"budget": round(total_budget, 2),
			"roi_pct": round(100.0 * (total_rev - total_budget) / total_budget, 1)
			if total_budget
			else 0,
		},
		[
			col("name", "Campaign"),
			col("campaign_name", "Name"),
			col("channel", "Channel"),
			col("budget", "Budget"),
			col("campaign_revenue", "Campaign Revenue"),
			col("member_attributed", "Member Attributed"),
			col("revenue", "Attributed Revenue"),
			col("roi_pct", "ROI %"),
			col("sales", "Sales"),
			col("bookings", "Bookings"),
		],
		rows,
		help_text=help_text,
		definitions={
			"roi_pct": "(attributed revenue − budget) ÷ budget × 100",
			"cost_per_lead": "budget ÷ responses (see Cost per Outcome)",
		},
	)


REPORT_HANDLERS = {
	"crm_calls_attempted": _calls_attempted_report,
	"crm_contact_appointment_rate": _contact_appointment_rate_report,
	"crm_agent_productivity": _agent_productivity_report,
	"crm_disposition_analysis": _disposition_analysis_report,
	"crm_callback_compliance": _callback_compliance_report,
	"crm_call_quality": _call_quality_report,
	"crm_campaign_funnel": _campaign_funnel_report,
	"crm_channel_effectiveness": _channel_effectiveness_report,
	"crm_cost_per_outcome": _cost_per_outcome_report,
	"crm_revenue_attribution": _revenue_attribution_report,
}
