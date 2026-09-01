# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Draft Sales Invoice from DMS Job Card (requires ERPNext)."""

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, strip_html, today

from frappe.model.naming import make_autoname
from datetime import datetime

from dms.dealer_management_system.utils.company_letter_head import apply_company_letter_head
from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	labour_row_hours,
	part_issue_qty,
	resolve_vehicle_service_item_to_item_code,
	spare_part_default_selling_price,
	spare_part_erp_item_code,
	vehicle_service_item_labour_rate,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
	apply_discount_fields_from_payload,
	compute_group_discount_amount,
	job_card_combined_discount_amount,
	job_card_labour_discount_dict,
	job_card_parts_discount_dict,
	parse_discount_payload,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_wip_warehouse,
	resolve_workshop_warehouse,
)

WARRANTY_APPLICATION_TYPES = frozenset(
	{"All Invoice", "Labour", "Spare Part", "Discount"}
)


def normalize_exclude_rows(exclude_rows) -> set[str]:
	"""Job Card Part Item names to omit from the invoice (JSON list or list)."""
	if not exclude_rows:
		return set()
	if isinstance(exclude_rows, str):
		import json

		raw = exclude_rows.strip()
		if not raw:
			return set()
		try:
			exclude_rows = json.loads(raw)
		except (json.JSONDecodeError, TypeError, ValueError):
			exclude_rows = [raw]
	if isinstance(exclude_rows, dict):
		exclude_rows = list(exclude_rows.values())
	if not isinstance(exclude_rows, (list, tuple, set)):
		return set()
	return {str(x).strip() for x in exclude_rows if str(x).strip()}


def _part_attr(part, field: str):
	if isinstance(part, dict):
		return part.get(field)
	return getattr(part, field, None)


_PART_REQUEST_IN_PROGRESS_STATUSES = frozenset(
	{
		"Pending Approval",
		"Reserved",
		"Ready for Issue",
		"Issued",
		"Received",
		"Returned",
		"Backordered",
	}
)


def never_requested_part_row_names(parts, job_card: str | None = None) -> set[str]:
	"""Job Card Part Item names with no evidence of a parts requisition.

	Row identity is not enough: saving or re-syncing the job card recreates child
	rows, which drops ``parts_request`` / ``job_card_part_row``. Also treat the
	line as requested when qty was issued, the line already moved in the PR
	workflow, or the same spare part is on an active PR for this job card.
	"""
	parts = parts or []
	names = [(_part_attr(p, "name") or "").strip() for p in parts]
	names = [n for n in names if n]
	if not names:
		return set()

	if not job_card:
		for part in parts:
			parent = (_part_attr(part, "parent") or "").strip()
			if parent:
				job_card = parent
				break

	requested: set[str] = set()
	pr_by_row: dict[str, str] = {}
	for part in parts:
		row_name = (_part_attr(part, "name") or "").strip()
		if not row_name:
			continue
		if flt(_part_attr(part, "quantity_issued")) > 0:
			requested.add(row_name)
			continue
		status = (_part_attr(part, "line_status") or "").strip()
		if status in _PART_REQUEST_IN_PROGRESS_STATUSES:
			requested.add(row_name)
			continue
		pr = (_part_attr(part, "parts_request") or "").strip()
		if pr:
			pr_by_row[row_name] = pr

	if pr_by_row:
		active = set(
			frappe.get_all(
				"DMS Parts Request",
				filters={"name": ["in", list(set(pr_by_row.values()))], "status": ["!=", "Cancelled"]},
				pluck="name",
			)
		)
		for row_name, pr in pr_by_row.items():
			if pr in active:
				requested.add(row_name)

	remaining = [n for n in names if n not in requested]
	if remaining and frappe.db.exists("DocType", "DMS Parts Request Item"):
		links = frappe.get_all(
			"DMS Parts Request Item",
			filters={"job_card_part_row": ["in", remaining]},
			fields=["job_card_part_row", "parent"],
		)
		parent_names = {r["parent"] for r in links if r.get("parent")}
		active_parents = set()
		if parent_names:
			active_parents = set(
				frappe.get_all(
					"DMS Parts Request",
					filters={"name": ["in", list(parent_names)], "status": ["!=", "Cancelled"]},
					pluck="name",
				)
			)
		for row in links:
			if row.get("parent") in active_parents and row.get("job_card_part_row"):
				requested.add(row["job_card_part_row"])

	remaining = [n for n in names if n not in requested]
	if remaining and job_card and frappe.db.exists("DocType", "DMS Parts Request"):
		active_prs = frappe.get_all(
			"DMS Parts Request",
			filters={"job_card": job_card, "status": ["!=", "Cancelled"]},
			pluck="name",
		)
		requested_items = set()
		if active_prs and frappe.db.exists("DocType", "DMS Parts Request Item"):
			requested_items = {
				(code or "").strip()
				for code in frappe.get_all(
					"DMS Parts Request Item",
					filters={"parent": ["in", active_prs]},
					pluck="item_code",
				)
				if (code or "").strip()
			}
		if requested_items:
			name_set = set(remaining)
			for part in parts:
				row_name = (_part_attr(part, "name") or "").strip()
				if row_name not in name_set:
					continue
				item = (_part_attr(part, "item_code") or "").strip()
				if item and item in requested_items:
					requested.add(row_name)

	return set(names) - requested


def _assert_exclude_rows_never_requested(parts, excluded: set[str], job_card: str | None = None) -> set[str]:
	"""Only spare parts that were never requisitioned may be dropped from the invoice."""
	if not excluded:
		return set()
	never = never_requested_part_row_names(parts, job_card=job_card)
	invalid = excluded - never
	if invalid:
		frappe.throw(
			_(
				"Only spare parts that were never requested on a Parts Requisition "
				"can be removed from the invoice."
			),
			title=_("Cannot remove requested part"),
		)
	return excluded


def normalize_rate_overrides(rate_overrides) -> dict[str, float]:
	"""Map child-row name -> unit price or rate/hour override from the UI."""
	if not rate_overrides:
		return {}
	if isinstance(rate_overrides, str):
		import json

		rate_overrides = json.loads(rate_overrides)
	if isinstance(rate_overrides, dict):
		items = rate_overrides.items()
	elif isinstance(rate_overrides, list):
		items = (
			(
				(row.get("source_row") or row.get("name") or row.get("row_name"), row.get("rate"))
				for row in rate_overrides
			)
			if rate_overrides and isinstance(rate_overrides[0], dict)
			else []
		)
	else:
		return {}

	out: dict[str, float] = {}
	for key, rate in items:
		row_name = (key or "").strip()
		if not row_name:
			continue
		out[row_name] = flt(rate)
	return out


def _line_base_rate(default_rate: float, source_row: str | None, overrides: dict[str, float]) -> float:
	if source_row and source_row in overrides:
		return flt(overrides[source_row])
	return flt(default_rate)


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


