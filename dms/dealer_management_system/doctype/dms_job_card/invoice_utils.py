# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Draft Sales Invoice from DMS Job Card (requires ERPNext)."""

import frappe
from frappe import _
from frappe.utils import cint, flt, today

from frappe.model.naming import make_autoname
from datetime import datetime

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	is_labour_row_billable,
	is_part_row_billable,
	labour_row_hours,
	part_issue_qty,
	resolve_vehicle_service_item_to_item_code,
	spare_part_default_selling_price,
	spare_part_erp_item_code,
)


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed to create Sales Invoices from a Job Card."))


def assert_single_invoice_allowed(job_card_name: str):
	"""Job Card invoice is canonical; disallow a second SI for the same job."""
	existing = frappe.db.get_value("DMS Job Card", job_card_name, "invoice")
	if existing:
		frappe.throw(
			_("A Sales Invoice is already linked ({0}). Only one invoice is allowed.").format(
				frappe.bold(existing)
			),
			title=_("Invoice already exists"),
		)


def create_sales_invoice_from_dms_job_card(job_card_name: str) -> str:
	"""Build a draft Sales Invoice, append lines from labour + parts, link `invoice` on the Job Card."""
	_ensure_erpnext()

	if not frappe.db.exists("DMS Job Card", job_card_name):
		frappe.throw(_("DMS Job Card not found."))

	assert_single_invoice_allowed(job_card_name)
	jc = frappe.get_doc("DMS Job Card", job_card_name)

	if jc.docstatus != 1:
		frappe.throw(_("Submit the Job Card before creating a Sales Invoice."))

	if not jc.customer:
		frappe.throw(_("Customer is required on the Job Card to create an invoice."))

	if not jc.company:
		frappe.throw(_("Set Company on the Job Card before creating a Sales Invoice."))

	si = frappe.new_doc("Sales Invoice")
	si.custom_invoice_no = _generate_invoice_no(jc.company)
	si.company = jc.company
	si.customer = jc.customer
	si.posting_date = today()
	si.due_date = si.posting_date
	si.remarks = _("DMS Job Card: {0}").format(jc.name)

	append_si_items(si, jc)
	if not si.get("items"):
		frappe.throw(
			_(
				"Nothing to invoice: add billable Labour lines (Vehicle Labour Item) "
				"and/or Parts (non-warranty) with quantity."
			)
		)

	si.set_missing_values()
	si.run_method("calculate_taxes_and_totals")

	if flt(jc.discount_amount) > 0:
		si.discount_amount = flt(jc.discount_amount)
		si.apply_discount_on = "Grand Total"
		si.run_method("calculate_taxes_and_totals")

	si.insert()

	frappe.db.set_value("DMS Job Card", jc.name, "invoice", si.name, update_modified=True)

	return si.name


def _generate_invoice_no(company):
	"""
	Mirror the auto_name logic to produce a custom_invoice_no
	before the PI is inserted, so the mandatory field is always populated.
	"""
	company_abbr = frappe.db.get_value("Company", company, "abbr")
	if not company_abbr:
		frappe.throw(_("Company abbreviation not found for {0}").format(company))
 
	current_year = datetime.now().year
 
	if company == "CITYWALK FOOTWEAR PVT LTD":
		base_name = make_autoname(f"{company_abbr}-JW-.###")
	else:
		base_name = make_autoname(f"{company_abbr}-.####")
 
	return f"{base_name}-{current_year}"

def append_si_items(si, jc):
	"""Prefer Vehicle Labour breakdown; fallback to legacy Job Card Items. Exclude warranty."""

	has_labour = bool(jc.get("labour"))
	if has_labour:
		if not frappe.db.exists("DocType", "Vehicle Service Item"):
			frappe.throw(
				_("DocType Vehicle Service Item is missing. Cannot bill labour breakdown lines.")
			)
		for row in jc.labour:
			if not is_labour_row_billable(row):
				continue
			if not row.vehicle_service_item:
				frappe.throw(
					_("Each billable Labour line must reference a Vehicle Service Item.")
				)

			item_code = resolve_vehicle_service_item_to_item_code(row.vehicle_service_item)
			if not item_code:
				frappe.throw(
					_(
						"Vehicle Service Item {0}: add a Link field to ERP Item "
						"or link it to Item so it can appear on Sales Invoice."
					).format(frappe.bold(row.vehicle_service_item))
				)

			qty = labour_row_hours(row)
			if qty <= 0:
				continue

			rate = flt(row.rate_per_hour or 0)
			if rate <= 0:
				rate = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)

			child = si.append("items", {"item_code": item_code, "qty": qty, "rate": rate})
			desc_parts = []
			for attr in ("complaint", "diagnosis", "correction"):
				text = getattr(row, attr, None)
				if text:
					desc_parts.append((text or "")[:1200])
			child.description = "\n".join(desc_parts)[:4096]

	else:
		for ji in jc.get("job_items") or []:
			if not ji.labor_operation:
				continue

			child = si.append(
				"items",
				{
					"item_code": ji.labor_operation,
					"qty": 1,
					"rate": flt(frappe.db.get_value("Item", ji.labor_operation, "standard_rate") or 0),
				},
			)
			desc = getattr(ji, "complaint_description", None)
			child.description = (desc or "")[:4096]

	for part in jc.get("parts") or []:
		if not is_part_row_billable(part):
			continue
		if not part.item_code:
			continue

		qty = part_issue_qty(part)
		if qty <= 0:
			continue

		erp_item = spare_part_erp_item_code(part.item_code)
		if not erp_item:
			frappe.throw(
				_("Spare Part {0} has no linked ERP Item.").format(frappe.bold(part.item_code)),
			)

		rate = flt(part.unit_price or 0)
		if rate <= 0:
			rate = spare_part_default_selling_price(part.item_code)

		row = si.append("items", {"item_code": erp_item, "qty": qty, "rate": rate})

		is_stock_item = frappe.db.get_value("Item", erp_item, "is_stock_item")
		if cint(is_stock_item) and getattr(part, "warehouse", None):
			row.warehouse = part.warehouse
