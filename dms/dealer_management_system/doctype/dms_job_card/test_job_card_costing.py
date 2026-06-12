# Copyright (c) 2026, Mania and Contributors

from types import SimpleNamespace

from frappe.tests import UnitTestCase

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import part_issue_qty


class TestJobCardCosting(UnitTestCase):
	def test_part_issue_qty_uses_issued_quantity(self):
		row = SimpleNamespace(quantity_requested=5, quantity_issued=3, quantity_returned=0)
		self.assertEqual(part_issue_qty(row), 3)

	def test_part_issue_qty_falls_back_to_requested(self):
		row = SimpleNamespace(quantity_requested=4, quantity_issued=0, quantity_returned=0)
		self.assertEqual(part_issue_qty(row), 4)

	def test_part_issue_qty_zero_after_full_return(self):
		row = SimpleNamespace(quantity_requested=5, quantity_issued=0, quantity_returned=5)
		self.assertEqual(part_issue_qty(row), 0)

	def test_part_issue_qty_requested_minus_returned_when_not_issued(self):
		row = SimpleNamespace(quantity_requested=5, quantity_issued=0, quantity_returned=2)
		self.assertEqual(part_issue_qty(row), 3)
