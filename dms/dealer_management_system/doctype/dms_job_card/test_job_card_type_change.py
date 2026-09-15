# Copyright (c) 2026, Mania and Contributors

"""Unit tests for the Job Card Type change guard (``dms.api.job_cards``).

Pure logic — ``frappe.get_meta``/``frappe.throw`` are patched so no database
access is required.
"""

from types import SimpleNamespace
from unittest.mock import patch

from frappe.tests import UnitTestCase

from dms.api.job_cards import _apply_job_card_type_change

JOB_CARD_TYPE_OPTIONS = (
	"\nCustomer Paid\nWarranty\nInternal\nPDI\n"
	"Campaign/Recall\nInsurance\nGoodwill\nFleet Contract"
)


class JobCardTypeError(Exception):
	"""Stands in for frappe.throw (ValidationError) during unit tests."""


def _fake_get_meta(doctype):
	return SimpleNamespace(
		get_field=lambda field: SimpleNamespace(options=JOB_CARD_TYPE_OPTIONS)
	)


def _fake_throw(message, *args, **kwargs):
	raise JobCardTypeError(message)


def _make_doc(**kwargs):
	doc = SimpleNamespace(
		job_card_type=kwargs.get("job_card_type", "Customer Paid"),
		docstatus=kwargs.get("docstatus", 0),
		status=kwargs.get("status", "Open"),
		invoice=kwargs.get("invoice"),
		material_issue=kwargs.get("material_issue"),
		payment_status=kwargs.get("payment_status", "Unpaid"),
		customer_approval_status=kwargs.get("customer_approval_status", "Pending"),
		flags=SimpleNamespace(),
	)
	doc.get = lambda key, default=None: getattr(doc, key, default)
	return doc


@patch.multiple(
	"dms.api.job_cards.frappe",
	get_meta=_fake_get_meta,
	throw=_fake_throw,
)
class TestJobCardTypeChange(UnitTestCase):
	def test_type_changes_before_repair_starts(self):
		doc = _make_doc()
		_apply_job_card_type_change(doc, "Warranty")
		self.assertEqual(doc.job_card_type, "Warranty")

	def test_unknown_type_is_rejected(self):
		with self.assertRaises(JobCardTypeError):
			# "Repair" is not a valid DMS Job Card type option.
			_apply_job_card_type_change(_make_doc(), "Repair")

	def test_empty_type_is_rejected(self):
		with self.assertRaises(JobCardTypeError):
			_apply_job_card_type_change(_make_doc(), "")

	def test_type_changes_after_repair_starts(self):
		"""Submitted/repair-in-progress cards stay editable until closed or billed."""
		doc = _make_doc(docstatus=1, status="Repair In Progress")
		_apply_job_card_type_change(doc, "Warranty")
		self.assertEqual(doc.job_card_type, "Warranty")
		# Totals recalculate into read-only fields, so the post-submit guard is relaxed.
		self.assertTrue(doc.flags.ignore_validate_update_after_submit)

	def test_draft_card_keeps_post_submit_guard(self):
		doc = _make_doc()
		_apply_job_card_type_change(doc, "Warranty")
		self.assertFalse(getattr(doc.flags, "ignore_validate_update_after_submit", False))

	def test_type_cannot_change_on_completed_card(self):
		with self.assertRaises(JobCardTypeError) as ctx:
			_apply_job_card_type_change(_make_doc(docstatus=1, status="Completed"), "Warranty")
		self.assertIn("Completed", str(ctx.exception))

	def test_type_cannot_change_on_delivered_card(self):
		with self.assertRaises(JobCardTypeError):
			_apply_job_card_type_change(_make_doc(docstatus=1, status="Delivered"), "Warranty")

	def test_type_cannot_change_on_cancelled_card(self):
		with self.assertRaises(JobCardTypeError):
			_apply_job_card_type_change(_make_doc(docstatus=2, status="Cancelled"), "Warranty")

	def test_type_cannot_change_after_invoice(self):
		with self.assertRaises(JobCardTypeError) as ctx:
			_apply_job_card_type_change(_make_doc(invoice="SINV-0001"), "Warranty")
		self.assertIn("billing has started", str(ctx.exception))

	def test_type_cannot_change_after_material_issue(self):
		with self.assertRaises(JobCardTypeError):
			_apply_job_card_type_change(_make_doc(material_issue="STE-0001"), "Warranty")

	def test_unchanged_type_is_a_no_op(self):
		doc = _make_doc(job_card_type="Warranty", docstatus=1, status="Repair In Progress")
		_apply_job_card_type_change(doc, "Warranty")
		self.assertEqual(doc.job_card_type, "Warranty")

	def test_leaving_internal_restores_billable_defaults(self):
		doc = _make_doc(
			job_card_type="Internal",
			payment_status="Internal",
			customer_approval_status="Approved",
		)
		_apply_job_card_type_change(doc, "Customer Paid")
		self.assertEqual(doc.job_card_type, "Customer Paid")
		self.assertEqual(doc.payment_status, "Unpaid")
		self.assertEqual(doc.customer_approval_status, "Pending")

	def test_switching_to_internal_leaves_billing_to_document_validate(self):
		doc = _make_doc()
		_apply_job_card_type_change(doc, "Internal")
		self.assertEqual(doc.job_card_type, "Internal")
		self.assertEqual(doc.payment_status, "Unpaid")
