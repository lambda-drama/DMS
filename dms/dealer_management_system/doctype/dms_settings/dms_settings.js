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

		frm.add_custom_button(__("Link VIN Models from Names"), () => {
			backfill_vin_model_links(frm);
		}, __("Actions"));

		frm.add_custom_button(__("Import FRT Labour Sheet"), () => {
			open_frt_import_modal(frm);
		}, __("Imports"));

		frm.add_custom_button(__("Import Service Packages"), () => {
			open_service_package_import_modal(frm);
		}, __("Imports"));

		frm.add_custom_button(__("Import Spare Parts Inventory"), () => {
			open_inventory_import_modal(frm);
		}, __("Imports"));

		frm.add_custom_button(__("Create Inventory Stock Reconciliation"), () => {
			open_inventory_stock_reconciliation_modal(frm);
		}, __("Actions"));

		frm.add_custom_button(__("Create Audit Stock Reconciliation"), () => {
			open_audit_stock_reconciliation_modal(frm);
		}, __("Actions"));

		frm.add_custom_button(__("Create Inventory Item Prices"), () => {
			open_inventory_item_price_modal(frm);
		}, __("Actions"));
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

function open_inventory_import_modal(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Import Spare Parts Inventory"),
		fields: [
			{
				fieldname: "inventory_file",
				label: __("Excel workbook (.xlsx)"),
				fieldtype: "Attach",
				reqd: 1,
				description: __(
					"Creates or updates ERP Items and Spare Parts from Part No, Part Name, Category, Location, and pricing columns"
				),
			},
		],
		primary_action_label: __("Import"),
		primary_action(values) {
			if (!values.inventory_file) {
				frappe.msgprint(__("Attach an Excel workbook first"));
				return;
			}
			d.hide();
			import_inventory_workbook(frm, values.inventory_file);
		},
	});
	d.show();
}

function import_inventory_workbook(frm, file_url) {
	frappe.call({
		method: "dms.api.inventory_import.import_inventory_stock",
		args: { file_url },
		freeze: true,
		freeze_message: __("Importing spare parts inventory…"),
		callback(r) {
			const summary = r.message;
			if (!summary) {
				return;
			}

			let msg = __("Inventory import completed!\n\n");
			msg += __("Rows processed: {0}\n", [summary.rows_processed || 0]);
			msg += __("Item groups created: {0}\n", [summary.item_groups_created || 0]);
			msg += __("Items created: {0}\n", [summary.items_created || 0]);
			msg += __("Existing items reused: {0}\n", [summary.items_reused || 0]);
			msg += __("Spare Parts created: {0}\n", [summary.spare_parts_created || 0]);
			msg += __("Spare Parts updated: {0}\n", [summary.spare_parts_updated || 0]);

			frappe.msgprint({
				title: __("Inventory Import Summary"),
				message: msg,
				indicator: "green",
			});
			frm.reload_doc();
		},
	});
}

function open_inventory_stock_reconciliation_modal(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Create Inventory Stock Reconciliation"),
		fields: [
			{
				fieldname: "inventory_file",
				label: __("Excel workbook (.xlsx)"),
				fieldtype: "Attach",
				reqd: 1,
			},
			{
				fieldname: "posting_date",
				label: __("Posting Date"),
				fieldtype: "Date",
				reqd: 1,
				default: frappe.datetime.get_today(),
			},
			{
				fieldname: "submit",
				label: __("Submit automatically"),
				fieldtype: "Check",
				default: 1,
				description: __("Warehouse is fixed to Service Center Addis Ababa - SM"),
			},
		],
		primary_action_label: __("Create"),
		primary_action(values) {
			if (!values.inventory_file) {
				frappe.msgprint(__("Attach an Excel workbook first"));
				return;
			}
			d.hide();
			create_inventory_stock_reconciliation(frm, values);
		},
	});
	d.show();
}

