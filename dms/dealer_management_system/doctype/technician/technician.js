// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Technician", {
// 	refresh(frm) {

// 	},
// });
// Script Name: technician_client
// Script Type: Client
// DocType: Technician

frappe.ui.form.on('Technician', {
    refresh: function(frm) {
        // Add buttons for performance metrics
        frm.add_custom_button(__('View Performance Report'), function() {
            frappe.set_route('query-report', 'Technician Performance', {
                'technician': frm.doc.name
            });
        }, __('Reports'));
        
        frm.add_custom_button(__('Today\'s Jobs'), function() {
            frappe.set_route('List', 'Job Card', {
                'technician_assigned': frm.doc.name,
                'date': frappe.datetime.get_today()
            });
        }, __('View Jobs'));
        
        // Show warning if certifications are expiring soon
        check_expiring_certifications(frm);
    },
    
    skill_level: function(frm) {
        // Update labor rate group based on skill level
        const rate_map = {
            'Trainee': 'Training',
            'Junior': 'Standard',
            'Intermediate': 'Standard',
            'Senior': 'Senior',
            'Master Technician': 'Specialist',
            'EV/PHEV Certified': 'Specialist',
            'Expert': 'Specialist'
        };
        if (rate_map[frm.doc.skill_level]) {
            frm.set_value('labor_rate_group', rate_map[frm.doc.skill_level]);
        }
    },
    
    date_of_joining: function(frm) {
        if (frm.doc.date_of_joining) {
            let today = frappe.datetime.get_today();
            let years = frappe.datetime.get_diff(today, frm.doc.date_of_joining) / 365;
            frm.set_value('experience_at_suweys', years.toFixed(1));
        }
    }
});

function check_expiring_certifications(frm) {
    if (frm.doc.certifications) {
        let expiring_soon = [];
        let today = frappe.datetime.get_today();
        
        frm.doc.certifications.forEach(function(cert) {
            if (cert.expiry_date) {
                let days_left = frappe.datetime.get_diff(cert.expiry_date, today);
                if (days_left <= 30 && days_left > 0) {
                    expiring_soon.push(`${cert.certification_name} (expires in ${days_left} days)`);
                }
            }
        });
        
        if (expiring_soon.length > 0) {
            frm.dashboard.set_headline_alert(__('Certifications expiring soon: ' + expiring_soon.join(', ')));
        }
    }
}