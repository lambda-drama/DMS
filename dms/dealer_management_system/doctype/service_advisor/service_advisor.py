# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_time


class ServiceAdvisor(Document):
	def validate(self):
		"""Set full name before save"""
		if self.first_name and self.last_name:
			self.full_name = f"{self.first_name} {self.last_name}"
		elif self.first_name:
			self.full_name = self.first_name
		self.validate_custom_lunch()

	def validate_custom_lunch(self):
		start, end = self.custom_lunch_start, self.custom_lunch_end
		if start and not end:
			frappe.throw(_("Set Custom Lunch To when Custom Lunch From is set."))
		if end and not start:
			frappe.throw(_("Set Custom Lunch From when Custom Lunch To is set."))
		if start and end:
			s, e = get_time(start), get_time(end)
			if s and e and (e.hour, e.minute, e.second) <= (s.hour, s.minute, s.second):
				frappe.throw(_("Custom lunch end must be after custom lunch start."))

