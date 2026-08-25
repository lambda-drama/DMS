# Copyright (c) 2026, Mania and contributors
"""Shared helpers for CRM APIs — independent of dms.api.*."""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint, flt


def parse_json(value):
	if value is None or value == "":
		return {}
	if isinstance(value, (dict, list)):
		return value
	if isinstance(value, str):
		try:
			return json.loads(value)
		except Exception:
			return {}
	return {}


def paginate(limit=50, offset=0):
	limit = max(1, min(cint(limit) or 50, 200))
	offset = max(0, cint(offset) or 0)
	return limit, offset


def ensure_crm_read(doctype: str):
	frappe.has_permission(doctype, "read", throw=True)


def ensure_crm_write(doctype: str):
	frappe.has_permission(doctype, "write", throw=True)


def ensure_crm_create(doctype: str):
	frappe.has_permission(doctype, "create", throw=True)


def customer_display_name(customer: str | None) -> str:
	if not customer:
		return ""
	return frappe.db.get_value("Customer", customer, "customer_name") or customer


def user_display_name(user: str | None) -> str:
	if not user:
		return ""
	return frappe.db.get_value("User", user, "full_name") or user


@frappe.whitelist()
def get_branches(search=None, company=None, limit=50):
	"""CRM-local endpoint backed by the canonical DMS branch lookup."""
	from dms.dealer_management_system.utils.branch_permissions import get_dms_branches

	return get_dms_branches(search=search, company=company, limit=limit)


@frappe.whitelist()
def get_brands(search=None, limit=40):
	"""ERPNext Brand master for CRM link fields."""
	ensure_crm_read("DMS CRM Lead")
	filters = {}
	or_filters = None
	search = (search or "").strip()
	if search:
		q = f"%{search}%"
		or_filters = {"name": ["like", q], "brand": ["like", q]}

	rows = frappe.get_all(
		"Brand",
		filters=filters or None,
		or_filters=or_filters,
		fields=["name", "brand"],
		limit=cint(limit) or 40,
		order_by="name asc",
		ignore_permissions=True,
	)
	return [
		{"name": row.name, "label": row.brand or row.name}
		for row in rows
	]


@frappe.whitelist()
def get_territories(search=None, limit=50, is_group=0):
	"""ERPNext Territory master for CRM link fields (Customer, Account, etc.)."""
	if not frappe.db.exists("DocType", "Territory"):
		return []
	filters = {}
	if frappe.get_meta("Territory").has_field("is_group") and str(is_group) != "all":
		filters["is_group"] = cint(is_group)
	or_filters = None
	search = (search or "").strip()
	if search:
		q = f"%{search}%"
		or_filters = [["name", "like", q]]
		if frappe.get_meta("Territory").has_field("territory_name"):
			or_filters.append(["territory_name", "like", q])
	fields = ["name"]
	if frappe.get_meta("Territory").has_field("territory_name"):
		fields.append("territory_name")
	if frappe.get_meta("Territory").has_field("parent_territory"):
		fields.append("parent_territory")
	rows = frappe.get_all(
		"Territory",
		filters=filters or None,
		or_filters=or_filters,
		fields=fields,
		limit=cint(limit) or 50,
		order_by="name asc",
	)
	return [
		{
			"name": row.name,
			"label": row.get("territory_name") or row.name,
			"parent_territory": row.get("parent_territory"),
		}
		for row in rows
	]


@frappe.whitelist()
def get_vehicle_models(search=None, brand=None, limit=50):
	"""Vehicle Model master for CRM Lead / Deal Interest pickers."""
	ensure_crm_read("DMS CRM Lead")
	from dms.api.common import get_vehicle_models as _get_vehicle_models

	return _get_vehicle_models(search=search, brand=brand, limit=limit)


@frappe.whitelist()
def get_colors(search=None, limit=40):
	"""Color master — same shape as DMS color dropdown."""
	from dms.api.common import get_colors as _get_colors

	return _get_colors(search=search, limit=limit)


