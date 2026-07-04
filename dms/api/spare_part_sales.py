# Copyright (c) 2026, Mania and contributors
# Spare part counter sales — walk-in customers purchasing parts without service.

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	spare_part_default_selling_price,
	spare_part_erp_item_code,
)
from dms.api.utils import get_dms_default_customer, resolve_dms_customer
from dms.dealer_management_system.utils.stock_operations import (
	get_default_dms_company,
	get_dms_allowed_warehouses,
	get_purchase_receipt_defaults,
)


def _stock_available(spare_part: str, warehouse: str | None) -> float:
	erp_item = spare_part_erp_item_code(spare_part)
	if not erp_item or not warehouse:
		return 0.0
	if not frappe.db.get_value("Item", erp_item, "is_stock_item"):
		return 0.0
	from erpnext.stock.utils import get_stock_balance

	return flt(get_stock_balance(erp_item, warehouse))


@frappe.whitelist()
def get_spare_part_sales_defaults(company=None):
	frappe.has_permission("Sales Invoice", "create", throw=True)
	defaults = get_purchase_receipt_defaults(company)
	default_customer = get_dms_default_customer()
	customer_name = None
	if default_customer:
		customer_name = frappe.db.get_value("Customer", default_customer, "customer_name")
	return {
		"company": defaults.get("company"),
		"default_warehouse": defaults.get("default_warehouse"),
		"warehouses": defaults.get("warehouses") or [],
		"companies": defaults.get("companies") or [],
		"default_customer": default_customer,
		"default_customer_name": customer_name or default_customer,
	}


@frappe.whitelist()
def search_spare_parts_for_sale(search=None, warehouse=None, limit=25, in_stock_only=0):
	"""Spare parts with optional warehouse stock for counter sales."""
	frappe.has_permission("Sales Invoice", "read", throw=True)

	warehouse = (warehouse or "").strip()
	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"item_name": ["like", f"%{search}%"],
			"item_code": ["like", f"%{search}%"],
			"oem_part_number": ["like", f"%{search}%"],
			"bin_location": ["like", f"%{search}%"],
		}

	parts = frappe.get_all(
		"Spare Part",
		or_filters=or_filters if or_filters else None,
		fields=["name", "item_name", "item_code", "part_category", "oem_part_number", "selling_price", "bin_location"],
		limit=int(limit),
		order_by="item_name asc",
	)

	out = []
	for row in parts:
		qty_on_hand = _stock_available(row.name, warehouse) if warehouse else None
		if cint(in_stock_only) and warehouse and flt(qty_on_hand) <= 0:
			continue
		unit_price = flt(row.selling_price) or spare_part_default_selling_price(row.name)
		out.append(
			{
				"name": row.name,
				"item_name": row.item_name,
				"item_code": row.item_code,
				"part_category": row.part_category,
				"oem_part_number": row.oem_part_number,
				"bin_location": row.bin_location,
				"unit_price": unit_price,
				"qty_on_hand": qty_on_hand,
				"erp_item": spare_part_erp_item_code(row.name),
			}
		)
	return out


@frappe.whitelist()
def create_spare_part_sale(data):
	"""Create and submit a Sales Invoice for walk-in spare part sales."""
	if isinstance(data, str):
		data = json.loads(data)

	frappe.has_permission("Sales Invoice", "create", throw=True)

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_standalone_dms_sales_invoice,
	)

	customer = resolve_dms_customer(data.get("customer"))
	company = (data.get("company") or "").strip() or get_default_dms_company()
	warehouse = (data.get("warehouse") or "").strip()
	parts_lines = data.get("parts") or data.get("parts_lines") or []

	if not customer:
		frappe.throw(_("Customer is required."))
	if not parts_lines:
		frappe.throw(_("Add at least one spare part line."))

	allowed_wh = {w["name"] for w in get_dms_allowed_warehouses(company)}
	if warehouse and allowed_wh and warehouse not in allowed_wh:
		frappe.throw(_("Warehouse {0} is not configured for DMS stock.").format(frappe.bold(warehouse)))

	for row in parts_lines:
		spare_part = (row.get("spare_part") or row.get("item_code") or "").strip()
		if not spare_part:
			continue
		qty = flt(row.get("qty") or row.get("quantity") or 0)
		if qty <= 0:
			frappe.throw(_("Quantity must be greater than zero for {0}.").format(spare_part))
		if warehouse:
			available = _stock_available(spare_part, warehouse)
			if qty > available + 0.0001:
				frappe.throw(
					_("Insufficient stock for {0}: requested {1}, available {2} in {3}.").format(
						spare_part, qty, available, warehouse
					)
				)

	remarks = (data.get("remarks") or "").strip()
	if not remarks:
		remarks = _("Spare part counter sale")

	name = create_standalone_dms_sales_invoice(
		customer=customer,
		company=company,
		labour_lines=[],
		parts_lines=parts_lines,
		warehouse=warehouse,
		currency=data.get("currency"),
		due_date=data.get("due_date"),
		posting_date=data.get("posting_date"),
		remarks=remarks,
		submit=cint(data.get("submit", 1)),
		parts_discount=data.get("parts_discount"),
	)

	si = frappe.get_doc("Sales Invoice", name)
	frappe.db.commit()
	return {
		"name": si.name,
		"docstatus": si.docstatus,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"grand_total": flt(si.grand_total),
		"status": si.status,
	}
