# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Draft Sales Invoice from DMS Job Card (requires ERPNext)."""

import frappe
from frappe import _
from frappe.utils import cint, flt, today

from frappe.model.naming import make_autoname
from datetime import datetime

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	labour_row_hours,
	part_issue_qty,
	resolve_vehicle_service_item_to_item_code,
	spare_part_default_selling_price,
	spare_part_erp_item_code,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_wip_warehouse,
	resolve_workshop_warehouse,
)

WARRANTY_APPLICATION_TYPES = frozenset(
	{"All Invoice", "Labour", "Spare Part", "Discount"}
)


def normalize_warranty_application_type(value) -> str:
	v = (value or "").strip()
	return v if v in WARRANTY_APPLICATION_TYPES else ""


def add_full_warranty_item_on_invoice() -> bool:
	"""DMS Settings: bill warranty-covered lines at full rate with 100% line discount."""
	return cint(
		frappe.db.get_single_value("DMS Settings", "add_full_warranty_item_on_invoice")
	)


def is_line_warranty_covered(line_type: str, warranty_application_type: str) -> bool:
	w = normalize_warranty_application_type(warranty_application_type)
	if w == "All Invoice":
		return True
	if w == "Labour" and line_type == "Labour":
		return True
	if w == "Spare Part" and line_type == "Parts":
		return True
	return False


def resolve_invoice_line_pricing(
	line_type: str,
	base_rate: float,
	qty: float,
	warranty_application_type: str,
) -> dict:
	"""
	How a job card line is represented on Sales Invoice / preview.

	When warranty covers a line:
	• add_full_warranty_item_on_invoice: include at full rate + 100% line discount (ERPNext-safe).
	• otherwise: omit the line from the invoice.
	"""
	base = flt(base_rate)
	qty = flt(qty)
	covered = is_line_warranty_covered(line_type, warranty_application_type)

	if covered and not add_full_warranty_item_on_invoice():
		return {
			"include": False,
			"rate": 0.0,
			"discount_percentage": 0.0,
			"amount": 0.0,
			"is_warranty_covered": True,
		}

	if covered and add_full_warranty_item_on_invoice():
		return {
			"include": True,
			"rate": base,
			"discount_percentage": 100.0,
			"amount": 0.0,
			"is_warranty_covered": True,
		}

	rate = base
	return {
		"include": True,
		"rate": rate,
		"discount_percentage": 0.0,
		"amount": round(qty * rate, 2),
		"is_warranty_covered": False,
	}


def invoice_rate_for_line(line_type: str, base_rate: float, warranty_application_type: str) -> float:
	"""Effective line rate after warranty (0 when covered and omitted from invoice preview)."""
	pricing = resolve_invoice_line_pricing(
		line_type, base_rate, qty=1, warranty_application_type=warranty_application_type
	)
	if not pricing["include"]:
		return 0.0
	if pricing["discount_percentage"] >= 100:
		return 0.0
	return flt(pricing["rate"])


def invoice_estimated_total(
	labour_total: float,
	parts_total: float,
	warranty_application_type: str,
	discount_amount: float,
) -> float:
	"""Match DMS Job Card net_amount rules using warranty-adjusted line totals."""
	w = normalize_warranty_application_type(warranty_application_type)
	labour_total = flt(labour_total)
	parts_total = flt(parts_total)
	discount_amount = flt(discount_amount)

	if w == "All Invoice":
		return 0.0
	if w == "Spare Part":
		return round(labour_total, 2)
	if w == "Labour":
		return round(parts_total, 2)
	if w == "Discount":
		return round(max(labour_total + parts_total - discount_amount, 0), 2)
	return round(max(labour_total + parts_total - discount_amount, 0), 2)


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
	"""
	Warehouse for Sales Invoice stock consumption.

	After repair start, parts are in the WIP warehouse (DMS Settings → Company Defaults).
	Fallback: part line → job card / workshop warehouse.
	"""
	wip_wh = get_wip_warehouse(getattr(jc, "company", None))
	if wip_wh:
		return wip_wh

	for candidate in (
		getattr(part, "warehouse", None),
		getattr(jc, "warehouse", None),
	):
		wh = (candidate or "").strip()
		if wh:
			return wh

	return resolve_workshop_warehouse(jc)


