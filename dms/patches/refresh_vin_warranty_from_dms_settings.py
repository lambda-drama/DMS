# Copyright (c) 2026, Mania and contributors

import frappe

from dms.utils.warranty import apply_dms_warranty_schedule


def execute():
	"""Recalculate warranty dates/status on all VINs from DMS Settings + sale date."""
	for name in frappe.get_all("VIN No", pluck="name"):
		try:
			apply_dms_warranty_schedule(name, persist=True)
		except Exception:
			frappe.log_error(
				title="VIN warranty refresh failed",
				message=frappe.get_traceback(),
			)
	frappe.db.commit()
