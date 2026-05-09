# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname

class VehicleWarningLight(Document):
	def autoname(self):
		series = f"WL-{self.warning_light}"
		self.name = series
