# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DMSInternalEmployee(Document):
	def validate(self):
		if self.first_name and self.last_name:
			self.full_name = f"{self.first_name} {self.last_name}"
		elif self.first_name:
			self.full_name = self.first_name

		if self.employee and not self.employee_code:
			self.employee_code = frappe.db.get_value("Employee", self.employee, "employee_number")
