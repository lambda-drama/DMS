# Copyright (c) 2026, Mania and contributors
"""DMS Orders — customer orders (Sales Orders) for spare parts that are not in stock.

Flow: place the order now (stock is *not* required), record a payment / advance
against it, and raise the Sales Invoice later from the order.

Orders are their own family of Sales Orders, kept apart from the spare part
proformas by the ``custom_dms_order`` flag.
"""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint, flt, fmt_money

from dms.api.spare_part_sales import (
	_build_spare_part_remarks,
	_stock_available,
	_validate_spare_part_lines,
)
from dms.api.utils import apply_date_range

ORDER_REMARKS_PREFIX = "DMS Order"
ORDER_FLAG_FIELD = "custom_dms_order"
PROFORMA_FLAG_FIELD = "custom_spare_parts_proforma"


def _parse_data(value) -> dict:
	if isinstance(value, str):
		value = json.loads(value) if value else {}
	return value or {}


def ensure_sales_order_dms_order_field() -> None:
	"""Ensure Sales Order carries the DMS Order flag (runtime field, like the VIN link)."""
	if frappe.db.exists("Custom Field", {"dt": "Sales Order", "fieldname": ORDER_FLAG_FIELD}):
		return

	from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

	create_custom_fields(
		{
			"Sales Order": [
				{
					"fieldname": ORDER_FLAG_FIELD,
					"label": "DMS Order",
					"fieldtype": "Check",
					"insert_after": PROFORMA_FLAG_FIELD,
					"read_only": 1,
					"no_copy": 1,
					"print_hide": 1,
				}
			]
		},
		update=True,
	)


def mark_sales_order_as_dms_order(so) -> None:
	"""Flag a Sales Order as a DMS order and detach it from the proforma family."""
	ensure_sales_order_dms_order_field()
	meta = frappe.get_meta("Sales Order")
	values: dict = {}
	if meta.has_field(ORDER_FLAG_FIELD):
		values[ORDER_FLAG_FIELD] = 1
	if meta.has_field(PROFORMA_FLAG_FIELD):
		# The shared Sales Order builder flags every document it builds as a spare
		# part proforma; a DMS order is its own family, so that flag is cleared.
		values[PROFORMA_FLAG_FIELD] = 0
	if not values:
		return
	frappe.db.set_value("Sales Order", so.name, values, update_modified=False)
	so.reload()


def _order_so_filters() -> dict:
	ensure_sales_order_dms_order_field()
	meta = frappe.get_meta("Sales Order")
	if meta.has_field(ORDER_FLAG_FIELD):
		return {ORDER_FLAG_FIELD: 1}
	if meta.has_field("remarks"):
		return {"remarks": ["like", f"%{ORDER_REMARKS_PREFIX}%"]}
	return {}


def _ensure_dms_order(so) -> None:
	meta = frappe.get_meta("Sales Order")
	if meta.has_field(ORDER_FLAG_FIELD):
		if not cint(so.get(ORDER_FLAG_FIELD)):
			frappe.throw(_("Document {0} is not a DMS order.").format(frappe.bold(so.name)))
		return
	if meta.has_field("remarks") and ORDER_REMARKS_PREFIX not in (so.get("remarks") or ""):
		frappe.throw(_("Document {0} is not a DMS order.").format(frappe.bold(so.name)))


def _load_order(name) -> frappe.model.document.Document:
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Order is required."))

	so = frappe.get_doc("Sales Order", name)
	_ensure_dms_order(so)
	so.check_permission("read")
	return so


def _company_currency(company: str | None) -> str | None:
	"""Company default currency — keeps order/invoice aligned with the ledger accounts."""
	company = (company or "").strip()
	if not company:
		return None
	return frappe.db.get_value("Company", company, "default_currency") or None


