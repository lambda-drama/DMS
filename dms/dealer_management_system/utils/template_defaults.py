"""Shared helpers for DMS master templates (QC, road test, delivery, diagnosis)."""

import frappe
from frappe.utils import cint


def enforce_single_default(doc, doctype: str, default_field: str = "is_default") -> None:
	"""Ensure only one template row is marked default per DocType."""
	if not cint(doc.get(default_field)):
		return

	others = frappe.get_all(
		doctype,
		filters={default_field: 1, "name": ["!=", doc.name]},
		pluck="name",
	)
	for name in others:
		frappe.db.set_value(doctype, name, default_field, 0, update_modified=False)


def get_default_template_name(
	doctype: str,
	default_field: str = "is_default",
	active_field: str | None = "is_active",
) -> str | None:
	filters: dict = {default_field: 1}
	if active_field and frappe.get_meta(doctype).has_field(active_field):
		filters[active_field] = 1
	return frappe.db.get_value(doctype, filters, "name")
