# Copyright (c) 2026, Mania and contributors
"""CRM Customer 360 — aggregate profile for one ERPNext Customer."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint

from dms.crm_api.common import ensure_crm_read
from dms.crm_api.contacts import _dms_customer_groups

GATE = "DMS CRM Lead"


def _safe_all(doctype: str, *, filters=None, fields=None, order_by=None, limit=50):
	if not frappe.db.exists("DocType", doctype):
		return []
	return frappe.get_all(
		doctype,
		filters=filters or {},
		fields=fields or ["name"],
		order_by=order_by or "modified desc",
		limit_page_length=limit,
	)


def _customer_contacts(customer: str) -> list[dict]:
	if not frappe.db.exists("DocType", "Contact") or not frappe.db.exists("DocType", "Dynamic Link"):
		return []
	contact_names = frappe.get_all(
		"Dynamic Link",
		filters={
			"link_doctype": "Customer",
			"link_name": customer,
			"parenttype": "Contact",
		},
		pluck="parent",
	)
	if not contact_names:
		return []
	rows = frappe.get_all(
		"Contact",
		filters={"name": ["in", contact_names]},
		fields=["name", "first_name", "last_name", "email_id", "mobile_no", "company_name", "status"],
		order_by="modified desc",
		limit_page_length=50,
	)
	data = []
	for r in rows:
		row = dict(r)
		row["full_name"] = (
			" ".join(p for p in [row.get("first_name"), row.get("last_name")] if p).strip()
			or row.get("name")
		)
		data.append(row)
	return data


def _customer_vehicles(customer: str) -> list[dict]:
	if not frappe.db.exists("DocType", "VIN No"):
		return []
	meta = frappe.get_meta("VIN No")
	wanted = [
		"name",
		"vin_number",
		"plate_number",
		"brand",
		"model",
		"model_name",
		"model_year",
		"current_odometer",
		"warranty_status",
		"warranty_end_date",
		"customer_name",
	]
	fields = [f for f in wanted if f == "name" or meta.has_field(f)]
	return frappe.get_all(
		"VIN No",
		filters={"current_customer": customer},
		fields=fields,
		order_by="modified desc",
		limit_page_length=50,
	)


@frappe.whitelist()
def get_customer_360(customer: str):
	"""Return Customer 360 payload for CRM detail page."""
	ensure_crm_read(GATE)
	customer = (customer or "").strip()
	if not customer:
		frappe.throw(_("Customer is required."))
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found.").format(customer))

	cust = frappe.get_doc("Customer", customer)
	groups = _dms_customer_groups()
	if groups and cust.customer_group and cust.customer_group not in groups:
		frappe.throw(_("Customer {0} is not a DMS vehicle customer.").format(customer))

	identity = {
		"name": cust.name,
		"customer_name": cust.customer_name,
		"customer_type": cust.customer_type,
		"customer_group": cust.customer_group,
		"territory": cust.territory,
		"mobile_no": cust.mobile_no,
		"email_id": cust.email_id,
		"disabled": cint(cust.disabled),
		"creation": cust.creation,
		"modified": cust.modified,
		"owner": cust.owner,
		"modified_by": cust.modified_by,
	}
	# Optional address-ish fields if present on Customer
	for optional in ("customer_primary_address", "primary_address", "website", "tax_id"):
		if hasattr(cust, optional):
			identity[optional] = getattr(cust, optional)

	leads = _safe_all(
		"DMS CRM Lead",
		filters={"customer": customer},
		fields=[
			"name",
			"lead_name",
			"status",
			"priority",
			"source",
			"lead_owner",
			"next_action_due",
			"brand",
			"model",
			"modified",
		],
		limit=30,
	)
	opportunities = _safe_all(
		"DMS CRM Opportunity",
		filters={"customer": customer},
		fields=[
			"name",
			"title",
			"stage",
			"status",
			"expected_value",
			"currency",
			"probability",
			"expected_close_date",
			"opportunity_owner",
			"brand",
			"model",
			"modified",
		],
		limit=30,
	)
	activities = _safe_all(
		"DMS CRM Activity",
		filters={"customer": customer},
		fields=[
			"name",
			"activity_type",
			"subject",
			"status",
			"due_datetime",
			"completed_on",
			"assigned_to",
			"priority",
			"disposition",
			"modified",
		],
		order_by="due_datetime desc, modified desc",
		limit=40,
	)
	cases = _safe_all(
		"DMS CRM Case",
		filters={"customer": customer},
		fields=[
			"name",
			"subject",
			"category",
			"priority",
			"status",
			"case_owner",
			"vehicle_vin",
			"response_deadline",
			"sla_breached",
			"modified",
		],
		limit=30,
	)

	appointments = []
	if frappe.db.exists("DocType", "Service Appointment"):
		meta = frappe.get_meta("Service Appointment")
		if meta.has_field("customer"):
			wanted = [
				"name",
				"status",
				"appointment_date",
				"appointment_time",
				"vehicle",
				"service_advisor",
				"modified",
			]
			fields = [f for f in wanted if f == "name" or meta.has_field(f)]
			appointments = frappe.get_all(
				"Service Appointment",
				filters={"customer": customer},
				fields=fields,
				order_by="appointment_date desc, modified desc",
				limit_page_length=20,
			)

	vehicles = _customer_vehicles(customer)
	contacts = _customer_contacts(customer)

	open_lead_statuses = {"New", "Assigned", "Contact Attempted", "Contacted", "Qualified", "Nurture"}
	open_opp_statuses = {"Open", "On Hold"}
	open_case_statuses = {
		"New",
		"Acknowledged",
		"Assigned",
		"Investigation",
		"Awaiting Customer",
		"Awaiting Internal Action",
		"Resolution Proposed",
		"Reopened",
	}
	open_activity_statuses = {"Open", "Pending", "Scheduled"}

	summary = {
		"vehicles": len(vehicles),
		"contacts": len(contacts),
		"leads_total": len(leads),
		"leads_open": sum(1 for r in leads if (r.get("status") or "") in open_lead_statuses),
		"opportunities_total": len(opportunities),
		"opportunities_open": sum(1 for r in opportunities if (r.get("status") or "") in open_opp_statuses),
		"activities_total": len(activities),
		"activities_open": sum(1 for r in activities if (r.get("status") or "") in open_activity_statuses),
		"cases_total": len(cases),
		"cases_open": sum(1 for r in cases if (r.get("status") or "") in open_case_statuses),
		"appointments": len(appointments),
		"pipeline_value": sum(float(r.get("expected_value") or 0) for r in opportunities if (r.get("status") or "") in open_opp_statuses),
	}

	return {
		"customer": identity,
		"summary": summary,
		"contacts": contacts,
		"vehicles": vehicles,
		"leads": leads,
		"opportunities": opportunities,
		"activities": activities,
		"cases": cases,
		"appointments": appointments,
	}
