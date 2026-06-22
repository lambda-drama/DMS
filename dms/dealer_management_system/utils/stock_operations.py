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


def get_dms_allowed_warehouse_names(company: str | None = None) -> list[str]:
	"""Warehouses configured for DMS stock operations for a company."""
	names: set[str] = set()
	settings = frappe.get_single("DMS Settings")

	for row in settings.get("company_defaults") or []:
		if company and row.company != company:
			continue
		for fieldname in ("work_in_progress", "parts_warehouse", "purchase_receipt_warehouse"):
			wh = (getattr(row, fieldname, None) or "").strip()
			if wh:
				names.add(wh)

	workshop_filters: dict = {}
	if company:
		workshop_filters["company"] = company
	for wh in frappe.get_all("WorkShop", filters=workshop_filters, pluck="warehouse"):
		if wh:
			names.add(wh)

	if frappe.get_meta("Warehouse").has_field("custom_is_dms_warehouse"):
		wh_filters: dict = {"custom_is_dms_warehouse": 1}
		if company:
			wh_filters["company"] = company
		for wh in frappe.get_all("Warehouse", filters=wh_filters, pluck="name"):
			names.add(wh)

	return sorted(names)


def get_dms_allowed_warehouses(company: str | None = None) -> list[dict]:
	names = get_dms_allowed_warehouse_names(company)
	if not names:
		return []
	return frappe.get_all(
		"Warehouse",
		filters={"name": ["in", names]},
		fields=["name", "warehouse_name", "company"],
		order_by="warehouse_name asc",
	)


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


def get_stock_item_create_defaults() -> dict:
	item_group = get_dms_default_item_group()
	return {
		"default_item_group": item_group or None,
		"auto_create_spare_parts": bool(
			item_group and item_group_auto_generates_spare_parts(item_group)
		),
	}


def create_dms_stock_item(data: dict) -> dict:
	_ensure_erpnext()

	item_code = (data.get("item_code") or "").strip()
	item_name = (data.get("item_name") or item_code).strip()
	rate = flt(data.get("standard_rate") or data.get("rate"))
	item_group = (data.get("item_group") or "").strip() or get_dms_default_item_group()
	stock_uom = (data.get("stock_uom") or "Nos").strip() or "Nos"

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

	item = frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": item_name,
			"item_group": item_group,
			"stock_uom": stock_uom,
			"is_stock_item": 1,
			"is_purchase_item": 1,
			"is_sales_item": 1,
			"include_item_in_manufacturing": 0,
			"standard_rate": rate,
		}
	)
	item.insert(ignore_permissions=True)

	spare_part_name = frappe.db.get_value("Spare Part", {"spare_part_item": item.name}, "name")
	if not spare_part_name:
		try_create_spare_part_from_item(item, show_message=False)
		spare_part_name = frappe.db.get_value("Spare Part", {"spare_part_item": item.name}, "name")

	if rate > 0 and spare_part_name:
		frappe.db.set_value("Spare Part", spare_part_name, "selling_price", rate)

	return {
		"name": item.name,
		"label": item.item_name or item.name,
		"item_code": item.name,
		"item_name": item.item_name or item.name,
		"standard_rate": rate,
		"spare_part": spare_part_name,
		"item_group": item_group,
	}


def get_purchase_receipt_defaults(company: str | None = None) -> dict:
	company = (company or "").strip() or get_default_dms_company()
	defaults_row = get_dms_company_defaults_row(company)
	allowed = get_dms_allowed_warehouses(company)

	default_warehouse = None
	if defaults_row:
		default_warehouse = (
			(getattr(defaults_row, "purchase_receipt_warehouse", None) or "").strip()
			or (getattr(defaults_row, "parts_warehouse", None) or "").strip()
			or (getattr(defaults_row, "work_in_progress", None) or "").strip()
		)
	default_supplier = get_dms_default_supplier(company)
	if not default_warehouse and allowed:
		default_warehouse = allowed[0]["name"]

	return {
		"company": company,
		"default_warehouse": default_warehouse,
		"default_supplier": default_supplier,
		"default_supplier_group": (frappe.db.get_single_value("DMS Settings", "default_supplier_group") or "").strip() or None,
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

	default_warehouse = None
	if defaults_row:
		default_warehouse = (
			(getattr(defaults_row, "parts_warehouse", None) or "").strip()
			or (getattr(defaults_row, "work_in_progress", None) or "").strip()
		)
	if not default_warehouse and allowed:
		default_warehouse = allowed[0]["name"]

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


def _stock_item_balance(item_code: str, warehouse: str | None) -> float:
	if not item_code or not warehouse:
		return 0.0
	from erpnext.stock.utils import get_stock_balance

	return flt(get_stock_balance(item_code, warehouse))


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

	doc = frappe.new_doc("Stock Reconciliation")
	doc.company = company
	doc.purpose = "Stock Reconciliation"
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

	pr = frappe.new_doc("Purchase Receipt")
	pr.company = company
	pr.supplier = supplier
	pr.posting_date = posting_date
	pr.set_posting_time = 1
	pr.remarks = (data.get("remarks") or _("Spare parts purchase receipt from DMS")).strip()

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
		"remarks": doc.remarks,
		"items": items,
	}
	if pr_meta.has_field("custom_sparepart_receipt"):
		out["custom_sparepart_receipt"] = doc.get("custom_sparepart_receipt")
	return out
