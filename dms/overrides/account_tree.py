# Copyright (c) 2026, Mania and contributors
"""Guard ERPNext Account / Cost Center tree calls when company is missing.

``erpnext.accounts.utils.get_children`` is typed ``company: str``. A None
company (Desk tree with no company selected, or a GL hook that omits it)
raises FrappeTypeError. Resolve company from the user default, then DMS
Settings, then Global Defaults, and pass a string.
"""

from __future__ import annotations

import frappe
from frappe.utils import cint, sbool


def _company_from_dms_settings() -> str | None:
	try:
		from dms.dealer_management_system.utils.company_permissions import get_dms_companies

		companies = get_dms_companies()
		if len(companies) == 1:
			return companies[0]
		if companies:
			user_default = frappe.defaults.get_user_default("Company")
			if user_default in companies:
				return user_default
			return companies[0]
	except Exception:
		pass

	try:
		if not frappe.db.exists("DocType", "DMS Company Defaults"):
			return None
		row = frappe.get_all(
			"DMS Company Defaults",
			filters={"parent": "DMS Settings", "parenttype": "DMS Settings"},
			fields=["company"],
			order_by="idx asc",
			limit=1,
		)
		if row and row[0].company:
			return row[0].company
	except Exception:
		pass
	return None


def coerce_company(company) -> str:
	"""Return a non-None company string for tree / GL lookups."""
	if isinstance(company, str) and company.strip():
		return company.strip()
	try:
		user_default = frappe.defaults.get_user_default("Company")
		if user_default:
			return user_default
	except Exception:
		pass
	from_settings = _company_from_dms_settings()
	if from_settings:
		return from_settings
	try:
		global_default = frappe.db.get_single_value("Global Defaults", "default_company")
		if global_default:
			return global_default
	except Exception:
		pass
	return ""


def _as_bool(value) -> bool:
	"""Desk tree calls send ``"true"`` / ``"false"`` as form strings, not JSON booleans."""
	parsed = sbool(value)
	if isinstance(parsed, bool):
		return parsed
	return bool(cint(parsed))


def _gl_entry_company(gl_entry) -> str | None:
	company = getattr(gl_entry, "company", None)
	if company:
		return company
	if hasattr(gl_entry, "get"):
		return gl_entry.get("company")
	return None


@frappe.whitelist()
def get_children(
	doctype: str,
	parent: str | None = None,
	company: str | None = None,
	is_root: bool | str | int = False,
	include_disabled: bool | str | int = False,
):
	"""Same as ERPNext's tree helper, but company/parent are never None."""
	import erpnext.accounts.utils as accounts_utils

	original = getattr(accounts_utils, "_dms_original_get_children", accounts_utils.get_children)
	return original(
		doctype,
		parent or "",
		coerce_company(company),
		is_root=_as_bool(is_root),
		include_disabled=_as_bool(include_disabled),
	)


def install_get_children_company_guard() -> None:
	"""Patch ERPNext (and Banadir's import of it) so missing company cannot crash."""
	import erpnext.accounts.utils as accounts_utils

	if getattr(accounts_utils.get_children, "_dms_company_guard", False):
		_patch_banadir_gl()
		return

	if not getattr(accounts_utils, "_dms_original_get_children", None):
		accounts_utils._dms_original_get_children = accounts_utils.get_children

	get_children._dms_company_guard = True
	accounts_utils.get_children = get_children
	_patch_banadir_gl()


def _patch_banadir_gl() -> None:
	"""Banadir copies get_children at import; re-bind that name and pass GL company."""
	try:
		import nl_banadir.banadir_customization_reports.overrides.general_ledger as banadir_gl
	except ImportError:
		return

	banadir_gl.get_children = get_children

	if getattr(banadir_gl.custom_validate_allowed_dimensions, "_dms_company_guard", False):
		return

	original_validate = banadir_gl.custom_validate_allowed_dimensions

	def custom_validate_allowed_dimensions(gl_entry, dimension_filter_map=None, company=None):
		if not company:
			company = _gl_entry_company(gl_entry)
		return original_validate(gl_entry, dimension_filter_map, coerce_company(company))

	custom_validate_allowed_dimensions._dms_company_guard = True
	banadir_gl.custom_validate_allowed_dimensions = custom_validate_allowed_dimensions
