# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_to_date, now_datetime


PRIORITY_SLA_HOURS = {
	"Critical": (0.25, 4),
	"High": (1, 24),
	"Medium": (4, 72),
	"Low": (24, 120),
}


class DMSCRMCase(Document):
	def validate(self):
		if not self.case_owner:
			self.case_owner = frappe.session.user
		self._set_sla_defaults()

	def _set_sla_defaults(self):
		if self.response_deadline and self.resolution_target:
			return
		hours = PRIORITY_SLA_HOURS.get(self.priority) or PRIORITY_SLA_HOURS["Medium"]
		base = now_datetime()
		if not self.response_deadline:
			self.response_deadline = add_to_date(base, hours=hours[0])
		if not self.resolution_target:
			self.resolution_target = add_to_date(base, hours=hours[1])
