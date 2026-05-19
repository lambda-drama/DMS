# Copyright (c) 2026, Mania and contributors

import frappe
from frappe.utils import nowdate


def execute():
	"""Move existing VIN current_customer into customer_history child rows."""
	if not frappe.db.table_exists("tabVIN Customer History"):
		return

	for row in frappe.get_all(
		"VIN No",
		filters={"current_customer": ["is", "set"]},
		fields=["name", "current_customer", "delivery_date"],
	):
		if frappe.db.exists(
			"VIN Customer History",
			{"parent": row.name, "parenttype": "VIN No", "customer": row.current_customer},
		):
			continue

		snap = frappe.db.get_value(
			"Customer",
			row.current_customer,
			["customer_name", "mobile_no", "email_id", "tax_id"],
			as_dict=True,
		) or {}

		doc = frappe.get_doc("VIN No", row.name)
		doc.append(
			"customer_history",
			{
				"customer": row.current_customer,
				"customer_name": snap.get("customer_name"),
				"mobile_no": snap.get("mobile_no"),
				"email_id": snap.get("email_id"),
				"tax_id": snap.get("tax_id"),
				"relationship": "Owner",
				"from_date": row.delivery_date or nowdate(),
				"is_current": 1,
			},
		)
		doc.save(ignore_permissions=True)

	frappe.db.commit()
