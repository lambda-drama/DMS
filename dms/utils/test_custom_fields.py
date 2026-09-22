# Copyright (c) 2026, Mania and Contributors

"""Guards for DMS runtime Custom Fields.

Creating a Custom Field needs permissions shop-floor users do not have. The lazy
ensure helpers must therefore never raise for them, or merely opening a screen
fails with *"User … does not have doctype access via role permission for document
Custom Field"*.
"""

from unittest.mock import patch

import frappe
from frappe.tests import UnitTestCase

from dms.utils.custom_fields import custom_field_exists, ensure_custom_fields

FIELD = {
	"Sales Order": [
		{"fieldname": "custom_dms_test_flag", "label": "Test Flag", "fieldtype": "Check"}
	]
}


class TestCustomFieldHelpers(UnitTestCase):
	def test_custom_field_exists_filters_by_doctype_and_fieldname(self):
		with patch("frappe.db.exists", return_value=True) as exists:
			self.assertTrue(custom_field_exists("Sales Order", "custom_dms_order"))
		exists.assert_called_once_with(
			"Custom Field", {"dt": "Sales Order", "fieldname": "custom_dms_order"}
		)

	def test_ensure_custom_fields_skips_without_create_permission(self):
		with (
			patch("frappe.has_permission", return_value=False),
			patch(
				"frappe.custom.doctype.custom_field.custom_field.create_custom_fields"
			) as create,
		):
			self.assertFalse(ensure_custom_fields(FIELD))
		create.assert_not_called()

	def test_ensure_custom_fields_creates_with_ignore_permissions(self):
		flags = frappe._dict()
		with (
			patch("frappe.has_permission", return_value=True),
			patch("frappe.flags", flags),
			patch(
				"frappe.custom.doctype.custom_field.custom_field.create_custom_fields"
			) as create,
		):
			self.assertTrue(ensure_custom_fields(FIELD, update=False, ignore_validate=False))

		create.assert_called_once_with(FIELD, ignore_validate=False, update=False)
		# The app-managed field write is done with elevated rights, and the previous
		# flag value is restored for the caller.
		self.assertFalse(flags.get("ignore_permissions"))

	def test_ensure_custom_fields_restores_previous_ignore_permissions(self):
		flags = frappe._dict(ignore_permissions=True)
		with (
			patch("frappe.has_permission", return_value=True),
			patch("frappe.flags", flags),
			patch("frappe.custom.doctype.custom_field.custom_field.create_custom_fields"),
		):
			ensure_custom_fields(FIELD)
		self.assertTrue(flags.get("ignore_permissions"))
