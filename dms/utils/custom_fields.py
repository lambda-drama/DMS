# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Helpers for DMS-managed runtime custom fields.

DMS ships a few custom fields created at runtime (Sales Order DMS flags and VIN
link, Vehicle Labour Item display name, Quotation ← CRM opportunity link…).
Creating a ``Custom Field`` needs permissions shop-floor users do not have, so the
lazy creation path must never run as them — otherwise merely opening a screen
throws *"User … does not have doctype access via role permission for document
Custom Field"*.

The fields are created on ``bench migrate`` (``dms.install.after_migrate``) and the
lazy fallback below skips silently when the user may not manage Custom Fields.
"""

from __future__ import annotations

import frappe


def custom_field_exists(dt: str, fieldname: str) -> bool:
	"""True when the Custom Field record exists (plain DB read — no permissions)."""
	return bool(frappe.db.exists("Custom Field", {"dt": dt, "fieldname": fieldname}))


def ensure_custom_fields(
	custom_fields: dict,
	*,
	update: bool = True,
	ignore_validate: bool = True,
) -> bool:
	"""Create / refresh ``custom_fields`` when the current user may do so.

	Returns ``False`` (no exception) when the user has no Custom Field create
	permission, so read-only and shop-floor users keep working while migrate (or an
	Administrator) creates the definitions.
	"""
	from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

	if not frappe.has_permission("Custom Field", "create"):
		return False

	# These are app-managed system fields — don't let unrelated role rules block them.
	previous = frappe.flags.get("ignore_permissions")
	try:
		frappe.flags.ignore_permissions = True
		create_custom_fields(custom_fields, ignore_validate=ignore_validate, update=update)
	finally:
		frappe.flags.ignore_permissions = previous
	return True
