// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vehicle Model", {
	refresh(frm) {
        apply_vehicle_item_filter(frm)
		frm.set_query("labor_operation", "standard_labor_operations", () => ({
			filters: { custom_active: 1 },
		}));
	},
});

function apply_vehicle_item_filter(frm) {
    frm.fields_dict.model.get_query = function(doc, cdt, cdn) {
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_items",
            filters: {}
        };
    };
}