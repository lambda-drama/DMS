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
			doc.append(
				"items",
				{
					"item_code": row.get("item_code"),
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
	if not payload.get("appointment_datetime"):
		frappe.throw(_("Appointment date and time are required."))

	appointment = frappe.get_doc(
		{
			"doctype": "DMS CRM Sales Appointment",
			"opportunity": doc.name,
			"customer": doc.customer,
			"appointment_datetime": payload.get("appointment_datetime"),
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
def create_quotation_from_opportunity(name, mark_won=0, force=0):
	"""Create a standard ERPNext Quotation from a DMS CRM Opportunity.

	Allowed when stage is Won (or Negotiation / Booking / Quotation Submitted /
	Order Confirmed), or when status is Won. Customer and Items are required.
	Pass mark_won=1 to set stage/status to Won before creating.
	"""
	ensure_crm_write(DOCTYPE)
	frappe.has_permission("Quotation", "create", throw=True)
	if not name:
		frappe.throw(_("Opportunity name is required."))

	_ensure_quotation_link_field()

	doc = frappe.get_doc(DOCTYPE, name)
	mark_won = cint(mark_won)
	force = cint(force)

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

	currency = doc.currency or frappe.db.get_value("Company", doc.company, "default_currency")

	quotation = frappe.new_doc("Quotation")
	quotation.quotation_to = "Customer"
	quotation.party_name = doc.customer
	quotation.company = doc.company
	quotation.transaction_date = getdate(doc.transaction_date) or today()
	validity = doc.get("quotation_validity") or doc.get("expected_close_date")
	quotation.valid_till = getdate(validity) if validity else None
	quotation.currency = currency
	quotation.conversion_rate = 1
	quotation.selling_price_list = frappe.db.get_value(
		"Customer", doc.customer, "default_price_list"
	) or frappe.db.get_value("Selling Settings", None, "selling_price_list")
	quotation.custom_dms_crm_opportunity = doc.name
	quotation.order_type = "Sales"
	if doc.contact_person:
		quotation.contact_person = doc.contact_person
	if doc.contact_email:
		quotation.contact_email = doc.contact_email
	if doc.contact_mobile:
		quotation.contact_mobile = doc.contact_mobile

	items = list(doc.items or [])
	if not items:
		frappe.throw(
			_("Add at least one Item on the opportunity before creating a Quotation.")
		)

	for row in items:
		quotation.append(
			"items",
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"description": row.description,
				"qty": flt(row.qty) or 1,
				"uom": row.uom,
				"rate": flt(row.rate) or 0,
				"discount_percentage": flt(row.discount_percentage) or 0,
			},
		)

	try:
		from erpnext.controllers.accounts_controller import get_default_taxes_and_charges

		taxes = get_default_taxes_and_charges(
			"Sales Taxes and Charges Template", company=quotation.company
		)
		if taxes.get("taxes"):
			quotation.update(taxes)
	except Exception:
		pass

	quotation.run_method("set_missing_values")
	quotation.run_method("calculate_taxes_and_totals")
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
	order.insert()
	vehicle_vin = booking_data.get("vehicle_vin") or frappe.db.get_value(
		"DMS CRM Test Drive", doc.test_drive, "vehicle_vin"
	)
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
