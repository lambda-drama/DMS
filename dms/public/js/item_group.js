// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Item Group", {
	refresh(frm) {
		if (frm.doc.custom_auto_generate_spare_parts && !frm.is_new()) {
			frm.add_custom_button(__("Create Spare Parts from Items"), () => {
				frappe.confirm(
					__(
						"Create Spare Part records for all Items in this group that do not already have one?"
					),
					() => create_spare_parts_from_group(frm)
				);
			}, __("Actions"));
		}
	},
});

function create_spare_parts_from_group(frm) {
	frappe.call({
		method: "dms.utils.spare_part_auto_create.create_spare_parts_for_item_group",
		args: {
			item_group: frm.doc.name,
		},
		freeze: true,
		freeze_message: __("Creating Spare Parts..."),
		callback(r) {
			if (!r.message) {
				return;
			}

			const summary = r.message;
			frappe.msgprint({
				title: __("Spare Parts Creation Summary"),
				message: __("Total Items: {0}<br>Created: {1}<br>Skipped: {2}<br>Errors: {3}", [
					summary.total_items,
					summary.created,
					summary.skipped,
					summary.errors,
				]),
				indicator: summary.errors > 0 ? "orange" : "green",
			});
		},
	});
}