@frappe.whitelist()
def get_items(search=None, limit=30):
	"""Sellable Item lookup for CRM opportunity / quotation lines."""
	ensure_crm_read("Item")
	search = (search or "").strip()
	filters = {"disabled": 0, "is_sales_item": 1}
	or_filters = None
	if search:
		q = f"%{search}%"
		or_filters = {
			"name": ["like", q],
			"item_name": ["like", q],
			"item_code": ["like", q],
		}
	rows = frappe.get_all(
		"Item",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "item_code", "item_name", "stock_uom", "brand", "description", "standard_rate"],
		limit=cint(limit) or 30,
		order_by="item_name asc",
	)
	return [
		{
			"name": row.name,
			"item_code": row.item_code or row.name,
			"item_name": row.item_name or row.name,
			"uom": row.stock_uom,
			"brand": row.brand,
			"description": row.description,
			"rate": row.standard_rate,
			"label": f"{row.item_code or row.name} — {row.item_name or ''}".strip(" —"),
		}
		for row in rows
	]


@frappe.whitelist()
def get_company_currency(company=None):
	"""Default currency code + symbol for a DMS company (amount field labels)."""
	company = (company or "").strip()
	if not company:
		from dms.dealer_management_system.utils.company_permissions import get_dms_companies

		companies = get_dms_companies()
		company = companies[0] if companies else ""
	if not company or not frappe.db.exists("Company", company):
		return {"company": None, "currency": None, "symbol": None}

	currency = frappe.db.get_value("Company", company, "default_currency")
	symbol = None
	if currency:
		symbol = frappe.db.get_value("Currency", currency, "symbol") or currency
	return {"company": company, "currency": currency, "symbol": symbol}


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def branch_link_query(doctype, txt, searchfield, start, page_len, filters):
	"""Desk Link query using the same company/user branch scope as DMS."""
	from dms.dealer_management_system.utils.branch_permissions import get_dms_branches

	filters = parse_json(filters)
	company = filters.get("company")
	rows = get_dms_branches(
		search=txt,
		company=company,
		limit=page_len,
	)
	return [[row["name"], row.get("branch") or row["name"]] for row in rows]


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def company_link_query(doctype, txt, searchfield, start, page_len, filters):
	"""Desk Company Link query restricted to companies selected in DMS Settings."""
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies

	allowed = get_dms_companies()
	if not allowed:
		return []

	txt = (txt or "").strip().lower()
	rows = frappe.get_all(
		"Company",
		filters={"name": ["in", allowed]},
		fields=["name", "company_name"],
		order_by="name asc",
		limit_page_length=500,
	)
	if txt:
		rows = [
			row
			for row in rows
			if txt in (row.name or "").lower()
			or txt in (row.company_name or "").lower()
		]
	start = max(cint(start), 0)
	page_len = max(cint(page_len) or 20, 1)
	return [
		[row.name, row.company_name or row.name]
		for row in rows[start : start + page_len]
	]


@frappe.whitelist()
def get_csrf_token():
	"""CRM-local CSRF helper so the CRM UI never depends on dms.api.common."""
	return frappe.sessions.get_csrf_token()


@frappe.whitelist()
def ping():
	return {"ok": 1, "module": "crm"}


@frappe.whitelist()
def quick_create_territory(territory_name, parent_territory=None):
	"""Create a leaf Territory from a CRM link + button."""
	ensure_crm_create("Territory")
	territory_name = (territory_name or "").strip()
	if not territory_name:
		frappe.throw(_("Territory name is required."))
	if frappe.db.exists("Territory", territory_name):
		frappe.throw(_("Territory {0} already exists.").format(territory_name))
	parent = (parent_territory or "").strip() or None
	if not parent and frappe.get_meta("Territory").has_field("parent_territory"):
		parent = frappe.db.get_value("Territory", {"is_group": 1}, "name")
	doc = frappe.get_doc(
		{
			"doctype": "Territory",
			"territory_name": territory_name,
			"parent_territory": parent,
			"is_group": 0,
		}
	)
	doc.insert()
	frappe.db.commit()
	return {"name": doc.name, "label": doc.territory_name or doc.name}


