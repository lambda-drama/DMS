// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on("DMS Job Card", {
	qc_checklist_template(frm) {
		if (!frm.doc.qc_checklist_template) {
			frm._dms_prev_qc_template = "";
			return;
		}
		const rows = frm.doc.qc_results || [];
		const previous = frm._dms_prev_qc_template;
		if (rows.length) {
			frappe.confirm(
				__("Replace existing QC Results with lines from this template?"),
				() =>
					populate_qc_results_from_template(frm, { force: true }).then(() => {
						frm._dms_prev_qc_template = frm.doc.qc_checklist_template;
					}),
				() => {
					frappe.model.set_value(
						frm.doctype,
						frm.doc.name,
						"qc_checklist_template",
						previous || ""
					);
				}
			);
			return;
		}
		populate_qc_results_from_template(frm).then(() => {
			frm._dms_prev_qc_template = frm.doc.qc_checklist_template;
		});
	},

	onload_post_render(frm) {
		if (
			frm.is_new() &&
			frm.doc.qc_checklist_template &&
			!(frm.doc.qc_results || []).length
		) {
			populate_qc_results_from_template(frm, { silent: true }).then(() => {
				frm._dms_prev_qc_template = frm.doc.qc_checklist_template || "";
			});
		}
	},

	refresh(frm) {
		if (frm._dms_prev_qc_template === undefined) {
			frm._dms_prev_qc_template = frm.doc.qc_checklist_template || "";
		}
		add_vehicle_delivery_button(frm);
		add_sales_invoice_button(frm);
		refresh_qc_dashboard(frm);
	},
});

function populate_qc_results_from_template(frm, opts = {}) {
	const silent = opts.silent;
	const force = opts.force;
	if (!frm.doc.qc_checklist_template) {
		return Promise.resolve();
	}

	const existing = frm.doc.qc_results || [];
	if (existing.length && !force) {
		return Promise.resolve();
	}

	return frappe.db
		.get_doc("QC Checklist Template", frm.doc.qc_checklist_template)
		.then(async (template) => {
			const rows = template.checklist_items || [];
			if (!rows.length) {
				frappe.msgprint(__("This QC Checklist Template has no lines in Checklist Items."));
				return;
			}

			frm.clear_table("qc_results");
			for (const item of rows) {
				let text = item.check_item;
				if (item.check_item) {
					const { message: m } = await frappe.db.get_value(
						"QC Checklist Item Master",
						item.check_item,
						"qc_checklist_item"
					);
					if (m?.qc_checklist_item) {
						text = m.qc_checklist_item;
					}
				}
				const row = frm.add_child("qc_results");
				row.check_item_text = text || "";
				row.category = item.category;
				row.is_mandatory = item.is_mandatory;
				row.requires_photo = item.requires_photo;
				row.requires_measurement = item.requires_measurement;
				if (cint(item.requires_measurement)) {
					row.min_value = item.min_value;
					row.max_value = item.max_value;
				}
				row.result = "Pass";
			}
			frm.refresh_field("qc_results");

			if (!silent) {
				frappe.show_alert(__("QC checklist lines added to QC Results."), 5);
			}
		});
}

function refresh_qc_dashboard(frm) {
	const results = frm.doc.qc_results || [];
	if (!results.length) {
		return;
	}

	const mandatory_fails = results.filter(
		(row) => cint(row.is_mandatory) === 1 && row.result === "Fail"
	);
	if (mandatory_fails.length && frm.doc.status === "QC In Progress") {
		frm.dashboard.set_headline_alert(
			__(
				"{0} mandatory QC item(s) failed. Resolve before completing the job.",
				[mandatory_fails.length]
			)
		);
	}

	const pass_count = results.filter((row) => row.result === "Pass").length;
	const fail_count = results.filter((row) => row.result === "Fail").length;
	const na_count = results.filter((row) => row.result === "N/A").length;
	frm.dashboard.add_indicator(
		__("QC: {0} Pass, {1} Fail, {2} N/A", [pass_count, fail_count, na_count]),
		fail_count > 0 ? "red" : "green"
	);
}

const VEHICLE_DELIVERY_NOTE_DOCTYPE = "Vehicle Delivery Note";

/** Inner toolbar grouped dropdown beside Save */
const ACTIONS_GROUP = __("Action");

function add_sales_invoice_button(frm) {
	if (frm.doc.docstatus !== 1 || frm.is_new()) {
		return;
	}
	if (!frappe.model.can_read("DMS Job Card")) {
		return;
	}

	if (frm.doc.invoice) {
		if (frappe.model.can_read("Sales Invoice")) {
			frm.add_custom_button(
				__("Sales Invoice"),
				() => {
					frappe.set_route("Form", "Sales Invoice", frm.doc.invoice);
				},
				ACTIONS_GROUP
			);
		}
		add_sales_invoice_payment_action(frm, frm.doc.invoice);
		return;
	}

	if (!frappe.model.can_create("Sales Invoice")) {
		return;
	}

	frm.add_custom_button(
		__("Create Sales Invoice"),
		() => {
			frappe.confirm(
				__(
					"Create a draft Sales Invoice from this job card? Billing is locked to one invoice per job — you cannot create another from Vehicle Delivery Note."
				),
				() => {
					frappe.call({
						method:
							"dms.dealer_management_system.doctype.dms_job_card.dms_job_card.make_sales_invoice_from_job_card",
						args: { job_card: frm.doc.name },
						freeze: true,
						callback: (r) => {
							const name = r.message;
							if (name) {
								frappe.set_route("Form", "Sales Invoice", name);
							}
						},
					});
				}
			);
		},
		ACTIONS_GROUP
	);
}

