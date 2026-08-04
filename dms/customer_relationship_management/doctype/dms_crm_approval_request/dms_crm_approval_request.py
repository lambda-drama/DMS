# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


APPROVER_ROLES = ("System Manager", "DMS CRM Manager")


def user_can_approve(user=None) -> bool:
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	return bool(set(frappe.get_roles(user)).intersection(APPROVER_ROLES))


class DMSCRMApprovalRequest(Document):
	def validate(self):
		if not self.requested_by:
			self.requested_by = frappe.session.user
		if not self.requested_on:
			self.requested_on = now_datetime()

		if self.status in ("Approved", "Rejected") and self.has_value_changed("status"):
			if not user_can_approve():
				frappe.throw(
					_("Only a DMS CRM Manager can approve or reject this request."),
					frappe.PermissionError,
				)
			self.approver = frappe.session.user
			self.decided_on = now_datetime()
