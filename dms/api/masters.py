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


def _count(doctype: str, filters=None, or_filters=None) -> int:
	"""COUNT(*) that supports or_filters. frappe.db.count() does not."""
	if not or_filters:
		return frappe.db.count(doctype, filters=filters)
	from frappe.query_builder.functions import Count

	result = frappe.qb.get_query(
		table=doctype,
		filters=filters,
		or_filters=or_filters,
		fields=Count("*"),
		distinct=True,
	).run()
	return cint(result[0][0]) if result else 0


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
			"internal_notes",
		],
	)

	rows = frappe.get_all(
		"Spare Part",
		fields=fields,
		filters=filters or None,
		or_filters=or_filters,
		limit=limit,
		limit_start=offset,
		order_by="item_name asc",
	)
	total = _count("Spare Part", filters=filters or None, or_filters=or_filters)

	names = [r["name"] for r in rows]
	item_names = [
		r.get("spare_part_item") or r.get("item_code")
		for r in rows
		if r.get("spare_part_item") or r.get("item_code")
	]

	item_map: dict[str, dict] = {}
	if item_names:
		item_map = {
			it["name"]: it
			for it in frappe.get_all(
				"Item",
				filters={"name": ["in", item_names]},
				fields=[
					"name",
					"item_code",
					"item_name",
					"item_group",
					"stock_uom",
					"description",
					"standard_rate",
					"valuation_rate",
					"disabled",
				],
				limit=len(item_names),
			)
		}

	price_map: dict[str, dict] = {}
	if item_names:
		item_price_rows = frappe.get_all(
			"Item Price",
			filters={"price_list": "DMS Selling", "item_code": ["in", item_names]},
			fields=[
				"name",
				"item_code",
				"price_list",
				"price_list_rate",
				"uom",
				"currency",
				"valid_from",
				"valid_upto",
			],
			order_by="price_list_rate asc",
			limit=len(item_names) * 10,
		)
		for pr in item_price_rows:
			price_map.setdefault(pr["item_code"], pr)

	from dms.dealer_management_system.utils.stock_operations import get_dms_default_selling_price_list

	default_price_list = get_dms_default_selling_price_list()

	for r in rows:
		item_code = r.get("spare_part_item") or r.get("item_code")
		r["item"] = item_map.get(item_code) if item_code else None
		r["item_price"] = price_map.get(item_code) if item_code else None
		r["default_price_list"] = default_price_list

	return {"data": rows, "total": total, "default_price_list": default_price_list}


@frappe.whitelist()
def get_spare_part(name):
	frappe.has_permission("Spare Part", "read", throw=True)
	return frappe.get_doc("Spare Part", name).as_dict()


@frappe.whitelist()
def update_spare_part(name, data):
	if isinstance(data, str):
		data = json.loads(data)

	frappe.has_permission("Spare Part", "write", throw=True)
	doc = frappe.get_doc("Spare Part", name)
	from dms.dealer_management_system.utils.price_permissions import assert_price_allowed_if_changed

	if "selling_price" in data:
		assert_price_allowed_if_changed(doc.selling_price, data.get("selling_price"))
	if "wholesale_price" in data:
		assert_price_allowed_if_changed(doc.wholesale_price, data.get("wholesale_price"))
	if "markup_percentage" in data:
		assert_price_allowed_if_changed(doc.markup_percentage, data.get("markup_percentage"))

	allowed_fields = [
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
		"internal_notes",
	]
	meta = frappe.get_meta("Spare Part")
	fields = [f for f in allowed_fields if meta.has_field(f) and f in data]
	_set_if_present(doc, data, fields)
	doc.save(ignore_permissions=False)
	if "selling_price" in data and doc.spare_part_item:
		from dms.dealer_management_system.utils.stock_operations import (
			upsert_dms_selling_item_price,
		)

		upsert_dms_selling_item_price(doc.spare_part_item, flt(doc.selling_price))
	frappe.db.commit()
	return {"name": doc.name, "item_code": doc.spare_part_item, "item_name": doc.item_name}


# ── Vehicle Models ───────────────────────────────────────────────────────────

VEHICLE_MODEL_FUEL_TYPES = ("Petrol", "Diesel", "Hybrid", "PHEV", "EV", "CNG", "LPG")
VEHICLE_MODEL_TRANSMISSIONS = (
	"Manual (MT)",
	"Automatic (AT)",
	"CVT",
	"DCT",
	"AMT",
	"EV Single Speed",
)
VEHICLE_MODEL_DRIVE_TYPES = ("FWD", "RWD", "AWD", "4WD")

_VEHICLE_MODEL_LIST_FIELDS = [
	"model",
	"model_code",
	"model_name",
	"brand",
	"model_year",
	"variant",
	"fuel_type",
	"transmission",
	"drive_type",
	"engine_code",
	"is_active",
]

_VEHICLE_MODEL_EDITABLE_FIELDS = [
	"brand",
	"model_year",
	"variant",
	"fuel_type",
	"transmission",
	"drive_type",
	"engine_code",
	"is_active",
	"notes",
]


def _vehicle_model_list_fields() -> list[str]:
	return _meta_fields("Vehicle Model", _VEHICLE_MODEL_LIST_FIELDS)


def _attach_brand_labels(rows: list[dict]) -> None:
	"""Add `brand_label` to rows carrying a Brand link (one lookup for the page)."""
	brand_names = sorted({r["brand"] for r in rows if r.get("brand")})
	if not brand_names:
		return
	brand_map = {
		b["name"]: (b.get("brand") or b["name"])
		for b in frappe.get_all(
			"Brand",
			filters={"name": ["in", brand_names]},
			fields=["name", "brand"],
			limit=len(brand_names),
		)
	}
	for row in rows:
		if row.get("brand"):
			row["brand_label"] = brand_map.get(row["brand"], row["brand"])


def _vehicle_item_groups() -> list[str]:
	"""Leaf Item Groups flagged as vehicles (`Is Vehicle`) — valid Vehicle Model groups."""
	meta = frappe.get_meta("Item Group")
	if not meta.has_field("custom_is_vehicle"):
		# Older sites without the flag: every leaf group is selectable.
		return frappe.get_all("Item Group", filters={"is_group": 0}, pluck="name", order_by="name asc")
	return frappe.get_all(
		"Item Group",
		filters={"custom_is_vehicle": 1, "is_group": 0},
		pluck="name",
		order_by="name asc",
	)


