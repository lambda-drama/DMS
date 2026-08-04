# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import cint, now_datetime


class DMSCRMCampaignMember(Document):
	def validate(self):
		if cint(self.opted_out) and self.status not in ("Unsubscribed", "Suppressed"):
			self.status = "Unsubscribed"
		if cint(self.converted) and self.status not in ("Sold", "Booked", "Workshop Visit"):
			self.status = "Sold"
		if not self.last_activity_on and (
			self.has_value_changed("status") or self.has_value_changed("response") or self.is_new()
		):
			self.last_activity_on = now_datetime()

	def on_update(self):
		self._flag_customer_dnc_if_opted_out()

	def after_insert(self):
		self._flag_customer_dnc_if_opted_out()

	def _flag_customer_dnc_if_opted_out(self):
		if not cint(self.opted_out) or not self.customer:
			return
		if not frappe.db.exists("DocType", "DMS CRM Customer Preference"):
			return
		name = frappe.db.get_value(
			"DMS CRM Customer Preference", {"customer": self.customer}, "name"
		)
		if name:
			frappe.db.set_value(
				"DMS CRM Customer Preference",
				name,
				{"do_not_contact": 1, "marketing_consent": 0},
				update_modified=False,
			)
		else:
			frappe.get_doc(
				{
					"doctype": "DMS CRM Customer Preference",
					"customer": self.customer,
					"do_not_contact": 1,
					"marketing_consent": 0,
				}
			).insert(ignore_permissions=True)
