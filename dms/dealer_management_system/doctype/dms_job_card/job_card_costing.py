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

	print("Fetching spare record for", spare_docname)
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
	cost = flt(sp.get("selling_price")) or flt(sp.get("last_purchase_price")) or spare_part_unit_cost(spare_docname)
	if cost > 0 and sp.get("markup_percentage") is not None:
		return round(cost * (1 + flt(sp["markup_percentage"]) / 100.0), 2)

	it = sp.get("spare_part_item")
	if it:
		sr = flt(frappe.db.get_value("Item", it, "standard_rate") or 0)
		if sr > 0:
			return sr

	return 0.0


def dms_default_service_fee() -> float:
	"""Default labour rate when Vehicle Service Item and ERP Item have no rate."""
	return flt(frappe.db.get_single_value("DMS Settings", "default_service_fee") or 0)


def vehicle_service_item_estimated_hours(vsi_name: str | None) -> float:
	"""Estimated labour hours from VSI custom_estimated_timehours."""
	if not vsi_name or not frappe.db.exists("DocType", "Vehicle Service Item"):
		return 0.0

	meta = frappe.get_meta("Vehicle Service Item")
	if not meta.has_field("custom_estimated_timehours"):
		return 0.0

	return flt(frappe.db.get_value("Vehicle Service Item", vsi_name, "custom_estimated_timehours") or 0)


def vehicle_service_item_labour_rate(vsi_name: str | None) -> float:
	"""Resolve labour rate: VSI custom_rate → ERP Item standard_rate → DMS default service fee."""
	if not vsi_name or not frappe.db.exists("DocType", "Vehicle Service Item"):
		return 0.0

	vsi_rate = flt(frappe.db.get_value("Vehicle Service Item", vsi_name, "custom_rate") or 0)
	if vsi_rate > 0:
		return vsi_rate

	item_code = resolve_vehicle_service_item_to_item_code(vsi_name)
	if item_code:
		sr = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)
		if sr > 0:
			return sr

	return dms_default_service_fee()


def apply_vehicle_labour_row_pricing(row) -> float:
	"""Fill empty rate/hours from VSI; return hours × rate."""
	if flt(getattr(row, "rate_per_hour", None) or 0) <= 0 and getattr(row, "vehicle_service_item", None):
		rate = vehicle_service_item_labour_rate(row.vehicle_service_item)
		if rate > 0:
			row.rate_per_hour = rate

	h = labour_row_hours(row)
	if h <= 0 and getattr(row, "vehicle_service_item", None):
		est = vehicle_service_item_estimated_hours(row.vehicle_service_item)
		if est > 0:
			row.estimated_hours = est
			h = est

	return round(h * flt(row.rate_per_hour or 0), 2)


def is_labour_row_billable(row) -> bool:
	return not cint(getattr(row, "is_warranty", 0))


def is_part_row_billable(row) -> bool:
	return not cint(getattr(row, "is_warranty", 0))


def part_issue_qty(row) -> float:
	"""Billable quantity: net issued qty, or requested minus returns when not yet issued."""
	issued = flt(getattr(row, "quantity_issued", None) or 0)
	if issued > 0:
		return issued

	requested = flt(getattr(row, "quantity_requested", None) or 0)
	returned = flt(getattr(row, "quantity_returned", None) or 0)
	if returned > 0:
		return max(0.0, requested - returned)
	return requested
