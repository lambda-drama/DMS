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
	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_item_stock_balance,
		resolve_spare_part_erp_item_code,
	)

	erp_item = resolve_spare_part_erp_item_code(spare_part)
	if not erp_item:
		return 0.0
	if not frappe.db.get_value("Item", erp_item, "is_stock_item"):
		return 0.0

	return get_dms_item_stock_balance(erp_item, warehouse)


@frappe.whitelist()
def get_spare_part_sales_defaults(company=None):
	if not (
		frappe.has_permission("Sales Invoice", "create")
		or frappe.has_permission("Sales Order", "create")
	):
		frappe.throw(_("Not permitted"), frappe.PermissionError)
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


def _vehicle_model_display_label(vehicle_model=None, vehicle_model_label=None):
	vehicle_model = (vehicle_model or "").strip()
	if vehicle_model and frappe.db.exists("Vehicle Model", vehicle_model):
		row = frappe.db.get_value(
			"Vehicle Model",
			vehicle_model,
			["name", "model_code", "model_name"],
			as_dict=True,
		)
		if row:
			return (row.get("model_code") or row.get("name") or "").strip()
	return (vehicle_model or vehicle_model_label or "").strip()


def _vehicle_remarks_suffix(vin=None, vehicle_brand=None, vehicle_model_label=None, vehicle_model=None):
	parts = []
	if vin:
		vin_number = frappe.db.get_value("VIN No", vin, "vin_number") or vin
		parts.append(_("VIN: {0}").format(vin_number))
	if vehicle_brand:
		brand_label = frappe.db.get_value("Brand", vehicle_brand, "brand") or vehicle_brand
		parts.append(_("Make: {0}").format(brand_label))
	model_text = _vehicle_model_display_label(vehicle_model, vehicle_model_label)
	if model_text:
		parts.append(_("Model: {0}").format(model_text))
	return " | ".join(parts)


