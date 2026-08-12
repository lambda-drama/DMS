# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from dms.dealer_management_system.utils.template_defaults import (
	enforce_single_default,
	get_default_template_name,
)


class DMSJobCardTerms(Document):
	def validate(self):
		enforce_single_default(self, "DMS Job Card Terms", "default")


def get_default_job_card_terms_name() -> str | None:
	return get_default_template_name(
		"DMS Job Card Terms",
		default_field="default",
		active_field=None,
	)


def apply_job_card_terms(doc) -> None:
	"""Use the default DMS Job Card Terms row when none is set, and copy the text."""
	if not frappe.db.exists("DocType", "DMS Job Card Terms"):
		return
	if not frappe.get_meta(doc.doctype).has_field("terms"):
		return

	terms_name = (doc.get("terms") or "").strip()
	if not terms_name:
		terms_name = get_default_job_card_terms_name() or ""
		if terms_name:
			doc.terms = terms_name

	if not terms_name:
		return

	text = frappe.db.get_value("DMS Job Card Terms", terms_name, "terms_and_conditions") or ""
	if not frappe.get_meta(doc.doctype).has_field("terms_and_conditions"):
		return
	if doc.has_value_changed("terms") or not (doc.get("terms_and_conditions") or "").strip():
		if text:
			doc.terms_and_conditions = text
