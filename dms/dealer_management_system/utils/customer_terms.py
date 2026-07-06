"""Shared customer terms and conditions helpers."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, now_datetime


def _terms_record_fields() -> list[str]:
	meta = frappe.get_meta("DMS Customer Terms and Conditions")
	fields = ["name", "terms_title", "more_details", "modified"]
	if meta.has_field("language"):
		fields.append("language")
	if meta.has_field("arabic"):
		fields.append("arabic")
	return fields


def _fetch_terms_row(filters: dict | None = None):
	rows = frappe.get_all(
		"DMS Customer Terms and Conditions",
		filters=filters or None,
		fields=_terms_record_fields(),
		order_by="modified desc",
		limit=1,
	)
	return rows[0] if rows else None


def get_bilingual_customer_terms() -> dict:
	"""Return English + Arabic term record names for storage on documents."""
	meta = frappe.get_meta("DMS Customer Terms and Conditions")

	if meta.has_field("arabic"):
		return {
			"english": frappe.db.get_value(
				"DMS Customer Terms and Conditions",
				[["arabic", "!=", 1]],
				"name",
				order_by="modified desc",
			),
			"arabic": frappe.db.get_value(
				"DMS Customer Terms and Conditions",
				{"arabic": 1},
				"name",
				order_by="modified desc",
			),
		}

	if meta.has_field("language"):
		return {
			"english": frappe.db.get_value(
				"DMS Customer Terms and Conditions",
				{"language": "English"},
				"name",
				order_by="modified desc",
			),
			"arabic": frappe.db.get_value(
				"DMS Customer Terms and Conditions",
				{"language": "Arabic"},
				"name",
				order_by="modified desc",
			),
		}

	rows = frappe.get_all(
		"DMS Customer Terms and Conditions",
		pluck="name",
		order_by="modified desc",
		limit=2,
	)
	if not rows:
		return {"english": None, "arabic": None}
	if len(rows) == 1:
		return {"english": rows[0], "arabic": None}
	return {"english": rows[0], "arabic": rows[1]}


def fetch_bilingual_terms_payload() -> dict:
	"""Return english + arabic term records for API responses."""
	meta = frappe.get_meta("DMS Customer Terms and Conditions")

	if meta.has_field("arabic"):
		return {
			"english": _fetch_terms_row([["arabic", "!=", 1]]),
			"arabic": _fetch_terms_row({"arabic": 1}),
		}

	if meta.has_field("language"):
		return {
			"english": _fetch_terms_row({"language": "English"}),
			"arabic": _fetch_terms_row({"language": "Arabic"}),
		}

	rows = frappe.get_all(
		"DMS Customer Terms and Conditions",
		fields=_terms_record_fields(),
		order_by="modified desc",
		limit=2,
	)
	if not rows:
		return {"english": None, "arabic": None}
	if len(rows) == 1:
		return {"english": rows[0], "arabic": None}
	return {"english": rows[0], "arabic": rows[1]}


def require_and_record_terms_acceptance(doc, terms_accepted: int | bool) -> None:
	if not cint(terms_accepted):
		frappe.throw(
			_("Customer must accept the terms and conditions before signing."),
			title=_("Terms and Conditions"),
		)
	pair = get_bilingual_customer_terms()
	english = pair.get("english")
	arabic = pair.get("arabic")
	if not english or not arabic:
		frappe.throw(
			_(
				"Configure English and Arabic customer terms in DMS Customer Terms and "
				"Conditions (check Arabic on the Arabic record) before customer approval."
			),
			title=_("Terms and Conditions"),
		)

	meta = frappe.get_meta(doc.doctype)
	if meta.has_field("terms_and_conditions"):
		doc.terms_and_conditions = english
	if meta.has_field("terms_and_conditions_ar"):
		doc.terms_and_conditions_ar = arabic
	if meta.has_field("terms_accepted"):
		doc.terms_accepted = 1
	if meta.has_field("terms_accepted_at"):
		doc.terms_accepted_at = now_datetime()
