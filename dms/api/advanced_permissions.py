"""DMS Advanced Permission Manager — Role / Role Profile / DocPerm for DMS + CRM only."""

from __future__ import annotations

import json
from contextlib import contextmanager

import frappe
from frappe import _
from frappe.core.doctype.doctype.doctype import (
	clear_permissions_cache,
	validate_permissions_for_doctype,
)
from frappe.exceptions import DoesNotExistError
from frappe.permissions import (
	add_permission,
	get_all_perms,
	get_linked_doctypes,
	reset_perms,
	setup_custom_perms,
	update_permission_property,
)
from frappe.utils import cint

from dms.api.permissions import DMS_VIEW_DOCTYPES, has_management_view_role

SETTINGS = "DMS CRM User Settings"

DMS_CRM_MODULES = (
	"Dealer Management System",
	"Customer Relationship Management",
)

# ERPNext / core doctypes used by DMS or CRM (not always in those modules).
EXTRA_USED_DOCTYPES = (
	"Sales Invoice",
	"Sales Order",
	"Quotation",
	"Item Price",
	"Item",
	"Item Group",
	"Customer",
	"Contact",
	"Address",
	"Stock Entry",
	"Stock Reconciliation",
	"Material Request",
	"Purchase Receipt",
	"Payment Entry",
)

PROTECTED_ROLES = frozenset({"Administrator", "System Manager"})
PROTECTED_USERS = frozenset({"Administrator", "Guest"})

PERM_RIGHTS = (
	"select",
	"read",
	"write",
	"create",
	"delete",
	"submit",
	"cancel",
	"amend",
	"print",
	"email",
	"report",
	"import",
	"export",
	"share",
	"if_owner",
)


def _assert_manager():
	if not has_management_view_role():
		frappe.throw(
			_("Only Dealer Manager, System Manager, or Administrator can manage Advanced Permissions."),
			frappe.PermissionError,
		)


@contextmanager
def _bypass_custom_docperm_checks():
	"""Dealer Manager is not System Manager, so Frappe blocks Custom DocPerm writes.

	These methods already require Dealer Manager / System Manager / Administrator
	and only allow DMS/CRM doctypes.
	"""
	previous = bool(frappe.flags.ignore_permissions)
	frappe.flags.ignore_permissions = True
	try:
		yield
	finally:
		frappe.flags.ignore_permissions = previous


def _add_custom_docperm(doctype: str, role: str, permlevel: int = 0, if_owner: int = 0) -> str | None:
	setup_custom_perms(doctype)
	name = frappe.db.get_value(
		"Custom DocPerm",
		{
			"parent": doctype,
			"role": role,
			"permlevel": cint(permlevel),
			"if_owner": cint(if_owner),
		},
	)
	if name:
		return name
	doc = frappe.new_doc("Custom DocPerm")
	doc.parent = doctype
	doc.parenttype = "DocType"
	doc.parentfield = "permissions"
	doc.role = role
	doc.permlevel = cint(permlevel)
	doc.if_owner = cint(if_owner)
	doc.read = 1
	doc.insert(ignore_permissions=True)
	return doc.name


def _set_custom_docperm_right(
	doctype: str,
	role: str,
	permlevel: int,
	ptype: str,
	value,
	if_owner: int = 0,
):
	setup_custom_perms(doctype)
	name = frappe.db.get_value(
		"Custom DocPerm",
		{
			"parent": doctype,
			"role": role,
			"permlevel": cint(permlevel),
			"if_owner": cint(if_owner),
		},
	)
	if not name:
		name = _add_custom_docperm(doctype, role, permlevel, if_owner)
	frappe.db.set_value("Custom DocPerm", name, ptype, cint(value), update_modified=True)
	frappe.clear_cache(doctype=doctype)


def _parse(data):
	if isinstance(data, str):
		data = json.loads(data) if data else {}
	return data or {}


def _get_settings():
	if not frappe.db.exists(SETTINGS):
		doc = frappe.new_doc(SETTINGS)
		doc.insert(ignore_permissions=True)
		return doc
	return frappe.get_doc(SETTINGS)


def _allowed_doctypes() -> list[str]:
	names: set[str] = set()
	for dt in DMS_VIEW_DOCTYPES.values():
		if dt:
			names.add(dt)
	names.update(EXTRA_USED_DOCTYPES)
	module_dts = frappe.get_all(
		"DocType",
		filters={
			"istable": 0,
			"issingle": 0,
			"module": ["in", list(DMS_CRM_MODULES)],
		},
		pluck="name",
	)
	names.update(module_dts)
	out = []
	for name in names:
		if not frappe.db.exists("DocType", name):
			continue
		if name in ("DocType", "Patch Log", "Module Def"):
			continue
		if cint(frappe.db.get_value("DocType", name, "istable")):
			continue
		out.append(name)
	return sorted(out)


def _assert_allowed_doctype(doctype: str):
	if doctype not in set(_allowed_doctypes()):
		frappe.throw(_("DocType {0} is not used in DMS / CRM.").format(frappe.bold(doctype)))


