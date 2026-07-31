import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class DMSCRMSalesAppointment(Document):
	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)
		if self.status == "Completed" and not self.completed_on:
			self.completed_on = now_datetime()
		if self.status in ("No-Show", "Cancelled") and not self.outcome_notes:
			frappe.throw("Outcome notes are required for a no-show or cancelled appointment.")
