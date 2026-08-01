import frappe
from frappe.model.document import Document


class DMSCRMDeliveryReadinessTemplate(Document):
	def validate(self):
		if not self.checklist_items:
			frappe.throw("Add at least one readiness checklist item.")
		if self.is_default:
			frappe.db.set_value(
				"DMS CRM Delivery Readiness Template",
				{"name": ["!=", self.name], "is_default": 1},
				"is_default",
				0,
				update_modified=False,
			)
