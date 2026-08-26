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
				fields=["name", "item_code", "item_name", "item_group", "stock_uom", "description", "standard_rate", "valuation_rate", "disabled"],
				limit=len(item_names),
			)
		}

	price_map: dict[str, dict] = {}
	if item_names:
		item_price_rows = frappe.get_all(
			"Item Price",
			filters={"price_list": "DMS Selling", "item_code": ["in", item_names]},
			fields=["name", "item_code", "price_list", "price_list_rate", "uom", "currency", "valid_from", "valid_upto"],
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
	frappe.db.commit()
	return {"name": doc.name, "item_code": doc.spare_part_item, "item_name": doc.item_name}


# ── Vehicle Service Items ────────────────────────────────────────────────────


@frappe.whitelist()
def list_vehicle_service_items(search=None, vehicle_model=None, limit=50, offset=0):
	frappe.has_permission("Vehicle Service Item", "read", throw=True)

	limit = cint(limit) or 50
	offset = cint(offset) or 0
	filters: dict = {}
	meta = frappe.get_meta("Vehicle Service Item")
	if meta.has_field("disabled") and not meta.get_field("disabled").default:
		filters["disabled"] = 0

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
				fields=["name", "item_code", "item_name", "item_group", "stock_uom", "description", "standard_rate", "valuation_rate", "disabled"],
				limit=len(item_codes),
			)
		}

	price_map: dict[str, dict] = {}
	if item_codes:
		item_price_rows = frappe.get_all(
			"Item Price",
			filters={"price_list": "DMS Selling", "item_code": ["in", item_codes]},
			fields=["name", "item_code", "price_list", "price_list_rate", "uom", "currency", "valid_from", "valid_upto"],
			order_by="price_list_rate asc",
			limit=len(item_codes) * 10,
		)
		for pr in item_price_rows:
			price_map.setdefault(pr["item_code"], pr)

	for r in rows:
		r["item_price"] = price_map.get(r.get("custom_erpnext_item")) if r.get("custom_erpnext_item") else None

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
					_("Vehicle Model {0} has no model code, so a combined service code cannot be built.").format(
						frappe.bold(model_name)
					)
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
	]
	values: dict = {}
	for field in optional:
		if field not in data or not meta.has_field(field):
			continue
		value = data.get(field)
		if value in (None, ""):
			continue
		values[field] = value
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
	]
	meta = frappe.get_meta("Vehicle Service Item")
	fields = [f for f in allowed_fields if meta.has_field(f) and f in data]
	_set_if_present(doc, data, fields)
	doc.save(ignore_permissions=False)
	frappe.db.commit()
	return {"name": doc.name, "service_item": doc.service_item, "custom_rate": doc.custom_rate}


# ── Item Prices ──────────────────────────────────────────────────────────────


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
		fields=["name", "item_code", "item_name", "price_list", "price_list_rate", "currency", "uom", "selling", "buying", "valid_from", "valid_upto"],
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
	_set_if_present(doc, data, fields)
	doc.save(ignore_permissions=False)
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


# ── DMS Job Card Terms ───────────────────────────────────────────────────────


def _job_card_terms_list(search=None, limit=100, offset=0):
	"""List DMS Job Card Terms records."""
	filters = {}
	if search:
		filters["title"] = ["like", f"%{search}%"]

	total = len(frappe.get_all("DMS Job Card Terms", filters=filters or None, pluck="name", limit_page_length=0))
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

	total = len(frappe.get_all("DMS Sales Invoice TC", filters=filters or None, pluck="name", limit_page_length=0))
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
	return {
		"price_lists": price_lists,
		"default_price_list": get_dms_default_selling_price_list(),
		"item_groups": item_groups,
	}