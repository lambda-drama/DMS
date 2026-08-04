# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, cint, flt, get_datetime, now_datetime


# Blueprint §12.3 defaults (hours) — overridden by DMS CRM Settings when present
PRIORITY_SLA_HOURS = {
	"Critical": (0.25, 4),  # 15 min / 4h
	"High": (1, 24),
	"Medium": (4, 72),
	"Low": (24, 120),
}

ESCALATION_BY_PRIORITY = {
	"Critical": "Executive",
	"High": "Director",
	"Medium": "Department Manager",
	"Low": "Team Leader",
}

# Blueprint §12 — protected cases may only be closed by these roles
PROTECTED_CLOSURE_ROLES = (
	"System Manager",
	"DMS CRM Manager",
)


def user_can_close_protected(user: str | None = None) -> bool:
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	roles = set(frappe.get_roles(user))
	return bool(roles.intersection(PROTECTED_CLOSURE_ROLES))


def case_requires_protected_escalation(doc) -> bool:
	"""Safety, accident, legal allegation, or public/media risk."""
	if cint(getattr(doc, "safety_impact", 0)):
		return True
	if cint(getattr(doc, "accident_related", 0)):
		return True
	if cint(getattr(doc, "legal_allegation", 0)):
		return True
	if cint(getattr(doc, "public_media_risk", 0)):
		return True
	if getattr(doc, "reputational_risk", None) == "High":
		return True
	if getattr(doc, "category", None) == "Safety":
		return True
	return False


def _sla_hours_from_settings(priority: str) -> tuple[float, float]:
	defaults = PRIORITY_SLA_HOURS.get(priority) or PRIORITY_SLA_HOURS["Medium"]
	try:
		s = frappe.get_cached_doc("DMS CRM Settings")
	except Exception:
		return defaults

	response = resolution = None
	if priority == "Critical":
		if cint(getattr(s, "critical_case_response_minutes", 0)):
			response = cint(s.critical_case_response_minutes) / 60.0
		if flt(getattr(s, "critical_case_resolution_hours", 0)):
			resolution = flt(s.critical_case_resolution_hours)
	elif priority == "High":
		if cint(getattr(s, "high_case_response_minutes", 0)):
			response = cint(s.high_case_response_minutes) / 60.0
		if flt(getattr(s, "high_case_resolution_hours", 0)):
			resolution = flt(s.high_case_resolution_hours)
	elif priority == "Medium":
		if flt(getattr(s, "medium_case_response_hours", 0)):
			response = flt(s.medium_case_response_hours)
		if flt(getattr(s, "medium_case_resolution_hours", 0)):
			resolution = flt(s.medium_case_resolution_hours)
	elif priority == "Low":
		if flt(getattr(s, "low_case_response_hours", 0)):
			response = flt(s.low_case_response_hours)
		if flt(getattr(s, "low_case_resolution_hours", 0)):
			resolution = flt(s.low_case_resolution_hours)

	return (
		response if response is not None else defaults[0],
		resolution if resolution is not None else defaults[1],
	)


