# Copyright (c) 2026, Mania and contributors
"""CRM Quotation APIs — list / view / submit without Desk."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
)

DOCTYPE = "Quotation"
OPP_DOCTYPE = "DMS CRM Opportunity"


def _docstatus_label(docstatus: int) -> str:
	return {0: "Draft", 1: "Submitted", 2: "Cancelled"}.get(cint(docstatus), "Draft")


def _attach_customer_contact(data: dict, cust_map: dict | None = None) -> dict:
	party = data.get("party_name")
	email = (data.get("contact_email") or data.get("customer_email") or "").strip()
	mobile = (data.get("contact_mobile") or data.get("customer_mobile") or "").strip()
	cust = (cust_map or {}).get(party) if party else None
	if not cust and party and frappe.db.exists("Customer", party):
		cust = frappe.db.get_value("Customer", party, ["email_id", "mobile_no"], as_dict=True)
	if cust:
		email = email or (cust.get("email_id") or "")
		mobile = mobile or (cust.get("mobile_no") or "")
	data["customer_email"] = email
	data["customer_mobile"] = mobile
	return data


@frappe.whitelist()
def get_quotations(status=None, search=None, limit=50, offset=0):
	"""List ERPNext Quotations linked to CRM deals (and searchable drafts)."""
	ensure_crm_read(OPP_DOCTYPE)
	frappe.has_permission(DOCTYPE, "read", throw=True)
	limit, offset = paginate(limit, offset)

	filters: dict = {}
	status = (status or "").strip().lower()
	if status == "draft":
		filters["docstatus"] = 0
	elif status == "submitted":
		filters["docstatus"] = 1
	elif status == "cancelled":
		filters["docstatus"] = 2

	or_filters = None
	search = (search or "").strip()
	if search:
		q = f"%{search}%"
		or_filters = {
			"name": ["like", q],
			"party_name": ["like", q],
			"custom_dms_crm_opportunity": ["like", q],
		}

	# Prefer CRM-linked quotations; still allow listing when custom field missing
	meta = frappe.get_meta(DOCTYPE)
	fields = [
		"name",
		"party_name",
		"customer_name",
		"transaction_date",
		"valid_till",
		"grand_total",
		"net_total",
		"currency",
		"status",
		"docstatus",
		"company",
		"modified",
	]
	if meta.has_field("contact_email"):
		fields.append("contact_email")
	if meta.has_field("contact_mobile"):
		fields.append("contact_mobile")
	if meta.has_field("custom_dms_crm_opportunity"):
		fields.append("custom_dms_crm_opportunity")
		if not search:
			filters["custom_dms_crm_opportunity"] = ["!=", ""]

	rows = frappe.get_all(
		DOCTYPE,
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)

	out = []
	party_names = list({row.party_name for row in rows if row.party_name})
	cust_map = {}
	if party_names:
		for cust in frappe.get_all(
			"Customer",
			filters={"name": ["in", party_names]},
			fields=["name", "email_id", "mobile_no"],
		):
			cust_map[cust.name] = cust
	for row in rows:
		data = dict(row)
		opp = data.get("custom_dms_crm_opportunity")
		data["opportunity"] = opp
		data["opportunity_title"] = (
			frappe.db.get_value(OPP_DOCTYPE, opp, "title") if opp else None
		)
		data["customer_display"] = data.get("customer_name") or customer_display_name(
			data.get("party_name")
		)
		data["docstatus_label"] = _docstatus_label(data.get("docstatus"))
		_attach_customer_contact(data, cust_map)
		out.append(data)

	return {
		"data": out,
		"total": frappe.db.count(DOCTYPE, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_quotation(name):
	"""Quotation detail for CRM UI (items + totals + linked deal)."""
	ensure_crm_read(OPP_DOCTYPE)
	if not name:
		frappe.throw(_("Quotation is required."))
	frappe.has_permission(DOCTYPE, "read", throw=True)
	doc = frappe.get_doc(DOCTYPE, name)
	data = doc.as_dict()
	data["docstatus_label"] = _docstatus_label(doc.docstatus)
	data["customer_display"] = data.get("customer_name") or customer_display_name(
		data.get("party_name")
	)
	_attach_customer_contact(data)
	opp = data.get("custom_dms_crm_opportunity")
	data["opportunity"] = opp
	if opp and frappe.db.exists(OPP_DOCTYPE, opp):
		opp_row = frappe.db.get_value(
			OPP_DOCTYPE,
			opp,
			["title", "stage", "quotation_customer_status", "quotation_version"],
			as_dict=True,
		)
		data["opportunity_title"] = opp_row.title if opp_row else None
		data["opportunity_stage"] = opp_row.stage if opp_row else None
		data["quotation_customer_status"] = (
			opp_row.quotation_customer_status if opp_row else None
		)
		data["quotation_version"] = opp_row.quotation_version if opp_row else None

	items = []
	for row in doc.items or []:
		items.append(
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"description": row.description,
				"qty": flt(row.qty),
				"uom": row.uom,
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"discount_percentage": flt(row.discount_percentage),
				"net_amount": flt(row.net_amount) if hasattr(row, "net_amount") else flt(row.amount),
			}
		)
	data["items"] = items
	data["can_submit"] = cint(doc.docstatus) == 0 and frappe.has_permission(
		DOCTYPE, "submit", doc=doc
	)
	return data


@frappe.whitelist()
def submit_quotation(name):
	"""Submit a draft Quotation from CRM (no Desk)."""
	ensure_crm_write(OPP_DOCTYPE)
	if not name:
		frappe.throw(_("Quotation is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	doc.check_permission("submit")
	if cint(doc.docstatus) == 1:
		return get_quotation(doc.name)
	if cint(doc.docstatus) != 0:
		frappe.throw(_("Only draft quotations can be submitted."))

	doc.submit()

	opp_name = getattr(doc, "custom_dms_crm_opportunity", None)
	if opp_name and frappe.db.exists(OPP_DOCTYPE, opp_name):
		opp = frappe.get_doc(OPP_DOCTYPE, opp_name)
		# Keep CRM tracking in sync when sales confirms the quote
		if (opp.quotation_customer_status or "Draft") == "Draft":
			opp.quotation_customer_status = "Sent"
			from frappe.utils import now_datetime

			opp.quotation_sent_on = now_datetime()
		if opp.quotation != doc.name:
			opp.quotation = doc.name
		opp.flags.ignore_permissions = True
		opp.save()

	frappe.db.commit()
	return get_quotation(doc.name)


@frappe.whitelist()
def cancel_quotation(name):
	"""Cancel a submitted Quotation from CRM (no Desk)."""
	ensure_crm_write(OPP_DOCTYPE)
	if not name:
		frappe.throw(_("Quotation is required."))
	doc = frappe.get_doc(DOCTYPE, name)
	doc.check_permission("cancel")
	if cint(doc.docstatus) == 2:
		return get_quotation(doc.name)
	if cint(doc.docstatus) != 1:
		frappe.throw(_("Only submitted quotations can be cancelled."))
	doc.cancel()
	frappe.db.commit()
	return get_quotation(doc.name)


@frappe.whitelist()
def update_quotation_items(name, data=None):
	"""Allow adjusting rates / qty on a draft quotation from CRM before submit."""
	ensure_crm_write(OPP_DOCTYPE)
	if not name:
		frappe.throw(_("Quotation is required."))
	payload = parse_json(data) or {}
	doc = frappe.get_doc(DOCTYPE, name)
	doc.check_permission("write")
	if cint(doc.docstatus) != 0:
		frappe.throw(_("Only draft quotations can be edited."))

	items = payload.get("items")
	if items is not None:
		doc.set("items", [])
		for row in items or []:
			if not isinstance(row, dict) or not (row.get("item_code") or "").strip():
				continue
			doc.append(
				"items",
				{
					"item_code": row.get("item_code"),
					"item_name": row.get("item_name"),
					"description": row.get("description"),
					"qty": flt(row.get("qty") or 1),
					"uom": row.get("uom"),
					"rate": flt(row.get("rate")),
					"discount_percentage": flt(row.get("discount_percentage")),
				},
			)

	if "valid_till" in payload:
		doc.valid_till = payload.get("valid_till") or None

	doc.run_method("set_missing_values")
	doc.run_method("calculate_taxes_and_totals")
	doc.save()
	frappe.db.commit()
	return get_quotation(doc.name)
