"""Company scoping shared by the DMS and DMS CRM interfaces."""

from __future__ import annotations

import frappe
from frappe import _


def get_dms_companies() -> list[str]:
	"""Return companies selected in the DMS Settings company table."""
	rows = frappe.get_all(
		"Company TB",
		filters={"parent": "DMS Settings", "parenttype": "DMS Settings"},
		fields=["company"],
		order_by="idx asc",
	)
	return [row.company for row in rows if row.company]


def assert_dms_company_access(company: str | None) -> None:
	"""Require company to be one selected in DMS Settings."""
	company = (company or "").strip()
	if not company:
		return

	if company not in get_dms_companies():
		frappe.throw(
			_("Company {0} is not selected in DMS Settings.").format(frappe.bold(company)),
			frappe.PermissionError,
		)


def get_vin_company_scope_values() -> list[str]:
	"""Values allowed in `VIN No.company` for this DMS site.

	The companies selected in DMS Settings plus `""`, so vehicles that have no
	company at all stay visible. Frappe renders an `in` filter that contains `""`
	as ``ifnull(company, '') in (...)``, which also matches NULL — so this single
	condition covers "blank company OR our company" without an OR group.

	Vehicles belonging to any other company are intentionally excluded.
	"""
	return [*get_dms_companies(), ""]


#: Roles that are not limited to the DMS Settings companies (site admins).
ALL_COMPANY_ROLES = frozenset({"System Manager"})


def can_view_all_companies(user: str | None = None) -> bool:
	"""True for Administrator / System Manager — they see every company's vehicles.

	``VIN No`` names are globally unique (``autoname = field:vin_number``) but the
	list/link scope hides other companies' rows. Without this, an admin who tries to
	create a VIN that already exists for another company gets a duplicate error while
	the record is invisible in every list — a dead end.
	"""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	if user == "Administrator":
		return True
	return bool(ALL_COMPANY_ROLES.intersection(frappe.get_roles(user)))


def apply_vin_company_scope(filters: dict | None = None, user: str | None = None) -> dict:
	"""Return ``filters`` with the VIN No company scope added (ANDed).

	Needed for ``frappe.get_all`` calls: they run with ``ignore_permissions=True``
	so the ``permission_query_conditions`` hook does not apply to them.

	Site admins (``can_view_all_companies``) are not scoped.
	"""
	scoped = dict(filters or {})
	if can_view_all_companies(user):
		return scoped
	scoped["company"] = ["in", get_vin_company_scope_values()]
	return scoped


def vin_no_query_conditions(user: str | None = None) -> str:
	"""``permission_query_conditions`` hook for the VIN No DocType.

	Applies to every permission-checked query: Desk list views, link-field
	autocomplete, reportview and ``frappe.get_list`` — so another company's
	vehicles can never be picked through those surfaces.

	Site admins (Administrator / System Manager) are exempt so they can see, open and
	fix a VIN that belongs to a company outside DMS Settings.
	"""
	if (
		getattr(frappe.flags, "in_install", False)
		or getattr(frappe.flags, "in_migrate", False)
		or getattr(frappe.flags, "in_patch", False)
	):
		return ""

	if can_view_all_companies(user):
		return ""

	values = ", ".join(frappe.db.escape(company, percent=False) for company in get_vin_company_scope_values())
	return f"ifnull(`tabVIN No`.`company`, '') in ({values})"
