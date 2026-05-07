# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now

class DMSJobCard(Document):
	def populate_qc_results(self):
		"""Auto-populate QC results from selected template"""
		if self.qc_checklist_template and not self.qc_results:
			template = frappe.get_doc("QC Checklist Template", self.qc_checklist_template)
			
			for item in template.checklist_items:
				self.append("qc_results", {
					"checklist_item": item.name,
					"check_item_text": item.check_item,
					"category": item.category,
					"is_mandatory": item.is_mandatory,
					"requires_photo": item.requires_photo,
					"requires_measurement": item.requires_measurement,
					"result": "Pass",  # Default result
					"inspected_by": frappe.session.user,
					"inspected_at": now()
				})
			
			self.qc_status = "Pending"
   
   
	def validate_qc_measurements(self):
		"""Auto-calculate if measurements are within spec"""
		for result in self.qc_results:
			if result.requires_measurement and result.measurement_value:
				checklist_item = frappe.get_cached_doc("QC Checklist Item", result.checklist_item)
				
				if checklist_item.min_value and result.measurement_value < checklist_item.min_value:
					result.measurement_pass = 0
					result.result = "Fail"
				elif checklist_item.max_value and result.measurement_value > checklist_item.max_value:
					result.measurement_pass = 0
					result.result = "Fail"
				else:
					result.measurement_pass = 1
