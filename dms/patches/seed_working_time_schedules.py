"""Seed default Working Time schedules (Mon–Fri + Saturday half day)."""

import frappe


def execute():
	if frappe.db.exists("DocType", "Working Time"):
		_seed_schedule(
			"Mon-Fri 8:30-5:30",
			"Monday to Friday 8:30am–5:30pm with 12:30–1:30pm lunch",
			[
				{
					"day_of_week": day,
					"start_time": "08:30:00",
					"end_time": "17:30:00",
					"has_lunch_break": 1,
					"lunch_start": "12:30:00",
					"lunch_end": "13:30:00",
					"is_half_day": 0,
				}
				for day in (
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
				)
			],
		)
		_seed_schedule(
			"Saturday Half Day",
			"Saturday 8:30am–12:30pm (no lunch break)",
			[
				{
					"day_of_week": "Saturday",
					"start_time": "08:30:00",
					"end_time": "12:30:00",
					"has_lunch_break": 0,
					"is_half_day": 1,
				}
			],
		)
		_seed_schedule(
			"Mon-Fri Lunch 1:00-2:00",
			"Monday to Friday with later lunch slot (rotation)",
			[
				{
					"day_of_week": day,
					"start_time": "08:30:00",
					"end_time": "17:30:00",
					"has_lunch_break": 1,
					"lunch_start": "13:00:00",
					"lunch_end": "14:00:00",
					"is_half_day": 0,
				}
				for day in (
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
				)
			],
		)


def _seed_schedule(schedule_name: str, description: str, days: list[dict]):
	if frappe.db.exists("Working Time", schedule_name):
		return
	doc = frappe.get_doc(
		{
			"doctype": "Working Time",
			"schedule": schedule_name,
			"description": description,
			"weekly_schedule": days,
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
