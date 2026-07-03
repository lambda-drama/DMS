# Copyright (c) 2026, Mania and contributors

import frappe
from frappe import _

from dms.utils.frt_sheet_import import DEFAULT_BRAND, import_frt_file_url


@frappe.whitelist()
def import_frt_sheet(file_url=None, brand=None):
	"""Import Vehicle Models and Vehicle Service Items from an uploaded FRT Excel workbook."""
	frappe.only_for(("System Manager", "Dealer Manager", "Administrator"))

	file_url = (file_url or "").strip()
	if not file_url:
		frappe.throw(_("Upload an Excel file first"))

	brand = (brand or DEFAULT_BRAND).strip() or DEFAULT_BRAND
	return import_frt_file_url(file_url, brand=brand)
