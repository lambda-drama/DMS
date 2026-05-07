// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

// frappe.ui.form.on("DMS Job Card", {
// 	refresh(frm) {

// 	},
// });
// Script Name: job_card_qc_client
// Script Type: Client
// DocType: Job Card

frappe.ui.form.on('Job Card', {
    qc_checklist_template: function(frm) {
        if (frm.doc.qc_checklist_template && !frm.doc.qc_results.length) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'QC Checklist Template',
                    name: frm.doc.qc_checklist_template
                },
                callback: function(r) {
                    if (r.message && r.message.checklist_items) {
                        frm.clear_table('qc_results');
                        r.message.checklist_items.forEach(function(item) {
                            let row = frm.add_child('qc_results');
                            row.checklist_item = item.name;
                            row.check_item_text = item.check_item;
                            row.category = item.category;
                            row.is_mandatory = item.is_mandatory;
                            row.requires_photo = item.requires_photo;
                            row.requires_measurement = item.requires_measurement;
                            row.result = 'Pass';
                            row.inspected_by = frappe.session.user;
                            row.inspected_at = frappe.datetime.now_datetime();
                        });
                        frm.refresh_field('qc_results');
                        frappe.msgprint(__('QC checklist items have been populated from template.'));
                    }
                }
            });
        }
    },
    
    refresh: function(frm) {
        // Check if any mandatory items failed
        let mandatory_fails = frm.doc.qc_results.filter(row => 
            row.is_mandatory === 1 && row.result === 'Fail'
        );
        
        if (mandatory_fails.length > 0 && frm.doc.status === 'QC In Progress') {
            frm.dashboard.set_headline_alert(
                __('{0} mandatory QC items failed. Job cannot be completed until these are resolved.', [mandatory_fails.length])
            );
        }
        
        // Add QC summary button
        if (frm.doc.qc_results && frm.doc.qc_results.length) {
            let pass_count = frm.doc.qc_results.filter(row => row.result === 'Pass').length;
            let fail_count = frm.doc.qc_results.filter(row => row.result === 'Fail').length;
            let na_count = frm.doc.qc_results.filter(row => row.result === 'N/A').length;
            
            frm.dashboard.set_indicator(
                `QC: ${pass_count} Pass, ${fail_count} Fail, ${na_count} N/A`,
                fail_count > 0 ? 'red' : 'green'
            );
        }
    }
});

// Handle measurement auto-calculation
frappe.ui.form.on('Job Card QC Result', {
    measurement_value: function(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
        if (row.requires_measurement && row.measurement_value) {
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'QC Checklist Item',
                    filters: {name: row.checklist_item},
                    fieldname: ['min_value', 'max_value']
                },
                callback: function(r) {
                    if (r.message) {
                        let pass = true;
                        if (r.message.min_value && row.measurement_value < r.message.min_value) {
                            pass = false;
                        }
                        if (r.message.max_value && row.measurement_value > r.message.max_value) {
                            pass = false;
                        }
                        frappe.model.set_value(cdt, cdn, 'measurement_pass', pass ? 1 : 0);
                        if (!pass) {
                            frappe.model.set_value(cdt, cdn, 'result', 'Fail');
                            frappe.msgprint(__('Measurement {0} is outside specification range.', [row.measurement_value]));
                        }
                    }
                }
            });
        }
    },
    
    result: function(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
        if (row.result === 'Fail' && row.is_mandatory) {
            // Automatically set job status to QC Failed if mandatory item fails
            if (frm.doc.status === 'QC In Progress') {
                frappe.model.set_value(frm.doctype, frm.doc.name, 'status', 'QC Failed');
                frappe.model.set_value(frm.doctype, frm.doc.name, 'qc_result', 'Fail');
            }
        }
    }
});