def _apply_stock_item_warehouse(si_row, erp_item: str, part, jc):
	"""Set warehouse on Sales Invoice item row when the ERP item is a stock item."""
	if not cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
		return

	warehouse = _resolve_part_warehouse(part, jc)
	if not warehouse:
		spare_label = getattr(part, "item_code", None) or getattr(part, "name", None) or erp_item
		company = getattr(jc, "company", None) or _("(company)")
		frappe.throw(
			_(
				"Warehouse is required for stock item {0}. Set Work In Progress on DMS Settings "
				"for company {2}, or set warehouse on spare part line {1} / Job Card."
			).format(frappe.bold(erp_item), frappe.bold(spare_label), frappe.bold(company)),
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


def _sync_job_card_warranty_for_invoice(
	job_card_name: str,
	warranty_application_type: str | None = None,
	discount_amount: float | None = None,
):
	"""Optional overrides from invoice UI — persisted on the job card before invoicing."""
	jc = frappe.get_doc("DMS Job Card", job_card_name)
	changed = False
	if warranty_application_type is not None:
		jc.warranty_application_type = normalize_warranty_application_type(
			warranty_application_type
		) or None
		changed = True
	if discount_amount is not None:
		jc.discount_amount = flt(discount_amount)
		changed = True
	if changed:
		jc.calculate_costing_and_totals()
		jc.db_update()
	return jc


def build_invoice_preview_from_job_card(
	job_card_name: str,
	warranty_application_type: str | None = None,
	discount_amount: float | None = None,
) -> dict:
	"""Return billable lines and totals for UI preview before creating a Sales Invoice."""
	_ensure_erpnext()

	if not frappe.db.exists("DMS Job Card", job_card_name):
		frappe.throw(_("DMS Job Card not found."))

	jc = frappe.get_doc("DMS Job Card", job_card_name)
	warranty_type = normalize_warranty_application_type(
		warranty_application_type
		if warranty_application_type is not None
		else jc.warranty_application_type
	)
	discount = (
		flt(discount_amount)
		if discount_amount is not None
		else flt(jc.discount_amount)
	)

	lines = _build_preview_lines(jc, warranty_type)

	if not lines:
		frappe.throw(
			_(
				"Nothing to invoice: add Labour lines (Vehicle Service Item) "
				"and/or Parts with quantity on the job card."
			)
		)

	labour_total = sum(flt(l["amount"]) for l in lines if l["line_type"] == "Labour")
	parts_total = sum(flt(l["amount"]) for l in lines if l["line_type"] == "Parts")
	subtotal = labour_total + parts_total
	has_labour = any(l["line_type"] == "Labour" for l in lines)

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
		"warranty_application_type": warranty_type or None,
		"job_card_warranty_application_type": jc.warranty_application_type or None,
		"lines": lines,
		"has_labour": has_labour,
		"labour_total": labour_total,
		"parts_total": parts_total,
		"subtotal": subtotal,
		"discount_amount": discount,
		"estimated_total": invoice_estimated_total(
			labour_total, parts_total, warranty_type, discount
		),
		"currency": _currency_from_job_card(jc),
		"existing_invoice": frappe.db.get_value("DMS Job Card", jc.name, "invoice"),
		"add_full_warranty_item_on_invoice": add_full_warranty_item_on_invoice(),
	}


