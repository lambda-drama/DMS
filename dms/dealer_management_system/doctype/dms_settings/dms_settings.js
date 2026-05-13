// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

// frappe.ui.form.on("DMS Settings", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("DMS Settings", {
    refresh: function(frm) {
        frm.add_custom_button(__("Create VIN from Serial No"), () => {
            open_create_vin_modal(frm);
        }, __("Actions"));
    }
});

function open_create_vin_modal(frm) {
    let d = new frappe.ui.Dialog({
        title: __("Create VIN No from Serial Numbers"),
        fields: [
            {
                fieldname: "company",
                label: __("Company"),
                fieldtype: "Link",
                options: "Company",
                reqd: 1,
                default: frappe.defaults.get_default("company"),
                description: "Select company for serial numbers"
            },
            {
                fieldname: "start_date",
                label: __("Start Date"),
                fieldtype: "Date",
                reqd: 1,
                default: frappe.datetime.add_months(frappe.datetime.get_today(), -1)
            },
            {
                fieldname: "end_date",
                label: __("End Date"),
                fieldtype: "Date",
                reqd: 1,
                default: frappe.datetime.get_today()
            },
            {
                fieldname: "item_code",
                label: __("Item / Vehicle Model (Optional)"),
                fieldtype: "Link",
                options: "Item",
                description: "Leave blank to process all vehicle items"
            },
            {
                fieldname: "column_break_1",
                fieldtype: "Column Break"
            },
            {
                fieldname: "status_filter",
                label: __("Serial Status"),
                fieldtype: "Select",
                options: "\nActive\nDelivered\nInactive",
                description: "Filter by serial status (optional)"
            },
            {
                fieldname: "force_recreate",
                label: __("Force Recreate (Overwrite existing)"),
                fieldtype: "Check",
                default: 0,
                description: "If checked, will update existing VIN No records"
            }
        ],
        primary_action_label: __("Create VIN Records"),
        primary_action: function(values) {
            d.hide();
            create_vin_from_serial(frm, values);
        }
    });
    d.show();
}

function create_vin_from_serial(frm, filters) {
    frappe.call({
        method: "dms.dealer_management_system.doctype.dms_settings.dms_settings.create_vin_from_serial_numbers",
        args: {
            company: filters.company,
            start_date: filters.start_date,
            end_date: filters.end_date,
            item_code: filters.item_code || null,
            status_filter: filters.status_filter || null,
            force_recreate: filters.force_recreate || 0
        },
        freeze: true,
        freeze_message: __("Creating VIN records from serial numbers..."),
        callback: function(r) {
            if (r.message) {
                let msg = __("Process completed!\n\n");
                msg += __("Company: {0}\n", [filters.company]);
                msg += __("Date Range: {0} to {1}\n", [filters.start_date, filters.end_date]);
                msg += __("Total Serial Numbers found: {0}\n", [r.message.total_serial]);
                msg += __("VIN Records created: {0}\n", [r.message.created]);
                msg += __("VIN Records updated: {0}\n", [r.message.updated]);
                msg += __("Skipped: {0}\n", [r.message.skipped]);
                msg += __("Errors: {0}", [r.message.errors]);
                
                frappe.msgprint({
                    title: __("VIN Creation Summary"),
                    message: msg,
                    indicator: r.message.errors > 0 ? "orange" : "green"
                });
                frm.reload_doc();
            }
        }
    });
}