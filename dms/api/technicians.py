import frappe
from frappe import _
from frappe.utils import add_days, get_datetime, getdate, today

IN_PROGRESS_STATUSES = frozenset({
	"Repair In Progress",
	"Road Test In Progress",
	"QC In Progress",
	"Rework",
})

TERMINAL_STATUSES = frozenset({"Cancelled", "Delivered", "Completed", "Draft"})

JOB_CARD_FIELDS = [
	"name",
	"status",
	"customer_name",
	"vehicle_model",
	"license_plate",
	"priority",
	"posting_date",
	"schedule_start_time",
	"schedule_end_time",
	"assigned_bay",
	"job_card_type",
	"estimated_duration_hours",
	"actual_duration_hours",
	"lead_technician",
]


def _as_datetime(value):
	if not value:
		return None
	try:
		return get_datetime(value)
	except Exception:
		return None


def _intervals_overlap(start_a, end_a, start_b, end_b):
	if not start_a or not end_a or not start_b or not end_b:
		return False
	return start_a < end_b and start_b < end_a


def get_technician_jobs_for_date(technician, posting_date):
	"""Job cards where technician is lead or assistant."""
	posting_date = getdate(posting_date)

	lead_jobs = frappe.get_all(
		"DMS Job Card",
		filters={
			"lead_technician": technician,
			"posting_date": posting_date,
			"status": ["not in", list(TERMINAL_STATUSES)],
		},
		fields=JOB_CARD_FIELDS,
		order_by="schedule_start_time asc, creation asc",
	)

	assistant_rows = frappe.db.sql(
		"""
		SELECT DISTINCT jc.name
		FROM `tabJob Card Technician Assignment` jta
		INNER JOIN `tabDMS Job Card` jc ON jc.name = jta.parent
		WHERE jta.technician = %(technician)s
			AND jc.posting_date = %(posting_date)s
			AND jc.status NOT IN %(terminal)s
			AND jc.lead_technician != %(technician)s
		ORDER BY jc.schedule_start_time ASC, jc.creation ASC
		""",
		{
			"technician": technician,
			"posting_date": posting_date,
			"terminal": list(TERMINAL_STATUSES),
		},
		as_dict=True,
	)

	seen = {j.name for j in lead_jobs}
	all_jobs = []
	for job in lead_jobs:
		job["role"] = "Lead"
		all_jobs.append(job)

	for row in assistant_rows:
		if row.name in seen:
			continue
		doc = frappe.db.get_value("DMS Job Card", row.name, JOB_CARD_FIELDS, as_dict=True)
		if doc:
			doc["role"] = "Assistant"
			all_jobs.append(doc)
			seen.add(row.name)

	all_jobs.sort(
		key=lambda j: (
			_as_datetime(j.get("schedule_start_time")) or get_datetime(f"{posting_date} 23:59:59"),
			j.get("name") or "",
		)
	)
	return all_jobs


def find_schedule_overlaps(jobs):
	"""Return pairs of job cards with overlapping scheduled times."""
	scheduled = [
		j
		for j in jobs
		if j.get("schedule_start_time") and j.get("schedule_end_time")
	]
	overlaps = []
	for i, job_a in enumerate(scheduled):
		start_a = _as_datetime(job_a.schedule_start_time)
		end_a = _as_datetime(job_a.schedule_end_time)
		for job_b in scheduled[i + 1 :]:
			start_b = _as_datetime(job_b.schedule_start_time)
			end_b = _as_datetime(job_b.schedule_end_time)
			if _intervals_overlap(start_a, end_a, start_b, end_b):
				overlaps.append(
					{
						"job_a": job_a.name,
						"job_b": job_b.name,
						"status_a": job_a.status,
						"status_b": job_b.status,
					}
				)
	return overlaps


def get_in_progress_jobs(jobs):
	return [j for j in jobs if j.get("status") in IN_PROGRESS_STATUSES]


