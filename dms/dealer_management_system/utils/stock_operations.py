# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""DMS stock entry / reconciliation helpers — warehouses and accounts from DMS Settings."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_dms_company_defaults_row,
)
from dms.dealer_management_system.utils.company_letter_head import apply_company_letter_head
from dms.api.utils import get_dms_companies
from dms.utils.spare_part_auto_create import (
	item_group_auto_generates_spare_parts,
	try_create_spare_part_from_item,
)


STOCK_ENTRY_PURPOSES = {
	"Material Issue": "Material Issue",
	"Material Receipt": "Material Receipt",
	"Material Transfer": "Material Transfer",
}

MATERIAL_REQUEST_TYPES = {
	"Purchase": "Purchase",
	"Material Transfer": "Material Transfer",
	"Material Issue": "Material Issue",
}

SPARE_PARTS_SUPPLIER_FIELD = "custom_spare_parts_supplier_"
SPAREPART_STOCK_FIELD = "custom_sparepart_stock"
SPAREPART_STOCK_FIELD_ALIASES = (SPAREPART_STOCK_FIELD, "custom__sparepart_stock")


def _sparepart_stock_field(doctype: str) -> str | None:
	meta = frappe.get_meta(doctype)
	for fieldname in SPAREPART_STOCK_FIELD_ALIASES:
		if meta.has_field(fieldname):
			return fieldname
	return None


def _supplier_has_spare_parts_field() -> bool:
	return frappe.get_meta("Supplier").has_field(SPARE_PARTS_SUPPLIER_FIELD)


def _spare_parts_supplier_filter() -> dict:
	if _supplier_has_spare_parts_field():
		return {SPARE_PARTS_SUPPLIER_FIELD: 1}
	return {}


def _is_spare_parts_supplier(supplier: str | None) -> bool:
	supplier = (supplier or "").strip()
	if not supplier or not frappe.db.exists("Supplier", supplier):
		return False
	if not _supplier_has_spare_parts_field():
		return True
	return bool(frappe.db.get_value("Supplier", supplier, SPARE_PARTS_SUPPLIER_FIELD))


def _assert_spare_parts_supplier(supplier: str | None):
	supplier = (supplier or "").strip()
	if not supplier:
		return
	if _supplier_has_spare_parts_field() and not _is_spare_parts_supplier(supplier):
		frappe.throw(
			_("Supplier {0} is not flagged as a spare-parts supplier.").format(frappe.bold(supplier))
		)


def get_dms_default_supplier(company: str | None = None) -> str | None:
	"""Resolved spare-parts supplier: company default, then DMS Settings default."""
	company = (company or "").strip() or get_default_dms_company()
	supplier = None

	defaults_row = get_dms_company_defaults_row(company)
	if defaults_row:
		supplier = (getattr(defaults_row, "default_supplier", None) or "").strip() or None

	if not supplier:
		supplier = (frappe.db.get_single_value("DMS Settings", "default_supplier") or "").strip() or None

	if supplier and not _is_spare_parts_supplier(supplier):
		return None
	return supplier


def resolve_dms_purchase_supplier(company: str | None = None, supplier: str | None = None) -> str:
	"""Pick a spare-parts supplier for purchase receipt / MR fulfillment."""
	supplier = (supplier or "").strip()
	if supplier:
		_assert_spare_parts_supplier(supplier)
		return supplier

	supplier = (get_dms_default_supplier(company) or "").strip()
	if supplier:
		return supplier

	spare_suppliers = search_suppliers(limit=2)
	if len(spare_suppliers) == 1:
		return spare_suppliers[0]["name"]

	frappe.throw(
		_(
			"Supplier is required. Choose a spare-parts supplier, or set Default Supplier on DMS Settings → Company Defaults."
		)
	)


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for stock operations."))


def get_workshop_warehouses(company: str | None = None) -> list[dict]:
	"""Warehouses configured on WorkShop records (inventory / stock UI scope)."""
	workshop_filters: dict = {"warehouse": ["is", "set"]}
	if company:
		workshop_filters["company"] = company

	workshops = frappe.get_all(
		"WorkShop",
		filters=workshop_filters,
		fields=["name", "branch_name", "warehouse", "company"],
		order_by="branch_name asc, name asc",
	)

	seen: set[str] = set()
	out: list[dict] = []
	for ws in workshops:
		wh = (ws.warehouse or "").strip()
		if not wh or wh in seen:
			continue
		if not frappe.db.exists("Warehouse", wh):
			continue
		seen.add(wh)
		wh_name = frappe.db.get_value("Warehouse", wh, "warehouse_name") or wh
		workshop_label = (ws.branch_name or ws.name or "").strip()
		out.append(
			{
				"name": wh,
				"warehouse_name": wh_name,
				"company": ws.company or frappe.db.get_value("Warehouse", wh, "company"),
				"workshop": ws.name,
				"workshop_name": workshop_label,
			}
		)
	return out


def get_workshop_warehouse_names(company: str | None = None) -> list[str]:
	return [row["name"] for row in get_workshop_warehouses(company)]


def get_dms_allowed_warehouse_names(company: str | None = None) -> list[str]:
	"""Warehouses linked to workshops for DMS stock operations."""
	return get_workshop_warehouse_names(company)


def get_dms_allowed_warehouses(company: str | None = None) -> list[dict]:
	return get_workshop_warehouses(company)


def assert_dms_warehouse_allowed(warehouse: str | None, company: str | None = None):
	warehouse = (warehouse or "").strip()
	if not warehouse:
		frappe.throw(_("Warehouse is required."))
	allowed = get_dms_allowed_warehouse_names(company)
	if allowed and warehouse not in allowed:
		frappe.throw(
			_("Warehouse {0} is not configured for DMS stock operations.").format(frappe.bold(warehouse))
		)
	if company:
		wh_company = frappe.db.get_value("Warehouse", warehouse, "company")
		if wh_company and wh_company != company:
			frappe.throw(
				_("Warehouse {0} does not belong to company {1}.").format(
					frappe.bold(warehouse), frappe.bold(company)
				)
			)


def get_default_dms_company() -> str:
	"""Primary company for DMS UI forms (first Company on DMS Settings, then company defaults)."""
	companies = get_dms_companies()
	if companies:
		return companies[0]

	settings = frappe.get_single("DMS Settings")
	for row in settings.get("company_defaults") or []:
		if row.company:
			return row.company

	return (frappe.defaults.get_user_default("Company") or "").strip()


def get_dms_default_item_group() -> str:
	return (frappe.db.get_single_value("DMS Settings", "default_item_group") or "").strip()


DEFAULT_STOCK_UOM = "Pcs"
_PREFERRED_STOCK_UOMS = ("Pcs", "Nos", "Set", "Pair", "Box", "Kg", "Litre", "Ltr")


def _uom_is_enabled(name: str) -> bool:
	if not frappe.db.exists("UOM", name):
		return False
	enabled = frappe.db.get_value("UOM", name, "enabled")
	return enabled is None or bool(cint(enabled))


def list_uoms_for_item_create() -> list[dict]:
	names = frappe.get_all("UOM", filters={"enabled": 1}, pluck="name", order_by="name asc")
	preferred = [name for name in _PREFERRED_STOCK_UOMS if name in names]
	rest = [name for name in names if name not in preferred]
	return [{"value": name, "label": name} for name in [*preferred, *rest]]


def get_default_stock_uom() -> str:
	for name in _PREFERRED_STOCK_UOMS:
		if _uom_is_enabled(name):
			return name
	fallback = frappe.db.get_value("UOM", {"enabled": 1}, "name")
	return (fallback or DEFAULT_STOCK_UOM).strip()


