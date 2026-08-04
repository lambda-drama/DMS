# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import get_datetime, getdate


class DMSCRMTender(Document):
	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if self.account and not self.customer:
			self.customer = frappe.db.get_value("DMS CRM Account", self.account, "customer")

		if self.bid_deadline and self.close_date:
			if get_datetime(self.bid_deadline).date() > getdate(self.close_date):
				frappe.throw("Bid Deadline cannot be after Close Date.")
