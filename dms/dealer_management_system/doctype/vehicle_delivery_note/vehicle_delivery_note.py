# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_days


class VehicleDeliveryNote(Document):
	def on_submit(self):
		"""Auto-create follow-up record when delivery is submitted"""
		
		# Create follow-up record
		follow_up = frappe.get_doc({
			"doctype": "Customer Follow-up",
			"job_card": self.job_card,
			"delivery": self.name,
			"follow_up_due_date": add_days(self.delivery_date_time, 2),  # 2 days after delivery
			"assigned_to": self.delivered_by,
			"contact_status": "Pending",
			"case_status": "Pending"
		})
		follow_up.insert()
		
		# Update Job Card status
		frappe.db.set_value("Job Card", self.job_card, "status", "Delivered")