function create_inventory_stock_reconciliation(frm, values) {
	frappe.call({
		method: "dms.api.inventory_import.create_inventory_stock_reconciliation",
		args: {
			file_url: values.inventory_file,
			posting_date: values.posting_date,
			submit: values.submit || 0,
		},
		freeze: true,
		freeze_message: __("Creating stock reconciliation…"),
		callback(r) {
			const summary = r.message;
			if (!summary) {
				return;
			}

			let msg = __("Stock reconciliation created!\n\n");
			msg += __("Document: {0}\n", [summary.name || ""]);
			msg += __("Company: {0}\n", [summary.company || ""]);
			msg += __("Warehouse: {0}\n", [summary.warehouse || ""]);
			msg += __("Rows processed: {0}\n", [summary.rows_processed || 0]);
			if (summary.unique_items != null) {
				msg += __("Unique items created: {0}\n", [summary.unique_items]);
			}
			if (summary.duplicate_rows_merged) {
				msg += __("Duplicate rows merged: {0}\n", [summary.duplicate_rows_merged]);
			}
			msg += __("Submitted: {0}\n", [summary.docstatus === 1 ? __("Yes") : __("No")]);

			frappe.msgprint({
				title: __("Stock Reconciliation Summary"),
				message: msg,
				indicator: "green",
			});
			frm.reload_doc();
		},
	});
}

function open_audit_stock_reconciliation_modal(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Create Audit Stock Reconciliation"),
		fields: [
			{
				fieldname: "audit_file",
				label: __("Excel workbook (.xlsx)"),
				fieldtype: "Attach",
				reqd: 1,
				description: __(
					"Part No → Item Code, Part Name → Item Name, Physical Stock → Qty, Location → Spare Part Default Bin Location"
				),
			},
			{
				fieldname: "posting_date",
				label: __("Posting Date"),
				fieldtype: "Date",
				reqd: 1,
				default: frappe.datetime.get_today(),
			},
			{
				fieldname: "submit",
				label: __("Submit automatically"),
				fieldtype: "Check",
				default: 0,
				description: __(
					"Leave unchecked to save as draft. Warehouse is fixed to Service Center Addis Ababa - SM"
				),
			},
		],
		primary_action_label: __("Create"),
		primary_action(values) {
			if (!values.audit_file) {
				frappe.msgprint(__("Attach an Excel workbook first"));
				return;
			}
			d.hide();
			create_audit_stock_reconciliation(frm, values);
		},
	});
	d.show();
}

function create_audit_stock_reconciliation(frm, values) {
	frappe.call({
		method: "dms.api.inventory_import.create_audit_stock_reconciliation",
		args: {
			file_url: values.audit_file,
			posting_date: values.posting_date,
			submit: values.submit || 0,
		},
		freeze: true,
		freeze_message: __("Creating audit stock reconciliation…"),
		callback(r) {
			const summary = r.message;
			if (!summary) {
				return;
			}

			let msg = __("Audit stock reconciliation saved!\n\n");
			msg += __("Document: {0}\n", [summary.name || ""]);
			msg += __("Company: {0}\n", [summary.company || ""]);
			msg += __("Warehouse: {0}\n", [summary.warehouse || ""]);
			msg += __("Rows processed: {0}\n", [summary.rows_processed || 0]);
			if (summary.unique_items != null) {
				msg += __("Unique items: {0}\n", [summary.unique_items]);
			}
			if (summary.duplicate_rows_merged) {
				msg += __("Duplicate rows merged: {0}\n", [summary.duplicate_rows_merged]);
			}
			msg += __("Spare Part locations updated: {0}\n", [summary.locations_updated || 0]);
			if (summary.items_created) {
				msg += __("Items created: {0}\n", [summary.items_created]);
			}
			if (summary.spare_parts_created) {
				msg += __("Spare Parts created: {0}\n", [summary.spare_parts_created]);
			}
			if (summary.skipped_count) {
				msg += __("Skipped: {0}\n", [summary.skipped_count]);
			}
			msg += __("Submitted: {0}\n", [summary.docstatus === 1 ? __("Yes") : __("No")]);

			frappe.msgprint({
				title: __("Audit Stock Reconciliation Summary"),
				message: msg,
				indicator: summary.skipped_count ? "orange" : "green",
			});
			frm.reload_doc();
			if (summary.name) {
				frappe.set_route("Form", "Stock Reconciliation", summary.name);
			}
		},
	});
}

