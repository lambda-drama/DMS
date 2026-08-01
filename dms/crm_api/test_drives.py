"""DMS CRM test-drive tracking and checklist APIs."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from dms.crm_api.common import (
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
)

DOCTYPE = "DMS CRM Test Drive"

@frappe.whitelist()
def get_test_vehicle_options(search=None, company=None, limit=40):
	"""Available in-stock VINs for the test-drive Link selector."""
	ensure_crm_read(DOCTYPE)
	filters = {"vehicle_status": "In Stock"}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"vin_number": ["like", q],
			"plate_number": ["like", q],
			"linked_item": ["like", q],
		}
	return frappe.get_all(
		"VIN No",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "vin_number", "plate_number", "linked_item", "model_name"],
		order_by="modified desc",
		limit_page_length=min(cint(limit) or 40, 100),
	)


@frappe.whitelist()
def get_test_drives(status=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"opportunity": ["like", q],
			"customer": ["like", q],
			"vehicle_vin": ["like", q],
			"driver_name": ["like", q],
		}
	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"opportunity",
			"customer",
			"scheduled_datetime",
			"status",
			"vehicle_vin",
			"driver_name",
			"outcome",
			"failure_reason",
			"assigned_to",
			"modified",
		],
		order_by="scheduled_datetime desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	return {
		"data": rows,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_test_drive(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Test Drive is required."))
	return frappe.get_doc(DOCTYPE, name).as_dict()


@frappe.whitelist()
def create_test_drive(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	opportunity = (payload.get("opportunity") or "").strip()
	if not opportunity:
		frappe.throw(_("Deal is required."))
	opp = frappe.get_doc("DMS CRM Opportunity", opportunity)
	if not opp.customer:
		frappe.throw(_("Link a Customer to the deal before scheduling a Test Drive."))
	if not opp.sales_appointment or not frappe.db.exists(
		"DMS CRM Sales Appointment", opp.sales_appointment
	):
		frappe.throw(_("Schedule a Sales Appointment before the Test Drive."))
	appointment_status = frappe.db.get_value(
		"DMS CRM Sales Appointment", opp.sales_appointment, "status"
	)
	if appointment_status in ("No-Show", "Cancelled"):
		frappe.throw(_("Reschedule the failed/cancelled Sales Appointment first."))
	if not payload.get("scheduled_datetime"):
		frappe.throw(_("Scheduled date and time are required."))

	doc = frappe.new_doc(DOCTYPE)
	for fieldname in (
		"scheduled_datetime",
		"vehicle_vin",
		"vehicle_item",
		"driver_name",
		"driver_license",
		"route",
		"start_odometer",
		"end_odometer",
		"assigned_to",
		"status",
		"checklist_template",
		"id_verified",
		"driver_id_reference",
		"customer_consent",
		"consent_notes",
		"pre_drive_condition",
		"fuel_charge_level",
		"customer_feedback",
		"customer_preferences",
		"outcome",
		"model_changed_to",
		"failure_reason",
		"incident_reported",
		"incident_details",
		"damage_reported",
		"damage_details",
		"incident_attachment",
		"notes",
	):
		if fieldname in payload:
			doc.set(fieldname, payload.get(fieldname))
	doc.opportunity = opp.name
	doc.customer = opp.customer
	doc.company = opp.company
	doc.branch = opp.branch
	doc.assigned_to = doc.assigned_to or opp.opportunity_owner or frappe.session.user
	doc.status = doc.status or "Scheduled"

	doc.insert()

	opp.test_drive = doc.name
	opp.stage = "Test Drive"
	opp.save()
	frappe.db.commit()
	return get_test_drive(doc.name)


@frappe.whitelist()
def update_test_drive(name, data=None):
	ensure_crm_write(DOCTYPE)
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	for fieldname in (
		"scheduled_datetime",
		"vehicle_vin",
		"vehicle_item",
		"driver_name",
		"driver_license",
		"route",
		"start_odometer",
		"end_odometer",
		"assigned_to",
		"status",
		"checklist_template",
		"id_verified",
		"driver_id_reference",
		"customer_consent",
		"consent_notes",
		"pre_drive_condition",
		"fuel_charge_level",
		"customer_feedback",
		"customer_preferences",
		"outcome",
		"model_changed_to",
		"failure_reason",
		"incident_reported",
		"incident_details",
		"damage_reported",
		"damage_details",
		"incident_attachment",
		"notes",
	):
		if fieldname in payload:
			doc.set(fieldname, payload.get(fieldname))
	if "checklist" in payload:
		doc.set("checklist", [])
		for row in payload.get("checklist") or []:
			doc.append(
				"checklist",
				{
					"category": row.get("category"),
					"check_item": row.get("check_item"),
					"is_mandatory": row.get("is_mandatory"),
					"is_completed": row.get("is_completed"),
					"result": row.get("result") or "Pending",
					"notes": row.get("notes"),
				},
			)
	if doc.status == "In Progress" and not doc.started_on:
		doc.started_on = now_datetime()
	doc.save()
	frappe.db.commit()
	return get_test_drive(doc.name)