def _display_roles(doc) -> list[str]:
	rows = []
	for r in doc.get("roles") or []:
		role = getattr(r, "role", None) or getattr(r, "role_profile", None)
		if role:
			rows.append(role)
	return rows


def _display_role_profiles(doc) -> list[str]:
	return [r.role_profile for r in (doc.get("role_profiles") or []) if getattr(r, "role_profile", None)]


def _crm_roles() -> list[str]:
	return _display_roles(_get_settings())


def _assert_crm_role(role: str):
	allowed = set(_crm_roles())
	if role not in allowed:
		frappe.throw(
			_("Role {0} is not in the Roles list on DMS CRM User Settings.").format(frappe.bold(role))
		)


@frappe.whitelist()
def get_advanced_permission_bootstrap():
	"""Roles / role profiles to show, plus DMS/CRM doctypes. Managers only."""
	if not has_management_view_role():
		return {"can_manage": False}
	doc = _get_settings()
	selected_roles = _display_roles(doc)
	selected_profiles = _display_role_profiles(doc)

	all_roles = frappe.get_all(
		"Role",
		filters={"disabled": 0, "name": ["not in", ["Administrator", "Guest", "All", "Desk User"]]},
		pluck="name",
		order_by="name",
	)
	all_profiles = frappe.get_all("Role Profile", pluck="name", order_by="name")

	doctypes = []
	for name in _allowed_doctypes():
		meta = frappe.get_meta(name)
		doctypes.append(
			{
				"name": name,
				"module": meta.module,
				"is_submittable": cint(meta.is_submittable),
			}
		)

	users = [
		{"user": u.user, "full_name": frappe.db.get_value("User", u.user, "full_name") or u.user}
		for u in (doc.get("users") or [])
		if u.user
	]

	return {
		"can_manage": True,
		"selected_roles": selected_roles,
		"selected_role_profiles": selected_profiles,
		"all_roles": all_roles,
		"all_role_profiles": all_profiles,
		"doctypes": doctypes,
		"whitelisted_users": users,
		"rights": list(PERM_RIGHTS),
	}


@frappe.whitelist()
def save_display_roles(data):
	"""Persist which Roles / Role Profiles appear in Advanced Permission (Table MultiSelect)."""
	_assert_manager()
	data = _parse(data)
	doc = _get_settings()
	doc.set("roles", [])
	for role in data.get("roles") or []:
		if role:
			doc.append("roles", {"role": role})
	doc.set("role_profiles", [])
	for rp in data.get("role_profiles") or []:
		if rp:
			doc.append("role_profiles", {"role_profile": rp})
	doc.flags.ignore_permissions = True
	doc.save()
	frappe.db.commit()
	return {
		"ok": True,
		"selected_roles": _display_roles(doc),
		"selected_role_profiles": _display_role_profiles(doc),
	}


@frappe.whitelist()
def get_role_permissions(doctype: str | None = None, role: str | None = None):
	_assert_manager()
	doctype = (doctype or "").strip() or None
	role = (role or "").strip() or None
	if doctype:
		_assert_allowed_doctype(doctype)

	crm_roles = _crm_roles()
	if not crm_roles:
		return []
	if role:
		_assert_crm_role(role)
		crm_roles = [role]

	allowed = set(_allowed_doctypes())

	with _bypass_custom_docperm_checks():
		if role:
			out = get_all_perms(role)
			if doctype:
				out = [p for p in out if frappe._dict(p).parent == doctype]
		else:
			if not doctype:
				return []
			filters = {"parent": doctype}
			out = frappe.get_all(
				"Custom DocPerm",
				fields="*",
				filters=filters,
				order_by="permlevel",
				ignore_permissions=True,
			)
			if not out:
				out = frappe.get_all("DocPerm", fields="*", filters=filters, order_by="permlevel")

	linked = {}
	filtered = []
	seen_roles: set[str] = set()
	for d in out:
		d = frappe._dict(d)
		parent = d.parent
		if parent not in allowed:
			continue
		if d.role not in crm_roles:
			continue
		if parent not in linked:
			try:
				linked[parent] = get_linked_doctypes(parent)
			except DoesNotExistError:
				frappe.clear_last_message()
				continue
		d.linked_doctypes = linked[parent]
		if meta := frappe.get_meta(parent):
			d.is_submittable = cint(meta.is_submittable)
			d.in_create = cint(meta.in_create)
		filtered.append(d)
		seen_roles.add(d.role)

	# When a DocType is chosen, always show one row per CRM role (ticked or not).
	if doctype:
		meta = frappe.get_meta(doctype)
		is_submittable = cint(meta.is_submittable)
		for missing_role in crm_roles:
			if missing_role in seen_roles:
				continue
			row = frappe._dict({right: 0 for right in PERM_RIGHTS})
			row.update(
				{
					"parent": doctype,
					"role": missing_role,
					"permlevel": 0,
					"if_owner": 0,
					"is_submittable": is_submittable,
					"in_create": cint(meta.in_create),
					"linked_doctypes": [],
				}
			)
			filtered.append(row)

	return filtered