def _order_builder_kwargs(ctx: dict, data: dict) -> dict:
	"""Payload shared by create / update of an order Sales Order."""
	return {
		"customer": ctx["customer"],
		"company": ctx["company"],
		"labour_lines": ctx.get("labour_lines") or [],
		"parts_lines": ctx["parts_lines"],
		"warehouse": ctx["warehouse"],
		"currency": data.get("currency") or _company_currency(ctx["company"]),
		"delivery_date": data.get("delivery_date") or data.get("due_date"),
		"transaction_date": data.get("posting_date") or data.get("transaction_date"),
		"remarks": _build_spare_part_remarks(ctx, data, default_remarks=ORDER_REMARKS_PREFIX),
		"labour_discount": data.get("labour_discount"),
		"parts_discount": data.get("parts_discount"),
		"vehicle_vin": ctx.get("vin"),
		# Include VAT toggle — tri-state so a payload without the key (older clients)
		# keeps ERPNext's default tax handling.
		"apply_taxes": (
			bool(cint(data.get("apply_taxes"))) if "apply_taxes" in data else None
		),
	}


@frappe.whitelist()
def list_dms_orders(
	search=None,
	status=None,
	customer=None,
	limit=50,
	offset=0,
	from_date=None,
	to_date=None,
):
	"""List DMS orders (Sales Orders), newest first."""
	frappe.has_permission("Sales Order", "read", throw=True)

	filters = dict(_order_so_filters())
	if status:
		filters["status"] = status
	customer = (customer or "").strip()
	if customer:
		filters["customer"] = customer
	apply_date_range(filters, "transaction_date", from_date, to_date)

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
			"advance_paid",
			"modified",
		],
		order_by="modified desc",
		limit=int(limit),
		start=int(offset),
	)

	for row in rows:
		row["advance_paid"] = flt(row.get("advance_paid"))
		row["balance"] = max(flt(row.get("grand_total")) - row["advance_paid"], 0)
		row["converted"] = flt(row.get("per_billed")) >= 100
		row["sales_order"] = row["name"]

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_dms_order(name):
	"""Order detail: lines, payments recorded against it, linked invoices."""
	frappe.has_permission("Sales Order", "read", throw=True)
	so = _load_order(name)

	item_codes = [row.item_code for row in (so.get("items") or []) if row.item_code]
	spare_part_map: dict[str, str] = {}
	if item_codes:
		spare_part_map = {
			row.spare_part_item: row.name
			for row in frappe.get_all(
				"Spare Part",
				filters={"spare_part_item": ["in", item_codes]},
				fields=["name", "spare_part_item"],
				limit=len(item_codes),
			)
			if row.spare_part_item
		}

	# Labour lines are the Vehicle Service Item rows; everything else is a part.
	vsi_meta = (
		frappe.get_meta("Vehicle Service Item")
		if frappe.db.exists("DocType", "Vehicle Service Item")
		else None
	)
	vsi_item_field = None
	if vsi_meta:
		if vsi_meta.has_field("custom_erpnext_item"):
			vsi_item_field = "custom_erpnext_item"
		else:
			for df in vsi_meta.fields:
				if df.fieldtype == "Link" and df.options == "Item":
					vsi_item_field = df.fieldname
					break

	items = []
	parts = []
	labour = []
	warehouse = ""
	for row in so.get("items") or []:
		warehouse = warehouse or (row.warehouse or "")
		spare_part = spare_part_map.get(row.item_code)
		if not spare_part:
			spare_part = frappe.db.get_value("Spare Part", row.item_code, "name")

		vsi_name = None
		if not spare_part and vsi_item_field:
			vsi_name = frappe.db.get_value(
				"Vehicle Service Item", {vsi_item_field: row.item_code}, "name"
			)

		# Display Name typed on the order line → Sales Order Item description.
		description = (row.get("description") or "").strip()

		items.append(
			{
				"spare_part": spare_part or row.item_code,
				"item_code": row.item_code,
				"item_name": row.item_name,
				"description": description,
				"qty": flt(row.qty),
				"billed_qty": flt(row.get("billed_qty")),
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"warehouse": row.warehouse,
			}
		)

		if spare_part:
			parts.append(
				{
					"spare_part": spare_part,
					"item_code": row.item_code,
					"item_name": row.item_name,
					"description": description,
					"qty": flt(row.qty),
					"rate": flt(row.rate),
					"amount": flt(row.amount),
					"warehouse": row.warehouse,
				}
			)
		elif vsi_name:
			label = row.item_name or vsi_name
			if vsi_meta and vsi_meta.has_field("custom_item_name"):
				label = (
					frappe.db.get_value("Vehicle Service Item", vsi_name, "custom_item_name")
					or label
				)
			labour.append(
				{
					"vehicle_service_item": vsi_name,
					"vehicle_service_item_name": label,
					"description": description,
					"hours": flt(row.qty),
					"rate_per_hour": flt(row.rate),
					"amount": flt(row.amount),
				}
			)
		elif not cint(frappe.db.get_value("Item", row.item_code, "is_stock_item")):
			labour.append(
				{
					"vehicle_service_item": row.item_code,
					"vehicle_service_item_name": row.item_name or row.item_code,
					"description": description,
					"hours": flt(row.qty),
					"rate_per_hour": flt(row.rate),
					"amount": flt(row.amount),
				}
			)
		else:
			parts.append(
				{
					"spare_part": spare_part or row.item_code,
					"item_code": row.item_code,
					"item_name": row.item_name,
					"description": description,
					"qty": flt(row.qty),
					"rate": flt(row.rate),
					"amount": flt(row.amount),
					"warehouse": row.warehouse,
				}
			)

	payments: list[dict] = []
	references = frappe.get_all(
		"Payment Entry Reference",
		filters={
			"reference_doctype": "Sales Order",
			"reference_name": so.name,
			"parenttype": "Payment Entry",
			"docstatus": ["<", 2],
		},
		fields=["parent", "allocated_amount"],
		limit_page_length=0,
	)
	if references:
		pe_names = [row.parent for row in references if row.parent]
		pe_map = {
			row.name: row
			for row in frappe.get_all(
				"Payment Entry",
				filters={"name": ["in", pe_names]},
				fields=[
					"name",
					"posting_date",
					"mode_of_payment",
					"paid_amount",
					"reference_no",
					"docstatus",
				],
				limit=len(pe_names),
			)
		}
		for ref in references:
			pe = pe_map.get(ref.parent)
			if not pe:
				continue
			payments.append(
				{
					"name": pe.name,
					"posting_date": pe.posting_date,
					"mode_of_payment": pe.mode_of_payment,
					"paid_amount": flt(pe.paid_amount),
					"allocated_amount": flt(ref.allocated_amount),
					"reference_no": pe.reference_no,
					"docstatus": pe.docstatus,
				}
			)
	payments.sort(key=lambda row: str(row.get("posting_date") or ""))

	invoice_rows = frappe.get_all(
		"Sales Invoice Item",
		filters={"sales_order": so.name, "docstatus": ["<", 2]},
		fields=["parent"],
		distinct=True,
		limit_page_length=0,
	)
	invoice_names = sorted({row.parent for row in invoice_rows if row.parent})

	remarks = (so.get("remarks") or "").strip() if frappe.get_meta("Sales Order").has_field("remarks") else ""
	if remarks.startswith(ORDER_REMARKS_PREFIX):
		remarks = remarks[len(ORDER_REMARKS_PREFIX) :].lstrip("\n ").strip()

	advance_paid = flt(so.get("advance_paid"))
	grand_total = flt(so.grand_total)

	return {
		"name": so.name,
		"sales_order": so.name,
		"customer": so.customer,
		"customer_name": so.customer_name,
		"company": so.company,
		"warehouse": warehouse or None,
		"transaction_date": so.transaction_date,
		"delivery_date": so.delivery_date,
		"net_total": flt(so.net_total),
		"total_taxes_and_charges": flt(so.total_taxes_and_charges),
		"grand_total": grand_total,
		"currency": so.currency,
		# Order VAT choice as saved on the Sales Order (has tax rows).
		"apply_taxes": 1 if (so.get("taxes") or []) else 0,
		"status": so.status,
		"docstatus": so.docstatus,
		"per_billed": flt(so.per_billed),
		"converted": flt(so.per_billed) >= 100,
		"advance_paid": advance_paid,
		"balance": max(grand_total - advance_paid, 0),
		"remarks": remarks or None,
		"items": items,
		"parts": parts,
		"labour": labour,
		"payments": payments,
		"sales_invoices": invoice_names,
	}


