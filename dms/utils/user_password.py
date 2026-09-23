# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Force a password change for DMS-managed users.

When a Dealer Manager / System Manager / Administrator creates a user (or resets a
password) the password they set is only *temporary*. The user has to choose their own
password the next time they sign in. Frappe has no "must change password" flag, so DMS
keeps one in a runtime custom field on ``User`` (created on ``bench migrate`` — see
``dms.install.ensure_runtime_custom_fields``).

``mark_password_change_required`` is hooked on ``User`` ``before_save``: whenever a
password is set through the User document (Desk → *Set New Password*, or DMS → Users),
the flag is raised. ``dms.api.users.change_password`` verifies the temporary password
and clears the flag once the user sets their own.
"""

from __future__ import annotations

import frappe

FORCE_PASSWORD_FIELD = "custom_force_password_change"

STANDARD_USERS = frozenset({"Administrator", "Guest"})


def ensure_force_password_field() -> None:
	"""Create the ``User.custom_force_password_change`` runtime custom field."""
	from dms.utils.custom_fields import custom_field_exists, ensure_custom_fields

	if custom_field_exists("User", FORCE_PASSWORD_FIELD):
		return

	ensure_custom_fields(
		{
			"User": [
				{
					"fieldname": FORCE_PASSWORD_FIELD,
					"label": "Force Password Change",
					"fieldtype": "Check",
					"default": "0",
					"read_only": 1,
					"no_copy": 1,
					"print_hide": 1,
					"description": (
						"Ask this user to choose a new password the next time they sign in. "
						"Set automatically whenever an admin sets the password."
					),
					"insert_after": "logout_all_sessions",
				}
			]
		}
	)


def force_password_field_ready() -> bool:
	"""True when the ``User`` table already carries the runtime flag column."""
	if not frappe.db.exists("DocType", "User"):
		return False
	try:
		return frappe.db.has_column("User", FORCE_PASSWORD_FIELD)
	except Exception:
		return False


def mark_password_change_required(doc, method=None) -> None:
	"""``User`` before_save hook — a password set by an admin forces a change.

	``User.validate`` moves ``new_password`` into the private ``__new_password``
	attribute and clears the public field, so read the name-mangled value here.
	"""
	if getattr(doc, "_User__new_password", None) is None:
		return
	if doc.get("name") in STANDARD_USERS:
		return
	if not force_password_field_ready():
		return
	doc.set(FORCE_PASSWORD_FIELD, 1)


def password_change_required(user: str | None = None) -> bool:
	"""True when ``user`` must choose a new password before using the app."""
	user = user or frappe.session.user
	if not user or user in STANDARD_USERS:
		return False
	if not force_password_field_ready():
		return False
	return bool(frappe.db.get_value("User", user, FORCE_PASSWORD_FIELD))


def set_password_change_required(user: str | None, required: bool = True) -> None:
	"""Raise / clear the flag (no-op until the custom field has been created)."""
	if not user or not force_password_field_ready():
		return
	frappe.db.set_value("User", user, FORCE_PASSWORD_FIELD, 1 if required else 0)


def clear_password_change_required(user: str | None = None) -> None:
	set_password_change_required(user or frappe.session.user, False)
