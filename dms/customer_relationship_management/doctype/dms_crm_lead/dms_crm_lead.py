# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DMSCRMLead(Document):
	def validate(self):
		if not self.lead_name:
			parts = [self.first_name, self.last_name]
			name = " ".join(p for p in parts if p).strip()
			self.lead_name = name or self.organization_name or self.mobile_no or "Lead"

		if self.status in ("New", "Assigned") and not self.lead_owner:
			self.lead_owner = frappe.session.user

		if self.status not in ("Converted", "Disqualified", "Duplicate", "Invalid", "Nurture"):
			if not self.next_action_due and self.status != "New":
				frappe.msgprint(
					"Open leads should have a Next Action Due date.",
					indicator="orange",
					alert=True,
				)
