"""Set default flags on existing DMS templates when none is marked default."""

import frappe


DEFAULTS = {
	"QC Checklist Template": "Standard Service QC",
	"Road Test Template": "Standard Post-Repair Road Test",
	"Diagnosis Template": None,
	"Delivery Checklist Template": "Standard Vehicle Delivery",
}


def execute():
	for doctype, preferred in DEFAULTS.items():
		if not frappe.db.table_exists(f"tab{doctype}"):
			continue
		if not frappe.get_meta(doctype).has_field("is_default"):
			continue
		if frappe.db.exists(doctype, {"is_default": 1, "is_active": 1}):
			continue

		name = None
		if preferred and frappe.db.exists(doctype, preferred):
			name = preferred
		else:
			rows = frappe.get_all(
				doctype,
				filters={"is_active": 1} if frappe.get_meta(doctype).has_field("is_active") else {},
				fields=["name"],
				order_by="creation asc",
				limit=1,
			)
			name = rows[0].name if rows else None

		if not name:
			continue

		frappe.db.set_value(doctype, name, "is_default", 1, update_modified=False)

	frappe.db.commit()
