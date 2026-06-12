# Copyright (c) 2026, Mania and contributors
from frappe.model.document import Document

from dms.dealer_management_system.utils.template_defaults import enforce_single_default


class DeliveryChecklistTemplate(Document):
	def validate(self):
		enforce_single_default(self, "Delivery Checklist Template")
