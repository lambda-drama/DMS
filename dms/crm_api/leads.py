# Copyright (c) 2026, Mania and contributors
"""CRM Lead APIs — dms.crm_api.leads (not dms.api.*)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from dms.crm_api.common import (
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Lead"

LIST_FIELDS = [
	"name",
	"lead_name",
	"status",
	"priority",
	"source",
	"mobile_no",
	"email",
	"organization_name",
	"lead_owner",
	"assigned_team",
	"branch",
	"brand",
	"model",
	"next_action",
	"next_action_due",
	"response_by",
	"sla_status",
	"assignment_method",
	"assigned_on",
	"accepted_on",
	"lead_score",
	"customer",
	"opportunity",
	"creation",
	"modified",
]

LEAD_SOURCES = [
	"Showroom Walk-in",
	"Website Form",
	"WhatsApp",
	"Phone Call",
	"Email",
	"Facebook",
	"Instagram",
	"TikTok",
	"LinkedIn",
	"Auto Marketplace",
	"Roadshow",
	"Owner Event",
	"Referral",
	"Corporate Tender",
	"Government Inquiry",
	"Fleet Prospecting",
	"Service Upgrade",
	"Campaign Upload",
	"Other",
]

PRIORITIES = ["Hot", "Warm", "Standard", "Fleet / Tender"]
CUSTOMER_TYPES = [
	"Individual",
	"Company",
	"Government",
	"Embassy",
	"NGO",
	"Fleet Operator",
	"Taxi / Mobility",
	"Leasing / Rental",
	"Dealer / Reseller",
	"Prospect",
]
TEAMS = [
	"Showroom Sales",
	"Digital Sales",
	"Key Accounts",
	"Fleet / Tender",
	"Government Accounts",
	"Aftersales Upgrade",
	"Relationship Owner",
]
FINANCE_METHODS = ["Cash", "Bank Finance", "Lease", "LC", "Company Purchase", "Other"]
TIMEFRAMES = ["Immediate", "1-3 Months", "3-6 Months", "6-12 Months", "Unknown"]
CONTACT_METHODS = ["Phone", "WhatsApp", "Email", "SMS", "In Person"]
URGENCIES = ["Low", "Medium", "High", "Critical"]
STATUSES = [
	"New",
	"Assigned",
	"Contact Attempted",
	"Contacted",
	"Qualified",
	"Disqualified",
	"Converted",
	"Nurture",
	"Duplicate",
	"Invalid",
]


def _enrich(row: dict) -> dict:
	row["owner_name"] = user_display_name(row.get("lead_owner"))
	return row


def _meta_options(fieldname: str, fallback: list[str]) -> list[str]:
	meta = frappe.get_meta(DOCTYPE)
	df = meta.get_field(fieldname)
	if not df or not df.options:
		return fallback
	opts = [o.strip() for o in df.options.split("\n") if o.strip()]
	return opts or fallback


@frappe.whitelist()
def get_lead_form_options():
	"""Dropdown options for lead create/edit (blueprint §5 sources + masters)."""
	ensure_crm_read(DOCTYPE)
	countries = []
	if frappe.db.exists("DocType", "Country"):
		countries = frappe.get_all("Country", pluck="name", order_by="name asc", limit_page_length=500)
	users = frappe.get_all(
		"User",
		filters={"enabled": 1, "user_type": "System User"},
		fields=["name", "full_name"],
		order_by="full_name asc",
		limit_page_length=200,
	)
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies

	companies = get_dms_companies()
	default_company = None
	try:
		settings = frappe.get_cached_doc("DMS CRM Settings")
		default_company = settings.default_company
	except Exception:
		pass
	if default_company not in companies:
		default_company = companies[0] if companies else None

	from dms.dealer_management_system.utils.branch_permissions import get_dms_branches

	branches = [
		row["name"]
		for row in get_dms_branches(company=default_company, limit=500)
	]

	currency = None
	currency_symbol = None
	if default_company:
		currency = frappe.db.get_value("Company", default_company, "default_currency")
		if currency:
			currency_symbol = frappe.db.get_value("Currency", currency, "symbol") or currency

	return {
		"sources": _meta_options("source", LEAD_SOURCES),
		"priorities": _meta_options("priority", PRIORITIES),
		"statuses": _meta_options("status", STATUSES),
		"customer_types": _meta_options("customer_type", CUSTOMER_TYPES),
		"teams": _meta_options("assigned_team", TEAMS),
		"finance_methods": _meta_options("finance_method", FINANCE_METHODS),
		"timeframes": _meta_options("timeframe", TIMEFRAMES),
		"contact_methods": _meta_options("preferred_contact_method", CONTACT_METHODS),
		"urgencies": _meta_options("urgency", URGENCIES),
		"new_or_used": ["New", "Used", "Either"],
		"branches": branches,
		"countries": countries,
		"companies": companies,
		"default_company": default_company,
		"currency": currency,
		"currency_symbol": currency_symbol,
		"users": [{"value": u.name, "label": u.full_name or u.name} for u in users],
	}


@frappe.whitelist()
def get_leads(status=None, priority=None, source=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)

	filters = {}
	status = (status or "").strip()
	if status and status != "all":
		filters["status"] = status
	priority = (priority or "").strip()
	if priority and priority != "all":
		filters["priority"] = priority
	source = (source or "").strip()
	if source and source != "all":
		filters["source"] = source

	or_filters = []
	search = (search or "").strip()
	if search:
		or_filters = [
			["lead_name", "like", f"%{search}%"],
			["mobile_no", "like", f"%{search}%"],
			["email", "like", f"%{search}%"],
			["organization_name", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
			["model", "like", f"%{search}%"],
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
def get_lead(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Lead name is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["owner_name"] = user_display_name(doc.lead_owner)
	data["notes"] = frappe.get_all(
		"Comment",
		filters={
			"reference_doctype": DOCTYPE,
			"reference_name": doc.name,
			"comment_type": "Comment",
		},
		fields=["name", "content", "comment_email", "comment_by", "creation", "owner"],
		order_by="creation desc",
		limit_page_length=100,
	)
	return data


@frappe.whitelist()
def add_lead_note(name, content):
	"""Append a timestamped note to a lead using Frappe's standard Comment timeline."""
	ensure_crm_write(DOCTYPE)
	content = (content or "").strip()
	if not name or not frappe.db.exists(DOCTYPE, name):
		frappe.throw(_("Lead not found."))
	if not content:
		frappe.throw(_("Note cannot be empty."))

	doc = frappe.get_doc(DOCTYPE, name)
	doc.add_comment("Comment", text=content)
	frappe.db.commit()
	return get_lead(name)


