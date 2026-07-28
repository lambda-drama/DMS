"""Restore DMS parent desktop folder with Aftersales + CRM children (workspaces)."""

from __future__ import annotations

import os

import frappe
from frappe.desk.doctype.desktop_icon.desktop_icon import clear_desktop_icons_cache
from frappe.modules.import_file import import_file_by_path


def _ensure_workspace_sidebar(title: str, workspace: str, module: str | None = None):
	if frappe.db.exists("Workspace Sidebar", title):
		doc = frappe.get_doc("Workspace Sidebar", title)
	else:
		doc = frappe.new_doc("Workspace Sidebar")
		doc.title = title
	doc.header_icon = doc.header_icon or "users"
	if module:
		doc.module = module
	# Ensure home link to workspace
	has_home = any(
		(row.link_type == "Workspace" and row.link_to == workspace) for row in (doc.items or [])
	)
	if not has_home:
		doc.append(
			"items",
			{
				"label": "Home",
				"type": "Link",
				"link_type": "Workspace",
				"link_to": workspace,
			},
		)
	doc.save(ignore_permissions=True)


def _upsert_desktop_icon(**fields):
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
	# Import CRM workspace definition
	crm_ws_path = frappe.get_app_path(
		"dms",
		"customer_relationship_management",
		"workspace",
		"dms_crm",
		"dms_crm.json",
	)
	if os.path.exists(crm_ws_path):
		import_file_by_path(crm_ws_path, force=True, reset_permissions=True)

	# Refresh Dealer Management workspace (Open UI link)
	dms_ws_path = frappe.get_app_path(
		"dms",
		"dealer_management_system",
		"workspace",
		"dealer_management",
		"dealer_management.json",
	)
	if os.path.exists(dms_ws_path):
		import_file_by_path(dms_ws_path, force=True, reset_permissions=True)

	_ensure_workspace_sidebar("Dealer Management", "Dealer Management", "Dealer Management System")
	_ensure_workspace_sidebar("DMS CRM", "DMS CRM", "Customer Relationship Management")

	# Parent folder — click opens chooser (DMS + DMS CRM), not a direct UI jump
	_upsert_desktop_icon(
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

	# Child labels must differ from parent (Desktop Icon label is unique).
	# Shown inside the DMS folder modal → each opens a workspace with an Open UI link.
	_upsert_desktop_icon(
		label="DMS Aftersales",
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

	_upsert_desktop_icon(
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

	# Avoid duplicate / orphaned icons from earlier sync
	if frappe.db.exists("Desktop Icon", "Dealer Management"):
		frappe.db.set_value(
			"Desktop Icon",
			"Dealer Management",
			{
				"parent_icon": "DMS",
				"hidden": 1,
			},
		)

	# Clear any App-type DMS CRM that jumped straight into the UI
	frappe.db.sql(
		"""
		UPDATE `tabDesktop Icon`
		SET icon_type='Link', parent_icon='DMS', link=NULL,
			link_type='Workspace Sidebar', link_to='DMS CRM', hidden=0
		WHERE name='DMS CRM'
		"""
	)

	clear_desktop_icons_cache()
	# Drop cached icons for all users so the folder chooser appears immediately
	try:
		frappe.cache.delete_keys("desktop_icons")
	except Exception:
		pass
	frappe.clear_cache(doctype="Desktop Icon")
	frappe.clear_cache(doctype="Workspace")
	frappe.clear_cache(doctype="Workspace Sidebar")
