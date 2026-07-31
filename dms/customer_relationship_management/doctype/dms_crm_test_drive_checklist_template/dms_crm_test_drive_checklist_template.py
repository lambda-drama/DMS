import frappe
from frappe.model.document import Document


class DMSCRMTestDriveChecklistTemplate(Document):
	def validate(self):
		if not self.checklist_items:
			frappe.throw("Add at least one checklist item.")
		if self.is_default:
			frappe.db.set_value(
				"DMS CRM Test Drive Checklist Template",
				{"name": ["!=", self.name], "is_default": 1},
				"is_default",
				0,
				update_modified=False,
			)
