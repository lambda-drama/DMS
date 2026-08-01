// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("DMS CRM Settings", {
	setup(frm) {
		frm.set_query("default_company", () => ({
			query: "dms.crm_api.common.company_link_query",
		}));
	},
});
