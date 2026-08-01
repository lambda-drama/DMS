import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class DMSCRMDeliveryReadiness(Document):
	def before_validate(self):
		self._set_default_template()
		self._load_template_checklist()

	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if self.status == "Ready":
			incomplete = [
				row.check_item
				for row in self.checklist or []
				if row.is_mandatory and (not row.is_completed or row.result == "Pending")
			]
			if incomplete:
				frappe.throw(
					"Complete every mandatory readiness item before marking Ready: "
					+ ", ".join(incomplete[:5])
				)
			failed = [row.check_item for row in self.checklist or [] if row.result == "Fail"]
			if failed:
				frappe.throw("Resolve failed readiness items before marking Ready.")
			if not self.vehicle_vin and not self.factory_order_reference:
				frappe.throw("Allocate a VIN / stock unit or enter the factory order reference.")
			if not self.ready_on:
				self.ready_on = now_datetime()
		elif self.status == "Blocked" and not self.blocked_reason:
			frappe.throw("Enter the blocked reason.")

	def _set_default_template(self):
		if self.checklist_template:
			return
		self.checklist_template = frappe.db.get_value(
			"DMS CRM Delivery Readiness Template",
			{"is_active": 1, "is_default": 1},
			"name",
		) or frappe.db.get_value(
			"DMS CRM Delivery Readiness Template",
			{"is_active": 1},
			"name",
			order_by="modified desc",
		)

	def _load_template_checklist(self):
		if self.checklist or not self.checklist_template:
			return
		template = frappe.get_cached_doc(
			"DMS CRM Delivery Readiness Template", self.checklist_template
		)
		for row in template.checklist_items:
			self.append(
				"checklist",
				{
					"category": row.category,
					"check_item": row.check_item,
					"is_mandatory": row.is_mandatory,
					"result": "Pending",
				},
			)
