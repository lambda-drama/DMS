import re

import frappe
from frappe import _
from frappe.utils import strip_html
from dms.api.utils import get_dms_companies, get_dms_default_customer, get_dms_default_customer_group, get_vehicle_customer_groups

_COLOR_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{3,8}$")


@frappe.whitelist()
def get_vehicle_customer_group_options():
	"""Vehicle customer groups and DMS Settings default for quick-create."""
	groups = get_vehicle_customer_groups()
	default = get_dms_default_customer_group()
	if not default and groups:
		default = groups[0]
	return {
		"groups": groups,
		"default_customer_group": default,
	}


@frappe.whitelist()
def get_dms_customer_defaults():
	"""Default customer for DMS UI forms (DMS Settings → Default Customer)."""
	customer = get_dms_default_customer()
	if not customer:
		return {"default_customer": None, "customer_name": None, "mobile_no": None}

	row = frappe.db.get_value(
		"Customer",
		customer,
		["customer_name", "mobile_no"],
		as_dict=True,
	) or {}
	return {
		"default_customer": customer,
		"customer_name": row.get("customer_name") or customer,
		"mobile_no": row.get("mobile_no"),
	}


@frappe.whitelist()
def get_customers(search=None, limit=50, offset=0):
	filters = {}

	vehicle_groups = get_vehicle_customer_groups()
	if vehicle_groups:
		filters["customer_group"] = ["in", vehicle_groups]

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer_name": ["like", f"%{search}%"],
			"mobile_no": ["like", f"%{search}%"],
		}

	total = len(frappe.get_all(
		"Customer",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	customers = frappe.get_all(
		"Customer",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "customer_name", "mobile_no", "email_id",
			"customer_type", "customer_group", "territory",
			"creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="customer_name asc",
	)

	return {"data": customers, "total": total}


@frappe.whitelist()
def get_customer_contact(customer):
	"""Phone and email for appointment / job card forms."""
	if not customer:
		frappe.throw(_("Customer is required"))
	frappe.has_permission("Customer", "read", throw=True)
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found").format(customer))

	row = frappe.db.get_value(
		"Customer",
		customer,
		["mobile_no", "email_id"],
		as_dict=True,
	)
	return {
		"name": customer,
		"mobile_no": (row.mobile_no or "").strip() if row else "",
		"email_id": (row.email_id or "").strip() if row else "",
	}


@frappe.whitelist()
def update_customer_contact(customer, data=None):
	"""Update customer phone and email from DMS UI."""
	import json

	if isinstance(data, str):
		data = json.loads(data) if data else {}
	data = data or {}

	if not customer:
		frappe.throw(_("Customer is required"))
	frappe.has_permission("Customer", "write", throw=True)
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found").format(customer))

	updates = {}
	if "mobile_no" in data:
		updates["mobile_no"] = (data.get("mobile_no") or "").strip()
	if "email_id" in data:
		updates["email_id"] = (data.get("email_id") or "").strip()
	if updates:
		frappe.db.set_value("Customer", customer, updates, update_modified=True)

	frappe.db.commit()
	return get_customer_contact(customer)


@frappe.whitelist()
def get_vins(customer=None, search=None, limit=20):
	filters = {}
	if customer:
		filters["current_customer"] = customer

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"vin_number": ["like", f"%{search}%"],
			"plate_number": ["like", f"%{search}%"],
		}

	vins = frappe.get_all(
		"VIN No",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "vin_number", "plate_number", "linked_item", "model", "model_name",
			"model_year", "brand", "current_customer", "customer_name", "current_odometer",
			"warranty_status", "warranty_end_date",
		],
		limit=int(limit),
		order_by="name desc",
	)

	from dms.api.service_packages import resolve_vehicle_model_from_vin

	for row in vins:
		vm, label = resolve_vehicle_model_from_vin(row.get("name"))
		row["resolved_vehicle_model"] = vm
		row["resolved_vehicle_model_label"] = label

	return vins


@frappe.whitelist()
def get_vehicle_models(search=None, brand=None, limit=30):
	"""Vehicle Model master records for dropdowns (not VIN model_name text)."""
	filters: dict = {}
	meta = frappe.get_meta("Vehicle Model")
	if meta.has_field("is_active"):
		filters["is_active"] = 1
	if brand:
		filters["brand"] = (brand or "").strip()

	or_filters = {}
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"model_name": ["like", q],
			"model_code": ["like", q],
		}

	rows = frappe.get_all(
		"Vehicle Model",
		filters=filters or None,
		or_filters=or_filters if or_filters else None,
		fields=["name", "model_name", "model_code", "brand", "model_year", "variant"],
		limit=int(limit),
		order_by="model_name asc",
	)

	for row in rows:
		if row.get("brand"):
			row["brand_label"] = frappe.db.get_value("Brand", row.brand, "brand") or row.brand

	return rows


