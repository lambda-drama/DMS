# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from dms.dealer_management_system.utils.template_defaults import enforce_single_default


class DiagnosisTemplate(Document):
	def validate(self):
		enforce_single_default(self, "Diagnosis Template")
