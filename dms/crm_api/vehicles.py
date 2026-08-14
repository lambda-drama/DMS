# Copyright (c) 2026, Mania and contributors
"""CRM Vehicle 360 — aggregate profile for one VIN No (buyer, sales, aftersales)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, today

from dms.crm_api.common import ensure_crm_read, paginate

DOCTYPE = "VIN No"

OPEN_OPP_STATUSES = {"Open", "On Hold"}
OPEN_CASE_STATUSES = {
	"New",
	"Acknowledged",
	"Assigned",
	"Investigation",
	"Awaiting Customer",
	"Awaiting Internal Action",
	"Resolution Proposed",
	"Reopened",
}
OPEN_ACTIVITY_STATUSES = {"Open", "Pending", "Scheduled"}

IDENTITY_FIELDS = [
	"name",
	"vin_number",
	"engine_number",
	"plate_number",
	"linked_item",
	"model",
	"model_name",
	"model_year",
	"brand",
	"fuel_type",
	"transmission",
	"drive_type",
	"exterior_color",
	"interior_color",
	"current_customer",
	"customer_name",
	"owner_mobile",
	"owner_email",
	"owner_tax_id",
	"delivery_date",
	"assigned_driver",
	"driver_phone",
	"warranty_start_date",
	"warranty_end_date",
	"warranty_km_limit",
	"warranty_status",
	"current_odometer",
	"odometer_unit",
	"last_service_date",
	"last_service_odometer",
	"next_service_due_km",
	"next_service_due_date",
	"service_interval_km",
	"service_interval_months",
	"vehicle_status",
	"status",
	"company",
	"is_fleet_vehicle",
	"fleet_company",
	"fleet_reference",
	"insurance_company",
	"insurance_policy_number",
	"insurance_expiry_date",
	"registration_date",
	"special_notes",
]


def _safe_all(doctype: str, *, filters=None, fields=None, order_by=None, limit=50):
	if not frappe.db.exists("DocType", doctype):
		return []
	return frappe.get_all(
		doctype,
		filters=filters or {},
		fields=fields or ["name"],
		order_by=order_by or "modified desc",
		limit_page_length=limit,
	)


def _fields_present(doctype: str, wanted: list[str]) -> list[str]:
	if not frappe.db.exists("DocType", doctype):
		return ["name"] if "name" in wanted else []
	meta = frappe.get_meta(doctype)
	return [f for f in wanted if f == "name" or meta.has_field(f)]


def _advisor_names(ids) -> dict[str, str]:
	unique = list({str(n).strip() for n in ids if n and str(n).strip()})
	if not unique or not frappe.db.exists("DocType", "Service Advisor"):
		return {}
	rows = frappe.get_all(
		"Service Advisor",
		filters={"name": ["in", unique]},
		fields=["name", "full_name"],
	)
	return {r.name: (r.full_name or r.name).strip() or r.name for r in rows}


def _resolve_vin(vin: str) -> str:
	vin = (vin or "").strip()
	if not vin:
		frappe.throw(_("VIN is required."))
	if frappe.db.exists(DOCTYPE, vin):
		return vin
	name = frappe.db.get_value(DOCTYPE, {"vin_number": vin}, "name")
	if name:
		return name
	frappe.throw(_("Vehicle {0} was not found.").format(vin))


def _by_vin(doctype: str, field: str, vin: str, wanted: list[str], *, order_by=None, limit=40):
	if not frappe.db.exists("DocType", doctype):
		return []
	meta = frappe.get_meta(doctype)
	if not meta.has_field(field):
		return []
	return _safe_all(
		doctype,
		filters={field: vin},
		fields=_fields_present(doctype, wanted),
		order_by=order_by,
		limit=limit,
	)


def _owner(customer: str | None) -> dict | None:
	customer = (customer or "").strip()
	if not customer or not frappe.db.exists("Customer", customer):
		return None
	fields = _fields_present(
		"Customer",
		[
			"name",
			"customer_name",
			"customer_type",
			"customer_group",
			"territory",
			"mobile_no",
			"email_id",
			"tax_id",
			"disabled",
		],
	)
	row = frappe.db.get_value("Customer", customer, fields, as_dict=True)
	return dict(row) if row else None


def _ownership_history(vin: str) -> list[dict]:
	if not frappe.db.exists("DocType", "VIN Customer History"):
		return []
	rows = _safe_all(
		"VIN Customer History",
		filters={"parent": vin},
		fields=[
			"name",
			"customer",
			"customer_name",
			"relationship",
			"mobile_no",
			"email_id",
			"from_date",
			"to_date",
			"is_current",
			"notes",
		],
		order_by="is_current desc, from_date desc",
		limit=50,
	)
	for r in rows:
		r["ownership_status"] = "Current" if cint(r.get("is_current")) else "Previous"
	return rows


def _with_advisors(rows: list[dict], field: str) -> list[dict]:
	names = _advisor_names(r.get(field) for r in rows)
	out_key = f"{field}_name"
	for r in rows:
		r[out_key] = names.get(r.get(field)) or r.get(field)
	return rows


def _sales_appointments(opportunity_names: list[str]) -> list[dict]:
	if not opportunity_names or not frappe.db.exists("DocType", "DMS CRM Sales Appointment"):
		return []
	rows = _safe_all(
		"DMS CRM Sales Appointment",
		filters={"opportunity": ["in", opportunity_names]},
		fields=[
			"name",
			"opportunity",
			"customer",
			"appointment_datetime",
			"duration_minutes",
			"status",
			"appointment_type",
			"assigned_to",
			"agenda",
			"modified",
		],
		order_by="appointment_datetime desc",
		limit=30,
	)
	for r in rows:
		r["owner_name"] = (
			frappe.db.get_value("User", r.assigned_to, "full_name") if r.get("assigned_to") else None
		) or r.get("assigned_to")
	return rows


def _finance_from_job_cards(job_cards: list[dict]) -> dict:
	invoice_names = [r.get("invoice") for r in job_cards if r.get("invoice")]
	invoices = []
	outstanding = 0.0
	invoiced_total = 0.0
	paid_total = 0.0
	overdue_count = 0
	if invoice_names and frappe.db.exists("DocType", "Sales Invoice"):
		fields = _fields_present(
			"Sales Invoice",
			[
				"name",
				"customer",
				"posting_date",
				"due_date",
				"status",
				"grand_total",
				"outstanding_amount",
				"currency",
				"is_return",
				"docstatus",
			],
		)
		invoices = frappe.get_all(
			"Sales Invoice",
			filters={"name": ["in", invoice_names], "docstatus": ["<", 2]},
			fields=fields,
			order_by="posting_date desc",
			limit_page_length=40,
		)
		today_d = getdate(today())
		for inv in invoices:
			gt = flt(inv.get("grand_total"))
			out = flt(inv.get("outstanding_amount"))
			if not cint(inv.get("is_return")):
				invoiced_total += gt
			outstanding += out
			paid_total += max(gt - out, 0)
			due = inv.get("due_date")
			if out > 0 and due and getdate(due) < today_d:
				overdue_count += 1
				inv["is_overdue"] = 1
			else:
				inv["is_overdue"] = 0
	return {
		"invoices": invoices,
		"outstanding": outstanding,
		"invoiced_total": invoiced_total,
		"paid_total": paid_total,
		"overdue_count": overdue_count,
	}


def _warranty(vin: str, doc) -> dict:
	try:
		from dms.utils.warranty import get_warranty_summary

		return get_warranty_summary(doc, recalculate=True) or {}
	except Exception:
		frappe.log_error(title="CRM Vehicle 360 warranty")
		return {
			"warranty_status": getattr(doc, "warranty_status", None),
			"warranty_end_date": getattr(doc, "warranty_end_date", None),
			"warranty_km_limit": getattr(doc, "warranty_km_limit", None),
		}


@frappe.whitelist()
def get_vehicles(search=None, customer=None, vehicle_status=None, warranty_status=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	if customer:
		filters["current_customer"] = customer
	if vehicle_status and vehicle_status != "all":
		filters["vehicle_status"] = vehicle_status
	if warranty_status and warranty_status != "all":
		if warranty_status == "Inactive":
			filters["warranty_status"] = ["in", ["Inactive", "Expired by Time"]]
		else:
			filters["warranty_status"] = warranty_status

	or_filters = None
	search = (search or "").strip()
	if search:
		q = f"%{search}%"
		or_filters = [
			["vin_number", "like", q],
			["plate_number", "like", q],
			["model_name", "like", q],
			["customer_name", "like", q],
			["engine_number", "like", q],
			["name", "like", q],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"vin_number",
			"plate_number",
			"brand",
			"model",
			"model_name",
			"model_year",
			"current_customer",
			"customer_name",
			"current_odometer",
			"warranty_status",
			"warranty_end_date",
			"vehicle_status",
			"next_service_due_date",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	return {
		"data": rows,
		"total": frappe.db.count(DOCTYPE, filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_vehicle_360(vin: str):
	ensure_crm_read(DOCTYPE)
	vin = _resolve_vin(vin)
	doc = frappe.get_doc(DOCTYPE, vin)
	doc.check_permission("read")

	identity = {f: doc.get(f) for f in IDENTITY_FIELDS if doc.meta.has_field(f) or f == "name"}
	identity["name"] = doc.name
	if identity.get("brand"):
		identity["brand_label"] = frappe.db.get_value("Brand", identity["brand"], "brand") or identity["brand"]

	owner = _owner(doc.current_customer)
	ownership_history = _ownership_history(vin)
	warranty = _warranty(vin, doc)
	if warranty.get("warranty_status"):
		identity["warranty_status"] = warranty.get("warranty_status")
		identity["warranty_end_date"] = warranty.get("warranty_end_date") or identity.get("warranty_end_date")

	opportunities = _by_vin(
		"DMS CRM Opportunity",
		"allocated_vin",
		vin,
		[
			"name",
			"title",
			"stage",
			"status",
			"expected_value",
			"currency",
			"probability",
			"expected_close_date",
			"opportunity_owner",
			"brand",
			"model",
			"customer",
			"lost_reason",
			"modified",
		],
		limit=30,
	)
	bookings = _by_vin(
		"DMS CRM Booking",
		"vehicle_vin",
		vin,
		["name", "status", "customer", "opportunity", "booking_date", "vehicle_model", "deposit_amount", "modified"],
		limit=20,
	)
	test_drives = _by_vin(
		"DMS CRM Test Drive",
		"vehicle_vin",
		vin,
		["name", "status", "customer", "opportunity", "scheduled_datetime", "modified"],
		order_by="scheduled_datetime desc, modified desc",
		limit=20,
	)
	delivery_readiness = _by_vin(
		"DMS CRM Delivery Readiness",
		"vehicle_vin",
		vin,
		["name", "status", "customer", "opportunity", "modified"],
		limit=20,
	)
	sales_appointments = _sales_appointments([r.name for r in opportunities if r.get("name")])

	appointments = _with_advisors(
		_by_vin(
			"Service Appointment",
			"vin_chassis",
			vin,
			[
				"name",
				"status",
				"appointment_date_time",
				"vehicle",
				"customer",
				"assigned_service_advisor",
				"modified",
			],
			order_by="appointment_date_time desc, modified desc",
			limit=30,
		),
		"assigned_service_advisor",
	)
	job_cards = _with_advisors(
		_by_vin(
			"DMS Job Card",
			"vehicle_vin",
			vin,
			[
				"name",
				"status",
				"customer",
				"vehicle_model",
				"service_advisor",
				"total_amount",
				"total_labor_cost",
				"total_parts_cost",
				"delivery_date_time",
				"next_service_due_date",
				"next_service_due_km",
				"customer_satisfaction",
				"invoice",
				"modified",
				"creation",
			],
			limit=40,
		),
		"service_advisor",
	)
	estimates = _by_vin(
		"DMS Service Estimate",
		"vehicle_vin",
		vin,
		["name", "status", "customer", "grand_total", "customer_decision", "modified", "creation"],
		limit=30,
	)
	follow_ups = _by_vin(
		"Customer Follow Up",
		"vehicle_vin",
		vin,
		[
			"name",
			"job_card",
			"customer",
			"follow_up_due_date",
			"follow_up_completed_date",
			"assigned_to",
			"contact_method",
			"contact_status",
			"customer_rating",
			"nps_score",
			"modified",
		],
		order_by="follow_up_due_date desc, modified desc",
		limit=30,
	)
	deliveries = _by_vin(
		"Vehicle Delivery Note",
		"vehicle_vin",
		vin,
		[
			"name",
			"status",
			"customer",
			"vehicle_model",
			"delivery_date_time",
			"customer_satisfaction_score",
			"modified",
		],
		order_by="delivery_date_time desc, modified desc",
		limit=20,
	)
	inspections = _by_vin(
		"Vehicle Inspection",
		"vin_chassis",
		vin,
		["name", "status", "customer", "inspection_date", "modified"],
		order_by="inspection_date desc, modified desc",
		limit=20,
	)
	service_dues = _by_vin(
		"DMS CRM Service Due",
		"vin",
		vin,
		[
			"name",
			"customer",
			"classification",
			"status",
			"due_date",
			"due_km",
			"lifecycle_stage",
			"service_appointment",
			"job_card",
			"modified",
		],
		order_by="due_date desc, modified desc",
		limit=20,
	)
	cases = _by_vin(
		"DMS CRM Case",
		"vehicle_vin",
		vin,
		[
			"name",
			"subject",
			"category",
			"priority",
			"status",
			"case_owner",
			"customer",
			"response_deadline",
			"sla_breached",
			"modified",
		],
		limit=30,
	)
	activities = _by_vin(
		"DMS CRM Activity",
		"vehicle_vin",
		vin,
		[
			"name",
			"activity_type",
			"subject",
			"status",
			"due_datetime",
			"assigned_to",
			"priority",
			"customer",
			"modified",
		],
		order_by="due_datetime desc, modified desc",
		limit=40,
	)

	finance = _finance_from_job_cards(job_cards)
	open_follow_ups = sum(
		1 for r in follow_ups if not r.get("follow_up_completed_date") and (r.get("contact_status") or "") != "Completed"
	)
	retention_status = (service_dues[0].get("classification") if service_dues else None) or (
		"Due" if identity.get("next_service_due_date") else "No due record"
	)

	summary = {
		"buyer": (owner or {}).get("customer_name") or identity.get("customer_name"),
		"vehicle_status": identity.get("vehicle_status") or identity.get("status"),
		"warranty_status": identity.get("warranty_status"),
		"odometer": identity.get("current_odometer"),
		"next_service_due_date": identity.get("next_service_due_date"),
		"owners": len(ownership_history) or (1 if owner else 0),
		"opportunities_total": len(opportunities),
		"opportunities_open": sum(1 for r in opportunities if (r.get("status") or "") in OPEN_OPP_STATUSES),
		"pipeline_value": sum(
			flt(r.get("expected_value")) for r in opportunities if (r.get("status") or "") in OPEN_OPP_STATUSES
		),
		"sales_appointments": len(sales_appointments),
		"test_drives": len(test_drives),
		"bookings": len(bookings),
		"appointments": len(appointments),
		"job_cards": len(job_cards),
		"inspections": len(inspections),
		"estimates": len(estimates),
		"follow_ups": len(follow_ups),
		"service_dues": len(service_dues),
		"deliveries": len(deliveries),
		"cases_total": len(cases),
		"cases_open": sum(1 for r in cases if (r.get("status") or "") in OPEN_CASE_STATUSES),
		"activities_open": sum(1 for r in activities if (r.get("status") or "") in OPEN_ACTIVITY_STATUSES),
		"outstanding": finance.get("outstanding") or 0,
		"aftersales_revenue": sum(flt(r.get("total_amount")) for r in job_cards),
		"retention_status": retention_status,
		"open_follow_ups": open_follow_ups,
	}

	return {
		"vehicle": identity,
		"owner": owner,
		"ownership_history": ownership_history,
		"warranty": warranty,
		"summary": summary,
		"opportunities": opportunities,
		"bookings": bookings,
		"test_drives": test_drives,
		"delivery_readiness": delivery_readiness,
		"sales_appointments": sales_appointments,
		"appointments": appointments,
		"job_cards": job_cards,
		"estimates": estimates,
		"follow_ups": follow_ups,
		"deliveries": deliveries,
		"inspections": inspections,
		"service_dues": service_dues,
		"cases": cases,
		"activities": activities,
		"finance": finance,
	}
