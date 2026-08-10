"""Master data list / get / update APIs for DMS SPA (items, services, prices)."""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint, flt


def _parse_data(data):
	if isinstance(data, str):
		data = json.loads(data)
	return data or {}


def _set_if_present(doc, data, fields):
	for field in fields:
		if field in data:
			doc.set(field, data[field])


def _meta_fields(doctype: str, candidates: list[str]) -> list[str]:
	meta = frappe.get_meta(doctype)
	return [f for f in candidates if meta.has_field(f)]


# ── Spare Parts (Spare Part + linked Item) ───────────────────────────────────


@frappe.whitelist()
def list_spare_parts(search=None, include_discontinued=0, limit=50, offset=0):
	frappe.has_permission("Spare Part", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0
	filters: dict = {}
	meta = frappe.get_meta("Spare Part")
	if meta.has_field("discontinued") and not cint(include_discontinued):
		filters["discontinued"] = 0

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

	fields = ["name"] + _meta_fields(
		"Spare Part",
		[
			"spare_part_item",
			"item_code",
			"item_name",
			"oem_part_number",
			"manufacturer_part_number",
			"part_category",
			"part_type",
			"bin_location",
			"selling_price",
			"wholesale_price",
			"markup_percentage",
			"minimum_stock_level",
			"reorder_quantity",
			"discontinued",
			"barcode",
		],
	)
	# de-dupe while keeping order
	seen = set()
	fields = [f for f in fields if not (f in seen or seen.add(f))]

	total = frappe.db.count("Spare Part", filters=filters or None) if not or_filters else None
	rows = frappe.get_all(
		"Spare Part",
		filters=filters or None,
		or_filters=or_filters,
		fields=fields,
		limit=limit,
		start=offset,
		order_by="item_name asc, modified desc",
	)

	if or_filters is not None:
		# Count with same search (approximate via get_all without limit)
		total = len(
			frappe.get_all(
				"Spare Part",
				filters=filters or None,
				or_filters=or_filters,
				pluck="name",
				limit=5000,
			)
		)

	return {"data": rows, "total": total or 0}


@frappe.whitelist()
def get_spare_part(name):
	frappe.has_permission("Spare Part", "read", throw=True)
	if not name or not frappe.db.exists("Spare Part", name):
		frappe.throw(_("Spare Part {0} not found.").format(name))

	sp = frappe.get_doc("Spare Part", name)
	sp.check_permission("read")
	out = sp.as_dict()

	item_code = sp.spare_part_item
	item = None
	if item_code and frappe.db.exists("Item", item_code):
		item = frappe.db.get_value(
			"Item",
			item_code,
			[
				"name",
				"item_code",
				"item_name",
				"item_group",
				"stock_uom",
				"description",
				"standard_rate",
				"valuation_rate",
				"disabled",
				"is_stock_item",
			],
			as_dict=True,
		)
	out["item"] = item

	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_default_selling_price_list,
	)

	price_list = get_dms_default_selling_price_list()
	item_price = None
	if item_code and price_list:
		item_price = frappe.db.get_value(
			"Item Price",
			{"item_code": item_code, "price_list": price_list, "selling": 1},
			["name", "price_list", "price_list_rate", "uom", "currency", "valid_from", "valid_upto"],
			as_dict=True,
		)
	out["item_price"] = item_price
	out["default_price_list"] = price_list
	return out


