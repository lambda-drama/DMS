# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""HR Vehicle Service Item — auto-create ERPNext labour Item on first save when not linked."""

from __future__ import annotations

import re

import frappe
from frappe import _
from frappe.utils import flt

LABOUR_ITEM_GROUP = "Service"


def validate_vehicle_service_item(doc, method=None):
	"""On first save, create ERPNext Item from service name if no Item link yet."""
	link_field = _erpnext_item_link_fieldname()
	if (doc.get(link_field) or "").strip():
		return

	service_name = (doc.get("service_item") or doc.name or "").strip()
	if not service_name:
		frappe.throw(_("Service Item name is required before saving."))

	ensure_labour_erpnext_item(doc, link_field)


def _erpnext_item_link_fieldname() -> str:
	meta = frappe.get_meta("Vehicle Service Item")
	for field in meta.fields:
		if field.fieldtype == "Link" and field.options == "Item":
			return field.fieldname
	return "custom_erpnext_item"


def ensure_labour_erpnext_item(doc, link_field: str) -> str:
	"""Create or link labour Sales Item under group Service on the VSI."""
	item_code = _item_code_from_vehicle_service_item(doc)
	if frappe.db.exists("Item", item_code):
		doc.set(link_field, item_code)
		_update_linked_item_name(item_code, doc)
		return item_code

	ensure_labour_item_group()

	display_name = _labour_item_display_name(doc, item_code)

	item = frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": display_name[:140],
			"item_group": LABOUR_ITEM_GROUP,
			"stock_uom": "Nos",
			"is_stock_item": 0,
			"is_sales_item": 1,
			"is_purchase_item": 0,
			"include_item_in_manufacturing": 0,
			"description": (doc.get("custom_description") or display_name or "")[:3000],
			"standard_rate": flt(doc.get("custom_rate")),
		}
	)
	item.insert(ignore_permissions=True)
	doc.set(link_field, item.name)

	if doc.meta.has_field("custom_item_name") and not doc.get("custom_item_name"):
		doc.custom_item_name = item.item_name

	frappe.msgprint(
		_("ERPNext item {0} created (item group {1}).").format(
			frappe.bold(item.name), frappe.bold(LABOUR_ITEM_GROUP)
		),
		indicator="green",
		alert=True,
	)
	return item.name


def ensure_labour_item_group() -> None:
	if frappe.db.exists("Item Group", LABOUR_ITEM_GROUP):
		return

	parent = (
		frappe.db.get_value(
			"Item Group", {"is_group": 1, "name": ["!=", LABOUR_ITEM_GROUP]}, "name"
		)
		or "All Item Groups"
	)
	if not frappe.db.exists("Item Group", parent):
		parent = "All Item Groups"

	frappe.get_doc(
		{
			"doctype": "Item Group",
			"item_group_name": LABOUR_ITEM_GROUP,
			"parent_item_group": parent,
			"is_group": 0,
		}
	).insert(ignore_permissions=True)


def _item_code_from_vehicle_service_item(doc) -> str:
	"""Prefer custom_service_code; otherwise derive a unique code from service_item."""
	meta = doc.meta if getattr(doc, "meta", None) else frappe.get_meta("Vehicle Service Item")
	if meta.has_field("custom_service_code"):
		code = (doc.get("custom_service_code") or "").strip()
		if code:
			return _normalize_item_code(code)

	return _item_code_from_service_name(doc)


def _normalize_item_code(raw: str) -> str:
	code = (raw or "").strip()
	if not code:
		frappe.throw(_("Service Code is required to create the ERPNext item."))
	if len(code) > 140:
		code = code[:140]
	return code


def _item_code_from_service_name(doc) -> str:
	"""Use the service name as Item code when possible; otherwise a safe unique code."""
	raw = (doc.get("service_item") or doc.name or "").strip()
	if not raw:
		frappe.throw(_("Service Item name is required."))

	if len(raw) <= 140 and not frappe.db.exists("Item", raw):
		return raw

	base = re.sub(r"[^\w\-/.]+", "-", raw).strip("-_") or "LABOUR-SVC"
	if len(base) <= 140 and not frappe.db.exists("Item", base):
		return base

	for n in range(2, 100):
		candidate = f"{base[:135]}-{n}"
		if not frappe.db.exists("Item", candidate):
			return candidate

	frappe.throw(_("Could not generate a unique Item code for service {0}.").format(raw))


def sync_labour_erpnext_item_name(doc, link_field: str | None = None) -> None:
	"""Keep linked ERPNext Item item_name aligned with the VSI job description."""
	link_field = link_field or _erpnext_item_link_fieldname()
	item_code = (doc.get(link_field) or "").strip()
	if item_code:
		_update_linked_item_name(item_code, doc)


def _labour_item_display_name(doc, item_code: str) -> str:
	meta = doc.meta if getattr(doc, "meta", None) else frappe.get_meta("Vehicle Service Item")
	if meta.has_field("custom_item_name"):
		name = (doc.get("custom_item_name") or "").strip()
		if name:
			return name
	return (doc.get("service_item") or doc.name or item_code).strip()


def _update_linked_item_name(item_code: str, doc) -> None:
	display_name = _labour_item_display_name(doc, item_code)
	if not display_name:
		return
	current = frappe.db.get_value("Item", item_code, "item_name")
	if current == display_name:
		return
	frappe.db.set_value("Item", item_code, "item_name", display_name[:140], update_modified=False)