def create_sales_invoice_from_dms_job_card(
	job_card_name: str,
	due_date: str | None = None,
	submit: bool = False,
	warranty_application_type: str | None = None,
	discount_amount: float | None = None,
) -> str:
	"""Build a Sales Invoice from labour + parts, link `invoice` on the Job Card."""
	_ensure_erpnext()

	if not frappe.db.exists("DMS Job Card", job_card_name):
		frappe.throw(_("DMS Job Card not found."))

	assert_single_invoice_allowed(job_card_name)

	if frappe.db.get_value("DMS Job Card", job_card_name, "docstatus") != 1:
		frappe.throw(_("Submit the Job Card before creating a Sales Invoice."))

	jc = _sync_job_card_warranty_for_invoice(
		job_card_name,
		warranty_application_type=warranty_application_type,
		discount_amount=discount_amount,
	)

	if not jc.customer:
		frappe.throw(_("Customer is required on the Job Card to create an invoice."))

	if not jc.company:
		frappe.throw(_("Set Company on the Job Card before creating a Sales Invoice."))

	warranty_type = normalize_warranty_application_type(jc.warranty_application_type)
	preview = build_invoice_preview_from_job_card(job_card_name)
	has_labour = preview.get("has_labour")

	if has_labour and not due_date:
		frappe.throw(_("Due date is required when the invoice includes labour items."))

	if warranty_type == "Discount" and flt(jc.discount_amount) < 1:
		frappe.throw(
			_("Discount Amount must be at least 1 when Warranty Application Type is Discount.")
		)

	si = frappe.new_doc("Sales Invoice")
	si.custom_invoice_no = _generate_invoice_no(jc.company)
	si.company = jc.company
	si.customer = jc.customer
	si.posting_date = today()
	si.due_date = due_date or si.posting_date
	si.remarks = _("DMS Job Card: {0}").format(jc.name)
	_set_sales_invoice_job_card_link(si, jc.name)
	_apply_sales_invoice_currency_from_job_card(si, jc)

	append_si_items(si, jc, warranty_type)
	if not si.get("items"):
		frappe.throw(
			_(
				"Nothing to invoice: add Labour lines (Vehicle Service Item) "
				"and/or Parts with quantity on the job card."
			)
		)

	si.set_missing_values()
	# set_missing_values can reset currency from company / price list — re-apply from job card
	_apply_sales_invoice_currency_from_job_card(si, jc)
	_apply_dms_settings_dimensions_to_sales_invoice(si, jc.company)
	si.run_method("calculate_taxes_and_totals")

	if warranty_type == "Discount" and flt(jc.discount_amount) > 0:
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


def _append_preview_line(
	lines: list[dict],
	*,
	line_type: str,
	item_code: str,
	description: str,
	qty: float,
	base_rate: float,
	warranty_application_type: str,
) -> None:
	pricing = resolve_invoice_line_pricing(
		line_type, base_rate, qty, warranty_application_type
	)
	if not pricing["include"]:
		return

	lines.append(
		{
			"line_type": line_type,
			"item_code": item_code,
			"description": description[:4096],
			"qty": qty,
			"rate": pricing["rate"],
			"amount": pricing["amount"],
			"base_rate": round(flt(base_rate), 2),
			"discount_percentage": pricing["discount_percentage"],
			"is_warranty_covered": pricing["is_warranty_covered"],
		}
	)


def _build_preview_lines(jc, warranty_application_type: str) -> list[dict]:
	"""Build preview line dicts; include all labour/parts with qty, apply warranty rates."""
	lines: list[dict] = []
	has_labour = bool(jc.get("labour"))

	if has_labour:
		if not frappe.db.exists("DocType", "Vehicle Service Item"):
			frappe.throw(
				_("DocType Vehicle Service Item is missing. Cannot bill labour breakdown lines.")
			)
		for row in jc.labour:
			if not row.vehicle_service_item:
				continue

			item_code = resolve_vehicle_service_item_to_item_code(row.vehicle_service_item)
			if not item_code:
				continue

			qty = labour_row_hours(row)
			if qty <= 0:
				continue

			base_rate = flt(row.rate_per_hour or 0)
			if base_rate <= 0:
				base_rate = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)

			desc_parts = []
			for attr in ("complaint", "diagnosis", "correction"):
				text = getattr(row, attr, None)
				if text:
					desc_parts.append((text or "")[:1200])
			description = "\n".join(desc_parts) or row.vehicle_service_item

			_append_preview_line(
				lines,
				line_type="Labour",
				item_code=item_code,
				description=description,
				qty=qty,
				base_rate=base_rate,
				warranty_application_type=warranty_application_type,
			)
	else:
		for ji in jc.get("job_items") or []:
			if not ji.labor_operation:
				continue
			base_rate = flt(
				frappe.db.get_value("Item", ji.labor_operation, "standard_rate") or 0
			)
			desc = getattr(ji, "complaint_description", None) or ji.labor_operation
			_append_preview_line(
				lines,
				line_type="Labour",
				item_code=ji.labor_operation,
				description=(desc or ""),
				qty=1,
				base_rate=base_rate,
				warranty_application_type=warranty_application_type,
			)

	for part in jc.get("parts") or []:
		if not part.item_code:
			continue

		qty = part_issue_qty(part)
		if qty <= 0:
			continue

		erp_item = spare_part_erp_item_code(part.item_code)
		if not erp_item:
			continue

		base_rate = flt(part.unit_price or 0)
		if base_rate <= 0:
			base_rate = spare_part_default_selling_price(part.item_code)

		item_name = frappe.db.get_value("Item", erp_item, "item_name") or erp_item
		_append_preview_line(
			lines,
			line_type="Parts",
			item_code=erp_item,
			description=item_name,
			qty=qty,
			base_rate=base_rate,
			warranty_application_type=warranty_application_type,
		)

	return lines