@frappe.whitelist()
def add_role_permission(doctype: str, role: str, permlevel: int = 0):
	_assert_manager()
	_assert_allowed_doctype(doctype)
	_assert_crm_role(role)
	_add_custom_docperm(doctype, role, cint(permlevel))
	return {"ok": True}


@frappe.whitelist()
def update_role_permission(
	doctype: str,
	role: str,
	permlevel: int,
	ptype: str,
	value: str | int | None = None,
	if_owner: str | int = 0,
):
	_assert_manager()
	_assert_allowed_doctype(doctype)
	_assert_crm_role(role)
	if ptype not in PERM_RIGHTS:
		frappe.throw(_("Invalid permission type."))
	if ptype == "report" and str(value) == "1" and str(if_owner) == "1":
		frappe.throw(_("Cannot set Report permission if Only If Creator is set."))

	_set_custom_docperm_right(doctype, role, cint(permlevel), ptype, value, cint(if_owner))
	if ptype == "if_owner" and str(value) == "1":
		_set_custom_docperm_right(doctype, role, cint(permlevel), "report", 0, cint(value))
	return {"ok": True, "refresh": True}


@frappe.whitelist()
def remove_role_permission(doctype: str, role: str, permlevel: int, if_owner: str | int = 0):
	_assert_manager()
	_assert_allowed_doctype(doctype)
	_assert_crm_role(role)
	setup_custom_perms(doctype)
	names = frappe.get_all(
		"Custom DocPerm",
		filters={
			"parent": doctype,
			"role": role,
			"permlevel": cint(permlevel),
			"if_owner": if_owner,
		},
		pluck="name",
		ignore_permissions=True,
	)
	for name in names:
		frappe.delete_doc("Custom DocPerm", name, ignore_permissions=True, force=True)
	if not frappe.get_all("Custom DocPerm", {"parent": doctype}, ignore_permissions=True):
		frappe.throw(_("There must be at least one permission rule."), title=_("Cannot Remove"))
	frappe.clear_cache(doctype=doctype)
	return {"ok": True}


@frappe.whitelist()
def reset_role_permissions(doctype: str):
	_assert_manager()
	_assert_allowed_doctype(doctype)
	with _bypass_custom_docperm_checks():
		reset_perms(doctype)
		clear_permissions_cache(doctype)
	return {"ok": True}


@frappe.whitelist()
def get_user_roles(user: str):
	_assert_manager()
	if not user:
		frappe.throw(_("User is required."))
	doc = _get_settings()
	allowed = {u.user for u in (doc.get("users") or []) if u.user}
	if user not in allowed:
		frappe.throw(_("User is not on the DMS whitelist."))
	user_doc = frappe.get_doc("User", user)
	return {
		"user": user,
		"full_name": user_doc.full_name,
		"roles": [r.role for r in (user_doc.roles or []) if r.role],
		"role_profiles": [r.role_profile for r in (user_doc.role_profiles or []) if r.role_profile],
	}


@frappe.whitelist()
def save_user_roles(data):
	"""Assign roles / role profiles to a whitelisted user (ERPNext Role Profile behaviour)."""
	_assert_manager()
	data = _parse(data)
	user = (data.get("user") or "").strip()
	if not user:
		frappe.throw(_("User is required."))
	if user in PROTECTED_USERS and frappe.session.user != "Administrator":
		frappe.throw(_("Cannot change roles for {0}.").format(user))

	doc = _get_settings()
	allowed_users = {u.user for u in (doc.get("users") or []) if u.user}
	if user not in allowed_users:
		frappe.throw(_("User {0} is not in the whitelist.").format(frappe.bold(user)))

	crm_roles = set(_crm_roles())
	roles = [r for r in (data.get("roles") or []) if r and r in crm_roles]
	role_profiles = [r for r in (data.get("role_profiles") or []) if r]

	if frappe.session.user != "Administrator":
		roles = [r for r in roles if r not in PROTECTED_ROLES]

	with _bypass_custom_docperm_checks():
		user_doc = frappe.get_doc("User", user)
		user_doc.set("role_profiles", [])
		for rp in role_profiles:
			if frappe.db.exists("Role Profile", rp):
				user_doc.append("role_profiles", {"role_profile": rp})

		if role_profiles:
			user_doc.flags.ignore_permissions = True
			user_doc.save()
		else:
			existing_protected = [r.role for r in (user_doc.roles or []) if r.role in PROTECTED_ROLES]
			keep = set(roles)
			if frappe.session.user != "Administrator":
				keep.update(existing_protected)
			user_doc.set("roles", [])
			for role in keep:
				user_doc.append("roles", {"role": role})
			user_doc.flags.ignore_permissions = True
			user_doc.save()

	frappe.clear_cache(user=user)
	frappe.db.commit()
	return get_user_roles(user)
