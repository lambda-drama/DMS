import re

import frappe
from frappe import _
from frappe.utils import strip_html
from dms.api.utils import get_dms_companies, get_vehicle_customer_groups

_COLOR_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{3,8}$")


@frappe.whitelist()
def get_vehicle_customer_group_options():
	"""Customer Groups marked as vehicle customers (for quick-create / forms)."""
	return get_vehicle_customer_groups()


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
			"name", "vin_number", "plate_number", "linked_item", "model_name",
			"model_year", "current_customer", "customer_name", "current_odometer",
			"warranty_status", "warranty_end_date",
		],
		limit=int(limit),
		order_by="name desc",
	)

	return vins


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
def get_spare_parts(search=None, limit=20):
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"item_name": ["like", f"%{search}%"],
			"item_code": ["like", f"%{search}%"],
			"oem_part_number": ["like", f"%{search}%"],
		}

	parts = frappe.get_all(
		"Spare Part",
		or_filters=or_filters if or_filters else None,
		fields=["name", "item_name", "item_code", "part_category", "oem_part_number"],
		limit=int(limit),
		order_by="item_name asc",
	)

	return parts


@frappe.whitelist()
def get_vehicle_service_items(search=None, limit=20):
	"""Get Vehicle Service Item records for labour line lookups."""
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"service_item": ["like", f"%{search}%"],
		}

	items = frappe.get_all(
		"Vehicle Service Item",
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "service_item",
			"custom_erpnext_item", "custom_item_name",
			"custom_rate", "custom_estimated_timemin",
		],
		limit=int(limit),
		order_by="service_item asc",
	)

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

	from dms.api.utils import get_dms_sales_print_formats

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
	"""Return the standard rate for a labour item from linked ERP Item."""
	vsi = (vehicle_service_item or "").strip()
	if not vsi:
		return 0

	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		resolve_vehicle_service_item_to_item_code,
	)
	from frappe.utils import flt

	item_code = resolve_vehicle_service_item_to_item_code(vsi)
	if not item_code:
		return 0

	sr = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)
	return sr


@frappe.whitelist()
def get_service_bay_detail(bay_name=None):
	"""Return the workshop (branch) linked to a service bay."""
	bay_name = (bay_name or "").strip()
	if not bay_name:
		return {}
	bay = frappe.db.get_value("Service Bay", bay_name, ["branch", "bay_number", "bay_name"], as_dict=True)
	return bay or {}