def append_si_items(si, jc, warranty_application_type: str = ""):
	"""Prefer Vehicle Labour breakdown; fallback to legacy Job Card Items; warranty-aware rates."""

	warranty_application_type = normalize_warranty_application_type(
		warranty_application_type or jc.warranty_application_type
	)

	has_labour = bool(jc.get("labour"))
	if has_labour:
		if not frappe.db.exists("DocType", "Vehicle Service Item"):
			frappe.throw(
				_("DocType Vehicle Service Item is missing. Cannot bill labour breakdown lines.")
			)
		for row in jc.labour:
			if not row.vehicle_service_item:
				continue

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

			base_rate = flt(row.rate_per_hour or 0)
			if base_rate <= 0:
				base_rate = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)

			pricing = resolve_invoice_line_pricing(
				"Labour", base_rate, qty, warranty_application_type
			)
			if not pricing["include"]:
				continue

			child = si.append(
				"items",
				{
					"item_code": item_code,
					"qty": qty,
					"rate": pricing["rate"],
					"discount_percentage": pricing["discount_percentage"],
				},
			)
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

			base_rate = flt(
				frappe.db.get_value("Item", ji.labor_operation, "standard_rate") or 0
			)
			pricing = resolve_invoice_line_pricing(
				"Labour", base_rate, 1, warranty_application_type
			)
			if not pricing["include"]:
				continue

			child = si.append(
				"items",
				{
					"item_code": ji.labor_operation,
					"qty": 1,
					"rate": pricing["rate"],
					"discount_percentage": pricing["discount_percentage"],
				},
			)
			desc = getattr(ji, "complaint_description", None)
			child.description = (desc or "")[:4096]

	for part in jc.get("parts") or []:
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

		base_rate = flt(part.unit_price or 0)
		if base_rate <= 0:
			base_rate = spare_part_default_selling_price(part.item_code)

		pricing = resolve_invoice_line_pricing(
			"Parts", base_rate, qty, warranty_application_type
		)
		if not pricing["include"]:
			continue

		row = si.append(
			"items",
			{
				"item_code": erp_item,
				"qty": qty,
				"rate": pricing["rate"],
				"discount_percentage": pricing["discount_percentage"],
			},
		)
		_apply_stock_item_warehouse(row, erp_item, part, jc)


def mark_sales_invoice_as_dms_ui_transaction(si) -> None:
	"""Flag invoices created from the DMS frontend (standalone)."""
	if frappe.get_meta("Sales Invoice").has_field("custom_is_dms_transaction"):
		si.custom_is_dms_transaction = 1


def _normalize_standalone_discount(discount) -> dict | None:
	"""Parse {type: percentage|amount, value: number} from API payload."""
	if not discount:
		return None
	if isinstance(discount, str):
		import json

		try:
			discount = json.loads(discount)
		except Exception:
			return None
	if not isinstance(discount, dict):
		return None
	dtype = (discount.get("type") or discount.get("discount_type") or "").strip().lower()
	if dtype not in ("percentage", "amount"):
		return None
	value = flt(discount.get("value") if discount.get("value") is not None else discount.get("discount_value"))
	if value <= 0:
		return None
	return {"type": dtype, "value": value}


def _sales_invoice_item_has_dms_discount_field() -> bool:
	return frappe.get_meta("Sales Invoice Item").has_field("custom_dms_discount")


def _standalone_line_discount_amount(
	line_amount: float,
	group_total: float,
	discount: dict | None,
) -> float:
	"""
	Discount amount for one Sales Invoice Item row (custom_dms_discount).
	Percentage: % of line amount. Amount: proportional share of group discount.
	"""
	if not discount or line_amount <= 0:
		return 0.0

	dtype = discount["type"]
	value = flt(discount["value"])
	group_total = flt(group_total)

	if dtype == "percentage":
		pct = min(value, 100.0)
		return flt(line_amount * pct / 100.0)

	if dtype == "amount":
		if group_total <= 0:
			return 0.0
		if value > group_total:
			value = group_total
		return flt(value * (flt(line_amount) / group_total))

	return 0.0


