import datetime

import frappe
from frappe import _
from frappe.utils import add_days, flt, getdate, nowdate

ACTIVE_JOB_CARD_STATUSES = [
	"Estimation Pending",
	"Estimation Approved",
	"Waiting Customer Approval",
	"Scheduled",
	"Repair In Progress",
	"Repair Completed",
	"Waiting Parts",
	"Road Test In Progress",
	"Road Test Completed",
	"QC In Progress",
	"QC Failed",
	"Rework",
]

IN_REPAIR_STATUSES = ["Repair In Progress", "Waiting Parts", "Rework"]

QC_STATUSES = ["QC In Progress", "QC Failed"]

JOB_CARD_PROGRESS = {
	"Draft": 5,
	"Open": 10,
	"Estimation Pending": 15,
	"Estimation Approved": 20,
	"Waiting Customer Approval": 20,
	"Scheduled": 25,
	"Repair In Progress": 50,
	"Repair Completed": 65,
	"Waiting Parts": 45,
	"Road Test In Progress": 75,
	"Road Test Completed": 80,
	"QC In Progress": 90,
	"QC Failed": 85,
	"Rework": 55,
	"Completed": 100,
	"Delivered": 100,
	"Cancelled": 0,
}

BAY_UI_STATUS = {
	"Available": "available",
	"Occupied": "occupied",
	"Maintenance": "maintenance",
	"Reserved": "occupied",
	"Cleaning": "available",
}


def _day_bounds(day):
	"""Return (start, end) datetime strings for a calendar day."""
	d = getdate(day)
	start = datetime.datetime.combine(d, datetime.time.min)
	end = datetime.datetime.combine(d, datetime.time.max)
	return start.strftime("%Y-%m-%d %H:%M:%S"), end.strftime("%Y-%m-%d %H:%M:%S")


def _count_appointments_for_day(day):
	start, end = _day_bounds(day)
	return frappe.db.count(
		"Service Appointment",
		{
			"appointment_date_time": ["between", [start, end]],
			"status": ["not in", ["Cancelled", "No-Show"]],
		},
	)


def _format_appointment_time(value):
	if not value:
		return ""
	try:
		dt = frappe.utils.get_datetime(value)
		return dt.strftime("%I:%M %p").lstrip("0")
	except Exception:
		return str(value)


def _job_card_progress(status):
	return int(JOB_CARD_PROGRESS.get(status or "", 10))


def _vehicle_label(license_plate=None, vehicle_model=None):
	parts = [p for p in (license_plate, vehicle_model) if p]
	return " · ".join(parts) if parts else ""