def _si_item_pricing_fields(pricing: dict) -> dict:
	"""Selling fields for a Sales Invoice Item.

	Warranty is not stored as a 0 net rate: a site Server Script rejects rate=0.
	Covered lines keep the full selling rate; the write-off is an invoice discount.
	"""
	base = flt(pricing.get("rate"))
	return {
		"price_list_rate": base,
		"rate_with_margin": base,
		"discount_percentage": 0.0,
		"discount_amount": 0.0,
		"rate": base,
		"margin_type": "",
		"margin_rate_or_amount": 0.0,
	}


_SI_ITEM_RATE_FIELDS = (
	"price_list_rate",
	"rate_with_margin",
	"discount_percentage",
	"discount_amount",
	"rate",
	"margin_type",
	"margin_rate_or_amount",
)


def _apply_si_item_pricing_fields(row, fields: dict) -> None:
	for key in _SI_ITEM_RATE_FIELDS:
		if key in fields:
			row.set(key, fields[key])


def _reapply_job_card_si_line_rates(si, line_fields: list[dict]) -> None:
	"""Put DMS selling rates back after price-list / totals overwrites."""
	for idx, row in enumerate(si.get("items") or []):
		if idx >= len(line_fields):
			break
		_apply_si_item_pricing_fields(row, line_fields[idx])


def _warranty_covered_line_amount(si, line_fields: list[dict]) -> tuple[float, float]:
	covered = 0.0
	total = 0.0
	for idx, row in enumerate(si.get("items") or []):
		amount = flt(row.qty) * flt(row.rate)
		total += amount
		if idx < len(line_fields) and line_fields[idx].get("warranty_full_discount"):
			covered += amount
	return covered, total


def _apply_warranty_as_invoice_discount(si, line_fields: list[dict]) -> None:
	"""Take warranty off the invoice total so line rates stay non-zero."""
	covered, total = _warranty_covered_line_amount(si, line_fields)
	if covered <= 0 or total <= 0:
		return

	if hasattr(si, "apply_discount_on"):
		si.apply_discount_on = "Grand Total"

	if abs(covered - total) < 0.005:
		if hasattr(si, "additional_discount_percentage"):
			si.additional_discount_percentage = 100
		si.discount_amount = 0
	else:
		if hasattr(si, "additional_discount_percentage"):
			si.additional_discount_percentage = 0
		si.discount_amount = round(covered, 2)


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


def _clear_sales_invoice_taxes(si, prevent_reapply: bool = True) -> None:
	"""Remove auto-applied taxes / tax withholding so the invoice stays blank."""
	si.taxes_and_charges = None
	si.set("taxes", [])

	if si.meta.has_field("apply_tds"):
		si.apply_tds = 0
	if si.meta.has_field("tax_withholding_category"):
		si.tax_withholding_category = None
	if si.meta.has_field("tax_withholding_group"):
		si.tax_withholding_group = None
	if si.meta.has_field("tax_withholding_entries"):
		si.set("tax_withholding_entries", [])
	if si.meta.has_field("override_tax_withholding_entries"):
		si.override_tax_withholding_entries = 0

	sii_meta = frappe.get_meta("Sales Invoice Item")
	for item in si.get("items") or []:
		if sii_meta.has_field("apply_tds"):
			item.apply_tds = 0
		if sii_meta.has_field("tax_withholding_category"):
			item.tax_withholding_category = None
		if sii_meta.has_field("item_tax_template"):
			item.item_tax_template = None
		if sii_meta.has_field("item_tax_rate"):
			item.item_tax_rate = None

	if prevent_reapply:
		_prevent_erpnext_tax_reapply(si)


def get_dms_default_taxes_and_charges_template(company: str | None = None) -> str:
	"""Sales Taxes and Charges Template from DMS Settings."""
	name = (
		frappe.db.get_single_value("DMS Settings", "default_taxes_and_charges_template") or ""
	).strip()
	if not name:
		frappe.throw(
			_("Set Default Taxes and Charges Template on DMS Settings before including taxes."),
			title=_("Taxes and Charges"),
		)
	if not frappe.db.exists("Sales Taxes and Charges Template", name):
		frappe.throw(
			_("Taxes and Charges Template {0} was not found.").format(frappe.bold(name)),
			title=_("Taxes and Charges"),
		)

	meta = frappe.get_meta("Sales Taxes and Charges Template")
	if meta.has_field("disabled") and frappe.db.get_value(
		"Sales Taxes and Charges Template", name, "disabled"
	):
		frappe.throw(
			_("Taxes and Charges Template {0} is disabled.").format(frappe.bold(name)),
			title=_("Taxes and Charges"),
		)
	if company and meta.has_field("company"):
		tmpl_company = frappe.db.get_value("Sales Taxes and Charges Template", name, "company")
		if tmpl_company and tmpl_company != company:
			frappe.throw(
				_(
					"DMS default Taxes and Charges Template {0} belongs to company {1}, not {2}."
				).format(frappe.bold(name), frappe.bold(tmpl_company), frappe.bold(company)),
				title=_("Taxes and Charges"),
			)
	return name


def _apply_dms_default_taxes_and_charges(si) -> None:
	"""Use only the DMS Settings tax template — not customer, company, or item defaults."""
	template = get_dms_default_taxes_and_charges_template(getattr(si, "company", None))
	_clear_sales_invoice_taxes(si, prevent_reapply=False)

	si.taxes_and_charges = template
	from erpnext.controllers.accounts_controller import get_taxes_and_charges

	for tax in get_taxes_and_charges("Sales Taxes and Charges Template", template) or []:
		si.append("taxes", tax)

	_prevent_erpnext_tax_reapply(si)


def _prevent_erpnext_tax_reapply(si) -> None:
	"""Stop AccountsController from swapping in company / customer / item templates."""
	si.set_taxes_and_charges = lambda *args, **kwargs: None
	si.set_taxes = lambda *args, **kwargs: None
	si.append_taxes_from_item_tax_template = lambda *args, **kwargs: None


def _apply_sales_invoice_tax_choice(si, apply_taxes: bool) -> None:
	"""Apply DMS Settings tax template when requested; otherwise leave taxes blank."""
	if apply_taxes:
		_apply_dms_default_taxes_and_charges(si)
		return
	_clear_sales_invoice_taxes(si)


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


def _allow_zero_valuation_rate_when_missing(si) -> None:
	"""
	Enable Allow Zero Valuation Rate on stock items with no usable valuation
	(Bin rate is missing/zero). Lets DMS Sales Invoices submit when COGS would
	otherwise fail with Valuation Rate Missing.
	"""
	if not frappe.get_meta("Sales Invoice Item").has_field("allow_zero_valuation_rate"):
		return

	for row in si.get("items") or []:
		item_code = (row.get("item_code") or "").strip()
		if not item_code:
			continue
		if not cint(frappe.get_cached_value("Item", item_code, "is_stock_item")):
			continue

		bin_rate = 0.0
		warehouse = (row.get("warehouse") or "").strip()
		if warehouse:
			bin_rate = flt(
				frappe.db.get_value(
					"Bin",
					{"item_code": item_code, "warehouse": warehouse},
					"valuation_rate",
				)
			)
		item_rate = flt(frappe.get_cached_value("Item", item_code, "valuation_rate") or 0)
		if bin_rate > 0 or item_rate > 0:
			# Prefer existing valuation when present; still allow zero if Bin is empty/zero
			# because ERPNext may fall back to a 0 SLE rate and throw.
			if bin_rate > 0:
				continue

		row.allow_zero_valuation_rate = 1


