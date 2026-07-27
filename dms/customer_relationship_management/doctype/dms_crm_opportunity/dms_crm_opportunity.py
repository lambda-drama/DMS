# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

STAGE_PROBABILITY = {
	"New": 5,
	"Contact Attempted": 10,
	"Contacted": 15,
	"Qualified": 25,
	"Appointment Scheduled": 35,
	"Test Drive": 45,
	"Quotation Submitted": 55,
	"Negotiation": 65,
	"Booking / Deposit": 80,
	"Order Confirmed": 90,
	"Won": 100,
	"Lost": 0,
	"Nurture": 10,
}


class DMSCRMOpportunity(Document):
	def validate(self):
		if not self.opportunity_owner:
			self.opportunity_owner = frappe.session.user

		if self.stage in STAGE_PROBABILITY and self.probability in (None, ""):
			self.probability = STAGE_PROBABILITY[self.stage]

		if self.stage == "Won":
			self.status = "Won"
		elif self.stage == "Lost":
			self.status = "Lost"
			if not self.lost_reason:
				frappe.throw("Lost Reason is required when opportunity is Lost.")

		if self.status == "Open" and not self.expected_close_date:
			frappe.msgprint(
				"Open opportunities should have an Expected Close date.",
				indicator="orange",
				alert=True,
			)
