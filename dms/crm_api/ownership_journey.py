"""Post-delivery ownership journey — blueprint §8.3."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, add_to_date, cint, flt, getdate, now_datetime, today


# Referral is only created after a positive experience score (see record_experience_score).
JOURNEY_STEPS = (
	{
		"key": "welcome_call",
		"activity_type": "Call",
		"subject": "24-48h welcome call & owner onboarding",
		"days": 2,
		"priority": "High",
	},
	{
		"key": "experience_check",
		"activity_type": "Survey",
		"subject": "7-day delivery experience check",
		"days": 7,
		"priority": "Medium",
	},
	{
		"key": "first_service",
		"activity_type": "Service Reminder",
		"subject": "First-service booking reminder",
		"days": 30,
		"priority": "Medium",
	},
	{
		"key": "service_retention",
		"activity_type": "Service Reminder",
		"subject": "Service retention follow-up",
		"days": 90,
		"priority": "Low",
	},
	{
		"key": "anniversary",
		"activity_type": "Call",
		"subject": "Ownership anniversary / upgrade-trade-in check",
		"days": 365,
		"priority": "Medium",
	},
)

POSITIVE_SATISFACTION_THRESHOLD = 4
REFERRAL_SUBJECT = "Referral request after positive experience"
MODEL_EDUCATION_SUBJECT = "Owner education content for {model}"


def spawn_post_delivery_journey(opportunity_name):
	"""Create follow-up CRM activities after a vehicle sale is Won."""
	opp = frappe.get_doc("DMS CRM Opportunity", opportunity_name)
	if not opp.customer:
		return []

	created = []
	welcome_name = None
	for step in JOURNEY_STEPS:
		if frappe.db.exists(
			"DMS CRM Activity",
			{"opportunity": opp.name, "subject": step["subject"]},
		):
			continue
		due = add_to_date(now_datetime(), days=step["days"])
		if step["key"] == "first_service" and opp.get("allocated_vin"):
			service_due = frappe.db.get_value(
				"VIN No", opp.allocated_vin, "next_service_due_date"
			)
			if service_due:
				due = f"{service_due} 09:00:00"
		activity = _create_journey_activity(opp, step, due)
		created.append(activity.name)
		if step["key"] == "welcome_call":
			welcome_name = activity.name
			_notify_welcome(opp, activity)

	# Model-based education task (blueprint §8.3)
	model = opp.get("model") or opp.get("brand")
	if model:
		edu_subject = MODEL_EDUCATION_SUBJECT.format(model=model)
		if not frappe.db.exists(
			"DMS CRM Activity",
			{"opportunity": opp.name, "subject": edu_subject},
		):
			edu = _create_journey_activity(
				opp,
				{
					"key": "education",
					"activity_type": "Email",
					"subject": edu_subject,
					"priority": "Low",
				},
				add_to_date(now_datetime(), days=3),
				notes=f"Share model-specific owner education content for {model}.",
			)
			created.append(edu.name)

	if opp.delivery_readiness:
		values = {"status": "Delivered", "handover_on": now_datetime()}
		if welcome_name:
			values["welcome_activity"] = welcome_name
		frappe.db.set_value(
			"DMS CRM Delivery Readiness",
			opp.delivery_readiness,
			values,
			update_modified=False,
		)
	return created


def _create_journey_activity(opp, step, due, notes=None):
	return frappe.get_doc(
		{
			"doctype": "DMS CRM Activity",
			"activity_type": step["activity_type"],
			"subject": step["subject"],
			"status": "Open",
			"due_datetime": due,
			"assigned_to": opp.opportunity_owner or frappe.session.user,
			"priority": step.get("priority") or "Medium",
			"opportunity": opp.name,
			"customer": opp.customer,
			"reference_doctype": "DMS CRM Opportunity",
			"reference_name": opp.name,
			"outcome_notes": notes
			or f"Auto-created ownership journey step: {step.get('key') or step['subject']}",
		}
	).insert(ignore_permissions=True)


def _notify_welcome(opp, activity):
	"""Welcome message / owner onboarding alert for the relationship owner."""
	user = activity.assigned_to or opp.opportunity_owner
	if not user or user in ("Guest",):
		return
	try:
		frappe.get_doc(
			{
				"doctype": "Notification Log",
				"subject": _("Welcome call due: {0}").format(opp.customer),
				"email_content": _(
					"Schedule the 24-48h welcome call and owner onboarding for deal {0}."
				).format(opp.name),
				"for_user": user,
				"type": "Alert",
				"document_type": "DMS CRM Activity",
				"document_name": activity.name,
			}
		).insert(ignore_permissions=True)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "CRM Welcome Notify")


@frappe.whitelist()
def record_experience_score(opportunity, score, notes=None):
	"""Capture 7-day experience / delivery satisfaction and gate referral on positive score."""
	from dms.crm_api.common import ensure_crm_write

	ensure_crm_write("DMS CRM Opportunity")
	opp = frappe.get_doc("DMS CRM Opportunity", opportunity)
	score = cint(score)
	if score < 1 or score > 5:
		frappe.throw(_("Satisfaction score must be between 1 and 5."))

	if opp.delivery_readiness and frappe.db.exists(
		"DMS CRM Delivery Readiness", opp.delivery_readiness
	):
		frappe.db.set_value(
			"DMS CRM Delivery Readiness",
			opp.delivery_readiness,
			"satisfaction_score",
			score,
		)

	# Complete open experience-check activity if present
	exp = frappe.db.get_value(
		"DMS CRM Activity",
		{
			"opportunity": opp.name,
			"subject": "7-day delivery experience check",
			"status": "Open",
		},
		"name",
	)
	if exp:
		frappe.db.set_value(
			"DMS CRM Activity",
			exp,
			{
				"status": "Completed",
				"outcome_notes": notes
				or f"Experience score recorded: {score}/5",
			},
		)

	referral = None
	referral_doc = None
	if score >= POSITIVE_SATISFACTION_THRESHOLD:
		if not frappe.db.exists(
			"DMS CRM Activity",
			{"opportunity": opp.name, "subject": REFERRAL_SUBJECT},
		):
			referral = _create_journey_activity(
				opp,
				{
					"key": "referral",
					"activity_type": "Call",
					"subject": REFERRAL_SUBJECT,
					"priority": "Low",
				},
				add_to_date(now_datetime(), days=7),
				notes=f"Positive experience ({score}/5) — request referral.",
			).name
		# Draft CRM Referral when customer is known (anti-self handled on save)
		if opp.customer and frappe.db.exists("DocType", "DMS CRM Referral"):
			existing_ref = frappe.db.exists(
				"DMS CRM Referral",
				{
					"referrer_customer": opp.customer,
					"notes": ["like", f"%from opportunity {opp.name}%"],
				},
			)
			if not existing_ref:
				try:
					ref = frappe.get_doc(
						{
							"doctype": "DMS CRM Referral",
							"referrer_customer": opp.customer,
							"referred_name": f"Referral prospect (from {opp.customer_name or opp.customer})",
							"status": "Open",
							"source_channel": "In Person",
							"notes": (
								f"Auto-created after positive delivery experience ({score}/5) "
								f"from opportunity {opp.name}. Replace prospect name when known."
							),
							"company": getattr(opp, "company", None),
							"branch": getattr(opp, "branch", None),
						}
					)
					ref.insert(ignore_permissions=True)
					referral_doc = ref.name
				except Exception:
					frappe.log_error(frappe.get_traceback(), "CRM Referral from journey")
	frappe.db.commit()
	return {
		"score": score,
		"referral_created": bool(referral),
		"referral": referral,
		"referral_doc": referral_doc,
	}


def create_anniversary_and_service_reminders():
	"""Daily catch-up: first-service reminders + ownership anniversary / trade-in checks."""
	created = 0
	created += _first_service_reminders()
	created += _anniversary_and_trade_in_checks()
	return created


def _first_service_reminders():
	created = 0
	vins = frappe.get_all(
		"VIN No",
		filters={
			"vehicle_status": "Delivered to Customer",
			"current_customer": ["is", "set"],
			"next_service_due_date": ["between", [today(), add_days(today(), 7)]],
		},
		fields=["name", "current_customer", "next_service_due_date"],
		limit=200,
	)
	for vin in vins:
		opp = frappe.db.get_value(
			"DMS CRM Opportunity",
			{"allocated_vin": vin.name, "status": "Won"},
			["name", "opportunity_owner"],
			as_dict=True,
		)
		subject = f"First-service due for {vin.name}"
		if frappe.db.exists(
			"DMS CRM Activity",
			{"customer": vin.current_customer, "subject": subject, "status": "Open"},
		):
			continue
		frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": "Service Reminder",
				"subject": subject,
				"status": "Open",
				"due_datetime": f"{vin.next_service_due_date} 09:00:00",
				"assigned_to": (opp.opportunity_owner if opp else None) or "Administrator",
				"priority": "Medium",
				"opportunity": opp.name if opp else None,
				"customer": vin.current_customer,
				"reference_doctype": "VIN No",
				"reference_name": vin.name,
			}
		).insert(ignore_permissions=True)
		created += 1
	return created


def _anniversary_and_trade_in_checks():
	"""Ownership anniversary campaigns + upgrade/trade-in based on age/mileage."""
	created = 0
	# VINs delivered ~1 year ago (±3 days window)
	window_start = add_days(today(), -368)
	window_end = add_days(today(), -362)
	vins = frappe.get_all(
		"VIN No",
		filters={
			"vehicle_status": "Delivered to Customer",
			"current_customer": ["is", "set"],
		},
		fields=[
			"name",
			"current_customer",
			"model",
			"model_name",
			"current_odometer",
			"delivery_date",
			"creation",
		],
		limit=300,
	)
	for vin in vins:
		delivery = getdate(vin.delivery_date or vin.creation)
		if not delivery or delivery < getdate(window_start) or delivery > getdate(window_end):
			# Also catch high-mileage upgrade opportunities regardless of anniversary week
			mileage = flt(vin.current_odometer)
			if mileage < 80000:
				continue
			subject = f"Upgrade / trade-in opportunity for {vin.name} ({int(mileage)} km)"
		else:
			age_years = max(1, int((getdate(today()) - delivery).days / 365) or 1)
			mileage = flt(vin.current_odometer)
			subject = (
				f"Ownership anniversary ({age_years}y) / upgrade-trade-in for {vin.name}"
			)

		if frappe.db.exists(
			"DMS CRM Activity",
			{"customer": vin.current_customer, "subject": subject, "status": ["in", ["Open", "Completed"]]},
		):
			continue

		opp = frappe.db.get_value(
			"DMS CRM Opportunity",
			{"allocated_vin": vin.name, "status": "Won"},
			["name", "opportunity_owner"],
			as_dict=True,
		)
		notes = (
			f"Anniversary/campaign check. Model={vin.model_name or vin.model or '—'}; "
			f"mileage={flt(vin.current_odometer)}; delivery={delivery}."
		)
		frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": "Call",
				"subject": subject,
				"status": "Open",
				"due_datetime": f"{today()} 10:00:00",
				"assigned_to": (opp.opportunity_owner if opp else None) or "Administrator",
				"priority": "Medium",
				"opportunity": opp.name if opp else None,
				"customer": vin.current_customer,
				"reference_doctype": "VIN No",
				"reference_name": vin.name,
				"outcome_notes": notes,
			}
		).insert(ignore_permissions=True)
		created += 1
	return created
