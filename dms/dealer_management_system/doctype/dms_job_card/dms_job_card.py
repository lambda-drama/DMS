# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import cint


class DMSJobCard(Document):
	def validate(self):
		self.ensure_qc_results_from_template()
		self.validate_qc_measurements()

	def ensure_qc_results_from_template(self):
		"""When a template is set and results are empty, copy lines (no link to template child names)."""
		if not self.qc_checklist_template:
			return
		if self.qc_results:
			return
		template = frappe.get_doc("QC Checklist Template", self.qc_checklist_template)
		for item in template.get("checklist_items") or []:
			display = item.get("check_item")
			if display:
				display = (
					frappe.db.get_value("QC Checklist Item Master", display, "qc_checklist_item") or display
				)

			req_m = cint(item.get("requires_measurement"))
			self.append(
				"qc_results",
				{
					"check_item_text": display or "",
					"category": item.get("category"),
					"is_mandatory": item.get("is_mandatory"),
					"requires_photo": item.get("requires_photo"),
					"requires_measurement": item.get("requires_measurement"),
					"min_value": item.min_value if req_m else None,
					"max_value": item.max_value if req_m else None,
					"result": "Pass",
				},
			)

	def validate_qc_measurements(self):
		"""Use min/max copied onto each QC result row (no checklist_item link)."""
		for result in self.qc_results or []:
			if not cint(getattr(result, "requires_measurement", 0)):
				continue
			if getattr(result, "measurement_value", None) is None:
				continue

			fail = False
			min_v = getattr(result, "min_value", None)
			max_v = getattr(result, "max_value", None)
			if min_v is not None and result.measurement_value < min_v:
				fail = True
			if max_v is not None and result.measurement_value > max_v:
				fail = True
			if fail:
				result.result = "Fail"