def get_active_job_card_invoice(job_card_name: str) -> str | None:
	"""
	Return the job card's linked Sales Invoice if it is still active
	(draft or submitted). Cancelled invoices do not count.
	"""
	existing = (frappe.db.get_value("DMS Job Card", job_card_name, "invoice") or "").strip()
	if existing and frappe.db.exists("Sales Invoice", existing):
		if cint(frappe.db.get_value("Sales Invoice", existing, "docstatus")) != 2:
			return existing

	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		linked = frappe.db.get_value(
			"Sales Invoice",
			{"custom_dms_job_card": job_card_name, "docstatus": ["!=", 2]},
			"name",
		)
		if linked:
			return linked

	return None


def assert_single_invoice_allowed(job_card_name: str):
	"""Disallow a second active Sales Invoice for the same job (cancelled ones are ignored)."""
	active = get_active_job_card_invoice(job_card_name)
	if active:
		frappe.throw(
			_("A Sales Invoice is already linked ({0}). Only one invoice is allowed.").format(
				frappe.bold(active)
			),
			title=_("Invoice already exists"),
		)


def clear_job_card_invoice_link_on_cancel(si_name: str, job_card_name: str | None = None) -> None:
	"""When an SI is cancelled, clear Job Card.invoice if it still points at that SI."""
	si_name = (si_name or "").strip()
	if not si_name:
		return

	job_cards = set()
	jc_from_si = (job_card_name or "").strip()
	if not jc_from_si and frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		jc_from_si = (frappe.db.get_value("Sales Invoice", si_name, "custom_dms_job_card") or "").strip()
	if jc_from_si:
		job_cards.add(jc_from_si)

	for jc_name in frappe.get_all(
		"DMS Job Card",
		filters={"invoice": si_name},
		pluck="name",
	):
		job_cards.add(jc_name)

	for jc_name in job_cards:
		if frappe.db.get_value("DMS Job Card", jc_name, "invoice") == si_name:
			frappe.db.set_value("DMS Job Card", jc_name, "invoice", None, update_modified=True)


def on_sales_invoice_cancel(doc, method=None):
	"""Desk / API cancel: free the job card so a new invoice can be created."""
	clear_job_card_invoice_link_on_cancel(
		doc.name,
		doc.get("custom_dms_job_card") if hasattr(doc, "get") else None,
	)


def _sync_job_card_warranty_for_invoice(
	job_card_name: str,
	warranty_application_type: str | None = None,
	discount_amount: float | None = None,
	labour_discount=None,
	parts_discount=None,
):
	"""Optional overrides from invoice UI — persisted on the job card before invoicing."""
	jc = frappe.get_doc("DMS Job Card", job_card_name)
	changed = False
	if warranty_application_type is not None:
		jc.warranty_application_type = normalize_warranty_application_type(
			warranty_application_type
		) or None
		changed = True

	wt = normalize_warranty_application_type(
		warranty_application_type or jc.warranty_application_type
	)

	if labour_discount is not None or parts_discount is not None:
		if wt != "Discount":
			if labour_discount or parts_discount:
				frappe.throw(
					_("Labour/parts discounts apply only when Warranty Application Type is Discount.")
				)
		else:
			apply_discount_fields_from_payload(
				jc,
				{
					"labour_discount": labour_discount,
					"parts_discount": parts_discount,
				},
			)
			changed = True
	elif discount_amount is not None:
		if wt == "Discount":
			# Legacy single lump from invoice UI — not stored as split fields
			jc.discount_amount = flt(discount_amount)
			changed = True
		elif flt(discount_amount) > 0:
			frappe.throw(
				_("Discount amount is only used when Warranty Application Type is Discount.")
			)

	if changed:
		jc.calculate_costing_and_totals()
		jc.db_update()
	return jc


def build_invoice_preview_from_job_card(
	job_card_name: str,
	warranty_application_type: str | None = None,
	discount_amount: float | None = None,
	labour_discount=None,
	parts_discount=None,
	rate_overrides=None,
	exclude_rows=None,
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
	lump_discount = flt(discount_amount) if discount_amount is not None else None
	labour_disc = (
		_normalize_standalone_discount(labour_discount)
		if labour_discount is not None
		else job_card_labour_discount_dict(jc)
	)
	parts_disc = (
		_normalize_standalone_discount(parts_discount)
		if parts_discount is not None
		else job_card_parts_discount_dict(jc)
	)

	overrides = normalize_rate_overrides(rate_overrides)
	excluded = _assert_exclude_rows_never_requested(
		jc.get("parts") or [], normalize_exclude_rows(exclude_rows), job_card=jc.name
	)
	lines = _build_preview_lines(jc, warranty_type, overrides, exclude_rows=excluded)

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

	discount = 0.0
	if warranty_type == "Discount":
		if labour_disc or parts_disc:
			labour_lines = [ln for ln in lines if ln["line_type"] == "Labour"]
			parts_lines = [ln for ln in lines if ln["line_type"] == "Parts"]
			if labour_disc:
				_apply_group_discount_on_preview_lines(labour_lines, labour_disc)
			if parts_disc:
				_apply_group_discount_on_preview_lines(parts_lines, parts_disc)
			discount = _group_discount_total_amount(labour_total, labour_disc) + _group_discount_total_amount(
				parts_total, parts_disc
			)
		else:
			discount = (
				lump_discount
				if lump_discount is not None
				else flt(jc.discount_amount)
			)
			if discount > 0:
				_distribute_discount_on_preview_lines(lines, discount)

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
		"labour_discount": labour_disc,
		"parts_discount": parts_disc,
		"estimated_total": invoice_estimated_total(
			labour_total, parts_total, warranty_type, discount
		),
		"currency": _currency_from_job_card(jc),
		"existing_invoice": get_active_job_card_invoice(jc.name),
		"add_full_warranty_item_on_invoice": add_full_warranty_item_on_invoice(),
	}


