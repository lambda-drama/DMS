"""Put exactly two icons in the DMS folder popup: Dealer Management + DMS CRM.

Frappe folder modals list Desktop Icons whose parent_icon is the folder label.
Desktop Icon label must equal a Workspace Sidebar title for routing to work.
The sidebar's first Link must point at an existing Workspace (or DocType) or the
desktop shows: "Icon is not correctly configured…".
"""

from __future__ import annotations

import os

import frappe
from frappe.desk.doctype.desktop_icon.desktop_icon import clear_desktop_icons_cache
from frappe.modules.import_file import import_file_by_path


def _import_workspace(rel_parts: tuple[str, ...]) -> bool:
	path = frappe.get_app_path("dms", *rel_parts)
	if not os.path.exists(path):
		return False
	import_file_by_path(path, force=True, reset_permissions=True)
	return True


def _ensure_workspace_doc(label: str, module: str, icon: str):
	"""Create a minimal public Workspace when fixture import failed / was deleted."""
	if frappe.db.exists("Workspace", label):
		return
	doc = frappe.new_doc("Workspace")
	doc.label = label
	doc.title = label
	doc.module = module
	doc.app = "dms"
	doc.public = 1
	doc.is_hidden = 0
	doc.icon = icon
	doc.content = (
		'[{"id":"hdr","type":"header","data":{"text":"<span class=\\"h4\\"><b>'
		+ frappe.as_unicode(label)
		+ '</b></span>","col":12}}]'
	)
	doc.insert(ignore_permissions=True)


def _ensure_workspaces():
	_import_workspace(
		(
			"dealer_management_system",
			"workspace",
			"dealer_management",
			"dealer_management.json",
		)
	)
	_import_workspace(
		(
			"customer_relationship_management",
			"workspace",
			"dms_crm",
			"dms_crm.json",
		)
	)
	_ensure_workspace_doc("Dealer Management", "Dealer Management System", "tool")
	_ensure_workspace_doc("DMS CRM", "Customer Relationship Management", "users")
	missing = [
		name
		for name in ("Dealer Management", "DMS CRM")
		if not frappe.db.exists("Workspace", name)
	]
	if missing:
		frappe.throw(f"Missing DMS workspaces: {', '.join(missing)}")


def _ensure_sidebar(title: str, workspace: str, module: str, header_icon: str, extra_links: tuple):
	if frappe.db.exists("Workspace Sidebar", title):
		doc = frappe.get_doc("Workspace Sidebar", title)
	else:
		doc = frappe.new_doc("Workspace Sidebar")
		doc.title = title
	doc.header_icon = header_icon
	doc.module = module
	doc.set("items", [])
	doc.append(
		"items",
		{
			"label": "Home",
			"type": "Link",
			"link_type": "Workspace",
			"link_to": workspace,
		},
	)
	for row in extra_links:
		if row["link_type"] == "DocType" and not frappe.db.exists("DocType", row["link_to"]):
			continue
		doc.append(
			"items",
			{
				"label": row["label"],
				"type": "Link",
				"link_type": row["link_type"],
				"link_to": row["link_to"],
			},
		)
	doc.save(ignore_permissions=True)


def _upsert_icon(**fields):
	label = fields["label"]
	if frappe.db.exists("Desktop Icon", label):
		doc = frappe.get_doc("Desktop Icon", label)
	else:
		doc = frappe.new_doc("Desktop Icon")
		doc.label = label
	for key, value in fields.items():
		doc.set(key, value)
	doc.save(ignore_permissions=True)
	return doc


def execute():
	_ensure_workspaces()

	_ensure_sidebar(
		"Dealer Management",
		"Dealer Management",
		"Dealer Management System",
		"tool",
		(
			{"label": "DMS Job Card", "link_type": "DocType", "link_to": "DMS Job Card"},
			{"label": "Service Appointment", "link_type": "DocType", "link_to": "Service Appointment"},
			{"label": "Vehicle Inspection", "link_type": "DocType", "link_to": "Vehicle Inspection"},
			{"label": "Vehicle Delivery Note", "link_type": "DocType", "link_to": "Vehicle Delivery Note"},
		),
	)
	_ensure_sidebar(
		"DMS CRM",
		"DMS CRM",
		"Customer Relationship Management",
		"users",
		(
			{"label": "DMS CRM Lead", "link_type": "DocType", "link_to": "DMS CRM Lead"},
			{"label": "DMS CRM Opportunity", "link_type": "DocType", "link_to": "DMS CRM Opportunity"},
			{"label": "DMS CRM Case", "link_type": "DocType", "link_to": "DMS CRM Case"},
		),
	)
	# Keep Aftersales sidebar for any leftover icon links, but Home still works.
	_ensure_sidebar(
		"DMS Aftersales",
		"Dealer Management",
		"Dealer Management System",
		"tool",
		(
			{"label": "DMS Job Card", "link_type": "DocType", "link_to": "DMS Job Card"},
			{"label": "Service Appointment", "link_type": "DocType", "link_to": "Service Appointment"},
			{"label": "Vehicle Inspection", "link_type": "DocType", "link_to": "Vehicle Inspection"},
			{"label": "Vehicle Delivery Note", "link_type": "DocType", "link_to": "Vehicle Delivery Note"},
		),
	)

	# Parent folder
	_upsert_icon(
		label="DMS",
		icon_type="Folder",
		link_type="Workspace Sidebar",
		link_to="",
		parent_icon="",
		app="dms",
		logo_url="/assets/dms/image/suwey_logo.png",
		icon="organization",
		hidden=0,
		standard=1,
		idx=0,
	)

	# Exactly two children in the DMS sub-popup
	_upsert_icon(
		label="Dealer Management",
		icon_type="Link",
		link_type="Workspace Sidebar",
		link_to="Dealer Management",
		parent_icon="DMS",
		app="dms",
		logo_url="/assets/dms/image/suwey_logo.png",
		icon="tool",
		hidden=0,
		standard=1,
		idx=1,
	)

	_upsert_icon(
		label="DMS CRM",
		icon_type="Link",
		link_type="Workspace Sidebar",
		link_to="DMS CRM",
		parent_icon="DMS",
		app="dms",
		logo_url="/assets/dms/image/dms_crm_icon.svg",
		icon="users",
		link="",
		hidden=0,
		standard=1,
		idx=2,
	)

	# Hide the intermediate Aftersales icon so the popup stays at two entries.
	if frappe.db.exists("Desktop Icon", "DMS Aftersales"):
		frappe.db.set_value(
			"Desktop Icon",
			"DMS Aftersales",
			{"hidden": 1, "parent_icon": "", "app": "dms"},
		)

	clear_desktop_icons_cache()
	try:
		frappe.cache.delete_keys("desktop_icons")
		frappe.cache.delete_keys("bootinfo")
	except Exception:
		pass
	frappe.clear_cache(doctype="Desktop Icon")
	frappe.clear_cache(doctype="Workspace")
	frappe.clear_cache(doctype="Workspace Sidebar")
	frappe.clear_cache()
