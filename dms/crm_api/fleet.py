"""Fleet aftersales APIs — blueprint §9.3."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, flt, getdate, today

from dms.crm_api.common import ensure_crm_read, paginate


@frappe.whitelist()
def get_fleet_aftersales(customer=None, account=None, search=None, limit=100, offset=0):
	"""Vehicle-level service due tracking for a fleet account."""
	ensure_crm_read("DMS CRM Account")
	limit, offset = paginate(limit, offset)

	if account and not customer:
		customer = frappe.db.get_value("DMS CRM Account", account, "customer")
	if not customer:
		frappe.throw(_("Customer or Account is required."))

	if not frappe.db.exists("DocType", "VIN No"):
		return {"data": [], "summary": {}, "total": 0}

	meta = frappe.get_meta("VIN No")
	filters = {}
	if meta.has_field("fleet_company"):
		filters["fleet_company"] = customer
	elif meta.has_field("current_customer"):
		filters["current_customer"] = customer
	else:
		return {"data": [], "summary": {}, "total": 0}

	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {"name": ["like", q], "vin_number": ["like", q], "model_name": ["like", q]}

	fields = ["name", "vin_number", "model", "model_name", "vehicle_status"]
	for candidate in (
		"company",
		"branch",
		"current_odometer",
		"next_service_due_date",
		"is_fleet_vehicle",
		"fleet_reference",
		"delivery_date",
		"plate_number",
	):
		if meta.has_field(candidate):
			fields.append(candidate)

	order_by = (
		"next_service_due_date asc"
		if meta.has_field("next_service_due_date")
		else "modified desc"
	)

	rows = frappe.get_all(
		"VIN No",
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by=order_by,
		limit_start=offset,
		limit_page_length=limit,
	)

	today_d = getdate(today())
	horizon = getdate(add_days(today(), 30))
	due_soon = overdue = active = 0
	for row in rows:
		if row.get("vehicle_status") not in ("Scrapped", "Sold"):
			active += 1
		due = row.get("next_service_due_date")
		if not due:
			row["service_status"] = "Unknown"
			continue
		due_d = getdate(due)
		if due_d < today_d:
			row["service_status"] = "Overdue"
			overdue += 1
		elif due_d <= horizon:
			row["service_status"] = "Due Soon"
			due_soon += 1
		else:
			row["service_status"] = "On Track"

	# Open job cards / appointments for this customer (consolidated communication signal)
	open_jobs = 0
	if frappe.db.exists("DocType", "DMS Job Card"):
		open_jobs = frappe.db.count(
			"DMS Job Card",
			{"customer": customer, "status": ["not in", ["Closed", "Cancelled", "Invoiced"]]},
		)

	agreements = frappe.get_all(
		"DMS CRM Framework Agreement",
		filters={"customer": customer, "status": "Active"},
		fields=["name", "agreement_title", "valid_to", "max_units", "utilization_units", "sla_terms"],
	)

	return {
		"customer": customer,
		"customer_name": frappe.db.get_value("Customer", customer, "customer_name"),
		"data": rows,
		"total": frappe.db.count("VIN No", filters=filters),
		"summary": {
			"total_vehicles": len(rows),
			"active": active,
			"due_soon": due_soon,
			"overdue": overdue,
			"open_job_cards": open_jobs,
			"active_agreements": len(agreements),
		},
		"agreements": agreements,
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_fleet_health_report(customer=None, account=None):
	"""Monthly fleet health style summary for an account."""
	snap = get_fleet_aftersales(customer=customer, account=account, limit=500)
	vehicles = snap.get("data") or []
	avg_odometer = 0
	ages = []
	if vehicles:
		odos = [flt(v.get("current_odometer")) for v in vehicles if v.get("current_odometer")]
		avg_odometer = sum(odos) / len(odos) if odos else 0
		for v in vehicles:
			if v.get("delivery_date"):
				ages.append((getdate(today()) - getdate(v.delivery_date)).days / 365.0)
	return {
		**snap["summary"],
		"customer": snap["customer"],
		"customer_name": snap["customer_name"],
		"average_odometer": round(avg_odometer, 1),
		"average_age_years": round(sum(ages) / len(ages), 1) if ages else None,
		"preventive_plan": (
			f"{snap['summary'].get('due_soon', 0)} vehicles due within 30 days; "
			f"{snap['summary'].get('overdue', 0)} overdue for service."
		),
		"agreements": snap.get("agreements") or [],
	}
