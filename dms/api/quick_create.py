# Copyright (c) 2026, Mania and contributors
# Whitelisted quick-create helpers for DMS frontend link fields.

import json

import frappe
from frappe import _
from frappe.utils import today

from dms.api.common import get_color_display_label
from dms.api.utils import get_vehicle_customer_groups, resolve_dms_customer_group

ALLOWED_DOCTYPES = frozenset(
	{
		"Customer",
		"Color",
		"Item",
		"Service Advisor",
		"Parts Advisor",
		"DMS Internal Employee",
		"Vehicle Service Type",
		"Technician",
	}
)


def _clean(data):
	if not data:
		return {}
	if isinstance(data, str):
		data = json.loads(data)
	out = {}
	for k, v in data.items():
		if v is None:
			continue
		if isinstance(v, (str, int, float, bool)):
			out[k] = v
	return out


@frappe.whitelist()
def quick_create_doc(doctype, values=None):
	if not doctype or doctype not in ALLOWED_DOCTYPES:
		frappe.throw(_("This document type cannot be created from here."))

	values = _clean(values)

	if doctype == "Customer":
		doc_dict = _quick_create_customer(values)
	elif doctype == "Color":
		doc_dict = _quick_create_color(values)
	elif doctype == "Item":
		doc_dict = _quick_create_item(values)
	elif doctype == "Service Advisor":
		doc_dict = _quick_create_service_advisor(values)
	elif doctype == "Parts Advisor":
		doc_dict = _quick_create_parts_advisor(values)
	elif doctype == "DMS Internal Employee":
		doc_dict = _quick_create_internal_employee(values)
	elif doctype == "Vehicle Service Type":
		doc_dict = _quick_create_vehicle_service_type(values)
	else:
		doc_dict = _quick_create_technician(values)

	doc = frappe.get_doc(doc_dict)
	doc.insert()
	frappe.db.commit()
	out = {"name": doc.name}
	label = doc.get("full_name") or doc.get("customer_name")
	if doctype == "Color":
		label = get_color_display_label(doc.as_dict())
	elif doctype == "Vehicle Service Type":
		label = doc.get("service_type_name") or doc.name
	elif doctype == "Item":
		label = doc.get("item_name") or doc.name
	if label:
		out["label"] = label
	return out


def _assert_vehicle_item_group(item_group):
	"""The Item Group must be flagged as a vehicle — nothing else is allowed."""
	item_group = (item_group or "").strip()
	if not item_group:
		frappe.throw(_("Item Group is required"))

	meta = frappe.get_meta("Item Group")
	if not meta.has_field("custom_is_vehicle"):
		frappe.throw(_("Item Groups are not configured for vehicles on this site."))

	if not frappe.db.exists("Item Group", {"name": item_group, "custom_is_vehicle": 1}):
		frappe.throw(
			_("Item Group {0} is not a vehicle group (tick 'Is Vehicle' on the Item Group).").format(
				frappe.bold(item_group)
			)
		)


def _quick_create_item(values):
	"""Create a vehicle Item. The Item Group must have 'Is Vehicle' ticked."""
	item_code = (values.get("item_code") or "").strip()
	item_name = (values.get("item_name") or "").strip()
	item_group = (values.get("item_group") or "").strip()

	if not item_code:
		frappe.throw(_("Item Code is required"))
	if not item_name:
		frappe.throw(_("Item Name is required"))
	_assert_vehicle_item_group(item_group)
	if frappe.db.exists("Item", item_code):
		frappe.throw(_("Item {0} already exists").format(frappe.bold(item_code)))

	out = {
		"doctype": "Item",
		"item_code": item_code,
		"item_name": item_name,
		"item_group": item_group,
		"stock_uom": (values.get("stock_uom") or "").strip() or "Nos",
		"is_stock_item": 1,
		"has_serial_no": 1,
	}
	brand = (values.get("brand") or "").strip()
	if brand:
		out["brand"] = brand
	description = (values.get("description") or "").strip()
	if description:
		out["description"] = description
	return out


def _quick_create_customer(values):
	name = (values.get("customer_name") or "").strip()
	if not name:
		frappe.throw(_("Customer Name is required"))

	groups = get_vehicle_customer_groups()
	if not groups:
		frappe.throw(
			_(
				"Configure at least one Customer Group with custom_is_vehicle_customer before adding customers."
			)
		)

	group = resolve_dms_customer_group(values.get("customer_group"), groups)
	if not group:
		frappe.throw(
			_(
				"Configure at least one Customer Group with custom_is_vehicle_customer before adding customers."
			)
		)
	if group not in groups:
		frappe.throw(_("Choose a valid vehicle customer group."))

	doc = {
		"doctype": "Customer",
		"customer_name": name,
		"customer_type": (values.get("customer_type") or "Individual").strip() or "Individual",
		"customer_group": group,
	}
	mobile = (values.get("mobile_no") or "").strip()
	email = (values.get("email_id") or "").strip()
	tax_id = (values.get("tax_id") or "").strip()
	if mobile:
		doc["mobile_no"] = mobile
	if email:
		doc["email_id"] = email
	if tax_id and frappe.get_meta("Customer").has_field("tax_id"):
		doc["tax_id"] = tax_id
	return doc


