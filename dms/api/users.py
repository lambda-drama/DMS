# Copyright (c) 2026, Mania and contributors
"""DMS User management — create users, assign roles, set / reset passwords.

Dealer Manager, System Manager and Administrator manage users from the DMS UI
(*Advanced Permission → Users*, and the *Master → Users* page). Frappe normally
reserves User creation and password resets for System Manager / Administrator; these
endpoints open that up for the Dealer Manager role while keeping the guard rails:

* ``Administrator`` / ``Guest`` are never created, edited or reset here.
* Only roles configured on DMS CRM User Settings can be assigned; only the
  Administrator may also grant ``System Manager``.
* A password an admin sets is temporary — the user is forced to choose their own
  password on the next sign-in (see ``dms.utils.user_password``).
"""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint

from dms.api.permissions import has_management_view_role
from dms.utils.user_password import (
	FORCE_PASSWORD_FIELD,
	clear_password_change_required,
	ensure_force_password_field,
	force_password_field_ready,
	password_change_required,
	set_password_change_required,
)

SETTINGS = "DMS CRM User Settings"

PROTECTED_USERS = frozenset({"Administrator", "Guest"})
# Elevated roles: a user with one of these can only be edited by Administrator, and
# only the Administrator may grant System Manager from this screen.
ELEVATED_ROLES = frozenset({"Administrator", "System Manager"})
SYSTEM_MANAGER_ROLE = "System Manager"
# These can never be handed out from the DMS Users screen (even if listed in settings).
UNASSIGNABLE_ROLES = frozenset({"Administrator", "Guest", "All", "Desk User", "System Manager"})
USER_TYPES = ("System User", "Website User")
DEFAULT_USER_TYPE = "System User"


def _assert_manager():
	if not has_management_view_role():
		frappe.throw(
			_("Only Dealer Manager, System Manager, or Administrator can manage Users."),
			frappe.PermissionError,
		)


def _parse(data):
	if isinstance(data, str):
		data = json.loads(data) if data else {}
	return data or {}


def _get_settings():
	return frappe.get_single(SETTINGS)


def _session_is_admin() -> bool:
	return frappe.session.user == "Administrator"


def _configured_roles() -> list[str]:
	from dms.api.advanced_permissions import _crm_roles

	return _crm_roles()


def _configured_role_profiles() -> list[str]:
	from dms.api.advanced_permissions import _display_role_profiles

	return _display_role_profiles(_get_settings())


def _assignable_roles() -> list[str]:
	"""Roles a manager may hand out — the DMS CRM User Settings Roles list.

	``System Manager`` is only added for the Administrator; ``Administrator`` itself is
	never assignable from this screen.
	"""
	allowed = {r for r in _configured_roles() if r and r not in UNASSIGNABLE_ROLES}
	if _session_is_admin():
		allowed.add(SYSTEM_MANAGER_ROLE)
	return sorted(allowed)


def _clean_roles(roles, keep: set[str] | None = None) -> list[str]:
	"""Validate assignable roles. ``keep`` = roles already on the user (edits only)."""
	allowed = set(_assignable_roles())
	keep = keep or set()
	out: list[str] = []
	seen: set[str] = set()
	for role in roles or []:
		role = (role or "").strip()
		if not role or role in seen:
			continue
		if role in UNASSIGNABLE_ROLES and role != SYSTEM_MANAGER_ROLE:
			frappe.throw(_("Role {0} cannot be assigned here.").format(frappe.bold(role)))
		if role == SYSTEM_MANAGER_ROLE and not _session_is_admin():
			frappe.throw(_("Only Administrator can assign the System Manager role."))
		if role not in allowed and role not in keep:
			frappe.throw(
				_(
					"Role {0} cannot be assigned here. Add it to the Roles list on DMS CRM User Settings first."
				).format(frappe.bold(role))
			)
		if not frappe.db.exists("Role", role):
			frappe.throw(_("Role {0} does not exist.").format(frappe.bold(role)))
		seen.add(role)
		out.append(role)
	return out


