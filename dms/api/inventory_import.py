# Copyright (c) 2026, Mania and contributors

import frappe
from frappe import _

from dms.utils.inventory_stock_import import (
	INVENTORY_WAREHOUSE,
	_get_inventory_selling_price_list,
	create_inventory_item_prices_file_url,
	create_inventory_stock_reconciliation_file_url,
	import_inventory_stock_file_url,
)


@frappe.whitelist()
def import_inventory_stock(file_url=None):
	frappe.only_for(("System Manager", "Dealer Manager", "Spare Parts Manager"))

	file_url = (file_url or "").strip()
	if not file_url:
		frappe.throw(_("Upload an Excel file first."))

	return import_inventory_stock_file_url(file_url)


@frappe.whitelist()
def create_inventory_stock_reconciliation(file_url=None, posting_date=None, submit=1):
	frappe.only_for(("System Manager", "Dealer Manager", "Spare Parts Manager"))
	frappe.has_permission("Stock Reconciliation", "create", throw=True)

	file_url = (file_url or "").strip()
	if not file_url:
		frappe.throw(_("Upload an Excel file first."))

	return create_inventory_stock_reconciliation_file_url(
		file_url=file_url,
		posting_date=posting_date,
		submit=submit,
		warehouse=INVENTORY_WAREHOUSE,
	)


@frappe.whitelist()
def create_inventory_item_prices(file_url=None, price_list=None):
	frappe.only_for(("System Manager", "Dealer Manager", "Spare Parts Manager"))
	frappe.has_permission("Item Price", "create", throw=True)

	file_url = (file_url or "").strip()
	price_list = (price_list or "").strip() or (_get_inventory_selling_price_list() or "")
	if not file_url:
		frappe.throw(_("Upload an Excel file first."))
	if not price_list:
		frappe.throw(_("Price List is required."))

	return create_inventory_item_prices_file_url(file_url=file_url, price_list=price_list)


@frappe.whitelist()
def get_inventory_price_list_default():
	frappe.only_for(("System Manager", "Dealer Manager", "Spare Parts Manager"))
	return _get_inventory_selling_price_list()
