# Copyright (c) 2026, Mania and Contributors

from types import SimpleNamespace

from frappe.tests import UnitTestCase

from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
	_apply_warranty_as_invoice_discount,
	_si_item_pricing_fields,
	_warranty_covered_line_amount,
)


class _Row:
	def __init__(self, **kwargs):
		self.__dict__.update(kwargs)

	def set(self, key, val):
		setattr(self, key, val)


class TestInvoiceWarrantyPricing(UnitTestCase):
	def test_warranty_line_keeps_selling_rate(self):
		fields = _si_item_pricing_fields({"rate": 2000, "discount_percentage": 100})
		self.assertEqual(fields["price_list_rate"], 2000)
		self.assertEqual(fields["rate"], 2000)
		self.assertEqual(fields["discount_percentage"], 0)

	def test_billable_line_keeps_full_rate(self):
		fields = _si_item_pricing_fields({"rate": 500, "discount_percentage": 0})
		self.assertEqual(fields["price_list_rate"], 500)
		self.assertEqual(fields["rate"], 500)
		self.assertEqual(fields["discount_percentage"], 0)

	def test_all_invoice_uses_100_percent_invoice_discount(self):
		labour = _Row(qty=0.5, rate=2000)
		si = SimpleNamespace(
			items=[labour],
			additional_discount_percentage=0,
			discount_amount=0,
			apply_discount_on="Net Total",
		)
		line_fields = [
			{
				**_si_item_pricing_fields({"rate": 2000, "discount_percentage": 100}),
				"warranty_full_discount": True,
			}
		]
		covered, total = _warranty_covered_line_amount(si, line_fields)
		self.assertEqual(covered, 1000)
		self.assertEqual(total, 1000)
		_apply_warranty_as_invoice_discount(si, line_fields)
		self.assertEqual(si.additional_discount_percentage, 100)
		self.assertEqual(si.discount_amount, 0)
		self.assertEqual(si.apply_discount_on, "Grand Total")
		self.assertEqual(labour.rate, 2000)

	def test_labour_warranty_discounts_only_covered_amount(self):
		labour = _Row(qty=1, rate=800)
		part = _Row(qty=1, rate=200)
		si = SimpleNamespace(
			items=[labour, part],
			additional_discount_percentage=0,
			discount_amount=0,
			apply_discount_on="Net Total",
		)
		_apply_warranty_as_invoice_discount(
			si,
			[
				{"warranty_full_discount": True},
				{"warranty_full_discount": False},
			],
		)
		self.assertEqual(si.additional_discount_percentage, 0)
		self.assertEqual(si.discount_amount, 800)
