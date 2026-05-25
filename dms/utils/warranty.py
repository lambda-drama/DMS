# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Vehicle warranty from DMS Settings (period + mileage), sale date from stock delivery."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_months, cint, flt, getdate, nowdate


WARRANTY_ACTIVE = "Active"
WARRANTY_INACTIVE = "Inactive"
WARRANTY_EXPIRED_MILEAGE = "Expired by Mileage"
# Legacy desk / list values still treated as not active
WARRANTY_EXPIRED_TIME_LEGACY = "Expired by Time"


def get_dms_warranty_settings() -> dict:
	"""Warranty defaults from DMS Settings (years + km)."""
	years = flt(frappe.db.get_single_value("DMS Settings", "warranty_period") or 0)
	if years <= 0:
		years = 2
	km_limit = cint(flt(frappe.db.get_single_value("DMS Settings", "warranty_mileage") or 0))
	return {"warranty_years": years, "warranty_km_limit": km_limit}


def resolve_vehicle_sale_date(vin) -> object | None:
	"""
	Warranty start = date the vehicle was sold from stock (not serial creation).
	Uses VIN delivery_date, else latest outward DN/SI bundle / delivered serial.
	"""
	if isinstance(vin, str):
		if not frappe.db.exists("VIN No", vin):
			return None
		vin = frappe.get_doc("VIN No", vin)

	delivery = vin.get("delivery_date")
	if delivery:
		return getdate(delivery)

	linked_serial = vin.get("linked_serial")
	if not linked_serial:
		return None

	from dms.utils.serial_vin_sync import (
		get_latest_outward_bundle_for_serial,
		resolve_delivery_customer_and_date,
	)

	serial = frappe.get_doc("Serial No", linked_serial)
	_, sale_date = resolve_delivery_customer_and_date(serial)
	if sale_date:
		return getdate(sale_date)

	bundle = get_latest_outward_bundle_for_serial(linked_serial)
	if bundle and bundle.get("posting_datetime"):
		return getdate(bundle.posting_datetime)

	if serial.status == "Delivered" and serial.get("posting_date"):
		return getdate(serial.posting_date)

	return None


def apply_dms_warranty_schedule(vin, persist: bool = False) -> None:
	"""Set warranty start/end/km from DMS Settings and vehicle sale date."""
	if isinstance(vin, str):
		vin = frappe.get_doc("VIN No", vin)

	settings = get_dms_warranty_settings()
	sale_date = resolve_vehicle_sale_date(vin)

	if not sale_date:
		vin.warranty_status = WARRANTY_INACTIVE
		if persist:
			vin.save(ignore_permissions=True)
		return

	if not vin.get("delivery_date"):
		vin.delivery_date = sale_date

	vin.warranty_start_date = sale_date
	years = settings["warranty_years"]
	vin.warranty_end_date = add_months(sale_date, cint(years * 12))

	if settings["warranty_km_limit"]:
		vin.warranty_km_limit = settings["warranty_km_limit"]

	compute_warranty_status(vin)

	if persist:
		frappe.flags.skip_vin_serial_sync = True
		try:
			vin.save(ignore_permissions=True)
		finally:
			frappe.flags.skip_vin_serial_sync = False


def compute_warranty_status(vin) -> str:
	"""Active, Inactive (time / not sold), or Expired by Mileage."""
	sale_date = resolve_vehicle_sale_date(vin)
	if not sale_date:
		vin.warranty_status = WARRANTY_INACTIVE
		return vin.warranty_status

	today = getdate(nowdate())

	end_date = vin.get("warranty_end_date")
	if end_date and getdate(end_date) < today:
		vin.warranty_status = WARRANTY_INACTIVE
		return vin.warranty_status

	km_limit = flt(vin.get("warranty_km_limit"))
	odometer = flt(vin.get("current_odometer"))
	if km_limit > 0 and odometer >= km_limit:
		vin.warranty_status = WARRANTY_EXPIRED_MILEAGE
		return vin.warranty_status

	vin.warranty_status = WARRANTY_ACTIVE
	return vin.warranty_status


def is_warranty_active(status: str | None) -> bool:
	return (status or "").strip() == WARRANTY_ACTIVE


def get_warranty_summary(vin, recalculate: bool = True) -> dict:
	"""Summary for API / frontend (optionally recalculates in memory without save)."""
	if isinstance(vin, str):
		vin = frappe.get_doc("VIN No", vin)

	if recalculate:
		apply_dms_warranty_schedule(vin, persist=False)
		compute_warranty_status(vin)

	settings = get_dms_warranty_settings()
	sale_date = resolve_vehicle_sale_date(vin)
	status = (vin.get("warranty_status") or WARRANTY_INACTIVE).strip()
	active = is_warranty_active(status)

	end_date = vin.get("warranty_end_date")
	km_limit = cint(flt(vin.get("warranty_km_limit") or settings["warranty_km_limit"]))
	odometer = cint(flt(vin.get("current_odometer")))

	days_remaining = None
	if end_date and active:
		days_remaining = max(0, (getdate(end_date) - getdate(nowdate())).days)

	km_remaining = None
	if km_limit > 0:
		km_remaining = max(0, km_limit - odometer)

	reason = ""
	if not sale_date:
		reason = _("Warranty not started — vehicle has not been recorded as sold from stock.")
	elif status == WARRANTY_INACTIVE:
		reason = _("Warranty period ended ({0} years from sale date).").format(settings["warranty_years"])
	elif status == WARRANTY_EXPIRED_MILEAGE:
		reason = _("Odometer {0} km reached warranty limit {1} km.").format(odometer, km_limit)
	elif active:
		reason = _("Warranty is within period and mileage limits.")

	return {
		"warranty_active": active,
		"warranty_status": status,
		"warranty_start_date": str(vin.warranty_start_date) if vin.get("warranty_start_date") else None,
		"warranty_end_date": str(end_date) if end_date else None,
		"warranty_km_limit": km_limit or None,
		"current_odometer": odometer or None,
		"delivery_date": str(vin.delivery_date) if vin.get("delivery_date") else None,
		"sale_date": str(sale_date) if sale_date else None,
		"warranty_years": settings["warranty_years"],
		"days_remaining": days_remaining,
		"km_remaining": km_remaining,
		"warranty_reason": reason,
	}


def sync_vin_warranty_after_sale(vin_name: str | None = None, serial_name: str | None = None) -> None:
	"""Called after outward sale sync — refresh warranty dates/status on linked VIN."""
	if not vin_name and serial_name:
		from dms.utils.serial_vin_sync import get_vin_name_for_serial

		vin_name = get_vin_name_for_serial(frappe.get_doc("Serial No", serial_name))

	if not vin_name or not frappe.db.exists("VIN No", vin_name):
		return

	apply_dms_warranty_schedule(vin_name, persist=True)