@frappe.whitelist()
def quick_create_brand(brand):
	"""Create a Brand from a CRM link + button."""
	ensure_crm_create("Brand")
	brand = (brand or "").strip()
	if not brand:
		frappe.throw(_("Brand name is required."))
	if frappe.db.exists("Brand", brand):
		return {"name": brand, "label": brand}
	doc = frappe.get_doc({"doctype": "Brand", "brand": brand})
	doc.insert()
	frappe.db.commit()
	return {"name": doc.name, "label": doc.brand or doc.name}


@frappe.whitelist()
def quick_create_item(item_code=None, item_name=None, brand=None, standard_rate=None, bin_location=None):
	"""Create a sellable Item from a CRM link + button (deal / quotation lines)."""
	from dms.utils.spare_part_auto_create import (
		SPARE_PART_BIN_LOCATION_FLAG,
		apply_bin_location_to_item_spare_part,
	)

	ensure_crm_create("Item")
	item_code = (item_code or item_name or "").strip()
	item_name = (item_name or item_code).strip()
	bin_location = (bin_location or "").strip()
	if not item_code:
		frappe.throw(_("Item code is required."))
	if frappe.db.exists("Item", item_code):
		existing = frappe.db.get_value("Item", item_code, ["name", "item_name"], as_dict=True)
		return {"name": existing.name, "label": existing.item_name or existing.name}

	item_group = frappe.db.get_value("Item Group", {"name": "Products"}, "name") or frappe.db.get_value(
		"Item Group", {"is_group": 0}, "name"
	)
	if not item_group:
		frappe.throw(_("Configure at least one Item Group before creating Items."))

	doc = frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": item_name,
			"item_group": item_group,
			"stock_uom": "Nos",
			"is_stock_item": 1,
			"is_sales_item": 1,
			"brand": (brand or "").strip() or None,
			"standard_rate": flt(standard_rate),
		}
	)
	frappe.flags[SPARE_PART_BIN_LOCATION_FLAG] = bin_location or None
	try:
		doc.insert()
	finally:
		frappe.flags[SPARE_PART_BIN_LOCATION_FLAG] = None
	apply_bin_location_to_item_spare_part(doc.name, bin_location)
	frappe.db.commit()
	return {"name": doc.name, "label": doc.item_name or doc.name, "bin_location": bin_location or None}


@frappe.whitelist()
def quick_create_vehicle_model(
	model_name=None,
	brand=None,
	model_code=None,
	fuel_type=None,
	transmission=None,
	variant=None,
):
	"""Create Vehicle Model (+ linked Item when needed) from CRM link + button."""
	ensure_crm_create("Vehicle Model")
	model_name = (model_name or "").strip()
	if not model_name:
		frappe.throw(_("Model name is required."))

	brand = (brand or "").strip() or None
	model_code = (model_code or "").strip() or model_name
	fuel_type = (fuel_type or "Petrol").strip() or "Petrol"
	transmission = (transmission or "Automatic (AT)").strip() or "Automatic (AT)"
	variant = (variant or "").strip() or None

	# Vehicle Model is named by its Item link field `model`
	item_code = model_code
	if not frappe.db.exists("Item", item_code):
		ensure_crm_create("Item")
		item_group = frappe.db.get_value("Item Group", {"name": "Products"}, "name") or frappe.db.get_value(
			"Item Group", {"is_group": 0}, "name"
		)
		if not item_group:
			frappe.throw(_("Configure at least one Item Group before creating vehicle models."))
		frappe.get_doc(
			{
				"doctype": "Item",
				"item_code": item_code,
				"item_name": model_name,
				"item_group": item_group,
				"stock_uom": "Nos",
				"is_stock_item": 1,
				"is_sales_item": 1,
				"brand": brand,
			}
		).insert()

	if frappe.db.exists("Vehicle Model", item_code):
		return {
			"name": item_code,
			"label": frappe.db.get_value("Vehicle Model", item_code, "model_name") or item_code,
		}

	doc = frappe.get_doc(
		{
			"doctype": "Vehicle Model",
			"model": item_code,
			"model_code": model_code,
			"model_name": model_name,
			"brand": brand,
			"fuel_type": fuel_type,
			"transmission": transmission,
			"variant": variant,
			"is_active": 1,
		}
	)
	doc.insert()
	frappe.db.commit()
	return {"name": doc.name, "label": doc.model_name or doc.name}

