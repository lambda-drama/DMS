# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import cint


class DMSCRMAccount(Document):
	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if self.customer and not self.account_name:
			self.account_name = frappe.db.get_value("Customer", self.customer, "customer_name")

		self.fleet_size = sum(cint(row.quantity) for row in (self.fleet_units or []))
		self._assert_no_circular_parent()

	def _assert_no_circular_parent(self):
		if not self.parent_account:
			return
		if self.parent_account == self.name:
			frappe.throw("Parent Account cannot be the same as this Account.")

		visited = {self.name} if self.name else set()
		current = self.parent_account
		while current:
			if current in visited:
				frappe.throw("Circular Parent Account reference is not allowed.")
			visited.add(current)
			current = frappe.db.get_value("DMS CRM Account", current, "parent_account")