def create_sales_invoice_from_dms_job_card(
	job_card_name: str,
	due_date: str | None = None,
	submit: bool = False,
	warranty_application_type: str | None = None,
	discount_amount: float | None = None,
	labour_discount=None,
	parts_discount=None,
	rate_overrides=None,
	apply_taxes: bool = False,
	posting_date: str | None = None,
	exclude_rows=None,
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
		labour_discount=labour_discount,
		parts_discount=parts_discount,
	)

	if not jc.customer:
		frappe.throw(_("Customer is required on the Job Card to create an invoice."))

	if not jc.company:
		frappe.throw(_("Set Company on the Job Card before creating a Sales Invoice."))

	from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import is_internal_job_card

	if is_internal_job_card(jc):
		frappe.throw(
			_("Internal job cards are not invoiced. Parts are consumed via Material Issue when QC is passed.")
		)

	warranty_type = normalize_warranty_application_type(jc.warranty_application_type)
	excluded = _assert_exclude_rows_never_requested(
		jc.get("parts") or [], normalize_exclude_rows(exclude_rows), job_card=jc.name
	)
	preview = build_invoice_preview_from_job_card(job_card_name, exclude_rows=list(excluded))
	has_labour = preview.get("has_labour")

	if has_labour and not due_date:
		frappe.throw(_("Due date is required when the invoice includes labour items."))

	if warranty_type == "Discount":
		if job_card_labour_discount_dict(jc) or job_card_parts_discount_dict(jc):
			total_disc = job_card_combined_discount_amount(jc)
		else:
			total_disc = flt(jc.discount_amount)
		if total_disc < 1:
			frappe.throw(
				_(
					"Set a labour and/or parts discount (total at least 1) when "
					"Warranty Application Type is Discount."
				)
			)

	si = frappe.new_doc("Sales Invoice")
	si.custom_invoice_no = _generate_invoice_no(jc.company)
	si.company = jc.company
	si.customer = jc.customer
	si.posting_date = getdate(posting_date) if posting_date else getdate(today())
	si.set_posting_time = 1
	si.due_date = getdate(due_date) if due_date else si.posting_date
	si.remarks = _("DMS Job Card: {0}").format(jc.name)
	_set_sales_invoice_job_card_link(si, jc.name)
	_apply_sales_invoice_currency_from_job_card(si, jc)

	overrides = normalize_rate_overrides(rate_overrides)
	if overrides:
		_apply_rate_overrides_to_job_card(jc, overrides)
		jc = frappe.get_doc("DMS Job Card", job_card_name)

	line_fields = append_si_items(si, jc, warranty_type, overrides, exclude_rows=excluded)
	if not si.get("items"):
		frappe.throw(
			_(
				"Nothing to invoice: add Labour lines (Vehicle Service Item) "
				"and/or Parts with quantity on the job card."
			)
		)

	if hasattr(si, "ignore_pricing_rule"):
		si.ignore_pricing_rule = 1

	si.set_missing_values()
	# set_missing_values can reset currency from company / price list — re-apply from job card
	_apply_sales_invoice_currency_from_job_card(si, jc)
	_apply_sales_invoice_tax_choice(si, apply_taxes)
	_apply_dms_settings_dimensions_to_sales_invoice(si, jc.company)
	apply_company_letter_head(si, jc.company)

	# Keep selling rates on the lines (site script forbids rate=0). Warranty is
	# applied as an invoice-level discount after loyalty so it wins.
	_reapply_job_card_si_line_rates(si, line_fields)

	_apply_job_card_discounts_to_si(si, jc, warranty_type)
	_apply_loyalty_service_discount_to_si(si, jc.customer)
	_apply_warranty_as_invoice_discount(si, line_fields)

	_allow_zero_valuation_rate_when_missing(si)

	si.run_method("calculate_taxes_and_totals")
	_apply_warranty_as_invoice_discount(si, line_fields)
	si.run_method("calculate_taxes_and_totals")

	si.insert()

	if submit:
		si.submit()

	frappe.db.set_value("DMS Job Card", jc.name, "invoice", si.name, update_modified=True)
	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import stamp_job_card_timestamp

	stamp_job_card_timestamp(jc.name, "invoiced_at")

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


def _vehicle_service_item_name_and_code(vsi: str) -> tuple[str, str]:
	vsi = (vsi or "").strip()
	if not vsi:
		return "", ""
	meta = frappe.get_meta("Vehicle Service Item")
	name = ""
	if meta.has_field("custom_item_name"):
		name = (frappe.db.get_value("Vehicle Service Item", vsi, "custom_item_name") or "").strip()
	if not name:
		name = (frappe.db.get_value("Vehicle Service Item", vsi, "service_item") or "").strip()
	code = ""
	if meta.has_field("custom_service_code"):
		code = (frappe.db.get_value("Vehicle Service Item", vsi, "custom_service_code") or "").strip()
	return name or vsi, code


def _format_service_name_then_code(name: str, code: str) -> str:
	name = (name or "").strip()
	code = (code or "").strip()
	if name and code and name != code:
		return f"{name}: {code}"
	return name or code


def _labour_row_service_name(row) -> str:
	"""Service name first, then code — not complaint / diagnosis."""
	vsi = (getattr(row, "vehicle_service_item", None) or "").strip()
	name, code = _vehicle_service_item_name_and_code(vsi)
	if not name:
		name = strip_html(getattr(row, "service_name", None) or "").strip()
	return _format_service_name_then_code(name, code)


def _labour_row_issue_text(row) -> str:
	"""Complaint / diagnosis / correction — for hover only, not the line label."""
	parts = []
	for attr in ("complaint", "diagnosis", "correction"):
		text = strip_html(getattr(row, attr, None) or "").strip()
		if text:
			parts.append(text[:1200])
	return "\n".join(parts)


def _append_preview_line(
	lines: list[dict],
	*,
	line_type: str,
	item_code: str,
	description: str,
	qty: float,
	base_rate: float,
	warranty_application_type: str,
	source_row: str | None = None,
	issue: str | None = None,
	never_requested: bool = False,
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
			"issue": (issue or "")[:4096] or None,
			"qty": qty,
			"rate": pricing["rate"],
			"amount": pricing["amount"],
			"base_rate": round(flt(base_rate), 2),
			"discount_percentage": pricing["discount_percentage"],
			"is_warranty_covered": pricing["is_warranty_covered"],
			"source_row": source_row,
			"never_requested": never_requested,
		}
	)


def _build_preview_lines(
	jc, warranty_application_type: str, rate_overrides: dict[str, float] | None = None,
	exclude_rows: set[str] | None = None,
) -> list[dict]:
	"""Build preview line dicts; include all labour/parts with qty, apply warranty rates."""
	lines: list[dict] = []
	overrides = rate_overrides or {}
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
				base_rate = vehicle_service_item_labour_rate(row.vehicle_service_item)
			base_rate = _line_base_rate(base_rate, row.name, overrides)

			_append_preview_line(
				lines,
				line_type="Labour",
				item_code=item_code,
				description=_labour_row_service_name(row) or row.vehicle_service_item,
				qty=qty,
				base_rate=base_rate,
				warranty_application_type=warranty_application_type,
				source_row=row.name,
				issue=_labour_row_issue_text(row),
			)
	else:
		for ji in jc.get("job_items") or []:
			if not ji.labor_operation:
				continue
			base_rate = flt(
				frappe.db.get_value("Item", ji.labor_operation, "standard_rate") or 0
			)
			base_rate = _line_base_rate(base_rate, ji.name, overrides)
			item_name = (
				frappe.db.get_value("Item", ji.labor_operation, "item_name") or ji.labor_operation
			)
			issue = strip_html(getattr(ji, "complaint_description", None) or "").strip()
			_append_preview_line(
				lines,
				line_type="Labour",
				item_code=ji.labor_operation,
				description=item_name,
				qty=1,
				base_rate=base_rate,
				warranty_application_type=warranty_application_type,
				source_row=ji.name,
				issue=issue,
			)

	never_requested_rows = never_requested_part_row_names(
		jc.get("parts") or [], job_card=jc.name
	)

	for part in jc.get("parts") or []:
		if not part.item_code:
			continue

		if exclude_rows and part.name in exclude_rows:
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
		base_rate = _line_base_rate(base_rate, part.name, overrides)

		item_name = frappe.db.get_value("Item", erp_item, "item_name") or erp_item
		_append_preview_line(
			lines,
			line_type="Parts",
			item_code=erp_item,
			description=item_name,
			qty=qty,
			base_rate=base_rate,
			warranty_application_type=warranty_application_type,
			source_row=part.name,
			never_requested=part.name in never_requested_rows,
		)

	return lines


