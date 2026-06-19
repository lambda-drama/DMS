# Copyright (c) 2026, Mania and contributors

import frappe

from dms.dealer_management_system.utils.inventory_dashboard import (
	get_inventory_dashboard_defaults,
	get_inventory_insights,
	get_spare_part_stock_balance,
	get_spare_part_stock_ledger,
)


@frappe.whitelist()
def get_inventory_defaults(company=None):
	frappe.has_permission("Stock Entry", "read", throw=True)
	return get_inventory_dashboard_defaults(company)


@frappe.whitelist()
def get_stock_balance_report(
	company=None,
	warehouse=None,
	item_code=None,
	item_group=None,
	search=None,
	as_on_date=None,
	sort_order="desc",
	limit=500,
):
	return get_spare_part_stock_balance(
		company=company,
		warehouse=warehouse,
		item_code=item_code,
		item_group=item_group,
		search=search,
		as_on_date=as_on_date,
		sort_order=sort_order,
		limit=int(limit or 500),
	)


@frappe.whitelist()
def get_stock_ledger_report(
	company=None,
	warehouse=None,
	item_code=None,
	item_group=None,
	search=None,
	from_date=None,
	to_date=None,
	limit=200,
):
	return get_spare_part_stock_ledger(
		company=company,
		warehouse=warehouse,
		item_code=item_code,
		item_group=item_group,
		search=search,
		from_date=from_date,
		to_date=to_date,
		limit=int(limit or 200),
	)


@frappe.whitelist()
def get_inventory_insights_report(
	company=None,
	warehouse=None,
	from_date=None,
	to_date=None,
	low_stock_limit=25,
	consumed_limit=25,
):
	return get_inventory_insights(
		company=company,
		warehouse=warehouse,
		from_date=from_date,
		to_date=to_date,
		low_stock_limit=int(low_stock_limit or 25),
		consumed_limit=int(consumed_limit or 25),
	)
