# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import cint

from dms.api.utils import LIST_ORDER_LATEST_CREATED
from dms.dealer_management_system.utils.stock_operations import (
	SPAREPART_STOCK_FIELD,
	create_dms_material_request,
	create_dms_purchase_receipt,
	create_dms_stock_entry,
	create_dms_stock_item,
	create_dms_stock_reconciliation,
	create_dms_supplier,
	get_dms_allowed_warehouses,
	get_dms_material_request_detail,
	get_dms_material_requests_list,
	get_dms_pending_material_requests,
	get_dms_purchase_receipts_list,
	get_dms_purchase_receipt_detail,
	get_item_price_list_rate,
	get_item_uoms_for_ui,
	get_material_request_defaults,
	get_purchase_receipt_defaults,
	get_stock_item_create_defaults,
	get_stock_operation_defaults,
	search_stock_items,
	search_suppliers,
	create_dms_purchase_receipt_from_material_request,
	create_dms_stock_entry_from_material_request,
)


@frappe.whitelist()
def get_stock_operation_defaults_api(company=None):
	frappe.has_permission("Stock Entry", "read", throw=True)
	return get_stock_operation_defaults(company)


@frappe.whitelist()
def get_dms_stock_warehouses(company=None):
	frappe.has_permission("Stock Entry", "read", throw=True)
	return get_dms_allowed_warehouses(company)


@frappe.whitelist()
def search_stock_items_for_ui(search=None, warehouse=None, limit=20):
	frappe.has_permission("Stock Entry", "read", throw=True)
	return search_stock_items(search=search, warehouse=warehouse, limit=limit)


@frappe.whitelist()
def get_stock_entries(limit=30, offset=0, search=None):
	frappe.has_permission("Stock Entry", "read", throw=True)
	filters = {}
	se_meta = frappe.get_meta("Stock Entry")
	if se_meta.has_field(SPAREPART_STOCK_FIELD):
		filters[SPAREPART_STOCK_FIELD] = 1
	if search and search.strip():
		filters["name"] = ["like", f"%{search.strip()}%"]

	rows = frappe.get_all(
		"Stock Entry",
		filters=filters,
		fields=[
			"name",
			"stock_entry_type",
			"company",
			"posting_date",
			"docstatus",
			"total_outgoing_value",
			"total_incoming_value",
			"remarks",
		],
		limit=cint(limit),
		limit_start=cint(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)
	return rows


@frappe.whitelist()
def get_stock_reconciliations(limit=30, offset=0, search=None):
	frappe.has_permission("Stock Reconciliation", "read", throw=True)
	filters = {}
	sr_meta = frappe.get_meta("Stock Reconciliation")
	if sr_meta.has_field(SPAREPART_STOCK_FIELD):
		filters[SPAREPART_STOCK_FIELD] = 1
	if search and search.strip():
		filters["name"] = ["like", f"%{search.strip()}%"]

	rows = frappe.get_all(
		"Stock Reconciliation",
		filters=filters,
		fields=["name", "company", "posting_date", "docstatus", "purpose", "remarks"],
		limit=cint(limit),
		limit_start=cint(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)
	return rows


@frappe.whitelist()
def create_stock_entry(data):
	if isinstance(data, str):
		import json

		data = json.loads(data)
	frappe.has_permission("Stock Entry", "create", throw=True)
	result = create_dms_stock_entry(data or {})
	frappe.db.commit()
	return result


@frappe.whitelist()
def create_stock_reconciliation(data):
	if isinstance(data, str):
		import json

		data = json.loads(data)
	frappe.has_permission("Stock Reconciliation", "create", throw=True)
	result = create_dms_stock_reconciliation(data or {})
	frappe.db.commit()
	return result


@frappe.whitelist()
def get_item_uoms_for_ui_api(item_code=None):
	frappe.has_permission("Material Request", "read", throw=True)
	return get_item_uoms_for_ui(item_code)


@frappe.whitelist()
def get_material_request_defaults_api(company=None):
	frappe.has_permission("Material Request", "read", throw=True)
	return get_material_request_defaults(company)


@frappe.whitelist()
def get_material_requests(limit=30, offset=0, search=None):
	frappe.has_permission("Material Request", "read", throw=True)
	return get_dms_material_requests_list(limit=limit, offset=offset, search=search)


@frappe.whitelist()
def create_material_request(data):
	if isinstance(data, str):
		import json

		data = json.loads(data)
	frappe.has_permission("Material Request", "create", throw=True)
	result = create_dms_material_request(data or {})
	frappe.db.commit()
	return result


@frappe.whitelist()
def get_pending_material_requests(limit=50, offset=0, search=None):
	frappe.has_permission("Material Request", "read", throw=True)
	return get_dms_pending_material_requests(limit=limit, offset=offset, search=search)


@frappe.whitelist()
def get_material_request_detail(name=None):
	frappe.has_permission("Material Request", "read", throw=True)
	return get_dms_material_request_detail(name)


@frappe.whitelist()
def create_stock_entry_from_material_request(name=None, submit=1):
	frappe.has_permission("Stock Entry", "create", throw=True)
	result = create_dms_stock_entry_from_material_request(name, submit=cint(submit))
	frappe.db.commit()
	return result


@frappe.whitelist()
def create_purchase_receipt_from_material_request(name=None, supplier=None, submit=1):
	frappe.has_permission("Purchase Receipt", "create", throw=True)
	result = create_dms_purchase_receipt_from_material_request(
		name, supplier=supplier, submit=cint(submit)
	)
	frappe.db.commit()
	return result


@frappe.whitelist()
def get_purchase_receipt_defaults_api(company=None):
	frappe.has_permission("Purchase Receipt", "read", throw=True)
	return get_purchase_receipt_defaults(company)


@frappe.whitelist()
def get_item_price_list_rate_api(item_code=None, price_list=None):
	frappe.has_permission("Purchase Receipt", "read", throw=True)
	return {"rate": get_item_price_list_rate(item_code, price_list)}


@frappe.whitelist()
def search_suppliers_for_ui(search=None, limit=20):
	frappe.has_permission("Purchase Receipt", "read", throw=True)
	return search_suppliers(search=search, limit=limit)


@frappe.whitelist()
def create_supplier(data):
	if isinstance(data, str):
		import json

		data = json.loads(data)
	frappe.has_permission("Supplier", "create", throw=True)
	result = create_dms_supplier(data or {})
	frappe.db.commit()
	return result


@frappe.whitelist()
def get_purchase_receipts(limit=30, offset=0, search=None):
	frappe.has_permission("Purchase Receipt", "read", throw=True)
	return get_dms_purchase_receipts_list(limit=limit, offset=offset, search=search)


@frappe.whitelist()
def get_purchase_receipt_detail(name=None):
	frappe.has_permission("Purchase Receipt", "read", throw=True)
	return get_dms_purchase_receipt_detail(name)


@frappe.whitelist()
def get_stock_item_create_defaults_api():
	frappe.has_permission("Item", "create", throw=True)
	return get_stock_item_create_defaults()


@frappe.whitelist()
def create_stock_item(data):
	if isinstance(data, str):
		import json

		data = json.loads(data)
	frappe.has_permission("Item", "create", throw=True)
	result = create_dms_stock_item(data or {})
	frappe.db.commit()
	return result


@frappe.whitelist()
def create_purchase_receipt(data):
	if isinstance(data, str):
		import json

		data = json.loads(data)
	frappe.has_permission("Purchase Receipt", "create", throw=True)
	result = create_dms_purchase_receipt(data or {})
	frappe.db.commit()
	return result
