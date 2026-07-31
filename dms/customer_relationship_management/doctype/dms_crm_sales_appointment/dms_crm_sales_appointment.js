frappe.ui.form.on("DMS CRM Sales Appointment", {
	setup(frm) {
		frm.set_query("company", () => ({
			query: "dms.crm_api.common.company_link_query",
		}));
		frm.set_query("branch", () => ({
			query: "dms.crm_api.common.branch_link_query",
			filters: { company: frm.doc.company || "" },
		}));
	},
});
