# Copyright (c) 2026, Mania and Contributors

"""Unit tests for per-line (labour / parts) discounts on job cards and estimates."""

from types import SimpleNamespace

from frappe.tests import UnitTestCase

from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
	apply_line_discount,
	apply_line_discount_from_payload,
	doc_line_discount_total,
	line_discount_amount,
	line_effective_rate,
	line_net_amount,
)


class TestJobCardDiscount(UnitTestCase):
	def test_percentage_line_discount(self):
		self.assertEqual(line_discount_amount(1000, "Percentage", 10), 100.0)
		self.assertEqual(line_net_amount(1000, "Percentage", 10), 900.0)

	def test_amount_line_discount_cannot_exceed_the_line(self):
		self.assertEqual(line_discount_amount(300, "Amount", 5000), 300.0)
		self.assertEqual(line_net_amount(300, "Amount", 5000), 0.0)

	def test_blank_line_discount_leaves_amount_untouched(self):
		self.assertEqual(line_discount_amount(750, "", 25), 0.0)
		self.assertEqual(line_net_amount(750, None, 25), 750.0)

	def test_line_effective_rate_bills_the_discounted_unit_rate(self):
		# 5h x 200 = 1000, 10% off -> 180/h
		self.assertEqual(line_effective_rate(200, 5, "Percentage", 10), 180.0)
		# 5 x 100 = 500 less 50 -> 90/h
		self.assertEqual(line_effective_rate(100, 5, "Amount", 50), 90.0)

	def test_line_effective_rate_with_zero_qty_returns_base(self):
		self.assertEqual(line_effective_rate(100, 0, "Percentage", 10), 100.0)

	def test_apply_line_discount_writes_discount_and_net(self):
		row = SimpleNamespace(discount_type="Percentage", discount_value=20)
		self.assertEqual(apply_line_discount(row, 500), 400.0)
		self.assertEqual(row.discount_amount, 100.0)
		self.assertEqual(row.net_amount, 400.0)

	def test_apply_line_discount_from_flat_payload(self):
		row = SimpleNamespace(discount_type="Percentage", discount_value=5)
		apply_line_discount_from_payload(row, {"discount_type": "Amount", "discount_value": 33})
		self.assertEqual(row.discount_type, "Amount")
		self.assertEqual(row.discount_value, 33.0)

	def test_apply_line_discount_from_nested_payload(self):
		row = SimpleNamespace(discount_type=None, discount_value=0)
		apply_line_discount_from_payload(row, {"discount": {"type": "percentage", "value": 12}})
		self.assertEqual(row.discount_type, "Percentage")
		self.assertEqual(row.discount_value, 12.0)

	def test_apply_line_discount_from_payload_clears(self):
		row = SimpleNamespace(discount_type="Percentage", discount_value=12)
		apply_line_discount_from_payload(row, {"discount": None})
		self.assertIsNone(row.discount_type)
		self.assertEqual(row.discount_value, 0.0)

	def test_doc_line_discount_total_sums_labour_and_parts(self):
		doc = SimpleNamespace(
			labour=[SimpleNamespace(discount_amount=100.0), SimpleNamespace(discount_amount=0)],
			parts=[SimpleNamespace(discount_amount=25.5)],
		)
		self.assertEqual(doc_line_discount_total(doc), 125.5)

	def test_doc_line_discount_total_handles_missing_tables(self):
		self.assertEqual(doc_line_discount_total(SimpleNamespace()), 0.0)
