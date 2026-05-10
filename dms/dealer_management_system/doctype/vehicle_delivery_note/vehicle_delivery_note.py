# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days


class VehicleDeliveryNote(Document):
	def on_submit(self):
		"""Auto-create follow-up record when delivery is submitted."""
		follow_up = frappe.get_doc(
			{
				"doctype": "Customer Follow Up",
				"job_card": self.job_card,
				"delivery": self.name,
				"follow_up_due_date": add_days(self.delivery_date_time, 2),
				"assigned_to": self.delivered_by,
				"contact_status": "Pending",
				"case_status": "Pending",
			}
		)
		follow_up.insert()
		
		# Update Job Card status
		frappe.db.set_value("DMS Job Card", self.job_card, "status", "Delivered")


@frappe.whitelist()
def make_sales_invoice_from_delivery_note(delivery_note):
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_sales_invoice_from_dms_job_card,
	)

	delivery_note_name = (delivery_note or "").strip()
	if not delivery_note_name:
		frappe.throw(_("Delivery Note name is required."))

	frappe.has_permission("Vehicle Delivery Note", "read", delivery_note_name, throw=True)

	dn_doc = frappe.get_doc("Vehicle Delivery Note", delivery_note_name)

	if not dn_doc.job_card:
		frappe.throw(_("Vehicle Delivery Note has no Job Card linked."))

	frappe.has_permission("Sales Invoice", "create", throw=True)
	frappe.has_permission("DMS Job Card", "read", dn_doc.job_card, throw=True)

	return create_sales_invoice_from_dms_job_card(dn_doc.job_card)