@frappe.whitelist()
def update_spare_part(name, data=None):
	"""Update Spare Part + linked Item fields; upsert selling Item Price when rate set."""
	data = _parse_data(data)
	if not name:
		frappe.throw(_("Spare Part name is required."))
	if not frappe.db.exists("Spare Part", name):
		frappe.throw(_("Spare Part {0} not found.").format(name))

	sp = frappe.get_doc("Spare Part", name)
	sp.check_permission("write")

	# Avoid rename side-effects when OEM (autoname field) is unchanged
	new_oem = (data.get("oem_part_number") or "").strip() if "oem_part_number" in data else None
	if new_oem is not None and new_oem == (sp.oem_part_number or ""):
		data = {k: v for k, v in data.items() if k != "oem_part_number"}

	sp_fields = _meta_fields(
		"Spare Part",
		[
			"oem_part_number",
			"manufacturer_part_number",
			"part_category",
			"part_type",
			"bin_location",
			"selling_price",
			"wholesale_price",
			"markup_percentage",
			"minimum_stock_level",
			"reorder_quantity",
			"discontinued",
			"barcode",
			"internal_notes",
		],
	)
	_set_if_present(sp, data, sp_fields)
	sp.save()

	item_code = sp.spare_part_item
	item_name = (data.get("item_name") or "").strip() if "item_name" in data else None
	if item_code and frappe.db.exists("Item", item_code):
		item = frappe.get_doc("Item", item_code)
		# Linked Item sync: user already passed Spare Part write check
		item_fields = ["description", "standard_rate", "disabled"]
		payload = dict(data)
		if "selling_price" in payload and "standard_rate" not in payload:
			payload["standard_rate"] = payload.get("selling_price")
		if "discontinued" in payload and "disabled" not in payload:
			payload["disabled"] = 1 if cint(payload.get("discontinued")) else 0
		if item_name:
			item.item_name = item_name
		_set_if_present(item, payload, item_fields)
		item.flags.ignore_permissions = True
		item.save(ignore_permissions=True)

		# Keep fetched Read Only item_name on Spare Part in sync
		if item_name:
			frappe.db.set_value("Spare Part", sp.name, "item_name", item_name, update_modified=False)

		selling = payload.get("selling_price")
		if selling is None:
			selling = payload.get("standard_rate")
		if selling is not None and flt(selling) > 0:
			from dms.dealer_management_system.utils.stock_operations import (
				upsert_dms_selling_item_price,
			)

			upsert_dms_selling_item_price(
				item_code,
				flt(selling),
				uom=item.stock_uom or "Nos",
			)

	frappe.db.commit()
	sp.reload()
	return {
		"name": sp.name,
		"item_code": sp.item_code,
		"item_name": sp.item_name or item_name,
		"selling_price": getattr(sp, "selling_price", None),
	}


# ── Vehicle Service Items ────────────────────────────────────────────────────


def _vsi_list_fields() -> list[str]:
	fields = ["name"] + _meta_fields(
		"Vehicle Service Item",
		[
			"service_item",
			"custom_erpnext_item",
			"custom_item_name",
			"custom_service_code",
			"custom_vehicle_model",
			"custom_category",
			"custom_frt",
			"custom_cat_code",
			"custom_sub_code",
			"custom_estimated_timehours",
			"custom_rate",
			"custom_description",
		],
	)
	seen = set()
	return [f for f in fields if not (f in seen or seen.add(f))]


