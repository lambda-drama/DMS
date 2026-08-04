# Copyright (c) 2026, Mania and contributors
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class DMSCRMCallQualityScore(Document):
	def validate(self):
		if self.score is not None and (self.score < 1 or self.score > 100):
			frappe.throw("Score must be between 1 and 100.")
		if not self.scored_on:
			self.scored_on = now_datetime()
		if not self.scored_by:
			self.scored_by = frappe.session.user