def _clean_role_profiles(profiles, keep: set[str] | None = None) -> list[str]:
	allowed = set(_configured_role_profiles())
	keep = keep or set()
	out: list[str] = []
	seen: set[str] = set()
	for profile in profiles or []:
		profile = (profile or "").strip()
		if not profile or profile in seen:
			continue
		if profile not in allowed and profile not in keep:
			frappe.throw(_("Role Profile {0} is not on DMS CRM User Settings.").format(frappe.bold(profile)))
		if not frappe.db.exists("Role Profile", profile):
			frappe.throw(_("Role Profile {0} does not exist.").format(frappe.bold(profile)))
		seen.add(profile)
		out.append(profile)
	return out


def _validate_password(password: str, confirm: str | None) -> str:
	password = password or ""
	if not password:
		frappe.throw(_("Password is required."))
	if confirm is not None and password != confirm:
		frappe.throw(_("Passwords do not match."))
	if len(password) < 8:
		frappe.throw(_("Password must be at least 8 characters."))
	return password


def _whitelist_user(user: str) -> None:
	"""Add the user to DMS CRM User Settings → Users (Table MultiSelect)."""
	doc = _get_settings()
	existing = {row.user for row in (doc.get("users") or []) if row.user}
	if user in existing:
		return
	doc.append("users", {"user": user})
	doc.flags.ignore_permissions = True
	doc.save(ignore_permissions=True)


def _is_user_protected(user: str, roles: set[str] | None = None) -> bool:
	if user in PROTECTED_USERS:
		return True
	if _session_is_admin():
		return False
	return bool(ELEVATED_ROLES & (roles or set()))


def _user_payload(user: str) -> dict:
	doc = frappe.get_doc("User", user)
	settings = _get_settings()
	whitelist = {row.user for row in (settings.get("users") or []) if row.user}
	roles = [r.role for r in (doc.roles or []) if r.role]
	return {
		"user": doc.name,
		"email": doc.email or doc.name,
		"first_name": doc.first_name or "",
		"last_name": doc.last_name or "",
		"full_name": doc.full_name or doc.name,
		"enabled": cint(doc.enabled),
		"user_type": doc.user_type or DEFAULT_USER_TYPE,
		"last_login": str(doc.last_login) if doc.last_login else None,
		"creation": str(doc.creation) if doc.creation else None,
		"roles": roles,
		"role_profiles": [r.role_profile for r in (doc.role_profiles or []) if r.role_profile],
		"whitelisted": doc.name in whitelist,
		"protected": _is_user_protected(doc.name, set(roles)),
		"must_change_password": password_change_required(doc.name),
	}


@frappe.whitelist()
def get_users_bootstrap():
	"""Users, assignable roles and role profiles for the Users screen. Managers only."""
	_assert_manager()
	ensure_force_password_field()

	# Only DMS users are managed here — the DMS CRM User Settings → Users whitelist,
	# the same source the Advanced Permission screen lists. System users that were
	# never added to DMS are not shown.
	settings = _get_settings()
	whitelist = {row.user for row in (settings.get("users") or []) if row.user}
	whitelist -= set(PROTECTED_USERS)

	fields = [
		"name",
		"email",
		"full_name",
		"first_name",
		"last_name",
		"enabled",
		"user_type",
		"last_login",
		"creation",
	]
	if force_password_field_ready():
		fields.append(FORCE_PASSWORD_FIELD)

	details = (
		frappe.get_all(
			"User",
			filters={"name": ["in", list(whitelist)]},
			fields=fields,
			order_by="first_name asc, name asc",
			ignore_permissions=True,
		)
		if whitelist
		else []
	)
	user_names = [d.name for d in details]

	role_map: dict[str, list[str]] = {}
	if user_names:
		for row in frappe.get_all(
			"Has Role",
			filters={"parent": ["in", user_names], "parenttype": "User"},
			fields=["parent", "role"],
			order_by="role asc",
			ignore_permissions=True,
		):
			role_map.setdefault(row.parent, []).append(row.role)

	profile_map: dict[str, list[str]] = {}
	if user_names:
		for row in frappe.get_all(
			"User Role Profile",
			filters={"parent": ["in", user_names], "parenttype": "User"},
			fields=["parent", "role_profile"],
			order_by="role_profile asc",
			ignore_permissions=True,
		):
			profile_map.setdefault(row.parent, []).append(row.role_profile)

	users = []
	for d in details:
		roles = role_map.get(d.name, [])
		users.append(
			{
				"user": d.name,
				"email": d.email or d.name,
				"first_name": d.first_name or "",
				"last_name": d.last_name or "",
				"full_name": d.full_name or d.name,
				"enabled": cint(d.enabled),
				"user_type": d.user_type or DEFAULT_USER_TYPE,
				"last_login": str(d.last_login) if d.last_login else None,
				"creation": str(d.creation) if d.creation else None,
				"roles": roles,
				"role_profiles": profile_map.get(d.name, []),
				"whitelisted": d.name in whitelist,
				"protected": _is_user_protected(d.name, set(roles)),
				"must_change_password": bool(d.get(FORCE_PASSWORD_FIELD))
				if force_password_field_ready()
				else False,
			}
		)

	return {
		"can_manage": True,
		"is_admin": _session_is_admin(),
		"users": users,
		"assignable_roles": _assignable_roles(),
		"role_profiles": _configured_role_profiles(),
		"user_types": list(USER_TYPES),
	}


