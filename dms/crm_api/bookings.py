# Copyright (c) 2026, Mania and contributors
"""Booking list APIs — Blueprint §7.3."""

from __future__ import annotations

import frappe
from frappe import _

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_read,
	paginate,
	user_display_name,
)

DOCTYPE = "DMS CRM Booking"

LIST_FIELDS = [
	"name",
	"opportunity",
	"customer",
	"status",
	"booking_date",
	"booking_expiry",
	"vehicle_model",
	"preferred_color",
	"vehicle_vin",
	"deposit_amount",
	"receipt_reference",
	"company",
	"branch",
	"sales_order",
	"allocated_on",
	"allocation_switch_requested",
	"creation",
	"modified",
]


@frappe.whitelist()
def get_bookings(search=None, status=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status

	or_filters = None
	if search:
		term = f"%{search}%"
		or_filters = [
			["name", "like", term],
			["customer", "like", term],
			["opportunity", "like", term],
			["vehicle_vin", "like", term],
			["vehicle_model", "like", term],
			["receipt_reference", "like", term],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=LIST_FIELDS,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	total = frappe.db.count(DOCTYPE, filters=filters)
	for r in rows:
		r["customer_name"] = customer_display_name(r.get("customer"))
		r["allocated_by_name"] = user_display_name(r.get("allocated_by")) if r.get("allocated_by") else ""
	return {"data": rows, "total": total, "limit": limit, "offset": offset}


@frappe.whitelist()
def get_booking(name):
	ensure_crm_read(DOCTYPE)
	if not name or not frappe.db.exists(DOCTYPE, name):
		frappe.throw(_("Booking not found."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["customer_name"] = customer_display_name(doc.customer)
	return data