def resolve_stock_uom(stock_uom: str | None = None) -> str:
	requested = (stock_uom or "").strip() or get_default_stock_uom()
	if not frappe.db.exists("UOM", requested):
		frappe.throw(_("UOM {0} was not found.").format(frappe.bold(requested)))
	if not _uom_is_enabled(requested):
		frappe.throw(_("UOM {0} is disabled.").format(frappe.bold(requested)))
	return requested


def get_stock_item_create_defaults() -> dict:
	item_group = get_dms_default_item_group()
	return {
		"default_item_group": item_group or None,
		"auto_create_spare_parts": bool(
			item_group and item_group_auto_generates_spare_parts(item_group)
		),
		"default_stock_uom": get_default_stock_uom(),
		"uoms": list_uoms_for_item_create(),
	}


def _dms_settings_default_selling_price_list() -> str | None:
	"""Read configured selling price list from DMS Settings."""
	meta = frappe.get_meta("DMS Settings")
	for fieldname in ("default_selling_list", "default_price_list"):
		if not meta.has_field(fieldname):
			continue
		price_list = (frappe.db.get_single_value("DMS Settings", fieldname) or "").strip()
		if not price_list or not frappe.db.exists("Price List", price_list):
			continue
		enabled, selling = frappe.db.get_value(
			"Price List", price_list, ["enabled", "selling"]
		) or (0, 0)
		if cint(enabled) and cint(selling):
			return price_list
	return None


def get_dms_default_selling_price_list() -> str | None:
	"""DMS Settings selling list, else first enabled ETB selling price list."""
	price_list = _dms_settings_default_selling_price_list()
	if price_list:
		return price_list
	return frappe.db.get_value(
		"Price List",
		{"currency": "ETB", "enabled": 1, "selling": 1},
		"name",
		order_by="creation asc",
	)


def _dms_settings_configured_price_list() -> str | None:
	"""Raw Default Price List from DMS Settings (any selling/buying flags)."""
	meta = frappe.get_meta("DMS Settings")
	if not meta.has_field("default_price_list"):
		return None
	price_list = (frappe.db.get_single_value("DMS Settings", "default_price_list") or "").strip()
	if not price_list or not frappe.db.exists("Price List", price_list):
		return None
	enabled = frappe.db.get_value("Price List", price_list, "enabled")
	if not cint(enabled):
		return None
	return price_list


def get_dms_default_buying_price_list() -> str | None:
	"""Prefer DMS Settings default price list when buying-enabled; else Buying Settings / first buying list."""
	configured = _dms_settings_configured_price_list()
	if configured:
		buying = cint(frappe.db.get_value("Price List", configured, "buying") or 0)
		if buying:
			return configured

	buying_settings = (frappe.db.get_single_value("Buying Settings", "buying_price_list") or "").strip()
	if buying_settings and frappe.db.exists("Price List", buying_settings):
		return buying_settings

	# Still surface DMS default even if not marked buying (user configured it intentionally).
	if configured:
		return configured

	return frappe.db.get_value(
		"Price List",
		{"enabled": 1, "buying": 1},
		"name",
		order_by="name asc",
	)


def list_dms_buying_price_lists() -> list[dict]:
	"""Enabled buying price lists for purchase receipt UI (+ DMS default if missing)."""
	rows = frappe.get_all(
		"Price List",
		filters={"enabled": 1, "buying": 1},
		fields=["name", "currency"],
		order_by="name asc",
	)
	out = [{"name": r.name, "currency": r.currency or None} for r in rows]
	names = {r["name"] for r in out}

	configured = _dms_settings_configured_price_list()
	if configured and configured not in names:
		currency = frappe.db.get_value("Price List", configured, "currency")
		out.insert(0, {"name": configured, "currency": currency or None})

	return out


def get_item_price_list_rate(item_code: str | None, price_list: str | None) -> float:
	"""Item Price rate for a price list (buying or selling)."""
	item_code = (item_code or "").strip()
	price_list = (price_list or "").strip()
	if not item_code or not price_list:
		return 0.0
	rate = frappe.db.get_value(
		"Item Price",
		{"item_code": item_code, "price_list": price_list},
		"price_list_rate",
	)
	return flt(rate)


def get_company_default_currency(company: str | None = None) -> str:
	company = (company or "").strip() or get_default_dms_company()
	if company:
		currency = (frappe.db.get_value("Company", company, "default_currency") or "").strip()
		if currency:
			return currency
	return "ETB"


def upsert_dms_selling_item_price(
	item_code: str,
	rate: float,
	*,
	price_list: str | None = None,
	uom: str = "Nos",
) -> str | None:
	"""Create or update Item Price on the DMS default selling price list."""
	rate = flt(rate)
	if rate <= 0:
		return None

	price_list = (price_list or "").strip() or get_dms_default_selling_price_list()
	if not price_list:
		return None

	# Use the company default currency (DMS Settings price lists can be marked
	# selling but carry a different currency than the company).
	currency = get_company_default_currency() or "ETB"
	filters = {"item_code": item_code, "price_list": price_list, "selling": 1}
	existing = frappe.db.get_value("Item Price", filters, "name")
	price_data = {
		"item_code": item_code,
		"price_list": price_list,
		"price_list_rate": rate,
		"currency": currency,
		"uom": uom or "Nos",
		"selling": 1,
	}

	if existing:
		doc = frappe.get_doc("Item Price", existing)
		for fieldname, value in price_data.items():
			setattr(doc, fieldname, value)
		doc.save(ignore_permissions=True)
		return existing

	doc = frappe.get_doc({"doctype": "Item Price", **price_data})
	doc.insert(ignore_permissions=True)
	return doc.name


