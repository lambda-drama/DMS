// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("Serial No", {
	refresh(frm) {
		if (frm.is_new()) return;

		frappe.call({
			method: "dms.dealer_management_system.doctype.dms_settings.dms_settings.get_serial_vin_eligibility",
			args: {
				serial_name: frm.doc.name,
			},
			callback(r) {
				if (r.message && r.message.eligible) {
					frm.add_custom_button(__("Create VIN No"), () => {
						frappe.confirm(
							__("Create a VIN No record from this serial number?"),
							() => create_vin_no(frm)
						);
					}, __("Actions"));
				}
			},
		});
	},
});

function create_vin_no(frm) {
	frappe.call({
		method: "dms.dealer_management_system.doctype.dms_settings.dms_settings.create_vin_from_serial_api",
		args: {
			serial_name: frm.doc.name,
		},
		freeze: true,
		freeze_message: __("Creating VIN No..."),
		callback(r) {
			if (!r.message) return;

			const result = r.message;
			if (result.result === "created") {
				frappe.msgprint({
					title: __("VIN No created"),
					message: __("VIN No <b>{0}</b> was created for serial <b>{1}</b>.", [
						result.vin_number,
						result.serial,
					]),
					indicator: "green",
				});
				frm.reload_doc();
			} else if (result.result === "skipped") {
				frappe.msgprint({
					title: __("VIN No already exists"),
					message: __("A VIN No already exists for serial <b>{0}</b>.", [result.serial]),
					indicator: "orange",
				});
			} else {
				frappe.msgprint({
					title: __("VIN No not created"),
					message: __("The VIN No was not created (result: {0}).", [result.result]),
					indicator: "red",
				});
			}
		},
		error(r) {
			frappe.msgprint({
				title: __("Error"),
				message: r.message || __("Failed to create VIN No."),
				indicator: "red",
			});
		},
	});
}