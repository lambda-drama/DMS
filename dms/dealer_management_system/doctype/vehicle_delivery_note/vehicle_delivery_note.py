# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint


def score_to_satisfaction_label(score) -> str | None:
	n = cint(score)
	if n >= 4:
		return "Happy"
	if n == 3:
		return "Neutral"
	if 1 <= n <= 2:
		return "Unhappy"
	return None


def satisfaction_label_to_score(label) -> int | None:
	s = (label or "").strip().lower()
	if s == "happy":
		return 5
	if s == "neutral":
		return 3
	if s == "unhappy":
		return 1
	return None


class VehicleDeliveryNote(Document):
	def validate(self):
		self.sync_satisfaction_score()

	def sync_satisfaction_score(self):
		"""Keep Int 1–5 score and Happy/Neutral/Unhappy label aligned."""
		score = cint(self.customer_satisfaction_score) if self.customer_satisfaction_score not in (None, "") else 0
		if 1 <= score <= 5:
			self.customer_satisfaction_score = score
			label = score_to_satisfaction_label(score)
			if label:
				self.customer_satisfaction_initial = label
			return

		from_label = satisfaction_label_to_score(self.customer_satisfaction_initial)
		if from_label:
			self.customer_satisfaction_score = from_label

	def on_submit(self):
		"""Auto-create follow-up record when delivery is submitted."""
		follow_up_data = {
			"doctype": "Customer Follow Up",
			"job_card": self.job_card,
			"delivery": self.name,
			"follow_up_due_date": add_days(self.delivery_date_time, 2),
			"assigned_to": self.delivered_by,
			"contact_status": "Pending",
			"case_status": "Pending",
		}
		# Seed follow-up rating from delivery score when available
		score = cint(self.customer_satisfaction_score)
		if 1 <= score <= 5:
			follow_up_data["customer_rating_score"] = score

		follow_up = frappe.get_doc(follow_up_data)
		follow_up.insert()

		# Update Job Card status + permanent delivery timestamp (§2.3 TAT)
		from frappe.utils import now_datetime
		from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
			log_job_card_status_change,
		)

		delivered_at = self.delivery_date_time or now_datetime()
		prev = frappe.db.get_value("DMS Job Card", self.job_card, "status")
		frappe.db.set_value(
			"DMS Job Card",
			self.job_card,
			{"status": "Delivered", "delivery_date_time": delivered_at},
			update_modified=True,
		)
		log_job_card_status_change(
			self.job_card, "Delivered", previous_status=prev, when=delivered_at
		)


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
