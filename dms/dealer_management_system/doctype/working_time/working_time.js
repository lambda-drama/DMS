// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

function used_days(frm) {
	return new Set(
		(frm.doc.weekly_schedule || [])
			.map((r) => r.day_of_week)
			.filter(Boolean)
	);
}

function next_unused_day(frm) {
	const used = used_days(frm);
	return ALL_DAYS.find((d) => !used.has(d));
}

frappe.ui.form.on("Working Time", {
	refresh(frm) {
		if (frm.is_new() && !(frm.doc.weekly_schedule || []).length) {
			frm.add_custom_button(__("Add Mon–Fri (8:30–17:30)"), () =>
				add_weekday_template(frm, {
					start: "08:30:00",
					end: "17:30:00",
					lunch_start: "12:30:00",
					lunch_end: "13:30:00",
				})
			);
			frm.add_custom_button(__("Add Saturday (half day)"), () =>
				add_single_day(frm, {
					day: "Saturday",
					start: "08:30:00",
					end: "12:30:00",
					is_half_day: 1,
					has_lunch_break: 0,
				})
			);
		}
	},
});

frappe.ui.form.on("Working Time Day", {
	day_of_week(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		const dup = (frm.doc.weekly_schedule || []).filter(
			(r) => r.name !== row.name && r.day_of_week === row.day_of_week
		);
		if (dup.length) {
			frappe.msgprint(
				__("{0} is already in this schedule. Pick another day or remove the duplicate row.", [
					row.day_of_week,
				])
			);
		}
	},
	has_lunch_break(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (!row.has_lunch_break) {
			frappe.model.set_value(cdt, cdn, "lunch_start", null);
			frappe.model.set_value(cdt, cdn, "lunch_end", null);
		}
	},
});

function add_weekday_template(frm, { start, end, lunch_start, lunch_end }) {
	WEEKDAYS.forEach((day) => {
		if (used_days(frm).has(day)) return;
		const row = frm.add_child("weekly_schedule");
		row.day_of_week = day;
		row.start_time = start;
		row.end_time = end;
		row.has_lunch_break = 1;
		row.lunch_start = lunch_start;
		row.lunch_end = lunch_end;
		row.is_half_day = 0;
	});
	frm.refresh_field("weekly_schedule");
}

function add_single_day(frm, { day, start, end, is_half_day, has_lunch_break }) {
	if (used_days(frm).has(day)) {
		frappe.msgprint(__("{0} is already in this schedule.", [day]));
		return;
	}
	const row = frm.add_child("weekly_schedule");
	row.day_of_week = day;
	row.start_time = start;
	row.end_time = end;
	row.is_half_day = is_half_day || 0;
	row.has_lunch_break = has_lunch_break !== undefined ? has_lunch_break : 1;
	if (row.has_lunch_break) {
		row.lunch_start = "12:30:00";
		row.lunch_end = "13:30:00";
	}
	frm.refresh_field("weekly_schedule");
}
