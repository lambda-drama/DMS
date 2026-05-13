# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Pricing / costing helpers shared by DMS Job Card validate and Sales Invoice draft."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt


def labour_row_hours(row) -> float:
	return flt(getattr(row, "actual_hours", None) or getattr(row, "estimated_hours", None) or 0)


def resolve_vehicle_service_item_to_item_code(vsi_name: str | None) -> str | None:
	if not vsi_name or not frappe.db.exists("DocType", "Vehicle Service Item"):
		return None
	meta = frappe.get_meta("Vehicle Service Item")
	for f in meta.fields:
		if f.fieldtype == "Link" and f.options == "Item":
			val = frappe.db.get_value("Vehicle Service Item", vsi_name, f.fieldname)
			if val:
				return val
	return None


def spare_record(spare_docname: str) -> dict | None:
	if not spare_docname or not frappe.db.exists("Spare Part", spare_docname):
		return None
	return frappe.db.get_value(
		"Spare Part",
		spare_docname,
		[
			"spare_part_item",
			"last_purchase_price",
			"selling_price",
			"markup_percentage",
		],
		as_dict=True,
	)


def spare_part_erp_item_code(spare_docname: str) -> str | None:
	row = spare_record(spare_docname)
	return row.get("spare_part_item") if row else None


def spare_part_unit_cost(spare_docname: str) -> float:
	"""Prefer Spare Part last purchase, then Item valuation / last purchase / standard."""
	sp = spare_record(spare_docname)
	if sp and flt(sp.get("last_purchase_price")) > 0:
		return flt(sp["last_purchase_price"])
	it = sp.get("spare_part_item") if sp else None
	if not it:
		return 0.0

	item_row = frappe.db.get_value(
		"Item",
		it,
		["valuation_rate", "last_purchase_rate", "standard_rate"],
		as_dict=True,
	)
	if not item_row:
		return 0.0

	for fld in ("valuation_rate", "last_purchase_rate", "standard_rate"):
		if flt(item_row.get(fld)) > 0:
			return flt(item_row[fld])

	return 0.0


def dms_spare_part_markup() -> float:
	"""Global markup applied to Spare Part recommended selling prices."""
	return flt(frappe.db.get_single_value("DMS Settings", "spare_part_markup") or 0)


def spare_part_default_selling_price(spare_docname: str) -> float:
	"""Default customer unit price when line is blank."""
	sp = spare_record(spare_docname)
	if not sp:
		return 0.0
	if flt(sp.get("selling_price")) > 0:
		return round(flt(sp["selling_price"]) * (1 + dms_spare_part_markup() / 100.0), 2)

	cost = flt(sp.get("last_purchase_price"))
	if cost > 0 and sp.get("markup_percentage") is not None:
		return round(cost * (1 + flt(sp["markup_percentage"]) / 100.0), 2)

	it = sp.get("spare_part_item")
	if it:
		sr = flt(frappe.db.get_value("Item", it, "standard_rate") or 0)
		if sr > 0:
			return sr

	return 0.0


def apply_vehicle_labour_row_pricing(row) -> float:
	"""Fill empty rate from linked ERP Item; return hours × rate."""
	if flt(getattr(row, "rate_per_hour", None) or 0) <= 0 and getattr(row, "vehicle_service_item", None):
		item_code = resolve_vehicle_service_item_to_item_code(row.vehicle_service_item)
		if item_code:
			sr = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)
			if sr > 0:
				row.rate_per_hour = sr

	h = labour_row_hours(row)
	return round(h * flt(row.rate_per_hour or 0), 2)


def is_labour_row_billable(row) -> bool:
	return not cint(getattr(row, "is_warranty", 0))


def is_part_row_billable(row) -> bool:
	return not cint(getattr(row, "is_warranty", 0))


def part_issue_qty(row) -> float:
	return flt(getattr(row, "quantity_issued", None) or getattr(row, "quantity_requested", None) or 0)
