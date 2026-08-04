# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DMSCRMSegment(Document):
	def validate(self):
		from dms.dealer_management_system.utils.branch_permissions import (
			assert_dms_branch_access,
		)
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)
		if not self.owner_user:
			self.owner_user = frappe.session.user
