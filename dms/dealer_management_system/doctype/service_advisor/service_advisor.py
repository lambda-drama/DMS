# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ServiceAdvisor(Document):
	def validate(self):
		"""Set full name before save"""
		if self.first_name and self.last_name:
			self.full_name = f"{self.first_name} {self.last_name}"
		elif self.first_name:
			self.full_name = self.first_name

