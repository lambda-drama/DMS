# Copyright (c) 2026, Mania and contributors
"""CRM Contacts & Customers — ERPNext Contact / Customer (CRM-scoped)."""

from __future__ import annotations

import frappe
from frappe import _

from dms.crm_api.common import ensure_crm_read, paginate

GATE = "DMS CRM Lead"


def _dms_customer_groups() -> list[str]:
	"""Customer groups marked for DMS (custom_is_vehicle_customer), same rule as DMS Settings."""
	if not frappe.db.exists("DocType", "Customer Group"):
		return []
	if not frappe.get_meta("Customer Group").has_field("custom_is_vehicle_customer"):
		return []
	return frappe.get_all(
		"Customer Group",
		filters={"custom_is_vehicle_customer": 1},
		pluck="name",
	)


@frappe.whitelist()
def get_contacts(search=None, limit=50, offset=0):
	"""List ERPNext Contact records for CRM Contacts view."""
	ensure_crm_read(GATE)
	if not frappe.db.exists("DocType", "Contact"):
		return {"data": [], "total": 0, "limit": 50, "offset": 0}

	limit, offset = paginate(limit, offset)
	filters = {}
	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["first_name", "like", f"%{search}%"],
			["last_name", "like", f"%{search}%"],
			["email_id", "like", f"%{search}%"],
			["mobile_no", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
		]

	fields = ["name", "first_name", "last_name", "email_id", "mobile_no", "company_name", "status", "modified"]
	meta = frappe.get_meta("Contact")
	fields = [f for f in fields if meta.has_field(f) or f == "name"]

	rows = frappe.get_all(
		"Contact",
		filters=filters,
		or_filters=or_filters or None,
		fields=fields,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	data = []
	for r in rows:
		row = dict(r)
		row["full_name"] = " ".join(
			p for p in [row.get("first_name"), row.get("last_name")] if p
		).strip() or row.get("name")
		data.append(row)

	return {
		"data": data,
		"total": frappe.db.count("Contact", filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_customers(search=None, limit=50, offset=0):
	"""List DMS customers only (Customer Group with custom_is_vehicle_customer)."""
	ensure_crm_read(GATE)
	if not frappe.db.exists("DocType", "Customer"):
		return {"data": [], "total": 0, "limit": 50, "offset": 0, "customer_groups": []}

	limit, offset = paginate(limit, offset)
	groups = _dms_customer_groups()
	filters: dict = {"disabled": 0}
	if groups:
		filters["customer_group"] = ["in", groups]
	else:
		# No DMS vehicle groups configured — return empty rather than all ERP customers
		return {
			"data": [],
			"total": 0,
			"limit": limit,
			"offset": offset,
			"customer_groups": [],
			"message": _(
				"No DMS customer groups configured. Mark Customer Groups with Is Vehicle Customer in DMS Settings."
			),
		}

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["customer_name", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["mobile_no", "like", f"%{search}%"],
			["email_id", "like", f"%{search}%"],
		]

	fields = [
		"name",
		"customer_name",
		"customer_type",
		"customer_group",
		"mobile_no",
		"email_id",
		"territory",
		"modified",
	]
	rows = frappe.get_all(
		"Customer",
		filters=filters,
		or_filters=or_filters or None,
		fields=fields,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	total = frappe.db.count("Customer", filters=filters)
	return {
		"data": [dict(r) for r in rows],
		"total": total,
		"limit": limit,
		"offset": offset,
		"customer_groups": groups,
	}