def _apply_rate_overrides_to_job_card(jc, overrides: dict[str, float]) -> None:
	"""Persist edited selling rates on the job card before invoicing.

	Only requires the Edit Price permission when an override actually
	*changes* the stored unit price / rate-per-hour (a direct price edit).
	Overrides equal to the current values (e.g. discount recalculations that
	re-send the same rates) are allowed for everyone.
	"""
	if not overrides:
		return

	from dms.dealer_management_system.utils.price_permissions import require_edit_price

	# Detect whether any override differs from the current stored value.
	actual_changes = False
	for row in jc.get("labour") or []:
		if row.name in overrides and abs(flt(row.rate_per_hour or 0) - flt(overrides[row.name])) >= 0.01:
			actual_changes = True
			break
	if not actual_changes:
		for row in jc.get("parts") or []:
			if row.name in overrides and abs(flt(row.unit_price or 0) - flt(overrides[row.name])) >= 0.01:
				actual_changes = True
				break

	# Only a real price change is a "direct edit" — require permission then.
	if actual_changes:
		require_edit_price()

	changed = False
	for row in jc.get("labour") or []:
		if row.name in overrides:
			row.rate_per_hour = flt(overrides[row.name])
			changed = True

	for row in jc.get("parts") or []:
		if row.name in overrides:
			row.unit_price = flt(overrides[row.name])
			changed = True

	if not changed:
		return

	jc.flags.ignore_validate_update_after_submit = True
	if hasattr(jc, "calculate_costing_and_totals"):
		jc.calculate_costing_and_totals()
	jc.save(ignore_permissions=True)
	frappe.db.commit()


def _group_discount_total_amount(group_total: float, discount: dict | None) -> float:
	if not discount:
		return 0.0
	return compute_group_discount_amount(
		group_total, discount.get("type"), discount.get("value")
	)


def _job_card_invoice_item_code_sets(jc) -> tuple[set[str], set[str]]:
	labour_codes: set[str] = set()
	parts_codes: set[str] = set()

	for row in jc.get("labour") or []:
		if not row.vehicle_service_item:
			continue
		item_code = resolve_vehicle_service_item_to_item_code(row.vehicle_service_item)
		if item_code:
			labour_codes.add(item_code)

	for ji in jc.get("job_items") or []:
		if ji.labor_operation:
			labour_codes.add(ji.labor_operation)

	for part in jc.get("parts") or []:
		if not part.item_code:
			continue
		erp_item = spare_part_erp_item_code(part.item_code)
		if erp_item:
			parts_codes.add(erp_item)

	return labour_codes, parts_codes


def _apply_group_discount_on_preview_lines(
	lines: list[dict], discount: dict | None
) -> None:
	if not discount:
		return
	billable = [ln for ln in lines if flt(ln.get("amount")) > 0]
	if not billable:
		return
	group_total = sum(flt(ln["amount"]) for ln in billable)
	total_disc = _group_discount_total_amount(group_total, discount)
	if total_disc <= 0:
		return
	if discount["type"] == "amount" and flt(discount["value"]) > group_total:
		frappe.throw(
			_("Discount amount cannot exceed group total ({0}).").format(
				frappe.bold(round(group_total, 2))
			)
		)
	_distribute_discount_on_preview_lines(billable, total_disc)


def _apply_group_discount_dict_to_si_items(items, discount: dict | None) -> None:
	if not discount or not items:
		return

	line_gross = []
	for row in items:
		qty = flt(row.qty)
		rate = flt(row.rate)
		if qty <= 0 or rate <= 0:
			line_gross.append(0.0)
			continue
		if flt(row.discount_percentage) >= 100:
			line_gross.append(0.0)
			continue
		line_gross.append(qty * rate)

	group_total = sum(line_gross)
	if group_total <= 0:
		return

	if discount["type"] == "amount" and flt(discount["value"]) > group_total:
		frappe.throw(
			_("Discount amount cannot exceed billable total ({0}).").format(
				frappe.bold(round(group_total, 2))
			)
		)

	total_disc = _group_discount_total_amount(group_total, discount)
	if total_disc <= 0:
		return

	use_dms = _sales_invoice_item_has_dms_discount_field()
	discount_cfg = {"type": "amount", "value": total_disc}
	final_rates: list[float] = []
	dms_discounts: list[float] = []

	for row, gross in zip(items, line_gross):
		if gross <= 0:
			final_rates.append(flt(row.rate))
			dms_discounts.append(0.0)
			continue
		qty = flt(row.qty)
		line_disc = _standalone_line_discount_amount(gross, group_total, discount_cfg)
		final_rates.append(flt((gross - line_disc) / qty) if qty else flt(row.rate))
		dms_discounts.append(line_disc)

	for idx, row in enumerate(items):
		if idx >= len(final_rates):
			break
		row.rate = final_rates[idx]
		row.price_list_rate = final_rates[idx]
		row.discount_percentage = 0
		row.discount_amount = 0
		if use_dms and idx < len(dms_discounts):
			row.custom_dms_discount = dms_discounts[idx]


def _apply_job_card_discounts_to_si(si, jc, warranty_type: str) -> None:
	if warranty_type != "Discount":
		return

	labour_disc = job_card_labour_discount_dict(jc)
	parts_disc = job_card_parts_discount_dict(jc)

	if labour_disc or parts_disc:
		labour_codes, parts_codes = _job_card_invoice_item_code_sets(jc)
		labour_items = []
		parts_items = []
		for row in si.get("items") or []:
			code = row.item_code
			if code in labour_codes:
				labour_items.append(row)
			elif code in parts_codes:
				parts_items.append(row)
			else:
				parts_items.append(row)

		if labour_disc:
			_apply_group_discount_dict_to_si_items(labour_items, labour_disc)
		if parts_disc:
			_apply_group_discount_dict_to_si_items(parts_items, parts_disc)
	elif flt(jc.discount_amount) > 0:
		_apply_distributed_amount_discount_to_si_items(si, jc.discount_amount)


