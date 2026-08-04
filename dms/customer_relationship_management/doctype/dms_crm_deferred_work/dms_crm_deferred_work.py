# Copyright (c) 2026, Mania and contributors
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

CLOSED = {"Completed", "Declined", "No Longer Applicable", "Vehicle Sold"}


class DMSCRMDeferredWork(Document):
	def validate(self):
		if self.status in CLOSED and not self.closed_on:
			self.closed_on = now_datetime()
		if self.status not in CLOSED:
			self.closed_on = None
