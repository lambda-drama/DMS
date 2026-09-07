# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

LABOUR_DISPLAY_NAME_FIELD = "custom_display_name"


class VehicleLabourItem(Document):
	pass


def ensure_labour_display_name_field() -> str:
	"""Create the line-only Display Name custom field. Does not edit the DocType JSON."""
	if frappe.db.exists(
		"Custom Field",
		{"dt": "Vehicle Labour Item", "fieldname": LABOUR_DISPLAY_NAME_FIELD},
	):
		return LABOUR_DISPLAY_NAME_FIELD

	from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

	create_custom_fields(
		{
			"Vehicle Labour Item": [
				{
					"fieldname": LABOUR_DISPLAY_NAME_FIELD,
					"label": "Display Name",
					"fieldtype": "Data",
					"insert_after": "service_name",
					"in_list_view": 1,
					"description": "Name shown on this job card or estimate only. Does not change the Vehicle Service Item master.",
				}
			]
		},
		ignore_validate=True,
		update=True,
	)
	return LABOUR_DISPLAY_NAME_FIELD


def labour_line_display_name(row) -> str:
	if not row:
		return ""
	getter = row.get if hasattr(row, "get") else None
	if getter:
		return (
			getter(LABOUR_DISPLAY_NAME_FIELD)
			or getter("display_name")
			or getter("service_name")
			or ""
		).strip()
	return (
		getattr(row, LABOUR_DISPLAY_NAME_FIELD, None)
		or getattr(row, "display_name", None)
		or getattr(row, "service_name", None)
		or ""
	).strip()


def labour_payload_display_name(line, fallback: str = "") -> str:
	if not isinstance(line, dict):
		return (fallback or "").strip()
	return (
		(line.get(LABOUR_DISPLAY_NAME_FIELD) or line.get("display_name") or fallback or "")
	).strip()
