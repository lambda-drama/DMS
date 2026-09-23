# Copyright (c) 2026, Mania and contributors
"""Desk home: swap the Suweys photo on the DMS desktop icons for DMS icon graphics.

The DMS tile (and the Dealer Management / DMS CRM tiles it opens) used to render
``/assets/dms/image/suwey_logo.png``. They now use clean SVG icon tiles, the same
style as the ZATCA app's home icon.
"""

from __future__ import annotations

import frappe
from frappe.desk.doctype.desktop_icon.desktop_icon import clear_desktop_icons_cache

DMS_ICON = "/assets/dms/image/dms_icon.svg"
DEALER_ICON = "/assets/dms/image/dealer_management_icon.svg"
CRM_ICON = "/assets/dms/image/dms_crm_icon.svg"

ICON_BY_LABEL = {
	"DMS": DMS_ICON,
	"Dealer Management": DEALER_ICON,
	"DMS Aftersales": DEALER_ICON,
	"DMS CRM": CRM_ICON,
}


def execute():
	for label, logo_url in ICON_BY_LABEL.items():
		if not frappe.db.exists("Desktop Icon", label):
			continue
		frappe.db.set_value("Desktop Icon", label, "logo_url", logo_url, update_modified=False)

	clear_desktop_icons_cache()
	try:
		frappe.cache.delete_keys("desktop_icons")
		frappe.cache.delete_keys("bootinfo")
	except Exception:
		pass
	frappe.clear_cache(doctype="Desktop Icon")
	frappe.clear_cache()
