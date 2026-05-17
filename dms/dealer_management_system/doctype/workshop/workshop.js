// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("WorkShop", {
	setup(frm) {
		set_workshop_warehouse_query(frm);
	},

	refresh(frm) {
		set_workshop_warehouse_query(frm);
	},

	company(frm) {
		set_workshop_warehouse_query(frm);
		clear_workshop_warehouse_if_wrong_company(frm);
	},
});

function set_workshop_warehouse_query(frm) {
	const company = frm.doc.company;
	const filters = company ? { company } : { name: ["in", []] };

	frm.set_query("warehouse", () => ({ filters }));
}

function clear_workshop_warehouse_if_wrong_company(frm) {
	if (!frm.doc.company) {
		if (frm.doc.warehouse) {
			frm.set_value("warehouse", "");
		}
		return;
	}

	if (!frm.doc.warehouse) {
		return;
	}

	frappe.db.get_value("Warehouse", frm.doc.warehouse, "company", (r) => {
		const wh_company = r && r.message;
		if (wh_company && wh_company !== frm.doc.company) {
			frm.set_value("warehouse", "");
		}
	});
}