def create_dms_stock_item(data: dict) -> dict:
	_ensure_erpnext()

	item_code = (data.get("item_code") or "").strip()
	item_name = (data.get("item_name") or item_code).strip()
	valuation_rate = flt(data.get("valuation_rate") or data.get("cost"))
	selling_rate = flt(
		data.get("standard_rate") or data.get("selling_price") or data.get("rate")
	)
	item_group = (data.get("item_group") or "").strip() or get_dms_default_item_group()
	stock_uom = resolve_stock_uom(data.get("stock_uom"))

	if not item_code:
		frappe.throw(_("Item code is required."))
	if not item_name:
		frappe.throw(_("Item name is required."))
	if frappe.db.exists("Item", item_code):
		frappe.throw(_("Item {0} already exists.").format(frappe.bold(item_code)))
	if not item_group:
		frappe.throw(
			_("Default Item Group is not configured. Set it on DMS Settings → Default Item Group.")
		)
	if not frappe.db.exists("Item Group", item_group):
		frappe.throw(_("Item Group {0} does not exist.").format(frappe.bold(item_group)))

	item_row = {
		"doctype": "Item",
		"item_code": item_code,
		"item_name": item_name,
		"item_group": item_group,
		"stock_uom": stock_uom,
		"is_stock_item": 1,
		"is_purchase_item": 1,
		"is_sales_item": 1,
		"include_item_in_manufacturing": 0,
	}
	if valuation_rate > 0:
		item_row["valuation_rate"] = valuation_rate
	if selling_rate > 0:
		item_row["standard_rate"] = selling_rate

	item = frappe.get_doc(item_row)
	item.insert(ignore_permissions=True)

	item_price = None
	price_list = None
	if selling_rate > 0:
		price_list = get_dms_default_selling_price_list()
		item_price = upsert_dms_selling_item_price(
			item.name, selling_rate, price_list=price_list, uom=stock_uom
		)

		# ERPNext auto-creates an Item Price on Selling Settings' price list
		# when an Item is inserted with standard_rate. Point any such
		# auto-created price to the DMS default price list instead, so the
		# DMS default list is the single source of truth.
		auto_prices = frappe.get_all(
			"Item Price",
			filters={
				"item_code": item.name,
				"selling": 1,
			},
			fields=["name", "price_list"],
		)
		for auto in auto_prices:
			if auto.price_list == price_list:
				continue
			doc = frappe.get_doc("Item Price", auto.name)
			if frappe.db.exists("Item Price", {"item_code": item.name, "price_list": price_list, "selling": 1}):
				doc.delete(ignore_permissions=True)
			else:
				doc.price_list = price_list
				doc.currency = get_company_default_currency() or "ETB"
				doc.save(ignore_permissions=True)
				item_price = doc.name

	spare_part_name = frappe.db.get_value("Spare Part", {"spare_part_item": item.name}, "name")
	if not spare_part_name:
		try_create_spare_part_from_item(item, show_message=False)
		spare_part_name = frappe.db.get_value("Spare Part", {"spare_part_item": item.name}, "name")

	if spare_part_name:
		sp_updates: dict = {}
		if valuation_rate > 0:
			sp_updates["last_purchase_price"] = valuation_rate
		if selling_rate > 0:
			sp_updates["selling_price"] = selling_rate
		if sp_updates:
			frappe.db.set_value("Spare Part", spare_part_name, sp_updates)

	return {
		"name": item.name,
		"label": item.item_name or item.name,
		"item_code": item.name,
		"item_name": item.item_name or item.name,
		"valuation_rate": valuation_rate,
		"standard_rate": selling_rate,
		"item_price": item_price,
		"price_list": price_list,
		"spare_part": spare_part_name,
		"item_group": item_group,
		"stock_uom": stock_uom,
	}


def _default_workshop_warehouse(allowed: list[dict]) -> str | None:
	"""Auto-select warehouse only when exactly one workshop warehouse exists."""
	if len(allowed) == 1:
		return allowed[0]["name"]
	return None


def get_dms_parts_warehouse(company: str | None = None) -> str | None:
	"""Parts Warehouse from DMS Settings → Company Defaults for `company`."""
	row = get_dms_company_defaults_row(company)
	if not row:
		return None
	return (getattr(row, "parts_warehouse", None) or "").strip() or None


def get_dms_purchase_receipt_warehouse(company: str | None = None) -> str | None:
	"""Purchase Receipt Warehouse, falling back to Parts Warehouse."""
	row = get_dms_company_defaults_row(company)
	if not row:
		return None
	wh = (getattr(row, "purchase_receipt_warehouse", None) or "").strip()
	if wh:
		return wh
	return get_dms_parts_warehouse(company)


def get_purchase_receipt_defaults(company: str | None = None) -> dict:
	company = (company or "").strip() or get_default_dms_company()
	defaults_row = get_dms_company_defaults_row(company)
	allowed = get_dms_allowed_warehouses(company)

	default_warehouse = (
		get_dms_purchase_receipt_warehouse(company) or _default_workshop_warehouse(allowed)
	)
	default_supplier = get_dms_default_supplier(company)
	default_price_list = get_dms_default_buying_price_list()
	default_currency = get_company_default_currency(company)
	if default_price_list:
		pl_currency = (frappe.db.get_value("Price List", default_price_list, "currency") or "").strip()
		if pl_currency:
			default_currency = pl_currency

	return {
		"company": company,
		"default_warehouse": default_warehouse,
		"default_supplier": default_supplier,
		"default_supplier_group": (frappe.db.get_single_value("DMS Settings", "default_supplier_group") or "").strip() or None,
		"default_currency": default_currency,
		"default_price_list": default_price_list,
		"price_lists": list_dms_buying_price_lists(),
		"cost_center": getattr(defaults_row, "cost_center", None) if defaults_row else None,
		"branch": getattr(defaults_row, "branch", None) if defaults_row else None,
		"project": getattr(defaults_row, "project", None) if defaults_row else None,
		"warehouses": allowed,
		"companies": get_dms_companies(),
		**get_stock_item_create_defaults(),
	}


def get_stock_operation_defaults(company: str | None = None) -> dict:
	company = (company or "").strip() or get_default_dms_company()

	defaults_row = get_dms_company_defaults_row(company)
	allowed = get_dms_allowed_warehouses(company)

	default_warehouse = get_dms_parts_warehouse(company) or _default_workshop_warehouse(allowed)

	stock_account = None
	if defaults_row:
		stock_account = (getattr(defaults_row, "stock_adjustment_account", None) or "").strip() or None
	if not stock_account and company:
		stock_account = frappe.db.get_value("Company", company, "stock_adjustment_account")

	return {
		"company": company,
		"default_warehouse": default_warehouse,
		"stock_adjustment_account": stock_account,
		"cost_center": getattr(defaults_row, "cost_center", None) if defaults_row else None,
		"branch": getattr(defaults_row, "branch", None) if defaults_row else None,
		"project": getattr(defaults_row, "project", None) if defaults_row else None,
		"warehouses": allowed,
		"stock_entry_types": [
			{"value": "Material Issue", "label": "Material Issue (consume)"},
			{"value": "Material Receipt", "label": "Material Receipt (add stock)"},
			{"value": "Material Transfer", "label": "Material Transfer"},
		],
		"material_request_types": [
			{"value": "Purchase", "label": "Purchase (request from supplier)"},
			{"value": "Material Transfer", "label": "Material Transfer"},
			{"value": "Material Issue", "label": "Material Issue"},
		],
		"companies": get_dms_companies(),
		**get_stock_item_create_defaults(),
	}


def get_material_request_defaults(company: str | None = None) -> dict:
	return get_stock_operation_defaults(company)


def _apply_company_defaults_to_stock_doc(doc, company: str | None):
	row = get_dms_company_defaults_row(company)
	if row:
		for field in ("branch", "cost_center", "project"):
			val = getattr(row, field, None)
			if val and doc.meta.has_field(field):
				doc.set(field, val)
	apply_company_letter_head(doc, company)


def _mark_dms_sparepart_stock_doc(doc):
	fieldname = _sparepart_stock_field(doc.doctype)
	if fieldname:
		doc.set(fieldname, 1)


def resolve_spare_part_erp_item_code(spare_part: str) -> str | None:
	"""Resolve ERPNext Item name used for stock balance lookups."""
	spare_part = (spare_part or "").strip()
	if not spare_part or not frappe.db.exists("Spare Part", spare_part):
		return None

	row = frappe.db.get_value(
		"Spare Part",
		spare_part,
		["spare_part_item", "item_code"],
		as_dict=True,
	)
	return resolve_spare_part_row_erp_item(row) if row else None


def resolve_spare_part_row_erp_item(part: dict | None) -> str | None:
	"""Resolve Item name from a Spare Part row/dict (same fields as stock balance report)."""
	if not part:
		return None

	candidate = (part.get("spare_part_item") or part.get("item_code") or "").strip()
	if not candidate:
		return None

	if frappe.db.exists("Item", candidate):
		return candidate

	by_item_code = frappe.db.get_value("Item", {"item_code": candidate}, "name")
	if by_item_code:
		return by_item_code

	return frappe.db.get_value("Item", {"name": candidate, "disabled": 0}, "name")


