# Copyright (c) 2026, Mania and Contributors

from frappe.tests import UnitTestCase

from dms.overrides.account_tree import coerce_company


class TestCoerceCompany(UnitTestCase):
	def test_keeps_a_real_company_string(self):
		self.assertEqual(coerce_company("Suweys Motors"), "Suweys Motors")

	def test_strips_whitespace(self):
		self.assertEqual(coerce_company("  Suweys Motors  "), "Suweys Motors")

	def test_none_returns_a_string(self):
		value = coerce_company(None)
		self.assertIsInstance(value, str)