@frappe.whitelist()
def search_spare_parts_for_sale(
	search=None,
	warehouse=None,
	limit=25,
	in_stock_only=0,
):
	"""Spare parts with optional warehouse stock for counter sales."""
	if not (
		frappe.has_permission("Sales Invoice", "read")
		or frappe.has_permission("Sales Order", "read")
	):
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	warehouse = (warehouse or "").strip()

	sp_filters: dict = {}
	sp_meta = frappe.get_meta("Spare Part")
	if sp_meta.has_field("discontinued"):
		sp_filters["discontinued"] = 0

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
		filters=sp_filters or None,
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

	ctx = _validate_spare_part_lines(data, check_stock=True)
	remarks = _build_spare_part_remarks(ctx, data, default_remarks=_("Spare part counter sale"))

	name = create_standalone_dms_sales_invoice(
		customer=ctx["customer"],
		company=ctx["company"],
		labour_lines=[],
		parts_lines=ctx["parts_lines"],
		warehouse=ctx["warehouse"],
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


PROFORMA_REMARKS_PREFIX = "Spare part proforma"


def _proforma_so_filters() -> dict:
	meta = frappe.get_meta("Sales Order")
	if meta.has_field("custom_spare_parts_proforma"):
		return {"custom_spare_parts_proforma": 1}
	return {"remarks": ["like", f"%{PROFORMA_REMARKS_PREFIX}%"]}


def _ensure_spare_part_proforma(so) -> None:
	meta = frappe.get_meta("Sales Order")
	if meta.has_field("custom_spare_parts_proforma"):
		if not cint(so.get("custom_spare_parts_proforma")):
			frappe.throw(_("Document {0} is not a spare part proforma.").format(frappe.bold(so.name)))
		return
	remarks = (so.get("remarks") or "").strip()
	if PROFORMA_REMARKS_PREFIX not in remarks:
		frappe.throw(_("Document {0} is not a spare part proforma.").format(frappe.bold(so.name)))


def _validate_spare_part_lines(
	data,
	*,
	check_stock: bool = True,
) -> dict:
	customer = resolve_dms_customer(data.get("customer"))
	company = (data.get("company") or "").strip() or get_default_dms_company()
	warehouse = (data.get("warehouse") or "").strip()
	parts_lines = data.get("parts") or data.get("parts_lines") or []

	if not customer:
		frappe.throw(
			_("Select a customer or configure Default Customer in DMS Settings."),
			title=_("Customer required"),
		)
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
		if check_stock and warehouse:
			available = _stock_available(spare_part, warehouse)
			if qty > available + 0.0001:
				frappe.throw(
					_("Insufficient stock for {0}: requested {1}, available {2} in {3}.").format(
						spare_part, qty, available, warehouse
					)
				)

	vin = (data.get("vehicle_vin") or data.get("vin") or "").strip()
	vehicle_model = (data.get("vehicle_model") or "").strip()
	vehicle_brand = (data.get("vehicle_brand") or data.get("vehicle_make") or "").strip()
	vehicle_model_label = (data.get("vehicle_model_label") or data.get("model_name") or "").strip()

	return {
		"customer": customer,
		"company": company,
		"warehouse": warehouse,
		"parts_lines": parts_lines,
		"vin": vin,
		"vehicle_model": vehicle_model,
		"vehicle_brand": vehicle_brand,
		"vehicle_model_label": vehicle_model_label,
	}


def _build_spare_part_remarks(ctx: dict, data, *, default_remarks: str) -> str:
	remarks = (data.get("remarks") or "").strip() or default_remarks
	vehicle_suffix = _vehicle_remarks_suffix(
		vin=ctx.get("vin"),
		vehicle_brand=ctx.get("vehicle_brand"),
		vehicle_model_label=ctx.get("vehicle_model_label"),
		vehicle_model=ctx.get("vehicle_model"),
	)
	if vehicle_suffix:
		remarks = f"{remarks}\n{vehicle_suffix}".strip()
	return remarks


@frappe.whitelist()
def list_spare_part_proformas(search=None, status=None, limit=50, offset=0):
	"""List spare part proforma documents (Sales Orders)."""
	frappe.has_permission("Sales Order", "read", throw=True)

	filters = dict(_proforma_so_filters())
	filters["docstatus"] = ["<", 2]
	if status:
		filters["status"] = status

	or_filters = None
	if search and str(search).strip():
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"customer_name": ["like", q],
			"customer": ["like", q],
		}

	total = len(
		frappe.get_all(
			"Sales Order",
			filters=filters,
			or_filters=or_filters,
			pluck="name",
			limit_page_length=0,
		)
	)

	rows = frappe.get_all(
		"Sales Order",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"customer",
			"customer_name",
			"company",
			"transaction_date",
			"delivery_date",
			"grand_total",
			"currency",
			"status",
			"docstatus",
			"per_billed",
			"modified",
		],
		order_by="modified desc",
		limit=int(limit),
		start=int(offset),
	)

	for row in rows:
		row["converted"] = flt(row.get("per_billed")) >= 100
		row["sales_order"] = row["name"]

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_spare_part_proforma(name):
	"""Proforma detail (Sales Order)."""
	frappe.has_permission("Sales Order", "read", throw=True)
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Proforma is required."))

	so = frappe.get_doc("Sales Order", name)
	_ensure_spare_part_proforma(so)
	so.check_permission("read")

	items = []
	for row in so.get("items") or []:
		sp_name = frappe.db.get_value("Spare Part", {"spare_part_item": row.item_code}, "name")
		if not sp_name:
			sp_name = frappe.db.get_value("Spare Part", row.item_code, "name")
		items.append(
			{
				"item_code": row.item_code,
				"spare_part": sp_name or row.item_code,
				"item_name": row.item_name,
				"qty": flt(row.qty),
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"warehouse": row.warehouse,
			}
		)

	linked_invoices = frappe.get_all(
		"Sales Invoice Item",
		filters={"sales_order": name, "docstatus": ["<", 2]},
		fields=["parent", "parenttype"],
		distinct=True,
	)
	invoice_names = sorted({r.parent for r in linked_invoices if r.parent})

	return {
		"name": so.name,
		"sales_order": so.name,
		"customer": so.customer,
		"customer_name": so.customer_name,
		"company": so.company,
		"transaction_date": so.transaction_date,
		"delivery_date": so.delivery_date,
		"grand_total": flt(so.grand_total),
		"currency": so.currency,
		"status": so.status,
		"docstatus": so.docstatus,
		"per_billed": flt(so.per_billed),
		"converted": flt(so.per_billed) >= 100,
		"remarks": so.remarks,
		"items": items,
		"sales_invoices": invoice_names,
	}