def _apply_loyalty_service_discount_to_si(si, customer: str | None) -> None:
	"""Apply CRM loyalty tier service % as SI additional discount.

	Only when DMS CRM Settings → Apply Loyalty Discount is enabled.
	Job-card invoices set ignore_pricing_rule (rates come from the JC), so ERPNext
	Pricing Rules do not run here — apply the linked tier discount explicitly.
	"""
	if not customer:
		return
	if not frappe.db.exists("DocType", "DMS CRM Settings"):
		return
	if not cint(frappe.db.get_single_value("DMS CRM Settings", "apply_loyalty_discount") or 0):
		return
	if flt(getattr(si, "additional_discount_percentage", 0) or 0) > 0:
		return
	if flt(getattr(si, "discount_amount", 0) or 0) > 0:
		return
	try:
		from dms.crm_api.loyalty import get_service_discount_pct

		pct = flt(get_service_discount_pct(customer))
	except Exception:
		return
	if pct <= 0:
		return
	if hasattr(si, "additional_discount_percentage"):
		si.additional_discount_percentage = pct
		if hasattr(si, "apply_discount_on"):
			si.apply_discount_on = "Net Total"


def _distribute_discount_on_preview_lines(lines: list[dict], discount_amount: float) -> None:
	"""Apply fixed discount across billable preview lines (matches standalone / SI save)."""
	discount_amount = flt(discount_amount)
	if discount_amount <= 0 or not lines:
		return

	billable = [ln for ln in lines if flt(ln.get("amount")) > 0]
	group_total = sum(flt(ln["amount"]) for ln in billable)
	if group_total <= 0:
		return

	if discount_amount > group_total:
		discount_amount = group_total

	discount_cfg = {"type": "amount", "value": discount_amount}
	for line in billable:
		amt = flt(line["amount"])
		line_disc = _standalone_line_discount_amount(amt, group_total, discount_cfg)
		line["dms_discount"] = round(line_disc, 2)
		line["amount"] = round(amt - line_disc, 2)
		qty = flt(line.get("qty") or 1)
		if qty > 0:
			line["rate"] = round(line["amount"] / qty, 2)


def _apply_distributed_amount_discount_to_si_items(si, discount_amount: float) -> None:
	"""
	Spread a fixed discount across billable Sales Invoice item rows.
	Same rules as standalone amount discount: net rate on each line + custom_dms_discount audit.
	"""
	discount_amount = flt(discount_amount)
	if discount_amount <= 0:
		return

	items = list(si.get("items") or [])
	line_gross = []
	for row in items:
		qty = flt(row.qty)
		rate = flt(row.rate)
		if qty <= 0 or rate <= 0:
			line_gross.append(0.0)
			continue
		if flt(row.discount_percentage) >= 100:
			line_gross.append(0.0)
			continue
		line_gross.append(qty * rate)

	group_total = sum(line_gross)
	if group_total <= 0:
		return

	if discount_amount > group_total:
		frappe.throw(
			_("Discount amount cannot exceed billable total ({0}).").format(
				frappe.bold(round(group_total, 2))
			)
		)

	use_dms = _sales_invoice_item_has_dms_discount_field()
	discount_cfg = {"type": "amount", "value": discount_amount}
	final_rates: list[float] = []
	dms_discounts: list[float] = []

	for row, gross in zip(items, line_gross):
		if gross <= 0:
			final_rates.append(flt(row.rate))
			dms_discounts.append(0.0)
			continue
		qty = flt(row.qty)
		line_disc = _standalone_line_discount_amount(gross, group_total, discount_cfg)
		final_rates.append(flt((gross - line_disc) / qty) if qty else flt(row.rate))
		dms_discounts.append(line_disc)

	for idx, row in enumerate(items):
		if idx >= len(final_rates):
			break
		row.rate = final_rates[idx]
		row.price_list_rate = final_rates[idx]
		row.discount_percentage = 0
		row.discount_amount = 0
		if use_dms and idx < len(dms_discounts):
			row.custom_dms_discount = dms_discounts[idx]


def append_si_items(si, jc, warranty_application_type: str = "", rate_overrides=None, exclude_rows=None):
	"""Prefer Vehicle Labour breakdown; fallback to legacy Job Card Items; warranty-aware rates."""

	warranty_application_type = normalize_warranty_application_type(
		warranty_application_type or jc.warranty_application_type
	)
	overrides = normalize_rate_overrides(rate_overrides)
	excluded = normalize_exclude_rows(exclude_rows)
	line_fields: list[dict] = []

	def _append_priced_item(item_code: str, qty: float, pricing: dict):
		fields = _si_item_pricing_fields(pricing)
		child = si.append(
			"items",
			{
				"item_code": item_code,
				"qty": qty,
				**fields,
			},
		)
		line_fields.append(
			{
				**fields,
				"warranty_full_discount": flt(pricing.get("discount_percentage")) >= 100,
			}
		)
		return child

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
				base_rate = vehicle_service_item_labour_rate(row.vehicle_service_item)
			base_rate = _line_base_rate(base_rate, row.name, overrides)

			pricing = resolve_invoice_line_pricing(
				"Labour", base_rate, qty, warranty_application_type
			)
			if not pricing["include"]:
				continue

			child = _append_priced_item(item_code, qty, pricing)
			child.description = (_labour_row_service_name(row) or item_code)[:4096]

	else:
		for ji in jc.get("job_items") or []:
			if not ji.labor_operation:
				continue

			base_rate = flt(
				frappe.db.get_value("Item", ji.labor_operation, "standard_rate") or 0
			)
			base_rate = _line_base_rate(base_rate, ji.name, overrides)
			pricing = resolve_invoice_line_pricing(
				"Labour", base_rate, 1, warranty_application_type
			)
			if not pricing["include"]:
				continue

			child = _append_priced_item(ji.labor_operation, 1, pricing)
			item_name = (
				frappe.db.get_value("Item", ji.labor_operation, "item_name") or ji.labor_operation
			)
			child.description = (item_name or "")[:4096]

	for part in jc.get("parts") or []:
		if not part.item_code:
			continue

		if excluded and part.name in excluded:
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
		base_rate = _line_base_rate(base_rate, part.name, overrides)

		pricing = resolve_invoice_line_pricing(
			"Parts", base_rate, qty, warranty_application_type
		)
		if not pricing["include"]:
			continue

		row = _append_priced_item(erp_item, qty, pricing)
		_apply_stock_item_warehouse(row, erp_item, part, jc)

	return line_fields


def mark_sales_invoice_as_dms_ui_transaction(si) -> None:
	"""Flag standalone invoices from the DMS frontend (no job card)."""
	if frappe.get_meta("Sales Invoice").has_field("custom_is_dms_transaction"):
		si.custom_is_dms_transaction = 1
	if frappe.get_meta("Sales Invoice").has_field("custom_spare_parts"):
		si.custom_spare_parts = 1


def mark_sales_invoice_as_missing_dms(si) -> None:
	"""Flag catch-up invoices for past data that should have been DMS-linked."""
	if frappe.get_meta("Sales Invoice").has_field("custom_missing_dms"):
		si.custom_missing_dms = 1


