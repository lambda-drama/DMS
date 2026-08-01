# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class DMSCRMSettings(Document):
	def validate(self):
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)

		assert_dms_company_access(self.default_company)