@frappe.whitelist()
def create_lead(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload:
		frappe.throw(_("Lead data is required."))

	doc = frappe.new_doc(DOCTYPE)
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML")
	}
	# Read-only assignment fields are set by the controller / round-robin
	blocked = {"assignment_method", "assignment_pool", "assigned_on", "accepted_on"}
	manual_owner = bool((payload.get("lead_owner") or "").strip())
	for key, value in payload.items():
		if key in allowed and key not in blocked:
			doc.set(key, value)

	if not doc.status:
		doc.status = "New"
	if not doc.source:
		frappe.throw(_("Lead source is required."))

	# Empty owner → round-robin (or session fallback). Explicit owner → manual.
	if not manual_owner:
		doc.lead_owner = None

	doc.insert()
	frappe.db.commit()
	return get_lead(doc.name)


@frappe.whitelist()
def accept_lead(name):
	"""Owner accepts the lead — stops unaccepted reassignment (§5.3)."""
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Lead name is required."))

	doc = frappe.get_doc(DOCTYPE, name)
	user = frappe.session.user
	if doc.lead_owner and doc.lead_owner != user and not frappe.has_permission(DOCTYPE, "write", doc=doc):
		frappe.throw(_("Only the lead owner can accept this lead."))

	from dms.crm_api.assignment import mark_accepted

	mark_accepted(doc)
	if doc.status == "New":
		doc.status = "Assigned"
	doc.flags.ignore_permissions = True
	doc.save()
	frappe.db.commit()
	return get_lead(doc.name)


@frappe.whitelist()
def update_lead(name, data=None):
	ensure_crm_write(DOCTYPE)
	if not name:
		frappe.throw(_("Lead name is required."))
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	allowed = {
		df.fieldname
		for df in frappe.get_meta(DOCTYPE).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML") and not df.read_only
	}
	for key, value in payload.items():
		if key in allowed:
			doc.set(key, value)
	doc.save()
	frappe.db.commit()
	return get_lead(doc.name)


