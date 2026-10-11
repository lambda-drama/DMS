# Copyright (c) 2026, Mania and Contributors

"""Job-card invoice posting must be after the parts-issue transfer into WIP."""

from datetime import datetime

from frappe.tests import UnitTestCase
from frappe.utils import getdate

from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	combine_posting_datetime,
	resolve_invoice_posting_after_stock,
)


class TestCombinePostingDatetime(UnitTestCase):
	def test_missing_time_is_midnight(self):
		dt = combine_posting_datetime("2026-10-12", None)
		self.assertEqual(dt, datetime(2026, 10, 12, 0, 0, 0))

	def test_keeps_clock_time(self):
		dt = combine_posting_datetime("2026-10-12", "0:44:50.781027")
		self.assertEqual(dt, datetime(2026, 10, 12, 0, 44, 50, 781027))


class TestResolveInvoicePostingAfterStock(UnitTestCase):
	def test_same_day_midnight_is_bumped_past_transfer(self):
		"""Invoice date today at 00:00 cannot see a 00:44 WIP transfer."""
		now = datetime(2026, 10, 12, 0, 46, 0)
		latest = datetime(2026, 10, 12, 0, 44, 50)
		date, time_value = resolve_invoice_posting_after_stock(
			"2026-10-12",
			"00:00:00",
			latest_stock_dt=latest,
			now=now,
		)
		self.assertEqual(getdate(date), getdate("2026-10-12"))
		self.assertEqual(time_value, "00:46:00.000000")

	def test_invoice_already_after_transfer_is_unchanged(self):
		now = datetime(2026, 10, 12, 10, 0, 0)
		latest = datetime(2026, 10, 12, 0, 44, 50)
		date, time_value = resolve_invoice_posting_after_stock(
			"2026-10-12",
			"10:00:00",
			latest_stock_dt=latest,
			now=now,
		)
		self.assertEqual(getdate(date), getdate("2026-10-12"))
		self.assertEqual(time_value, "10:00:00")

	def test_backdated_invoice_is_moved_to_now_when_stock_is_later(self):
		now = datetime(2026, 10, 12, 0, 46, 0)
		latest = datetime(2026, 10, 12, 0, 44, 50)
		date, time_value = resolve_invoice_posting_after_stock(
			"2026-10-10",
			"09:00:00",
			latest_stock_dt=latest,
			now=now,
		)
		self.assertEqual(getdate(date), getdate("2026-10-12"))
		self.assertEqual(time_value, "00:46:00.000000")

	def test_missing_time_on_today_uses_now_even_without_stock(self):
		now = datetime(2026, 10, 12, 0, 46, 0)
		date, time_value = resolve_invoice_posting_after_stock(
			"2026-10-12",
			None,
			latest_stock_dt=None,
			now=now,
		)
		self.assertEqual(getdate(date), getdate("2026-10-12"))
		self.assertEqual(time_value, "00:46:00.000000")
