# Copyright (c) 2026, Mania and Contributors

from frappe.tests import UnitTestCase

from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
	_apply_line_net_to_invoice_pricing,
	_apply_warranty_as_invoice_discount,
	_si_item_pricing_fields,
	_warranty_covered_line_amount,
	resolve_invoice_warranty_application_type,
)


class _Doc:
	def __init__(self, **kwargs):
		self.__dict__.update(kwargs)

	def get(self, key, default=None):
		return getattr(self, key, default)


class TestInvoiceWarrantyPricing(UnitTestCase):
	def test_warranty_line_keeps_listed_rate(self):
		fields = _si_item_pricing_fields({"rate": 2000, "discount_percentage": 100})
		self.assertEqual(fields["price_list_rate"], 2000)
		self.assertEqual(fields["rate"], 2000)
		self.assertEqual(fields["discount_percentage"], 100)
		self.assertEqual(fields["discount_amount"], 2000)
		self.assertEqual(fields["is_free_item"], 0)

	def test_billable_line_keeps_full_rate(self):
		fields = _si_item_pricing_fields({"rate": 500, "discount_percentage": 0})
		self.assertEqual(fields["price_list_rate"], 500)
		self.assertEqual(fields["rate"], 500)
		self.assertEqual(fields["discount_percentage"], 0)

	def test_100_percent_line_uses_document_discount(self):
		fields = _si_item_pricing_fields({"rate": 2000, "discount_percentage": 100})
		labour = _Doc(qty=1, rate=fields["rate"])
		si = _Doc(
			items=[labour],
			additional_discount_percentage=0,
			discount_amount=0,
			apply_discount_on="Net Total",
		)
		line_fields = [
			{
				**fields,
				"warranty_full_discount": True,
			}
		]
		covered, total = _warranty_covered_line_amount(si, line_fields)
		self.assertEqual(covered, 2000)
		self.assertEqual(total, 2000)
		_apply_warranty_as_invoice_discount(si, line_fields)
		self.assertEqual(si.additional_discount_percentage, 100)
		self.assertEqual(si.discount_amount, 0)

	def test_labour_warranty_discounts_only_covered_amount(self):
		labour = _Doc(qty=1, rate=800)
		part = _Doc(qty=1, rate=200)
		si = _Doc(
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

	def test_none_override_bills_all_even_if_job_card_is_all_invoice(self):
		self.assertEqual(
			resolve_invoice_warranty_application_type("None", "All Invoice"),
			"",
		)
		self.assertEqual(
			resolve_invoice_warranty_application_type("none", "All Invoice"),
			"",
		)
		self.assertEqual(
			resolve_invoice_warranty_application_type("", "All Invoice"),
			"",
		)

	def test_omitted_warranty_keeps_job_card_all_invoice(self):
		self.assertEqual(
			resolve_invoice_warranty_application_type(None, "All Invoice"),
			"All Invoice",
		)
		self.assertEqual(
			resolve_invoice_warranty_application_type(None, "Labour"),
			"Labour",
		)

	def test_100_percent_line_discount_bills_zero(self):
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			_line_invoice_discount,
		)

		fields = _line_invoice_discount(3000, 0, "Percentage")
		self.assertEqual(fields["rate"], 3000)
		self.assertEqual(fields["discount_percentage"], 100)
		self.assertEqual(fields["discount_amount"], 3000)
		self.assertEqual(fields["is_free_item"], 0)
		pricing = _apply_line_net_to_invoice_pricing(
			{
				"include": True,
				"rate": 0.0,
				"discount_percentage": 0.0,
				"amount": 0.0,
				"is_warranty_covered": False,
			},
			3000,
			0,
			1,
		)
		self.assertEqual(pricing["amount"], 0)
		self.assertGreaterEqual(pricing["discount_percentage"], 100)
		fields = _si_item_pricing_fields(pricing, price_list_rate=3000, discount_mode="percentage")
		self.assertEqual(fields["price_list_rate"], 3000)
		self.assertEqual(fields["rate"], 3000)
		self.assertEqual(fields["discount_percentage"], 100)
		self.assertEqual(fields["is_free_item"], 0)
