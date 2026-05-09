# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CustomerFollowUp(Document):
	def on_update(self):
		"""Update Job Card if repeat repair detected"""
		
		if self.repeat_repair_risk:
			frappe.db.set_value("DMS Job Card", self.job_card, "is_repeat_repair", 1)
		
		if self.new_issue_reported and self.new_job_card_created:
			frappe.db.set_value("DMS Job Card", self.job_card, "repeat_repair_reference", self.new_job_card_created)