def _validate_item_group(item_group: str | None) -> str:
	""":param item_group: Item Group the vehicle model's Item will be created under.

	Only Item Groups flagged `Is Vehicle` are accepted (masters screen contract).
	"""
	item_group = (item_group or "").strip()
	if not item_group:
		frappe.throw(_("Item Group is required for the vehicle model's Item."))
	if not frappe.db.exists("Item Group", item_group):
		frappe.throw(_("Item Group {0} was not found.").format(frappe.bold(item_group)))

	if frappe.get_meta("Item Group").has_field("custom_is_vehicle") and not cint(
		frappe.db.get_value("Item Group", item_group, "custom_is_vehicle")
	):
		frappe.throw(
			_("Item Group {0} is not a vehicle group. Tick 'Is Vehicle' on the Item Group first.").format(
				frappe.bold(item_group)
			)
		)
	return item_group


def _save_item_group(group, is_new: bool = False) -> None:
	"""Persist an Item Group, falling back to the vehicle-master right when denied."""
	action = group.insert if is_new else group.save
	try:
		action()
	except frappe.PermissionError:
		action(ignore_permissions=True)


def _resolve_item_group_parent(parent_item_group: str | None) -> str:
	parent = (parent_item_group or "").strip()
	if parent:
		if not frappe.db.exists("Item Group", parent):
			frappe.throw(_("Parent Item Group {0} was not found.").format(frappe.bold(parent)))
		if not cint(frappe.db.get_value("Item Group", parent, "is_group")):
			frappe.throw(_("Parent Item Group {0} is not a group.").format(frappe.bold(parent)))
		return parent

	# Root of the Item Group tree (ERPNext default), else the first group node.
	if cint(frappe.db.get_value("Item Group", "All Item Groups", "is_group")):
		return "All Item Groups"
	roots = frappe.get_all("Item Group", filters={"is_group": 1}, pluck="name", order_by="lft asc", limit=1)
	if not roots:
		frappe.throw(_("Create a parent Item Group before adding vehicle item groups."))
	return roots[0]


@frappe.whitelist()
def create_vehicle_item_group(item_group=None, parent_item_group=None):
	"""Create an Item Group for vehicle models — or flag an existing leaf group.

	The group always ends up with `Is Vehicle` (`custom_is_vehicle`) ticked, so it is
	offered in the Vehicle Model Item Group dropdown right away.
	"""
	frappe.has_permission("Vehicle Model", "create", throw=True)

	name = (item_group or "").strip()
	if not name:
		frappe.throw(_("Item Group name is required."))

	has_vehicle_flag = frappe.get_meta("Item Group").has_field("custom_is_vehicle")

	if frappe.db.exists("Item Group", name):
		if cint(frappe.db.get_value("Item Group", name, "is_group")):
			frappe.throw(
				_("{0} is a parent Item Group. Enter a name for a new group instead.").format(
					frappe.bold(name)
				)
			)
		group = frappe.get_doc("Item Group", name)
		flagged = cint(group.get("custom_is_vehicle")) if has_vehicle_flag else 0
		if has_vehicle_flag and not flagged:
			group.set("custom_is_vehicle", 1)
			_save_item_group(group)
			frappe.db.commit()
			flagged = 1
		return {"name": group.name, "created": 0, "is_vehicle": flagged}

	values = {
		"doctype": "Item Group",
		"item_group_name": name,
		"parent_item_group": _resolve_item_group_parent(parent_item_group),
		"is_group": 0,
	}
	if has_vehicle_flag:
		values["custom_is_vehicle"] = 1

	group = frappe.get_doc(values)
	_save_item_group(group, is_new=True)
	frappe.db.commit()
	return {"name": group.name, "created": 1, "is_vehicle": 1 if has_vehicle_flag else 0}


