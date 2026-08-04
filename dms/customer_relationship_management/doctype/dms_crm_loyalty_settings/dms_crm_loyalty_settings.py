# Copyright (c) 2026, Mania and contributors
from frappe.model.document import Document


class DMSCRMLoyaltySettings(Document):
	def validate(self):
		# Seed default retail tiers once if empty
		if not self.tiers:
			for tier, ltv, visits in (
				("Bronze", 1, 1),
				("Silver", 5000, 2),
				("Gold", 20000, 5),
				("Platinum", 50000, 10),
			):
				self.append(
					"tiers",
					{
						"tier_name": tier,
						"min_lifetime_value": ltv,
						"min_service_visits": visits,
						"program_scope": "Both",
						"service_discount_pct": {"Bronze": 0, "Silver": 5, "Gold": 10, "Platinum": 15}[tier],
						"priority_booking": 1 if tier in ("Gold", "Platinum") else 0,
						"event_access": 1 if tier == "Platinum" else 0,
						"referral_bonus_points": {"Bronze": 50, "Silver": 75, "Gold": 100, "Platinum": 150}[tier],
					},
				)
