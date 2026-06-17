# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PartsAdvisor(Document):
	def validate(self):
		if self.first_name and self.last_name:
			self.full_name = f"{self.first_name} {self.last_name}"
		elif self.first_name:
			self.full_name = self.first_name

		if self.internal_employee:
			internal = frappe.db.get_value(
				"DMS Internal Employee",
				self.internal_employee,
				["employee", "phone", "email", "first_name", "last_name"],
				as_dict=True,
			)
			if internal:
				if internal.employee and not self.employee_id:
					self.employee_id = internal.employee
				if internal.phone and not self.phone:
					self.phone = internal.phone
				if internal.email and not self.email:
					self.email = internal.email
				if internal.first_name and not self.first_name:
					self.first_name = internal.first_name
				if internal.last_name and not self.last_name:
					self.last_name = internal.last_name
				if self.first_name and self.last_name:
					self.full_name = f"{self.first_name} {self.last_name}"
