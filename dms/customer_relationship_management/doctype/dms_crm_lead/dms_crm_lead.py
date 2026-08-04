# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, cint, flt, get_datetime, now_datetime

from dms.crm_api.assignment import apply_round_robin, mark_accepted, _notify_assignment


CLOSED_STATUSES = ("Converted", "Disqualified", "Duplicate", "Invalid", "Nurture")
RESPONDED_STATUSES = ("Contact Attempted", "Contacted", "Qualified", "Converted")
ACCEPTED_STATUSES = RESPONDED_STATUSES

# Source → default assigned team (blueprint §5.3)
SOURCE_TEAM_MAP = {
	"Website Form": "Digital Sales",
	"WhatsApp": "Digital Sales",
	"Facebook": "Digital Sales",
	"Instagram": "Digital Sales",
	"TikTok": "Digital Sales",
	"LinkedIn": "Digital Sales",
	"Email": "Digital Sales",
	"Auto Marketplace": "Digital Sales",
	"Corporate Tender": "Fleet / Tender",
	"Government Inquiry": "Government Accounts",
	"Fleet Prospecting": "Fleet / Tender",
	"Service Upgrade": "Aftersales Upgrade",
	"Showroom Walk-in": "Showroom Sales",
	"Phone Call": "Showroom Sales",
	"Roadshow": "Showroom Sales",
	"Owner Event": "Showroom Sales",
	"Referral": "Relationship Owner",
	"Campaign Upload": "Digital Sales",
}


def _get_settings():
	try:
		return frappe.get_cached_doc("DMS CRM Settings")
	except Exception:
		return None


def _response_minutes(priority: str | None) -> int:
	settings = _get_settings()
	priority = priority or "Standard"
	if priority == "Hot":
		return cint(getattr(settings, "hot_response_minutes", None) or 10)
	if priority == "Warm":
		return cint(getattr(settings, "warm_response_minutes", None) or 30)
	if priority == "Fleet / Tender":
		return cint(getattr(settings, "fleet_response_minutes", None) or 30)
	hours = cint(getattr(settings, "standard_response_hours", None) or 2)
	return max(hours, 1) * 60


class DMSCRMLead(Document):
	def before_insert(self):
		if not self.sla_creation:
			self.sla_creation = now_datetime()
		self._apply_source_team()
		self._assign_owner_on_create()
		self._set_sla()

	def after_insert(self):
		if self.assignment_method == "Round Robin" and self.lead_owner:
			_notify_assignment(self, reason="round_robin_create")

	def validate(self):
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)
		from dms.dealer_management_system.utils.branch_permissions import (
			assert_dms_branch_access,
		)

		assert_dms_company_access(self.company)
		assert_dms_branch_access(self.branch, company=self.company)

		if not self.lead_name:
			parts = [self.first_name, self.last_name]
			name = " ".join(p for p in parts if p).strip()
			self.lead_name = name or self.organization_name or self.mobile_no or "Lead"

		if not self.assigned_team:
			self._apply_source_team()

		self._set_company_currency()
		self._handle_acceptance()
		self._stamp_manual_assignment()
		self._stamp_consent()
		self._mark_first_response()
		self._set_sla()
		self._calculate_item_totals()
		self._enforce_next_action()

	def _assign_owner_on_create(self):
		"""Round-robin only when enabled; otherwise leave assignment manual."""
		manual_owner = bool(self.lead_owner) and not self.flags.get("from_assignment")
		if manual_owner:
			self._skip_round_robin = True
			self.assignment_method = self.assignment_method or "Manual"
			self.assigned_on = self.assigned_on or now_datetime()
			return

		# apply_round_robin checks activate_round_robin_assignment.
		# If disabled (or no matching pool exists), keep the lead unassigned so
		# a user can assign it manually.
		apply_round_robin(self)

	def _stamp_manual_assignment(self):
		if self.flags.get("from_assignment") or self.is_new():
			return
		if self.has_value_changed("lead_owner") and self.lead_owner:
			self.assignment_method = "Manual"
			self.assignment_pool = None
			self.assigned_on = now_datetime()
			self.accepted_on = None

	def _handle_acceptance(self):
		"""Accept when status moves past Assigned, or explicit accepted_on."""
		if self.accepted_on:
			return
		if self.status in ACCEPTED_STATUSES:
			mark_accepted(self)
			return
		# Owner explicitly accepting while still Assigned is done via API (accepted_on set)

	def _apply_source_team(self):
		if self.assigned_team or not self.source:
			return
		self.assigned_team = SOURCE_TEAM_MAP.get(self.source) or ""

	def _set_company_currency(self):
		if not self.currency and self.company:
			self.currency = frappe.db.get_value("Company", self.company, "default_currency")

	def _stamp_consent(self):
		if not (self.consent_marketing or self.consent_channel):
			return
		if self.has_value_changed("consent_marketing") or self.has_value_changed("consent_channel"):
			self.consent_timestamp = now_datetime()
			if not self.consent_source:
				self.consent_source = self.source or "Manual"

	def _mark_first_response(self):
		if self.first_responded_on:
			return
		if self.status in RESPONDED_STATUSES:
			self.first_responded_on = now_datetime()
			self.sla_status = "First Response Completed"

	def _set_sla(self):
		"""Start / refresh response SLA from priority + settings (blueprint §5.4)."""
		if self.status in CLOSED_STATUSES:
			return

		if not self.sla_creation:
			self.sla_creation = self.creation or now_datetime()

		if self.first_responded_on:
			self.sla_status = "First Response Completed"
			return

		minutes = _response_minutes(self.priority)
		started = get_datetime(self.sla_creation)
		self.response_by = add_to_date(started, minutes=minutes)

		now = now_datetime()
		if self.response_by and now > get_datetime(self.response_by):
			self.sla_status = "First Response Exceeded"
		else:
			self.sla_status = "First Response Due"

	def _calculate_item_totals(self):
		"""Calculate the lead's product values like Frappe CRM Products."""
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

	def _enforce_next_action(self):
		if self.status in CLOSED_STATUSES or self.status == "New":
			return
		settings = _get_settings()
		require = cint(getattr(settings, "require_next_action_on_lead", None) or 1)
		if not require:
			return
		if self.next_action_due and self.next_action:
			return
		hard = cint(getattr(settings, "hard_enforce_next_action", None) or 0)
		msg = _("Open leads require a Next Action and Due date (unless New / closed).")
		if hard:
			frappe.throw(msg)
		frappe.msgprint(msg, indicator="orange", alert=True)
