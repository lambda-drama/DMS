import frappe
from frappe.model.document import Document
from frappe.utils import flt, getdate, now_datetime, today


class DMSCRMBooking(Document):
	def validate(self):
		from dms.api.utils import assert_dms_company_access
		from dms.dealer_management_system.utils.branch_permissions import assert_dms_branch_access

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if flt(self.deposit_amount) < 0:
			frappe.throw("Deposit amount cannot be negative.")
		if self.booking_expiry and getdate(self.booking_expiry) < getdate(today()):
			frappe.throw("Booking expiry cannot be before today.")
		if self.status in ("Confirmed", "Allocated") and flt(self.deposit_amount) <= 0:
			frappe.throw("A deposit amount is required before confirming the booking.")
		if self.status == "Confirmed" and not (self.receipt_reference or self.payment_entry):
			frappe.throw("Add the deposit receipt reference or Payment Entry before confirming.")
		if self.status in ("Cancelled", "Expired") and not self.cancellation_reason:
			frappe.throw("Enter the cancellation / expiry reason.")
		if self.allocation_switch_requested and not self.allocation_switch_reason:
			frappe.throw("Enter the reason for switching the vehicle allocation.")
		if self.allocation_switch_approved and not self.allocation_switch_approved_by:
			self.allocation_switch_approved_by = frappe.session.user
		if self.status == "Allocated" and not self.vehicle_vin and not self.factory_order_reference:
			frappe.throw("Allocate a VIN / stock unit or enter a factory order reference.")
		self._assert_vin_not_double_allocated()

	def _assert_vin_not_double_allocated(self):
		if not self.vehicle_vin or self.status in ("Cancelled", "Expired"):
			return
		existing = frappe.db.get_value(
			"DMS CRM Booking",
			{
				"name": ["!=", self.name or ""],
				"vehicle_vin": self.vehicle_vin,
				"status": ["in", ["Confirmed", "Allocation Pending", "Allocated"]],
			},
			"name",
		)
		if existing:
			frappe.throw(
				f"VIN / stock unit {self.vehicle_vin} is already reserved by booking {existing}."
			)

	def append_allocation_history(self, action, from_vin=None, to_vin=None, notes=None, approved_by=None):
		self.append(
			"allocation_history",
			{
				"action": action,
				"from_vin": from_vin,
				"to_vin": to_vin,
				"action_on": now_datetime(),
				"action_by": frappe.session.user,
				"approved_by": approved_by,
				"notes": notes,
			},
		)