def build_day_calendar(jobs, posting_date):
	"""Timeline blocks for a single day (for UI calendar)."""
	blocks = []
	for job in jobs:
		start = _as_datetime(job.get("schedule_start_time"))
		end = _as_datetime(job.get("schedule_end_time"))
		blocks.append(
			{
				"job_card": job.name,
				"status": job.status,
				"role": job.get("role") or "Lead",
				"customer_name": job.get("customer_name"),
				"vehicle_model": job.get("vehicle_model"),
				"start": str(start) if start else None,
				"end": str(end) if end else None,
				"kind": "in_progress" if job.status in IN_PROGRESS_STATUSES else "scheduled",
			}
		)

	# Simple free windows between timed jobs (workshop day 08:00–18:00)
	day_start = get_datetime(f"{posting_date} 08:00:00")
	day_end = get_datetime(f"{posting_date} 18:00:00")
	timed = sorted(
		[
			(_as_datetime(j.schedule_start_time), _as_datetime(j.schedule_end_time))
			for j in jobs
			if j.get("schedule_start_time") and j.get("schedule_end_time")
		],
		key=lambda x: x[0],
	)
	free_slots = []
	cursor = day_start
	for start, end in timed:
		if start and end and cursor < start:
			free_slots.append({"start": str(cursor), "end": str(start)})
		if end and end > cursor:
			cursor = end
	if cursor < day_end:
		free_slots.append({"start": str(cursor), "end": str(day_end)})

	return {"blocks": blocks, "free_slots": free_slots}


def compute_availability(tech, jobs, posting_date):
	"""Derive availability_status: available | busy | not_available."""
	posting_date = getdate(posting_date)
	is_today = posting_date == getdate(today())

	attendance = tech.get("attendance_today") if is_today else None
	if is_today and attendance in ("Absent", "On Leave"):
		return {
			"availability_status": "not_available",
			"unavailable_reason": attendance,
			"currently_working": False,
			"is_available": False,
			"has_schedule_conflict": False,
			"in_progress_jobs": [],
			"schedule_overlaps": [],
		}

	in_progress = get_in_progress_jobs(jobs) if is_today else []
	overlaps = find_schedule_overlaps(jobs)

	if in_progress:
		names = ", ".join(j.name for j in in_progress[:2])
		return {
			"availability_status": "busy",
			"unavailable_reason": _("Working on {0}").format(names),
			"currently_working": True,
			"is_available": False,
			"has_schedule_conflict": bool(overlaps),
			"in_progress_jobs": [j.name for j in in_progress],
			"schedule_overlaps": overlaps,
		}

	if overlaps:
		return {
			"availability_status": "not_available",
			"unavailable_reason": _("Schedule conflict"),
			"currently_working": False,
			"is_available": False,
			"has_schedule_conflict": True,
			"in_progress_jobs": [],
			"schedule_overlaps": overlaps,
		}

	return {
		"availability_status": "available",
		"unavailable_reason": None,
		"currently_working": False,
		"is_available": True,
		"has_schedule_conflict": False,
		"in_progress_jobs": [],
		"schedule_overlaps": [],
	}


