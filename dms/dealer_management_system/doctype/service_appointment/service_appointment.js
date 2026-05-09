// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Service Appointment", {
	refresh(frm) {
    apply_customer_filter_advanced(frm);
    apply_vehicle_item_filter(frm);
     apply_vehicle_vin_filter(frm);
	},
});


function apply_customer_filter_advanced(frm) {
    frm.fields_dict.customer.get_query = function(doc, cdt, cdn) {
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_customers",
            filters: {}
        };
    };
}


function apply_vehicle_item_filter(frm) {
    frm.fields_dict.vehicle.get_query = function(doc, cdt, cdn) {
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_items",
            filters: {}
        };
    };
}


function apply_vin_filter(frm) {
    frm.fields_dict.vin_chassis.get_query = function(doc, cdt, cdn) {
        let filters = {};
        
        // If vehicle is selected, filter by that vehicle item
        if (doc.vehicle) {
            filters.vehicle_item = doc.vehicle;
        }
        
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_vins",
            filters: filters
        };
    };
}