def get_color_display_label(row: dict) -> str:
	"""
	Human-readable label for Color rows (dropdowns / search).
	Prefers name fields over swatch hex (`color`) and encoded `name` IDs.
	"""
	for key in ("color_name", "colour_name"):
		v = row.get(key)
		if v and str(v).strip():
			return str(v).strip()
	desc = row.get("description")
	if desc and str(desc).strip():
		return strip_html(str(desc)).strip()[:120]
	c = row.get("color")
	if c and str(c).strip():
		cs = str(c).strip()
		if not _COLOR_HEX_RE.match(cs):
			return cs
	return str(row.get("name") or "").strip()


@frappe.whitelist()
def get_colors(search=None, limit=40):
	"""Search Color doctype for VIN appearance link fields."""
	if not frappe.db.exists("DocType", "Color"):
		return []

	meta = frappe.get_meta("Color")
	fields = ["name"]
	for fn in ("color", "color_name", "colour_name", "description"):
		if meta.has_field(fn):
			fields.append(fn)

	or_filters = None
	if search:
		search = (search or "").strip()
	if search:
		or_filters = {}
		for f in fields:
			or_filters[f] = ["like", f"%{search}%"]

	rows = frappe.get_all(
		"Color",
		or_filters=or_filters,
		fields=fields,
		limit=int(limit),
		order_by="name asc",
	)
	out = []
	for r in rows:
		out.append({"name": r["name"], "label": get_color_display_label(r)})
	return out


@frappe.whitelist()
def get_vehicle_service_types(search=None, limit=100):
	filters = {"is_active": 1}
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"service_type_name": ["like", f"%{search}%"],
		}

	return frappe.get_all(
		"Vehicle Service Type",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "service_type_name", "description",
			"default_estimated_hours", "warranty_applicable", "requires_diagnostic",
		],
		limit=int(limit),
		order_by="service_type_name asc",
	)


@frappe.whitelist()
def get_service_advisors(search=None, limit=50):
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"full_name": ["like", f"%{search}%"],
		}

	advisors = frappe.get_all(
		"Service Advisor",
		filters={"status": "Active"},
		or_filters=or_filters if or_filters else None,
		fields=["name", "full_name", "email", "phone", "workshop"],
		limit=int(limit),
		order_by="full_name asc",
	)

	return advisors


@frappe.whitelist()
def get_technicians(search=None, limit=50):
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"full_name": ["like", f"%{search}%"],
		}

	technicians = frappe.get_all(
		"Technician",
		filters={"status": "Active"},
		or_filters=or_filters if or_filters else None,
		fields=["name", "full_name", "personal_phone"],
		limit=int(limit),
		order_by="full_name asc",
	)

	return technicians


@frappe.whitelist()
def get_service_bays(search=None, limit=50):
	filters = {"is_active": 1}

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"bay_name": ["like", f"%{search}%"],
			"bay_number": ["like", f"%{search}%"],
		}

	bays = frappe.get_all(
		"Service Bay",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=["name", "bay_number", "bay_name", "branch"],
		limit=int(limit),
		order_by="bay_number asc",
	)

	return bays


@frappe.whitelist()
def get_spare_parts(search=None, limit=20, warehouse=None, company=None, vin=None, vehicle_model=None, vehicle_brand=None):
	from dms.dealer_management_system.utils.stock_operations import (
		attach_spare_part_stock_available,
		resolve_spare_parts_vehicle_filter,
	)

	_vehicle_model, _vehicle_brand, allowed_names = resolve_spare_parts_vehicle_filter(
		vin=vin,
		vehicle_model=vehicle_model,
		vehicle_brand=vehicle_brand,
	)

	sp_filters: dict = {}
	sp_meta = frappe.get_meta("Spare Part")
	if sp_meta.has_field("discontinued"):
		sp_filters["discontinued"] = 0
	if allowed_names is not None:
		if not allowed_names:
			return []
		sp_filters["name"] = ["in", list(allowed_names)]

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		or_filters = [
			["name", "like", q],
			["item_name", "like", q],
			["item_code", "like", q],
			["oem_part_number", "like", q],
			["bin_location", "like", q],
			["spare_part_item", "like", q],
		]
		matching_items = frappe.get_all(
			"Item",
			filters={"disabled": 0, "is_stock_item": 1},
			or_filters=[
				["name", "like", q],
				["item_name", "like", q],
			],
			pluck="name",
			limit=50,
		)
		if matching_items:
			or_filters.append(["spare_part_item", "in", matching_items])

	parts = frappe.get_all(
		"Spare Part",
		filters=sp_filters or None,
		or_filters=or_filters,
		fields=[
			"name",
			"item_name",
			"item_code",
			"part_category",
			"oem_part_number",
			"bin_location",
			"spare_part_item",
		],
		limit=int(limit),
		order_by="item_name asc",
	)

	warehouse = (warehouse or "").strip() or None
	company = (company or "").strip() or None
	attach_spare_part_stock_available(parts, warehouse, company)

	return parts