@frappe.whitelist()
def create_user(data=None):
	"""Create a DMS user, optionally with a temporary password and roles."""
	_assert_manager()
	ensure_force_password_field()
	data = _parse(data)

	email = (data.get("email") or "").strip().lower()
	first_name = (data.get("first_name") or "").strip()
	last_name = (data.get("last_name") or "").strip()
	if not email:
		frappe.throw(_("Email is required."))
	if not first_name:
		frappe.throw(_("First name is required."))
	if email in PROTECTED_USERS:
		frappe.throw(_("Cannot create {0}.").format(frappe.bold(email)))
	if frappe.db.exists("User", email):
		frappe.throw(_("User {0} already exists.").format(frappe.bold(email)))

	password = (data.get("password") or "").strip()
	if password:
		password = _validate_password(password, data.get("confirm_password"))
	else:
		password = ""

	user_type = (data.get("user_type") or DEFAULT_USER_TYPE).strip()
	if user_type not in USER_TYPES:
		user_type = DEFAULT_USER_TYPE

	roles = _clean_roles(data.get("roles"))
	role_profiles = _clean_role_profiles(data.get("role_profiles"))

	doc = frappe.new_doc("User")
	doc.email = email
	doc.first_name = first_name
	doc.last_name = last_name
	doc.enabled = 1 if cint(data.get("enabled", 1)) else 0
	doc.user_type = user_type
	doc.send_welcome_email = 1 if cint(data.get("send_welcome_email")) else 0
	if password:
		doc.new_password = password
	for role in roles:
		doc.append("roles", {"role": role})
	for profile in role_profiles:
		doc.append("role_profiles", {"role_profile": profile})

	doc.flags.ignore_permissions = True
	doc.insert(ignore_permissions=True)

	if password:
		# The before_save hook already raised this; make it explicit for clarity.
		set_password_change_required(doc.name, True)

	_whitelist_user(doc.name)
	frappe.clear_cache(user=doc.name)
	frappe.db.commit()
	return _user_payload(doc.name)


