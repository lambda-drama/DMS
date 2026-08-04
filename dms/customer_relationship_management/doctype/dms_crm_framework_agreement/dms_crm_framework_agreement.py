# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import getdate


class DMSCRMFrameworkAgreement(Document):
	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if self.account and not self.customer:
			self.customer = frappe.db.get_value("DMS CRM Account", self.account, "customer")

		if self.valid_from and self.valid_to and getdate(self.valid_to) < getdate(self.valid_from):
			frappe.throw("Valid To cannot be before Valid From.")
