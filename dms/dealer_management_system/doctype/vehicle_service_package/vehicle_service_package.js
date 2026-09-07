// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vehicle Service Package", {
	refresh(frm) {
		frm.set_query("labor_operation", "labor_operations", () => ({
			filters: { custom_active: 1 },
		}));
	},
});
