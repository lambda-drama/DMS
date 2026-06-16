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

SPARE_PARTS_SUPPLIER_FIELD = "custom_spare_parts_supplier_"
SPAREPART_STOCK_FIELD = "custom_sparepart_stock"


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
		"companies": get_dms_companies(),
		**get_stock_item_create_defaults(),
	}


def _apply_company_defaults_to_stock_doc(doc, company: str | None):
	row = get_dms_company_defaults_row(company)
	if not row:
		return
	for field in ("branch", "cost_center", "project"):
		val = getattr(row, field, None)
		if val and doc.meta.has_field(field):
			doc.set(field, val)


def _mark_dms_sparepart_stock_doc(doc):
	if doc.meta.has_field(SPAREPART_STOCK_FIELD):
		doc.set(SPAREPART_STOCK_FIELD, 1)


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
	if not supplier:
		supplier = (pr_defaults.get("default_supplier") or "").strip()
	if not default_warehouse:
		default_warehouse = (pr_defaults.get("default_warehouse") or "").strip()

	_assert_spare_parts_supplier(supplier)

	pr = frappe.new_doc("Purchase Receipt")
	pr.company = company
	if supplier:
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
			},
		)

	if not pr.get("items"):
		frappe.throw(_("Add at least one valid item line."))

	pr.set_missing_values()
	if not pr.supplier:
		frappe.throw(
			_(
				"Supplier is required. Select a spare-parts supplier or set Default Supplier on DMS Settings or Company Defaults."
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
