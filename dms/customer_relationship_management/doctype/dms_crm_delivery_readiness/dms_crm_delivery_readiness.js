frappe.ui.form.on("DMS CRM Delivery Readiness", {
	setup(frm) {
		frm.set_query("company", () => ({
			query: "dms.crm_api.common.company_link_query",
		}));
		frm.set_query("branch", () => ({
			query: "dms.crm_api.common.branch_link_query",
			filters: { company: frm.doc.company || "" },
		}));
		frm.set_query("checklist_template", () => ({
			filters: { is_active: 1 },
		}));
	},
});
