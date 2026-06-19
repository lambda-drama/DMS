# Copyright (c) 2026, Mania and contributors
"""Apply Company.default_letter_head onto transactional documents."""

from __future__ import annotations

import frappe


def get_company_default_letter_head(company: str | None) -> str | None:
	company = (company or "").strip()
	if not company:
		return None
	letter_head = frappe.db.get_value("Company", company, "default_letter_head")
	return (letter_head or "").strip() or None


def apply_company_letter_head(doc, company: str | None) -> None:
	"""Set letter_head from the Company master when the field exists on the doc."""
	letter_head = get_company_default_letter_head(company)
	if letter_head and doc.meta.has_field("letter_head"):
		doc.set("letter_head", letter_head)
