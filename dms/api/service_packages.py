# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Vehicle Service Package lookups for job cards (model from VIN → package lines)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import flt


def resolve_vehicle_model_from_vin(vin_name: str | None) -> tuple[str | None, str | None]:
	"""Resolve Vehicle Model docname and a display label from a VIN No record."""
	vin_name = (vin_name or "").strip()
	if not vin_name or not frappe.db.exists("VIN No", vin_name):
		return None, None

	meta = frappe.get_meta("VIN No")
	fields = ["model", "model_name", "linked_item"]
	if meta.has_field("vehicle_model"):
		fields.append("vehicle_model")

	vin = frappe.db.get_value("VIN No", vin_name, fields, as_dict=True)
	if not vin:
		return None, None

	# VIN No.model → Link Vehicle Model (primary)
	if meta.has_field("model") and vin.get("model"):
		return _vehicle_model_label(vin.model)

	if meta.has_field("vehicle_model") and vin.get("vehicle_model"):
		return _vehicle_model_label(vin.vehicle_model)

	linked_item = (vin.get("linked_item") or "").strip()
	if linked_item:
		vm = frappe.db.get_value("Vehicle Model", {"model": linked_item}, "name")
		if vm:
			return _vehicle_model_label(vm)
		if frappe.db.exists("Vehicle Model", linked_item):
			return _vehicle_model_label(linked_item)

	model_name = (vin.get("model_name") or "").strip()
	if model_name:
		for filters in (
			{"model_name": model_name},
			{"name": model_name},
			{"model": model_name},
		):
			vm = frappe.db.get_value("Vehicle Model", filters, "name")
			if vm:
				return _vehicle_model_label(vm)

	return None, model_name or None


def _vehicle_model_label(vehicle_model: str) -> tuple[str, str]:
	row = frappe.db.get_value(
		"Vehicle Model",
		vehicle_model,
		["name", "model_name", "brand", "model_year", "variant"],
		as_dict=True,
	)
	if not row:
		return vehicle_model, vehicle_model

	parts = [row.brand, row.model_name, row.variant]
	if row.model_year:
		parts.append(str(row.model_year))
	label = " ".join(p for p in parts if p) or vehicle_model
	return row.name, label


def _active_packages_for_model(vehicle_model: str, search: str | None = None) -> list[dict]:
	parents = set(
		frappe.get_all(
			"Package Vehicle Model",
			filters={"vehicle_model": vehicle_model},
			pluck="parent",
		)
	)
	direct = frappe.get_all(
		"Vehicle Service Package",
		filters={"vehicle_model": vehicle_model, "is_active": 1},
		pluck="name",
	)
	parents.update(direct)
	if not parents:
		return []

	fields = [
		"name",
		"package_name",
		"package_id",
		"description",
		"interval_km",
		"interval_months",
		"total_labor_hours",
		"before_discount",
		"after_discount",
		"total_amount",
		"package_price",
		"labour_discount_amount",
	]
	meta = frappe.get_meta("Vehicle Service Package")
	for optional in (
		"package_id",
		"labour_discount_amount",
		"before_discount",
		"after_discount",
		"total_amount",
	):
		if not meta.has_field(optional):
			fields.remove(optional)

	packages = frappe.get_all(
		"Vehicle Service Package",
		filters={"name": ["in", list(parents)], "is_active": 1},
		fields=fields,
		order_by="interval_km asc, package_name asc",
	)

	if search:
		needle = search.strip().lower()
		if needle:
			packages = [
				p
				for p in packages
				if needle in (p.package_name or "").lower()
				or needle in (p.get("package_id") or "").lower()
				or needle in (p.description or "").lower()
			]

	return packages


@frappe.whitelist()
def get_service_packages_for_vehicle(vin=None, vehicle_model=None, search=None):
	"""List active service packages applicable to the vehicle model (from VIN or explicit model)."""
	vm = (vehicle_model or "").strip()
	label = None
	if not vm and vin:
		vm, label = resolve_vehicle_model_from_vin(vin)
	elif vm:
		_, label = _vehicle_model_label(vm)

	if not vm:
		return {
			"vehicle_model": None,
			"vehicle_model_label": label,
			"packages": [],
			"message": _("Could not resolve a Vehicle Model for this VIN. Set the Model field on the vehicle (VIN No)."),
		}

	if not label:
		_, label = _vehicle_model_label(vm)

	return {
		"vehicle_model": vm,
		"vehicle_model_label": label,
		"packages": _active_packages_for_model(vm, search),
	}


@frappe.whitelist()
def get_service_package_lines(package_name=None):
	"""Return labour and parts rows from a Vehicle Service Package for job card autofill."""
	package_name = (package_name or "").strip()
	if not package_name:
		frappe.throw(_("Package is required"))
	if not frappe.db.exists("Vehicle Service Package", package_name):
		frappe.throw(_("Vehicle Service Package {0} not found").format(frappe.bold(package_name)))

	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		spare_part_default_selling_price,
		vehicle_service_item_estimated_hours,
		vehicle_service_item_labour_rate,
	)

	pkg = frappe.get_doc("Vehicle Service Package", package_name)
	pkg.check_permission("read")

	labour = []
	for row in pkg.labor_operations:
		vsi = (row.labor_operation or "").strip()
		if not vsi:
			continue

		service_name = (row.operation_name or "").strip()
		if not service_name:
			service_name = (
				frappe.db.get_value("Vehicle Service Item", vsi, "service_item")
				or frappe.db.get_value("Vehicle Service Item", vsi, "custom_item_name")
				or vsi
			)

		hours = flt(row.total_hours)
		if not hours:
			qty = flt(row.quantity) or 1
			std = flt(row.standard_hours)
			if not std:
				std = vehicle_service_item_estimated_hours(vsi) or 1
			hours = qty * std

		rate = vehicle_service_item_labour_rate(vsi)

		labour.append(
			{
				"vehicle_service_item": vsi,
				"service_name": service_name,
				"estimated_hours": hours,
				"rate_per_hour": rate,
				"notes": row.notes,
			}
		)

	parts = []
	for row in pkg.parts_included:
		part = (row.part_item or "").strip()
		if not part:
			continue

		qty = flt(row.quantity) or 1
		unit_price = flt(row.unit_price)
		if not unit_price:
			unit_price = flt(spare_part_default_selling_price(part))

		item_name = (row.part_name or "").strip()
		if not item_name:
			item_name = frappe.db.get_value("Spare Part", part, "item_name") or part

		parts.append(
			{
				"item_code": part,
				"item_name": item_name,
				"quantity_requested": qty,
				"unit_price": unit_price,
			}
		)

	return {
		"package": pkg.name,
		"package_name": pkg.package_name,
		"package_id": getattr(pkg, "package_id", None),
		"description": pkg.description,
		"before_discount": flt(getattr(pkg, "before_discount", 0)),
		"after_discount": flt(getattr(pkg, "after_discount", 0)),
		"total_amount": flt(getattr(pkg, "total_amount", 0) or getattr(pkg, "after_discount", 0)),
		"package_price": flt(pkg.package_price or getattr(pkg, "after_discount", 0)),
		"labour_discount_amount": flt(getattr(pkg, "labour_discount_amount", 0)),
		"interval_km": pkg.interval_km,
		"interval_months": pkg.interval_months,
		"labour": labour,
		"parts": parts,
	}
