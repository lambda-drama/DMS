# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

from frappe.model.document import Document
from frappe.utils import cint, now_datetime


class DMSCRMCustomerPreference(Document):
	def validate(self):
		if cint(self.do_not_contact):
			self.marketing_consent = 0
		if cint(self.marketing_consent) and not self.consent_on:
			self.consent_on = now_datetime()
