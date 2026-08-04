# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, getdate, now_datetime, today


class DMSCRMLoyaltyAdjustment(Document):
	def validate(self):
		if not self.requested_by:
			self.requested_by = frappe.session.user
		if not self.requested_on:
			self.requested_on = now_datetime()
		if cint(self.points) == 0:
			frappe.throw(_("Points cannot be zero."))

	def after_insert(self):
		if self.status == "Approved":
			self._post_to_erpnext()

	def on_update(self):
		if self.status == "Approved" and self.has_value_changed("status"):
			roles = set(frappe.get_roles())
			if frappe.session.user != "Administrator" and not roles.intersection(
				{"System Manager", "DMS CRM Manager"}
			):
				frappe.throw(_("Only a DMS CRM Manager can approve loyalty adjustments."))
			self.db_set("approved_by", frappe.session.user, update_modified=False)
			self.db_set("approved_on", now_datetime(), update_modified=False)
			self._post_to_erpnext()

	def _post_to_erpnext(self):
		if self.loyalty_point_entry:
			return
		if not frappe.db.exists("DocType", "Loyalty Point Entry"):
			self.db_set("status", "Posted", update_modified=False)
			return

		program = frappe.db.get_value("Customer", self.customer, "loyalty_program")
		if not program:
			try:
				from dms.crm_api.loyalty import resolve_program_for_customer

				program = resolve_program_for_customer(self.customer)
			except Exception:
				program = None
		if not program:
			try:
				settings = frappe.get_cached_doc("DMS CRM Loyalty Settings")
				program = settings.retail_loyalty_program or settings.fleet_loyalty_program
			except Exception:
				program = None
		if not program:
			frappe.msgprint(
				_("No Loyalty Program on customer — adjustment approved but not posted to ERPNext."),
				indicator="orange",
				alert=True,
			)
			self.db_set("status", "Posted", update_modified=False)
			return

		# Auto-enroll so future SI earning works
		if not frappe.db.get_value("Customer", self.customer, "loyalty_program"):
			frappe.db.set_value(
				"Customer",
				self.customer,
				"loyalty_program",
				program,
				update_modified=False,
			)

		points = abs(cint(self.points))
		# Credit = positive loyalty_points; Debit/Expire = negative
		signed = points if self.adjustment_type in ("Credit", "Correction") else -points
		if self.adjustment_type == "Correction" and cint(self.points) < 0:
			signed = cint(self.points)

		company = frappe.db.get_value("Loyalty Program", program, "company") or (
			frappe.defaults.get_user_default("Company")
		)
		expiry_days = cint(
			frappe.db.get_value("Loyalty Program", program, "expiry_duration") or 365
		)
		tier = frappe.db.get_value("Customer", self.customer, "loyalty_program_tier")

		entry = frappe.get_doc(
			{
				"doctype": "Loyalty Point Entry",
				"loyalty_program": program,
				"loyalty_program_tier": tier,
				"customer": self.customer,
				"loyalty_points": signed,
				"purchase_amount": 0,
				"posting_date": getdate(today()),
				"expiry_date": add_days(getdate(today()), expiry_days),
				"company": company,
			}
		)
		if entry.meta.has_field("invoice_type"):
			# Required Link(DocType) on this ERPNext version; discretionary credits have no invoice.
			entry.invoice_type = "Sales Invoice"
		if entry.meta.has_field("discretionary_reason"):
			entry.discretionary_reason = (self.reason or "")[:140]
		entry.insert(ignore_permissions=True)
		self.db_set("loyalty_point_entry", entry.name, update_modified=False)
		self.db_set("status", "Posted", update_modified=False)