/** Same logic as ERPNext Sales Invoice toolbar: Payment Entry when billed and unpaid. */
function add_sales_invoice_payment_action(frm, sales_invoice_name) {
	if (!sales_invoice_name || !frappe.model.can_create("Payment Entry")) {
		return;
	}

	frappe.db
		.get_value("Sales Invoice", sales_invoice_name, ["docstatus", "outstanding_amount"])
		.then((r) => {
			const m = r.message || {};
			if (cint(m.docstatus) !== 1) {
				return;
			}
			if (!flt(m.outstanding_amount)) {
				return;
			}
			frm.add_custom_button(
				__("Payment"),
				() => {
					open_payment_entry_from_sales_invoice(sales_invoice_name);
				},
				ACTIONS_GROUP
			);
		});
}

function open_payment_entry_from_sales_invoice(sales_invoice) {
	frappe.db
		.get_value("Sales Invoice", sales_invoice, ["docstatus", "outstanding_amount"])
		.then((r) => {
			const m = r.message || {};
			if (cint(m.docstatus) !== 1) {
				frappe.msgprint(__("Submit the Sales Invoice before recording payment."));
				return;
			}
			if (!flt(m.outstanding_amount)) {
				frappe.msgprint(__("This invoice has nothing left to allocate as payment."));
				return;
			}
			frappe.call({
				method: "erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry",
				args: { dt: "Sales Invoice", dn: sales_invoice },
				freeze: true,
				callback: (res) => {
					const doclist = frappe.model.sync(res.message);
					if (doclist && doclist.length) {
						frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
					}
				},
			});
		});
}

function add_vehicle_delivery_button(frm) {
	if (frm.doc.docstatus !== 1) {
		return;
	}

	const can_read_delivery = frappe.model.can_read(VEHICLE_DELIVERY_NOTE_DOCTYPE);
	const can_create_delivery = frappe.model.can_create(VEHICLE_DELIVERY_NOTE_DOCTYPE);

	if (!can_read_delivery && !can_create_delivery) {
		return;
	}

	frm.add_custom_button(
		__("Vehicle Delivery Note"),
		() => {
			open_or_create_vehicle_delivery(frm);
		},
		ACTIONS_GROUP
	);
}

function open_or_create_vehicle_delivery(frm) {
	const can_read_delivery = frappe.model.can_read(VEHICLE_DELIVERY_NOTE_DOCTYPE);
	const can_create_delivery = frappe.model.can_create(VEHICLE_DELIVERY_NOTE_DOCTYPE);

	if (!can_read_delivery && !can_create_delivery) {
		return;
	}

	frappe.db
		.get_list(VEHICLE_DELIVERY_NOTE_DOCTYPE, {
			filters: { job_card: frm.doc.name },
			fields: ["name"],
			order_by: "creation desc",
			limit: 1,
		})
		.then((rows) => {
			const existing = rows && rows.length ? rows[0].name : null;

			if (existing) {
				if (!can_read_delivery) {
					frappe.throw(__("You do not have permission to read Vehicle Delivery Note."));
				}
				frappe.set_route("Form", VEHICLE_DELIVERY_NOTE_DOCTYPE, existing);
				return;
			}

			if (!can_create_delivery) {
				frappe.msgprint(
					__(
						"There is no Vehicle Delivery Note linked to this job card yet. You do not have permission to create one."
					)
				);
				return;
			}

			const opts = {
				job_card: frm.doc.name,
			};

			const odo = frm.doc.final_odometer ?? frm.doc.current_odometer;
			if (odo !== undefined && odo !== null && odo !== "") {
				opts.final_odometer_km = cint(odo);
			}

			if (
				frm.doc.next_service_due_km !== undefined &&
				frm.doc.next_service_due_km !== null &&
				frm.doc.next_service_due_km !== ""
			) {
				opts.next_service_due_km = cint(frm.doc.next_service_due_km);
			}

			if (frm.doc.next_service_due_date) {
				opts.next_service_due_date = frm.doc.next_service_due_date;
			}

			frappe.route_options = opts;
			frappe.set_route("Form", VEHICLE_DELIVERY_NOTE_DOCTYPE, "new");
		})
		.catch(() => {
			// get_list denied or failed; surface only when user actually clicked
			frappe.msgprint(__("Unable to check for an existing Vehicle Delivery Note."));
		});
}

frappe.ui.form.on("Job Card QC Result", {
	measurement_value(frm, cdt, cdn) {
		const row = frappe.get_doc(cdt, cdn);
		if (!cint(row.requires_measurement)) {
			return;
		}
		if (row.measurement_value == null || row.measurement_value === "") {
			return;
		}

		let pass = true;
		if (row.min_value != null && row.measurement_value < row.min_value) {
			pass = false;
		}
		if (row.max_value != null && row.measurement_value > row.max_value) {
			pass = false;
		}

		if (!pass) {
			frappe.model.set_value(cdt, cdn, "result", "Fail");
			frappe.msgprint(
				__(
					"Measurement {0} is outside the allowed range for this checklist item.",
					[row.measurement_value]
				)
			);
		}
	},

	result(frm, cdt, cdn) {
		const row = frappe.get_doc(cdt, cdn);
		if (row.result !== "Fail" || !cint(row.is_mandatory)) {
			return;
		}
		if (frm.doc.status === "QC In Progress") {
			frappe.model.set_value(frm.doctype, frm.doc.name, "status", "QC Failed");
			frappe.model.set_value(frm.doctype, frm.doc.name, "qc_result", "Fail");
		}
	},
});
