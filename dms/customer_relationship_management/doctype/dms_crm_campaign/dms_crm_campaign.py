# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime


class DMSCRMCampaign(Document):
	def validate(self):
		from dms.dealer_management_system.utils.branch_permissions import (
			assert_dms_branch_access,
		)
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if not self.campaign_owner:
			self.campaign_owner = frappe.session.user

		if self.start_date and self.end_date and getdate(self.end_date) < getdate(self.start_date):
			frappe.throw("End Date cannot be before Start Date.")

		if self.status == "Approved" and self.has_value_changed("status"):
			self.approved_by = frappe.session.user
			self.approved_on = now_datetime()
