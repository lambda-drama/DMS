# Copyright (c) 2026, Mania and contributors
"""Lead scoring engine — Blueprint §6.3.

Configurable weights / hot-warm-cold thresholds live on DMS CRM Settings.
Score history is appended on the Lead (JSON) whenever the score changes.
"""

from __future__ import annotations

import json

import frappe
from frappe.utils import cint, flt, now_datetime


DEFAULT_WEIGHTS = {
	"engagement": 25,
	"readiness": 30,
	"fit": 20,
	"relationship": 15,
	"risk": 10,
}

DEFAULT_THRESHOLDS = {
	"hot": 70,
	"warm": 40,
}


def _settings():
	try:
		return frappe.get_cached_doc("DMS CRM Settings")
	except Exception:
		return None


def _weights(settings) -> dict[str, int]:
	return {
		"engagement": cint(getattr(settings, "score_weight_engagement", None) or DEFAULT_WEIGHTS["engagement"]),
		"readiness": cint(getattr(settings, "score_weight_readiness", None) or DEFAULT_WEIGHTS["readiness"]),
		"fit": cint(getattr(settings, "score_weight_fit", None) or DEFAULT_WEIGHTS["fit"]),
		"relationship": cint(
			getattr(settings, "score_weight_relationship", None) or DEFAULT_WEIGHTS["relationship"]
		),
		"risk": cint(getattr(settings, "score_weight_risk", None) or DEFAULT_WEIGHTS["risk"]),
	}


def _thresholds(settings) -> dict[str, int]:
	return {
		"hot": cint(getattr(settings, "score_hot_threshold", None) or DEFAULT_THRESHOLDS["hot"]),
		"warm": cint(getattr(settings, "score_warm_threshold", None) or DEFAULT_THRESHOLDS["warm"]),
	}


def _engagement_points(lead) -> tuple[float, list[str]]:
	"""0–100 within dimension."""
	pts = 0.0
	notes = []
	status = lead.status or ""
	if status in ("Contact Attempted",):
		pts += 20
		notes.append("contact_attempted")
	elif status in ("Contacted", "Qualified", "Converted"):
		pts += 45
		notes.append("contacted")
	if lead.first_responded_on:
		pts += 15
		notes.append("first_response")
	if cint(getattr(lead, "preferred_appointment", 0)) or lead.next_action_due:
		pts += 15
		notes.append("follow_up_scheduled")
	# Linked activity completed?
	if lead.name and not lead.is_new() and frappe.db.exists("DocType", "DMS CRM Activity"):
		done = frappe.db.count(
			"DMS CRM Activity",
			{"lead": lead.name, "status": "Completed"},
		)
		if done:
			pts += min(25, done * 10)
			notes.append(f"completed_activities:{done}")
	return min(pts, 100.0), notes


def _readiness_points(lead) -> tuple[float, list[str]]:
	pts = 0.0
	notes = []
	if cint(lead.need):
		pts += 20
		notes.append("need")
	if cint(lead.authority):
		pts += 20
		notes.append("authority")
	if cint(lead.budget_confirmed):
		pts += 25
		notes.append("budget")
	if cint(lead.timing_confirmed):
		pts += 20
		notes.append("timing")
	urgency = (lead.urgency or "").strip()
	if urgency == "Critical":
		pts += 15
		notes.append("urgency_critical")
	elif urgency == "High":
		pts += 10
		notes.append("urgency_high")
	elif urgency == "Medium":
		pts += 5
		notes.append("urgency_medium")
	tf = (lead.timeframe or "").lower()
	if any(x in tf for x in ("week", "immediate", "asap", "this month")):
		pts += 10
		notes.append("timeframe_near")
	return min(pts, 100.0), notes


def _fit_points(lead) -> tuple[float, list[str]]:
	pts = 0.0
	notes = []
	if lead.brand:
		pts += 25
		notes.append("brand")
	if lead.model:
		pts += 30
		notes.append("model")
	if lead.variant or lead.preferred_color:
		pts += 15
		notes.append("variant_or_color")
	if lead.branch:
		pts += 15
		notes.append("branch")
	if lead.budget_range or flt(lead.net_total):
		pts += 15
		notes.append("budget_range")
	return min(pts, 100.0), notes