def _standalone_discounted_unit_rate(
	qty: float,
	base_rate: float,
	line_amount: float,
	group_total: float,
	discount: dict | None,
) -> float:
	"""Net unit rate billed on Sales Invoice Item.rate (matches DMS UI totals)."""
	if not discount or qty <= 0 or line_amount <= 0:
		return flt(base_rate)
	line_discount = _standalone_line_discount_amount(line_amount, group_total, discount)
	return flt((flt(line_amount) - line_discount) / qty)


def _apply_standalone_stock_warehouse(si_row, erp_item: str, warehouse: str, company: str) -> None:
	"""Set warehouse on Sales Invoice item row for stock spare parts."""
	if not cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
		return

	wh = (warehouse or "").strip()
	if not wh:
		frappe.throw(
			_("Warehouse is required for stock spare parts on standalone invoices."),
			title=_("Warehouse required"),
		)
	if not frappe.db.exists("Warehouse", wh):
		frappe.throw(_("Warehouse {0} not found.").format(frappe.bold(wh)))
	if frappe.db.get_value("Warehouse", wh, "company") != company:
		frappe.throw(
			_("Warehouse {0} must belong to company {1}.").format(
				frappe.bold(wh), frappe.bold(company)
			)
		)

	si_row.warehouse = wh


