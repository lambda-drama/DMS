import frappe
from frappe.model.document import Document
from frappe.utils import add_to_date, cint, now_datetime


class DMSCRMTestDrive(Document):
	def before_validate(self):
		self._set_default_template()
		self._load_template_checklist()
		self._stamp_acceptance_and_consent()
		self._sync_flags_from_checklist()
		self._auto_complete_if_ready()

	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if self.end_odometer and self.start_odometer and self.end_odometer < self.start_odometer:
			frappe.throw("End odometer cannot be lower than start odometer.")

		if self.status in ("Failed", "No-Show", "Cancelled") and not self.failure_reason:
			frappe.throw("Failure / outcome reason is required.")

		if self.status in ("In Progress", "Completed"):
			if not self.id_verified:
				frappe.throw("Verify the driver's licence or ID before starting the test drive.")
			if not self.customer_consent:
				frappe.throw("Capture customer consent before starting the test drive.")
			if not self.vehicle_vin:
				frappe.throw("Select the VIN / stock unit used for the test drive.")

		if self.status == "Completed":
			if not self.outcome:
				frappe.throw("Select the customer outcome before completing the test drive.")
			failed = [row.check_item for row in self.checklist or [] if row.result == "Fail"]
			if failed:
				frappe.throw(
					"Checklist has failed items. Set the Test Drive status to Failed and record the reason."
				)
			incomplete = [
				row.check_item
				for row in self.checklist or []
				if row.is_mandatory and (not row.is_completed or row.result == "Pending")
			]
			if incomplete:
				frappe.throw("Complete every test-drive checklist item before marking Completed.")
			if not self.completed_on:
				self.completed_on = now_datetime()

		if self.outcome == "Model Changed" and not self.model_changed_to:
			frappe.throw("Select the model requested by the customer.")
		if self.incident_reported and not self.incident_details:
			frappe.throw("Enter incident details.")
		if self.damage_reported and not self.damage_details:
			frappe.throw("Enter vehicle damage details.")

	def on_update(self):
		if self.status == "Completed" and not self.follow_up_activity:
			self._create_follow_up_activity()

	def _set_default_template(self):
		if self.checklist_template:
			return
		self.checklist_template = frappe.db.get_value(
			"DMS CRM Test Drive Checklist Template",
			{"is_active": 1, "is_default": 1},
			"name",
		)
		if not self.checklist_template:
			self.checklist_template = frappe.db.get_value(
				"DMS CRM Test Drive Checklist Template",
				{"is_active": 1},
				"name",
				order_by="modified desc",
			)

	def _load_template_checklist(self):
		if self.checklist or not self.checklist_template:
			return
		template = frappe.get_cached_doc(
			"DMS CRM Test Drive Checklist Template", self.checklist_template
		)
		if not template.is_active:
			frappe.throw("The selected test-drive checklist template is inactive.")
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

	def _stamp_acceptance_and_consent(self):
		if self.status == "Accepted" and not self.accepted_on:
			self.accepted_on = now_datetime()
			self.accepted_by = frappe.session.user
		if self.customer_consent and not self.consent_on:
			self.consent_on = now_datetime()

	def _row_done(self, row) -> bool:
		result = (row.result or "Pending").strip()
		return bool(cint(row.is_completed)) and result not in ("", "Pending") and result != "Fail"

	def _sync_flags_from_checklist(self):
		"""Header ID/consent flags follow matching checklist ticks."""
		for row in self.checklist or []:
			if not self._row_done(row):
				continue
			item = (row.check_item or "").lower()
			if "licence" in item or "license" in item or " id " in f" {item} " or item.startswith("id "):
				self.id_verified = 1
			if "consent" in item:
				self.customer_consent = 1

	def _checklist_ready_for_complete(self) -> bool:
		rows = list(self.checklist or [])
		if not rows:
			return False
		for row in rows:
			if not cint(row.is_mandatory):
				continue
			if not cint(row.is_completed) or (row.result or "Pending") == "Pending":
				return False
			if (row.result or "") == "Fail":
				return False
		return True

	def _auto_complete_if_ready(self):
		"""If the checklist and outcome are done, mark Completed (Deal next-step uses this)."""
		if (self.status or "") in ("Completed", "Failed", "No-Show", "Cancelled"):
			return
		if not self._checklist_ready_for_complete():
			return
		if not (self.outcome or "").strip():
			return
		if not (self.vehicle_vin or "").strip():
			return
		# Checklist already covers verification / consent — ensure header flags match.
		self.id_verified = 1
		self.customer_consent = 1
		self.status = "Completed"
		if not self.completed_on:
			self.completed_on = now_datetime()

	def _create_follow_up_activity(self):
		activity_type = (
			"Quotation Follow-up"
			if self.outcome == "Quotation Requested"
			else "Test Drive"
		)
		activity = frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": activity_type,
				"subject": f"Follow up after test drive {self.name}",
				"status": "Open",
				"due_datetime": add_to_date(now_datetime(), days=1),
				"assigned_to": self.assigned_to or frappe.session.user,
				"priority": "High" if self.outcome in ("Quotation Requested", "Issue Reported") else "Medium",
				"opportunity": self.opportunity,
				"customer": self.customer,
				"reference_doctype": self.doctype,
				"reference_name": self.name,
				"outcome_notes": self.customer_feedback,
			}
		).insert(ignore_permissions=True)
		self.db_set("follow_up_activity", activity.name, update_modified=False)