@frappe.whitelist()
def convert_lead_to_opportunity(name, data=None):
	"""Create DMS CRM Opportunity from lead and mark lead Converted."""
	ensure_crm_write(DOCTYPE)
	ensure_crm_create("DMS CRM Opportunity")
	if not name:
		frappe.throw(_("Lead name is required."))

	lead = frappe.get_doc(DOCTYPE, name)
	payload = parse_json(data)
	customer = _resolve_customer_for_conversion(lead, payload)

	if lead.opportunity and frappe.db.exists("DMS CRM Opportunity", lead.opportunity):
		opp = frappe.get_doc("DMS CRM Opportunity", lead.opportunity)
		if customer and opp.customer != customer:
			opp.customer = customer
			opp.save()
		if customer and lead.customer != customer:
			lead.customer = customer
			lead.save()
		frappe.db.commit()
		return {"lead": get_lead(lead.name), "opportunity": opp.name, "customer": customer}

	opp = frappe.new_doc("DMS CRM Opportunity")
	opp.title = payload.get("title") or f"{lead.lead_name} — {lead.model or 'Opportunity'}"
	opp.lead = lead.name
	opp.customer = customer
	opp.organization_name = lead.organization_name
	opp.opportunity_owner = lead.lead_owner or frappe.session.user
	opp.company = lead.company
	opp.branch = lead.branch
	opp.brand = lead.brand
	opp.model = lead.model
	opp.variant = lead.variant
	opp.preferred_color = getattr(lead, "preferred_color", None)
	opp.quantity = cint(lead.quantity) or 1
	opp.currency = lead.currency
	opp.source = lead.source
	opp.campaign = lead.campaign
	opp.contact_email = lead.email
	opp.contact_mobile = lead.mobile_no
	opp.phone = lead.phone
	opp.stage = "Qualified"
	opp.status = "Open"
	opp.next_action = payload.get("next_action") or "Follow up"
	opp.next_action_due = payload.get("next_action_due") or now_datetime()
	for row in lead.get("items") or []:
		opp.append(
			"items",
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"description": row.description,
				"qty": row.qty,
				"uom": row.uom,
				"rate": row.rate,
				"discount_percentage": row.discount_percentage,
			},
		)
	opp.insert()

	lead.status = "Converted"
	lead.customer = customer
	lead.opportunity = opp.name
	lead.save()
	frappe.db.commit()

	return {"lead": get_lead(lead.name), "opportunity": opp.name, "customer": customer}


def _resolve_customer_for_conversion(lead, payload: dict) -> str:
	"""Use an explicitly selected customer, otherwise reuse/create one from the lead."""
	customer = (payload.get("customer") or lead.customer or "").strip()
	if customer:
		if not frappe.db.exists("Customer", customer):
			frappe.throw(_("Customer {0} was not found.").format(frappe.bold(customer)))
		return customer

	# Reuse an exact customer match before creating another account.
	for fieldname, value in (("mobile_no", lead.mobile_no), ("email_id", lead.email)):
		value = (value or "").strip()
		if value:
			match = frappe.db.get_value("Customer", {fieldname: value}, "name")
			if match:
				return match

	if not cint(payload.get("create_customer", 1)):
		frappe.throw(_("Select a Customer or enable Create customer from lead."))

	frappe.has_permission("Customer", "create", throw=True)
	from dms.crm_api.customers import create_customer

	customer_name = (
		(lead.organization_name or "").strip()
		or (lead.lead_name or "").strip()
		or " ".join(p for p in (lead.first_name, lead.last_name) if p).strip()
	)
	if not customer_name:
		frappe.throw(_("Add a lead name before creating a Customer."))

	company_types = {
		"Company",
		"Government",
		"Embassy",
		"NGO",
		"Fleet Operator",
		"Taxi / Mobility",
		"Leasing / Rental",
		"Dealer / Reseller",
	}
	result = create_customer(
		{
			"customer_name": customer_name,
			"customer_type": "Company" if lead.customer_type in company_types else "Individual",
			"mobile_no": lead.mobile_no,
			"email_id": lead.email,
		},
		force=1,
	)
	customer = (result or {}).get("name")
	if not customer:
		frappe.throw(_("Could not create Customer from this lead."))
	return customer
