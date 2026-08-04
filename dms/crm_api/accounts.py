"""Corporate / key accounts APIs — blueprint §9.1."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import flt

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

DOCTYPE = "DMS CRM Account"

ACCOUNT_FIELDS = (
	"account_name",
	"customer",
	"account_type",
	"status",
	"company",
	"branch",
	"territory",
	"industry",
	"account_owner",
	"parent_account",
	"legal_name",
	"tax_id",
	"registration_number",
	"replacement_notes",
	"credit_terms",
	"payment_behavior",
	"outstanding_balance",
	"contracts_summary",
	"account_plan",
	"competitor_presence",
	"growth_potential",
	"relationship_health",
	"notes",
)


@frappe.whitelist()
def get_accounts(account_type=None, status=None, search=None, limit=50, offset=0):
	ensure_crm_read(DOCTYPE)
	limit, offset = paginate(limit, offset)
	filters = {}
	if account_type and account_type != "all":
		filters["account_type"] = account_type
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"account_name": ["like", q],
			"customer": ["like", q],
			"legal_name": ["like", q],
		}
	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"account_name",
			"customer",
			"account_type",
			"status",
			"territory",
			"account_owner",
			"fleet_size",
			"relationship_health",
			"growth_potential",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for row in rows:
		row["customer_name"] = customer_display_name(row.customer)
		row["owner_name"] = user_display_name(row.account_owner)
	return {
		"data": rows,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_account(name):
	ensure_crm_read(DOCTYPE)
	if not name:
		frappe.throw(_("Account is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["customer_name"] = customer_display_name(doc.customer)
	data["owner_name"] = user_display_name(doc.account_owner)
	data["parent_account_name"] = (
		frappe.db.get_value(DOCTYPE, doc.parent_account, "account_name")
		if doc.parent_account
		else None
	)
	data["child_accounts"] = frappe.get_all(
		DOCTYPE,
		filters={"parent_account": doc.name},
		fields=["name", "account_name", "account_type", "status", "fleet_size"],
	)
	data["tenders"] = frappe.get_all(
		"DMS CRM Tender",
		filters={"account": doc.name},
		fields=["name", "title", "status", "bid_deadline", "estimated_value", "modified"],
		order_by="modified desc",
		limit=20,
	)
	data["agreements"] = frappe.get_all(
		"DMS CRM Framework Agreement",
		filters={"account": doc.name},
		fields=["name", "agreement_title", "status", "valid_from", "valid_to", "max_units"],
		order_by="modified desc",
		limit=20,
	)
	data["fleet_aftersales"] = _fleet_snapshot_for_customer(doc.customer)
	_refresh_outstanding(doc)
	data["outstanding_balance"] = doc.outstanding_balance
	return data


def _refresh_outstanding(doc):
	if not doc.customer:
		return
	try:
		from erpnext.accounts.utils import get_balance_on

		balance = get_balance_on(party_type="Customer", party=doc.customer)
		doc.db_set("outstanding_balance", flt(balance), update_modified=False)
	except Exception:
		pass


def _fleet_snapshot_for_customer(customer: str) -> dict:
	if not customer or not frappe.db.exists("DocType", "VIN No"):
		return {"vehicles": [], "due_soon": 0, "overdue": 0, "total": 0}
	meta = frappe.get_meta("VIN No")
	filters = {}
	if meta.has_field("fleet_company"):
		filters["fleet_company"] = customer
	elif meta.has_field("current_customer"):
		filters["current_customer"] = customer
	else:
		return {"vehicles": [], "due_soon": 0, "overdue": 0, "total": 0}

	fields = ["name", "vin_number", "model", "model_name", "vehicle_status"]
	for candidate in (
		"current_odometer",
		"next_service_due_date",
		"is_fleet_vehicle",
		"fleet_reference",
		"delivery_date",
		"assigned_driver",
	):
		if meta.has_field(candidate):
			fields.append(candidate)

	vehicles = frappe.get_all(
		"VIN No",
		filters=filters,
		fields=fields,
		order_by="modified desc",
		limit=200,
	)
	from frappe.utils import add_days, getdate, today

	due_soon = overdue = 0
	today_d = getdate(today())
	for v in vehicles:
		due = v.get("next_service_due_date")
		if not due:
			continue
		due_d = getdate(due)
		if due_d < today_d:
			overdue += 1
		elif due_d <= getdate(add_days(today(), 30)):
			due_soon += 1
	return {
		"vehicles": vehicles,
		"due_soon": due_soon,
		"overdue": overdue,
		"total": len(vehicles),
	}


@frappe.whitelist()
def create_account(data=None):
	ensure_crm_create(DOCTYPE)
	payload = parse_json(data)
	if not payload.get("customer"):
		frappe.throw(_("Customer is required."))
	existing = frappe.db.get_value(DOCTYPE, {"customer": payload["customer"]}, "name")
	if existing:
		frappe.throw(_("An account already exists for this customer: {0}").format(existing))
	doc = frappe.new_doc(DOCTYPE)
	_apply_account(doc, payload)
	if not doc.account_owner:
		doc.account_owner = frappe.session.user
	if not doc.status:
		doc.status = "Active"
	doc.insert()
	frappe.db.commit()
	return get_account(doc.name)


@frappe.whitelist()
def update_account(name, data=None):
	ensure_crm_write(DOCTYPE)
	payload = parse_json(data)
	doc = frappe.get_doc(DOCTYPE, name)
	_apply_account(doc, payload)
	doc.save()
	frappe.db.commit()
	return get_account(doc.name)


def _apply_account(doc, payload: dict):
	for field in ACCOUNT_FIELDS:
		if field in payload:
			doc.set(field, payload.get(field))
	if "stakeholders" in payload:
		doc.set("stakeholders", [])
		for row in payload.get("stakeholders") or []:
			doc.append(
				"stakeholders",
				{
					"contact": row.get("contact"),
					"person_name": row.get("person_name"),
					"role": row.get("role") or "Other",
					"email": row.get("email"),
					"phone": row.get("phone"),
					"is_primary": row.get("is_primary") or 0,
					"notes": row.get("notes"),
				},
			)
	if "fleet_units" in payload:
		doc.set("fleet_units", [])
		for row in payload.get("fleet_units") or []:
			doc.append(
				"fleet_units",
				{
					"vehicle_vin": row.get("vehicle_vin"),
					"model": row.get("model"),
					"model_name": row.get("model_name"),
					"quantity": row.get("quantity") or 1,
					"average_age_years": row.get("average_age_years"),
					"average_mileage": row.get("average_mileage"),
					"replacement_cycle_years": row.get("replacement_cycle_years"),
					"notes": row.get("notes"),
				},
			)


@frappe.whitelist()
def get_account_form_options():
	ensure_crm_read(DOCTYPE)
	meta = frappe.get_meta(DOCTYPE)
	return {
		"account_types": _select_options(meta, "account_type"),
		"statuses": _select_options(meta, "status"),
		"payment_behaviors": _select_options(meta, "payment_behavior"),
		"growth_potentials": _select_options(meta, "growth_potential"),
		"relationship_health": _select_options(meta, "relationship_health"),
		"stakeholder_roles": _select_options(
			frappe.get_meta("DMS CRM Account Stakeholder"), "role"
		),
	}


def _select_options(meta, fieldname):
	df = meta.get_field(fieldname)
	if not df or not df.options:
		return []
	return [o for o in df.options.split("\n") if o.strip()]
