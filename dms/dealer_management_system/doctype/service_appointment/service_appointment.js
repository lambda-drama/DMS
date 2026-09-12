// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

const VEHICLE_INSPECTION_DOCTYPE = "Vehicle Inspection";
const ACTION_GROUP = __("Action");

frappe.ui.form.on("Service Appointment", {
	refresh(frm) {
		apply_customer_filter_advanced(frm);
		apply_vehicle_item_filter(frm);
		apply_vin_filter(frm);
		apply_company_filter(frm);
		add_vehicle_inspection_action(frm);
		add_fix_license_plates_button(frm);
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


function apply_company_filter(frm) {
	frappe.call({
		method: "dms.api.common.get_companies",
		args: { limit: 999 },
		callback(r) {
			const names = (r.message || []).map((c) => c.name).filter(Boolean);
			frm.set_query("company", () => ({
				filters: { name: ["in", names.length ? names : ["__none__"]] },
			}));
		},
	});
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

function add_fix_license_plates_button(frm) {
	if (frm.is_new()) {
		return;
	}
	if (!(frappe.user.has_role("System Manager") || frappe.session.user === "Administrator")) {
		return;
	}

	frm.add_custom_button(
		__("Update All License Plates from VIN"),
		() => {
			frappe.confirm(
				__(
					"This will update License Plate on every Service Appointment from the linked VIN's Plate Number (fixes old records where VIN was copied into License Plate). Continue?"
				),
				() => {
					frappe.call({
						method:
							"dms.dealer_management_system.doctype.service_appointment.service_appointment.fix_license_plates_from_vin",
						freeze: true,
						freeze_message: __("Updating license plates…"),
						callback(r) {
							const res = r.message || {};
							frappe.msgprint({
								title: __("License Plates Updated"),
								indicator: "green",
								message: __(
									"Updated {0} of {1} appointments ({2} unchanged / skipped).",
									[res.updated || 0, res.total || 0, res.skipped || 0]
								),
							});
							frm.reload_doc();
						},
					});
				}
			);
		},
		ACTION_GROUP
	);
}
