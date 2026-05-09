// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Job Card Part Item", {
	item_code(frm, cdt, cdn) {
		queue_stock_refresh(frm, cdt, cdn);
	},

	warehouse(frm, cdt, cdn) {
		queue_stock_refresh(frm, cdt, cdn);
	},
});

function queue_stock_refresh(frm, cdt, cdn) {
	// Defer so link-field fetch (part name, unit price) finishes first
	setTimeout(() => refresh_part_stock_available(frm, cdt, cdn), 0);
}

function refresh_part_stock_available(frm, cdt, cdn) {
	const row = frappe.get_doc(cdt, cdn);
	if (!row.item_code) {
		frappe.model.set_value(cdt, cdn, "stock_available", null);
		return;
	}

	frappe.call({
		method:
			"dms.dealer_management_system.doctype.dms_job_card.dms_job_card.get_job_card_part_stock_available",
		args: {
			spare_part: row.item_code,
			warehouse: row.warehouse || "",
		},
		callback: (r) => {
			if (r.message !== undefined && r.message !== null) {
				frappe.model.set_value(cdt, cdn, "stock_available", r.message);
			}
		},
	});
}