@frappe.whitelist()
def list_vehicle_service_items(search=None, vehicle_model=None, limit=50, offset=0):
	frappe.has_permission("Vehicle Service Item", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0
	meta = frappe.get_meta("Vehicle Service Item")
	filters: dict = {}

	vehicle_model = (vehicle_model or "").strip()
	if vehicle_model and meta.has_field("custom_vehicle_model"):
		filters["custom_vehicle_model"] = vehicle_model

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		or_filters = [
			["name", "like", q],
			["service_item", "like", q],
		]
		for f in ("custom_item_name", "custom_service_code", "custom_erpnext_item", "custom_frt"):
			if meta.has_field(f):
				or_filters.append([f, "like", q])

	rows = frappe.get_all(
		"Vehicle Service Item",
		filters=filters or None,
		or_filters=or_filters,
		fields=_vsi_list_fields(),
		limit=limit,
		start=offset,
		order_by="service_item asc",
	)

	# Attach linked Item disabled flag for Enable/Disable actions
	item_codes = [r.get("custom_erpnext_item") for r in rows if r.get("custom_erpnext_item")]
	disabled_map = {}
	if item_codes:
		for it in frappe.get_all(
			"Item",
			filters={"name": ["in", item_codes]},
			fields=["name", "disabled"],
		):
			disabled_map[it.name] = cint(it.disabled)
	for r in rows:
		r["disabled"] = disabled_map.get(r.get("custom_erpnext_item") or "", 0)

	if or_filters:
		total = len(
			frappe.get_all(
				"Vehicle Service Item",
				filters=filters or None,
				or_filters=or_filters,
				pluck="name",
				limit=5000,
			)
		)
	else:
		total = frappe.db.count("Vehicle Service Item", filters=filters or None)

	return {"data": rows, "total": total or 0}


@frappe.whitelist()
def get_vehicle_service_item(name):
	frappe.has_permission("Vehicle Service Item", "read", throw=True)
	if not name or not frappe.db.exists("Vehicle Service Item", name):
		frappe.throw(_("Vehicle Service Item {0} not found.").format(name))

	doc = frappe.get_doc("Vehicle Service Item", name)
	doc.check_permission("read")
	out = doc.as_dict()

	erp_item = getattr(doc, "custom_erpnext_item", None)
	item_price = None
	if erp_item:
		from dms.dealer_management_system.utils.stock_operations import (
			get_dms_default_selling_price_list,
		)

		price_list = get_dms_default_selling_price_list()
		if price_list:
			item_price = frappe.db.get_value(
				"Item Price",
				{"item_code": erp_item, "price_list": price_list, "selling": 1},
				["name", "price_list", "price_list_rate", "uom", "currency"],
				as_dict=True,
			)
	out["item_price"] = item_price
	return out


@frappe.whitelist()
def update_vehicle_service_item(name, data=None):
	data = _parse_data(data)
	if not name:
		frappe.throw(_("Vehicle Service Item name is required."))
	if not frappe.db.exists("Vehicle Service Item", name):
		frappe.throw(_("Vehicle Service Item {0} not found.").format(name))

	doc = frappe.get_doc("Vehicle Service Item", name)
	doc.check_permission("write")

	fields = _meta_fields(
		"Vehicle Service Item",
		[
			"service_item",
			"custom_service_code",
			"custom_item_name",
			"custom_vehicle_model",
			"custom_category",
			"custom_frt",
			"custom_cat_code",
			"custom_sub_code",
			"custom_estimated_timehours",
			"custom_rate",
			"custom_description",
		],
	)
	_set_if_present(doc, data, fields)
	doc.save()

	erp_item = (getattr(doc, "custom_erpnext_item", None) or "").strip()
	if erp_item and frappe.db.exists("Item", erp_item):
		# Always keep linked labour Item name / description / rate in sync
		from dms.overrides.vehicle_service_item import sync_labour_erpnext_item_name

		sync_labour_erpnext_item_name(doc)

		item = frappe.get_doc("Item", erp_item)
		item.flags.ignore_permissions = True
		changed = False

		if "disabled" in data:
			item.disabled = cint(data.get("disabled"))
			changed = True

		if "custom_rate" in data and data.get("custom_rate") is not None:
			item.standard_rate = flt(data.get("custom_rate"))
			changed = True

		if "custom_description" in data:
			desc = (data.get("custom_description") or doc.service_item or item.item_name or "").strip()
			if desc and item.description != desc:
				item.description = desc[:3000]
				changed = True

		# Prefer explicit display name, then service_item
		display = (
			(data.get("custom_item_name") or "").strip()
			or (data.get("service_item") or "").strip()
			or (getattr(doc, "custom_item_name", None) or "").strip()
			or (doc.service_item or "").strip()
		)
		if display and item.item_name != display:
			item.item_name = display[:140]
			changed = True

		if changed:
			item.save(ignore_permissions=True)

		if "custom_rate" in data and flt(data.get("custom_rate")) > 0:
			from dms.dealer_management_system.utils.stock_operations import (
				upsert_dms_selling_item_price,
			)

			upsert_dms_selling_item_price(
				erp_item,
				flt(data.get("custom_rate")),
				uom=item.stock_uom or "Nos",
			)

	frappe.db.commit()
	return {
		"name": doc.name,
		"service_item": doc.service_item,
		"custom_item_name": getattr(doc, "custom_item_name", None),
		"custom_rate": getattr(doc, "custom_rate", None),
		"custom_erpnext_item": erp_item or None,
	}


# ── Item Prices ──────────────────────────────────────────────────────────────


@frappe.whitelist()
def list_item_prices(search=None, price_list=None, selling=1, limit=50, offset=0):
	frappe.has_permission("Item Price", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0
	filters: dict = {}

	if cint(selling):
		filters["selling"] = 1

	price_list = (price_list or "").strip()
	if not price_list:
		from dms.dealer_management_system.utils.stock_operations import (
			get_dms_default_selling_price_list,
		)

		price_list = get_dms_default_selling_price_list() or ""
	if price_list:
		filters["price_list"] = price_list

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		or_filters = [
			["item_code", "like", q],
			["name", "like", q],
		]

	fields = _meta_fields(
		"Item Price",
		[
			"name",
			"item_code",
			"item_name",
			"price_list",
			"price_list_rate",
			"currency",
			"uom",
			"selling",
			"buying",
			"valid_from",
			"valid_upto",
		],
	)
	if "name" not in fields:
		fields = ["name", "item_code", "price_list", "price_list_rate"] + [
			f for f in fields if f not in ("name", "item_code", "price_list", "price_list_rate")
		]

	rows = frappe.get_all(
		"Item Price",
		filters=filters or None,
		or_filters=or_filters,
		fields=fields,
		limit=limit,
		start=offset,
		order_by="item_code asc, modified desc",
	)

	if or_filters:
		total = len(
			frappe.get_all(
				"Item Price",
				filters=filters or None,
				or_filters=or_filters,
				pluck="name",
				limit=5000,
			)
		)
	else:
		total = frappe.db.count("Item Price", filters=filters or None)

	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_default_selling_price_list,
	)

	return {
		"data": rows,
		"total": total or 0,
		"default_price_list": get_dms_default_selling_price_list(),
	}


@frappe.whitelist()
def get_item_price(name):
	frappe.has_permission("Item Price", "read", throw=True)
	if not name or not frappe.db.exists("Item Price", name):
		frappe.throw(_("Item Price {0} not found.").format(name))
	doc = frappe.get_doc("Item Price", name)
	doc.check_permission("read")
	return doc.as_dict()


@frappe.whitelist()
def update_item_price(name, data=None):
	data = _parse_data(data)
	if not name:
		frappe.throw(_("Item Price name is required."))
	if not frappe.db.exists("Item Price", name):
		frappe.throw(_("Item Price {0} not found.").format(name))

	doc = frappe.get_doc("Item Price", name)
	doc.check_permission("write")

	updatable = [
		"price_list_rate",
		"uom",
		"valid_from",
		"valid_upto",
		"currency",
	]
	_set_if_present(doc, data, updatable)

	if "price_list_rate" in data and flt(data.get("price_list_rate")) < 0:
		frappe.throw(_("Price list rate cannot be negative."))

	doc.save()

	# Keep Spare Part / VSI custom_rate loosely in sync for selling prices
	if doc.selling and "price_list_rate" in data:
		rate = flt(data.get("price_list_rate"))
		sp_name = frappe.db.get_value("Spare Part", {"spare_part_item": doc.item_code}, "name")
		if sp_name and frappe.get_meta("Spare Part").has_field("selling_price"):
			frappe.db.set_value("Spare Part", sp_name, "selling_price", rate)
		if frappe.db.exists("Item", doc.item_code):
			frappe.db.set_value("Item", doc.item_code, "standard_rate", rate)
		vsi_name = frappe.db.get_value(
			"Vehicle Service Item", {"custom_erpnext_item": doc.item_code}, "name"
		)
		if vsi_name and frappe.get_meta("Vehicle Service Item").has_field("custom_rate"):
			frappe.db.set_value("Vehicle Service Item", vsi_name, "custom_rate", rate)

	frappe.db.commit()
	return {
		"name": doc.name,
		"item_code": doc.item_code,
		"price_list_rate": doc.price_list_rate,
	}


@frappe.whitelist()
def create_item_price(data=None):
	data = _parse_data(data)
	frappe.has_permission("Item Price", "create", throw=True)

	item_code = (data.get("item_code") or "").strip()
	if not item_code:
		frappe.throw(_("Item code is required."))
	if not frappe.db.exists("Item", item_code):
		frappe.throw(_("Item {0} not found.").format(item_code))

	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_default_selling_price_list,
		upsert_dms_selling_item_price,
	)

	price_list = (data.get("price_list") or "").strip() or get_dms_default_selling_price_list()
	if not price_list:
		frappe.throw(_("Price List is required. Configure a default selling price list in DMS Settings."))

	rate = flt(data.get("price_list_rate") or data.get("rate"))
	if rate <= 0:
		frappe.throw(_("Price list rate must be greater than zero."))

	uom = (data.get("uom") or "").strip() or frappe.db.get_value("Item", item_code, "stock_uom") or "Nos"
	name = upsert_dms_selling_item_price(item_code, rate, price_list=price_list, uom=uom)
	if not name:
		frappe.throw(_("Could not create Item Price."))

	# Apply optional validity windows
	doc = frappe.get_doc("Item Price", name)
	doc.check_permission("write")
	if data.get("valid_from"):
		doc.valid_from = data.get("valid_from")
	if data.get("valid_upto"):
		doc.valid_upto = data.get("valid_upto")
	doc.save()
	frappe.db.commit()
	return {"name": doc.name, "item_code": doc.item_code, "price_list_rate": doc.price_list_rate}


@frappe.whitelist()
def get_masters_options():
	"""Dropdown helpers for master edit forms."""
	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_default_selling_price_list,
	)

	price_lists = frappe.get_all(
		"Price List",
		filters={"enabled": 1, "selling": 1},
		fields=["name", "currency"],
		order_by="name asc",
		limit=100,
	)
	item_groups = frappe.get_all(
		"Item Group",
		filters={"is_group": 0},
		pluck="name",
		order_by="name asc",
		limit=100,
	)
	return {
		"price_lists": price_lists,
		"default_price_list": get_dms_default_selling_price_list(),
		"item_groups": item_groups,
	}
