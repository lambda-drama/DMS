"""Add §11 Call Center fields onto DMS CRM Call Log (owned by crm app)."""

from __future__ import annotations

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	if not frappe.db.exists("DocType", "DMS CRM Call Log"):
		return

	create_custom_fields(
		{
			"DMS CRM Call Log": [
				{
					"fieldname": "custom_crm_section",
					"label": "CRM Call Center",
					"fieldtype": "Section Break",
					"insert_after": "note",
				},
				{
					"fieldname": "custom_queue",
					"label": "Queue",
					"fieldtype": "Select",
					"options": "\nInbound\nNew Leads\nCallbacks\nService Reminders\nLapsed Customers\nSurveys\nComplaints",
					"insert_after": "custom_crm_section",
					"in_standard_filter": 1,
					"in_list_view": 1,
				},
				{
					"fieldname": "custom_disposition",
					"label": "Disposition",
					"fieldtype": "Select",
					"options": "\nReached\nNo Answer\nBusy\nInvalid Number\nCallback\nAppointment\nInterested\nDeclined\nComplaint\nDo Not Contact",
					"insert_after": "custom_queue",
					"in_standard_filter": 1,
					"in_list_view": 1,
				},
				{
					"fieldname": "custom_customer",
					"label": "Customer",
					"fieldtype": "Link",
					"options": "Customer",
					"insert_after": "custom_disposition",
				},
				{
					"fieldname": "custom_column_break_cc",
					"fieldtype": "Column Break",
					"insert_after": "custom_customer",
				},
				{
					"fieldname": "custom_callback_datetime",
					"label": "Callback Date/Time",
					"fieldtype": "Datetime",
					"insert_after": "custom_column_break_cc",
					"depends_on": "eval:doc.custom_disposition=='Callback'",
					"mandatory_depends_on": "eval:doc.custom_disposition=='Callback'",
				},
				{
					"fieldname": "custom_callback_owner",
					"label": "Callback Owner",
					"fieldtype": "Link",
					"options": "User",
					"insert_after": "custom_callback_datetime",
					"depends_on": "eval:doc.custom_disposition=='Callback'",
					"mandatory_depends_on": "eval:doc.custom_disposition=='Callback'",
				},
				{
					"fieldname": "custom_call_script",
					"label": "Call Script",
					"fieldtype": "Link",
					"options": "DMS CRM Call Script",
					"insert_after": "custom_callback_owner",
				},
				{
					"fieldname": "custom_campaign",
					"label": "Campaign",
					"fieldtype": "Link",
					"options": "Campaign",
					"insert_after": "custom_call_script",
				},
				{
					"fieldname": "custom_activity",
					"label": "Linked Activity",
					"fieldtype": "Link",
					"options": "DMS CRM Activity",
					"insert_after": "custom_campaign",
					"read_only": 1,
				},
			]
		},
		ignore_validate=True,
		update=True,
	)