@frappe.whitelist()
def check_technician_schedule(
	technician,
	posting_date=None,
	schedule_start_time=None,
	schedule_end_time=None,
	exclude_job_card=None,
):
	"""
	Check if a technician can take a new schedule slot (lead or assistant on other jobs).
	Used when scheduling a job card.
	"""
	if not technician:
		frappe.throw(_("Technician is required"))

	posting_date = getdate(posting_date or today())
	jobs = get_technician_jobs_for_date(technician, posting_date)
	if exclude_job_card:
		jobs = [j for j in jobs if j.name != exclude_job_card]

	tech = frappe.db.get_value(
		"Technician",
		technician,
		["name", "full_name", "attendance_today", "status"],
		as_dict=True,
	)
	state = compute_availability(tech or {}, jobs, posting_date)
	conflicts = []

	if state["availability_status"] == "not_available" and state["unavailable_reason"] in (
		"Absent",
		"On Leave",
	):
		conflicts.append({"type": "attendance", "message": state["unavailable_reason"]})

	for job in get_in_progress_jobs(jobs):
		conflicts.append(
			{
				"type": "in_progress",
				"job_card": job.name,
				"status": job.status,
				"role": job.get("role"),
				"message": _("Currently working on {0} ({1})").format(job.name, job.status),
			}
		)

	new_start = _as_datetime(schedule_start_time)
	new_end = _as_datetime(schedule_end_time)
	if new_start and new_end:
		for job in jobs:
			job_start = _as_datetime(job.get("schedule_start_time"))
			job_end = _as_datetime(job.get("schedule_end_time"))
			if not job_start or not job_end:
				continue
			if _intervals_overlap(new_start, new_end, job_start, job_end):
				conflicts.append(
					{
						"type": "schedule_overlap",
						"job_card": job.name,
						"status": job.status,
						"role": job.get("role"),
						"message": _("Overlaps with {0} ({1}–{2})").format(
							job.name,
							job.schedule_start_time,
							job.schedule_end_time,
						),
					}
				)

	available = len(conflicts) == 0
	return {
		"available": available,
		"availability_status": "available" if available else "not_available",
		"conflicts": conflicts,
		"active_jobs": jobs,
	}


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

	return frappe.get_all(
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


@frappe.whitelist()
def get_technician(name):
	doc = frappe.get_doc("Technician", name)
	frappe.has_permission("Technician", "read", doc, throw=True)
	return doc.as_dict()


@frappe.whitelist()
def update_technician(name, data):
	"""Update editable Technician master fields from DMS UI."""
	if isinstance(data, str):
		import json

		data = json.loads(data)

	if not name:
		frappe.throw(_("Technician name is required"))

	doc = frappe.get_doc("Technician", name)
	doc.check_permission("write")

	updatable = [
		"first_name",
		"last_name",
		"personal_phone",
		"date_of_joining",
		"skill_level",
		"labor_rate_group",
		"status",
		"branch",
		"work_shift",
	]
	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()
	return {
		"name": doc.name,
		"full_name": doc.full_name,
		"status": doc.status,
	}


@frappe.whitelist()
def get_technician_schedule(name, date=None):
	if not date:
		date = today()
	return get_technician_jobs_for_date(name, date)


@frappe.whitelist()
def get_technician_weekly_schedule(name, start_date=None):
	if not start_date:
		start_date = today()

	weekly = {}
	for i in range(7):
		day = add_days(start_date, i)
		weekly[str(day)] = get_technician_jobs_for_date(name, day)
	return weekly


def _calendar_day_range(start_date, view="week"):
	"""Dates to show: 7-day week from start_date, or full month grid (Mon–Sun rows)."""
	from frappe.utils import get_first_day, get_last_day

	start_date = getdate(start_date or today())
	if view == "week":
		return [add_days(start_date, i) for i in range(7)]

	first = get_first_day(start_date)
	last = get_last_day(start_date)
	grid_start = add_days(first, -first.weekday())
	grid_end = add_days(last, 6 - last.weekday())
	days = []
	d = grid_start
	while d <= grid_end:
		days.append(d)
		d = add_days(d, 1)
	return days


def get_technician_availability_for_date(technician, posting_date):
	"""Single-day availability + calendar for one technician."""
	posting_date = getdate(posting_date or today())
	tech = frappe.db.get_value(
		"Technician",
		technician,
		[
			"name", "full_name", "attendance_today", "status",
			"work_shift", "branch",
		],
		as_dict=True,
	)
	if not tech:
		frappe.throw(_("Technician {0} not found").format(technician))

	jobs = get_technician_jobs_for_date(technician, posting_date)
	state = compute_availability(tech, jobs, posting_date)
	return {
		"date": str(posting_date),
		"technician": technician,
		"active_jobs": jobs,
		"active_job_count": len(jobs),
		"day_calendar": build_day_calendar(jobs, posting_date),
		**state,
	}


@frappe.whitelist()
def get_technician_availability_calendar(technician, start_date=None, view="week"):
	"""
	Week or month grid: per-day availability status, job count, and day timeline.
	view: 'week' (7 days from start_date) | 'month' (calendar month grid)
	"""
	if not technician:
		frappe.throw(_("Technician is required"))

	view = (view or "week").lower()
	if view not in ("week", "month"):
		view = "week"

	start_date = getdate(start_date or today())
	if view == "month":
		from frappe.utils import get_first_day
		start_date = get_first_day(start_date)

	days = _calendar_day_range(start_date, view)
	tech = frappe.db.get_value(
		"Technician",
		technician,
		["name", "full_name", "attendance_today", "status"],
		as_dict=True,
	)

	by_day = {}
	for day in days:
		jobs = get_technician_jobs_for_date(technician, day)
		state = compute_availability(tech or {}, jobs, day)
		by_day[str(day)] = {
			"date": str(day),
			"in_month": day.month == start_date.month if view == "month" else True,
			"active_jobs": jobs,
			"active_job_count": len(jobs),
			"day_calendar": build_day_calendar(jobs, day),
			**state,
		}

	return {
		"technician": technician,
		"view": view,
		"start_date": str(days[0]) if days else str(start_date),
		"end_date": str(days[-1]) if days else str(start_date),
		"anchor_date": str(start_date),
		"days": by_day,
	}


@frappe.whitelist()
def get_all_technicians_availability(date=None):
	"""Availability summary: Available, Busy, or Not Available (+ day calendar)."""
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
		jobs = get_technician_jobs_for_date(tech.name, target_date)
		state = compute_availability(tech, jobs, target_date)
		calendar = build_day_calendar(jobs, target_date)

		tech.update(state)
		tech["active_jobs"] = jobs
		tech["active_job_count"] = len(jobs)
		tech["day_calendar"] = calendar

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
