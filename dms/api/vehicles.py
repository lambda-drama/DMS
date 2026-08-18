import frappe
from frappe import _

from dms.api.utils import LIST_ORDER_LATEST_CREATED, get_dms_companies, resolve_dms_customer


@frappe.whitelist()
def get_vehicles(limit=50, offset=0, customer=None, search=None, vehicle_status=None, warranty_status=None):
	filters = {}
	if customer:
		filters["current_customer"] = customer
	if vehicle_status:
		filters["vehicle_status"] = vehicle_status
	if warranty_status:
		if warranty_status == "Inactive":
			filters["warranty_status"] = ["in", ["Inactive", "Expired by Time"]]
		else:
			filters["warranty_status"] = warranty_status

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"vin_number": ["like", f"%{search}%"],
			"plate_number": ["like", f"%{search}%"],
			"model_name": ["like", f"%{search}%"],
			"customer_name": ["like", f"%{search}%"],
			"engine_number": ["like", f"%{search}%"],
		}

	total = len(frappe.get_all(
		"VIN No",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	vehicles = frappe.get_all(
		"VIN No",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "vin_number", "engine_number", "plate_number",
			"linked_item", "model", "model_name", "model_year", "brand",
			"fuel_type", "transmission", "exterior_color",
			"current_customer", "customer_name",
			"current_odometer", "odometer_unit",
			"warranty_status", "warranty_end_date",
			"vehicle_status", "company",
			"next_service_due_km", "next_service_due_date",
			"creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)

	# List used to show stale stored warranty_status; job card uses live recompute.
	# Refresh each row (page-sized) so badges match the job-card warranty banner.
	from dms.utils.warranty import refresh_vin_warranty_status_for_list

	refresh_vin_warranty_status_for_list(vehicles)

	return {"data": vehicles, "total": total}


@frappe.whitelist()
def get_vehicle(name):
	if not name:
		frappe.throw(_("VIN name is required"))

	doc = frappe.get_doc("VIN No", name)
	doc.check_permission("read")

	data = doc.as_dict()
	from dms.api.service_packages import resolve_vehicle_model_from_vin

	vm, vm_label = resolve_vehicle_model_from_vin(name)
	data["resolved_vehicle_model"] = vm
	data["resolved_vehicle_model_label"] = vm_label

	if data.get("brand"):
		data["brand_label"] = frappe.db.get_value("Brand", data["brand"], "brand") or data["brand"]

	from dms.utils.warranty import get_warranty_summary

	summary = get_warranty_summary(doc, recalculate=True)
	data["warranty_summary"] = summary
	# Keep top-level field aligned with live summary (detail sheet / forms)
	if summary.get("warranty_status"):
		data["warranty_status"] = summary["warranty_status"]
		data["warranty_end_date"] = summary.get("warranty_end_date") or data.get("warranty_end_date")
		stored = (doc.warranty_status or "").strip()
		live = (summary.get("warranty_status") or "").strip()
		if (
			live
			and live != stored
			and stored not in ("Void", "Pending Verification")
		):
			frappe.db.set_value(
				"VIN No",
				doc.name,
				{
					"warranty_status": live,
					"warranty_start_date": summary.get("warranty_start_date"),
					"warranty_end_date": summary.get("warranty_end_date"),
					"warranty_km_limit": summary.get("warranty_km_limit"),
				},
				update_modified=False,
			)
	return data


@frappe.whitelist()
def get_vehicle_warranty_summary(vin_no=None):
	"""Warranty active/inactive for UI (DMS Settings period + mileage, sale from stock)."""
	vin_no = (vin_no or "").strip()
	if not vin_no:
		frappe.throw(_("VIN is required"))

	from dms.utils.warranty import get_warranty_summary

	return get_warranty_summary(vin_no, recalculate=True)


@frappe.whitelist()
def create_vehicle(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	company = (data.get("company") or "").strip()
	allowed = get_dms_companies()
	if not allowed:
		frappe.throw(
			_("Add at least one company in DMS Settings (Company table) before registering vehicles.")
		)
	if not company:
		frappe.throw(_("Company is required"))
	if company not in allowed:
		frappe.throw(_("Company must be one of the companies selected in DMS Settings."))

	warranty_status = (data.get("warranty_status") or "Inactive").strip() or "Inactive"

	doc = frappe.get_doc({
		"doctype": "VIN No",
		"vin_number": data.get("vin_number"),
		"engine_number": data.get("engine_number"),
		"plate_number": data.get("plate_number"),
		"company": company,
		"linked_item": data.get("linked_item"),
		"model": data.get("model"),
		"brand": data.get("brand"),
		"model_variant": data.get("model_variant"),
		"model_year": data.get("model_year"),
		"production_date": data.get("production_date"),
		"fuel_type": data.get("fuel_type"),
		"transmission": data.get("transmission"),
		"drive_type": data.get("drive_type"),
		"exterior_color": data.get("exterior_color"),
		"interior_color": data.get("interior_color"),
		"interior_material": data.get("interior_material"),
		"current_customer": resolve_dms_customer(data.get("current_customer")),
		"current_odometer": data.get("current_odometer"),
		"odometer_unit": data.get("odometer_unit", "km"),
		"warranty_start_date": data.get("warranty_start_date"),
		"warranty_end_date": data.get("warranty_end_date"),
		"warranty_km_limit": data.get("warranty_km_limit"),
		"warranty_status": warranty_status,
		"vehicle_status": data.get("vehicle_status", "In Stock"),
		"import_type": data.get("import_type"),
		"registration_date": data.get("registration_date"),
		"special_notes": data.get("special_notes"),
	})

	# Keep the UI-selected warranty status; validate() would otherwise recompute it.
	frappe.flags.preserve_warranty_status = True
	try:
		doc.insert()
	finally:
		frappe.flags.preserve_warranty_status = False
	frappe.db.commit()

	return {
		"name": doc.name,
		"vin_number": doc.vin_number,
		"model": doc.model,
		"model_name": doc.model_name,
		"warranty_status": doc.warranty_status,
		"vehicle_status": doc.vehicle_status,
	}


@frappe.whitelist()
def update_vehicle(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("VIN No", name)
	doc.check_permission("write")

	updatable = [
		"engine_number", "plate_number", "model", "brand", "model_variant",
		"model_year", "fuel_type", "transmission", "drive_type",
		"exterior_color", "interior_color", "interior_material",
		"current_customer", "current_odometer", "odometer_unit",
		"warranty_start_date", "warranty_end_date", "warranty_km_limit",
		"warranty_status",
		"vehicle_status", "special_notes", "internal_notes",
		"insurance_company", "insurance_policy_number", "insurance_expiry_date",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	if "warranty_status" in data:
		frappe.flags.preserve_warranty_status = True
	try:
		doc.save()
	finally:
		frappe.flags.preserve_warranty_status = False
	frappe.db.commit()

	return {
		"name": doc.name,
		"vehicle_status": doc.vehicle_status,
		"warranty_status": doc.warranty_status,
	}


@frappe.whitelist()
def get_vehicle_items(search=None, limit=20):
	"""Get Item records filtered to vehicles (Item Group with custom_is_vehicle checked).

	Item Groups that also have custom_auto_generate_spare_parts checked are excluded
	because auto-generated spare parts would crowd the vehicle dropdown.
	"""
	vehicle_groups = frappe.get_all(
		"Item Group",
		filters={
			"custom_is_vehicle": 1,
			"custom_auto_generate_spare_parts": ["!=", 1],
		},
		fields=["name"],
	)
	group_names = [g.name for g in vehicle_groups]

	if not group_names:
		return []

	filters = {"item_group": ["in", group_names]}

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"item_name": ["like", f"%{search}%"],
		}

	items = frappe.get_all(
		"Item",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=["name", "item_name", "item_code", "item_group", "brand"],
		limit=int(limit),
		order_by="item_name asc",
	)

	return items
