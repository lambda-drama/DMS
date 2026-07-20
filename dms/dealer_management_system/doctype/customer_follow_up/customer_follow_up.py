# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import re

import frappe
from frappe.model.document import Document
from frappe.utils import cint

RATING_LABELS = {
	1: "1 - Very Unsatisfied",
	2: "2 - Unsatisfied",
	3: "3 - Neutral",
	4: "4 - Satisfied",
	5: "5 - Very Satisfied",
}


def rating_label_to_score(value) -> int | None:
	"""Parse Select label / number → 1–5."""
	if value in (None, ""):
		return None
	if isinstance(value, (int, float)):
		n = cint(value)
		return n if 1 <= n <= 5 else None
	m = re.match(r"\s*(\d+)", str(value))
	if not m:
		return None
	n = cint(m.group(1))
	return n if 1 <= n <= 5 else None


class CustomerFollowUp(Document):
	def validate(self):
		self.sync_customer_rating_score()

	def sync_customer_rating_score(self):
		"""Keep Int score and Select label aligned (reports use the number field)."""
		from_label = rating_label_to_score(self.customer_rating)
		score = cint(self.customer_rating_score) if self.customer_rating_score not in (None, "") else 0

		# Prefer an explicit score change; otherwise derive from the Select.
		if score and 1 <= score <= 5:
			self.customer_rating_score = score
			self.customer_rating = RATING_LABELS[score]
		elif from_label:
			self.customer_rating_score = from_label
			self.customer_rating = RATING_LABELS[from_label]
		else:
			self.customer_rating_score = None

	def on_update(self):
		"""Update Job Card if repeat repair detected"""
		if self.repeat_repair_risk:
			frappe.db.set_value("DMS Job Card", self.job_card, "is_repeat_repair", 1)

		if self.new_issue_reported and self.new_job_card_created:
			frappe.db.set_value(
				"DMS Job Card",
				self.job_card,
				"repeat_repair_reference",
				self.new_job_card_created,
			)
