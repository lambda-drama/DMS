# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.model.document import Document


class DMSCRMLeadAssignmentPool(Document):
	def validate(self):
		from dms.dealer_management_system.utils.branch_permissions import (
			assert_dms_branch_access,
		)

		assert_dms_branch_access(self.branch)

		active_users = [row.user for row in (self.users or []) if row.active and row.user]
		if not active_users:
			frappe.throw("Add at least one active user to the assignment pool.")

		others = frappe.get_all(
			"DMS CRM Lead Assignment Pool",
			filters={
				"assigned_team": self.assigned_team,
				"active": 1,
				"name": ["!=", self.name or ""],
			},
			fields=["name", "branch"],
		)
		my_branch = self.branch or ""
		for row in others:
			if (row.branch or "") == my_branch:
				frappe.throw(
					f"An active pool already exists for team {self.assigned_team}"
					+ (f" and branch {self.branch}" if self.branch else " (all branches)")
					+ f": {row.name}"
				)
