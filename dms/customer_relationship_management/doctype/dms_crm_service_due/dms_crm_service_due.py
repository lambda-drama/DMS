# Copyright (c) 2026, Mania and contributors
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class DMSCRMServiceDue(Document):
	def validate(self):
		if self.adjusted_due_date or self.adjusted_due_km:
			if not (self.adjustment_reason or "").strip():
				frappe.throw("Adjustment Reason is required when changing the due date or mileage.")
			if self.has_value_changed("adjusted_due_date") or self.has_value_changed("adjusted_due_km"):
				self.adjustment_by = frappe.session.user
				self.adjustment_on = now_datetime()
		self.effective_due_date = self.adjusted_due_date or self.due_date
