import frappe

from dms.dealer_management_system.doctype.vehicle_labour_item.vehicle_labour_item import (
	LABOUR_DISPLAY_NAME_FIELD,
	ensure_labour_display_name_field,
)


def execute():
	"""Add line-only Display Name without editing Vehicle Labour Item JSON."""
	ensure_labour_display_name_field()

	table = "tabVehicle Labour Item"
	if not frappe.db.has_column("Vehicle Labour Item", "display_name"):
		return
	if not frappe.db.has_column("Vehicle Labour Item", LABOUR_DISPLAY_NAME_FIELD):
		return

	frappe.db.sql(
		f"""
		UPDATE `{table}`
		SET `{LABOUR_DISPLAY_NAME_FIELD}` = `display_name`
		WHERE ifnull(`{LABOUR_DISPLAY_NAME_FIELD}`, '') = ''
			AND ifnull(`display_name`, '') != ''
		"""
	)
