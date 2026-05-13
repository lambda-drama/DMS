import frappe
from frappe import _
from frappe.utils import today, nowtime, getdate, add_days, time_diff_in_hours


@frappe.whitelist()
def get_technicians(status=None, skill_level=None, search=None, limit=50):
	filters = {}
	if status:
		filters["status"] = status
	if skill_level:
		filters["skill_level"] = skill_level

	or_filters = {}
	if search:
		or_filters = {
			"full_name": ["like", f"%{search}%"],
			"name": ["like", f"%{search}%"],
			"personal_phone": ["like", f"%{search}%"],
		}

	technicians = frappe.get_all(
		"Technician",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "first_name", "last_name", "full_name",
			"status", "skill_level", "labor_rate_group",
			"personal_phone", "branch",
			"work_shift", "weekly_off_days",
			"current_assigned_bay", "current_job_card",
			"today_scheduled_jobs", "attendance_today",
			"clock_in_time", "clock_out_time",
			"efficiency_rating", "total_jobs_completed",
			"total_labor_hours", "profile_photo",
			"years_of_experience",
		],
		limit=int(limit),
		order_by="full_name asc",
	)

	return technicians


@frappe.whitelist()
def get_technician(name):
	doc = frappe.get_doc("Technician", name)
	frappe.has_permission("Technician", "read", doc, throw=True)
	return doc.as_dict()


@frappe.whitelist()
def get_technician_schedule(name, date=None):
	"""Get all job cards assigned to a technician for a given date (defaults to today)."""
	if not date:
		date = today()

	target_date = getdate(date)

	job_cards = frappe.get_all(
		"DMS Job Card",
		filters={
			"lead_technician": name,
			"posting_date": target_date,
			"status": ["not in", ["Cancelled", "Delivered"]],
		},
		fields=[
			"name", "status", "customer_name", "vehicle_model",
			"license_plate", "priority", "posting_date",
			"schedule_start_time", "schedule_end_time",
			"assigned_bay", "job_card_type",
			"estimated_duration_hours", "actual_duration_hours",
		],
		order_by="schedule_start_time asc, creation asc",
	)

	assistant_cards = frappe.get_all(
		"DMS Job Card",
		filters={
			"posting_date": target_date,
			"status": ["not in", ["Cancelled", "Delivered"]],
		},
		fields=[
			"name", "status", "customer_name", "vehicle_model",
			"license_plate", "priority", "posting_date",
			"schedule_start_time", "schedule_end_time",
			"assigned_bay", "job_card_type",
			"estimated_duration_hours", "actual_duration_hours",
		],
		order_by="schedule_start_time asc, creation asc",
	)

	assistant_job_ids = set()
	for jc in assistant_cards:
		assignments = frappe.get_all(
			"Job Card Technician Assignment",
			filters={"parent": jc.name, "technician": name},
			fields=["name"],
		)
		if assignments:
			assistant_job_ids.add(jc.name)

	lead_ids = {jc.name for jc in job_cards}

	all_cards = list(job_cards)
	for jc in assistant_cards:
		if jc.name in assistant_job_ids and jc.name not in lead_ids:
			jc["role"] = "Assistant"
			all_cards.append(jc)

	for jc in all_cards:
		if "role" not in jc:
			jc["role"] = "Lead"

	return all_cards


@frappe.whitelist()
def get_technician_weekly_schedule(name, start_date=None):
	"""Get job cards for a technician for 7 days starting from start_date."""
	if not start_date:
		start_date = today()

	weekly = {}
	for i in range(7):
		day = add_days(start_date, i)
		day_str = str(day)
		weekly[day_str] = get_technician_schedule(name, day_str)

	return weekly


@frappe.whitelist()
def get_all_technicians_availability(date=None):
	"""Get a summary of all active technicians and their availability for a given date."""
	if not date:
		date = today()

	target_date = getdate(date)

	technicians = frappe.get_all(
		"Technician",
		filters={"status": "Active"},
		fields=[
			"name", "full_name", "skill_level", "personal_phone",
			"work_shift", "current_assigned_bay", "current_job_card",
			"today_scheduled_jobs", "attendance_today",
			"clock_in_time", "clock_out_time",
			"profile_photo", "branch",
			"efficiency_rating", "total_jobs_completed",
		],
		order_by="full_name asc",
	)

	for tech in technicians:
		active_jobs = frappe.get_all(
			"DMS Job Card",
			filters={
				"lead_technician": tech.name,
				"posting_date": target_date,
				"status": ["not in", ["Cancelled", "Delivered", "Completed", "Draft"]],
			},
			fields=["name", "status", "customer_name", "vehicle_model", "schedule_start_time", "schedule_end_time", "priority"],
			order_by="schedule_start_time asc",
		)
		tech["active_jobs"] = active_jobs
		tech["active_job_count"] = len(active_jobs)

		in_progress = [j for j in active_jobs if j.status in ("Repair In Progress", "Road Test In Progress", "QC In Progress")]
		tech["currently_working"] = len(in_progress) > 0
		tech["is_available"] = (
			tech.attendance_today in ("Present", None, "")
			and tech.status == "Active"
			and len(in_progress) == 0
			and len(active_jobs) < 3
		)

	return technicians


@frappe.whitelist()
def clock_in(name):
	doc = frappe.get_doc("Technician", name)
	doc.clock_in()
	return {"clock_in_time": str(doc.clock_in_time)}


@frappe.whitelist()
def clock_out(name):
	doc = frappe.get_doc("Technician", name)
	doc.clock_out()
	return {"clock_out_time": str(doc.clock_out_time)}
