// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("DMS CRM Lead Assignment Pool", {
	setup(frm) {
		frm.set_query("branch", () => ({
			query: "dms.crm_api.common.branch_link_query",
		}));
	},
});
