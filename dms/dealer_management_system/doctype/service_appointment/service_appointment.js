// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

const VEHICLE_INSPECTION_DOCTYPE = "Vehicle Inspection";
const ACTION_GROUP = __("Action");

frappe.ui.form.on("Service Appointment", {
	refresh(frm) {
		apply_customer_filter_advanced(frm);
		apply_vehicle_item_filter(frm);
		apply_vin_filter(frm);
		add_vehicle_inspection_action(frm);
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
	frm.fields_dict.vin_chassis.get_query = function (doc, cdt, cdn) {
		const filters = {};
		if (doc.vehicle) {
			filters.vehicle_item = doc.vehicle;
		}
		return {
			query:
				"dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_vins",
			filters: filters,
		};
	};
}

function add_vehicle_inspection_action(frm) {
	if (
		!frappe.model.can_read(VEHICLE_INSPECTION_DOCTYPE) ||
		(!frappe.model.can_create(VEHICLE_INSPECTION_DOCTYPE) && !frm.doc.inspection)
	) {
		return;
	}

	if (frm.is_new()) {
		return;
	}

	if (frm.doc.inspection) {
		frm.add_custom_button(
			__("Vehicle Inspection"),
			() => {
				frappe.set_route("Form", VEHICLE_INSPECTION_DOCTYPE, frm.doc.inspection);
			},
			ACTION_GROUP
		);
		return;
	}

	frm.add_custom_button(
		__("Vehicle Inspection"),
		() => {
			frappe.route_options = {
				appointment: frm.doc.name,
			};
			frappe.set_route("Form", VEHICLE_INSPECTION_DOCTYPE, "new");
		},
		ACTION_GROUP
	);
}
