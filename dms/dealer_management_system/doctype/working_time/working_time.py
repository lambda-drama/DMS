# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_time, get_time_str


def _time_to_seconds(value) -> int | None:
	if not value:
		return None
	t = get_time(value)
	if not t:
		return None
	return t.hour * 3600 + t.minute * 60 + t.second


class WorkingTime(Document):
	def validate(self):
		self._validate_weekly_schedule()

	def _validate_weekly_schedule(self):
		if not self.weekly_schedule:
			frappe.throw(_("Add at least one day to the weekly schedule."))

		seen_days: set[str] = set()
		for row in self.weekly_schedule:
			day = (row.day_of_week or "").strip()
			if not day:
				frappe.throw(_("Each row must have a day of the week."))
			if day in seen_days:
				frappe.throw(
					_("Duplicate day {0} in weekly schedule. Use one row per day.").format(
						frappe.bold(day)
					)
				)
			seen_days.add(day)

			start = _time_to_seconds(row.start_time)
			end = _time_to_seconds(row.end_time)
			if start is None or end is None:
				frappe.throw(_("Start and end time are required for {0}.").format(frappe.bold(day)))
			if end <= start:
				frappe.throw(
					_("End time must be after start time on {0}.").format(frappe.bold(day))
				)

			if row.has_lunch_break:
				lunch_start = _time_to_seconds(row.lunch_start)
				lunch_end = _time_to_seconds(row.lunch_end)
				if lunch_start is None or lunch_end is None:
					frappe.throw(
						_("Lunch from/to are required when lunch break is enabled on {0}.").format(
							frappe.bold(day)
						)
					)
				if lunch_end <= lunch_start:
					frappe.throw(
						_("Lunch end must be after lunch start on {0}.").format(frappe.bold(day))
					)
				if lunch_start < start or lunch_end > end:
					frappe.throw(
						_("Lunch break must fall within working hours on {0}.").format(
							frappe.bold(day)
						)
					)


def format_day_summary(row) -> str:
	"""Human-readable line for list views / APIs."""
	parts = [row.day_of_week]
	if row.is_half_day:
		parts.append("(half day)")
	parts.append(f"{get_time_str(row.start_time)}–{get_time_str(row.end_time)}")
	if row.has_lunch_break and row.lunch_start and row.lunch_end:
		parts.append(
			f"lunch {get_time_str(row.lunch_start)}–{get_time_str(row.lunch_end)}"
		)
	return " ".join(parts)