def apply_missing_dms_vin_updates(
	vehicle_vin: str | None,
	customer: str | None,
	current_odometer=None,
) -> None:
	"""
	For DMS missing-invoice catch-up: push invoice customer / odometer onto VIN No.

	On customer change:
	- previous owner is archived into Customer History only
	- new owner is set on VIN No.current_customer (main field), not duplicated into history
	"""
	vin = (vehicle_vin or "").strip()
	if not vin:
		return
	if not frappe.db.exists("VIN No", vin):
		frappe.throw(_("VIN {0} not found.").format(frappe.bold(vin)))

	customer = (customer or "").strip() or None
	vin_doc = frappe.get_doc("VIN No", vin)
	vin_doc.check_permission("write")

	changed = False
	previous_customer = (vin_doc.current_customer or "").strip() or None

	if customer and previous_customer != customer:
		# Archive old owner into history; do not also insert the new owner there.
		if previous_customer:
			vin_doc._archive_customer_in_history(previous_customer)
		# Clear any leftover is_current flags so history is past owners only.
		archive_day = getdate(today())
		for row in vin_doc.get("customer_history") or []:
			if cint(row.is_current):
				row.is_current = 0
				if not row.to_date:
					row.to_date = archive_day
		vin_doc.current_customer = customer
		changed = True

	if current_odometer is not None and current_odometer != "":
		new_odo = cint(current_odometer)
		if new_odo < 0:
			frappe.throw(_("Odometer cannot be negative."))
		old_odo = cint(vin_doc.current_odometer or 0)
		if new_odo != old_odo:
			vin_doc.current_odometer = new_odo
			if frappe.get_meta("VIN No").has_field("odometer_last_updated"):
				from frappe.utils import now_datetime

				vin_doc.odometer_last_updated = now_datetime()
			changed = True

	if changed:
		# Prevent VIN No.sync_customer_history from appending the new owner to history.
		frappe.flags.skip_vin_customer_history_sync = True
		try:
			vin_doc.save()
		finally:
			frappe.flags.skip_vin_customer_history_sync = False


