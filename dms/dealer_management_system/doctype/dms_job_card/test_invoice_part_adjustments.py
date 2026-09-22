# Copyright (c) 2026, Mania and Contributors

"""Invoice part adjustments: reduce qty / drop requested parts from an invoice."""

import json
from types import SimpleNamespace

import frappe
from frappe.tests import UnitTestCase

from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
	normalize_qty_overrides,
	part_billable_qty,
	plan_part_row_adjustment,
	validate_part_row_adjustments,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import part_issue_qty


def _part(name, requested=5, issued=0, returned=0, item_code="SP-1"):
	return SimpleNamespace(
		name=name,
		item_code=item_code,
		part_name=item_code,
		quantity_requested=requested,
		quantity_issued=issued,
		quantity_returned=returned,
	)


class TestNormalizeQtyOverrides(UnitTestCase):
	def test_empty_input(self):
		self.assertEqual(normalize_qty_overrides(None), {})
		self.assertEqual(normalize_qty_overrides(""), {})

	def test_mapping_input(self):
		self.assertEqual(normalize_qty_overrides({"row-1": "2", "row-2": 1.5}), {"row-1": 2.0, "row-2": 1.5})

	def test_json_string_input(self):
		raw = json.dumps({"row-1": 3})
		self.assertEqual(normalize_qty_overrides(raw), {"row-1": 3.0})

	def test_list_of_dicts_input(self):
		rows = [{"source_row": "row-1", "qty": 2}, {"name": "row-2", "qty": 0}]
		self.assertEqual(normalize_qty_overrides(rows), {"row-1": 2.0, "row-2": 0.0})


class TestValidatePartRowAdjustments(UnitTestCase):
	def test_removing_requested_part_is_allowed(self):
		"""Requested parts may now be dropped from the invoice (job card untouched)."""
		parts = [_part("row-1", requested=4)]
		excluded, overrides = validate_part_row_adjustments(parts, exclude_rows=["row-1"])
		self.assertEqual(excluded, {"row-1"})
		self.assertEqual(overrides, {})

	def test_reducing_requested_part_is_allowed(self):
		parts = [_part("row-1", requested=4)]
		excluded, overrides = validate_part_row_adjustments(
			parts, qty_overrides={"row-1": 2}
		)
		self.assertEqual(excluded, set())
		self.assertEqual(overrides, {"row-1": 2.0})

	def test_zero_qty_is_treated_as_removed(self):
		parts = [_part("row-1", requested=4)]
		excluded, overrides = validate_part_row_adjustments(
			parts, qty_overrides={"row-1": 0}
		)
		self.assertEqual(excluded, {"row-1"})
		self.assertEqual(overrides, {})

	def test_unknown_row_is_rejected(self):
		with self.assertRaises(frappe.ValidationError):
			validate_part_row_adjustments([_part("row-1")], exclude_rows=["missing-row"])

	def test_negative_qty_is_rejected(self):
		with self.assertRaises(frappe.ValidationError):
			validate_part_row_adjustments([_part("row-1")], qty_overrides={"row-1": -1})

	def test_no_adjustments_returns_empty(self):
		self.assertEqual(validate_part_row_adjustments([_part("row-1")]), (set(), {}))


class TestPartBillableQty(UnitTestCase):
	def test_base_qty_when_no_override(self):
		self.assertEqual(part_billable_qty(_part("row-1", requested=4)), 4)

	def test_reduced_override_is_used(self):
		self.assertEqual(part_billable_qty(_part("row-1", requested=4), {"row-1": 2}), 2)

	def test_override_above_job_card_qty_is_rejected(self):
		with self.assertRaises(frappe.ValidationError):
			part_billable_qty(_part("row-1", requested=4), {"row-1": 5})

	def test_issued_quantity_is_the_upper_bound(self):
		row = _part("row-1", requested=10, issued=3)
		self.assertEqual(part_billable_qty(row), 3)
		self.assertEqual(part_billable_qty(row, {"row-1": 1}), 1)
		with self.assertRaises(frappe.ValidationError):
			part_billable_qty(row, {"row-1": 4})

	def test_override_for_other_row_is_ignored(self):
		self.assertEqual(
			part_billable_qty(_part("row-1", requested=4), {"row-2": 1}), 4
		)


class TestPlanPartRowAdjustment(UnitTestCase):
	"""Job card mirroring plan: what the card should look like after invoicing."""

	def test_nothing_to_do_when_qty_unchanged(self):
		self.assertIsNone(plan_part_row_adjustment(_part("row-1", requested=4), qty=4))
		self.assertIsNone(plan_part_row_adjustment(_part("row-1", requested=4)))
		self.assertIsNone(plan_part_row_adjustment(_part("row-1", requested=0), excluded=True))

	def test_reduce_never_issued_part_lowers_requested(self):
		plan = plan_part_row_adjustment(_part("row-1", requested=4), qty=1)
		self.assertEqual(plan["action"], "reduce")
		self.assertEqual(plan["quantity_requested"], 1)
		self.assertNotIn("quantity_issued", plan)

	def test_reduce_never_issued_part_keeps_returned_math(self):
		# requested 5, returned 2 -> billable 3; bill 1 -> requested 1 + 2 = 3
		plan = plan_part_row_adjustment(_part("row-1", requested=5, returned=2), qty=1)
		self.assertEqual(plan["quantity_requested"], 3)

	def test_reduce_issued_part_lowers_issued_qty(self):
		plan = plan_part_row_adjustment(_part("row-1", requested=4, issued=4), qty=2)
		self.assertEqual(plan["action"], "reduce")
		self.assertEqual(plan["quantity_issued"], 2)
		# returned is left alone so the unused qty stays returnable
		self.assertNotIn("quantity_returned", plan)

	def test_reduced_part_still_bills_the_invoice_qty(self):
		row = _part("row-1", requested=4, issued=4)
		plan = plan_part_row_adjustment(row, qty=2)
		row.quantity_issued = plan["quantity_issued"]
		self.assertEqual(part_issue_qty(row), 2)

	def test_remove_never_issued_part_drops_the_row(self):
		plan = plan_part_row_adjustment(_part("row-1", requested=2), excluded=True)
		self.assertEqual(plan["action"], "remove")
		self.assertEqual(plan["to"], 0)

	def test_remove_issued_part_marks_it_returned(self):
		plan = plan_part_row_adjustment(_part("row-1", requested=4, issued=4), excluded=True)
		self.assertEqual(plan["action"], "mark_returned")
		self.assertEqual(plan["quantity_issued"], 0)
		self.assertEqual(plan["quantity_requested"], 0)
		self.assertEqual(plan["quantity_returned"], 4)

	def test_zero_qty_on_issued_part_marks_it_returned(self):
		plan = plan_part_row_adjustment(_part("row-1", requested=3, issued=3), qty=0)
		self.assertEqual(plan["action"], "mark_returned")

	def test_marked_returned_part_stops_being_billable(self):
		row = _part("row-1", requested=4, issued=4)
		plan = plan_part_row_adjustment(row, excluded=True)
		row.quantity_issued = plan["quantity_issued"]
		row.quantity_requested = plan["quantity_requested"]
		row.quantity_returned = plan["quantity_returned"]
		self.assertEqual(part_issue_qty(row), 0)
