# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate


class DMSSettings(Document):
	def on_update(self):
		frappe.clear_document_cache("DMS Settings", "DMS Settings")


def get_auto_vin_company_list():
	"""Companies selected on DMS Settings (Table MultiSelect → Company TB)."""
	companies = frappe.get_all(
		"Company TB",
		filters={
			"parent": "DMS Settings",
			"parenttype": "DMS Settings",
			"parentfield": "company",
		},
		pluck="company",
	)
	if companies:
		return [c for c in companies if c]

	settings = frappe.get_single("DMS Settings")
	return [row.company for row in (settings.get("company") or []) if row.company]


def get_auto_vin_from_serial_settings():
	"""Return (enabled, list of company names) from DMS Settings."""
	settings = frappe.get_single("DMS Settings")
	enabled = cint(settings.auto_create_vin_from_serial)
	return enabled, get_auto_vin_company_list()


def _company_allowed_for_auto_vin(company, allowed_companies, enabled):
	if not enabled:
		return False
	if not company:
		return False
	if not allowed_companies:
		return True
	return company in allowed_companies


def _prepare_serial_for_auto_vin(serial, voucher_company=None, prefer_voucher_company=False):
	"""Ensure company matches the voucher when needed.

	- Inward / empty company: use serial.company, falling back to voucher_company.
	- Outward: prefer voucher_company (the DMS company making the sale) and update
	  the serial, so vehicles purchased from a non-DMS company still get a VIN
	  when later sold into a DMS company.
	"""
	current = (_serial_value(serial, "company") or "").strip()
	company = current or (voucher_company or "").strip()

	if voucher_company and (prefer_voucher_company or not current):
		frappe.db.set_value(
			"Serial No",
			serial.name if isinstance(serial, Document) else serial,
			"company",
			voucher_company,
			update_modified=False,
		)
		if isinstance(serial, Document):
			serial.company = voucher_company
		company = voucher_company
	return company


def should_auto_create_vin_for_serial(serial, voucher_company=None, prefer_voucher_company=False):
	"""Whether a new Serial No should trigger automatic VIN No creation."""
	enabled, companies = get_auto_vin_from_serial_settings()
	company = _prepare_serial_for_auto_vin(serial, voucher_company, prefer_voucher_company)

	if not enabled:
		return False

	if not _serial_value(serial, "item_code"):
		return False

	if _serial_value(serial, "reference_doctype") == "VIN No":
		return False

	serial_no = _serial_value(serial, "serial_no") or _serial_value(serial, "name")
	if serial_no and frappe.db.exists("VIN No", {"vin_number": serial_no}):
		return False

	# Cross-company / outward path: a vehicle being sold is always tracked —
	# create the VIN even if the selling company (e.g. LLC) is not a DMS company.
	# This covers: LLC buys vehicle, LLC sells to Suweys (a DMS company/customer) →
	# the VIN is created at the sale so DMS can track it.
	if prefer_voucher_company:
		item_code = _serial_value(serial, "item_code")
		item = frappe.get_cached_doc("Item", item_code)
		item_group = item.get("item_group") or ""
		vehicle_groups = frappe.get_all(
			"Item Group",
			filters={"custom_is_vehicle": 1},
			pluck="name",
		)
		if item_group not in vehicle_groups:
			return False
		return True

	# Inward / serial-insert path: respect the DMS Settings company gate.
	if not _company_allowed_for_auto_vin(company, companies, enabled):
		return False

	return True


def try_auto_create_vin_for_serial_no(
	serial_name,
	voucher_company=None,
	show_message=False,
	prefer_voucher_company=False,
	voucher_customer=None,
):
	"""
	Create VIN No for a serial if DMS Settings allows it.
	Used after_insert (manual), stock vouchers, and Serial and Batch Bundle.

	prefer_voucher_company: when True, use the voucher's company (e.g. the DMS
	company making a sale) even if the serial was originally created under a
	non-DMS purchasing company. This supports buy-from-LLC → sell-at-DMS-company.
	voucher_customer: optional customer resolved from the sale voucher, used when
	the serial's customer is not yet updated during bundle submit.
	"""
	if frappe.flags.get("skip_auto_vin_from_serial"):
		return None

	serial = frappe.get_doc("Serial No", serial_name)
	if not should_auto_create_vin_for_serial(
		serial,
		voucher_company=voucher_company,
		prefer_voucher_company=prefer_voucher_company,
	):
		return None

	try:
		result = create_vin_from_serial_document(
			serial,
			voucher_customer=voucher_customer,
		)
		if show_message and result == "created":
			frappe.msgprint(
				_("VIN No {0} was created automatically.").format(
					frappe.bold(serial.serial_no or serial.name)
				),
				alert=True,
				indicator="green",
			)
		return result
	except Exception:
		frappe.log_error(
			title="Auto-create VIN from Serial No",
			message=f"Serial: {serial_name}\nCompany: {serial.company}\n{frappe.get_traceback()}",
		)
		return "error"


def auto_create_vin_on_serial_insert(doc, method=None):
	"""Desk hook: create VIN No when Serial No is inserted via doc.insert()."""
	try_auto_create_vin_for_serial_no(doc.name, show_message=True)


def _serial_value(serial, fieldname, default=None):
	if isinstance(serial, Document):
		return getattr(serial, fieldname, default)
	return (serial.get(fieldname) if isinstance(serial, dict) else None) or default


def _build_vin_data_from_serial(serial, voucher_customer=None):
	"""Map Serial No fields to a new VIN No document dict.

	voucher_customer: optional customer resolved from the sale voucher
	(used when the serial's customer hasn't been updated yet during bundle submit).
	"""
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
		"current_customer": voucher_customer or _serial_value(serial, "customer"),
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