def get_dms_warehouse_scope(company: str | None = None, warehouse: str | None = None) -> list[str]:
	"""Warehouses used for stock display — mirrors inventory dashboard _warehouse_scope."""
	warehouse = (warehouse or "").strip() or None
	if warehouse:
		frappe.logger().debug(f"Using specific warehouse: {warehouse}")
		return [warehouse]

	company = (company or "").strip() or get_default_dms_company()
	frappe.logger().debug(f"Getting workshop warehouses for company: {company}")
	whs = get_workshop_warehouse_names(company)
	if whs:
		frappe.logger().debug(f"Found {len(whs)} workshop warehouses: {whs}")
		return whs

	# Fallback when no workshop warehouses are configured for the company
	frappe.logger().debug(f"No workshop warehouses found for company {company}, using fallback")
	default_wh = frappe.db.get_value("Company", company, "default_warehouse")
	if default_wh:
		frappe.logger().debug(f"Using company default warehouse: {default_wh}")
		return [default_wh]

	fallback_whs = frappe.get_all(
		"Warehouse",
		filters={"is_group": 0, "disabled": 0},
		pluck="name",
		limit=50,
	)
	frappe.logger().debug(f"Using all warehouses fallback: {len(fallback_whs)} warehouses")
	return fallback_whs


def _bin_stock_balance(item_code: str, warehouse: str | None = None) -> float:
	"""Read qty from Bin (fallback when ERPNext balance helper is unavailable)."""
	if not item_code or not frappe.db.has_table("Bin"):
		return 0.0

	if warehouse:
		return flt(
			frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty")
		)

	rows = frappe.db.sql(
		"""select sum(actual_qty) from `tabBin` where item_code = %s""",
		(item_code,),
	)
	return flt(rows[0][0]) if rows and rows[0][0] is not None else 0.0


def get_dms_item_stock_balance(
	item_code: str,
	warehouse: str | None = None,
	company: str | None = None,
	as_on_date: str | None = None,
) -> float:
	"""Qty on hand — same approach as inventory dashboard _balance_for_item."""
	from frappe.utils import today

	item_code = (item_code or "").strip()
	if not item_code:
		return 0.0

	warehouses = get_dms_warehouse_scope(company, warehouse)
	if not warehouses:
		return _bin_stock_balance(item_code, warehouse)

	as_on_date = (as_on_date or today()).strip() or None

	try:
		from erpnext.stock.utils import get_stock_balance
	except ImportError:
		get_stock_balance = None

	total = 0.0
	for wh in warehouses:
		qty = 0.0
		if get_stock_balance:
			try:
				qty = flt(get_stock_balance(item_code, wh, as_on_date))
			except Exception as e:
				frappe.log_error(f"Error getting stock balance for {item_code} in {wh}: {str(e)}")
				qty = _bin_stock_balance(item_code, wh)
		else:
			qty = _bin_stock_balance(item_code, wh)
		if qty > 0:
			frappe.logger().debug(f"Stock for {item_code} in {wh}: {qty}")
		total += qty

	frappe.logger().debug(f"Total stock for {item_code} across {len(warehouses)} warehouses: {total}")
	return total


def get_erp_items_stock_qty_batch(
	item_codes: list[str],
	warehouse: str | None = None,
	company: str | None = None,
	as_on_date: str | None = None,
) -> dict[str, float]:
	"""Batch stock lookup keyed by ERPNext Item name."""
	unique_codes = []
	seen: set[str] = set()
	for raw in item_codes:
		code = (raw or "").strip()
		if code and code not in seen:
			seen.add(code)
			unique_codes.append(code)

	return {code: get_dms_item_stock_balance(code, warehouse, company, as_on_date) for code in unique_codes}


def _stock_item_balance(item_code: str, warehouse: str | None) -> float:
	"""Qty on hand for an ERPNext Item, optionally scoped to one warehouse."""
	return get_dms_item_stock_balance(item_code, warehouse)


def get_erp_item_stock_qty(
	item_code: str,
	warehouse: str | None = None,
	company: str | None = None,
) -> float:
	return get_dms_item_stock_balance(item_code, warehouse, company)


def get_spare_part_stock_qty(
	spare_part: str,
	warehouse: str | None = None,
	company: str | None = None,
) -> float:
	"""Qty on hand for the Spare Part's linked ERPNext Item."""
	spare_part = (spare_part or "").strip()
	if not spare_part:
		return 0.0

	erp_item = resolve_spare_part_erp_item_code(spare_part)
	if not erp_item:
		return 0.0

	return get_dms_item_stock_balance(erp_item, warehouse, company)


def attach_spare_part_stock_available(
	parts: list[dict],
	warehouse: str | None = None,
	company: str | None = None,
) -> None:
	"""Set stock_available on spare part rows (mutates list in place)."""
	frappe.logger().debug(f"Attaching stock for {len(parts)} parts, warehouse={warehouse}, company={company}")
	
	erp_by_part: dict[str, str] = {}
	for part in parts:
		erp_item = resolve_spare_part_row_erp_item(part)
		if erp_item:
			erp_by_part[part["name"]] = erp_item
		else:
			frappe.logger().debug(f"Could not resolve ERP item for spare part: {part.get('name')}")

	if not erp_by_part:
		frappe.logger().debug("No ERP items found for any spare parts, setting stock to 0")
		for part in parts:
			part["stock_available"] = 0.0
		return

	frappe.logger().debug(f"Resolved {len(erp_by_part)} ERP items from spare parts")
	stock_by_erp = get_erp_items_stock_qty_batch(
		list(erp_by_part.values()),
		warehouse=warehouse,
		company=company,
	)

	for part in parts:
		erp_item = erp_by_part.get(part["name"])
		stock_qty = stock_by_erp.get(erp_item, 0.0) if erp_item else 0.0
		part["stock_available"] = stock_qty
		if stock_qty > 0:
			frappe.logger().debug(f"Part {part.get('name')} ({erp_item}): {stock_qty} in stock")


def get_spare_part_names_for_vehicle(
	vehicle_model: str | None = None,
	vehicle_brand: str | None = None,
) -> set[str] | None:
	"""Spare parts compatible with a vehicle (universal parts always included).

	Returns None when no vehicle filter is active.
	"""
	vehicle_model = (vehicle_model or "").strip()
	vehicle_brand = (vehicle_brand or "").strip()
	if not vehicle_model and not vehicle_brand:
		return None

	sp_filters: dict = {}
	sp_meta = frappe.get_meta("Spare Part")
	if sp_meta.has_field("discontinued"):
		sp_filters["discontinued"] = 0

	all_parts = set(frappe.get_all("Spare Part", filters=sp_filters or None, pluck="name"))
	if not all_parts:
		return set()

	parts_with_compat = set(
		frappe.db.sql("SELECT DISTINCT parent FROM `tabSpare Part Compatibility`", pluck=True)
	)
	universal = all_parts - parts_with_compat

	if vehicle_model:
		matching = set(
			frappe.get_all(
				"Spare Part Compatibility",
				filters={"vehicle_model": vehicle_model},
				pluck="parent",
			)
		)
	elif vehicle_brand:
		matching = set(
			frappe.get_all(
				"Spare Part Compatibility",
				filters={"vehicle_brand": vehicle_brand},
				pluck="parent",
			)
		)
	else:
		matching = set()

	return (matching & all_parts) | universal


