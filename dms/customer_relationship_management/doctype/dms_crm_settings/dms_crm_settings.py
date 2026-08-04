# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

from frappe.model.document import Document

# Blueprint §10.3 defaults — editable in DMS CRM Settings
DEFAULT_REMINDER_SEQUENCE = (
	{
		"step_key": "t-30",
		"label": "30 days before due",
		"days_offset": -30,
		"channel": "WhatsApp",
		"priority": "Medium",
		"create_activity": 1,
		"activity_type": "Service Reminder",
		"human_action": "Call center queue for high-value or fleet customers",
		"enabled": 1,
	},
	{
		"step_key": "t-14",
		"label": "14 days before due",
		"days_offset": -14,
		"channel": "SMS",
		"priority": "Medium",
		"create_activity": 1,
		"activity_type": "Service Reminder",
		"human_action": "Agent call if no response",
		"enabled": 1,
	},
	{
		"step_key": "t-7",
		"label": "7 days before due",
		"days_offset": -7,
		"channel": "WhatsApp",
		"priority": "High",
		"create_activity": 1,
		"activity_type": "Service Reminder",
		"human_action": "Offer available slots",
		"enabled": 1,
	},
	{
		"step_key": "due",
		"label": "Due date",
		"days_offset": 0,
		"channel": "Call",
		"priority": "High",
		"create_activity": 1,
		"activity_type": "Call",
		"human_action": "Priority call queue",
		"enabled": 1,
	},
	{
		"step_key": "overdue-7",
		"label": "7 days overdue",
		"days_offset": 7,
		"channel": "Call",
		"priority": "Urgent",
		"create_activity": 1,
		"activity_type": "Call",
		"human_action": "Call and disposition",
		"enabled": 1,
	},
	{
		"step_key": "overdue-30",
		"label": "30 days overdue",
		"days_offset": 30,
		"channel": "Email",
		"priority": "Urgent",
		"create_activity": 1,
		"activity_type": "Service Reminder",
		"human_action": "Retention campaign / advisor escalation",
		"enabled": 1,
	},
	{
		"step_key": "lapsed-90",
		"label": "90+ days overdue",
		"days_offset": 90,
		"channel": "Call",
		"priority": "Urgent",
		"create_activity": 1,
		"activity_type": "Survey",
		"human_action": "Lapsed-customer recovery: reason survey and tailored offer",
		"enabled": 1,
	},
)


class DMSCRMSettings(Document):
	def validate(self):
		from dms.dealer_management_system.utils.company_permissions import (
			assert_dms_company_access,
		)

		assert_dms_company_access(self.default_company)
		self._seed_reminder_sequence()

	def _seed_reminder_sequence(self):
		if self.get("service_reminder_sequence"):
			return
		for row in DEFAULT_REMINDER_SEQUENCE:
			self.append("service_reminder_sequence", row)