def _relationship_points(lead) -> tuple[float, list[str]]:
	pts = 0.0
	notes = []
	source = lead.source or ""
	if source == "Referral":
		pts += 40
		notes.append("referral")
	elif source == "Service Upgrade":
		pts += 35
		notes.append("service_upgrade")
	elif source in ("Owner Event", "Showroom Walk-in"):
		pts += 20
		notes.append("owner_or_walkin")
	if lead.customer and frappe.db.exists("Customer", lead.customer):
		pts += 30
		notes.append("existing_customer")
		# Prior won deals?
		if frappe.db.exists("DocType", "DMS CRM Opportunity"):
			won = frappe.db.count(
				"DMS CRM Opportunity",
				{"customer": lead.customer, "status": "Won"},
			)
			if won:
				pts += min(30, won * 15)
				notes.append(f"repeat_buyer:{won}")
	return min(pts, 100.0), notes


def _risk_penalty(lead) -> tuple[float, list[str]]:
	"""Returns penalty 0–100 (higher = worse). Subtracted via risk weight."""
	pts = 0.0
	notes = []
	status = lead.status or ""
	if status in ("Invalid", "Duplicate", "Disqualified"):
		pts = 100
		notes.append(status.lower())
		return pts, notes
	if not (lead.mobile_no or lead.phone or lead.email):
		pts += 40
		notes.append("no_contact")
	if status == "Nurture":
		pts += 15
		notes.append("nurture")
	# Stale: created > 14 days ago, still New/Assigned, no first response
	if status in ("New", "Assigned") and not lead.first_responded_on and lead.creation:
		from frappe.utils import date_diff, get_datetime

		age = date_diff(now_datetime(), get_datetime(lead.creation))
		if age >= 14:
			pts += 30
			notes.append(f"stale_days:{age}")
	return min(pts, 100.0), notes


def calculate_lead_score(lead) -> dict:
	"""Return {score, band, breakdown} for a lead document."""
	settings = _settings()
	weights = _weights(settings)
	thresholds = _thresholds(settings)

	engagement, eng_notes = _engagement_points(lead)
	readiness, ready_notes = _readiness_points(lead)
	fit, fit_notes = _fit_points(lead)
	relationship, rel_notes = _relationship_points(lead)
	risk, risk_notes = _risk_penalty(lead)

	# Weighted average; risk reduces score
	total_w = sum(weights.values()) or 100
	positive = (
		engagement * weights["engagement"]
		+ readiness * weights["readiness"]
		+ fit * weights["fit"]
		+ relationship * weights["relationship"]
	) / total_w
	risk_drag = (risk * weights["risk"]) / total_w
	score = max(0, min(100, int(round(positive - risk_drag))))

	if score >= thresholds["hot"]:
		band = "Hot"
	elif score >= thresholds["warm"]:
		band = "Warm"
	else:
		band = "Cold"

	breakdown = {
		"engagement": {"points": engagement, "weight": weights["engagement"], "notes": eng_notes},
		"readiness": {"points": readiness, "weight": weights["readiness"], "notes": ready_notes},
		"fit": {"points": fit, "weight": weights["fit"], "notes": fit_notes},
		"relationship": {
			"points": relationship,
			"weight": weights["relationship"],
			"notes": rel_notes,
		},
		"risk": {"points": risk, "weight": weights["risk"], "notes": risk_notes},
		"thresholds": thresholds,
		"score": score,
		"band": band,
	}
	return {"score": score, "band": band, "breakdown": breakdown}


def apply_lead_score(lead) -> None:
	"""Mutate lead with score / band / history when score changes."""
	if getattr(lead, "flags", None) and lead.flags.get("skip_lead_score"):
		return

	result = calculate_lead_score(lead)
	prev = cint(lead.lead_score)
	new_score = result["score"]
	lead.lead_score = new_score
	if hasattr(lead, "score_band"):
		lead.score_band = result["band"]
	if hasattr(lead, "score_breakdown"):
		lead.score_breakdown = json.dumps(result["breakdown"], default=str)

	if prev == new_score and not lead.is_new():
		return

	# Append scoring history (Blueprint §6.3)
	if hasattr(lead, "score_history"):
		history = []
		raw = lead.score_history
		if raw:
			try:
				history = json.loads(raw) if isinstance(raw, str) else list(raw)
			except Exception:
				history = []
		history.append(
			{
				"at": str(now_datetime()),
				"by": frappe.session.user,
				"previous": prev,
				"score": new_score,
				"band": result["band"],
				"notes": {
					k: v.get("notes")
					for k, v in result["breakdown"].items()
					if isinstance(v, dict) and "notes" in v
				},
			}
		)
		# Keep last 50 entries
		lead.score_history = json.dumps(history[-50:], default=str)
