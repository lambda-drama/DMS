// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Spare Part", {
// 	refresh(frm) {

// 	},
// });

// Script Name: spare_part_client
// Script Type: Client
// DocType: Spare Part

frappe.ui.form.on('Spare Part', {
    refresh: function(frm) {
        // Add button to open linked Item
        if (frm.doc.spare_part_item) {
            frm.add_custom_button(__('Open Linked Item'), function() {
                frappe.set_route('Form', 'Item', frm.doc.spare_part_item);
            }, __('Actions'));
        }
        
        // Add button to view stock ledger
        frm.add_custom_button(__('View Stock Ledger'), function() {
            frappe.set_route('query-report', 'Stock Ledger', {
                'item_code': frm.doc.item_code
            });
        }, __('Reports'));
        
        // Show warning if discontinued
        if (frm.doc.discontinued) {
            frm.dashboard.set_headline_alert(__('This part has been DISCONTINUED. Superseded part: ' + (frm.doc.superseded_by || 'None')));
        }
    },
    
    spare_part_item: function(frm) {
        // Auto-fetch basic info from Item
        if (frm.doc.spare_part_item) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Item',
                    name: frm.doc.spare_part_item
                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value('item_code', r.message.item_code);
                        frm.set_value('item_name', r.message.item_name);
                        frm.set_value('stock_uom', r.message.stock_uom);
                        
                        // Auto-populate OEM part number as item_code if not set
                        if (!frm.doc.oem_part_number) {
                            frm.set_value('oem_part_number', r.message.item_code);
                        }
                    }
                }
            });
        }
    },
    
    is_returnable_core: function(frm) {
        if (frm.doc.is_returnable_core && !frm.doc.core_charge_amount) {
            frappe.prompt([
                {'fieldname': 'core_charge', 'fieldtype': 'Currency', 'label': 'Core Charge Amount', 'reqd': 1}
            ], function(values) {
                frm.set_value('core_charge_amount', values.core_charge);
            }, 'Set Core Charge');
        }
    },
    
    is_hazardous_material: function(frm) {
        if (frm.doc.is_hazardous_material && !frm.doc.hazardous_class) {
            frappe.msgprint(__('Please enter the hazardous class for shipping/storage requirements.'));
        }
    }
});