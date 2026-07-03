# Copyright (c) 2026, Mania and contributors

import frappe
from frappe import _

from dms.utils.service_package_import import import_service_package_file_url


@frappe.whitelist()
def import_service_packages(file_url=None):
	"""Import Vehicle Service Packages from a periodic maintenance price Excel workbook."""
	frappe.only_for(("System Manager", "Dealer Manager", "Administrator"))

	file_url = (file_url or "").strip()
	if not file_url:
		frappe.throw(_("Upload an Excel file first"))

	return import_service_package_file_url(file_url)
