# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, add_months, cint, get_datetime, now_datetime


MIN_NOTES_LEN = 5


class DMSCRMActivity(Document):
	def validate(self):
		if not self.assigned_to:
			self.assigned_to = frappe.session.user

		self._track_reassignment()
		self._apply_sla_breach()
		self._validate_completion()
		self._setup_recurrence()

		if self.status == "Completed" and not self.completed_on:
			self.completed_on = now_datetime()

	def _track_reassignment(self):
		if self.is_new():
			return
		if not self.has_value_changed("assigned_to"):
			return
		before = self.get_doc_before_save()
		prev = before.assigned_to if before else None
		if prev == self.assigned_to:
			return
		self.append(
			"assignment_history",
			{
				"from_user": prev,
				"to_user": self.assigned_to,
				"reassigned_by": frappe.session.user,
				"reassigned_on": now_datetime(),
				"reason": getattr(self, "_reassign_reason", None) or "Reassigned",
			},
		)

	def _apply_sla_breach(self):
		if self.status in ("Completed", "Cancelled"):
			self.sla_breached = 0
			return
		if self.due_datetime and now_datetime() > get_datetime(self.due_datetime):
			self.sla_breached = 1
		else:
			self.sla_breached = 0

	def _validate_completion(self):
		if self.status != "Completed":
			return
		# Internal notes can complete with lighter notes, still need something
		if self.activity_type != "Internal Note":
			if not self.disposition:
				frappe.throw(_("Completed activities require a disposition / outcome."))
		notes = (self.outcome_notes or "").strip()
		if len(notes) < MIN_NOTES_LEN:
			frappe.throw(
				_("Completed activities require meaningful notes (at least {0} characters).").format(
					MIN_NOTES_LEN
				)
			)

	def _setup_recurrence(self):
		if not cint(self.is_recurring):
			return
		if not self.recurrence_frequency:
			frappe.throw(_("Recurring activities require a frequency."))
		if not self.next_occurrence_on and self.due_datetime:
			self.next_occurrence_on = self._next_due_from(get_datetime(self.due_datetime))

	def _next_due_from(self, base):
		freq = self.recurrence_frequency
		if freq == "Daily":
			return add_days(base, 1)
		if freq == "Weekly":
			return add_days(base, 7)
		if freq == "Monthly":
			return add_months(base, 1)
		if freq == "Quarterly":
			return add_months(base, 3)
		return add_days(base, 7)


def spawn_recurring_occurrence(parent_name: str):
	"""Create the next open activity from a recurring parent template."""
	parent = frappe.get_doc("DMS CRM Activity", parent_name)
	if not cint(parent.is_recurring) or parent.status == "Cancelled":
		return None
	due = parent.next_occurrence_on or parent.due_datetime
	if not due:
		return None
	if parent.recurrence_end_date and get_datetime(due).date() > parent.recurrence_end_date:
		return None

	child = frappe.new_doc("DMS CRM Activity")
	for field in (
		"activity_type",
		"subject",
		"priority",
		"assigned_to",
		"lead",
		"opportunity",
		"customer",
		"case",
		"vehicle_vin",
		"job_card",
		"campaign",
		"campaign_member",
	):
		child.set(field, parent.get(field))
	child.status = "Open"
	child.due_datetime = due
	child.parent_activity = parent.name
	child.is_recurring = 0
	child.insert(ignore_permissions=True)

	parent.next_occurrence_on = parent._next_due_from(get_datetime(due))
	parent.save(ignore_permissions=True)
	return child.name