def create_standalone_dms_sales_invoice(
	customer: str,
	company: str,
	labour_lines=None,
	parts_lines=None,
	warehouse: str | None = None,
	currency: str | None = "ETB",
	due_date: str | None = None,
	posting_date: str | None = None,
	remarks: str | None = None,
	submit: bool = False,
	labour_discount=None,
	parts_discount=None,
) -> str:
	"""Create a Sales Invoice from DMS UI labour + parts (no job card)."""
	_ensure_erpnext()

	customer = (customer or "").strip()
	company = (company or "").strip()
	if not customer:
		frappe.throw(_("Customer is required."))
	if not company:
		frappe.throw(_("Company is required."))
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found.").format(customer))

	labour_lines = labour_lines or []
	parts_lines = parts_lines or []
	warehouse = (warehouse or "").strip()

	needs_stock_warehouse = False
	for row in parts_lines:
		spare_part = (row.get("spare_part") or row.get("item_code") or "").strip()
		if not spare_part:
			continue
		erp_item = spare_part_erp_item_code(spare_part)
		if erp_item and cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
			needs_stock_warehouse = True
			break

	if needs_stock_warehouse and not warehouse:
		frappe.throw(
			_("Select a warehouse for spare parts on this invoice."),
			title=_("Warehouse required"),
		)

	si = frappe.new_doc("Sales Invoice")
	if frappe.get_meta("Sales Invoice").has_field("custom_invoice_no"):
		si.custom_invoice_no = _generate_invoice_no(company)
	si.company = company
	si.customer = customer
	si.posting_date = posting_date or today()
	si.due_date = due_date or si.posting_date
	if remarks:
		si.remarks = remarks
	mark_sales_invoice_as_dms_ui_transaction(si)

	invoice_currency = (currency or "ETB").strip() or "ETB"
	if not frappe.db.exists("Currency", invoice_currency):
		frappe.throw(_("Currency {0} is not defined in ERPNext.").format(frappe.bold(invoice_currency)))
	si.currency = invoice_currency

	labour_disc = _normalize_standalone_discount(labour_discount)
	parts_disc = _normalize_standalone_discount(parts_discount)

	def _standalone_labour_line_amount(row) -> tuple[float, float, float, str | None]:
		vsi = (row.get("vehicle_service_item") or "").strip()
		if not vsi:
			return 0.0, 0.0, 0.0, None
		qty = flt(row.get("hours") or row.get("estimated_hours") or row.get("qty") or 0)
		if qty <= 0:
			return 0.0, 0.0, 0.0, None
		item_code = resolve_vehicle_service_item_to_item_code(vsi)
		if not item_code:
			return 0.0, 0.0, 0.0, vsi
		base_rate = flt(row.get("rate_per_hour") or row.get("rate") or 0)
		if base_rate <= 0:
			base_rate = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)
		return qty, base_rate, qty * base_rate, None

	def _standalone_parts_line_amount(row) -> tuple[float, float, float]:
		spare_part = (row.get("spare_part") or row.get("item_code") or "").strip()
		if not spare_part:
			return 0.0, 0.0, 0.0
		qty = flt(row.get("qty") or row.get("quantity") or 0)
		if qty <= 0:
			return 0.0, 0.0, 0.0
		base_rate = flt(row.get("unit_price") or row.get("rate") or 0)
		if base_rate <= 0:
			base_rate = spare_part_default_selling_price(spare_part)
		return qty, base_rate, qty * base_rate

	labour_group_total = 0.0
	for row in labour_lines:
		_qty, _rate, amount, _missing = _standalone_labour_line_amount(row)
		labour_group_total += amount

	parts_group_total = 0.0
	for row in parts_lines:
		_qty, _rate, amount = _standalone_parts_line_amount(row)
		parts_group_total += amount

	if labour_disc and labour_disc["type"] == "amount" and flt(labour_disc["value"]) > labour_group_total:
		frappe.throw(
			_("Labour discount amount cannot exceed labour total ({0}).").format(
				labour_group_total
			)
		)
	if parts_disc and parts_disc["type"] == "amount" and flt(parts_disc["value"]) > parts_group_total:
		frappe.throw(
			_("Parts discount amount cannot exceed parts total ({0}).").format(
				parts_group_total
			)
		)

	use_dms_discount_field = _sales_invoice_item_has_dms_discount_field()
	item_final_rates: list[float] = []
	item_dms_discounts: list[float] = []

	for row in labour_lines:
		qty, base_rate, line_amount, missing_vsi = _standalone_labour_line_amount(row)
		if missing_vsi:
			frappe.throw(
				_(
					"Vehicle Service Item {0}: link to an ERP Item before invoicing."
				).format(frappe.bold(missing_vsi))
			)
		if qty <= 0:
			continue
		vsi = (row.get("vehicle_service_item") or "").strip()
		item_code = resolve_vehicle_service_item_to_item_code(vsi)
		line_discount = _standalone_line_discount_amount(
			line_amount, labour_group_total, labour_disc
		)
		final_rate = _standalone_discounted_unit_rate(
			qty, base_rate, line_amount, labour_group_total, labour_disc
		)
		item_final_rates.append(final_rate)
		item_dms_discounts.append(line_discount)
		item_row = {
			"item_code": item_code,
			"qty": qty,
			"rate": final_rate,
			"description": (row.get("description") or "")[:4096] or None,
		}
		if use_dms_discount_field:
			item_row["custom_dms_discount"] = line_discount
		si.append("items", item_row)

	for row in parts_lines:
		spare_part = (row.get("spare_part") or row.get("item_code") or "").strip()
		if not spare_part:
			continue
		qty, base_rate, line_amount = _standalone_parts_line_amount(row)
		if qty <= 0:
			continue
		erp_item = spare_part_erp_item_code(spare_part)
		if not erp_item:
			frappe.throw(
				_("Spare Part {0} has no linked ERP Item.").format(frappe.bold(spare_part))
			)
		line_discount = _standalone_line_discount_amount(
			line_amount, parts_group_total, parts_disc
		)
		final_rate = _standalone_discounted_unit_rate(
			qty, base_rate, line_amount, parts_group_total, parts_disc
		)
		item_final_rates.append(final_rate)
		item_dms_discounts.append(line_discount)
		item_row = {
			"item_code": erp_item,
			"qty": qty,
			"rate": final_rate,
		}
		if use_dms_discount_field:
			item_row["custom_dms_discount"] = line_discount
		child = si.append("items", item_row)
		_apply_standalone_stock_warehouse(child, erp_item, warehouse, company)

	if not si.get("items"):
		frappe.throw(_("Add at least one labour or parts line to create an invoice."))

	if hasattr(si, "ignore_pricing_rule"):
		si.ignore_pricing_rule = 1

	si.set_missing_values()
	si.currency = invoice_currency
	_apply_dms_settings_dimensions_to_sales_invoice(si, company)

	# set_missing_values() may reset rates — re-apply net rate; custom_dms_discount is audit-only.
	for idx, item_row in enumerate(si.get("items") or []):
		if idx < len(item_final_rates):
			final_rate = item_final_rates[idx]
			item_row.rate = final_rate
			item_row.price_list_rate = final_rate
			item_row.discount_percentage = 0
			item_row.discount_amount = 0
			if use_dms_discount_field and idx < len(item_dms_discounts):
				item_row.custom_dms_discount = item_dms_discounts[idx]

	si.run_method("calculate_taxes_and_totals")
	si.insert()

	if submit:
		si.submit()

	return si.name
