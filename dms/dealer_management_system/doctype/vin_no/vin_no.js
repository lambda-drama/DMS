// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt


frappe.ui.form.on('VIN No', {
    refresh: function(frm) {
        // Show linked Serial No button
        if (frm.doc.linked_serial) {
            frm.add_custom_button(__('Open Serial No'), function() {
                frappe.set_route('Form', 'Serial No', frm.doc.linked_serial);
            }, __('ERPNext'));
        }
        
        apply_vehicle_item_filter(frm);

        // Show linked Item button
        if (frm.doc.linked_item) {
            frm.add_custom_button(__('Open Vehicle Model (Item)'), function() {
                frappe.set_route('Form', 'Item', frm.doc.linked_item);
            }, __('Reference'));
        }
        
        // Service history button
        frm.add_custom_button(__('Service History'), function() {
            frappe.set_route('List', 'Job Card', {'vehicle_vin': frm.doc.name});
        }, __('View'));
        
        // Calculate warranty status
        calculate_warranty_status(frm);
    },
    
    warranty_start_date: function(frm) {
        calculate_warranty_status(frm);
    },
    
    warranty_end_date: function(frm) {
        calculate_warranty_status(frm);
    },
    
    warranty_km_limit: function(frm) {
        calculate_warranty_status(frm);
    },
    
    current_odometer: function(frm) {
        calculate_warranty_status(frm);
        
        // Auto-suggest next service
        if (frm.doc.current_odometer && frm.doc.service_interval_km) {
            let next_service = frm.doc.current_odometer + frm.doc.service_interval_km;
            frm.set_value('next_service_due_km', next_service);
        }
    },
    
    delivery_date: function(frm) {
        if (frm.doc.delivery_date && !frm.doc.warranty_start_date) {
            frm.set_value('warranty_start_date', frm.doc.delivery_date);
        }
    },
    
    vin_number: function(frm) {
        // Validate VIN length and format
        // if (frm.doc.vin_number && frm.doc.vin_number.length !== 17) {
        //     frappe.msgprint({
        //         title: __('Invalid VIN'),
        //         message: __('Standard VIN should be 17 characters. Please verify.'),
        //         indicator: 'orange'
        //     });
        // }
    }
});

function calculate_warranty_status(frm) {
    let today = frappe.datetime.get_today();
    let is_expired_by_time = false;
    let is_expired_by_mileage = false;
    
    if (frm.doc.warranty_end_date && frm.doc.warranty_end_date < today) {
        is_expired_by_time = true;
    }
    
    if (frm.doc.warranty_km_limit && frm.doc.current_odometer && 
        frm.doc.current_odometer >= frm.doc.warranty_km_limit) {
        is_expired_by_mileage = true;
    }
    
    if (is_expired_by_time && is_expired_by_mileage) {
        frm.set_value('warranty_status', 'Expired by Time & Mileage');
    } else if (is_expired_by_time) {
        frm.set_value('warranty_status', 'Expired by Time');
    } else if (is_expired_by_mileage) {
        frm.set_value('warranty_status', 'Expired by Mileage');
    } else {
        frm.set_value('warranty_status', 'Active');
    }
}



function apply_vehicle_item_filter(frm) {
    frm.fields_dict.linked_item.get_query = function(doc, cdt, cdn) {
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_items",
            filters: {}
        };
    };
}


