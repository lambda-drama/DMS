# Copyright (c) 2026, Mania and Contributors

from unittest.mock import patch

from frappe.tests import UnitTestCase

from dms.overrides.account_tree import _as_bool, coerce_company, get_children


class TestCoerceCompany(UnitTestCase):
	def test_keeps_a_real_company_string(self):
		self.assertEqual(coerce_company("Suweys Motors"), "Suweys Motors")

	def test_strips_whitespace(self):
		self.assertEqual(coerce_company("  Suweys Motors  "), "Suweys Motors")

	def test_none_returns_a_string(self):
		value = coerce_company(None)
		self.assertIsInstance(value, str)


class TestTreeFlags(UnitTestCase):
	def test_form_string_true_is_root(self):
		self.assertIs(_as_bool("true"), True)
		self.assertIs(_as_bool("false"), False)
		self.assertIs(_as_bool(True), True)
		self.assertIs(_as_bool(0), False)

	def test_get_children_passes_real_bools(self):
		with patch("erpnext.accounts.utils._dms_original_get_children", return_value=[]) as original:
			get_children(
				"Account",
				"CityWalk",
				"CityWalk",
				is_root="true",
				include_disabled="false",
			)
		original.assert_called_once_with(
			"Account",
			"CityWalk",
			"CityWalk",
			is_root=True,
			include_disabled=False,
		)
