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


def _set_sales_invoice_job_card_link(si, job_card_name: str):
	"""Set custom_dms_job_card on Sales Invoice when the field exists."""
	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		si.custom_dms_job_card = job_card_name


def _currency_from_job_card(jc) -> str | None:
	"""Use Job Card currency when set; else company default. Aligns SI with party receivable currency."""
	cur = (getattr(jc, "currency", None) or "").strip()
	if cur:
		return cur
	if jc.company:
		return frappe.db.get_value("Company", jc.company, "default_currency")
	return None


def _apply_sales_invoice_currency_from_job_card(si, jc):
	"""Set invoice currency from job card so it matches receivable / customer account expectations."""
	cur = _currency_from_job_card(jc)
	if cur:
		si.currency = cur


def _apply_dms_settings_dimensions_to_sales_invoice(si, company: str):
	"""
	Copy accounting dimensions from DMS Settings → Company Defaults row for `company`
	onto Sales Invoice and item rows (only fields that exist on those doctypes).
	"""
	if not company or not frappe.db.exists("DocType", "DMS Company Defaults"):
		return

	settings = frappe.get_single("DMS Settings")
	defaults_row = None
	for row in settings.get("company_defaults") or []:
		if row.company == company:
			defaults_row = row
			break
	if not defaults_row:
		return

	cd_meta = frappe.get_meta("DMS Company Defaults")
	si_meta = frappe.get_meta("Sales Invoice")
	sii_meta = frappe.get_meta("Sales Invoice Item")
	tax_meta = frappe.get_meta("Sales Taxes and Charges")

	for df in cd_meta.fields:
		if df.fieldtype != "Link" or df.fieldname == "company":
			continue
		val = getattr(defaults_row, df.fieldname, None)
		if not val:
			continue
		if si_meta.has_field(df.fieldname):
			si.set(df.fieldname, val)
		if sii_meta.has_field(df.fieldname):
			for line in si.get("items") or []:
				line.set(df.fieldname, val)
		if tax_meta.has_field(df.fieldname):
			for tax in si.get("taxes") or []:
				tax.set(df.fieldname, val)


def _resolve_part_warehouse(part, jc) -> str | None:
	"""Warehouse for a stock item line: part row → job card → workshop → company default."""
	for candidate in (
		getattr(part, "warehouse", None),
		getattr(jc, "warehouse", None),
	):
		wh = (candidate or "").strip()
		if wh:
			return wh

	workshop = getattr(jc, "workshop", None)
	if workshop:
		wh = frappe.db.get_value("Workshop", workshop, "warehouse")
		if wh:
			return wh

	company = getattr(jc, "company", None)
	if company:
		wh = frappe.db.get_value("Company", company, "default_warehouse")
		if wh:
			return wh

	return None


def _apply_stock_item_warehouse(si_row, erp_item: str, part, jc):
	"""Set warehouse on Sales Invoice item row when the ERP item is a stock item."""
	if not cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
		return

	warehouse = _resolve_part_warehouse(part, jc)
	if not warehouse:
		spare_label = getattr(part, "item_code", None) or getattr(part, "name", None) or erp_item
		frappe.throw(
			_(
				"Warehouse is required for stock item {0}. Set warehouse on spare part line "
				"{1}, on the Job Card, or on the linked Workshop / Company."
			).format(frappe.bold(erp_item), frappe.bold(spare_label)),
			title=_("Warehouse required"),
		)

	si_row.warehouse = warehouse


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

	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		existing_si = frappe.db.get_value(
			"Sales Invoice",
			{"custom_dms_job_card": job_card_name, "docstatus": ["!=", 2]},
			"name",
		)
		if existing_si:
			frappe.throw(
				_("Sales Invoice {0} is already linked to this Job Card.").format(
					frappe.bold(existing_si)
				),
				title=_("Invoice already exists"),
			)


