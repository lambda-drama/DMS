# Copyright (c) 2026, Mania and contributors
"""CRM Opportunity APIs — dms.crm_api.opportunities."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, getdate, now_datetime, today

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Opportunity"

LIST_FIELDS = [
	"name",
	"title",
	"stage",
	"status",
	"customer",
	"lead",
	"opportunity_owner",
	"expected_value",
	"currency",
	"probability",
	"expected_close_date",
	"brand",
	"model",
	"quotation",
	"sales_appointment",
	"test_drive",
	"sales_order",
	"sales_invoice",
	"company",
	"branch",
	"next_action_due",
	"creation",
	"modified",
]

QUOTABLE_STAGES = {
	"Test Drive",
	"Negotiation",
	"Booking / Deposit",
	"Order Confirmed",
	"Quotation Submitted",
	"Won",
}


def _enrich(row: dict) -> dict:
	row["owner_name"] = user_display_name(row.get("opportunity_owner"))
	row["customer_name"] = customer_display_name(row.get("customer"))
	return row


def _ensure_quotation_link_field():
	"""Link standard Quotation back to DMS CRM Opportunity."""
	if frappe.db.exists("Custom Field", {"dt": "Quotation", "fieldname": "custom_dms_crm_opportunity"}):
		return
	from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

	create_custom_fields(
		{
			"Quotation": [
				{
					"fieldname": "custom_dms_crm_opportunity",
					"label": "DMS CRM Opportunity",
					"fieldtype": "Link",
					"options": "DMS CRM Opportunity",
					"insert_after": "opportunity",
					"read_only": 1,
					"print_hide": 1,
				}
			]
		},
		ignore_validate=True,
		update=True,
	)


def _default_company():
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies

	companies = get_dms_companies()
	return companies[0] if companies else None


def _vin_label(vin_name: str | None) -> str | None:
	"""Human-readable VIN / chassis number for custom_serial_no."""
	vin_name = (vin_name or "").strip()
	if not vin_name:
		return None
	if not frappe.db.exists("DocType", "VIN No"):
		return vin_name
	if not frappe.db.exists("VIN No", vin_name):
		return vin_name
	row = frappe.db.get_value(
		"VIN No",
		vin_name,
		["name", "vin_number", "plate_number"],
		as_dict=True,
	)
	if not row:
		return vin_name
	return (row.vin_number or row.plate_number or row.name or vin_name).strip() or vin_name


def _resolve_sellable_item_code(item_code: str) -> str:
	"""Map deal line codes to ERPNext Item (handles Spare Part links)."""
	item_code = (item_code or "").strip()
	if not item_code:
		return item_code
	if frappe.db.exists("Item", item_code):
		return item_code
	try:
		from dms.dealer_management_system.utils.stock_operations import (
			resolve_spare_part_erp_item_code,
		)

		resolved = resolve_spare_part_erp_item_code(item_code)
		if resolved:
			return resolved
	except Exception:
		pass
	by_item_code = frappe.db.get_value("Item", {"item_code": item_code}, "name")
	return by_item_code or item_code


def _quotation_currency_for_doc(doc) -> str:
	"""Quotations use the company currency, not an arbitrary deal currency."""
	if doc.company:
		currency = frappe.db.get_value("Company", doc.company, "default_currency")
		if currency:
			return currency
	return (doc.currency or "").strip() or frappe.defaults.get_global_default("currency") or "USD"


def _quotation_selling_price_list(doc, currency: str) -> str | None:
	"""Pick a price list denominated in the company currency when possible."""
	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_default_selling_price_list,
	)

	candidates: list[str | None] = [get_dms_default_selling_price_list()]
	if doc.customer:
		candidates.append(frappe.db.get_value("Customer", doc.customer, "default_price_list"))
	candidates.append(frappe.db.get_value("Selling Settings", None, "selling_price_list"))

	for price_list in candidates:
		if not price_list:
			continue
		pl_currency = frappe.db.get_value("Price List", price_list, "currency")
		if not pl_currency or pl_currency == currency:
			return price_list

	return (
		frappe.db.get_value(
			"Price List",
			{"currency": currency, "enabled": 1, "selling": 1},
			"name",
			order_by="creation asc",
		)
		or candidates[-1]
	)


def _ensure_quotation_item_names(quotation):
	for row in quotation.get("items") or []:
		if not row.item_code:
			continue
		if (row.item_name or "").strip():
			continue
		row.item_name = (
			frappe.db.get_value("Item", row.item_code, "item_name") or row.item_code
		)
		if not row.uom:
			row.uom = frappe.db.get_value("Item", row.item_code, "stock_uom")


def _append_quotation_item(quotation, row: dict):
	row = _enrich_quotation_item(row, quotation=quotation)
	item_code = row["item_code"]
	if not item_code:
		frappe.throw(_("Each quotation line requires an Item."))
	if not frappe.db.exists("Item", item_code):
		frappe.throw(_("Item {0} was not found in ERPNext.").format(item_code))

	child = quotation.append(
		"items",
		{
			"item_code": item_code,
			"item_name": row["item_name"],
			"description": row.get("description"),
			"qty": flt(row.get("qty")) or 1,
			"uom": row.get("uom"),
			"rate": flt(row.get("rate")),
			"discount_percentage": flt(row.get("discount_percentage")),
		},
	)
	if not (child.item_name or "").strip():
		child.item_name = frappe.db.get_value("Item", item_code, "item_name") or item_code
	return child


def _enrich_quotation_item(row: dict, *, quotation=None) -> dict:
	"""Fill item_name / uom / description / rate from Item (or linked Spare Part)."""
	raw_code = (row.get("item_code") or "").strip()
	if not raw_code:
		return row
	item_code = _resolve_sellable_item_code(raw_code)
	enriched = dict(row)
	enriched["item_code"] = item_code
	if not frappe.db.exists("Item", item_code):
		if not (enriched.get("item_name") or "").strip():
			enriched["item_name"] = raw_code
		return enriched

	item = frappe.db.get_value(
		"Item",
		item_code,
		["item_name", "description", "stock_uom", "standard_rate"],
		as_dict=True,
	)
	if item:
		if not (enriched.get("item_name") or "").strip():
			enriched["item_name"] = item.item_name or item_code
		if not (enriched.get("description") or "").strip():
			enriched["description"] = item.description
		if not (enriched.get("uom") or "").strip():
			enriched["uom"] = item.stock_uom
		if not flt(enriched.get("rate")):
			enriched["rate"] = flt(item.standard_rate)

	if quotation and not flt(enriched.get("rate")):
		try:
			from erpnext.stock.get_item_details import get_item_details

			details = get_item_details(
				frappe._dict(
					{
						"item_code": item_code,
						"company": quotation.company,
						"customer": quotation.party_name,
						"currency": quotation.currency,
						"conversion_rate": quotation.conversion_rate or 1,
						"price_list": quotation.selling_price_list,
						"plc_conversion_rate": quotation.plc_conversion_rate or 1,
						"transaction_date": quotation.transaction_date,
						"qty": flt(enriched.get("qty")) or 1,
						"doctype": "Quotation",
					}
				)
			)
			enriched["rate"] = flt(
				details.get("price_list_rate") or details.get("rate") or details.get("standard_rate")
			)
		except Exception:
			pass

	if not (enriched.get("item_name") or "").strip():
		enriched["item_name"] = item_code
	return enriched


def _collect_opportunity_vin_labels(doc) -> list[str]:
	"""All vehicle VINs tied to a deal — test drives, allocation, booking."""
	seen: set[str] = set()
	labels: list[str] = []

	def _add(vin_name: str | None):
		label = _vin_label(vin_name)
		if not label or label in seen:
			return
		seen.add(label)
		labels.append(label)

	if frappe.db.exists("DocType", "DMS CRM Test Drive"):
		for row in frappe.get_all(
			"DMS CRM Test Drive",
			filters={"opportunity": doc.name, "vehicle_vin": ["is", "set"]},
			fields=["vehicle_vin", "scheduled_datetime", "modified"],
			order_by="scheduled_datetime desc, modified desc",
		):
			_add(row.vehicle_vin)

	_add(getattr(doc, "allocated_vin", None))

	if getattr(doc, "test_drive", None) and frappe.db.exists("DMS CRM Test Drive", doc.test_drive):
		_add(frappe.db.get_value("DMS CRM Test Drive", doc.test_drive, "vehicle_vin"))

	if getattr(doc, "booking", None) and frappe.db.exists("DMS CRM Booking", doc.booking):
		_add(frappe.db.get_value("DMS CRM Booking", doc.booking, "vehicle_vin"))

	return labels


def _apply_custom_serial_no(target, vin_labels: list[str] | None = None, *, opportunity=None):
	"""Stamp Quotation / Sales Order custom_serial_no with one VIN per line."""
	if not getattr(target, "meta", None) or not target.meta.has_field("custom_serial_no"):
		return
	if vin_labels is None and opportunity is not None:
		vin_labels = _collect_opportunity_vin_labels(opportunity)
	if not vin_labels:
		return
	target.custom_serial_no = "\n".join(vin_labels)


def _merge_custom_serial_no(target, vin_labels: list[str]):
	"""Append VINs without duplicating existing custom_serial_no lines."""
	if not getattr(target, "meta", None) or not target.meta.has_field("custom_serial_no"):
		return
	existing = [line.strip() for line in (target.custom_serial_no or "").splitlines() if line.strip()]
	seen = set(existing)
	merged = list(existing)
	for label in vin_labels:
		if label and label not in seen:
			seen.add(label)
			merged.append(label)
	if merged:
		target.custom_serial_no = "\n".join(merged)


def _vehicle_item_from_test_drive(doc) -> tuple[dict | None, dict | None]:
	"""Build the vehicle line from the linked test-drive VIN."""
	if not doc.test_drive or not frappe.db.exists("DMS CRM Test Drive", doc.test_drive):
		return None, None

	vin_name = frappe.db.get_value("DMS CRM Test Drive", doc.test_drive, "vehicle_vin")
	if not vin_name or not frappe.db.exists("VIN No", vin_name):
		return None, None

	vin = frappe.db.get_value(
		"VIN No",
		vin_name,
		["name", "vin_number", "linked_item", "model_name"],
		as_dict=True,
	)
	item_code = _resolve_sellable_item_code((vin.linked_item or "").strip())
	vin_meta = {
		"name": vin.name,
		"vin_number": vin.vin_number or vin.name,
		"model_name": vin.model_name,
		"linked_item": item_code,
	}
	if not item_code or not frappe.db.exists("Item", item_code):
		return None, vin_meta

	item = frappe.db.get_value(
		"Item",
		item_code,
		["item_code", "item_name", "description", "stock_uom", "standard_rate"],
		as_dict=True,
	)
	row = _enrich_quotation_item(
		{
			"item_code": item.item_code or item_code,
			"item_name": item.item_name or item_code,
			"description": item.description,
			"qty": 1,
			"uom": item.stock_uom,
			"rate": flt(item.standard_rate),
			"discount_percentage": 0,
			"line_source": "vehicle",
		}
	)
	return row, vin_meta


def _quotation_items_from_opportunity_or_vin(doc) -> tuple[list[dict], dict | None]:
	"""Deal spare-part / accessory lines plus the test-drive vehicle when present."""
	items = [
		_enrich_quotation_item(
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"description": row.description,
				"qty": flt(row.qty) or 1,
				"uom": row.uom,
				"rate": flt(row.rate),
				"discount_percentage": flt(row.discount_percentage),
				"line_source": "deal",
			}
		)
		for row in (doc.items or [])
		if (row.item_code or "").strip()
	]

	vehicle_row, vin = _vehicle_item_from_test_drive(doc)
	if vehicle_row:
		existing_codes = {(row.get("item_code") or "").strip() for row in items}
		if vehicle_row["item_code"] not in existing_codes:
			items.insert(0, vehicle_row)

	if items:
		return items, vin

	if not doc.test_drive or not frappe.db.exists("DMS CRM Test Drive", doc.test_drive):
		frappe.throw(_("Add Items to the deal, or complete a Test Drive with a VIN."))

	if vin and not vin.get("linked_item"):
		frappe.throw(
			_(
				"VIN / stock unit {0} has no valid ERPNext Item. Set Linked Item on the VIN record first."
			).format(vin.get("vin_number") or vin.get("name"))
		)

	frappe.throw(_("The completed Test Drive has no VIN / stock unit selected."))


def _store_derived_vin_item(doc, items: list[dict], vin: dict | None):
	"""Persist the test-drive vehicle item on the deal when spare parts were added first."""
	vehicle_row, _vin = _vehicle_item_from_test_drive(doc)
	if not vehicle_row:
		return
	existing_codes = {(row.item_code or "").strip() for row in (doc.items or [])}
	if vehicle_row["item_code"] in existing_codes:
		return
	doc.append(
		"items",
		{
			"item_code": vehicle_row["item_code"],
			"item_name": vehicle_row.get("item_name"),
			"description": vehicle_row.get("description"),
			"qty": vehicle_row.get("qty") or 1,
			"uom": vehicle_row.get("uom"),
			"rate": vehicle_row.get("rate") or 0,
			"discount_percentage": vehicle_row.get("discount_percentage") or 0,
		},
	)


def _apply_dms_taxes_to_quotation(quotation, apply_taxes: bool):
	"""Match DMS invoice behaviour: only DMS Settings tax template, never customer/company defaults."""
	quotation.set("taxes", [])
	quotation.taxes_and_charges = None
	if quotation.meta.has_field("tax_category"):
		quotation.tax_category = None
	if quotation.meta.has_field("tax_withholding_category"):
		quotation.tax_withholding_category = None
	if quotation.meta.has_field("apply_tds"):
		quotation.apply_tds = 0

	# Stop AccountsController from re-applying company / customer / item templates
	quotation.set_taxes_and_charges = lambda *args, **kwargs: None
	quotation.set_taxes = lambda *args, **kwargs: None
	if hasattr(quotation, "append_taxes_from_item_tax_template"):
		quotation.append_taxes_from_item_tax_template = lambda *args, **kwargs: None

	if not apply_taxes:
		return None

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		get_dms_default_taxes_and_charges_template,
	)
	from erpnext.controllers.accounts_controller import get_taxes_and_charges

	template = get_dms_default_taxes_and_charges_template(getattr(quotation, "company", None))
	quotation.taxes_and_charges = template
	for tax in get_taxes_and_charges("Sales Taxes and Charges Template", template) or []:
		quotation.append("taxes", tax)
	return template


def _build_quotation_totals_preview(doc, items: list[dict], apply_taxes: bool) -> dict:
	"""In-memory Quotation totals so the UI can show VAT before create."""
	currency = _quotation_currency_for_doc(doc)
	quotation = frappe.new_doc("Quotation")
	quotation.quotation_to = "Customer"
	quotation.party_name = doc.customer
	quotation.company = doc.company
	quotation.currency = currency
	quotation.conversion_rate = 1
	quotation.transaction_date = getdate(doc.transaction_date) or today()
	quotation.order_type = "Sales"
	quotation.selling_price_list = _quotation_selling_price_list(doc, currency)
	for row in items:
		_append_quotation_item(quotation, row)

	template = None
	try:
		quotation.run_method("set_missing_values")
		quotation.currency = currency
		quotation.conversion_rate = 1
		_ensure_quotation_item_names(quotation)
		template = _apply_dms_taxes_to_quotation(quotation, apply_taxes)
		quotation.run_method("calculate_taxes_and_totals")
	except Exception as e:
		# Still return net if tax template is missing / misconfigured
		net = sum(
			(flt(r.get("qty")) or 1)
			* flt(r.get("rate"))
			* (1 - flt(r.get("discount_percentage")) / 100)
			for r in items
		)
		return {
			"currency": currency,
			"net_total": net,
			"total_taxes_and_charges": 0,
			"grand_total": net,
			"taxes_and_charges": None,
			"apply_taxes": cint(apply_taxes),
			"tax_error": str(e) if cint(apply_taxes) else None,
		}

	return {
		"currency": currency,
		"net_total": flt(quotation.net_total),
		"total_taxes_and_charges": flt(quotation.total_taxes_and_charges),
		"grand_total": flt(quotation.grand_total),
		"taxes_and_charges": template or quotation.taxes_and_charges,
		"apply_taxes": cint(apply_taxes),
		"taxes": [
			{
				"description": row.description,
				"rate": flt(row.rate),
				"tax_amount": flt(row.tax_amount),
			}
			for row in (quotation.taxes or [])
		],
	}


def _apply_payload(doc, payload: dict, *, allow_readonly=False):
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML", "Table")
		and (allow_readonly or not df.read_only)
	}
	table_keys = {"items", "fleet_requirements"}
	for key, value in (payload or {}).items():
		if key in table_keys:
			continue
		if key in allowed:
			doc.set(key, value)

	if "items" in (payload or {}):
		doc.set("items", [])
		for row in payload.get("items") or []:
			if not isinstance(row, dict):
				continue
			if not (row.get("item_code") or "").strip():
				continue
			resolved_code = _resolve_sellable_item_code(row.get("item_code") or "")
			doc.append(
				"items",
				{
					"item_code": resolved_code,
					"item_name": row.get("item_name"),
					"description": row.get("description"),
					"qty": flt(row.get("qty") or 1),
					"uom": row.get("uom"),
					"rate": flt(row.get("rate") or 0),
					"discount_percentage": flt(row.get("discount_percentage") or 0),
				},
			)

	if "fleet_requirements" in (payload or {}):
		doc.set("fleet_requirements", [])
		for row in payload.get("fleet_requirements") or []:
			if not isinstance(row, dict):
				continue
			if not (row.get("model") or row.get("specification") or row.get("quantity")):
				continue
			doc.append(
				"fleet_requirements",
				{
					"model": row.get("model"),
					"specification": row.get("specification"),
					"quantity": cint(row.get("quantity") or 1),
					"preferred_color": row.get("preferred_color"),
					"unit_price": flt(row.get("unit_price") or 0),
					"body_building_notes": row.get("body_building_notes"),
					"delivery_location": row.get("delivery_location"),
					"delivery_batch": row.get("delivery_batch"),
					"delivery_date": row.get("delivery_date"),
				},
			)


def _normalize_links(doc):
	if not (doc.customer or "").strip():
		doc.customer = None
	elif not frappe.db.exists("Customer", doc.customer):
		frappe.throw(_("Customer {0} not found. Select a customer from the list.").format(doc.customer))

	if not (doc.lead or "").strip():
		doc.lead = None
	if not (doc.brand or "").strip():
		doc.brand = None
	if not (doc.model or "").strip():
		doc.model = None
	if not (doc.preferred_color or "").strip():
		doc.preferred_color = None
	if not (doc.branch or "").strip():
		doc.branch = None


@frappe.whitelist()
def get_opportunities(status=None, stage=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	stage = (stage or "").strip()
	if stage and stage != "all":
		filters["stage"] = stage

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["title", "like", f"%{search}%"],
			["customer", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["model", "like", f"%{search}%"],
			["brand", "like", f"%{search}%"],
		]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters or None,
		fields=LIST_FIELDS,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	total = frappe.db.count(DOCTYPE, filters=filters)
	return {
		"data": [_enrich(dict(r)) for r in rows],
		"total": total,
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_opportunity(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Opportunity name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["owner_name"] = user_display_name(doc.opportunity_owner)
	data["customer_name"] = customer_display_name(doc.customer)
	if doc.get("account"):
		data["account_name"] = frappe.db.get_value(
			"DMS CRM Account", doc.account, "account_name"
		)
	if doc.get("tender"):
		data["tender_title"] = frappe.db.get_value("DMS CRM Tender", doc.tender, "title")
	if doc.get("framework_agreement"):
		data["framework_agreement_title"] = frappe.db.get_value(
			"DMS CRM Framework Agreement", doc.framework_agreement, "agreement_title"
		)
	for fieldname, doctype in (
		("sales_appointment", "DMS CRM Sales Appointment"),
		("test_drive", "DMS CRM Test Drive"),
		("quotation", "Quotation"),
		("booking", "DMS CRM Booking"),
		("delivery_readiness", "DMS CRM Delivery Readiness"),
		("sales_order", "Sales Order"),
		("sales_invoice", "Sales Invoice"),
	):
		value = doc.get(fieldname)
		if value and frappe.db.exists(doctype, value):
			fields = ["name", "docstatus", "modified"]
			meta = frappe.get_meta(doctype)
			for candidate in (
				"status",
				"appointment_datetime",
				"scheduled_datetime",
				"outcome",
				"deposit_amount",
				"receipt_reference",
				"booking_expiry",
				"vehicle_vin",
				"payment_status",
				"documentation_status",
				"pdi_status",
				"grand_total",
				"update_stock",
			):
				if meta.has_field(candidate):
					fields.append(candidate)
			data[f"{fieldname}_details"] = frappe.db.get_value(
				doctype, value, fields, as_dict=True
			)
	return data


@frappe.whitelist()
def create_opportunity(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload:
		frappe.throw(_("Opportunity data is required."))
	doc = frappe.new_doc(DOCTYPE)
	_apply_payload(doc, payload, allow_readonly=True)
	_normalize_links(doc)
	if not doc.opportunity_owner:
		doc.opportunity_owner = frappe.session.user
	if not doc.status:
		doc.status = "Open"
	if not doc.stage:
		doc.stage = "New"
	if not doc.transaction_date:
		doc.transaction_date = today()
	if not doc.company:
		doc.company = _default_company()
	if not doc.company:
		frappe.throw(_("Company is required."))
	if not doc.currency and doc.company:
		doc.currency = frappe.db.get_value("Company", doc.company, "default_currency")
	# Blueprint §6.2 / §22.4 — pipeline discipline defaults
	if doc.status in ("Open", "On Hold", None, "") and doc.stage != "Nurture":
		if not doc.next_action:
			doc.next_action = "Follow up"
		if not doc.next_action_due:
			doc.next_action_due = now_datetime()
		if not doc.expected_close_date:
			doc.expected_close_date = add_days(today(), 14)
	doc.insert()
	frappe.db.commit()
	return get_opportunity(doc.name)


@frappe.whitelist()
def update_opportunity(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Opportunity name is required."))
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	_apply_payload(doc, payload)
	_normalize_links(doc)
	doc.save()
	frappe.db.commit()
	return get_opportunity(doc.name)


@frappe.whitelist()
def get_quotation_preview(name, apply_taxes=0):
	"""Show the VIN, ERPNext item and expected amount before creating a Quotation."""
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Opportunity name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	items, vin = _quotation_items_from_opportunity_or_vin(doc)
	currency = _quotation_currency_for_doc(doc)
	preview_ctx = frappe._dict(
		{
			"company": doc.company,
			"party_name": doc.customer,
			"currency": currency,
			"conversion_rate": 1,
			"selling_price_list": _quotation_selling_price_list(doc, currency),
			"transaction_date": getdate(doc.transaction_date) or today(),
		}
	)
	items = [_enrich_quotation_item(row, quotation=preview_ctx) for row in items]
	rows = []
	for row in items:
		qty = flt(row.get("qty")) or 1
		rate = flt(row.get("rate"))
		discount = flt(row.get("discount_percentage"))
		amount = qty * rate
		rows.append(
			{
				**row,
				"amount": amount,
				"discount_amount": amount * discount / 100,
				"net_amount": amount * (1 - discount / 100),
			}
		)
	totals = _build_quotation_totals_preview(doc, items, cint(apply_taxes))
	dms_tax_template = (
		frappe.db.get_single_value("DMS Settings", "default_taxes_and_charges_template") or ""
	)
	currency = totals.get("currency")
	currency_symbol = (
		frappe.db.get_value("Currency", currency, "symbol") if currency else None
	) or currency
	has_deal_items = any((row.get("item_code") or "").strip() for row in (doc.items or []))
	has_vehicle = bool(vin and vin.get("linked_item"))
	if has_deal_items and has_vehicle:
		source = "Deal items + Test Drive vehicle"
	elif has_deal_items:
		source = "Deal items"
	elif has_vehicle:
		source = "Test Drive VIN"
	else:
		source = "Deal"
	return {
		"currency": currency,
		"currency_symbol": currency_symbol,
		"vin": vin,
		"vin_labels": _collect_opportunity_vin_labels(doc),
		"items": rows,
		"net_total": totals.get("net_total"),
		"total_taxes_and_charges": totals.get("total_taxes_and_charges"),
		"grand_total": totals.get("grand_total"),
		"taxes_and_charges": totals.get("taxes_and_charges"),
		"taxes": totals.get("taxes") or [],
		"apply_taxes": cint(apply_taxes),
		"tax_error": totals.get("tax_error"),
		"dms_taxes_and_charges_template": dms_tax_template,
		"source": source,
	}


@frappe.whitelist()
def get_opportunity_form_options():
	"""Stages, statuses, companies for CRM opportunity forms."""
	ensure_crm_read(DOCTYPE)
	meta = frappe.get_meta(DOCTYPE)

	def _options(fieldname, fallback):
		df = meta.get_field(fieldname)
		raw = (df.options or "") if df else ""
		opts = [o.strip() for o in raw.split("\n") if o.strip()]
		return opts or list(fallback)

	from dms.dealer_management_system.utils.company_permissions import get_dms_companies
	from dms.dealer_management_system.utils.branch_permissions import get_dms_branches

	companies = get_dms_companies()
	default_company = None
	try:
		settings = frappe.get_cached_doc("DMS CRM Settings")
		default_company = settings.default_company
	except Exception:
		pass
	if default_company not in companies:
		default_company = companies[0] if companies else None

	branches = [row["name"] for row in get_dms_branches(company=default_company, limit=500)]

	currency = None
	currency_symbol = None
	if default_company:
		currency = frappe.db.get_value("Company", default_company, "default_currency")
		if currency:
			currency_symbol = frappe.db.get_value("Currency", currency, "symbol") or currency

	users = frappe.get_all(
		"User",
		filters={"enabled": 1, "user_type": "System User"},
		fields=["name", "full_name"],
		order_by="full_name asc",
		limit_page_length=200,
	)

	return {
		"stages": _options(
			"stage",
			[
				"New",
				"Contact Attempted",
				"Contacted",
				"Qualified",
				"Appointment Scheduled",
				"Test Drive",
				"Quotation Submitted",
				"Negotiation",
				"Booking / Deposit",
				"Order Confirmed",
				"Won",
				"Lost",
				"Nurture",
			],
		),
		"statuses": _options("status", ["Open", "On Hold", "Won", "Lost", "Cancelled"]),
		"opportunity_types": _options(
			"opportunity_type",
			["Sales", "Maintenance", "Fleet", "Tender", "Trade-In", "Other"],
		),
		"companies": companies,
		"default_company": default_company,
		"branches": branches,
		"currency": currency,
		"currency_symbol": currency_symbol,
		"users": [{"value": u.name, "label": u.full_name or u.name} for u in users],
	}


@frappe.whitelist()
def create_sales_appointment(name, data=None):
	"""Schedule the sales appointment that unlocks Appointment Scheduled."""
	ensure_crm_write(DOCTYPE)
	ensure_crm_create("DMS CRM Sales Appointment")
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	if not doc.customer:
		frappe.throw(_("Link a Customer before scheduling an appointment."))
	if not doc.company:
		frappe.throw(_("Select the operating Company on the deal first."))
	dt = str(payload.get("appointment_datetime") or "").replace("T", " ").strip()
	if len(dt) == 16:
		dt += ":00"
	if not dt:
		frappe.throw(_("Appointment date and time are required."))

	appointment = frappe.get_doc(
		{
			"doctype": "DMS CRM Sales Appointment",
			"opportunity": doc.name,
			"customer": doc.customer,
			"appointment_datetime": dt,
			"duration_minutes": cint(payload.get("duration_minutes") or 60),
			"status": "Scheduled",
			"appointment_type": payload.get("appointment_type") or "Showroom Appointment",
			"assigned_to": payload.get("assigned_to")
			or doc.opportunity_owner
			or frappe.session.user,
			"company": doc.company,
			"branch": doc.branch,
			"agenda": payload.get("agenda"),
		}
	)
	appointment.insert()
	doc.sales_appointment = appointment.name
	doc.stage = "Appointment Scheduled"
	doc.save()
	frappe.db.commit()
	return {
		"appointment": appointment.as_dict(),
		"opportunity": get_opportunity(doc.name),
	}


@frappe.whitelist()
def update_sales_appointment(name, data=None):
	ensure_crm_write("DMS CRM Sales Appointment")
	payload = parse_json(data)
	appointment = frappe.get_doc("DMS CRM Sales Appointment", name)
	for fieldname in (
		"appointment_datetime",
		"duration_minutes",
		"status",
		"appointment_type",
		"assigned_to",
		"agenda",
		"outcome_notes",
	):
		if fieldname in payload:
			appointment.set(fieldname, payload.get(fieldname))
	appointment.save()
	frappe.db.commit()
	return appointment.as_dict()


@frappe.whitelist()
def create_quotation_from_opportunity(name, mark_won=0, force=0, apply_taxes=0):
	"""Create a standard ERPNext Quotation from a DMS CRM Opportunity.

	Allowed when stage is Won (or Negotiation / Booking / Quotation Submitted /
	Order Confirmed), or when status is Won. Customer and Items are required.
	Pass mark_won=1 to set stage/status to Won before creating.
	Pass apply_taxes=1 to use DMS Settings Default Taxes and Charges Template.
	"""
	ensure_crm_write(DOCTYPE)
	frappe.has_permission("Quotation", "create", throw=True)
	if not name:
		frappe.throw(_("Opportunity name is required."))

	_ensure_quotation_link_field()

	doc = frappe.get_doc(DOCTYPE, name)
	mark_won = cint(mark_won)
	force = cint(force)
	apply_taxes = cint(apply_taxes)

	if mark_won:
		frappe.msgprint(
			_("Won is now set only after a submitted Sales Invoice updates stock."),
			indicator="orange",
			alert=True,
		)

	if doc.status == "Lost" or doc.stage == "Lost":
		frappe.throw(_("Cannot create a Quotation from a Lost opportunity."))
	if doc.status == "Cancelled":
		frappe.throw(_("Cannot create a Quotation from a Cancelled opportunity."))

	if not force and doc.stage not in QUOTABLE_STAGES and doc.status != "Won":
		frappe.throw(
			_(
				"Set the opportunity to Negotiation, Booking, Won (or Quotation Submitted) "
				"before creating a Quotation."
			)
		)

	if not doc.test_drive:
		frappe.throw(_("Schedule and complete a Test Drive before creating a Quotation."))
	test_drive = frappe.db.get_value(
		"DMS CRM Test Drive", doc.test_drive, ["status", "outcome"], as_dict=True
	)
	if not test_drive or test_drive.status != "Completed":
		frappe.throw(_("Complete the linked Test Drive before creating a Quotation."))
	if test_drive.outcome not in ("Interested", "Quotation Requested"):
		frappe.throw(
			_("The Test Drive outcome must be Interested or Quotation Requested before quoting.")
		)

	if not doc.customer:
		frappe.throw(
			_(
				"Customer is required to create a Quotation. "
				"Link a Customer on the opportunity (convert the Lead first if needed)."
			)
		)
	if not frappe.db.exists("Customer", doc.customer):
		frappe.throw(_("Customer {0} not found.").format(doc.customer))
	if not doc.company:
		frappe.throw(_("Company is required to create a Quotation."))

	from dms.dealer_management_system.utils.company_permissions import assert_dms_company_access
	from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

	assert_dms_company_access(doc.company)
	assert_dms_branch_access(doc.branch, company=doc.company)

	# Reuse existing draft quotation linked to this opportunity
	if doc.quotation and frappe.db.exists("Quotation", doc.quotation):
		q_status = frappe.db.get_value("Quotation", doc.quotation, ["docstatus", "status"], as_dict=True)
		if q_status and cint(q_status.docstatus) == 0:
			return {
				"quotation": doc.quotation,
				"opportunity": get_opportunity(doc.name),
				"already_exists": True,
			}

	currency = _quotation_currency_for_doc(doc)

	quotation = frappe.new_doc("Quotation")
	quotation.quotation_to = "Customer"
	quotation.party_name = doc.customer
	quotation.company = doc.company
	quotation.transaction_date = getdate(doc.transaction_date) or today()
	validity = doc.get("quotation_validity") or doc.get("expected_close_date")
	quotation.valid_till = getdate(validity) if validity else None
	quotation.currency = currency
	quotation.conversion_rate = 1
	quotation.selling_price_list = _quotation_selling_price_list(doc, currency)
	quotation.custom_dms_crm_opportunity = doc.name
	quotation.order_type = "Sales"
	if doc.contact_person:
		quotation.contact_person = doc.contact_person
	if doc.contact_email:
		quotation.contact_email = doc.contact_email
	if doc.contact_mobile:
		quotation.contact_mobile = doc.contact_mobile

	items, vin = _quotation_items_from_opportunity_or_vin(doc)
	_store_derived_vin_item(doc, items, vin)

	for row in items:
		_append_quotation_item(quotation, row)

	_apply_custom_serial_no(quotation, opportunity=doc)

	_apply_dms_taxes_to_quotation(quotation, False)
	quotation.run_method("set_missing_values")
	quotation.currency = currency
	quotation.conversion_rate = 1
	_ensure_quotation_item_names(quotation)
	_apply_dms_taxes_to_quotation(quotation, apply_taxes)
	quotation.run_method("calculate_taxes_and_totals")
	_ensure_quotation_item_names(quotation)
	quotation.insert()

	doc.quotation = quotation.name
	doc.quotation_version = cint(doc.quotation_version) + 1
	doc.quotation_customer_status = "Draft"
	doc.quotation_sent_on = None
	doc.quotation_viewed_on = None
	doc.quotation_response_on = None
	doc.quotation_rejection_reason = None
	if doc.stage not in ("Booking / Deposit", "Order Confirmed", "Won"):
		doc.stage = "Quotation Submitted"
	doc.save()
	frappe.db.set_value(
		"DMS CRM Test Drive",
		doc.test_drive,
		"quotation",
		quotation.name,
		update_modified=False,
	)

	frappe.db.commit()
	return {
		"quotation": quotation.name,
		"opportunity": get_opportunity(doc.name),
		"already_exists": False,
	}


@frappe.whitelist()
def update_quotation_tracking(name, status, rejection_reason=None):
	"""Capture sent/viewed/accepted/rejected customer events for the current quotation."""
	ensure_crm_write(DOCTYPE)
	allowed = {"Sent", "Viewed", "Accepted", "Rejected", "Expired"}
	if status not in allowed:
		frappe.throw(_("Quotation status must be one of: {0}.").format(", ".join(sorted(allowed))))
	doc = frappe.get_doc(DOCTYPE, name)
	if not doc.quotation or not frappe.db.exists("Quotation", doc.quotation):
		frappe.throw(_("Create a Quotation first."))
	if status == "Rejected" and not (rejection_reason or "").strip():
		frappe.throw(_("Enter the customer's quotation rejection reason."))

	doc.quotation_customer_status = status
	if status == "Sent" and not doc.quotation_sent_on:
		doc.quotation_sent_on = now_datetime()
	if status == "Viewed" and not doc.quotation_viewed_on:
		doc.quotation_viewed_on = now_datetime()
	if status in ("Accepted", "Rejected"):
		doc.quotation_response_on = now_datetime()
	doc.quotation_rejection_reason = rejection_reason if status == "Rejected" else None
	doc.save()
	frappe.db.commit()
	return get_opportunity(doc.name)


@frappe.whitelist()
def reissue_quotation(name, valid_till=None):
	"""Create a new official quotation version while retaining the previous document."""
	ensure_crm_write(DOCTYPE)
	frappe.has_permission("Quotation", "create", throw=True)
	doc = frappe.get_doc(DOCTYPE, name)
	if not doc.quotation or not frappe.db.exists("Quotation", doc.quotation):
		frappe.throw(_("Create a Quotation first."))

	previous = frappe.get_doc("Quotation", doc.quotation)
	quotation = frappe.copy_doc(previous)
	quotation.name = None
	quotation.docstatus = 0
	quotation.amended_from = None
	quotation.transaction_date = today()
	quotation.valid_till = getdate(valid_till) if valid_till else getdate(doc.quotation_validity)
	quotation.insert()

	doc.quotation = quotation.name
	doc.quotation_version = cint(doc.quotation_version) + 1
	doc.quotation_customer_status = "Draft"
	doc.quotation_sent_on = None
	doc.quotation_viewed_on = None
	doc.quotation_response_on = None
	doc.quotation_rejection_reason = None
	doc.save()
	frappe.db.commit()
	return {
		"quotation": quotation.name,
		"previous_quotation": previous.name,
		"version": doc.quotation_version,
		"opportunity": get_opportunity(doc.name),
	}


def _crm_default_warehouse(company: str | None = None) -> str:
	"""Warehouse from DMS CRM Settings for Sales Order / Invoice stock lines."""
	warehouse = (frappe.db.get_single_value("DMS CRM Settings", "default_warehouse") or "").strip()
	if not warehouse:
		frappe.throw(
			_(
				"Set Default Warehouse on DMS CRM Settings before creating a Sales Order for stock items."
			)
		)
	if not frappe.db.exists("Warehouse", warehouse):
		frappe.throw(_("DMS CRM Settings Default Warehouse {0} was not found.").format(warehouse))
	if company:
		wh_company = frappe.db.get_value("Warehouse", warehouse, "company")
		if wh_company and wh_company != company:
			frappe.throw(
				_("DMS CRM Settings Default Warehouse {0} belongs to company {1}, not {2}.").format(
					warehouse, wh_company, company
				)
			)
	return warehouse


def _apply_crm_default_warehouse(order):
	"""Fill missing warehouses on stock Sales Order / Invoice items from CRM Settings."""
	needs_warehouse = False
	for row in order.items or []:
		if not row.item_code:
			continue
		is_stock = cint(frappe.db.get_value("Item", row.item_code, "is_stock_item"))
		if not is_stock:
			continue
		if (getattr(row, "warehouse", None) or "").strip():
			continue
		needs_warehouse = True
		break

	if not needs_warehouse:
		# Still set header default if present and empty
		if order.meta.has_field("set_warehouse") and not (order.get("set_warehouse") or "").strip():
			try:
				order.set_warehouse = _crm_default_warehouse(order.company)
			except Exception:
				pass
		return

	warehouse = _crm_default_warehouse(order.company)
	if order.meta.has_field("set_warehouse") and not (order.get("set_warehouse") or "").strip():
		order.set_warehouse = warehouse
	for row in order.items or []:
		if not row.item_code:
			continue
		if not cint(frappe.db.get_value("Item", row.item_code, "is_stock_item")):
			continue
		if not (getattr(row, "warehouse", None) or "").strip():
			row.warehouse = warehouse


@frappe.whitelist()
def create_sales_order_from_opportunity(name, booking_data=None):
	"""Submit the linked quotation and create the draft booking Sales Order."""
	ensure_crm_write(DOCTYPE)
	frappe.has_permission("Sales Order", "create", throw=True)
	doc = frappe.get_doc(DOCTYPE, name)
	booking_data = parse_json(booking_data)
	if not doc.quotation or not frappe.db.exists("Quotation", doc.quotation):
		frappe.throw(_("Create a Quotation before creating a Booking / Sales Order."))

	if doc.sales_order and frappe.db.exists("Sales Order", doc.sales_order):
		return {
			"sales_order": doc.sales_order,
			"already_exists": True,
			"opportunity": get_opportunity(doc.name),
		}

	quotation = frappe.get_doc("Quotation", doc.quotation)
	if quotation.docstatus == 0:
		quotation.check_permission("submit")
		quotation.submit()
	if quotation.docstatus != 1:
		frappe.throw(_("The Quotation must be submitted before creating a Sales Order."))

	from erpnext.selling.doctype.quotation.quotation import make_sales_order

	order = make_sales_order(quotation.name)
	order.delivery_date = getdate(doc.expected_close_date) if doc.expected_close_date else add_days(today(), 7)
	for row in order.items:
		row.delivery_date = order.delivery_date
	if getattr(quotation, "custom_serial_no", None):
		_apply_custom_serial_no(order, vin_labels=[
			line.strip()
			for line in (quotation.custom_serial_no or "").splitlines()
			if line.strip()
		])
	else:
		_apply_custom_serial_no(order, opportunity=doc)
	vehicle_vin = booking_data.get("vehicle_vin") or frappe.db.get_value(
		"DMS CRM Test Drive", doc.test_drive, "vehicle_vin"
	)
	if vehicle_vin:
		label = _vin_label(vehicle_vin)
		if label:
			_merge_custom_serial_no(order, [label])
	_apply_crm_default_warehouse(order)
	order.insert()
	if vehicle_vin:
		existing_booking = frappe.db.get_value(
			"DMS CRM Booking",
			{
				"vehicle_vin": vehicle_vin,
				"status": ["in", ["Confirmed", "Allocation Pending", "Allocated"]],
			},
			"name",
		)
		if existing_booking:
			frappe.throw(
				_("VIN / stock unit {0} is already reserved by booking {1}.").format(
					vehicle_vin, existing_booking
				)
			)

	deposit_amount = flt(booking_data.get("deposit_amount"))
	receipt_reference = (booking_data.get("receipt_reference") or "").strip()
	booking_status = (
		"Confirmed"
		if deposit_amount > 0 and receipt_reference
		else "Deposit Pending"
		if deposit_amount > 0
		else "Provisional"
	)
	booking = frappe.get_doc(
		{
			"doctype": "DMS CRM Booking",
			"opportunity": doc.name,
			"customer": doc.customer,
			"status": booking_status,
			"booking_date": today(),
			"booking_expiry": booking_data.get("booking_expiry") or add_days(today(), 7),
			"company": doc.company,
			"branch": doc.branch,
			"sales_order": order.name,
			"currency": order.currency,
			"vehicle_model": doc.model,
			"preferred_color": doc.preferred_color,
			"factory_order_reference": booking_data.get("factory_order_reference"),
			"deposit_amount": deposit_amount,
			"receipt_reference": receipt_reference,
			"cancellation_terms": booking_data.get("cancellation_terms"),
		}
	).insert()
	doc.sales_order = order.name
	doc.booking = booking.name
	doc.stage = "Booking / Deposit"
	doc.save()
	# §8.1 — full allocation path stamps VIN status, history and notifications.
	if vehicle_vin or booking_data.get("factory_order_reference"):
		from dms.crm_api.allocation import allocate_vin

		allocate_vin(
			booking.name,
			vehicle_vin=vehicle_vin,
			factory_order_reference=booking_data.get("factory_order_reference"),
			notes="Allocated during booking / deposit creation",
		)
	frappe.db.commit()
	return {
		"sales_order": order.name,
		"booking": booking.name,
		"already_exists": False,
		"opportunity": get_opportunity(doc.name),
	}


@frappe.whitelist()
def create_sales_invoice_from_opportunity(name):
	"""Submit the booking Sales Order and create a draft Sales Invoice."""
	ensure_crm_write(DOCTYPE)
	frappe.has_permission("Sales Invoice", "create", throw=True)
	doc = frappe.get_doc(DOCTYPE, name)
	if not doc.sales_order or not frappe.db.exists("Sales Order", doc.sales_order):
		frappe.throw(_("Create a Booking / Sales Order before creating an Invoice."))

	if doc.sales_invoice and frappe.db.exists("Sales Invoice", doc.sales_invoice):
		return {
			"sales_invoice": doc.sales_invoice,
			"already_exists": True,
			"opportunity": get_opportunity(doc.name),
		}

	order = frappe.get_doc("Sales Order", doc.sales_order)
	if order.docstatus == 0:
		order.check_permission("submit")
		order.submit()
	if order.docstatus != 1:
		frappe.throw(_("The Sales Order must be submitted before creating an Invoice."))

	from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice

	invoice = make_sales_invoice(order.name)
	if frappe.get_meta("Sales Invoice").has_field("custom_invoice_no"):
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			_generate_invoice_no,
		)

		invoice.custom_invoice_no = _generate_invoice_no(doc.company)
	# Banadir/DMS validates that invoice and receivable-account currencies match.
	account_currency = (
		frappe.db.get_value("Account", invoice.debit_to, "account_currency")
		if invoice.debit_to
		else None
	)
	if account_currency and invoice.currency != account_currency:
		receivable_parent = frappe.db.get_value(
			"Account", invoice.debit_to, "parent_account"
		)
		matching_receivable = frappe.db.get_value(
			"Account",
			{
				"company": doc.company,
				"account_type": "Receivable",
				"account_currency": invoice.currency,
				"parent_account": receivable_parent,
				"is_group": 0,
				"disabled": 0,
			},
			"name",
		)
		if not matching_receivable:
			frappe.throw(
				_(
					"No {0} Receivable account exists for {1}. Configure one before creating the invoice."
				).format(invoice.currency, doc.company)
			)
		invoice.debit_to = matching_receivable
	_apply_crm_default_warehouse(invoice)
	# Only enable stock update when every stock item already has a warehouse.
	stock_rows = [
		row
		for row in invoice.items
		if frappe.db.get_value("Item", row.item_code, "is_stock_item")
	]
	invoice.update_stock = cint(bool(stock_rows) and all(row.warehouse for row in stock_rows))
	invoice.insert()
	doc.sales_invoice = invoice.name
	doc.stage = "Order Confirmed"
	doc.save()
	if not doc.delivery_readiness:
		from dms.crm_api.delivery_readiness import create_delivery_readiness

		create_delivery_readiness(doc.name)
		doc.reload()
	frappe.db.commit()
	return {
		"sales_invoice": invoice.name,
		"update_stock": cint(invoice.update_stock),
		"already_exists": False,
		"opportunity": get_opportunity(doc.name),
	}


@frappe.whitelist()
def mark_opportunity_won(name):
	"""Mark Won only after invoice submission has reduced stock."""
	ensure_crm_write(DOCTYPE)
	doc = frappe.get_doc(DOCTYPE, name)
	if not doc.sales_invoice:
		frappe.throw(_("Create the Sales Invoice first."))
	invoice = frappe.get_doc("Sales Invoice", doc.sales_invoice)
	if invoice.docstatus != 1:
		frappe.throw(_("Submit the Sales Invoice before marking the deal Won."))
	if not invoice.update_stock:
		frappe.throw(
			_("The submitted Sales Invoice must have Update Stock enabled before Won.")
		)
	doc.stage = "Won"
	doc.status = "Won"
	doc.probability = 100
	doc.save()
	if doc.booking and frappe.db.exists("DMS CRM Booking", doc.booking):
		frappe.db.set_value("DMS CRM Booking", doc.booking, "status", "Converted to Sale")
	from dms.crm_api.ownership_journey import spawn_post_delivery_journey

	spawn_post_delivery_journey(doc.name)
	frappe.db.commit()
	return get_opportunity(doc.name)