def _normalize_standalone_discount(discount) -> dict | None:
	"""Parse {type: percentage|amount, value: number} from API payload."""
	return parse_discount_payload(discount)


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
	is_dms_invoice: int | bool = 0,
	vehicle_vin: str | None = None,
	vehicle_brand: str | None = None,
	vehicle_model: str | None = None,
	current_odometer=None,
	apply_taxes: bool = False,
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
	if not warehouse:
		from dms.dealer_management_system.utils.stock_operations import get_dms_parts_warehouse

		warehouse = (get_dms_parts_warehouse(company) or "").strip()

	# Discounts reduce line rates — that is allowed without Edit Price permission.
	# Only direct unit-price/rate edits (with no discount) require Edit Price.
	if not labour_discount and not parts_discount:
		from dms.dealer_management_system.utils.price_permissions import (
			assert_price_allowed_if_changed,
		)

		for row in labour_lines:
			vsi = (row.get("vehicle_service_item") or "").strip()
			if not vsi:
				continue
			rate_sent = row.get("rate_per_hour") or row.get("rate")
			if rate_sent is not None and rate_sent != "":
				default = vehicle_service_item_labour_rate(vsi)
				assert_price_allowed_if_changed(default, rate_sent)

		for row in parts_lines:
			spare_part = (row.get("spare_part") or row.get("item_code") or "").strip()
			if not spare_part:
				continue
			price_sent = row.get("unit_price") or row.get("rate")
			if price_sent is not None and price_sent != "":
				default = spare_part_default_selling_price(spare_part)
				assert_price_allowed_if_changed(default, price_sent)
	vehicle_vin = (vehicle_vin or "").strip() or None
	vehicle_brand = (vehicle_brand or "").strip() or None
	vehicle_model = (vehicle_model or "").strip() or None

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
	si.posting_date = getdate(posting_date) if posting_date else getdate(today())
	si.set_posting_time = 1
	si.due_date = getdate(due_date) if due_date else si.posting_date

	invoice_remarks = (remarks or "").strip()
	try:
		from dms.api.spare_part_sales import _vehicle_remarks_suffix

		vehicle_suffix = _vehicle_remarks_suffix(
			vin=vehicle_vin,
			vehicle_brand=vehicle_brand,
			vehicle_model=vehicle_model,
		)
	except Exception:
		vehicle_suffix = ""
	if vehicle_suffix:
		invoice_remarks = f"{invoice_remarks}\n{vehicle_suffix}".strip() if invoice_remarks else vehicle_suffix
	if invoice_remarks:
		si.remarks = invoice_remarks

	# Always flag invoices created from the DMS UI standalone path.
	mark_sales_invoice_as_dms_ui_transaction(si)
	# Checkbox "DMS invoice" = catch-up / past data missing DMS linkage.
	if cint(is_dms_invoice):
		mark_sales_invoice_as_missing_dms(si)

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
			base_rate = vehicle_service_item_labour_rate(vsi)
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
	# Parallel to si.items: base/list rate, net rate, line discount total, optional %
	line_pricing: list[dict] = []

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
		disc_pct = (
			flt(labour_disc["value"])
			if labour_disc and labour_disc.get("type") == "percentage"
			else 0.0
		)
		line_pricing.append(
			{
				"base_rate": base_rate,
				"final_rate": final_rate,
				"line_discount": line_discount,
				"qty": qty,
				"discount_percentage": disc_pct,
			}
		)
		unit_disc = flt(line_discount / qty) if qty else 0.0
		item_row = {
			"item_code": item_code,
			"qty": qty,
			"price_list_rate": base_rate,
			"rate": final_rate,
			"discount_percentage": disc_pct,
			"discount_amount": 0.0 if disc_pct else unit_disc,
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
		disc_pct = (
			flt(parts_disc["value"])
			if parts_disc and parts_disc.get("type") == "percentage"
			else 0.0
		)
		line_pricing.append(
			{
				"base_rate": base_rate,
				"final_rate": final_rate,
				"line_discount": line_discount,
				"qty": qty,
				"discount_percentage": disc_pct,
			}
		)
		unit_disc = flt(line_discount / qty) if qty else 0.0
		item_row = {
			"item_code": erp_item,
			"qty": qty,
			"price_list_rate": base_rate,
			"rate": final_rate,
			"discount_percentage": disc_pct,
			"discount_amount": 0.0 if disc_pct else unit_disc,
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
	_apply_sales_invoice_tax_choice(si, apply_taxes)
	_apply_dms_settings_dimensions_to_sales_invoice(si, company)
	apply_company_letter_head(si, company)

	# set_missing_values / margin math can wipe net rates — force discounted pricing.
	_apply_standalone_line_pricing(si, line_pricing, use_dms_discount_field)

	_allow_zero_valuation_rate_when_missing(si)

	si.run_method("calculate_taxes_and_totals")
	# calculate_item_values may reset rate from rate_with_margin; re-apply net pricing.
	_apply_standalone_line_pricing(si, line_pricing, use_dms_discount_field)
	si.run_method("calculate_taxes_and_totals")

	si.insert()

	if submit:
		si.submit()

	if cint(is_dms_invoice) and vehicle_vin:
		apply_missing_dms_vin_updates(
			vehicle_vin=vehicle_vin,
			customer=customer,
			current_odometer=current_odometer,
		)

	return si.name


def _apply_standalone_line_pricing(si, line_pricing: list[dict], use_dms_discount_field: bool) -> None:
	"""Write base + ERPNext line discount + net rate so the bill reflects DMS discounts."""
	for idx, item in enumerate(si.get("items") or []):
		if idx >= len(line_pricing):
			break
		p = line_pricing[idx]
		qty = flt(item.qty) or flt(p.get("qty"))
		base = flt(p.get("base_rate"))
		final = flt(p.get("final_rate"))
		line_disc = flt(p.get("line_discount"))
		disc_pct = flt(p.get("discount_percentage"))
		unit_disc = flt(line_disc / qty) if qty else 0.0

		item.price_list_rate = base
		if disc_pct > 0:
			item.discount_percentage = disc_pct
			item.discount_amount = flt(base * disc_pct / 100.0)
		else:
			item.discount_percentage = 0
			item.discount_amount = unit_disc
		item.rate = final
		item.amount = flt(qty * final)
		item.net_rate = final
		item.net_amount = flt(qty * final)
		if use_dms_discount_field:
			item.custom_dms_discount = line_disc


def _apply_dms_settings_dimensions_to_sales_order(so, company: str):
	"""Copy accounting dimensions from DMS Settings onto Sales Order rows."""
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
	so_meta = frappe.get_meta("Sales Order")
	soi_meta = frappe.get_meta("Sales Order Item")
	tax_meta = frappe.get_meta("Sales Taxes and Charges")

	for df in cd_meta.fields:
		if df.fieldtype != "Link" or df.fieldname == "company":
			continue
		val = getattr(defaults_row, df.fieldname, None)
		if not val:
			continue
		if so_meta.has_field(df.fieldname):
			so.set(df.fieldname, val)
		if soi_meta.has_field(df.fieldname):
			for line in so.get("items") or []:
				line.set(df.fieldname, val)
		if tax_meta.has_field(df.fieldname):
			for tax in so.get("taxes") or []:
				tax.set(df.fieldname, val)


def mark_sales_order_as_spare_part_proforma(so) -> None:
	"""Flag spare-part proforma documents (Sales Order under the hood)."""
	if frappe.get_meta("Sales Order").has_field("custom_spare_parts_proforma"):
		so.custom_spare_parts_proforma = 1


def _apply_standalone_stock_warehouse_so(so_row, erp_item: str, warehouse: str, company: str) -> None:
	"""Set warehouse on Sales Order item row for stock spare parts."""
	if not cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
		return

	wh = (warehouse or "").strip()
	if not wh:
		frappe.throw(
			_("Warehouse is required for stock spare parts on proforma lines."),
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

	so_row.warehouse = wh


def create_standalone_dms_sales_order(
	customer: str,
	company: str,
	labour_lines=None,
	parts_lines=None,
	warehouse: str | None = None,
	currency: str | None = "ETB",
	delivery_date: str | None = None,
	transaction_date: str | None = None,
	remarks: str | None = None,
	submit: bool = False,
	labour_discount=None,
	parts_discount=None,
) -> str:
	"""Create a Sales Order for DMS proforma (labour and/or spare parts)."""
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

	# Discounts reduce line rates — allowed without Edit Price. Only direct
	# unit-price/rate edits (no discounts) require Edit Price permission.
	if not labour_discount and not parts_discount:
		from dms.dealer_management_system.utils.price_permissions import (
			assert_price_allowed_if_changed,
		)

		for row in labour_lines:
			vsi = (row.get("vehicle_service_item") or "").strip()
			if not vsi:
				continue
			rate_sent = row.get("rate_per_hour") or row.get("rate")
			if rate_sent is not None and rate_sent != "":
				default = vehicle_service_item_labour_rate(vsi)
				assert_price_allowed_if_changed(default, rate_sent)

		for row in parts_lines:
			spare_part = (row.get("spare_part") or row.get("item_code") or "").strip()
			if not spare_part:
				continue
			price_sent = row.get("unit_price") or row.get("rate")
			if price_sent is not None and price_sent != "":
				default = spare_part_default_selling_price(spare_part)
				assert_price_allowed_if_changed(default, price_sent)

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
			_("Select a warehouse for spare parts on this proforma."),
			title=_("Warehouse required"),
		)

	so = frappe.new_doc("Sales Order")
	so.company = company
	so.customer = customer
	so.transaction_date = transaction_date or today()
	so.delivery_date = delivery_date or so.transaction_date
	if remarks and frappe.get_meta("Sales Order").has_field("remarks"):
		so.remarks = remarks
	mark_sales_order_as_spare_part_proforma(so)

	order_currency = (currency or "ETB").strip() or "ETB"
	if not frappe.db.exists("Currency", order_currency):
		frappe.throw(_("Currency {0} is not defined in ERPNext.").format(frappe.bold(order_currency)))
	so.currency = order_currency

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
			base_rate = vehicle_service_item_labour_rate(vsi)
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

	item_final_rates: list[float] = []

	for row in labour_lines:
		qty, base_rate, line_amount, missing_vsi = _standalone_labour_line_amount(row)
		if missing_vsi:
			frappe.throw(
				_(
					"Vehicle Service Item {0}: link to an ERP Item before creating a proforma."
				).format(frappe.bold(missing_vsi))
			)
		if qty <= 0:
			continue
		vsi = (row.get("vehicle_service_item") or "").strip()
		item_code = resolve_vehicle_service_item_to_item_code(vsi)
		final_rate = _standalone_discounted_unit_rate(
			qty, base_rate, line_amount, labour_group_total, labour_disc
		)
		item_final_rates.append(final_rate)
		item_row = {
			"item_code": item_code,
			"qty": qty,
			"rate": final_rate,
			"delivery_date": so.delivery_date,
			"description": (row.get("description") or "")[:4096] or None,
		}
		so.append("items", item_row)

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
		final_rate = _standalone_discounted_unit_rate(
			qty, base_rate, line_amount, parts_group_total, parts_disc
		)
		item_final_rates.append(final_rate)
		item_row = {
			"item_code": erp_item,
			"qty": qty,
			"rate": final_rate,
			"delivery_date": so.delivery_date,
		}
		child = so.append("items", item_row)
		_apply_standalone_stock_warehouse_so(child, erp_item, warehouse, company)

	if not so.get("items"):
		frappe.throw(_("Add at least one labour or spare part line to create a proforma."))

	if hasattr(so, "ignore_pricing_rule"):
		so.ignore_pricing_rule = 1

	so.set_missing_values()
	so.currency = order_currency
	_apply_dms_settings_dimensions_to_sales_order(so, company)
	apply_company_letter_head(so, company)

	for idx, item_row in enumerate(so.get("items") or []):
		if idx < len(item_final_rates):
			final_rate = item_final_rates[idx]
			item_row.rate = final_rate
			item_row.price_list_rate = final_rate
			item_row.discount_percentage = 0
			item_row.discount_amount = 0

	so.run_method("calculate_taxes_and_totals")
	so.insert()

	if submit:
		so.submit()

	return so.name
