// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Mode of Payment", {
	setup(frm) {
		frm.set_query("custom_branch", "accounts", (doc, cdt, cdn) => {
			const row = locals[cdt][cdn] || {};
			return {
				query: "dms.crm_api.common.branch_link_query",
				filters: { company: row.company || "" },
			};
		});
	},
});

frappe.ui.form.on("Mode of Payment Account", {
	company(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (row.custom_branch) {
			frappe.model.set_value(cdt, cdn, "custom_branch", "");
		}
	},
});
