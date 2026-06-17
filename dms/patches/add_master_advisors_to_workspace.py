"""Add Parts Advisor to Dealer Management workspace Master section."""

import frappe
from frappe.modules.import_file import import_file_by_path


def execute():
	path = frappe.get_app_path(
		"dms",
		"dealer_management_system",
		"workspace",
		"dealer_management",
		"dealer_management.json",
	)
	import_file_by_path(path, force=True, reset_permissions=True)
	frappe.clear_cache(doctype="Workspace")
