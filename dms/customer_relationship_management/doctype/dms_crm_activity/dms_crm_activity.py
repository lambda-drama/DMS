# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class DMSCRMActivity(Document):
	def validate(self):
		if not self.assigned_to:
			self.assigned_to = frappe.session.user
		if self.status == "Completed" and not self.completed_on:
			self.completed_on = now_datetime()
