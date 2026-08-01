frappe.ui.form.on("DMS CRM Test Drive", {
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

	refresh(frm) {
		if (frm.doc.checklist_template && !frm.doc.completed_on) {
			frm.add_custom_button(__("Reload Checklist Template"), () => load_template(frm));
		}
	},

	checklist_template(frm) {
		if (!frm.doc.checklist?.length) {
			load_template(frm);
		}
	},
});

async function load_template(frm) {
	if (!frm.doc.checklist_template) return;
	const template = await frappe.db.get_doc(
		"DMS CRM Test Drive Checklist Template",
		frm.doc.checklist_template
	);
	frm.clear_table("checklist");
	for (const item of template.checklist_items || []) {
		const row = frm.add_child("checklist");
		row.category = item.category;
		row.check_item = item.check_item;
		row.is_mandatory = item.is_mandatory;
		row.result = "Pending";
	}
	frm.refresh_field("checklist");
}