def _quick_create_color(values):
	if not frappe.db.exists("DocType", "Color"):
		frappe.throw(_("Color DocType is not available on this site."))

	meta = frappe.get_meta("Color")
	title = (
		(values.get("color_name") or values.get("title") or values.get("color") or "")
		.strip()
	)
	if not title:
		frappe.throw(_("Color name is required"))

	doc = {"doctype": "Color"}
	# Many sites use a mandatory Data field `color`; others use `color_name` / `colour_name`.
	# Set every common label field that exists (do not use if/elif — more than one may be required).
	for fn in ("color", "color_name", "colour_name"):
		if meta.has_field(fn):
			doc[fn] = title

	has_label_field = any(meta.has_field(f) for f in ("color", "color_name", "colour_name"))
	desc_field = meta.get_field("description")
	if (
		not has_label_field
		and desc_field
		and desc_field.fieldtype in ("Data", "Small Text", "Text")
	):
		doc["description"] = title

	# Prompt autoname requires `name` before insert.
	autoname = (meta.autoname or "").strip().lower()
	explicit_name = (values.get("name") or "").strip()
	if explicit_name:
		doc["name"] = explicit_name[:140]
	elif autoname.startswith("prompt"):
		doc["name"] = title[:140] if len(title) > 140 else title
	elif len(doc) == 1:
		doc["name"] = title[:140] if len(title) > 140 else title

	return doc


def _quick_create_service_advisor(values):
	fn = (values.get("first_name") or "").strip()
	ln = (values.get("last_name") or "").strip()
	ph = (values.get("phone") or "").strip()
	em = (values.get("email") or "").strip()
	if not fn or not ln:
		frappe.throw(_("First name and last name are required"))
	if not ph or not em:
		frappe.throw(_("Phone and email are required"))
	return {
		"doctype": "Service Advisor",
		"first_name": fn,
		"last_name": ln,
		"phone": ph,
		"email": em,
	}


def _quick_create_parts_advisor(values):
	fn = (values.get("first_name") or "").strip()
	ln = (values.get("last_name") or "").strip()
	ph = (values.get("phone") or "").strip()
	em = (values.get("email") or "").strip()
	internal_employee = (values.get("internal_employee") or "").strip()
	if not fn or not ln:
		frappe.throw(_("First name and last name are required"))
	if not ph or not em:
		frappe.throw(_("Phone and email are required"))
	doc = {
		"doctype": "Parts Advisor",
		"first_name": fn,
		"last_name": ln,
		"phone": ph,
		"email": em,
	}
	if internal_employee:
		doc["internal_employee"] = internal_employee
	return doc


def _quick_create_internal_employee(values):
	fn = (values.get("first_name") or "").strip()
	ln = (values.get("last_name") or "").strip()
	if not fn or not ln:
		frappe.throw(_("First name and last name are required"))
	doc = {
		"doctype": "DMS Internal Employee",
		"first_name": fn,
		"last_name": ln,
	}
	employee = (values.get("employee") or "").strip()
	phone = (values.get("phone") or "").strip()
	email = (values.get("email") or "").strip()
	if employee:
		doc["employee"] = employee
	if phone:
		doc["phone"] = phone
	if email:
		doc["email"] = email
	return doc


def _quick_create_vehicle_service_type(values):
	st = (values.get("service_type_name") or "").strip()
	if not st:
		frappe.throw(_("Service type name is required"))

	doc = {
		"doctype": "Vehicle Service Type",
		"service_type_name": st,
		"is_active": 1,
	}
	desc = (values.get("description") or "").strip()
	if desc:
		doc["description"] = desc
	est = values.get("default_estimated_hours")
	if est not in (None, ""):
		try:
			doc["default_estimated_hours"] = float(est)
		except (TypeError, ValueError):
			pass
	return doc


def _quick_create_technician(values):
	fn = (values.get("first_name") or "").strip()
	ph = (values.get("personal_phone") or "").strip()
	if not fn or not ph:
		frappe.throw(_("First name and personal phone are required"))

	return {
		"doctype": "Technician",
		"first_name": fn,
		"last_name": (values.get("last_name") or "").strip(),
		"personal_phone": ph,
		"date_of_joining": (values.get("date_of_joining") or "").strip() or today(),
		"skill_level": (values.get("skill_level") or "Junior").strip() or "Junior",
		"labor_rate_group": (values.get("labor_rate_group") or "Standard").strip() or "Standard",
	}
