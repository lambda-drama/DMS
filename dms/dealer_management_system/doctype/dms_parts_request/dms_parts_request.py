# Copyright (c) 2026, Mania and contributors

import frappe
from frappe.model.document import Document


class DMSPartsRequest(Document):
	def validate(self):
		from dms.dealer_management_system.doctype.dms_parts_request.parts_workflow import (
			refresh_parts_request_stock,
		)

		refresh_parts_request_stock(self)
