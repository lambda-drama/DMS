# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime


class DMSCRMReferral(Document):
	def validate(self):
		self._prevent_self_referral()
		self._prevent_duplicate()
		if not self.reward_event:
			try:
				s = frappe.get_cached_doc("DMS CRM Loyalty Settings")
				self.reward_event = s.referral_reward_event or "Delivery"
				if not self.reward_points:
					self.reward_points = cint(s.referral_reward_points) or 100
			except Exception:
				self.reward_event = self.reward_event or "Delivery"

	def _prevent_self_referral(self):
		try:
			s = frappe.get_cached_doc("DMS CRM Loyalty Settings")
			if not cint(s.prevent_self_referral):
				return
		except Exception:
			pass
		if self.referred_customer and self.referred_customer == self.referrer_customer:
			frappe.throw(_("Self-referral is not allowed."))
		# Match by mobile/email if lead linked
		if self.referred_lead:
			lead = frappe.db.get_value(
				"DMS CRM Lead",
				self.referred_lead,
				["mobile_no", "email_id"],
				as_dict=True,
			)
			cust = frappe.db.get_value(
				"Customer",
				self.referrer_customer,
				["mobile_no", "email_id"],
				as_dict=True,
			)
			if lead and cust:
				if lead.mobile_no and cust.mobile_no and lead.mobile_no == cust.mobile_no:
					frappe.throw(_("Self-referral detected (same mobile)."))
				if lead.email_id and cust.email_id and lead.email_id.lower() == cust.email_id.lower():
					frappe.throw(_("Self-referral detected (same email)."))

	def _prevent_duplicate(self):
		filters = {"referrer_customer": self.referrer_customer, "name": ["!=", self.name or ""]}
		if self.referred_customer:
			filters["referred_customer"] = self.referred_customer
		elif self.referred_lead:
			filters["referred_lead"] = self.referred_lead
		elif self.referred_name:
			filters["referred_name"] = self.referred_name
		else:
			return
		existing = frappe.db.exists("DMS CRM Referral", filters)
		if existing:
			frappe.throw(_("Duplicate referral already exists: {0}").format(existing))
