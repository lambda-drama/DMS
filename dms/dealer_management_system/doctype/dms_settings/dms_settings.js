// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

// frappe.ui.form.on("DMS Settings", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("DMS Settings", {
	refresh(frm) {
		frm.add_custom_button(__("Create VIN from Serial No"), () => {
			open_create_vin_modal(frm);
		}, __("Actions"));

		frm.add_custom_button(__("Import FRT Labour Sheet"), () => {
			open_frt_import_modal(frm);
		}, __("Imports"));

		frm.add_custom_button(__("Import Service Packages"), () => {
			open_service_package_import_modal(frm);
		}, __("Imports"));
	},
});

function open_frt_import_modal(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Import FRT Labour Sheet"),
		fields: [
			{
				fieldname: "brand",
				label: __("Brand"),
				fieldtype: "Link",
				options: "Brand",
				default: "JETOUR",
				reqd: 1,
				description: __("Brand applied to every Vehicle Model created from the workbook"),
			},
			{
				fieldname: "frt_file",
				label: __("Excel workbook (.xls / .xlsx)"),
				fieldtype: "Attach",
				reqd: 1,
				description: __(
					"Each worksheet becomes one Vehicle Model; service rows become Vehicle Service Items"
				),
			},
		],
		primary_action_label: __("Import"),
		primary_action(values) {
			if (!values.frt_file) {
				frappe.msgprint(__("Attach an Excel workbook first"));
				return;
			}
			d.hide();
			import_frt_labour_sheet(frm, values);
		},
	});
	d.show();
}

function import_frt_labour_sheet(frm, values) {
	frappe.call({
		method: "dms.api.frt_import.import_frt_sheet",
		args: {
			file_url: values.frt_file,
			brand: values.brand || "JETOUR",
		},
		freeze: true,
		freeze_message: __("Importing vehicle models and service items…"),
		callback(r) {
			const summary = r.message;
			if (!summary) {
				return;
			}

			let msg = __("Import completed!\n\n");
			msg += __("Sheets processed: {0}\n", [summary.sheets_processed || 0]);
			msg += __("Services created: {0}\n", [summary.services_created || 0]);
			msg += __("Services updated: {0}\n", [summary.services_updated || 0]);
			msg += __("Rows skipped: {0}\n", [summary.services_skipped || 0]);

			if (summary.details?.length) {
				msg += "\n" + __("Per sheet:") + "\n";
				summary.details.forEach((row) => {
					msg += `- ${row.sheet}: ${row.model_name} (${row.model_code}) — ${row.services_created || 0} created, ${row.services_updated || 0} updated\n`;
				});
			}

			if (summary.errors?.length) {
				msg += "\n" + __("Sheet errors:") + "\n";
				summary.errors.forEach((err) => {
					msg += `- ${err.sheet}: ${err.error}\n`;
				});
			}

			frappe.msgprint({
				title: __("FRT Import Summary"),
				message: msg,
				indicator: summary.errors?.length ? "orange" : "green",
			});
			frm.reload_doc();
		},
	});
}

function open_service_package_import_modal(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Import Service Packages"),
		fields: [
			{
				fieldname: "package_file",
				label: __("Excel workbook (.xlsx)"),
				fieldtype: "Attach",
				reqd: 1,
				description: __(
					"Each model tab creates packages like JX50-5K with labour hours, discount, and parts"
				),
			},
		],
		primary_action_label: __("Import"),
		primary_action(values) {
			if (!values.package_file) {
				frappe.msgprint(__("Attach an Excel workbook first"));
				return;
			}
			d.hide();
			import_service_packages_workbook(frm, values.package_file);
		},
	});
	d.show();
}

function import_service_packages_workbook(frm, file_url) {
	frappe.call({
		method: "dms.api.package_import.import_service_packages",
		args: { file_url },
		freeze: true,
		freeze_message: __("Importing vehicle service packages…"),
		callback(r) {
			const summary = r.message;
			if (!summary) {
				return;
			}

			let msg = __("Package import completed!\n\n");
			msg += __("Sheets processed: {0}\n", [summary.sheets_processed || 0]);
			msg += __("Packages created: {0}\n", [summary.packages_created || 0]);
			msg += __("Packages updated: {0}\n", [summary.packages_updated || 0]);
			if (summary.vehicle_models_created) {
				msg += __("Vehicle models created: {0}\n", [summary.vehicle_models_created]);
			}

			if (summary.details?.length) {
				msg += "\n" + __("Per sheet:") + "\n";
				summary.details.forEach((row) => {
					const modelNote = row.vehicle_model_created ? " [model created]" : "";
					msg += `- ${row.sheet}: ${row.model_name} (${row.model_code})${modelNote} — ${row.packages_created || 0} created, ${row.packages_updated || 0} updated\n`;
				});
			}

			if (summary.errors?.length) {
				msg += "\n" + __("Sheet errors:") + "\n";
				summary.errors.forEach((err) => {
					msg += `- ${err.sheet}: ${err.error}\n`;
				});
			}

			frappe.msgprint({
				title: __("Service Package Import Summary"),
				message: msg,
				indicator: summary.errors?.length ? "orange" : "green",
			});
			frm.reload_doc();
		},
	});
}

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