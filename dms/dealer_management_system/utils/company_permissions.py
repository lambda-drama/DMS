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
