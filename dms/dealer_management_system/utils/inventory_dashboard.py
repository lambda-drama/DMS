# Copyright (c) 2026, Mania and contributors
"""Spare-parts inventory dashboard — stock balance, ledger, and insights."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import flt, today

from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_dms_company_defaults_row,
)
from dms.dealer_management_system.utils.stock_operations import (
	_ensure_erpnext,
	get_default_dms_company,
)
from dms.utils.spare_part_auto_create import AUTO_SPARE_PART_FIELD


DEFAULT_LOW_STOCK_QTY = 5


def _auto_spare_part_item_groups() -> list[str]:
	"""Item groups flagged Auto Generate Spare Parts on Item Group."""
	if not frappe.get_meta("Item Group").has_field(AUTO_SPARE_PART_FIELD):
		return []
	return frappe.get_all(
		"Item Group",
		filters={AUTO_SPARE_PART_FIELD: 1},
		pluck="name",
		order_by="name asc",
	)


def get_inventory_dashboard_warehouse_names(company: str | None = None) -> list[str]:
	"""Workshop warehouses + company Work In Progress warehouse from DMS Settings."""
	names: set[str] = set()
	settings = frappe.get_single("DMS Settings")

	for row in settings.get("company_defaults") or []:
		if company and row.company != company:
			continue
		wh = (getattr(row, "work_in_progress", None) or "").strip()
		if wh:
			names.add(wh)

	workshop_filters: dict = {}
	if company:
		workshop_filters["company"] = company
	for wh in frappe.get_all("WorkShop", filters=workshop_filters, pluck="warehouse"):
		if wh:
			names.add(wh)

	return sorted(names)


def get_inventory_dashboard_warehouses(company: str | None = None) -> list[dict]:
	names = get_inventory_dashboard_warehouse_names(company)
	if not names:
		return []
	return frappe.get_all(
		"Warehouse",
		filters={"name": ["in", names]},
		fields=["name", "warehouse_name", "company"],
		order_by="warehouse_name asc",
	)


def _spare_part_rows(
	item_code: str | None = None,
	item_group: str | None = None,
	search: str | None = None,
) -> list[dict]:
	"""Spare Part records with linked ERP stock items (auto-generate item groups only)."""
	allowed_groups = _auto_spare_part_item_groups()
	if not allowed_groups:
		return []

	if item_group and item_group not in allowed_groups:
		return []

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

	if item_code:
		sp_filters["spare_part_item"] = item_code

	rows = frappe.get_all(
		"Spare Part",
		filters=sp_filters,
		or_filters=or_filters,
		fields=[
			"name",
			"spare_part_item",
			"item_name",
			"item_code",
			"oem_part_number",
			"minimum_stock_level",
			"selling_price",
		],
		limit=0,
		order_by="item_name asc, name asc",
	)

	out: list[dict] = []
	for sp in rows:
		erp_item = (sp.get("spare_part_item") or "").strip()
		if not erp_item:
			continue
		if not frappe.db.exists("Item", {"name": erp_item, "disabled": 0, "is_stock_item": 1}):
			continue

		item_row = frappe.db.get_value(
			"Item",
			erp_item,
			["item_name", "item_group", "stock_uom"],
			as_dict=True,
		)
		if not item_row:
			continue
		if item_row.item_group not in allowed_groups:
			continue
		if item_group and item_row.item_group != item_group:
			continue

		min_level = flt(sp.get("minimum_stock_level"))
		if min_level <= 0:
			min_level = DEFAULT_LOW_STOCK_QTY

		out.append(
			{
				"spare_part": sp.name,
				"item_code": erp_item,
				"item_name": item_row.item_name or sp.get("item_name") or erp_item,
				"item_group": item_row.item_group,
				"stock_uom": item_row.stock_uom,
				"oem_part_number": sp.get("oem_part_number"),
				"minimum_stock_level": min_level,
				"valuation_rate": flt(sp.get("selling_price")),
			}
		)
	return out


def _warehouse_scope(company: str | None, warehouse: str | None) -> list[str]:
	company = (company or "").strip() or None
	warehouse = (warehouse or "").strip() or None
	if warehouse:
		allowed = get_inventory_dashboard_warehouse_names(company)
		if allowed and warehouse not in allowed:
			frappe.throw(_("Warehouse {0} is not configured for DMS inventory.").format(frappe.bold(warehouse)))
		return [warehouse]
	return get_inventory_dashboard_warehouse_names(company)


def _balance_for_item(item_code: str, warehouses: list[str], as_on_date: str | None) -> float:
	if not warehouses:
		return 0.0
	from erpnext.stock.utils import get_stock_balance

	total = 0.0
	for wh in warehouses:
		total += flt(get_stock_balance(item_code, wh, as_on_date or None))
	return total


def get_inventory_dashboard_defaults(company: str | None = None) -> dict:
	_ensure_erpnext()
	company = (company or "").strip() or get_default_dms_company()
	warehouses = get_inventory_dashboard_warehouses(company)

	defaults_row = get_dms_company_defaults_row(company)
	default_wh = None
	if defaults_row:
		default_wh = (getattr(defaults_row, "work_in_progress", None) or "").strip() or None
	if not default_wh and warehouses:
		default_wh = warehouses[0]["name"]

	groups = _auto_spare_part_item_groups()

	companies = frappe.get_all("Company", pluck="name", order_by="name asc")
	from dms.api.utils import get_dms_companies

	dms_companies = get_dms_companies()
	if dms_companies:
		companies = [c for c in companies if c in dms_companies]

	return {
		"company": company,
		"default_warehouse": default_wh,
		"warehouses": warehouses,
		"companies": companies,
		"item_groups": groups,
		"as_on_date": today(),
	}


def get_spare_part_stock_balance(
	company: str | None = None,
	warehouse: str | None = None,
	item_code: str | None = None,
	item_group: str | None = None,
	search: str | None = None,
	as_on_date: str | None = None,
	sort_order: str = "desc",
	limit: int = 500,
) -> dict:
	_ensure_erpnext()
	frappe.has_permission("Stock Entry", "read", throw=True)

	company = (company or "").strip() or get_default_dms_company()
	warehouses = _warehouse_scope(company, warehouse)
	as_on_date = (as_on_date or today()).strip()
	sort_order = (sort_order or "desc").lower()
	if sort_order not in ("asc", "desc"):
		sort_order = "desc"

	rows = _spare_part_rows(item_code=item_code, item_group=item_group, search=search)
	result_rows = []
	low_stock_count = 0
	total_qty = 0.0

	for row in rows:
		qty = _balance_for_item(row["item_code"], warehouses, as_on_date)
		total_qty += qty
		is_low = qty <= row["minimum_stock_level"]
		if is_low:
			low_stock_count += 1
		result_rows.append(
			{
				**row,
				"qty": qty,
				"warehouse": warehouse or None,
				"warehouses": warehouses,
				"is_low_stock": is_low,
			}
		)

	result_rows.sort(key=lambda r: flt(r["qty"]), reverse=(sort_order == "desc"))
	if limit:
		result_rows = result_rows[: int(limit)]

	return {
		"rows": result_rows,
		"summary": {
			"item_count": len(result_rows),
			"total_qty": total_qty,
			"low_stock_count": low_stock_count,
			"warehouse_count": len(warehouses),
			"as_on_date": as_on_date,
		},
	}


def get_spare_part_stock_ledger(
	company: str | None = None,
	warehouse: str | None = None,
	item_code: str | None = None,
	item_group: str | None = None,
	search: str | None = None,
	from_date: str | None = None,
	to_date: str | None = None,
	limit: int = 200,
) -> dict:
	_ensure_erpnext()
	frappe.has_permission("Stock Entry", "read", throw=True)

	company = (company or "").strip() or get_default_dms_company()
	warehouses = _warehouse_scope(company, warehouse)
	to_date = (to_date or today()).strip()
	from_date = (from_date or to_date).strip()

	sp_rows = _spare_part_rows(item_code=item_code, item_group=item_group, search=search)
	item_codes = [r["item_code"] for r in sp_rows]
	if not item_codes:
		return {"rows": [], "summary": {"from_date": from_date, "to_date": to_date}}

	filters = {
		"item_code": ["in", item_codes],
		"posting_date": ["between", [from_date, to_date]],
		"is_cancelled": 0,
	}
	if company:
		filters["company"] = company
	if warehouses:
		filters["warehouse"] = ["in", warehouses]

	entries = frappe.get_all(
		"Stock Ledger Entry",
		filters=filters,
		fields=[
			"posting_date",
			"posting_time",
			"item_code",
			"warehouse",
			"actual_qty",
			"qty_after_transaction",
			"voucher_type",
			"voucher_no",
			"stock_uom",
		],
		order_by="posting_date desc, posting_time desc, creation desc",
		limit=int(limit),
	)

	item_names = {r["item_code"]: r["item_name"] for r in sp_rows}
	out = []
	for e in entries:
		out.append(
			{
				"posting_date": e.posting_date,
				"posting_time": e.posting_time,
				"item_code": e.item_code,
				"item_name": item_names.get(e.item_code) or e.item_code,
				"warehouse": e.warehouse,
				"actual_qty": flt(e.actual_qty),
				"qty_after_transaction": flt(e.qty_after_transaction),
				"voucher_type": e.voucher_type,
				"voucher_no": e.voucher_no,
				"stock_uom": e.stock_uom,
			}
		)

	return {
		"rows": out,
		"summary": {
			"from_date": from_date,
			"to_date": to_date,
			"entry_count": len(out),
		},
	}


def get_inventory_insights(
	company: str | None = None,
	warehouse: str | None = None,
	from_date: str | None = None,
	to_date: str | None = None,
	low_stock_limit: int = 25,
	consumed_limit: int = 25,
) -> dict:
	_ensure_erpnext()
	frappe.has_permission("Stock Entry", "read", throw=True)

	balance = get_spare_part_stock_balance(
		company=company,
		warehouse=warehouse,
		as_on_date=to_date or today(),
		sort_order="asc",
		limit=0,
	)
	low_stock = [r for r in balance["rows"] if r["is_low_stock"]][: int(low_stock_limit)]

	company = (company or "").strip() or get_default_dms_company()
	warehouses = _warehouse_scope(company, warehouse)
	to_date = (to_date or today()).strip()
	from_date = (from_date or to_date).strip()

	item_codes = [r["item_code"] for r in balance["rows"]]
	most_consumed: list[dict] = []
	if item_codes and warehouses:
		consumed_rows = frappe.db.sql(
			"""
			SELECT
				sle.item_code,
				SUM(ABS(sle.actual_qty)) AS consumed_qty
			FROM `tabStock Ledger Entry` sle
			WHERE sle.is_cancelled = 0
			  AND sle.actual_qty < 0
			  AND sle.item_code IN %(items)s
			  AND sle.warehouse IN %(warehouses)s
			  AND sle.posting_date BETWEEN %(from_date)s AND %(to_date)s
			  AND (%(company)s = '' OR sle.company = %(company)s)
			GROUP BY sle.item_code
			ORDER BY consumed_qty DESC
			LIMIT %(limit)s
			""",
			{
				"items": item_codes,
				"warehouses": warehouses,
				"from_date": from_date,
				"to_date": to_date,
				"company": company or "",
				"limit": int(consumed_limit),
			},
			as_dict=True,
		)
		name_map = {r["item_code"]: r["item_name"] for r in balance["rows"]}
		for row in consumed_rows:
			most_consumed.append(
				{
					"item_code": row.item_code,
					"item_name": name_map.get(row.item_code) or row.item_code,
					"consumed_qty": flt(row.consumed_qty),
				}
			)

	return {
		"low_stock": low_stock,
		"most_consumed": most_consumed,
		"summary": {
			"low_stock_count": len([r for r in balance["rows"] if r["is_low_stock"]]),
			"from_date": from_date,
			"to_date": to_date,
		},
	}
