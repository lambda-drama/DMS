# Copyright (c) 2026, Mania and contributors

import frappe
from frappe.model.document import Document


class DMSAdditionalWorkRequest(Document):
	def validate(self):
		self._copy_branch_from_job_card()

	def _copy_branch_from_job_card(self):
		if not self.job_card or not self.meta.has_field("branch"):
			return
		jc_branch = frappe.db.get_value("DMS Job Card", self.job_card, "branch")
		if jc_branch:
			self.branch = jc_branch