class DMSCRMCase(Document):
	def validate(self):
		from dms.dealer_management_system.utils.branch_permissions import (
			assert_dms_branch_access,
		)
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if not self.case_owner:
			self.case_owner = frappe.session.user
		if not self.opened_on:
			self.opened_on = now_datetime()

		self._apply_protected_escalation()
		self._assert_protected_closure()
		self._enforce_next_action()
		self._set_sla_defaults()
		self._apply_breach_flags()
		self._handle_reopen()
		if cint(self.customer_accepted) and not self.customer_acceptance_on:
			self.customer_acceptance_on = now_datetime()

	def _enforce_next_action(self):
		"""§15.2 — open cases require next action unless parked / closed."""
		if self.status in ("Resolved", "Closed"):
			return
		if cint(self.parked_in_nurture):
			return
		try:
			settings = frappe.get_cached_doc("DMS CRM Settings")
			hard = cint(getattr(settings, "hard_enforce_next_action", None) or 0)
		except Exception:
			hard = 0
		if self.next_action_due and self.next_action:
			return
		msg = _("Open cases require a Next Action and Due date (unless parked in nurture).")
		if hard:
			frappe.throw(msg)
		frappe.msgprint(msg, indicator="orange", alert=True)

	def on_update(self):
		# Notify once when case newly enters protected escalation
		if not cint(self.protected_escalation):
			return
		was_protected = cint(self.get_doc_before_save().protected_escalation) if self.get_doc_before_save() else 0
		if was_protected:
			return
		self._notify_protected_escalation()

	def after_insert(self):
		if cint(self.protected_escalation):
			self._notify_protected_escalation()

	def _apply_protected_escalation(self):
		"""§12 — safety / accident / legal / public-media → protected Executive path."""
		requires = case_requires_protected_escalation(self)
		became_protected = requires and not cint(self.protected_escalation)
		self.protected_escalation = 1 if requires else 0
		if not requires:
			return

		# Force Critical + Executive escalation; ordinary users cannot dial this down
		if self.priority != "Critical":
			self.priority = "Critical"

		escalation_levels = ("None", "Team Leader", "Department Manager", "Director", "Executive")
		current = self.escalation_level or "None"
		if current not in escalation_levels or escalation_levels.index(current) < escalation_levels.index(
			"Executive"
		):
			self.escalation_level = "Executive"
			if became_protected or not self.escalated_on:
				self.escalated_on = now_datetime()

		# Ordinary users cannot reduce escalation / clear protection flags on a protected case
		if not user_can_close_protected() and not self.is_new():
			before = self.get_doc_before_save()
			if before and cint(before.protected_escalation):
				for flag in (
					"safety_impact",
					"accident_related",
					"legal_allegation",
					"public_media_risk",
				):
					if cint(getattr(before, flag, 0)) and not cint(getattr(self, flag, 0)):
						frappe.throw(
							_(
								"Protected escalation flags cannot be cleared by ordinary users. "
								"A DMS CRM Manager is required."
							)
						)
				if before.reputational_risk == "High" and self.reputational_risk != "High":
					frappe.throw(
						_(
							"Reputational risk on a protected case cannot be lowered by ordinary users."
						)
					)
				if before.escalation_level == "Executive" and self.escalation_level != "Executive":
					self.escalation_level = "Executive"

	def _assert_protected_closure(self):
		"""Protected cases must not be closed by ordinary users."""
		if self.status != "Closed":
			return
		if not cint(self.protected_escalation) and not case_requires_protected_escalation(self):
			return
		status_changed = self.is_new() or self.has_value_changed("status")
		if not status_changed:
			return
		if user_can_close_protected():
			return
		frappe.throw(
			_(
				"This case is under protected escalation (safety, accident, legal, or public-media risk). "
				"Only a DMS CRM Manager can close it."
			),
			frappe.PermissionError,
		)

	def _notify_protected_escalation(self):
		"""Create high-priority activity for manager / executive attention."""
		if not frappe.db.exists("DocType", "DMS CRM Activity"):
			return
		# Avoid duplicate flood on rapid saves
		existing = frappe.db.exists(
			"DMS CRM Activity",
			{
				"case": self.name,
				"subject": ["like", "Protected escalation:%"],
			},
		)
		if existing:
			return
		frappe.get_doc(
			{
				"doctype": "DMS CRM Activity",
				"activity_type": "Complaint Update",
				"subject": f"Protected escalation: {self.subject}",
				"status": "Open",
				"priority": "High",
				"customer": self.customer,
				"case": self.name,
				"assigned_to": self.manager or self.case_owner,
				"due_datetime": now_datetime(),
				"outcome_notes": (
					"Auto-triggered protected escalation for safety, accident, legal allegation, "
					"and/or public-media risk. Closure restricted to DMS CRM Manager."
				),
			}
		).insert(ignore_permissions=True)

	def _set_sla_defaults(self):
		# Recalc when priority changes and deadlines were auto-managed / empty
		hours = _sla_hours_from_settings(self.priority)
		base = get_datetime(self.opened_on) if self.opened_on else now_datetime()
		priority_changed = self.has_value_changed("priority") if not self.is_new() else False
		if not self.response_deadline or priority_changed:
			self.response_deadline = add_to_date(base, hours=hours[0])
		if not self.resolution_target or priority_changed:
			self.resolution_target = add_to_date(base, hours=hours[1])

	def _apply_breach_flags(self):
		if self.status in ("Resolved", "Closed"):
			return
		now = now_datetime()
		response_breached = 0
		resolution_breached = 0
		if self.response_deadline and now > get_datetime(self.response_deadline):
			if self.status in ("New",):
				response_breached = 1
		if self.resolution_target and now > get_datetime(self.resolution_target):
			resolution_breached = 1
		self.response_breached = response_breached
		self.resolution_breached = resolution_breached
		self.sla_breached = 1 if (response_breached or resolution_breached) else 0

		if (response_breached or resolution_breached) and self.escalation_level in (
			None,
			"",
			"None",
		):
			self.escalation_level = ESCALATION_BY_PRIORITY.get(self.priority) or "Team Leader"
			self.escalated_on = now

	def _handle_reopen(self):
		if self.status == "Reopened" and self.has_value_changed("status"):
			self.reopened_on = now_datetime()
			self.sla_breached = 0
			self.response_breached = 0
			self.resolution_breached = 0
			# Fresh SLA window from reopen
			hours = _sla_hours_from_settings(self.priority)
			base = now_datetime()
			self.response_deadline = add_to_date(base, hours=hours[0])
			self.resolution_target = add_to_date(base, hours=hours[1])