def _order_summary(so) -> dict:
	so.reload()
	return {
		"name": so.name,
		"sales_order": so.name,
		"docstatus": so.docstatus,
		"customer": so.customer,
		"customer_name": so.customer_name,
		"net_total": flt(so.net_total),
		"total_taxes_and_charges": flt(so.total_taxes_and_charges),
		"grand_total": flt(so.grand_total),
		"advance_paid": flt(so.get("advance_paid")),
		"balance": max(flt(so.grand_total) - flt(so.get("advance_paid")), 0),
		"status": so.status,
	}


@frappe.whitelist()
def create_dms_order(data=None):
	"""Create a DMS order (Sales Order). Stock is not required — that is the point."""
	data = _parse_data(data)
	frappe.has_permission("Sales Order", "create", throw=True)

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_standalone_dms_sales_order,
	)

	# No stock gate while ordering: the invoice step is where stock is checked.
	ctx = _validate_spare_part_lines(data, check_stock=False)
	name = create_standalone_dms_sales_order(
		submit=False,
		**_order_builder_kwargs(ctx, data),
	)

	so = frappe.get_doc("Sales Order", name)
	mark_sales_order_as_dms_order(so)
	if cint(data.get("submit", 1)):
		so.submit()

	frappe.db.commit()
	return _order_summary(so)


