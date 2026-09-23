# Copyright (c) 2026, Mania and contributors
"""Desk home tile for this app must read "DMS", not "Dealer Management System".

``app_title`` is now "DMS" (hooks.py), so Frappe no longer auto-creates an *App*
desktop icon labelled "Dealer Management System". This patch removes the leftover
one, leaving the "DMS" folder icon (which opens Dealer Management / DMS CRM) as the
only DMS tile on the Desk home.

The *module* is still called "Dealer Management System" — that is unrelated and is
left untouched.
"""

from __future__ import annotations

import frappe
from frappe.desk.doctype.desktop_icon.desktop_icon import clear_desktop_icons_cache

OLD_APP_ICON_LABEL = "Dealer Management System"


def execute():
	if frappe.db.exists("Desktop Icon", OLD_APP_ICON_LABEL):
		frappe.delete_doc("Desktop Icon", OLD_APP_ICON_LABEL, ignore_permissions=True, force=True)

	clear_desktop_icons_cache()
	try:
		frappe.cache.delete_keys("desktop_icons")
		frappe.cache.delete_keys("bootinfo")
	except Exception:
		pass
	frappe.clear_cache(doctype="Desktop Icon")
	frappe.clear_cache()