function open_inventory_item_price_modal(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Create Inventory Item Prices"),
		fields: [
			{
				fieldname: "inventory_file",
				label: __("Excel workbook (.xlsx)"),
				fieldtype: "Attach",
				reqd: 1,
			},
			{
				fieldname: "price_list",
				label: __("Price List"),
				fieldtype: "Link",
				options: "Price List",
				reqd: 1,
				description: __(
					"Retail Price from the workbook (ETB). Defaults to Ethiopia Local Sales."
				),
				get_query() {
					return {
						filters: {
							enabled: 1,
							selling: 1,
							currency: "ETB",
						},
					};
				},
			},
		],
		primary_action_label: __("Create Prices"),
		primary_action(values) {
			if (!values.inventory_file || !values.price_list) {
				frappe.msgprint(__("Attach the workbook and select a price list first"));
				return;
			}
			d.hide();
			create_inventory_item_prices(frm, values);
		},
	});

	frappe.call({
		method: "dms.api.inventory_import.get_inventory_price_list_default",
		callback(r) {
			if (r.message) {
				d.set_value("price_list", r.message);
			}
		},
	});

	d.show();
}

function create_inventory_item_prices(frm, values) {
	frappe.call({
		method: "dms.api.inventory_import.create_inventory_item_prices",
		args: {
			file_url: values.inventory_file,
			price_list: values.price_list,
		},
		freeze: true,
		freeze_message: __("Creating item prices…"),
		callback(r) {
			const summary = r.message;
			if (!summary) {
				return;
			}

			let msg = __("Item price creation completed!\n\n");
			msg += __("Rows processed: {0}\n", [summary.rows_processed || 0]);
			msg += __("Price List: {0}\n", [summary.price_list || ""]);
			msg += __("Currency: {0}\n", [summary.currency || "ETB"]);
			msg += __("Prices created: {0}\n", [summary.prices_created || 0]);
			msg += __("Prices updated: {0}\n", [summary.prices_updated || 0]);
			msg += __("Prices skipped: {0}\n", [summary.prices_skipped || 0]);

			frappe.msgprint({
				title: __("Inventory Item Price Summary"),
				message: msg,
				indicator: "green",
			});
			frm.reload_doc();
		},
	});
}

function backfill_vin_model_links(frm) {
	frappe.confirm(
		__(
			"Set the Model link on each VIN No from its model name or linked item? VINs that already have a model are skipped."
		),
		() => {
			frappe.call({
				method:
					"dms.dealer_management_system.doctype.dms_settings.dms_settings.backfill_vin_model_links_action",
				args: { dry_run: 0 },
				freeze: true,
				freeze_message: __("Linking VIN models…"),
				callback(r) {
					const summary = r.message;
					if (!summary) {
						return;
					}

					let msg = __("VIN model linking completed!\n\n");
					msg += __("Total VINs: {0}\n", [summary.total_vins || 0]);
					msg += __("Already linked: {0}\n", [summary.already_linked || 0]);
					msg += __("Updated: {0}\n", [summary.updated || 0]);
					msg += __("Unmatched: {0}\n", [summary.unmatched_count || 0]);

					if (summary.preview?.length) {
						msg += "\n" + __("Sample updates:") + "\n";
						summary.preview.forEach((row) => {
							msg += `- ${row.name}: ${row.model_name || row.linked_item || ""} → ${row.vehicle_model}\n`;
						});
					}

					if (summary.unmatched_preview?.length) {
						msg += "\n" + __("Sample unmatched:") + "\n";
						summary.unmatched_preview.forEach((row) => {
							msg += `- ${row.name}: ${row.model_name || row.linked_item || ""}\n`;
						});
					}

					frappe.msgprint({
						title: __("Link VIN Models Summary"),
						message: msg,
						indicator: summary.unmatched_count ? "orange" : "green",
					});
					frm.reload_doc();
				},
			});
		}
	);
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