@frappe.whitelist()
def update_dms_order(data=None):
	"""Update a draft DMS order, optionally submitting it."""
	data = _parse_data(data)
	name = (data.get("name") or data.get("sales_order") or "").strip()
	if not name:
		frappe.throw(_("Order is required."))

	so = _load_order(name)
	if so.docstatus != 0:
		frappe.throw(_("Only draft orders can be edited."))
	so.check_permission("write")

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		update_standalone_dms_sales_order,
	)

	ctx = _validate_spare_part_lines(data, check_stock=False)
	updated = update_standalone_dms_sales_order(
		name=name,
		submit=False,
		**_order_builder_kwargs(ctx, data),
	)

	so = frappe.get_doc("Sales Order", updated)
	mark_sales_order_as_dms_order(so)
	if cint(data.get("submit", 0)):
		so.submit()

	frappe.db.commit()
	return _order_summary(so)


@frappe.whitelist()
def submit_dms_order(name):
	"""Submit a draft DMS order."""
	so = _load_order(name)
	if so.docstatus != 0:
		frappe.throw(_("Only draft orders can be submitted."))
	so.check_permission("submit")
	so.submit()
	frappe.db.commit()
	return _order_summary(so)


@frappe.whitelist()
def cancel_dms_order(name):
	"""Cancel a submitted DMS order that has no invoice yet."""
	so = _load_order(name)
	if so.docstatus != 1:
		frappe.throw(_("Only submitted orders can be cancelled."))
	if flt(so.per_billed) >= 100:
		frappe.throw(_("This order has already been invoiced."))
	so.check_permission("cancel")
	so.cancel()
	frappe.db.commit()
	so.reload()
	return {"name": so.name, "sales_order": so.name, "docstatus": so.docstatus, "status": so.status}