@frappe.whitelist()
def update_user(data=None):
	"""Update a DMS user's name, status, roles and role profiles."""
	_assert_manager()
	data = _parse(data)
	user = (data.get("user") or "").strip()
	if not user:
		frappe.throw(_("User is required."))
	if not frappe.db.exists("User", user):
		frappe.throw(_("User {0} does not exist.").format(frappe.bold(user)))
	if user in PROTECTED_USERS:
		frappe.throw(_("Cannot edit {0}.").format(frappe.bold(user)))

	doc = frappe.get_doc("User", user)
	existing_roles = {r.role for r in (doc.roles or []) if r.role}
	existing_profiles = {r.role_profile for r in (doc.role_profiles or []) if r.role_profile}
	if not _session_is_admin() and (ELEVATED_ROLES & existing_roles):
		frappe.throw(
			_("Only Administrator can edit a user with {0} rights.").format(
				frappe.bold(" / ".join(sorted(ELEVATED_ROLES & existing_roles)))
			)
		)

	if data.get("first_name") is not None:
		first_name = (data.get("first_name") or "").strip()
		if not first_name:
			frappe.throw(_("First name is required."))
		doc.first_name = first_name
	if data.get("last_name") is not None:
		doc.last_name = (data.get("last_name") or "").strip()
	if data.get("enabled") is not None:
		doc.enabled = 1 if cint(data.get("enabled")) else 0
	if data.get("user_type") in USER_TYPES:
		doc.user_type = data["user_type"]

	if data.get("roles") is not None:
		roles = _clean_roles(data.get("roles"), keep=existing_roles)
		if not _session_is_admin():
			# Never let a Dealer Manager drop a protected role by accident.
			roles = sorted({*roles, *(existing_roles & ELEVATED_ROLES)})
		doc.set("roles", [])
		for role in roles:
			doc.append("roles", {"role": role})

	if data.get("role_profiles") is not None:
		profiles = _clean_role_profiles(data.get("role_profiles"), keep=existing_profiles)
		doc.set("role_profiles", [])
		for profile in profiles:
			doc.append("role_profiles", {"role_profile": profile})

	doc.flags.ignore_permissions = True
	doc.save(ignore_permissions=True)
	frappe.clear_cache(user=user)
	frappe.db.commit()
	return _user_payload(user)


@frappe.whitelist()
def set_user_password(user=None, new_password=None, confirm_password=None, logout_all_sessions=0):
	"""Set a *temporary* password for a user (Dealer Manager / System Manager / Admin).

	The user is forced to choose their own password on the next sign-in.
	"""
	_assert_manager()
	ensure_force_password_field()
	user = (user or "").strip()
	if not user:
		frappe.throw(_("User is required."))
	if not frappe.db.exists("User", user):
		frappe.throw(_("User {0} does not exist.").format(frappe.bold(user)))
	if user in PROTECTED_USERS:
		frappe.throw(_("Cannot reset the password for {0}.").format(frappe.bold(user)))

	new_password = _validate_password(new_password, confirm_password)

	doc = frappe.get_doc("User", user)
	doc.flags.ignore_permissions = True
	doc.new_password = new_password
	doc.logout_all_sessions = 1 if cint(logout_all_sessions) else 0
	if force_password_field_ready():
		doc.set(FORCE_PASSWORD_FIELD, 1)
	doc.save(ignore_permissions=True)

	set_password_change_required(user, True)
	frappe.clear_cache(user=user)
	frappe.db.commit()
	return {"ok": True, "user": user, "must_change_password": True}


@frappe.whitelist()
def change_password(old_password=None, new_password=None, confirm_password=None):
	"""Change the signed-in user's own password, verifying the old one.

	This is the endpoint the *first sign-in* screen calls after an admin set a
	temporary password; it clears the force-change flag on success.
	"""
	user = frappe.session.user
	if not user or user in PROTECTED_USERS:
		frappe.throw(_("Not permitted."), frappe.PermissionError)
	if not old_password:
		frappe.throw(_("Current password is required."))

	new_password = _validate_password(new_password, confirm_password)

	from frappe.core.doctype.user.user import update_password as frappe_update_password

	# Verifies ``old_password`` against the session user, applies the password policy
	# and keeps the session signed in (Frappe signs the user back in after the change).
	frappe_update_password(new_password=new_password, old_password=old_password, logout_all_sessions=0)
	clear_password_change_required(user)
	frappe.db.commit()
	return {"ok": True, "user": user}


@frappe.whitelist()
def get_password_status():
	"""Whether the signed-in user must set a new password before using the app."""
	user = frappe.session.user
	if not user or user == "Guest":
		return {"user": None, "must_change_password": False}
	return {
		"user": user,
		"must_change_password": password_change_required(user),
	}
