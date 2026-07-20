# Copyright (c) 2026, Mania and contributors
"""Backfill Customer Follow Up.customer_rating_score from Select labels."""

from __future__ import annotations

import frappe
from frappe.utils import cint

from dms.dealer_management_system.doctype.customer_follow_up.customer_follow_up import (
	RATING_LABELS,
	rating_label_to_score,
)


def execute():
	if not frappe.db.exists("DocType", "Customer Follow Up"):
		return
	if not frappe.db.has_column("Customer Follow Up", "customer_rating_score"):
		return

	rows = frappe.db.sql(
		"""
		SELECT name, customer_rating, customer_rating_score
		FROM `tabCustomer Follow Up`
		WHERE IFNULL(customer_rating, '') != ''
		""",
		as_dict=True,
	)
	for row in rows:
		score = cint(row.customer_rating_score) if row.customer_rating_score else 0
		if 1 <= score <= 5:
			continue
		parsed = rating_label_to_score(row.customer_rating)
		if not parsed:
			continue
		frappe.db.set_value(
			"Customer Follow Up",
			row.name,
			{
				"customer_rating_score": parsed,
				"customer_rating": RATING_LABELS[parsed],
			},
			update_modified=False,
		)
