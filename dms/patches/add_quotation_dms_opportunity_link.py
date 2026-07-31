import frappe


def execute():
	"""Ensure Quotation links back to DMS CRM Opportunity."""
	if frappe.db.exists("Custom Field", {"dt": "Quotation", "fieldname": "custom_dms_crm_opportunity"}):
		return
	from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

	create_custom_fields(
		{
			"Quotation": [
				{
					"fieldname": "custom_dms_crm_opportunity",
					"label": "DMS CRM Opportunity",
					"fieldtype": "Link",
					"options": "DMS CRM Opportunity",
					"insert_after": "opportunity",
					"read_only": 1,
					"print_hide": 1,
				}
			]
		},
		ignore_validate=True,
		update=True,
	)
