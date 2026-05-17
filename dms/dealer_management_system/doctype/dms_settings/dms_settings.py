# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate


class DMSSettings(Document):
	pass


def get_auto_vin_from_serial_settings():
	"""Return (enabled, list of company names) from DMS Settings."""
	settings = frappe.get_cached_doc("DMS Settings", "DMS Settings")
	enabled = cint(settings.auto_create_vin_from_serial)
	companies = [row.company for row in (settings.get("company") or []) if row.company]
	return enabled, companies


def should_auto_create_vin_for_serial(serial):
	"""Whether a new Serial No should trigger automatic VIN No creation."""
	enabled, companies = get_auto_vin_from_serial_settings()
	if not enabled or not companies:
		return False

	company = _serial_value(serial, "company")
	if not company or company not in companies:
		return False

	if not _serial_value(serial, "item_code"):
		return False

	if _serial_value(serial, "reference_doctype") == "VIN No":
		return False

	serial_no = _serial_value(serial, "serial_no") or _serial_value(serial, "name")
	if serial_no and frappe.db.exists("VIN No", {"vin_number": serial_no}):
		return False

	return True


def auto_create_vin_on_serial_insert(doc, method=None):
	"""Desk hook: create VIN No when Serial No is inserted for configured companies."""
	if frappe.flags.get("skip_auto_vin_from_serial"):
		return
	if not should_auto_create_vin_for_serial(doc):
		return

	try:
		result = create_vin_from_serial_document(doc)
		if result == "created":
			frappe.msgprint(
				_("VIN No {0} was created automatically.").format(
					frappe.bold(_serial_value(doc, "serial_no") or doc.name)
				),
				alert=True,
				indicator="green",
			)
	except Exception:
		frappe.log_error(
			title="Auto-create VIN from Serial No",
			message=frappe.get_traceback(),
		)


def _serial_value(serial, fieldname, default=None):
	if isinstance(serial, Document):
		return getattr(serial, fieldname, default)
	return (serial.get(fieldname) if isinstance(serial, dict) else None) or default


def _build_vin_data_from_serial(serial):
	"""Map Serial No fields to a new VIN No document dict."""
	serial_no = _serial_value(serial, "serial_no") or _serial_value(serial, "name")
	item_code = _serial_value(serial, "item_code")

	if not serial_no or not item_code:
		frappe.throw(_("Serial No and Item Code are required to create a VIN No."))

	item = frappe.get_cached_doc("Item", item_code)
	status = _serial_value(serial, "status")

	vin_data = {
		"doctype": "VIN No",
		"vin_number": serial_no,
		"linked_item": item_code,
		"model_name": _serial_value(serial, "item_name") or item.item_name,
		"engine_number": _serial_value(serial, "custom_engine_number"),
		"model_year": _serial_value(serial, "custom_year"),
		"interior_color": _serial_value(serial, "custom_interior_color"),
		"exterior_color": _serial_value(serial, "custom_exterior_color"),
		"transmission": _serial_value(serial, "custom_transmission_type"),
		"current_customer": _serial_value(serial, "customer"),
		"delivery_date": _serial_value(serial, "posting_date"),
		"warranty_end_date": _serial_value(serial, "warranty_expiry_date"),
		"linked_serial": _serial_value(serial, "name"),
		"company": _serial_value(serial, "company"),
		"vehicle_status": "Delivered to Customer" if status == "Delivered" else "In Stock",
	}

	brand = _serial_value(serial, "brand")
	if brand:
		vin_data["brand"] = brand

	for item_field, vin_field in (
		("custom_brand", "brand"),
		("custom_fuel_type", "fuel_type"),
		("custom_transmission", "transmission"),
		("custom_service_interval_km", "service_interval_km"),
		("custom_service_interval_months", "service_interval_months"),
		("custom_exterior_color", "exterior_color"),
		("custom_model_year", "model_year"),
	):
		if hasattr(item, item_field):
			value = getattr(item, item_field, None)
			if value is not None and value != "":
				vin_data[vin_field] = value

	return vin_data


def create_vin_from_serial_document(serial, force_recreate=0):
	"""
	Create or update one VIN No from a Serial No document or dict.
	Returns: 'created', 'updated', or 'skipped'.
	"""
	serial_no = _serial_value(serial, "serial_no") or _serial_value(serial, "name")
	existing_vin = frappe.db.exists("VIN No", {"vin_number": serial_no})

	if existing_vin and not cint(force_recreate):
		return "skipped"

	vin_data = _build_vin_data_from_serial(serial)

	if existing_vin and cint(force_recreate):
		frappe.db.set_value("VIN No", existing_vin, vin_data, update_modified=True)
		return "updated"

	vin_doc = frappe.get_doc(vin_data)
	frappe.flags.skip_auto_vin_from_serial = True
	try:
		vin_doc.insert(ignore_permissions=True)
	finally:
		frappe.flags.skip_auto_vin_from_serial = False

	return "created"


@frappe.whitelist()
def create_vin_from_serial_numbers(company, start_date, end_date, item_code=None, status_filter=None, force_recreate=0):
	"""
	Create VIN No records from existing Serial Numbers

	Args:
		company: Company filter (required)
		start_date: Filter serials created on or after this date
		end_date: Filter serials created on or before this date
		item_code: Optional - filter by specific item/vehicle model
		status_filter: Optional - filter by serial status (Active, Delivered, Inactive)
		force_recreate: If 1, update existing VIN records instead of skipping
	"""

	result = {
		"total_serial": 0,
		"created": 0,
		"updated": 0,
		"skipped": 0,
		"errors": 0,
		"error_details": [],
	}

	if not company:
		frappe.throw(_("Company is required."))

	serial_filters = [
		["company", "=", company],
		["creation", ">=", getdate(start_date)],
		["creation", "<=", getdate(end_date)],
		["item_code", "is", "set"],
	]

	if item_code:
		serial_filters.append(["item_code", "=", item_code])

	if status_filter:
		serial_filters.append(["status", "=", status_filter])

	serials = frappe.get_all(
		"Serial No",
		filters=serial_filters,
		fields=[
			"name", "serial_no", "item_code", "item_name", "customer",
			"status", "posting_date", "warranty_expiry_date", "description", "company",
			"custom_engine_number", "custom_model", "custom_year", "custom_interior_color",
			"custom_exterior_color", "custom_transmission_type", "brand",
			"reference_doctype", "reference_name",
		],
	)

	result["total_serial"] = len(serials)

	if not serials:
		frappe.msgprint(
			_("No serial numbers found for company {0} in the selected date range.").format(company)
		)
		return result

	for serial in serials:
		try:
			outcome = create_vin_from_serial_document(serial, force_recreate=force_recreate)
			if outcome == "created":
				result["created"] += 1
			elif outcome == "updated":
				result["updated"] += 1
			else:
				result["skipped"] += 1
		except Exception as e:
			result["errors"] += 1
			result["error_details"].append({
				"serial": serial.serial_no,
				"error": str(e),
			})
			frappe.log_error(
				f"Error creating VIN for serial {serial.serial_no}: {e!s}",
				"VIN Creation",
			)

	frappe.db.commit()

	return result