def resolve_spare_parts_vehicle_filter(
	vin: str | None = None,
	vehicle_model: str | None = None,
	vehicle_brand: str | None = None,
):
	"""Resolve vehicle context for spare-part filtering.

	Returns (vehicle_model, vehicle_brand, allowed_spare_part_names|None).
	"""
	vin = (vin or "").strip()
	vehicle_model = (vehicle_model or "").strip()
	vehicle_brand = (vehicle_brand or "").strip()

	if vin and not vehicle_brand:
		vehicle_brand = (frappe.db.get_value("VIN No", vin, "brand") or "").strip()

	# Prefer the VIN No.model link (e.g. JX70P) — same key as Spare Part Compatibility.
	if vin:
		vin_model = (frappe.db.get_value("VIN No", vin, "model") or "").strip()
		if vin_model:
			vehicle_model = vin_model
		elif not vehicle_model:
			from dms.api.service_packages import resolve_vehicle_model_from_vin

			vehicle_model, _vm_label = resolve_vehicle_model_from_vin(vin)
			vehicle_model = (vehicle_model or "").strip()

	allowed = get_spare_part_names_for_vehicle(vehicle_model, vehicle_brand)
	return vehicle_model, vehicle_brand, allowed


def _is_spare_part_item(item_code: str | None) -> bool:
	item_code = (item_code or "").strip()
	if not item_code:
		return False
	return bool(frappe.db.exists("Spare Part", {"spare_part_item": item_code}))


def _assert_spare_part_item(item_code: str | None):
	item_code = (item_code or "").strip()
	if not item_code:
		return
	if not _is_spare_part_item(item_code):
		frappe.throw(_("Item {0} is not a spare part.").format(frappe.bold(item_code)))


