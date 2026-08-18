# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Post-save hook: ensure every Item's selling Item Price uses the DMS default price list."""

import frappe

from dms.dealer_management_system.utils.stock_operations import (
	get_company_default_currency,
	get_dms_default_selling_price_list,
)


def ensure_dms_item_price_after_item_save(doc, method=None):
	"""After an Item is inserted/updated, ensure its selling Item Prices use the DMS default price list.

	ERPNext auto-creates an Item Price on Selling Settings → selling_price_list when an
	Item is inserted with standard_rate. This hook runs after save and guarantees the
	Item Price is on the DMS Settings configured/default price list with the company
	default currency.
	"""
	if frappe.flags.get("skip_dms_item_price_fix"):
		return

	dms_price_list = get_dms_default_selling_price_list()
	if not dms_price_list:
		return

	company_currency = get_company_default_currency() or "ETB"

	prices = frappe.get_all(
		"Item Price",
		filters={"item_code": doc.name, "selling": 1},
		fields=["name", "price_list"],
	)
	if not prices:
		return

	# Already correct?
	if len(prices) == 1 and prices[0].price_list == dms_price_list:
		return

	# Is there already one on the DMS list?
	dms_price_name = next(
		(p.name for p in prices if p.price_list == dms_price_list), None
	)

	fixed = 0
	for price in prices:
		if price.price_list == dms_price_list:
			continue

		try:
			price_doc = frappe.get_doc("Item Price", price.name)
			if dms_price_name:
				# Another record already exists on DMS list — delete this duplicate.
				price_doc.delete(ignore_permissions=True)
			else:
				# Move this record to the DMS price list with company currency.
				price_doc.price_list = dms_price_list
				price_doc.currency = company_currency
				price_doc.save(ignore_permissions=True)
				dms_price_name = price_doc.name
				fixed += 1
		except Exception:
			frappe.log_error(
				title="DMS Item Price list fix failed",
				message=f"Item: {doc.name}\nPrice list: {price.price_list}\n{frappe.get_traceback()}",
			)

	if fixed:
		frappe.logger().info(
			f"Fixed {fixed} Item Price record(s) for {doc.name} to price list {dms_price_list}"
		)