@frappe.whitelist()
def create_spare_part_proforma(data):
	"""Create a spare part proforma (Sales Order)."""
	if isinstance(data, str):
		data = json.loads(data)

	frappe.has_permission("Sales Order", "create", throw=True)

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_standalone_dms_sales_order,
	)

	ctx = _validate_spare_part_lines(data, check_stock=False)
	remarks = _build_spare_part_remarks(ctx, data, default_remarks=PROFORMA_REMARKS_PREFIX)

	name = create_standalone_dms_sales_order(
		customer=ctx["customer"],
		company=ctx["company"],
		parts_lines=ctx["parts_lines"],
		warehouse=ctx["warehouse"],
		currency=data.get("currency"),
		delivery_date=data.get("due_date") or data.get("delivery_date"),
		transaction_date=data.get("posting_date") or data.get("transaction_date"),
		remarks=remarks,
		submit=cint(data.get("submit", 1)),
		parts_discount=data.get("parts_discount"),
	)

	so = frappe.get_doc("Sales Order", name)
	frappe.db.commit()
	return {
		"name": so.name,
		"sales_order": so.name,
		"docstatus": so.docstatus,
		"customer": so.customer,
		"customer_name": so.customer_name,
		"grand_total": flt(so.grand_total),
		"status": so.status,
	}


@frappe.whitelist()
def convert_proforma_to_sales_invoice(name, data=None):
	"""Convert a spare part proforma (Sales Order) to Sales Invoice."""
	if isinstance(data, str):
		data = json.loads(data)
	data = data or {}

	frappe.has_permission("Sales Invoice", "create", throw=True)

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Proforma is required."))

	so = frappe.get_doc("Sales Order", name)
	_ensure_spare_part_proforma(so)
	so.check_permission("read")

	if so.docstatus != 1:
		frappe.throw(_("Submit the proforma before converting to a sales invoice."))
	if flt(so.per_billed) >= 100:
		frappe.throw(_("This proforma has already been converted to a sales invoice."))

	warehouse = (data.get("warehouse") or "").strip()
	if not warehouse:
		for row in so.get("items") or []:
			if (row.warehouse or "").strip():
				warehouse = row.warehouse.strip()
				break
	if not warehouse:
		warehouse = (get_purchase_receipt_defaults(so.company).get("default_warehouse") or "").strip()

	if warehouse:
		allowed_wh = {w["name"] for w in get_dms_allowed_warehouses(so.company)}
		if allowed_wh and warehouse not in allowed_wh:
			frappe.throw(_("Warehouse {0} is not configured for DMS stock.").format(frappe.bold(warehouse)))

		for row in so.get("items") or []:
			qty = flt(row.qty)
			if qty <= 0:
				continue
			sp = frappe.db.get_value("Spare Part", {"spare_part_item": row.item_code}, "name")
			if sp:
				available = _stock_available(sp, warehouse)
				if qty > available + 0.0001:
					frappe.throw(
						_("Insufficient stock for {0}: requested {1}, available {2} in {3}.").format(
							sp, qty, available, warehouse
						)
					)

	from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		_apply_dms_settings_dimensions_to_sales_invoice,
		_generate_invoice_no,
		mark_sales_invoice_as_dms_ui_transaction,
	)
	from dms.dealer_management_system.utils.company_letter_head import apply_company_letter_head

	si_dict = make_sales_invoice(name)
	si = frappe.get_doc(si_dict)
	if frappe.get_meta("Sales Invoice").has_field("custom_invoice_no"):
		si.custom_invoice_no = _generate_invoice_no(so.company)
	mark_sales_invoice_as_dms_ui_transaction(si)

	if data.get("posting_date"):
		si.posting_date = data.get("posting_date")
	if data.get("due_date"):
		si.due_date = data.get("due_date")

	if warehouse:
		for item in si.get("items") or []:
			if cint(frappe.db.get_value("Item", item.item_code, "is_stock_item")):
				item.warehouse = warehouse

	si.set_missing_values()
	_apply_dms_settings_dimensions_to_sales_invoice(si, so.company)
	apply_company_letter_head(si, so.company)
	si.run_method("calculate_taxes_and_totals")
	si.insert()
	submit = cint(data.get("submit", 1))
	if submit:
		si.submit()

	frappe.db.commit()
	return {
		"name": si.name,
		"docstatus": si.docstatus,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"grand_total": flt(si.grand_total),
		"status": si.status,
		"sales_order": name,
	}
