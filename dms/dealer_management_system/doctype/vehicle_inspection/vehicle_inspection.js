// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vehicle Inspection", {
	appointment(frm) {
		if (!frm.doc.appointment) {
			frm._dms_sa_autofill_loaded = "";
			return;
		}
		dms_vehicle_inspection.apply_from_service_appointment(frm);
	},

	async onload_post_render(frm) {
		if (frm.is_new() && frm.doc.appointment) {
			await dms_vehicle_inspection.apply_from_service_appointment(frm);
		}
		await dms_vehicle_inspection.set_service_advisor_from_current_user(frm);
	},

	vin_chassis(frm) {
		dms_vehicle_inspection.sync_model_year_from_vin(frm);
	},

	refresh(frm) {
		dms_vehicle_inspection.setup_job_card_buttons(frm);
		apply_vin_filter(frm);
		apply_customer_filter_advanced(frm);
		apply_vehicle_item_filter(frm);
	},
});

const dms_vehicle_inspection = {
	/**
	 * If Vehicle Inspection has no Service Advisor yet and the logged-in User is linked
	 * on a Service Advisor (`user_id`), set that advisor automatically.
	 */
	async set_service_advisor_from_current_user(frm) {
		if (frm.doc.service_advisor) {
			return;
		}
		if (frm._dms_auto_service_advisor_done) {
			return;
		}
		const u = frappe.session.user;
		if (!u || u === "Guest") {
			frm._dms_auto_service_advisor_done = true;
			return;
		}
		try {
			const rows = await frappe.db.get_list("Service Advisor", {
				filters: { user_id: u, status: "Active" },
				fields: ["name"],
				limit: 1,
			});
			const adv = rows && rows[0] && rows[0].name;
			if (adv) {
				await frm.set_value("service_advisor", adv);
			}
		} catch (e) {
			console.error(e);
		} finally {
			frm._dms_auto_service_advisor_done = true;
		}
	},

	async apply_from_service_appointment(frm) {
		const appt_id = frm.doc.appointment;
		if (!appt_id) {
			frm._dms_sa_autofill_loaded = "";
			return;
		}
		// Prevent duplicate alerts / calls when appointment + new-doc onload both run
		if (frm._dms_sa_autofill_loaded === appt_id) {
			return;
		}

		if (frm._dms_sa_autofill_loading) {
			return;
		}
		frm._dms_sa_autofill_loading = true;

		try {
			const sa = await frappe.db.get_doc("Service Appointment", appt_id);
			let vin = null;
			if (sa.vin_chassis) {
				try {
					vin = await frappe.db.get_doc("VIN No", sa.vin_chassis);
				} catch (e) {
					// Missing VIN or no permission — still fill other SA fields
				}
			}

			const vehicle_item = sa.vehicle || vin?.linked_item;
			await frm.set_value("customer", sa.customer || "");

			if (vehicle_item) {
				await frm.set_value("customer_vehicle", vehicle_item);
			}

			await frm.set_value("vin_chassis", sa.vin_chassis || "");

			const plate = sa.license_plate || vin?.plate_number || "";
			await frm.set_value("license_plate", plate || "");

			if (vin?.model_year !== undefined && vin.model_year !== null && vin.model_year !== "") {
				await frm.set_value("model_year", vin.model_year);
			}

			frm._dms_sa_autofill_loaded = appt_id;

			frappe.show_alert(__("Vehicle and customer imported from appointment"), 3);
		} catch (e) {
			frappe.msgprint({
				title: __("Could not load appointment"),
				indicator: "red",
				message: __("Unable to fetch Service Appointment. Check permissions or try again."),
			});
			console.error(e);
		} finally {
			frm._dms_sa_autofill_loading = false;
		}
	},

	async sync_model_year_from_vin(frm) {
		if (!frm.doc.vin_chassis) {
			return;
		}
		try {
			const vin = await frappe.db.get_doc("VIN No", frm.doc.vin_chassis);
			if (vin?.model_year !== undefined && vin.model_year !== null && vin.model_year !== "") {
				await frm.set_value("model_year", vin.model_year);
			}
		} catch (e) {
			console.error(e);
		}
	},

	setup_job_card_buttons(frm) {
		if (frm.doc.__islocal) {
			return;
		}

		if (frm.doc.job_card) {
			frm.add_custom_button(
				__("Open Job Card"),
				() => frappe.set_route("Form", "DMS Job Card", frm.doc.job_card),
				__("Actions")
			);
		} else {
			frm.add_custom_button(
				__("Create DMS Job Card"),
				() => dms_vehicle_inspection.create_job_card(frm),
				__("Actions")
			);
		}
	},

	create_job_card(frm) {
		frappe.confirm(
			__(
				"Create a DMS Job Card from this inspection? Customer, vehicle (VIN), service advisor, complaints, and appointment data will be copied where fields match."
			),
			() => {
				frappe.call({
					method: "dms.dealer_management_system.doctype.vehicle_inspection.vehicle_inspection.make_dms_job_card_from_inspection",
					args: { source_name: frm.doc.name },
					freeze: true,
					freeze_message: __("Creating Job Card"),
					callback: (r) => {
						if (r.exc) {
							return;
						}
						if (r.message) {
							frappe.show_alert({ message: __("DMS Job Card created"), indicator: "green" });
							frappe.set_route("Form", "DMS Job Card", r.message);
						}
					},
				});
			}
		);
	},
};



function apply_customer_filter_advanced(frm) {
    frm.fields_dict.customer.get_query = function(doc, cdt, cdn) {
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_customers",
            filters: {}
        };
    };
}


function apply_vehicle_item_filter(frm) {
    frm.fields_dict.customer_vehicle.get_query = function(doc, cdt, cdn) {
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
        if (doc.customer_vehicle) {
            filters.vehicle_item = doc.customer_vehicle;
        }
        
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_vins",
            filters: filters
        };
    };
}
