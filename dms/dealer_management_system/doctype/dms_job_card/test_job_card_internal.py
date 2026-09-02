# Copyright (c) 2026, Mania and Contributors

from types import SimpleNamespace

from frappe.tests import UnitTestCase

from dms.dealer_management_system.doctype.dms_job_card.job_card_internal import (
	consumable_part_qty,
)


class TestInternalJobCardConsumption(UnitTestCase):
	def test_issued_parts_are_consumed_from_wip(self):
		part = SimpleNamespace(quantity_requested=1, quantity_issued=1, quantity_returned=0)
		self.assertEqual(consumable_part_qty(part), 1)

	def test_returned_qty_is_not_consumed(self):
		part = SimpleNamespace(quantity_requested=2, quantity_issued=2, quantity_returned=1)
		self.assertEqual(consumable_part_qty(part), 1)

	def test_unissued_requested_qty_is_consumed(self):
		part = SimpleNamespace(quantity_requested=3, quantity_issued=0, quantity_returned=0)
		self.assertEqual(consumable_part_qty(part), 3)