@frappe.whitelist()
def delete_draft_dms_order(name):
	"""Permanently delete a draft DMS order."""
	so = _load_order(name)
	if so.docstatus != 0:
		frappe.throw(_("Only draft orders can be deleted. Cancel submitted orders instead."))
	so.check_permission("delete")
	frappe.delete_doc("Sales Order", so.name, force=1)
	frappe.db.commit()
	return {"deleted": so.name}


@frappe.whitelist()
def record_dms_order_payment(name, data=None):
	"""Record a customer payment / advance against a submitted order.

	Accepts the same payload as invoice collection: ``payments`` rows
	(``{mode_of_payment, amount, reference_no?, remarks?}``) create one Payment Entry
	per mode of payment, or the legacy single ``amount`` / ``mode_of_payment`` args.
	Each entry is referenced to the Sales Order, so ERPNext counts it as
	``advance_paid`` and can allocate it once the invoice is raised.
	"""
	data = _parse_data(data)
	frappe.has_permission("Payment Entry", "create", throw=True)

	so = _load_order(name)
	if so.docstatus != 1:
		frappe.throw(_("Submit the order before recording a payment."))
	if flt(so.per_billed) >= 100:
		frappe.throw(_("This order is fully invoiced — collect against the invoice instead."))

	from dms.api.payment_entries import DMS_FLAG_FIELD, _advance_payment_rows

	# Same payload as invoice collection: `payments` rows (one per mode of payment) or
	# the legacy single amount / mode args.
	rows = _advance_payment_rows(data)

	from erpnext.accounts.doctype.payment_entry.payment_entry import (
		get_bank_cash_account,
		get_payment_entry,
	)

	pe_meta = frappe.get_meta("Payment Entry")
	posting_date = data.get("posting_date")
	header_remarks = (data.get("remarks") or "").strip()
	order_total = flt(so.grand_total)

	created: list[str] = []
	paid_total = 0.0

	for row in rows:
		so.reload()
		balance = max(order_total - flt(so.get("advance_paid")), 0)
		row_amount = flt(row.get("amount"))
		if balance <= 0:
			frappe.throw(_("This order is already fully paid."))
		if row_amount > balance + 0.0001:
			frappe.throw(
				_("Payment {0} is more than the order balance {1}.").format(
					frappe.bold(fmt_money(row_amount, currency=so.currency)),
					frappe.bold(fmt_money(balance, currency=so.currency)),
				)
			)

		pe = get_payment_entry("Sales Order", so.name)
		if isinstance(pe, dict):
			pe = frappe.get_doc(pe)

		pe.set_posting_time = 1
		if posting_date:
			pe.posting_date = posting_date

		mode = (row.get("mode_of_payment") or "").strip()
		if mode:
			pe.mode_of_payment = mode
		if row.get("reference_no"):
			pe.reference_no = row["reference_no"]

		# Point paid_to at the account configured for this mode of payment.
		try:
			account = (get_bank_cash_account(pe, None) or {}).get("account")
			if account and pe.payment_type == "Receive":
				pe.paid_to = account
		except Exception:
			pass

		pe.paid_amount = row_amount
		pe.received_amount = row_amount
		# Allocate against the order's own per-reference outstanding (payment terms can
		# differ from grand_total by a rounding cent) — any excess stays unallocated on
		# the entry, exactly like the invoice collection flow.
		for ref in pe.get("references") or []:
			ref_outstanding = flt(ref.get("outstanding_amount")) or flt(ref.get("total_amount"))
			ref.allocated_amount = (
				min(row_amount, ref_outstanding) if ref_outstanding > 0 else row_amount
			)
			break

		row_remarks = (row.get("remarks") or "").strip() or header_remarks
		if row_remarks and pe_meta.has_field("custom_dms_remarks"):
			pe.set("custom_dms_remarks", row_remarks)
		if pe_meta.has_field(DMS_FLAG_FIELD):
			pe.set(DMS_FLAG_FIELD, 1)

		pe.insert()
		pe.submit()
		created.append(pe.name)
		paid_total += row_amount

	if not created:
		frappe.throw(_("No payment entries were created."))

	frappe.db.commit()
	so.reload()
	paid = flt(so.get("advance_paid"))
	return {
		"payment_entry": created[0],
		"payment_entries": created,
		"paid_amount": paid_total,
		"grand_total": order_total,
		"advance_paid": paid,
		"balance": max(order_total - paid, 0),
		"mode_of_payment": rows[0].get("mode_of_payment") if rows else None,
	}


