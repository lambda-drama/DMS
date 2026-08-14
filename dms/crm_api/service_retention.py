"""Aftersales CRM service retention — blueprint §10.

Reuses VIN / Vehicle Model service intervals (date or mileage, whichever first).
Reminder sequence timing comes from DMS CRM Settings (editable).
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import (
	add_days,
	add_to_date,
	cint,
	flt,
	getdate,
	now_datetime,
	today,
)

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
)

SERVICE_DUE = "DMS CRM Service Due"
REMINDER_LOG = "DMS CRM Reminder Log"
DEFERRED = "DMS CRM Deferred Work"
SETTINGS = "DMS CRM Settings"

# Retain history but exclude from ordinary reminder queues
EXCLUDED_VEHICLE_STATUSES = {
	"Scrapped",
	"Total Loss",
	"In Stock",
	"Allocated",
	"In Transit",
}
SOLD_VEHICLE_STATUSES = {"Scrapped", "Total Loss"}
INACTIVE_VEHICLE_STATUSES = {"In Stock", "Allocated", "In Transit"}
RETENTION_CLASSIFICATIONS = (
	"Upcoming",
	"Due",
	"Overdue",
	"Severely Overdue",
	"Lapsed",
	"Recovered",
	"Inactive",
	"Vehicle Sold",
	"Unreachable",
)


def _settings():
	try:
		return frappe.get_cached_doc(SETTINGS)
	except Exception:
		return frappe._dict(
			enable_service_retention=1,
			default_average_daily_km=40,
			upcoming_days=30,
			severely_overdue_days=30,
			lapsed_days=90,
			enable_workshop_journey_events=1,
			post_service_followup_hours_min=24,
			post_service_followup_hours_max=72,
			service_reminder_sequence=[],
		)


def _resolve_intervals(vin_row) -> tuple[float | None, int | None]:
	"""Prefer VIN fields, else Vehicle Model default service interval."""
	interval_km = flt(vin_row.get("service_interval_km") or 0) or None
	interval_months = cint(vin_row.get("service_interval_months") or 0) or None
	if (interval_km and interval_months) or not vin_row.get("model"):
		return interval_km, interval_months
	if not frappe.db.exists("DocType", "Vehicle Model"):
		return interval_km, interval_months
	try:
		model = frappe.get_cached_doc("Vehicle Model", vin_row.model)
	except Exception:
		return interval_km, interval_months
	default_km = default_months = None
	for rule in model.get("service_intervals") or []:
		if cint(rule.is_default):
			default_km = flt(rule.interval_km) or default_km
			default_months = cint(rule.interval_months) or default_months
		if rule.condition == "Fleet Vehicle" and cint(vin_row.get("is_fleet_vehicle")):
			return flt(rule.interval_km) or interval_km, cint(rule.interval_months) or interval_months
	return interval_km or default_km, interval_months or default_months


def _estimate_average_daily_km(vin_row, settings) -> float:
	"""Estimate usage from last odometer update / delivery when no telematics."""
	current = flt(vin_row.get("current_odometer") or 0)
	last_updated = vin_row.get("odometer_last_updated")
	delivery = vin_row.get("delivery_date")
	base_date = None
	base_odo = 0.0
	if last_updated and current:
		# Prefer short-window estimate only when we have a prior snapshot isn't stored;
		# fall back to delivery → now.
		pass
	if delivery and current:
		base_date = getdate(delivery)
		base_odo = 0.0
	if base_date:
		days = max((getdate(today()) - base_date).days, 1)
		avg = current / days
		if avg > 0:
			return round(avg, 2)
	return flt(settings.default_average_daily_km or 40)


def _project_mileage_due_date(vin_row, due_km: float | None, avg_daily: float) -> str | None:
	if not due_km or avg_daily <= 0:
		return None
	current = flt(vin_row.get("current_odometer") or 0)
	remaining = due_km - current
	if remaining <= 0:
		return today()
	days = int(remaining / avg_daily)
	return add_days(today(), max(days, 0))


def compute_due_snapshot(vin_name: str | None = None, vin_row=None) -> dict:
	"""Compute date/mileage due using whichever threshold occurs first."""
	settings = _settings()
	if vin_row is None:
		vin_row = frappe.db.get_value(
			"VIN No",
			vin_name,
			[
				"name",
				"vin_number",
				"current_customer",
				"model",
				"vehicle_status",
				"current_odometer",
				"odometer_last_updated",
				"last_service_date",
				"last_service_odometer",
				"delivery_date",
				"next_service_due_date",
				"next_service_due_km",
				"service_interval_km",
				"service_interval_months",
				"is_fleet_vehicle",
				"company",
				"branch",
			],
			as_dict=True,
		)
	if not vin_row:
		frappe.throw(_("VIN not found."))

	interval_km, interval_months = _resolve_intervals(vin_row)
	due_date = vin_row.get("next_service_due_date")
	due_km = flt(vin_row.get("next_service_due_km") or 0) or None

	# Recalculate from intervals when VIN stored next-due is empty
	if not due_date and interval_months:
		base = vin_row.get("last_service_date") or vin_row.get("delivery_date")
		if base:
			from frappe.utils import add_months

			due_date = add_months(getdate(base), interval_months)
	if not due_km and interval_km:
		base_odo = flt(vin_row.get("last_service_odometer") or 0)
		if not base_odo:
			base_odo = flt(vin_row.get("current_odometer") or 0)
		due_km = base_odo + interval_km if base_odo or interval_km else None

	avg_daily = _estimate_average_daily_km(vin_row, settings)
	estimated_odo = flt(vin_row.get("current_odometer") or 0)
	if vin_row.get("odometer_last_updated"):
		days_since = max((getdate(today()) - getdate(vin_row.odometer_last_updated)).days, 0)
		estimated_odo = flt(vin_row.get("current_odometer") or 0) + days_since * avg_daily

	mileage_due_date = _project_mileage_due_date(vin_row, due_km, avg_daily)
	trigger_basis = "Whichever First"
	effective = None
	if due_date and mileage_due_date:
		effective = min(getdate(due_date), getdate(mileage_due_date))
		trigger_basis = (
			"Date" if getdate(due_date) <= getdate(mileage_due_date) else "Mileage"
		)
	elif due_date:
		effective = getdate(due_date)
		trigger_basis = "Date"
	elif mileage_due_date:
		effective = getdate(mileage_due_date)
		trigger_basis = "Mileage"

	# Mileage already past due_km → due now
	if due_km and estimated_odo >= due_km:
		effective = getdate(today())
		trigger_basis = "Mileage"

	classification = _classify(effective, settings)
	vehicle_status = vin_row.get("vehicle_status") or ""
	excluded = vehicle_status in EXCLUDED_VEHICLE_STATUSES
	if vehicle_status in SOLD_VEHICLE_STATUSES:
		classification = "Vehicle Sold"
		excluded = True
	elif vehicle_status in INACTIVE_VEHICLE_STATUSES:
		classification = "Inactive"
		excluded = True

	lifecycle = "Periodic Maintenance"
	if vin_row.get("delivery_date"):
		age_days = (getdate(today()) - getdate(vin_row.delivery_date)).days
		if age_days <= 45 and not vin_row.get("last_service_date"):
			lifecycle = "First Service"
		elif age_days <= 14:
			lifecycle = "Owner Onboarding"

	return {
		"vin": vin_row.name,
		"customer": vin_row.get("current_customer"),
		"model": vin_row.get("model"),
		"company": vin_row.get("company"),
		"branch": vin_row.get("branch"),
		"is_fleet": cint(vin_row.get("is_fleet_vehicle")),
		"due_date": getdate(due_date) if due_date else None,
		"due_km": due_km,
		"trigger_basis": trigger_basis,
		"effective_due_date": effective,
		"current_odometer": flt(vin_row.get("current_odometer") or 0),
		"estimated_odometer": round(estimated_odo, 1),
		"average_daily_km": avg_daily,
		"interval_km": interval_km,
		"interval_months": interval_months,
		"classification": classification,
		"lifecycle_stage": lifecycle,
		"vehicle_status": vin_row.get("vehicle_status"),
		"excluded": excluded,
	}


def _classify(effective_due, settings) -> str:
	if not effective_due:
		return "Inactive"
	today_d = getdate(today())
	due_d = getdate(effective_due)
	delta = (due_d - today_d).days
	upcoming = cint(settings.upcoming_days or 30)
	severe = cint(settings.severely_overdue_days or 30)
	lapsed = cint(settings.lapsed_days or 90)
	if delta > upcoming:
		return "Upcoming"
	if delta >= 0:
		return "Due" if delta == 0 else "Upcoming"
	overdue_days = abs(delta)
	if overdue_days >= lapsed:
		return "Lapsed"
	if overdue_days >= severe:
		return "Severely Overdue"
	return "Overdue"


def _retention_overrides(classification, existing=None):
	"""Apply Recovered / Unreachable on top of date-based classification (Appendix A5)."""
	if not existing or classification in ("Vehicle Sold", "Inactive"):
		return classification
	prev = existing.classification
	if prev == "Lapsed" and (
		existing.status in ("Booked", "In Service", "Completed")
		or classification in ("Upcoming", "Due")
	):
		return "Recovered"
	if classification in ("Overdue", "Severely Overdue", "Lapsed") and frappe.db.exists(
		REMINDER_LOG,
		{"service_due": existing.name, "status": "Failed"},
	):
		return "Unreachable"
	return classification


@frappe.whitelist()
def sync_service_due(limit=200):
	"""Upsert open Service Due records from delivered / in-service VINs."""
	ensure_crm_write(SERVICE_DUE)
	settings = _settings()
	if not cint(settings.enable_service_retention):
		return {"synced": 0, "message": "Service retention disabled in DMS CRM Settings"}

	if not frappe.db.exists("DocType", "VIN No"):
		return {"synced": 0}

	meta = frappe.get_meta("VIN No")
	fields = [
		"name",
		"vin_number",
		"current_customer",
		"model",
		"vehicle_status",
		"current_odometer",
		"delivery_date",
		"next_service_due_date",
		"next_service_due_km",
		"service_interval_km",
		"service_interval_months",
		"is_fleet_vehicle",
		"company",
	]
	for candidate in (
		"branch",
		"odometer_last_updated",
		"last_service_date",
		"last_service_odometer",
	):
		if meta.has_field(candidate):
			fields.append(candidate)

	filters = {
		"vehicle_status": ["in", ["Delivered to Customer", "In Service"]],
		"current_customer": ["is", "set"],
	}
	vins = frappe.get_all(
		"VIN No",
		filters=filters,
		fields=fields,
		limit_page_length=cint(limit) or 200,
		order_by="modified desc",
	)
	synced = 0
	for row in vins:
		snap = compute_due_snapshot(vin_row=row)
		if not snap.get("effective_due_date") and not snap.get("due_km"):
			continue
		existing = frappe.db.get_value(
			SERVICE_DUE,
			{"vin": row.name, "status": ["in", ["Open", "Booked", "In Service"]]},
			"name",
		)
		payload = {
			"customer": snap["customer"],
			"model": snap["model"],
			"company": snap["company"],
			"branch": snap.get("branch"),
			"is_fleet": snap["is_fleet"],
			"lifecycle_stage": snap["lifecycle_stage"],
			"classification": snap["classification"],
			"due_date": snap["due_date"],
			"due_km": snap["due_km"],
			"trigger_basis": snap["trigger_basis"],
			"effective_due_date": snap["effective_due_date"],
			"current_odometer": snap["current_odometer"],
			"estimated_odometer": snap["estimated_odometer"],
			"average_daily_km": snap["average_daily_km"],
			"interval_km": snap["interval_km"],
			"interval_months": snap["interval_months"],
			"status": "Excluded" if snap["excluded"] else "Open",
		}
		if existing:
			doc = frappe.get_doc(SERVICE_DUE, existing)
			payload["classification"] = _retention_overrides(payload["classification"], doc)
			# Preserve manual adjustments
			for key, value in payload.items():
				if key in ("due_date", "due_km", "effective_due_date") and (
					doc.adjusted_due_date or doc.adjusted_due_km
				):
					if key == "effective_due_date":
						doc.effective_due_date = doc.adjusted_due_date or value
					elif key == "due_date":
						doc.due_date = value
					elif key == "due_km":
						doc.due_km = value
					continue
				doc.set(key, value)
			doc.save(ignore_permissions=True)
		else:
			doc = frappe.get_doc({"doctype": SERVICE_DUE, "vin": row.name, **payload})
			doc.insert(ignore_permissions=True)
		synced += 1

	# Mark existing dues whose VIN is no longer in the ownership cycle
	for due in frappe.get_all(
		SERVICE_DUE,
		filters={"status": ["in", ["Open", "Booked", "In Service"]]},
		fields=["name", "vin"],
		limit_page_length=5000,
	):
		vs = frappe.db.get_value("VIN No", due.vin, "vehicle_status")
		if vs in SOLD_VEHICLE_STATUSES:
			frappe.db.set_value(
				SERVICE_DUE,
				due.name,
				{"classification": "Vehicle Sold", "status": "Excluded"},
				update_modified=False,
			)
			synced += 1

	frappe.db.commit()
	return {"synced": synced}


@frappe.whitelist()
def get_service_due_list(classification=None, status=None, search=None, limit=50, offset=0):
	ensure_crm_read(SERVICE_DUE)
	limit, offset = paginate(limit, offset)
	filters = {}
	if classification and classification != "all":
		filters["classification"] = classification
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"vin": ["like", q],
			"customer": ["like", q],
		}
	rows = frappe.get_all(
		SERVICE_DUE,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"vin",
			"customer",
			"classification",
			"status",
			"lifecycle_stage",
			"effective_due_date",
			"due_km",
			"trigger_basis",
			"is_fleet",
			"last_reminder_step",
			"modified",
		],
		order_by="effective_due_date asc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["customer_name"] = customer_display_name(row.customer)
		row["vin_number"] = frappe.db.get_value("VIN No", row.vin, "vin_number") or row.vin
	# Summary counts
	summary = {}
	for cls in RETENTION_CLASSIFICATIONS:
		summary[cls] = frappe.db.count(
			SERVICE_DUE, {"classification": cls, "status": ["in", ["Open", "Booked"]]}
		)
	return {
		"data": rows,
		"summary": summary,
		"total": frappe.db.count(SERVICE_DUE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_service_due(name):
	ensure_crm_read(SERVICE_DUE)
	doc = frappe.get_doc(SERVICE_DUE, name)
	data = doc.as_dict()
	data["customer_name"] = customer_display_name(doc.customer)
	data["vin_number"] = frappe.db.get_value("VIN No", doc.vin, "vin_number") or doc.vin
	data["reminders"] = frappe.get_all(
		REMINDER_LOG,
		filters={"service_due": doc.name},
		fields=["name", "step_key", "label", "channel", "status", "sent_on", "activity", "priority"],
		order_by="creation desc",
		limit=50,
	)
	return data


@frappe.whitelist()
def adjust_service_due(name, data=None):
	"""Manual adjustment with reason + audit trail."""
	ensure_crm_write(SERVICE_DUE)
	payload = parse_json(data)
	doc = frappe.get_doc(SERVICE_DUE, name)
	if "adjusted_due_date" in payload:
		doc.adjusted_due_date = payload.get("adjusted_due_date") or None
	if "adjusted_due_km" in payload:
		doc.adjusted_due_km = payload.get("adjusted_due_km")
	doc.adjustment_reason = payload.get("adjustment_reason")
	if "status" in payload:
		doc.status = payload.get("status")
	if "notes" in payload:
		doc.notes = payload.get("notes")
	if "service_appointment" in payload:
		doc.service_appointment = payload.get("service_appointment")
	if "job_card" in payload:
		doc.job_card = payload.get("job_card")
	doc.save()
	frappe.db.commit()
	return get_service_due(doc.name)


@frappe.whitelist()
def run_reminder_sequence(limit=200):
	"""Daily: fire due reminder steps from DMS CRM Settings sequence."""
	ensure_crm_write(REMINDER_LOG)
	settings = _settings()
	if not cint(settings.enable_service_retention):
		return {"created": 0, "message": "disabled"}

	steps = [
		s
		for s in (settings.get("service_reminder_sequence") or [])
		if cint(getattr(s, "enabled", 1))
	]
	if not steps:
		from dms.customer_relationship_management.doctype.dms_crm_settings.dms_crm_settings import (
			DEFAULT_REMINDER_SEQUENCE,
		)

		steps = [frappe._dict(s) for s in DEFAULT_REMINDER_SEQUENCE]

	today_d = getdate(today())
	open_dues = frappe.get_all(
		SERVICE_DUE,
		filters={
			"status": ["in", ["Open", "Booked"]],
			"classification": ["not in", ["Inactive", "Vehicle Sold", "Unreachable"]],
		},
		fields=["name", "vin", "customer", "effective_due_date", "classification", "is_fleet"],
		limit_page_length=cint(limit) or 200,
	)
	created = 0
	for due in open_dues:
		if not due.effective_due_date:
			continue
		due_d = getdate(due.effective_due_date)
		days_from_due = (today_d - due_d).days  # negative = before due
		for step in steps:
			offset = cint(step.days_offset)
			if days_from_due != offset:
				continue
			step_key = step.step_key
			if frappe.db.exists(
				REMINDER_LOG, {"service_due": due.name, "step_key": step_key}
			):
				continue
			activity_name = None
			if cint(getattr(step, "create_activity", 1)):
				priority = step.priority or "Medium"
				if priority == "Urgent":
					priority = "High"
				activity = frappe.get_doc(
					{
						"doctype": "DMS CRM Activity",
						"activity_type": step.activity_type or "Service Reminder",
						"subject": f"{step.label or step_key}: {due.vin}",
						"status": "Open",
						"priority": priority,
						"customer": due.customer,
						"due_datetime": add_to_date(now_datetime(), hours=4),
						"reference_doctype": SERVICE_DUE,
						"reference_name": due.name,
						"outcome_notes": step.human_action or "",
					}
				)
				activity.insert(ignore_permissions=True)
				activity_name = activity.name
			log = frappe.get_doc(
				{
					"doctype": REMINDER_LOG,
					"service_due": due.name,
					"vin": due.vin,
					"customer": due.customer,
					"step_key": step_key,
					"label": step.label,
					"channel": step.channel or "Activity",
					"status": "Sent",
					"sent_on": now_datetime(),
					"activity": activity_name,
					"priority": step.priority,
					"human_action": step.human_action,
				}
			)
			log.insert(ignore_permissions=True)
			frappe.db.set_value(
				SERVICE_DUE,
				due.name,
				{"last_reminder_step": step_key, "last_reminder_on": now_datetime()},
				update_modified=False,
			)
			created += 1
	frappe.db.commit()
	return {"created": created}


# ── Deferred work (§10.5) ───────────────────────────────────────────


@frappe.whitelist()
def get_deferred_work(status=None, category=None, search=None, limit=50, offset=0):
	ensure_crm_read(DEFERRED)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	if category and category != "all":
		filters["category"] = category
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {"name": ["like", q], "title": ["like", q], "customer": ["like", q], "vin": ["like", q]}
	rows = frappe.get_all(
		DEFERRED,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"title",
			"customer",
			"vin",
			"category",
			"urgency",
			"status",
			"estimated_value",
			"recovered_value",
			"next_follow_up",
			"expiry_date",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["customer_name"] = customer_display_name(row.customer)
	recovered = frappe.db.sql(
		f"""
		select coalesce(sum(recovered_value), 0)
		from `tab{DEFERRED}`
		where status = 'Completed'
		"""
	)[0][0]
	pipeline = frappe.db.sql(
		f"""
		select coalesce(sum(estimated_value), 0)
		from `tab{DEFERRED}`
		where status in ('Open', 'Follow-Up')
		"""
	)[0][0]
	return {
		"data": rows,
		"total": frappe.db.count(DEFERRED, filters=filters),
		"recovered_revenue": flt(recovered),
		"open_pipeline_value": flt(pipeline),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def create_deferred_work(data=None):
	ensure_crm_create(DEFERRED)
	payload = parse_json(data)
	if not payload.get("title"):
		frappe.throw(_("Title is required."))
	doc = frappe.get_doc({"doctype": DEFERRED, **{k: v for k, v in payload.items() if k != "doctype"}})
	doc.insert()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def update_deferred_work(name, data=None):
	ensure_crm_write(DEFERRED)
	payload = parse_json(data)
	doc = frappe.get_doc(DEFERRED, name)
	for key, value in payload.items():
		if key in ("name", "doctype"):
			continue
		doc.set(key, value)
	doc.save()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def import_deferred_from_additional_work(additional_work_request):
	"""Create CRM deferred-work row from rejected / pending DMS Additional Work Request."""
	ensure_crm_create(DEFERRED)
	if not frappe.db.exists("DMS Additional Work Request", additional_work_request):
		frappe.throw(_("Additional Work Request not found."))
	awr = frappe.get_doc("DMS Additional Work Request", additional_work_request)
	existing = frappe.db.get_value(
		DEFERRED, {"additional_work_request": awr.name}, "name"
	)
	if existing:
		return frappe.get_doc(DEFERRED, existing).as_dict()
	job = None
	if awr.get("job_card"):
		job = frappe.db.get_value(
			"DMS Job Card",
			awr.job_card,
			["customer", "vehicle_vin", "company"],
			as_dict=True,
		)
	doc = frappe.get_doc(
		{
			"doctype": DEFERRED,
			"title": (awr.get("description") or awr.name)[:140],
			"customer": (job.customer if job else None) or awr.get("customer"),
			"vin": (job.vehicle_vin if job else None),
			"company": (job.company if job else None),
			"job_card": awr.get("job_card"),
			"additional_work_request": awr.name,
			"category": "Maintenance",
			"urgency": "High" if (awr.get("reason") or "").lower().find("safety") >= 0 else "Medium",
			"description": awr.get("description"),
			"evidence_notes": awr.get("reason"),
			"status": "Open",
			"next_follow_up": add_days(today(), 7),
		}
	)
	doc.insert()
	frappe.db.commit()
	return doc.as_dict()


# ── Workshop journey CRM events (§10.4) ─────────────────────────────


WORKSHOP_EVENT_SUBJECTS = {
	"appointment_confirmed": "Appointment confirmation",
	"appointment_reminder": "Appointment reminder",
	"vehicle_received": "Vehicle received notification",
	"estimate_approval": "Estimate approval request",
	"parts_delay": "Parts / completion delay update",
	"ready_for_collection": "Ready for collection",
	"invoice_payment": "Invoice and payment communication",
	"delivery_thanks": "Delivery thank-you message",
	"post_service_followup": "Post-service follow-up (24-72h)",
}


@frappe.whitelist()
def create_workshop_journey_event(event_key, data=None):
	"""Create a CRM activity for a workshop journey milestone."""
	ensure_crm_create("DMS CRM Activity")
	settings = _settings()
	if not cint(settings.enable_workshop_journey_events):
		return {"skipped": True}
	payload = parse_json(data)
	subject = WORKSHOP_EVENT_SUBJECTS.get(event_key) or event_key
	due = now_datetime()
	if event_key == "post_service_followup":
		hours = cint(settings.post_service_followup_hours_min or 24)
		due = add_to_date(now_datetime(), hours=hours)
	activity = frappe.get_doc(
		{
			"doctype": "DMS CRM Activity",
			"activity_type": payload.get("activity_type") or "Service Reminder",
			"subject": f"{subject}: {payload.get('reference_label') or payload.get('job_card') or ''}".strip(
				": "
			),
			"status": "Open",
			"priority": payload.get("priority") or "Medium",
			"customer": payload.get("customer"),
			"due_datetime": due,
			"reference_doctype": payload.get("reference_doctype"),
			"reference_name": payload.get("reference_name"),
			"outcome_notes": payload.get("notes"),
		}
	)
	activity.insert(ignore_permissions=True)
	# After completion → refresh next service due
	if event_key in ("ready_for_collection", "delivery_thanks") and payload.get("vin"):
		try:
			sync_one = compute_due_snapshot(vin_name=payload["vin"])
			existing = frappe.db.get_value(
				SERVICE_DUE,
				{"vin": payload["vin"], "status": ["in", ["Open", "Booked", "In Service", "Completed"]]},
				"name",
				order_by="modified desc",
			)
			if existing and event_key == "ready_for_collection":
				frappe.db.set_value(SERVICE_DUE, existing, "status", "Completed")
			# Open next cycle
			if sync_one.get("effective_due_date"):
				frappe.get_doc(
					{
						"doctype": SERVICE_DUE,
						"vin": payload["vin"],
						"customer": sync_one.get("customer") or payload.get("customer"),
						"status": "Open",
						**{
							k: sync_one[k]
							for k in (
								"model",
								"company",
								"branch",
								"is_fleet",
								"lifecycle_stage",
								"classification",
								"due_date",
								"due_km",
								"trigger_basis",
								"effective_due_date",
								"current_odometer",
								"estimated_odometer",
								"average_daily_km",
								"interval_km",
								"interval_months",
							)
							if k in sync_one
						},
					}
				).insert(ignore_permissions=True)
		except Exception:
			frappe.log_error(frappe.get_traceback(), "service_retention.next_cycle")
	frappe.db.commit()
	return {"activity": activity.name}


@frappe.whitelist()
def get_retention_settings():
	ensure_crm_read(SETTINGS)
	doc = frappe.get_single(SETTINGS)
	return {
		"enable_service_retention": cint(doc.enable_service_retention),
		"default_average_daily_km": flt(doc.default_average_daily_km),
		"upcoming_days": cint(doc.upcoming_days),
		"severely_overdue_days": cint(doc.severely_overdue_days),
		"lapsed_days": cint(doc.lapsed_days),
		"enable_workshop_journey_events": cint(doc.enable_workshop_journey_events),
		"post_service_followup_hours_min": cint(doc.post_service_followup_hours_min),
		"post_service_followup_hours_max": cint(doc.post_service_followup_hours_max),
		"service_reminder_sequence": [
			{
				"enabled": cint(r.enabled),
				"step_key": r.step_key,
				"label": r.label,
				"days_offset": cint(r.days_offset),
				"channel": r.channel,
				"priority": r.priority,
				"create_activity": cint(r.create_activity),
				"activity_type": r.activity_type,
				"human_action": r.human_action,
			}
			for r in (doc.service_reminder_sequence or [])
		],
	}


@frappe.whitelist()
def get_reminder_logs(service_due=None, status=None, limit=50, offset=0):
	ensure_crm_read(REMINDER_LOG)
	limit, offset = paginate(limit, offset)
	filters = {}
	if service_due:
		filters["service_due"] = service_due
	if status and status != "all":
		filters["status"] = status
	rows = frappe.get_all(
		REMINDER_LOG,
		filters=filters,
		fields=[
			"name",
			"service_due",
			"vin",
			"customer",
			"step_key",
			"label",
			"channel",
			"status",
			"sent_on",
			"activity",
			"priority",
		],
		order_by="creation desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["customer_name"] = customer_display_name(row.customer)
	return {"data": rows, "total": frappe.db.count(REMINDER_LOG, filters=filters)}