@frappe.whitelist()
def list_vehicle_models(search=None, active_filter=None, brand=None, limit=50, offset=0):
	"""Vehicle Model masters for the Master → Vehicle Models screen."""
	frappe.has_permission("Vehicle Model", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0

	meta = frappe.get_meta("Vehicle Model")
	filters: dict = {}

	status = (active_filter or "active").strip().lower()
	if status not in ("active", "all", "inactive"):
		status = "active"
	if status != "all" and meta.has_field("is_active"):
		filters["is_active"] = 1 if status == "active" else 0

	brand = (brand or "").strip()
	if brand and meta.has_field("brand"):
		filters["brand"] = brand

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		search_fields = _meta_fields(
			"Vehicle Model", ["model_name", "model_code", "variant", "model", "engine_code"]
		)
		or_filters = [[f, "like", q] for f in search_fields] or None

	fields = ["name", *_vehicle_model_list_fields()]

	rows = frappe.get_all(
		"Vehicle Model",
		fields=fields,
		filters=filters or None,
		or_filters=or_filters,
		limit=limit,
		limit_start=offset,
		order_by="model_name asc",
	)
	total = _count("Vehicle Model", filters=filters or None, or_filters=or_filters)
	_attach_brand_labels(rows)

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_vehicle_model(name):
	frappe.has_permission("Vehicle Model", "read", throw=True)

	name = (name or "").strip()
	if not name or not frappe.db.exists("Vehicle Model", name):
		frappe.throw(_("Vehicle Model {0} was not found.").format(frappe.bold(name or "?")))

	data = frappe.get_doc("Vehicle Model", name).as_dict()
	_attach_brand_labels([data])
	if data.get("model"):
		data["item_group"] = frappe.db.get_value("Item", data["model"], "item_group")
	return data


@frappe.whitelist()
def create_vehicle_model(data=None):
	"""Create a Vehicle Model master together with its vehicle Item.

	The Vehicle Model docname is its `model` link to an Item, so every model always
	creates a new Item (code = the entered model code, falling back to the model
	name) in the chosen vehicle Item Group.
	"""
	data = _parse_data(data)
	frappe.has_permission("Vehicle Model", "create", throw=True)

	model_name = (data.get("model_name") or "").strip()
	if not model_name:
		frappe.throw(_("Model name is required."))

	meta = frappe.get_meta("Vehicle Model")
	model_code = (data.get("model_code") or "").strip() or model_name
	item_code = (data.get("model") or "").strip() or model_code
	brand = (data.get("brand") or "").strip() or None
	item_group = _validate_item_group(data.get("item_group"))

	if meta.has_field("model_code"):
		clash = frappe.db.get_value("Vehicle Model", {"model_code": model_code}, "name")
		if clash:
			frappe.throw(
				_("Vehicle Model {0} already uses model code {1}.").format(
					frappe.bold(clash), frappe.bold(model_code)
				)
			)

	# A Vehicle Model always brings its own Item into existence: the model's
	# docname *is* that Item, so an existing code cannot be reused here.
	if frappe.db.exists("Item", item_code):
		frappe.throw(
			_(
				"Item {0} already exists. Use a different Model code — the model code becomes the Item code."
			).format(frappe.bold(item_code))
		)

	item_doc = frappe.get_doc(
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
	)
	try:
		item_doc.insert()
	except frappe.PermissionError:
		# Creating the model was already authorised above; the Item is its backing
		# record, so roles without Item create are not blocked a second time.
		item_doc.insert(ignore_permissions=True)

	values: dict = {
		"doctype": "Vehicle Model",
		"model": item_code,
		"model_name": model_name,
		"fuel_type": (data.get("fuel_type") or "").strip() or VEHICLE_MODEL_FUEL_TYPES[0],
		"transmission": (data.get("transmission") or "").strip() or VEHICLE_MODEL_TRANSMISSIONS[1],
		"is_active": cint(data.get("is_active", 1)),
	}
	if meta.has_field("model_code"):
		values["model_code"] = model_code
	if brand and meta.has_field("brand"):
		values["brand"] = brand
	for fieldname in ("variant", "drive_type", "engine_code", "model_year", "notes"):
		if not meta.has_field(fieldname):
			continue
		value = data.get(fieldname)
		if value in (None, ""):
			continue
		values[fieldname] = cint(value) if fieldname == "model_year" else value

	doc = frappe.get_doc(values)
	doc.insert(ignore_permissions=False)
	frappe.db.commit()
	return {
		"name": doc.name,
		"label": doc.model_name or doc.name,
		"item_code": item_code,
		"item_group": item_group,
	}


@frappe.whitelist()
def update_vehicle_model(name, data):
	"""Update a Vehicle Model master (the linked Item / docname stays unchanged)."""
	data = _parse_data(data)
	frappe.has_permission("Vehicle Model", "write", throw=True)

	doc = frappe.get_doc("Vehicle Model", name)
	meta = frappe.get_meta("Vehicle Model")

	if "model_name" in data:
		model_name = (data.get("model_name") or "").strip()
		if not model_name:
			frappe.throw(_("Model name is required."))
		doc.model_name = model_name

	if "model_code" in data and meta.has_field("model_code"):
		model_code = (data.get("model_code") or "").strip()
		if model_code and model_code != doc.get("model_code"):
			clash = frappe.db.get_value(
				"Vehicle Model", {"model_code": model_code, "name": ["!=", doc.name]}, "name"
			)
			if clash:
				frappe.throw(
					_("Vehicle Model {0} already uses model code {1}.").format(
						frappe.bold(clash), frappe.bold(model_code)
					)
				)
			doc.model_code = model_code

	for fieldname in _VEHICLE_MODEL_EDITABLE_FIELDS:
		if fieldname not in data or not meta.has_field(fieldname):
			continue
		value = data.get(fieldname)
		if fieldname in ("model_year", "is_active"):
			value = cint(value)
		elif fieldname == "brand":
			value = (value or "").strip() or None
		doc.set(fieldname, value)

	doc.save(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "label": doc.model_name or doc.name}


# ── Vehicle Service Items ────────────────────────────────────────────────────


@frappe.whitelist()
def list_vehicle_service_items(search=None, vehicle_model=None, limit=50, offset=0, active_filter=None):
	frappe.has_permission("Vehicle Service Item", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0
	filters: dict = {}
	meta = frappe.get_meta("Vehicle Service Item")
	status = (active_filter or "active").strip().lower()
	if status not in ("active", "all", "inactive"):
		status = "active"
	if status != "all":
		if meta.has_field("custom_active"):
			filters["custom_active"] = 1 if status == "active" else 0
		elif meta.has_field("disabled"):
			filters["disabled"] = 0 if status == "active" else 1

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		search_fields = _meta_fields(
			"Vehicle Service Item",
			["service_item", "custom_item_name", "custom_service_code"],
		)
		or_filters = [[f, "like", q] for f in search_fields] or None

	if vehicle_model and meta.has_field("custom_vehicle_model"):
		filters["custom_vehicle_model"] = vehicle_model

	fields = _meta_fields(
		"Vehicle Service Item",
		[
			"name",
			"service_item",
			"custom_item_name",
			"custom_vehicle_model",
			"custom_category",
			"custom_estimated_timehours",
			"custom_description",
			"disabled",
			"custom_active",
			"custom_erpnext_item",
			"custom_service_code",
			"custom_frt",
			"custom_cat_code",
			"custom_sub_code",
			"custom_rate",
		],
	)
	if "name" not in fields:
		fields.insert(0, "name")

	rows = frappe.get_all(
		"Vehicle Service Item",
		fields=fields,
		filters=filters or None,
		or_filters=or_filters,
		limit=limit,
		limit_start=offset,
		order_by="service_item asc",
	)
	total = _count("Vehicle Service Item", filters=filters or None, or_filters=or_filters)

	item_codes = [r.get("custom_erpnext_item") for r in rows if r.get("custom_erpnext_item")]
	item_map: dict[str, dict] = {}
	if item_codes:
		item_map = {
			it["name"]: it
			for it in frappe.get_all(
				"Item",
				filters={"name": ["in", item_codes]},
				fields=[
					"name",
					"item_code",
					"item_name",
					"item_group",
					"stock_uom",
					"description",
					"standard_rate",
					"valuation_rate",
					"disabled",
				],
				limit=len(item_codes),
			)
		}

	price_map: dict[str, dict] = {}
	if item_codes:
		item_price_rows = frappe.get_all(
			"Item Price",
			filters={"price_list": "DMS Selling", "item_code": ["in", item_codes]},
			fields=[
				"name",
				"item_code",
				"price_list",
				"price_list_rate",
				"uom",
				"currency",
				"valid_from",
				"valid_upto",
			],
			order_by="price_list_rate asc",
			limit=len(item_codes) * 10,
		)
		for pr in item_price_rows:
			price_map.setdefault(pr["item_code"], pr)

	for r in rows:
		r["item_price"] = (
			price_map.get(r.get("custom_erpnext_item")) if r.get("custom_erpnext_item") else None
		)

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_vehicle_service_item(name):
	frappe.has_permission("Vehicle Service Item", "read", throw=True)
	return frappe.get_doc("Vehicle Service Item", name).as_dict()


@frappe.whitelist()
def create_vehicle_service_items(data=None):
	"""Create one Vehicle Service Item per vehicle model, sharing name and details.

	Service codes are combined with each model's `model_code` when the entered
	code does not already include it (TYP + GTY/FGT → GTYTYP, FGTTYP).
	"""
	data = _parse_data(data)
	frappe.has_permission("Vehicle Service Item", "create", throw=True)

	rate = data.get("custom_rate")
	if rate not in (None, ""):
		from dms.dealer_management_system.utils.price_permissions import assert_price_allowed_if_changed

		assert_price_allowed_if_changed(None, rate)

	return _insert_vehicle_service_item_docs(data)


@frappe.whitelist()
def add_vehicle_service_item_models(name, vehicle_models=None):
	"""Clone a Vehicle Service Item onto other models using the original code suffix.

	GTYTYP on GTY + new model FGT → FGTTYP. Name, rate, FRT, and other details are copied.
	"""
	frappe.has_permission("Vehicle Service Item", "create", throw=True)
	if not name or not frappe.db.exists("Vehicle Service Item", name):
		frappe.throw(_("Vehicle Service Item {0} was not found.").format(frappe.bold(name or "")))

	from dms.overrides.vehicle_service_item import service_code_suffix

	source = frappe.get_doc("Vehicle Service Item", name)
	models = [m for m in _normalize_vehicle_models({"vehicle_models": vehicle_models}) if m]
	if not models:
		frappe.throw(_("Select at least one vehicle model."))

	source_model = (source.get("custom_vehicle_model") or "").strip()
	if source_model:
		models = [m for m in models if m != source_model]
		if not models:
			frappe.throw(_("That vehicle model already has this service item."))

	source_model_code = ""
	if source_model and frappe.db.exists("Vehicle Model", source_model):
		source_model_code = (frappe.db.get_value("Vehicle Model", source_model, "model_code") or "").strip()

	entered_code = service_code_suffix(source.get("custom_service_code") or "", source_model_code)
	if not entered_code:
		cat = (source.get("custom_cat_code") or "").strip().upper()
		sub = (source.get("custom_sub_code") or "").strip()
		entered_code = f"{cat}{sub}"
	if not entered_code:
		frappe.throw(_("This service item has no service code to copy."))

	display_name = (
		(source.get("custom_item_name") or "").strip()
		or (source.get("service_item") or "").strip()
		or source.name
	)
	payload = {
		"service_item": display_name,
		"custom_item_name": display_name,
		"custom_service_code": entered_code,
		"vehicle_models": models,
		"service_type": source.get("service_type"),
		"custom_category": source.get("custom_category"),
		"custom_frt": source.get("custom_frt"),
		"custom_cat_code": source.get("custom_cat_code"),
		"custom_sub_code": source.get("custom_sub_code"),
		"custom_estimated_timehours": source.get("custom_estimated_timehours"),
		"custom_rate": source.get("custom_rate"),
		"custom_description": source.get("custom_description"),
		"custom_active": source.get("custom_active") if source.meta.has_field("custom_active") else 1,
	}
	return _insert_vehicle_service_item_docs(payload, require_model_code=True)


def _insert_vehicle_service_item_docs(data: dict, require_model_code: bool = False):
	from dms.overrides.vehicle_service_item import combine_service_code, unique_service_item_name

	service_item = (data.get("service_item") or "").strip()
	if not service_item:
		frappe.throw(_("Service Item name is required"))

	vehicle_models = _normalize_vehicle_models(data)
	entered_code = (data.get("custom_service_code") or data.get("service_code") or "").strip()
	if (len(vehicle_models) > 1 or require_model_code) and not entered_code:
		frappe.throw(_("Service Code is required when creating for multiple vehicle models."))

	combine_with_model = data.get("combine_with_model")
	if combine_with_model is None:
		combiner = combine_service_code
	elif cint(combine_with_model):
		combiner = combine_service_code
	else:
		combiner = lambda entered, _model: (entered or "").strip().upper()

	specs = _service_item_create_specs(
		vehicle_models, entered_code, combiner, require_model_code=require_model_code
	)
	_assert_service_codes_available([spec["service_code"] for spec in specs if spec["service_code"]])

	meta = frappe.get_meta("Vehicle Service Item")
	shared = _shared_service_item_values(data, meta)
	created: list[dict] = []

	try:
		for spec in specs:
			values = dict(shared)
			item_name = unique_service_item_name(service_item, spec["service_code"])
			values["service_item"] = item_name
			if meta.has_field("custom_item_name") and not values.get("custom_item_name"):
				values["custom_item_name"] = service_item
			if meta.has_field("custom_service_code") and spec["service_code"]:
				values["custom_service_code"] = spec["service_code"]
			if meta.has_field("custom_vehicle_model") and spec["vehicle_model"]:
				values["custom_vehicle_model"] = spec["vehicle_model"]

			doc = frappe.get_doc({"doctype": "Vehicle Service Item", **values})
			doc.insert(ignore_permissions=False)
			created.append(
				{
					"name": doc.name,
					"service_item": doc.service_item,
					"custom_service_code": doc.get("custom_service_code"),
					"custom_vehicle_model": doc.get("custom_vehicle_model"),
				}
			)
	except Exception:
		frappe.db.rollback()
		raise

	frappe.db.commit()
	return {
		"created": created,
		"count": len(created),
		"name": created[0]["name"] if created else None,
		"suffix": entered_code,
	}


def _normalize_vehicle_models(data: dict) -> list[str]:
	raw = data.get("vehicle_models")
	if raw in (None, ""):
		single = (data.get("custom_vehicle_model") or data.get("vehicle_model") or "").strip()
		return [single] if single else [""]
	if isinstance(raw, str):
		try:
			raw = json.loads(raw)
		except (TypeError, ValueError):
			raw = [part.strip() for part in raw.split(",") if part.strip()]
	if not isinstance(raw, (list, tuple)):
		raw = [raw]
	seen: set[str] = set()
	out: list[str] = []
	for value in raw:
		name = (value or "").strip() if isinstance(value, str) else str(value or "").strip()
		if not name or name in seen:
			continue
		seen.add(name)
		out.append(name)
	return out or [""]


def _service_item_create_specs(
	vehicle_models: list[str], entered_code: str, combine, require_model_code: bool = False
) -> list[dict]:
	specs: list[dict] = []
	for model_name in vehicle_models:
		model_code = ""
		if model_name:
			if not frappe.db.exists("Vehicle Model", model_name):
				frappe.throw(_("Vehicle Model {0} was not found.").format(frappe.bold(model_name)))
			model_code = (frappe.db.get_value("Vehicle Model", model_name, "model_code") or "").strip()
			if (require_model_code or len(vehicle_models) > 1) and not model_code:
				frappe.throw(
					_(
						"Vehicle Model {0} has no model code, so a combined service code cannot be built."
					).format(frappe.bold(model_name))
				)
		specs.append(
			{
				"vehicle_model": model_name,
				"model_code": model_code,
				"service_code": combine(entered_code, model_code),
			}
		)
	return specs


def _assert_service_codes_available(codes: list[str]) -> None:
	unique_codes = [c for c in dict.fromkeys(codes) if c]
	if len(unique_codes) != len([c for c in codes if c]):
		frappe.throw(_("Selected vehicle models produced duplicate service codes. Check model codes."))
	if not unique_codes:
		return
	existing = frappe.get_all(
		"Vehicle Service Item",
		filters={"custom_service_code": ["in", unique_codes]},
		pluck="custom_service_code",
	)
	if existing:
		frappe.throw(
			_("Service code already exists: {0}").format(", ".join(sorted(set(existing)))),
		)


def _shared_service_item_values(data: dict, meta) -> dict:
	optional = [
		"service_type",
		"custom_item_name",
		"custom_category",
		"custom_frt",
		"custom_cat_code",
		"custom_sub_code",
		"custom_estimated_timehours",
		"custom_rate",
		"custom_description",
		"custom_active",
	]
	values: dict = {}
	for field in optional:
		if field not in data or not meta.has_field(field):
			continue
		value = data.get(field)
		if value in (None, ""):
			continue
		values[field] = value
	if meta.has_field("custom_active") and "custom_active" not in values:
		values["custom_active"] = 1
	return values


@frappe.whitelist()
def update_vehicle_service_item(name, data):
	if isinstance(data, str):
		data = json.loads(data)

	frappe.has_permission("Vehicle Service Item", "write", throw=True)
	doc = frappe.get_doc("Vehicle Service Item", name)
	from dms.dealer_management_system.utils.price_permissions import assert_price_allowed_if_changed

	if "custom_rate" in data:
		assert_price_allowed_if_changed(getattr(doc, "custom_rate", None), data.get("custom_rate"))

	allowed_fields = [
		"custom_item_name",
		"custom_service_code",
		"custom_category",
		"custom_estimated_timehours",
		"custom_rate",
		"custom_description",
		"custom_frt",
		"custom_cat_code",
		"custom_sub_code",
		"disabled",
		"custom_active",
	]
	meta = frappe.get_meta("Vehicle Service Item")
	fields = [f for f in allowed_fields if meta.has_field(f) and f in data]
	_set_if_present(doc, data, fields)
	doc.save(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "service_item": doc.service_item, "custom_rate": doc.custom_rate}


# ── Vehicle Service Items: bulk update by service name ───────────────────────


def _vehicle_service_item_name_field() -> str:
	"""Field that holds the service name (codes differ per model)."""
	meta = frappe.get_meta("Vehicle Service Item")
	return "service_item" if meta.has_field("service_item") else "custom_item_name"


def _vehicle_service_item_name_match(name: str, meta) -> dict:
	"""Rows sharing a service name — matched on both name-bearing fields."""
	fields = [_vehicle_service_item_name_field()]
	if "custom_item_name" not in fields and meta.has_field("custom_item_name"):
		fields.append("custom_item_name")
	return {field: name for field in fields}


@frappe.whitelist()
def list_vehicle_service_item_names(search=None, limit=100):
	"""Distinct Vehicle Service Item names + how many codes each name covers."""
	frappe.has_permission("Vehicle Service Item", "read", throw=True)

	limit = cint(limit) or 100
	name_field = _vehicle_service_item_name_field()

	where = [f"ifnull(`{name_field}`, '') != ''"]
	params: dict = {"limit": limit}
	if search and str(search).strip():
		where.append(f"`{name_field}` like %(query)s")
		params["query"] = f"%{search.strip()}%"
	condition = " and ".join(where)

	rows = frappe.db.sql(
		f"""
		select `{name_field}` as service_item, count(*) as code_count
		from `tabVehicle Service Item`
		where {condition}
		group by `{name_field}`
		order by `{name_field}` asc
		limit %(limit)s
		""",
		params,
		as_dict=True,
	)
	total = frappe.db.sql(
		f"""
		select count(distinct `{name_field}`)
		from `tabVehicle Service Item`
		where {condition}
		""",
		params,
	)[0][0]

	return {"data": rows, "total": cint(total)}


@frappe.whitelist()
def bulk_update_vehicle_service_items(service_item=None, hours=None, rate=None):
	"""Set hours and/or rate on every Vehicle Service Item sharing a service name.

	One service name owns a code per vehicle model, so the screen batches the whole
	name by its codes instead of editing row by row.
	"""
	frappe.has_permission("Vehicle Service Item", "write", throw=True)

	name = (service_item or "").strip()
	if not name:
		frappe.throw(_("Vehicle Service Item name is required."))

	hours_value = flt(hours) if hours not in (None, "") else None
	rate_value = flt(rate) if rate not in (None, "") else None
	if hours_value is None and rate_value is None:
		frappe.throw(_("Enter hours, rate, or both."))

	meta = frappe.get_meta("Vehicle Service Item")
	names = frappe.get_all(
		"Vehicle Service Item",
		or_filters=_vehicle_service_item_name_match(name, meta),
		pluck="name",
		limit=0,
	)
	if not names:
		frappe.throw(_("No Vehicle Service Item found for {0}.").format(frappe.bold(name)))

	from dms.dealer_management_system.utils.price_permissions import assert_price_allowed_if_changed

	updated: list[dict] = []
	try:
		for doc_name in names:
			doc = frappe.get_doc("Vehicle Service Item", doc_name)
			if rate_value is not None:
				assert_price_allowed_if_changed(getattr(doc, "custom_rate", None), rate_value)
			if hours_value is not None and meta.has_field("custom_estimated_timehours"):
				doc.set("custom_estimated_timehours", hours_value)
			if rate_value is not None and meta.has_field("custom_rate"):
				doc.set("custom_rate", rate_value)
			doc.save(ignore_permissions=False)
			updated.append({"name": doc.name, "custom_service_code": doc.get("custom_service_code")})
	except Exception:
		frappe.db.rollback()
		raise

	frappe.db.commit()
	return {
		"service_item": name,
		"updated": len(updated),
		"codes": [row["custom_service_code"] for row in updated if row.get("custom_service_code")],
		"hours": hours_value,
		"rate": rate_value,
	}


# ── Item Prices ──────────────────────────────────────────────────────────────


def _assert_item_uom_valid(item_code: str, uom: str | None) -> None:
	"""Reject a UOM the Item does not have (ERPNext would throw a cryptic error).

	Item Price rows must use the Item's stock UOM or a UOM configured in the
	Item's UOM Conversion Detail table; anything else is refused by ERPNext with
	"UOM {0} not found in Item {1}".
	"""
	requested = (uom or "").strip()
	if not requested:
		return

	from dms.dealer_management_system.utils.stock_operations import (
		get_item_uoms_for_ui,
		resolve_item_uom,
	)

	if resolve_item_uom(item_code, requested) == requested:
		return

	valid_uoms = [row.get("value") for row in (get_item_uoms_for_ui(item_code).get("uoms") or [])]
	frappe.throw(
		_("UOM {0} is not configured for Item {1}. Use one of: {2}.").format(
			frappe.bold(requested),
			frappe.bold(item_code),
			frappe.bold(", ".join(valid_uoms) or "-"),
		)
	)


@frappe.whitelist()
def list_item_prices(search=None, price_list=None, selling=1, limit=50, offset=0):
	frappe.has_permission("Item Price", "read", throw=True)

	from dms.utils.spare_part_auto_create import get_aftersales_spare_part_item_codes

	limit = cint(limit) or 50
	offset = cint(offset) or 0
	item_codes = get_aftersales_spare_part_item_codes()
	if not item_codes:
		return {"data": [], "total": 0}

	filters: dict = {"item_code": ["in", item_codes]}
	if selling:
		filters["selling"] = 1
	if price_list and str(price_list).strip():
		filters["price_list"] = price_list

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		or_filters = [
			["item_code", "like", q],
			["item_name", "like", q],
		]

	rows = frappe.get_all(
		"Item Price",
		fields=[
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
		filters=filters,
		or_filters=or_filters,
		limit=limit,
		limit_start=offset,
		order_by="item_code asc",
	)
	total = _count("Item Price", filters=filters, or_filters=or_filters)

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_item_price(name):
	frappe.has_permission("Item Price", "read", throw=True)
	return frappe.get_doc("Item Price", name).as_dict()


@frappe.whitelist()
def update_item_price(name, data):
	if isinstance(data, str):
		data = json.loads(data)

	frappe.has_permission("Item Price", "write", throw=True)
	doc = frappe.get_doc("Item Price", name)
	from dms.dealer_management_system.utils.price_permissions import assert_price_allowed_if_changed

	if "price_list_rate" in data:
		assert_price_allowed_if_changed(doc.price_list_rate, data.get("price_list_rate"))

	allowed_fields = ["item_code", "price_list", "price_list_rate", "uom", "valid_from", "valid_upto"]
	meta = frappe.get_meta("Item Price")
	fields = [f for f in allowed_fields if meta.has_field(f) and f in data]
	if "uom" in fields:
		_assert_item_uom_valid(data.get("item_code") or doc.item_code, data.get("uom"))
	_set_if_present(doc, data, fields)
	doc.save(ignore_permissions=False)
	from dms.dealer_management_system.utils.stock_operations import (
		sync_spare_part_price_from_item_price,
	)

	sync_spare_part_price_from_item_price(doc.item_code, doc.price_list_rate)
	frappe.db.commit()
	return {"name": doc.name, "item_code": doc.item_code, "price_list_rate": doc.price_list_rate}


@frappe.whitelist()
def create_item_price(data):
	if isinstance(data, str):
		data = json.loads(data)

	frappe.has_permission("Item Price", "create", throw=True)
	from dms.dealer_management_system.utils.price_permissions import require_edit_price

	require_edit_price()

	item_code = (data.get("item_code") or "").strip()
	if not item_code:
		frappe.throw(_("Item Code is required."))

	from dms.utils.spare_part_auto_create import item_is_aftersales_spare_part

	if not item_is_aftersales_spare_part(item_code):
		frappe.throw(
			_(
				"Item Price can only be created for items whose Item Group has "
				"Is Vehicle or Auto Generate Spare Parts (or both)."
			)
		)

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

	uom = (data.get("uom") or "").strip()
	_assert_item_uom_valid(item_code, uom)
	name = upsert_dms_selling_item_price(item_code, rate, price_list=price_list, uom=uom or None)
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


# ── DMS Job Card Terms ───────────────────────────────────────────────────────


def _job_card_terms_list(search=None, limit=100, offset=0):
	"""List DMS Job Card Terms records."""
	filters = {}
	if search:
		filters["title"] = ["like", f"%{search}%"]

	total = len(
		frappe.get_all("DMS Job Card Terms", filters=filters or None, pluck="name", limit_page_length=0)
	)
	rows = frappe.get_all(
		"DMS Job Card Terms",
		filters=filters or None,
		fields=["name", "title", "default", "terms_and_conditions"],
		limit=int(limit) or 100,
		limit_start=int(offset) or 0,
		order_by="title asc",
	)
	return {"data": rows, "total": total}


@frappe.whitelist()
def list_job_card_terms(search=None, limit=100, offset=0):
	"""Master list for DMS Job Card Terms."""
	frappe.has_permission("DMS Job Card Terms", "read", throw=True)
	return _job_card_terms_list(search=search, limit=limit, offset=offset)


@frappe.whitelist()
def create_job_card_terms(data):
	"""Create a DMS Job Card Terms record."""
	if isinstance(data, str):
		import json

		data = json.loads(data)

	frappe.has_permission("DMS Job Card Terms", "create", throw=True)

	title = (data.get("title") or "").strip()
	if not title:
		frappe.throw(_("Title is required."))

	doc = frappe.new_doc("DMS Job Card Terms")
	doc.title = title
	doc.terms_and_conditions = data.get("terms_and_conditions") or ""
	doc.default = 1 if data.get("default") else 0
	doc.insert(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "title": doc.title}


@frappe.whitelist()
def update_job_card_terms(name, data):
	"""Update a DMS Job Card Terms record."""
	if isinstance(data, str):
		import json

		data = json.loads(data)

	frappe.has_permission("DMS Job Card Terms", "write", throw=True)

	doc = frappe.get_doc("DMS Job Card Terms", name)
	if "title" in data and (data.get("title") or "").strip():
		doc.title = (data.get("title") or "").strip()
	if "terms_and_conditions" in data:
		doc.terms_and_conditions = data.get("terms_and_conditions") or ""
	if "default" in data:
		doc.default = 1 if data.get("default") else 0
	doc.save(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "title": doc.title}


@frappe.whitelist()
def delete_job_card_terms(name):
	"""Delete a DMS Job Card Terms record."""
	doc = frappe.get_doc("DMS Job Card Terms", name)
	doc.check_permission("delete")
	doc.delete()
	frappe.db.commit()
	return {"name": name}


# ── DMS Sales Invoice TC ─────────────────────────────────────────────────────


def _sales_invoice_tc_list(search=None, limit=100, offset=0):
	"""List DMS Sales Invoice TC records."""
	filters = {}
	if search:
		filters["title"] = ["like", f"%{search}%"]

	total = len(
		frappe.get_all("DMS Sales Invoice TC", filters=filters or None, pluck="name", limit_page_length=0)
	)
	rows = frappe.get_all(
		"DMS Sales Invoice TC",
		filters=filters or None,
		fields=["name", "title", "default", "terms_and_conditions"],
		limit=int(limit) or 100,
		limit_start=int(offset) or 0,
		order_by="title asc",
	)
	return {"data": rows, "total": total}


@frappe.whitelist()
def list_sales_invoice_tc(search=None, limit=100, offset=0):
	"""Master list for DMS Sales Invoice TC."""
	frappe.has_permission("DMS Sales Invoice TC", "read", throw=True)
	return _sales_invoice_tc_list(search=search, limit=limit, offset=offset)


@frappe.whitelist()
def create_sales_invoice_tc(data):
	"""Create a DMS Sales Invoice TC record."""
	if isinstance(data, str):
		import json

		data = json.loads(data)

	frappe.has_permission("DMS Sales Invoice TC", "create", throw=True)

	title = (data.get("title") or "").strip()
	if not title:
		frappe.throw(_("Title is required."))

	doc = frappe.new_doc("DMS Sales Invoice TC")
	doc.title = title
	doc.terms_and_conditions = data.get("terms_and_conditions") or ""
	doc.default = 1 if data.get("default") else 0
	doc.insert(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "title": doc.title}


@frappe.whitelist()
def update_sales_invoice_tc(name, data):
	"""Update a DMS Sales Invoice TC record."""
	if isinstance(data, str):
		import json

		data = json.loads(data)

	frappe.has_permission("DMS Sales Invoice TC", "write", throw=True)

	doc = frappe.get_doc("DMS Sales Invoice TC", name)
	if "title" in data and (data.get("title") or "").strip():
		doc.title = (data.get("title") or "").strip()
	if "terms_and_conditions" in data:
		doc.terms_and_conditions = data.get("terms_and_conditions") or ""
	if "default" in data:
		doc.default = 1 if data.get("default") else 0
	doc.save(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "title": doc.title}


@frappe.whitelist()
def delete_sales_invoice_tc(name):
	"""Delete a DMS Sales Invoice TC record."""
	doc = frappe.get_doc("DMS Sales Invoice TC", name)
	doc.check_permission("delete")
	doc.delete()
	frappe.db.commit()
	return {"name": name}


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
	brands = frappe.get_all(
		"Brand",
		fields=["name", "brand"],
		order_by="name asc",
		limit=200,
	)
	return {
		"price_lists": price_lists,
		"default_price_list": get_dms_default_selling_price_list(),
		"item_groups": item_groups,
		"vehicle_item_groups": _vehicle_item_groups(),
		"brands": [{"name": b["name"], "brand": b["brand"] or b["name"]} for b in brands],
		"vehicle_model_fuel_types": list(VEHICLE_MODEL_FUEL_TYPES),
		"vehicle_model_transmissions": list(VEHICLE_MODEL_TRANSMISSIONS),
		"vehicle_model_drive_types": list(VEHICLE_MODEL_DRIVE_TYPES),
	}


# ── Vehicle Service Packages ─────────────────────────────────────────────────


def _package_vehicle_models(data: dict) -> list[dict]:
	"""Normalise `applicable_vehicle_models` into Package Vehicle Model rows."""
	raw = data.get("applicable_vehicle_models")
	if isinstance(raw, str):
		try:
			raw = json.loads(raw)
		except (TypeError, ValueError):
			raw = [raw]

	models: list[dict] = []
	seen: set[str] = set()
	for entry in raw or []:
		model = entry.get("vehicle_model") if isinstance(entry, dict) else entry
		model = (model or "").strip() if isinstance(model, str) else ""
		if not model or model in seen:
			continue
		seen.add(model)
		models.append({"vehicle_model": model})
	return models


def _package_labour_rows(data: dict) -> tuple[list[dict], float]:
	"""Normalise labour rows; return the rows and their total hours."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		vehicle_service_item_estimated_hours,
	)

	raw = data.get("labor_operations") or []
	if isinstance(raw, str):
		try:
			raw = json.loads(raw)
		except (TypeError, ValueError):
			raw = []

	rows: list[dict] = []
	total_hours = 0.0
	for entry in raw:
		if not isinstance(entry, dict):
			continue

		service_item = (entry.get("labor_operation") or "").strip()
		if not service_item:
			continue

		quantity = flt(entry.get("quantity")) or 1
		standard_hours = flt(entry.get("standard_hours")) or vehicle_service_item_estimated_hours(
			service_item
		)
		hours = flt(entry.get("total_hours")) or (quantity * standard_hours)
		total_hours += hours

		rows.append(
			{
				"labor_operation": service_item,
				"operation_name": (entry.get("operation_name") or "").strip(),
				"standard_hours": standard_hours,
				"quantity": quantity,
				"total_hours": hours,
				"notes": entry.get("notes") or "",
			}
		)

	return rows, total_hours


def _package_part_rows(data: dict) -> list[dict]:
	"""Normalise parts rows; blank unit prices fall back to the Spare Part rate."""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		spare_part_default_selling_price,
	)

	raw = data.get("parts_included") or []
	if isinstance(raw, str):
		try:
			raw = json.loads(raw)
		except (TypeError, ValueError):
			raw = []

	rows: list[dict] = []
	for entry in raw:
		if not isinstance(entry, dict):
			continue

		part = (entry.get("part_item") or "").strip()
		if not part:
			continue

		quantity = flt(entry.get("quantity")) or 1
		unit_price = flt(entry.get("unit_price")) or flt(spare_part_default_selling_price(part))
		rows.append(
			{
				"part_item": part,
				"part_name": (entry.get("part_name") or "").strip(),
				"quantity": quantity,
				"unit_price": unit_price,
				"total_price": quantity * unit_price,
			}
		)

	return rows


def _package_values(data: dict, is_new: bool = False) -> dict:
	"""Build Vehicle Service Package values from the master screen payload.

	Only keys present in ``data`` are written, so partial updates (e.g. toggling
	``is_active``) never wipe the child tables. Computed fields are always derived
	server side so the Desk form and the SPA agree.
	"""
	values: dict = {}

	if "package_name" in data or is_new:
		package_name = (data.get("package_name") or "").strip()
		if not package_name:
			frappe.throw(_("Package Name is required"))
		values["package_name"] = package_name

	for field in ("package_id", "vehicle_model"):
		if field in data:
			values[field] = (data.get(field) or "").strip() or None

	if "description" in data:
		values["description"] = data.get("description") or ""

	for field in ("interval_km", "interval_months"):
		if field in data:
			values[field] = cint(data.get(field))

	if "labour_discount_amount" in data:
		values["labour_discount_amount"] = flt(data.get("labour_discount_amount"))

	if "is_active" in data:
		values["is_active"] = 1 if cint(data.get("is_active")) else 0
	elif is_new:
		values["is_active"] = 1

	if "applicable_vehicle_models" in data:
		models = _package_vehicle_models(data)
		values["applicable_vehicle_models"] = models
		if not values.get("vehicle_model") and models:
			values["vehicle_model"] = models[0]["vehicle_model"]

	if "labor_operations" in data:
		labour_rows, total_hours = _package_labour_rows(data)
		values["labor_operations"] = labour_rows
		values["total_labor_hours"] = total_hours

	if "parts_included" in data:
		values["parts_included"] = _package_part_rows(data)

	before_discount = flt(data.get("before_discount"))
	after_discount = flt(data.get("after_discount"))
	if "before_discount" in data:
		values["before_discount"] = before_discount
	if "after_discount" in data:
		values["after_discount"] = after_discount

	if ({"before_discount", "after_discount", "total_amount"} & set(data)) or is_new:
		total_amount = flt(data.get("total_amount")) or after_discount or before_discount
		values["total_amount"] = total_amount
		values["package_price"] = after_discount or total_amount

	return values


def _attach_package_vehicle_models(rows: list[dict]) -> None:
	"""Attach applicable vehicle model labels to package list rows."""
	names = [row["name"] for row in rows if row.get("name")]
	if not names:
		return

	links = frappe.get_all(
		"Package Vehicle Model",
		filters={
			"parent": ["in", names],
			"parenttype": "Vehicle Service Package",
			"parentfield": "applicable_vehicle_models",
		},
		fields=["parent", "vehicle_model"],
		limit=len(names) * 50,
	)

	model_names = {link["vehicle_model"] for link in links if link.get("vehicle_model")}
	labels: dict[str, str] = {}
	if model_names:
		labels = {
			model["name"]: model.get("model_name") or model["name"]
			for model in frappe.get_all(
				"Vehicle Model",
				filters={"name": ["in", list(model_names)]},
				fields=["name", "model_name"],
				limit=len(model_names) + 1,
			)
		}

	by_parent: dict[str, list[str]] = {}
	for link in links:
		model = link.get("vehicle_model")
		if not model:
			continue
		by_parent.setdefault(link["parent"], []).append(labels.get(model, model))

	for row in rows:
		row["applicable_vehicle_models"] = by_parent.get(row["name"], [])


@frappe.whitelist()
def list_vehicle_service_packages(search=None, active_filter=None, vehicle_model=None, limit=50, offset=0):
	"""Vehicle Service Package masters for the Master → Service Packages screen."""
	frappe.has_permission("Vehicle Service Package", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0

	filters: dict = {}
	status = (active_filter or "active").strip().lower()
	if status not in ("active", "all", "inactive"):
		status = "active"
	if status != "all":
		filters["is_active"] = 1 if status == "active" else 0

	if (vehicle_model or "").strip():
		from dms.api.service_packages import _package_names_for_vehicle_model

		package_names = sorted(_package_names_for_vehicle_model(vehicle_model.strip()))
		if not package_names:
			return {"data": [], "total": 0}
		filters["name"] = ["in", package_names]

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		search_fields = _meta_fields("Vehicle Service Package", ["package_name", "package_id", "description"])
		or_filters = [[f, "like", q] for f in search_fields] or None

	fields = _meta_fields(
		"Vehicle Service Package",
		[
			"name",
			"package_name",
			"package_id",
			"description",
			"vehicle_model",
			"interval_km",
			"interval_months",
			"labour_discount_amount",
			"before_discount",
			"after_discount",
			"total_amount",
			"package_price",
			"total_labor_hours",
			"is_active",
			"modified",
		],
	)
	if "name" not in fields:
		fields.insert(0, "name")

	rows = frappe.get_all(
		"Vehicle Service Package",
		fields=fields,
		filters=filters or None,
		or_filters=or_filters,
		limit=limit,
		limit_start=offset,
		order_by="package_name asc",
	)
	total = _count("Vehicle Service Package", filters=filters or None, or_filters=or_filters)

	_attach_package_vehicle_models(rows)

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_vehicle_service_package(name):
	frappe.has_permission("Vehicle Service Package", "read", throw=True)
	if not name or not frappe.db.exists("Vehicle Service Package", name):
		frappe.throw(_("Vehicle Service Package {0} was not found.").format(frappe.bold(name or "")))
	return frappe.get_doc("Vehicle Service Package", name).as_dict()


@frappe.whitelist()
def create_vehicle_service_package(data=None):
	frappe.has_permission("Vehicle Service Package", "create", throw=True)

	values = _package_values(_parse_data(data), is_new=True)
	if frappe.db.exists("Vehicle Service Package", values["package_name"]):
		frappe.throw(
			_("Vehicle Service Package {0} already exists.").format(frappe.bold(values["package_name"]))
		)

	doc = frappe.get_doc({"doctype": "Vehicle Service Package", **values})
	doc.insert()
	frappe.db.commit()
	return {"name": doc.name, "package_name": doc.package_name}


@frappe.whitelist()
def update_vehicle_service_package(name, data):
	frappe.has_permission("Vehicle Service Package", "write", throw=True)
	if not name or not frappe.db.exists("Vehicle Service Package", name):
		frappe.throw(_("Vehicle Service Package {0} was not found.").format(frappe.bold(name or "")))

	values = _package_values(_parse_data(data))
	new_name = values.get("package_name")
	if new_name and new_name != name and frappe.db.exists("Vehicle Service Package", new_name):
		frappe.throw(_("Vehicle Service Package {0} already exists.").format(frappe.bold(new_name)))

	doc = frappe.get_doc("Vehicle Service Package", name)
	doc.update(values)
	doc.save()

	# `package_name` drives autoname, so follow a rename like the Desk form does.
	if new_name and new_name != doc.name:
		renamed = frappe.rename_doc("Vehicle Service Package", doc.name, new_name, force=True, merge=False)
		doc = frappe.get_doc("Vehicle Service Package", renamed if isinstance(renamed, str) else renamed.name)

	frappe.db.commit()
	return {"name": doc.name, "package_name": doc.package_name}


@frappe.whitelist()
def delete_vehicle_service_package(name):
	frappe.has_permission("Vehicle Service Package", "delete", throw=True)
	if not name or not frappe.db.exists("Vehicle Service Package", name):
		frappe.throw(_("Vehicle Service Package {0} was not found.").format(frappe.bold(name or "")))

	frappe.delete_doc("Vehicle Service Package", name)
	frappe.db.commit()
	return {"name": name}