@frappe.whitelist()
def create_dms_order_invoice(name, data=None):
	"""Raise the Sales Invoice for an order — stock is checked here, not at ordering."""
	data = _parse_data(data)
	frappe.has_permission("Sales Invoice", "create", throw=True)

	so = _load_order(name)
	if so.docstatus != 1:
		frappe.throw(_("Submit the order before creating its invoice."))
	if flt(so.per_billed) >= 100:
		frappe.throw(_("This order has already been invoiced."))

	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_allowed_warehouses,
		get_purchase_receipt_defaults,
	)

	warehouse = (data.get("warehouse") or "").strip()
	if not warehouse:
		for row in so.get("items") or []:
			if (row.warehouse or "").strip():
				warehouse = row.warehouse.strip()
				break
	if not warehouse:
		warehouse = (get_purchase_receipt_defaults(so.company).get("default_warehouse") or "").strip()

	if warehouse:
		allowed = {w["name"] for w in get_dms_allowed_warehouses(so.company)}
		if allowed and warehouse not in allowed:
			frappe.throw(
				_("Warehouse {0} is not configured for DMS stock.").format(frappe.bold(warehouse))
			)

	for row in so.get("items") or []:
		qty = flt(row.qty) - flt(row.get("billed_qty"))
		if qty <= 0:
			continue
		spare_part = frappe.db.get_value("Spare Part", {"spare_part_item": row.item_code}, "name")
		if not spare_part:
			continue
		available = _stock_available(spare_part, warehouse)
		if qty > available + 0.0001:
			frappe.throw(
				_("Insufficient stock for {0}: requested {1}, available {2} in {3}.").format(
					spare_part, qty, available, warehouse or "-"
				)
			)

	from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		_apply_dms_selling_price_list_to_sales_invoice,
		_apply_dms_settings_dimensions_to_sales_invoice,
		_generate_invoice_no,
		disable_sales_invoice_round_off,
		mark_sales_invoice_as_dms_ui_transaction,
	)
	from dms.dealer_management_system.utils.company_letter_head import apply_company_letter_head

	si = frappe.get_doc(make_sales_invoice(so.name))
	if frappe.get_meta("Sales Invoice").has_field("custom_invoice_no"):
		si.custom_invoice_no = _generate_invoice_no(so.company)
	mark_sales_invoice_as_dms_ui_transaction(si)

	if data.get("posting_date"):
		si.posting_date = data["posting_date"]
	if data.get("due_date"):
		si.due_date = data["due_date"]

	if warehouse:
		for item in si.get("items") or []:
			if cint(frappe.db.get_value("Item", item.item_code, "is_stock_item")):
				item.warehouse = warehouse

	si.set_missing_values()
	_apply_dms_selling_price_list_to_sales_invoice(si)
	_apply_dms_settings_dimensions_to_sales_invoice(si, so.company)
	apply_company_letter_head(si, so.company)
	disable_sales_invoice_round_off(si)
	si.run_method("calculate_taxes_and_totals")
	si.insert()
	if cint(data.get("submit", 1)):
		si.submit()

	frappe.db.commit()
	so.reload()
	return {
		"name": si.name,
		"sales_invoice": si.name,
		"docstatus": si.docstatus,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"grand_total": flt(si.grand_total),
		"outstanding_amount": flt(si.outstanding_amount),
		"status": si.status,
		"sales_order": so.name,
		"per_billed": flt(so.per_billed),
	}