def _vehicle_service_item_list_fields() -> list[str]:
	fields = ["name", "service_item", "custom_erpnext_item", "custom_item_name", "custom_rate"]
	meta = frappe.get_meta("Vehicle Service Item")
	if meta.has_field("custom_service_code"):
		fields.append("custom_service_code")
	if meta.has_field("custom_estimated_timehours"):
		fields.append("custom_estimated_timehours")
	return fields


@frappe.whitelist()
def get_vehicle_service_items(search=None, limit=20, vehicle_model=None, vin=None):
	"""Get Vehicle Service Item records for labour line lookups."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_estimated_hours,
	)
	meta = frappe.get_meta("Vehicle Service Item")
	filters = {}

	vehicle_model = (vehicle_model or "").strip()
	vin = (vin or "").strip()
	if not vehicle_model and vin:
		from dms.api.service_packages import resolve_vehicle_model_from_vin

		vehicle_model, _vm_label = resolve_vehicle_model_from_vin(vin)

	if vehicle_model and meta.has_field("custom_vehicle_model"):
		filters["custom_vehicle_model"] = vehicle_model

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"service_item": ["like", f"%{search}%"],
		}
		if meta.has_field("custom_item_name"):
			or_filters["custom_item_name"] = ["like", f"%{search}%"]
		if meta.has_field("custom_service_code"):
			or_filters["custom_service_code"] = ["like", f"%{search}%"]
		if meta.has_field("custom_erpnext_item"):
			or_filters["custom_erpnext_item"] = ["like", f"%{search}%"]

	items = frappe.get_all(
		"Vehicle Service Item",
		filters=filters or None,
		or_filters=or_filters if or_filters else None,
		fields=_vehicle_service_item_list_fields(),
		limit=int(limit),
		order_by="service_item asc",
	)

	for item in items:
		item["estimated_hours"] = vehicle_service_item_estimated_hours(item.get("name"))

	return items


@frappe.whitelist()
def get_workshops(search=None, limit=20):
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
		}

	workshops = frappe.get_all(
		"WorkShop",
		or_filters=or_filters if or_filters else None,
		fields=["name"],
		limit=int(limit),
		order_by="name asc",
	)

	return workshops


@frappe.whitelist()
def get_warehouses(search=None, company=None, limit=20):
	filters = {}
	if company:
		filters["company"] = company

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"warehouse_name": ["like", f"%{search}%"],
		}

	warehouses = frappe.get_all(
		"Warehouse",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=["name", "warehouse_name", "company"],
		limit=int(limit),
		order_by="name asc",
	)

	return warehouses


@frappe.whitelist()
def get_currencies():
	"""Enabled ERPNext currencies for invoice / job card forms."""
	rows = frappe.get_all(
		"Currency",
		filters={"enabled": 1},
		fields=["name"],
		order_by="name asc",
	)
	names = [r.name for r in rows]
	if "ETB" in names:
		names = ["ETB"] + [n for n in names if n != "ETB"]
	elif not names:
		names = ["ETB"]
	return names


@frappe.whitelist()
def get_working_times():
	"""Working Time schedule templates for technician / advisor assignment."""
	rows = frappe.get_all(
		"Working Time",
		fields=["name", "schedule", "description"],
		order_by="schedule asc",
	)
	out = []
	for row in rows:
		doc = frappe.get_doc("Working Time", row.name)
		from dms.dealer_management_system.doctype.working_time.working_time import (
			format_day_summary,
		)

		out.append(
			{
				"name": doc.name,
				"schedule": doc.schedule,
				"description": doc.description,
				"days": [
					{
						"day_of_week": d.day_of_week,
						"start_time": d.start_time,
						"end_time": d.end_time,
						"has_lunch_break": d.has_lunch_break,
						"lunch_start": d.lunch_start,
						"lunch_end": d.lunch_end,
						"is_half_day": d.is_half_day,
						"summary": format_day_summary(d),
					}
					for d in doc.weekly_schedule
				],
			}
		)
	return out


@frappe.whitelist()
def get_companies(search=None, limit=20):
	allowed = get_dms_companies()

	if not allowed:
		return []

	filters = {"name": ["in", allowed]}
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"company_name": ["like", f"%{search}%"],
		}

	companies = frappe.get_all(
		"Company",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=["name", "company_name", "default_currency"],
		limit=int(limit),
		order_by="name asc",
	)

	return companies


@frappe.whitelist()
def get_print_formats(doctype):
	"""Return print format names for the given doctype (Frappe printview dropdown)."""
	if not doctype:
		return ["Standard"]

	from dms.api.utils import get_dms_purchase_receipt_print_formats, get_dms_sales_print_formats

	formats = frappe.get_all(
		"Print Format",
		filters={"doc_type": doctype, "disabled": 0},
		pluck="name",
		order_by="name",
	)

	if doctype == "Sales Invoice":
		allowed = get_dms_sales_print_formats()
		if allowed:
			valid = set(formats)
			filtered = [name for name in allowed if name in valid]
			return filtered if filtered else ["Standard"]

	if doctype == "Purchase Receipt":
		allowed = get_dms_purchase_receipt_print_formats()
		if allowed:
			valid = set(formats)
			filtered = [name for name in allowed if name in valid]
			return filtered if filtered else ["Standard"]

	result = ["Standard"]
	seen = {"Standard"}
	for name in formats:
		if name and name not in seen:
			result.append(name)
			seen.add(name)
	return result


@frappe.whitelist()
def get_spare_part_price(spare_part=None):
	"""Return default selling price for a spare part using the costing module logic."""
	spare_part = (spare_part or "").strip()
	if not spare_part:
		return 0

	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		spare_part_default_selling_price,
	)
	return spare_part_default_selling_price(spare_part)


@frappe.whitelist()
def get_labour_rate(vehicle_service_item=None):
	"""Return labour rate: VSI custom_rate → ERP Item standard_rate → DMS default service fee."""
	vsi = (vehicle_service_item or "").strip()
	if not vsi:
		return 0

	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_labour_rate,
	)

	return vehicle_service_item_labour_rate(vsi)


@frappe.whitelist()
def get_vehicle_service_item_estimated_hours(vehicle_service_item=None):
	"""Return estimated labour hours from Vehicle Service Item."""
	vsi = (vehicle_service_item or "").strip()
	if not vsi:
		return 0

	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_estimated_hours,
	)

	return vehicle_service_item_estimated_hours(vsi)


@frappe.whitelist()
def get_vehicle_service_item_line_defaults(vehicle_service_item=None):
	"""Rate and estimated hours for a labour line when a service item is picked."""
	vsi = (vehicle_service_item or "").strip()
	if not vsi:
		return {"rate_per_hour": 0, "estimated_hours": 0, "service_name": "", "service_code": ""}

	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_estimated_hours,
		vehicle_service_item_labour_rate,
	)

	service_name = frappe.db.get_value("Vehicle Service Item", vsi, "service_item") or vsi
	item_name = frappe.db.get_value("Vehicle Service Item", vsi, "custom_item_name") if frappe.get_meta(
		"Vehicle Service Item"
	).has_field("custom_item_name") else None
	service_code = frappe.db.get_value("Vehicle Service Item", vsi, "custom_service_code") if frappe.get_meta(
		"Vehicle Service Item"
	).has_field("custom_service_code") else None

	return {
		"rate_per_hour": vehicle_service_item_labour_rate(vsi),
		"estimated_hours": vehicle_service_item_estimated_hours(vsi),
		"service_name": item_name or service_name,
		"service_code": service_code or "",
	}


@frappe.whitelist()
def get_service_bay_detail(bay_name=None):
	"""Return workshop (branch) and warehouse linked to a service bay."""
	bay_name = (bay_name or "").strip()
	if not bay_name:
		return {}
	bay = frappe.db.get_value("Service Bay", bay_name, ["branch", "bay_number", "bay_name"], as_dict=True)
	if not bay:
		return {}

	workshop = bay.get("branch")
	warehouse = frappe.db.get_value("WorkShop", workshop, "warehouse") if workshop else None
	return {
		**bay,
		"workshop": workshop,
		"warehouse": warehouse,
	}


@frappe.whitelist()
def get_customer_terms_and_conditions():
	"""English + Arabic customer terms for inspection / estimate approval."""
	if not (
		frappe.has_permission("DMS Service Estimate", "read")
		or frappe.has_permission("Vehicle Inspection", "read")
	):
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	from dms.dealer_management_system.utils.customer_terms import fetch_bilingual_terms_payload

	return fetch_bilingual_terms_payload()