@frappe.whitelist()
def get_dashboard_summary():
	"""Aggregated metrics and lists for the DMS home dashboard."""
	today = nowdate()
	yesterday = add_days(today, -1)
	today_start, today_end = _day_bounds(today)

	today_appointments = _count_appointments_for_day(today)
	yesterday_appointments = _count_appointments_for_day(yesterday)

	active_job_cards = frappe.db.count(
		"DMS Job Card",
		{"status": ["in", ACTIVE_JOB_CARD_STATUSES]},
	)
	in_repair = frappe.db.count(
		"DMS Job Card",
		{"status": ["in", IN_REPAIR_STATUSES]},
	)
	pending_qc = frappe.db.count(
		"DMS Job Card",
		{"status": ["in", QC_STATUSES]},
	)
	urgent_qc = frappe.db.count(
		"DMS Job Card",
		{
			"status": ["in", QC_STATUSES],
			"priority": ["in", ["Urgent", "VIP"]],
		},
	)
	ready_for_delivery = frappe.db.count(
		"DMS Job Card",
		{"status": "Completed"},
	)
	awaiting_payment = frappe.db.count(
		"DMS Job Card",
		{
			"status": "Completed",
			"payment_status": ["in", ["Unpaid", "Partially Paid", ""]],
		},
	)

	job_cards = frappe.get_all(
		"DMS Job Card",
		filters={"status": ["in", ACTIVE_JOB_CARD_STATUSES]},
		fields=[
			"name", "status", "priority", "customer_name",
			"vehicle_model", "license_plate",
			"promised_delivery_date_time", "modified",
		],
		order_by="modified desc",
		limit=8,
	)

	active_jobs = []
	for jc in job_cards:
		eta = ""
		if jc.promised_delivery_date_time:
			eta = frappe.utils.format_datetime(jc.promised_delivery_date_time, "hh:mm a")
		active_jobs.append({
			"id": jc.name,
			"customer": jc.customer_name or "",
			"vehicle": _vehicle_label(jc.license_plate, jc.vehicle_model),
			"status": jc.status,
			"priority": jc.priority or "Normal",
			"eta": eta or "—",
		})

	appointments = frappe.get_all(
		"Service Appointment",
		filters={
			"appointment_date_time": ["between", [today_start, today_end]],
			"status": ["not in", ["Cancelled", "No-Show"]],
		},
		fields=[
			"name", "appointment_date_time", "customer_name",
			"license_plate", "vehicle", "status",
			"customer_complaint_summary",
		],
		order_by="appointment_date_time asc",
		limit=10,
	)

	apt_names = [a.name for a in appointments]
	service_by_parent = {}
	if apt_names:
		for row in frappe.get_all(
			"Service Type Item",
			filters={
				"parent": ["in", apt_names],
				"parenttype": "Service Appointment",
				"parentfield": "service_type_requested",
			},
			fields=["parent", "service_type"],
			order_by="idx asc",
		):
			service_by_parent.setdefault(row.parent, []).append(row.service_type)

	today_schedule = []
	for apt in appointments:
		types = service_by_parent.get(apt.name, [])
		service_label = ", ".join(types) if types else (apt.customer_complaint_summary or "Service")
		today_schedule.append({
			"id": apt.name,
			"time": _format_appointment_time(apt.appointment_date_time),
			"customer": apt.customer_name or "",
			"vehicle": _vehicle_label(apt.license_plate, apt.vehicle),
			"service": service_label[:80],
			"status": apt.status or "Booked",
		})

	bays_raw = frappe.get_all(
		"Service Bay",
		filters={"is_active": 1},
		fields=[
			"name", "bay_number", "bay_name", "current_status",
			"current_job_card", "current_vehicle",
		],
		order_by="bay_number asc",
		limit=24,
	)

	service_bays = []
	for bay in bays_raw:
		ui_status = BAY_UI_STATUS.get(bay.current_status or "Available", "available")
		vehicle_label = None
		progress = 0

		if bay.current_job_card:
			jc = frappe.db.get_value(
				"DMS Job Card",
				bay.current_job_card,
				["license_plate", "vehicle_model", "status"],
				as_dict=True,
			)
			if jc:
				vehicle_label = _vehicle_label(jc.license_plate, jc.vehicle_model)
				progress = _job_card_progress(jc.status)
				ui_status = "occupied"
		elif bay.current_vehicle:
			vin = frappe.db.get_value(
				"VIN No",
				bay.current_vehicle,
				["plate_number", "model_name"],
				as_dict=True,
			)
			if vin:
				vehicle_label = _vehicle_label(vin.plate_number, vin.model_name)

		if bay.current_status == "Maintenance":
			ui_status = "maintenance"

		service_bays.append({
			"id": bay.name,
			"bay": bay.bay_name or bay.bay_number or bay.name,
			"status": ui_status,
			"erp_status": bay.current_status,
			"vehicle": vehicle_label,
			"progress": progress,
		})

	brd_kpis = {}
	try:
		from dms.api.reports import get_brd_dashboard_kpis
		brd_kpis = get_brd_dashboard_kpis({
			"from_date": add_days(today, -30),
			"to_date": today,
		})
	except Exception:
		frappe.log_error(title="DMS BRD dashboard KPIs")

	return {
		"brd_kpis": brd_kpis,
		"stats": {
			"today_appointments": today_appointments,
			"yesterday_appointments": yesterday_appointments,
			"appointments_delta": today_appointments - yesterday_appointments,
			"active_job_cards": active_job_cards,
			"in_repair": in_repair,
			"pending_qc": pending_qc,
			"urgent_qc": urgent_qc,
			"ready_for_delivery": ready_for_delivery,
			"awaiting_payment": awaiting_payment,
		},
		"active_job_cards": active_jobs,
		"today_appointments": today_schedule,
		"service_bays": service_bays,
	}