def build_invoice_preview_from_job_card(job_card_name: str) -> dict:
	"""Return billable lines and totals for UI preview before creating a Sales Invoice."""
	_ensure_erpnext()

	if not frappe.db.exists("DMS Job Card", job_card_name):
		frappe.throw(_("DMS Job Card not found."))

	jc = frappe.get_doc("DMS Job Card", job_card_name)
	lines = _build_preview_lines(jc)

	if not lines:
		frappe.throw(
			_(
				"Nothing to invoice: add billable Labour lines (Vehicle Service Item) "
				"and/or Parts (non-warranty) with quantity."
			)
		)

	labour_total = sum(flt(l["amount"]) for l in lines if l["line_type"] == "Labour")
	parts_total = sum(flt(l["amount"]) for l in lines if l["line_type"] == "Parts")
	subtotal = labour_total + parts_total
	has_labour = any(l["line_type"] == "Labour" for l in lines)
	discount_amount = flt(jc.discount_amount)

	customer_name = jc.customer
	if jc.customer:
		customer_name = (
			frappe.db.get_value("Customer", jc.customer, "customer_name") or jc.customer
		)

	return {
		"job_card": jc.name,
		"customer": jc.customer,
		"customer_name": customer_name,
		"company": jc.company,
		"lines": lines,
		"has_labour": has_labour,
		"labour_total": labour_total,
		"parts_total": parts_total,
		"subtotal": subtotal,
		"discount_amount": discount_amount,
		"estimated_total": max(subtotal - discount_amount, 0),
		"currency": _currency_from_job_card(jc),
		"existing_invoice": frappe.db.get_value("DMS Job Card", jc.name, "invoice"),
	}


def create_sales_invoice_from_dms_job_card(
	job_card_name: str, due_date: str | None = None, submit: bool = False
) -> str:
	"""Build a Sales Invoice from labour + parts, link `invoice` on the Job Card."""
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

	preview = build_invoice_preview_from_job_card(job_card_name)
	has_labour = preview.get("has_labour")

	if has_labour and not due_date:
		frappe.throw(_("Due date is required when the invoice includes labour items."))

	si = frappe.new_doc("Sales Invoice")
	si.custom_invoice_no = _generate_invoice_no(jc.company)
	si.company = jc.company
	si.customer = jc.customer
	si.posting_date = today()
	si.due_date = due_date or si.posting_date
	si.remarks = _("DMS Job Card: {0}").format(jc.name)
	_set_sales_invoice_job_card_link(si, jc.name)
	_apply_sales_invoice_currency_from_job_card(si, jc)

	append_si_items(si, jc)
	if not si.get("items"):
		frappe.throw(
			_(
				"Nothing to invoice: add billable Labour lines (Vehicle Labour Item) "
				"and/or Parts (non-warranty) with quantity."
			)
		)

	si.set_missing_values()
	# set_missing_values can reset currency from company / price list — re-apply from job card
	_apply_sales_invoice_currency_from_job_card(si, jc)
	_apply_dms_settings_dimensions_to_sales_invoice(si, jc.company)
	si.run_method("calculate_taxes_and_totals")

	if flt(jc.discount_amount) > 0:
		si.discount_amount = flt(jc.discount_amount)
		si.apply_discount_on = "Grand Total"
		si.run_method("calculate_taxes_and_totals")

	si.insert()

	if submit:
		si.submit()

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


def _build_preview_lines(jc) -> list[dict]:
	"""Build preview line dicts using the same rules as append_si_items."""
	lines: list[dict] = []
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
				continue

			item_code = resolve_vehicle_service_item_to_item_code(row.vehicle_service_item)
			if not item_code:
				continue

			qty = labour_row_hours(row)
			if qty <= 0:
				continue

			rate = flt(row.rate_per_hour or 0)
			if rate <= 0:
				rate = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)

			desc_parts = []
			for attr in ("complaint", "diagnosis", "correction"):
				text = getattr(row, attr, None)
				if text:
					desc_parts.append((text or "")[:1200])
			description = "\n".join(desc_parts) or row.vehicle_service_item

			lines.append(
				{
					"line_type": "Labour",
					"item_code": item_code,
					"description": description[:4096],
					"qty": qty,
					"rate": rate,
					"amount": round(qty * rate, 2),
				}
			)
	else:
		for ji in jc.get("job_items") or []:
			if not ji.labor_operation:
				continue
			rate = flt(
				frappe.db.get_value("Item", ji.labor_operation, "standard_rate") or 0
			)
			desc = getattr(ji, "complaint_description", None) or ji.labor_operation
			lines.append(
				{
					"line_type": "Labour",
					"item_code": ji.labor_operation,
					"description": (desc or "")[:4096],
					"qty": 1,
					"rate": rate,
					"amount": rate,
				}
			)

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
			continue

		rate = flt(part.unit_price or 0)
		if rate <= 0:
			rate = spare_part_default_selling_price(part.item_code)

		item_name = frappe.db.get_value("Item", erp_item, "item_name") or erp_item
		lines.append(
			{
				"line_type": "Parts",
				"item_code": erp_item,
				"description": item_name,
				"qty": qty,
				"rate": rate,
				"amount": round(qty * rate, 2),
			}
		)

	return lines


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
		_apply_stock_item_warehouse(row, erp_item, part, jc)
