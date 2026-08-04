# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, today

STAGE_PROBABILITY = {
	"New": 5,
	"Contact Attempted": 10,
	"Contacted": 15,
	"Qualified": 25,
	"Appointment Scheduled": 35,
	"Test Drive": 45,
	"Quotation Submitted": 55,
	"Negotiation": 65,
	"Booking / Deposit": 80,
	"Order Confirmed": 90,
	"Won": 100,
	"Lost": 0,
	"Nurture": 10,
}

OPEN_STATUSES = {"Open", "On Hold"}


class DMSCRMOpportunity(Document):
	def validate(self):
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)
		from dms.dealer_management_system.utils.branch_permissions import (
			assert_dms_branch_access,
		)

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if not self.opportunity_owner:
			self.opportunity_owner = frappe.session.user

		if not self.transaction_date:
			self.transaction_date = today()

		if not self.currency and self.company:
			self.currency = frappe.db.get_value("Company", self.company, "default_currency")

		self._sync_stage_status()
		self._validate_stage_evidence()
		self._apply_stage_probability()
		self._calculate_item_totals()
		self._enforce_open_controls()

	def _sync_stage_status(self):
		if self.stage == "Won":
			self.status = "Won"
		elif self.stage == "Lost":
			self.status = "Lost"
			if not self.lost_reason:
				frappe.throw("Lost Reason is required when opportunity is Lost.")
			if not self.lost_value and self.expected_value:
				self.lost_value = self.expected_value
		elif self.status == "Won" and self.stage not in ("Won", "Order Confirmed", "Booking / Deposit"):
			self.stage = "Won"
		elif self.status == "Lost" and self.stage != "Lost":
			self.stage = "Lost"

	def _apply_stage_probability(self):
		if self.stage in STAGE_PROBABILITY and self.has_value_changed("stage"):
			self.probability = STAGE_PROBABILITY[self.stage]

	def _validate_stage_evidence(self):
		"""Pipeline stages describe completed business actions, not manually selected labels."""
		if getattr(self.flags, "ignore_pipeline_evidence", False):
			return
		# Legacy records may already be at a late stage. Enforce evidence when advancing now.
		if not self.is_new() and not self.has_value_changed("stage"):
			return

		requirements = {
			"Appointment Scheduled": ("sales_appointment", "a scheduled Sales Appointment"),
			"Test Drive": ("test_drive", "a Test Drive record"),
			"Quotation Submitted": ("quotation", "a Quotation"),
			"Negotiation": ("quotation", "a Quotation"),
			"Booking / Deposit": ("booking", "a Booking / Deposit record"),
			"Order Confirmed": ("sales_invoice", "a Sales Invoice"),
			"Won": ("sales_invoice", "a submitted Sales Invoice that updates stock"),
		}
		requirement = requirements.get(self.stage)
		if requirement and not self.get(requirement[0]):
			# Legacy deals may only have the Sales Order link before Booking DocType existed.
			if self.stage == "Booking / Deposit" and self.sales_order:
				pass
			else:
				frappe.throw(f"Create {requirement[1]} before moving the deal to {self.stage}.")

		if self.stage == "Booking / Deposit" and self.booking:
			booking = frappe.db.get_value(
				"DMS CRM Booking",
				self.booking,
				["status", "deposit_amount", "receipt_reference", "payment_entry"],
				as_dict=True,
			)
			if booking and booking.status in ("Cancelled", "Expired"):
				frappe.throw("Create or reopen an active Booking before Booking / Deposit.")
			if (
				booking
				and booking.status in ("Confirmed", "Allocated", "Converted to Sale")
				and not (
					flt(booking.deposit_amount) > 0
					and (booking.receipt_reference or booking.payment_entry)
				)
			):
				frappe.throw(
					"Confirmed bookings require a deposit amount and receipt / Payment Entry."
				)

		if self.stage == "Won" and self.sales_invoice:
			invoice = frappe.db.get_value(
				"Sales Invoice",
				self.sales_invoice,
				["docstatus", "update_stock"],
				as_dict=True,
			)
			if not invoice or invoice.docstatus != 1 or not invoice.update_stock:
				frappe.throw(
					"Won requires a submitted Sales Invoice with Update Stock enabled."
				)
			if self.delivery_readiness:
				ready_status = frappe.db.get_value(
					"DMS CRM Delivery Readiness", self.delivery_readiness, "status"
				)
				if ready_status not in ("Ready", "Delivered"):
					frappe.throw(
						"Complete Delivery Readiness (status Ready) before marking Won."
					)
		elif self.stage in STAGE_PROBABILITY and self.probability in (None, ""):
			self.probability = STAGE_PROBABILITY[self.stage]

	def _calculate_item_totals(self):
		total = 0.0
		net_total = 0.0

		for row in self.items or []:
			row.qty = max(flt(row.qty), 0)
			row.rate = max(flt(row.rate), 0)
			row.discount_percentage = min(max(flt(row.discount_percentage), 0), 100)

			if row.item_code and not row.item_name:
				row.item_name = frappe.db.get_value("Item", row.item_code, "item_name")
			if row.item_code and not row.uom:
				row.uom = frappe.db.get_value("Item", row.item_code, "stock_uom")

			row.amount = flt(row.qty * row.rate)
			row.discount_amount = flt(row.amount * row.discount_percentage / 100)
			row.net_amount = flt(row.amount - row.discount_amount)
			total += row.amount
			net_total += row.net_amount

		self.total = flt(total)
		self.net_total = flt(net_total)

		if not flt(self.expected_value) and net_total:
			self.expected_value = flt(net_total)

	def _enforce_open_controls(self):
		from frappe import _
		from frappe.utils import cint

		if self.status not in OPEN_STATUSES:
			return
		# Nurture stage is formally parked — skip next-action hard rule
		if self.stage == "Nurture":
			return
		settings = None
		try:
			settings = frappe.get_cached_doc("DMS CRM Settings")
		except Exception:
			pass
		hard = cint(getattr(settings, "hard_enforce_next_action", None) or 0) if settings else 0
		require_close = (
			cint(getattr(settings, "require_close_date_on_opportunity", None) or 1) if settings else 1
		)
		if require_close and not self.expected_close_date:
			msg = _("Open opportunities require an Expected Closing date.")
			if hard:
				frappe.throw(msg)
			frappe.msgprint(msg, indicator="orange", alert=True)
		if not self.next_action_due or not self.next_action:
			msg = _("Open opportunities require a Next Action and Due date (unless Nurture).")
			if hard:
				frappe.throw(msg)
			frappe.msgprint(msg, indicator="orange", alert=True)
