# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Unit price editing permission — DMS UI.

Users may select parts / items freely, but editing the unit price
(parts) or rate/hour (labour) is restricted to:

- users with the "Edit Price" role
- users with the "Dealer Manager" role
- System Managers / Administrator
- users ticked "Can Edit Price" on DMS CRM User Settings → DMS CRM User Detail
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

EDIT_PRICE_ROLES = frozenset({"Edit Price"})
MANAGER_ROLES = frozenset({"Dealer Manager", "System Manager", "Administrator"})

USER_SETTINGS_DOCTYPE = "DMS CRM User Settings"
USER_DETAIL_DOCTYPE = "DMS CRM User Detail"


def _session_user() -> str | None:
	user = frappe.session.user
	if not user or user in ("Guest", ""):
		return None
	return user


def has_edit_price_role(user: str | None = None) -> bool:
	"""Administrator / System Manager / Dealer Manager or explicit Edit Price role."""
	user = user or _session_user()
	if not user:
		return False
	if user == "Administrator":
		return True
	return bool((EDIT_PRICE_ROLES | MANAGER_ROLES) & set(frappe.get_roles(user)))


def _user_detail_row(user: str | None = None) -> dict | None:
	user = user or _session_user()
	if not user:
		return None
	if not frappe.db.exists("DocType", USER_SETTINGS_DOCTYPE):
		return None
	if not frappe.db.exists("DocType", USER_DETAIL_DOCTYPE):
		return None

	rows = frappe.get_all(
		USER_DETAIL_DOCTYPE,
		filters={
			"parent": USER_SETTINGS_DOCTYPE,
			"parenttype": USER_SETTINGS_DOCTYPE,
			"user": user,
		},
		fields=["can_edit_price"],
		limit_page_length=1,
	)
	return rows[0] if rows else None


def can_edit_price(user: str | None = None) -> bool:
	"""
	True when the user may edit unit prices / rate per hour.

	Allowed for Admin / System Manager / Dealer Manager / Edit Price role,
	or when the user row in DMS CRM User Settings has Can Edit Price checked.
	"""
	if has_edit_price_role(user):
		return True
	row = _user_detail_row(user)
	if not row:
		return False
	return bool(cint(row.get("can_edit_price")))


def require_edit_price(user: str | None = None):
	"""Throw PermissionError when the user cannot edit unit prices."""
	if can_edit_price(user):
		return
	frappe.throw(
		_(
			"Editing unit prices is restricted. Only users with the Edit Price role, "
			"Dealer Manager, System Manager, or Administrator may change unit prices / rates."
		),
		frappe.PermissionError,
	)


def assert_price_allowed_if_changed(current_value, new_value, user: str | None = None):
	"""
	When a client-sent price differs from the default (or is being set explicitly),
	the user must hold Edit Price permission.

	Used by add-part / add-labour / invoice / stock entry creation where the caller
	may optionally send a price — if they try to override the default, enforce.
	"""
	if new_value is None:
		return
	if abs(flt(new_value) - flt(current_value)) < 0.01:
		return
	require_edit_price(user)