def search_stock_items(search: str | None = None, warehouse: str | None = None, limit: int = 20) -> list[dict]:
	"""Return stock items that have a linked Spare Part record."""
	sp_filters: dict = {"spare_part_item": ["is", "set"]}
	sp_meta = frappe.get_meta("Spare Part")
	if sp_meta.has_field("discontinued"):
		sp_filters["discontinued"] = 0

	or_filters = None
	if search and search.strip():
		q = f"%{search.strip()}%"
		or_filters = [
			["name", "like", q],
			["spare_part_item", "like", q],
			["item_name", "like", q],
			["item_code", "like", q],
			["oem_part_number", "like", q],
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

	spare_parts = frappe.get_all(
		"Spare Part",
		filters=sp_filters,
		or_filters=or_filters,
		fields=["name", "spare_part_item", "item_name", "selling_price"],
		limit=int(limit),
		order_by="item_name asc, name asc",
	)

	out = []
	for sp in spare_parts:
		item_code = (sp.get("spare_part_item") or "").strip()
		if not item_code:
			continue
		if not frappe.db.exists("Item", {"name": item_code, "disabled": 0, "is_stock_item": 1}):
			continue

		item_row = frappe.db.get_value(
			"Item",
			item_code,
			["item_name", "stock_uom", "standard_rate"],
			as_dict=True,
		)
		if not item_row:
			continue

		rate = flt(sp.get("selling_price")) or flt(item_row.standard_rate)
		out.append(
			{
				"item_code": item_code,
				"item_name": item_row.item_name or sp.get("item_name") or item_code,
				"spare_part": sp.name,
				"stock_uom": item_row.stock_uom,
				"valuation_rate": rate,
				"qty_on_hand": _stock_item_balance(item_code, warehouse),
			}
		)
	return out


def get_item_uoms_for_ui(item_code: str | None) -> dict:
	"""Stock UOM plus alternate UOMs configured on the Item."""
	item_code = (item_code or "").strip()
	if not item_code or not frappe.db.exists("Item", item_code):
		return {"stock_uom": None, "uoms": []}

	stock_uom = (frappe.db.get_value("Item", item_code, "stock_uom") or "Nos").strip() or "Nos"
	uom_names: set[str] = {stock_uom}

	for uom in frappe.get_all(
		"UOM Conversion Detail",
		filters={"parent": item_code},
		pluck="uom",
	):
		if uom:
			uom_names.add(uom)

	return {
		"stock_uom": stock_uom,
		"uoms": [{"value": name, "label": name} for name in sorted(uom_names)],
	}


def _material_request_line_uom_fields(item_code: str, qty: float, uom: str | None = None) -> dict:
	from erpnext.stock.get_item_details import get_conversion_factor

	stock_uom = (frappe.db.get_value("Item", item_code, "stock_uom") or "Nos").strip() or "Nos"
	selected_uom = (uom or stock_uom).strip() or stock_uom
	conversion_factor = flt(get_conversion_factor(item_code, selected_uom).get("conversion_factor") or 1)
	if conversion_factor <= 0:
		conversion_factor = 1.0

	return {
		"uom": selected_uom,
		"stock_uom": stock_uom,
		"conversion_factor": conversion_factor,
		"stock_qty": flt(qty) * conversion_factor,
	}


def create_dms_stock_entry(data: dict) -> dict:
	_ensure_erpnext()

	company = (data.get("company") or "").strip()
	entry_type = (data.get("stock_entry_type") or "Material Issue").strip()
	posting_date = data.get("posting_date") or frappe.utils.today()
	submit = cint(data.get("submit", 1))
	lines = data.get("items") or []

	if not company:
		frappe.throw(_("Company is required."))
	if entry_type not in STOCK_ENTRY_PURPOSES:
		frappe.throw(_("Unsupported stock entry type: {0}").format(entry_type))
	if not lines:
		frappe.throw(_("Add at least one item line."))

	defaults = get_stock_operation_defaults(company)
	expense_account = (data.get("expense_account") or defaults.get("stock_adjustment_account") or "").strip()

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = entry_type
	se.purpose = STOCK_ENTRY_PURPOSES[entry_type]
	se.company = company
	se.posting_date = posting_date
	se.set_posting_time = 1
	se.from_bom = 0
	se.remarks = (data.get("remarks") or _("Created from DMS")).strip()

	_mark_dms_sparepart_stock_doc(se)
	_apply_company_defaults_to_stock_doc(se, company)

	for row in lines:
		item_code = (row.get("item_code") or "").strip()
		if not item_code:
			continue
		_assert_spare_part_item(item_code)
		qty = flt(row.get("qty"))
		if qty <= 0:
			frappe.throw(_("Quantity must be greater than zero for {0}.").format(item_code))

		s_wh = (row.get("s_warehouse") or data.get("s_warehouse") or "").strip()
		t_wh = (row.get("t_warehouse") or data.get("t_warehouse") or "").strip()

		if entry_type == "Material Issue":
			if not s_wh:
				frappe.throw(_("Source warehouse is required for Material Issue."))
			assert_dms_warehouse_allowed(s_wh, company)
			line = {"item_code": item_code, "qty": qty, "s_warehouse": s_wh}
			if expense_account:
				line["expense_account"] = expense_account
			se.append("items", line)
		elif entry_type == "Material Receipt":
			if not t_wh:
				frappe.throw(_("Target warehouse is required for Material Receipt."))
			assert_dms_warehouse_allowed(t_wh, company)
			rate = flt(row.get("basic_rate") or row.get("valuation_rate"))
			line = {"item_code": item_code, "qty": qty, "t_warehouse": t_wh}
			if rate > 0:
				line["basic_rate"] = rate
			se.append("items", line)
		else:
			if not s_wh or not t_wh:
				frappe.throw(_("Source and target warehouses are required for Material Transfer."))
			assert_dms_warehouse_allowed(s_wh, company)
			assert_dms_warehouse_allowed(t_wh, company)
			if s_wh == t_wh:
				frappe.throw(_("Source and target warehouse must be different."))
			se.append(
				"items",
				{"item_code": item_code, "qty": qty, "s_warehouse": s_wh, "t_warehouse": t_wh},
			)

	if not se.get("items"):
		frappe.throw(_("Add at least one valid item line."))

	se.insert(ignore_permissions=True)
	if submit:
		se.submit()

	return {"name": se.name, "docstatus": se.docstatus}


def create_dms_stock_reconciliation(data: dict) -> dict:
	_ensure_erpnext()

	company = (data.get("company") or "").strip()
	warehouse = (data.get("warehouse") or "").strip()
	posting_date = data.get("posting_date") or frappe.utils.today()
	submit = cint(data.get("submit", 1))
	lines = data.get("items") or []

	if not company:
		frappe.throw(_("Company is required."))
	if not warehouse:
		frappe.throw(_("Warehouse is required."))
	assert_dms_warehouse_allowed(warehouse, company)
	if not lines:
		frappe.throw(_("Add at least one item line."))

	defaults = get_stock_operation_defaults(company)
	expense_account = (data.get("expense_account") or defaults.get("stock_adjustment_account") or "").strip()
	if not expense_account:
		frappe.throw(
			_(
				"Stock adjustment account is not configured. Set it on DMS Settings → Company Defaults or Company master."
			)
		)

	purpose = (data.get("purpose") or "Stock Reconciliation").strip()
	if purpose not in ("Opening Stock", "Stock Reconciliation"):
		frappe.throw(_("Purpose must be Opening Stock or Stock Reconciliation."))

	doc = frappe.new_doc("Stock Reconciliation")
	doc.company = company
	doc.purpose = purpose
	doc.posting_date = posting_date
	doc.set_posting_time = 1
	doc.expense_account = expense_account
	doc.remarks = (data.get("remarks") or _("Stock reconciliation from DMS")).strip()

	_mark_dms_sparepart_stock_doc(doc)
	_apply_company_defaults_to_stock_doc(doc, company)

	for row in lines:
		item_code = (row.get("item_code") or "").strip()
		if not item_code:
			continue
		_assert_spare_part_item(item_code)
		qty = flt(row.get("qty"))
		if qty < 0:
			frappe.throw(_("Quantity cannot be negative for {0}.").format(item_code))
		line = {
			"item_code": item_code,
			"warehouse": warehouse,
			"qty": qty,
		}
		rate = flt(row.get("valuation_rate"))
		if rate > 0:
			line["valuation_rate"] = rate
		doc.append("items", line)

	if not doc.get("items"):
		frappe.throw(_("Add at least one valid item line."))

	doc.insert(ignore_permissions=True)
	if submit:
		doc.submit()

	return {"name": doc.name, "docstatus": doc.docstatus}


def create_dms_material_request(data: dict) -> dict:
	_ensure_erpnext()

	company = (data.get("company") or "").strip()
	mr_type = (data.get("material_request_type") or "Purchase").strip()
	transaction_date = (
		data.get("transaction_date") or data.get("posting_date") or frappe.utils.today()
	)
	schedule_date = data.get("schedule_date") or transaction_date
	submit = cint(data.get("submit", 1))
	lines = data.get("items") or []

	set_warehouse = (data.get("set_warehouse") or data.get("t_warehouse") or "").strip()
	set_from_warehouse = (data.get("set_from_warehouse") or data.get("s_warehouse") or "").strip()

	if not company:
		frappe.throw(_("Company is required."))
	if mr_type not in MATERIAL_REQUEST_TYPES:
		frappe.throw(_("Unsupported material request type: {0}").format(mr_type))
	if not lines:
		frappe.throw(_("Add at least one item line."))

	mr = frappe.new_doc("Material Request")
	mr.material_request_type = mr_type
	mr.company = company
	mr.transaction_date = transaction_date
	mr.schedule_date = schedule_date

	_mark_dms_sparepart_stock_doc(mr)
	_apply_company_defaults_to_stock_doc(mr, company)

	if mr_type == "Purchase":
		if not set_warehouse:
			frappe.throw(_("Target warehouse is required for Purchase material request."))
		assert_dms_warehouse_allowed(set_warehouse, company)
		mr.set_warehouse = set_warehouse
	elif mr_type == "Material Transfer":
		if not set_from_warehouse or not set_warehouse:
			frappe.throw(_("Source and target warehouses are required for Material Transfer."))
		assert_dms_warehouse_allowed(set_from_warehouse, company)
		assert_dms_warehouse_allowed(set_warehouse, company)
		if set_from_warehouse == set_warehouse:
			frappe.throw(_("Source and target warehouse must be different."))
		mr.set_from_warehouse = set_from_warehouse
		mr.set_warehouse = set_warehouse
	elif mr_type == "Material Issue":
		if not set_warehouse:
			frappe.throw(_("Warehouse is required for Material Issue."))
		assert_dms_warehouse_allowed(set_warehouse, company)
		mr.set_warehouse = set_warehouse

	for row in lines:
		item_code = (row.get("item_code") or "").strip()
		if not item_code:
			continue
		_assert_spare_part_item(item_code)
		qty = flt(row.get("qty"))
		if qty <= 0:
			frappe.throw(_("Quantity must be greater than zero for {0}.").format(item_code))

		line = {
			"item_code": item_code,
			"qty": qty,
			"schedule_date": schedule_date,
			**_material_request_line_uom_fields(item_code, qty, row.get("uom")),
		}
		if mr_type == "Purchase":
			line["warehouse"] = set_warehouse
		elif mr_type == "Material Transfer":
			line["from_warehouse"] = set_from_warehouse
			line["warehouse"] = set_warehouse
		elif mr_type == "Material Issue":
			line["warehouse"] = set_warehouse
		mr.append("items", line)

	if not mr.get("items"):
		frappe.throw(_("Add at least one valid item line."))

	mr.insert(ignore_permissions=True)
	if submit:
		mr.submit()

	return {"name": mr.name, "docstatus": mr.docstatus, "status": mr.status}


def get_dms_material_requests_list(
	limit: int = 30, offset: int = 0, search: str | None = None
) -> list[dict]:
	filters: dict = {}
	sparepart_field = _sparepart_stock_field("Material Request")
	if sparepart_field:
		filters[sparepart_field] = 1
	if search and search.strip():
		filters["name"] = ["like", f"%{search.strip()}%"]

	rows = frappe.get_all(
		"Material Request",
		filters=filters,
		fields=[
			"name",
			"material_request_type",
			"company",
			"transaction_date",
			"schedule_date",
			"docstatus",
			"status",
			"set_warehouse",
			"set_from_warehouse",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="creation desc",
	)
	for row in rows:
		if row.docstatus != 1:
			row["has_pending"] = False
			row["actions"] = []
			continue
		mr = frappe.get_doc("Material Request", row.name)
		has_pending = _mr_has_pending_items(mr)
		row["has_pending"] = has_pending
		row["actions"] = get_material_request_fulfillment_actions(row.name) if has_pending else []
	return rows


def _assert_dms_sparepart_mr(doc):
	field = _sparepart_stock_field("Material Request")
	if field and not cint(doc.get(field)):
		frappe.throw(_("This material request was not created from DMS spare-part stock."))


def _mr_item_pending_qty(row, mr_type: str) -> float:
	stock_qty = flt(row.stock_qty)
	if mr_type == "Purchase":
		return max(0.0, stock_qty - flt(row.received_qty))
	return max(0.0, stock_qty - flt(row.ordered_qty))


def _mr_has_pending_items(mr) -> bool:
	return any(_mr_item_pending_qty(row, mr.material_request_type) > 0 for row in mr.items)


def get_material_request_fulfillment_actions(mr_name: str) -> list[dict]:
	mr = frappe.get_doc("Material Request", mr_name)
	_assert_dms_sparepart_mr(mr)
	if mr.docstatus != 1 or not _mr_has_pending_items(mr):
		return []

	actions: list[dict] = []
	mr_type = mr.material_request_type
	if mr_type in ("Material Transfer", "Material Issue", "Customer Provided"):
		label = "Create Stock Entry"
		if mr_type == "Material Transfer":
			label = "Create Transfer"
		elif mr_type == "Material Issue":
			label = "Create Material Issue"
		actions.append({"action": "stock_entry", "label": label})
	if mr_type == "Purchase":
		actions.append({"action": "purchase_receipt", "label": "Create Purchase Receipt"})
	return actions


def get_dms_pending_material_requests(
	limit: int = 50, offset: int = 0, search: str | None = None
) -> list[dict]:
	sparepart_field = _sparepart_stock_field("Material Request")
	filters: dict = {"docstatus": 1}
	if sparepart_field:
		filters[sparepart_field] = 1
	if search and search.strip():
		filters["name"] = ["like", f"%{search.strip()}%"]

	candidates = frappe.get_all(
		"Material Request",
		filters=filters,
		fields=[
			"name",
			"material_request_type",
			"company",
			"transaction_date",
			"schedule_date",
			"status",
			"set_warehouse",
			"set_from_warehouse",
		],
		order_by="schedule_date asc, creation desc",
	)

	pending_rows: list[dict] = []
	for row in candidates:
		mr = frappe.get_doc("Material Request", row.name)
		if not _mr_has_pending_items(mr):
			continue
		pending_lines = sum(
			1 for item in mr.items if _mr_item_pending_qty(item, mr.material_request_type) > 0
		)
		pending_qty = sum(
			_mr_item_pending_qty(item, mr.material_request_type) for item in mr.items
		)
		pending_rows.append(
			{
				**row,
				"transaction_date": str(row.transaction_date) if row.transaction_date else None,
				"schedule_date": str(row.schedule_date) if row.schedule_date else None,
				"warehouse": row.set_warehouse,
				"from_warehouse": row.set_from_warehouse,
				"pending_lines": pending_lines,
				"pending_qty": pending_qty,
				"actions": get_material_request_fulfillment_actions(mr.name),
			}
		)

	start = int(offset)
	end = start + int(limit)
	return pending_rows[start:end]


def get_dms_material_request_detail(name: str) -> dict:
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Material Request is required."))
	if not frappe.db.exists("Material Request", name):
		frappe.throw(_("Material Request {0} does not exist.").format(frappe.bold(name)))

	mr = frappe.get_doc("Material Request", name)
	_assert_dms_sparepart_mr(mr)

	items = []
	for row in mr.items:
		pending_qty = _mr_item_pending_qty(row, mr.material_request_type)
		items.append(
			{
				"name": row.name,
				"item_code": row.item_code,
				"item_name": row.item_name or row.item_code,
				"qty": flt(row.qty),
				"stock_qty": flt(row.stock_qty),
				"ordered_qty": flt(row.ordered_qty),
				"received_qty": flt(row.received_qty),
				"pending_qty": pending_qty,
				"uom": row.uom,
				"warehouse": row.warehouse,
				"from_warehouse": row.from_warehouse,
			}
		)

	return {
		"name": mr.name,
		"material_request_type": mr.material_request_type,
		"company": mr.company,
		"transaction_date": str(mr.transaction_date) if mr.transaction_date else None,
		"schedule_date": str(mr.schedule_date) if mr.schedule_date else None,
		"status": mr.status,
		"docstatus": mr.docstatus,
		"set_warehouse": mr.set_warehouse,
		"set_from_warehouse": mr.set_from_warehouse,
		"items": items,
		"actions": get_material_request_fulfillment_actions(mr.name),
	}


def create_dms_stock_entry_from_material_request(name: str | None, submit=True) -> dict:
	_ensure_erpnext()
	from erpnext.stock.doctype.material_request.material_request import make_stock_entry

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Material Request is required."))

	mr = frappe.get_doc("Material Request", name)
	_assert_dms_sparepart_mr(mr)
	if mr.material_request_type not in ("Material Transfer", "Material Issue", "Customer Provided"):
		frappe.throw(
			_("Stock Entry cannot be created for {0} material requests.").format(mr.material_request_type)
		)
	if mr.docstatus != 1:
		frappe.throw(_("Material Request must be submitted."))
	if not _mr_has_pending_items(mr):
		frappe.throw(_("Nothing pending on this material request."))

	se = make_stock_entry(name)
	if not se.get("items"):
		frappe.throw(_("No pending items to transfer or issue."))

	_mark_dms_sparepart_stock_doc(se)
	_apply_company_defaults_to_stock_doc(se, mr.company)
	se.insert(ignore_permissions=True)
	if cint(submit):
		se.submit()

	return {
		"name": se.name,
		"docstatus": se.docstatus,
		"material_request": mr.name,
		"doctype": "Stock Entry",
	}


def create_dms_purchase_receipt_from_material_request(
	name: str | None, supplier: str | None = None, submit=True
) -> dict:
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Material Request is required."))

	mr = frappe.get_doc("Material Request", name)
	_assert_dms_sparepart_mr(mr)
	if mr.material_request_type != "Purchase":
		frappe.throw(_("Purchase Receipt can only be created from Purchase material requests."))
	if mr.docstatus != 1:
		frappe.throw(_("Material Request must be submitted."))

	lines = []
	for row in mr.items:
		pending_qty = _mr_item_pending_qty(row, mr.material_request_type)
		if pending_qty <= 0:
			continue
		warehouse = (row.warehouse or mr.set_warehouse or "").strip()
		rate = flt(row.rate)
		if rate <= 0:
			rate = flt(frappe.db.get_value("Item", row.item_code, "standard_rate"))
		lines.append(
			{
				"item_code": row.item_code,
				"qty": pending_qty,
				"rate": rate,
				"warehouse": warehouse,
				"material_request": mr.name,
				"material_request_item": row.name,
			}
		)

	if not lines:
		frappe.throw(_("Nothing pending to receive on this material request."))

	result = create_dms_purchase_receipt(
		{
			"company": mr.company,
			"supplier": supplier,
			"warehouse": mr.set_warehouse,
			"remarks": _("Purchase receipt against Material Request {0}").format(mr.name),
			"submit": submit,
			"items": lines,
		}
	)
	result["material_request"] = mr.name
	result["doctype"] = "Purchase Receipt"
	return result


def create_dms_purchase_receipt(data: dict) -> dict:
	_ensure_erpnext()

	company = (data.get("company") or "").strip() or get_default_dms_company()
	supplier = (data.get("supplier") or "").strip()
	posting_date = data.get("posting_date") or frappe.utils.today()
	submit = cint(data.get("submit", 1))
	lines = data.get("items") or []
	default_warehouse = (data.get("warehouse") or "").strip()

	if not company:
		frappe.throw(_("Company is required. Configure companies on DMS Settings."))
	if not lines:
		frappe.throw(_("Add at least one item line."))

	pr_defaults = get_purchase_receipt_defaults(company)
	supplier = resolve_dms_purchase_supplier(company, supplier)
	default_warehouse = (data.get("warehouse") or "").strip()
	if not default_warehouse:
		default_warehouse = (pr_defaults.get("default_warehouse") or "").strip()

	currency = (data.get("currency") or "").strip() or get_company_default_currency(company)
	buying_price_list = (data.get("buying_price_list") or data.get("price_list") or "").strip()
	if not buying_price_list:
		buying_price_list = get_dms_default_buying_price_list() or ""

	pr = frappe.new_doc("Purchase Receipt")
	pr.company = company
	pr.supplier = supplier
	pr.posting_date = posting_date
	pr.set_posting_time = 1
	pr.remarks = (data.get("remarks") or _("Spare parts purchase receipt from DMS")).strip()
	if pr.meta.has_field("currency") and currency:
		pr.currency = currency
	if pr.meta.has_field("buying_price_list") and buying_price_list:
		pr.buying_price_list = buying_price_list

	if pr.meta.has_field("custom_sparepart_receipt"):
		pr.custom_sparepart_receipt = 1

	_apply_company_defaults_to_stock_doc(pr, company)

	for row in lines:
		item_code = (row.get("item_code") or "").strip()
		if not item_code:
			continue
		_assert_spare_part_item(item_code)
		qty = flt(row.get("qty"))
		rate = flt(row.get("rate"))
		if qty <= 0:
			frappe.throw(_("Quantity must be greater than zero for {0}.").format(item_code))
		if rate < 0:
			frappe.throw(_("Rate cannot be negative for {0}.").format(item_code))

		warehouse = (row.get("warehouse") or default_warehouse or "").strip()
		if not warehouse:
			frappe.throw(_("Warehouse is required for {0}.").format(item_code))
		assert_dms_warehouse_allowed(warehouse, company)

		pr.append(
			"items",
			{
				"item_code": item_code,
				"qty": qty,
				"rate": rate,
				"warehouse": warehouse,
				**(
					{
						"material_request": row.get("material_request"),
						"material_request_item": row.get("material_request_item"),
					}
					if row.get("material_request")
					else {}
				),
			},
		)

	if not pr.get("items"):
		frappe.throw(_("Add at least one valid item line."))

	pr.set_missing_values()
	if pr.meta.has_field("currency") and currency:
		pr.currency = currency
	if pr.meta.has_field("buying_price_list") and buying_price_list:
		pr.buying_price_list = buying_price_list
	if not pr.supplier:
		pr.supplier = supplier
	if not pr.supplier:
		frappe.throw(
			_(
				"Supplier is required. Choose a spare-parts supplier, or set Default Supplier on DMS Settings → Company Defaults."
			)
		)
	pr.insert(ignore_permissions=True)
	if submit:
		pr.submit()

	return {"name": pr.name, "docstatus": pr.docstatus, "supplier": pr.supplier}


def search_suppliers(search: str | None = None, limit: int = 20) -> list[dict]:
	filters: dict = {"disabled": 0, **_spare_parts_supplier_filter()}
	or_filters = None
	if search and search.strip():
		term = f"%{search.strip()}%"
		or_filters = [
			["name", "like", term],
			["supplier_name", "like", term],
		]

	fields = ["name", "supplier_name"]
	if _supplier_has_spare_parts_field():
		fields.append(SPARE_PARTS_SUPPLIER_FIELD)

	return frappe.get_all(
		"Supplier",
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		limit=int(limit),
		order_by="supplier_name asc",
	)


def get_default_supplier_group() -> str:
	group = (frappe.db.get_single_value("DMS Settings", "default_supplier_group") or "").strip()
	if group and frappe.db.exists("Supplier Group", group):
		return group

	group = (frappe.db.get_single_value("Buying Settings", "supplier_group") or "").strip()
	if group and frappe.db.exists("Supplier Group", group):
		return group

	leaf = frappe.db.get_value("Supplier Group", {"is_group": 0}, "name", order_by="name asc")
	if leaf:
		return leaf

	frappe.throw(
		_("Default Supplier Group is not configured. Set it on DMS Settings or Buying Settings.")
	)


def create_dms_supplier(data: dict) -> dict:
	_ensure_erpnext()

	supplier_name = (data.get("supplier_name") or "").strip()
	supplier_group = (data.get("supplier_group") or "").strip() or get_default_supplier_group()
	supplier_type = (data.get("supplier_type") or "Company").strip() or "Company"

	if not supplier_name:
		frappe.throw(_("Supplier name is required."))

	existing = frappe.db.get_value("Supplier", {"supplier_name": supplier_name}, "name")
	if existing:
		frappe.throw(_("Supplier {0} already exists.").format(frappe.bold(existing)))

	doc = frappe.get_doc(
		{
			"doctype": "Supplier",
			"supplier_name": supplier_name,
			"supplier_group": supplier_group,
			"supplier_type": supplier_type,
		}
	)
	mobile = (data.get("mobile_no") or "").strip()
	email = (data.get("email_id") or "").strip()
	if mobile and doc.meta.has_field("mobile_no"):
		doc.mobile_no = mobile
	if email and doc.meta.has_field("email_id"):
		doc.email_id = email
	if doc.meta.has_field(SPARE_PARTS_SUPPLIER_FIELD):
		doc.set(SPARE_PARTS_SUPPLIER_FIELD, 1)

	doc.insert(ignore_permissions=True)

	return {
		"name": doc.name,
		"label": doc.supplier_name or doc.name,
		"supplier_name": doc.supplier_name or doc.name,
	}


def get_dms_purchase_receipts_list(
	limit: int = 30, offset: int = 0, search: str | None = None
) -> list[dict]:
	from dms.api.utils import add_company_filter

	filters: dict = {}
	pr_meta = frappe.get_meta("Purchase Receipt")
	if pr_meta.has_field("custom_sparepart_receipt"):
		filters["custom_sparepart_receipt"] = 1

	if search and search.strip():
		filters["name"] = ["like", f"%{search.strip()}%"]

	add_company_filter(filters)

	fields = ["name", "supplier", "company", "posting_date", "docstatus", "grand_total"]
	if pr_meta.has_field("custom_sparepart_receipt"):
		fields.append("custom_sparepart_receipt")

	return frappe.get_all(
		"Purchase Receipt",
		filters=filters,
		fields=fields,
		limit=int(limit),
		limit_start=int(offset),
		order_by="creation desc",
	)


def get_dms_purchase_receipt_detail(name: str) -> dict:
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Purchase Receipt is required."))
	if not frappe.db.exists("Purchase Receipt", name):
		frappe.throw(_("Purchase Receipt {0} does not exist.").format(frappe.bold(name)))

	frappe.has_permission("Purchase Receipt", "read", doc=name, throw=True)
	doc = frappe.get_doc("Purchase Receipt", name)

	pr_meta = frappe.get_meta("Purchase Receipt")
	if pr_meta.has_field("custom_sparepart_receipt") and not doc.get("custom_sparepart_receipt"):
		frappe.throw(_("This purchase receipt is not a DMS spare-part receipt."))

	items = []
	for row in doc.get("items") or []:
		items.append(
			{
				"item_code": row.item_code,
				"item_name": row.item_name or row.item_code,
				"qty": flt(row.qty),
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"warehouse": row.warehouse,
				"uom": row.uom or row.stock_uom,
			}
		)

	out = {
		"name": doc.name,
		"supplier": doc.supplier,
		"company": doc.company,
		"posting_date": str(doc.posting_date) if doc.posting_date else None,
		"docstatus": doc.docstatus,
		"grand_total": flt(doc.grand_total),
		"currency": doc.get("currency"),
		"buying_price_list": doc.get("buying_price_list"),
		"remarks": doc.remarks,
		"items": items,
	}
	if pr_meta.has_field("custom_sparepart_receipt"):
		out["custom_sparepart_receipt"] = doc.get("custom_sparepart_receipt")
	return out
