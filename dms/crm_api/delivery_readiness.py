"""DMS CRM delivery readiness APIs — §8.2."""

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

DOCTYPE = "DMS CRM Delivery Readiness"


@frappe.whitelist()
def get_delivery_readiness_list(status=None, search=None, limit=50, offset=0):
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
		}
	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"opportunity",
			"customer",
			"status",
			"vehicle_vin",
			"payment_status",
			"documentation_status",
			"pdi_status",
			"delivery_appointment",
			"modified",
		],
		order_by="modified desc",
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
def get_delivery_readiness(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Delivery readiness is required."))
	return frappe.get_doc(DOCTYPE, name).as_dict()


@frappe.whitelist()
def create_delivery_readiness(opportunity=None, data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data) if data else {}
	opportunity = (opportunity or payload.get("opportunity") or "").strip()
	if not opportunity:
		frappe.throw(_("Deal is required."))
	opp = frappe.get_doc("DMS CRM Opportunity", opportunity)
	existing = frappe.db.get_value(DOCTYPE, {"opportunity": opportunity}, "name")
	if existing:
		return get_delivery_readiness(existing)

	booking = None
	if opp.booking and frappe.db.exists("DMS CRM Booking", opp.booking):
		booking = frappe.get_doc("DMS CRM Booking", opp.booking)

	doc = frappe.new_doc(DOCTYPE)
	doc.opportunity = opp.name
	doc.booking = booking.name if booking else None
	doc.customer = opp.customer
	doc.company = opp.company
	doc.branch = opp.branch
	doc.vehicle_vin = (booking.vehicle_vin if booking else None) or opp.get("allocated_vin")
	doc.factory_order_reference = booking.factory_order_reference if booking else None
	doc.status = "In Progress"
	if booking and flt_deposit(booking):
		doc.payment_status = "Deposit Received"
	if doc.vehicle_vin:
		location = frappe.db.get_value("VIN No", doc.vehicle_vin, "status")
		if location:
			doc.vehicle_location = (
				frappe.db.get_value("Vehicle Location Status", location, "status") or location
			)
	doc.insert()
	opp.db_set("delivery_readiness", doc.name, update_modified=False)
	frappe.db.commit()
	return get_delivery_readiness(doc.name)


def flt_deposit(booking):
	from frappe.utils import flt

	return flt(booking.deposit_amount) > 0


@frappe.whitelist()
def update_delivery_readiness(name, data=None):
	ensure_crm_write(DOCTYPE)
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	for fieldname in (
		"status",
		"vehicle_vin",
		"factory_order_reference",
		"payment_status",
		"documentation_status",
		"pdi_status",
		"vehicle_location",
		"delivery_appointment",
		"handover_on",
		"blocked_reason",
		"satisfaction_score",
		"handover_photos",
		"notes",
		"checklist_template",
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
	if doc.status == "Delivered" and not doc.handover_on:
		doc.handover_on = now_datetime()
	doc.save()
	frappe.db.commit()
	return get_delivery_readiness(doc.name)


@frappe.whitelist()
def mark_delivery_ready(name):
	ensure_crm_write(DOCTYPE)
	doc = frappe.get_doc(DOCTYPE, name)
	doc.status = "Ready"
	doc.save()
	frappe.db.commit()
	return get_delivery_readiness(doc.name)