def create_vin_from_serial_document(serial, force_recreate=0, voucher_customer=None):
	"""
	Create or update one VIN No from a Serial No document or dict.
	Returns: 'created', 'updated', or 'skipped'.
	"""
	serial_no = _serial_value(serial, "serial_no") or _serial_value(serial, "name")
	existing_vin = frappe.db.exists("VIN No", {"vin_number": serial_no})

	if existing_vin and not cint(force_recreate):
		return "skipped"

	vin_data = _build_vin_data_from_serial(serial, voucher_customer=voucher_customer)

	if existing_vin and cint(force_recreate):
		frappe.db.set_value("VIN No", existing_vin, vin_data, update_modified=True)
		return "updated"

	vin_doc = frappe.get_doc(vin_data)
	frappe.flags.skip_auto_vin_from_serial = True
	try:
		vin_doc.flags.ignore_validate = True
		vin_doc.insert(ignore_permissions=True)
		from dms.utils.warranty import apply_dms_warranty_schedule

		apply_dms_warranty_schedule(vin_doc, persist=True)
	finally:
		frappe.flags.skip_auto_vin_from_serial = False

	return "created"


def auto_create_vin_on_bundle_submit(doc, method=None):
	"""
	Create VIN Nos when a Serial and Batch Bundle is submitted.

	Inward bundles: create VIN when a DMS company purchases a vehicle.
	Outward bundles: also create a VIN if the serial was originally created
	under a different (non-DMS) company, using the voucher's DMS company as
	the source — e.g. LLC purchased the vehicle and Suweys later sells it.
	"""
	if doc.docstatus != 1 or doc.is_cancelled:
		return
	if doc.type_of_transaction not in ("Inward", "Outward"):
		return

	# For outward sales we can still create a VIN from the serial if it belongs
	# to a vehicle item group and no VIN exists yet, using the selling company.
	prefer_voucher_company = doc.type_of_transaction == "Outward"

	# Resolve the customer from the voucher (Delivery Note / Sales Invoice)
	# so the VIN gets current_customer set correctly, since ERPNext updates
	# the serial's customer via SQL AFTER the bundle is submitted.
	voucher_customer = None
	if doc.voucher_type in ("Delivery Note", "Sales Invoice") and doc.voucher_no:
		voucher_customer = frappe.db.get_value(doc.voucher_type, doc.voucher_no, "customer")

	created = 0
	for row in doc.entries or []:
		if not row.serial_no:
			continue
		if (
			try_auto_create_vin_for_serial_no(
				row.serial_no,
				voucher_company=doc.company,
				prefer_voucher_company=prefer_voucher_company,
				voucher_customer=voucher_customer,
			)
			== "created"
		):
			created += 1

	if created:
		frappe.msgprint(
			_("Created {0} VIN record(s) from serial numbers.").format(created),
			alert=True,
			indicator="green",
		)


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


@frappe.whitelist()
def get_serial_vin_eligibility(serial_name):
	"""
	Check if a Serial No can have a VIN No created from it via the Serial No form button.

	Eligible when:
	  - The serial has an Item linked
	  - The Item belongs to an Item Group with custom_is_vehicle ticked
	  - No VIN No already exists for this serial (by vin_number or linked_serial)
	"""
	serial_name = (serial_name or "").strip()
	if not serial_name:
		return {"eligible": False, "reason": "Serial No is required."}

	serial = frappe.get_doc("Serial No", serial_name)
	item_code = serial.get("item_code")
	if not item_code:
		return {"eligible": False, "reason": "No Item is linked to this serial number."}

	if serial.get("reference_doctype") == "VIN No":
		return {"eligible": False, "reason": "This serial number was created from a VIN No record."}

	item = frappe.get_cached_doc("Item", item_code)
	if not item.get("item_group"):
		return {"eligible": False, "reason": "The linked Item has no Item Group."}

	vehicle_groups = frappe.get_all(
		"Item Group",
		filters={"custom_is_vehicle": 1},
		pluck="name",
	)
	if item.item_group not in vehicle_groups:
		return {
			"eligible": False,
			"reason": "Item is not a vehicle (Item Group 'custom_is_vehicle' is not checked).",
		}

	from dms.utils.serial_vin_sync import get_vin_name_for_serial

	if get_vin_name_for_serial(serial):
		return {"eligible": False, "reason": "A VIN No is already linked to this serial number."}

	return {"eligible": True}


@frappe.whitelist()
def create_vin_from_serial_api(serial_name):
	"""
	Manually create a VIN No from a Serial No (button on the Serial No form).
	Skips the DMS Settings auto-create gate — only requires the item to be a vehicle.
	"""
	serial_name = (serial_name or "").strip()
	if not serial_name:
		frappe.throw(_("Serial No is required."))

	eligibility = get_serial_vin_eligibility(serial_name)
	if not eligibility.get("eligible"):
		frappe.throw(_(eligibility.get("reason", "Cannot create VIN for this serial number.")))

	serial = frappe.get_doc("Serial No", serial_name)
	result = create_vin_from_serial_document(serial)
	frappe.db.commit()

	return {
		"result": result,
		"serial": serial.serial_no or serial_name,
		"vin_number": serial.serial_no or serial_name,
	}


@frappe.whitelist()
def backfill_vin_model_links_action(dry_run=0):
	"""Set VIN No.model from legacy model_name / linked_item labels."""
	from dms.utils.vin_model_backfill import backfill_vin_model_links

	return backfill_vin_model_links(dry_run=cint(dry_run))