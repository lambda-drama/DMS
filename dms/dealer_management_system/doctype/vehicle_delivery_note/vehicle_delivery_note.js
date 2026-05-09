// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

/** Inner toolbar grouped dropdown beside Save */
const ACTIONS_GROUP = __("Action");

frappe.ui.form.on("Vehicle Delivery Note", {
	refresh(frm) {
		add_delivery_note_sales_invoice_button(frm);
	},
});

function add_delivery_note_sales_invoice_button(frm) {
	if (frm.is_new() || !frm.doc.job_card) {
		return;
	}

	if (!frappe.model.can_read("DMS Job Card")) {
		return;
	}

	frappe.db
		.get_value(
			"DMS Job Card",
			frm.doc.job_card,
			["docstatus", "invoice"]
		)
		.then((r) => {
			const jc = r.message || {};
			const jc_invoice = jc.invoice || frm.doc.sales_invoice || "";

			if (jc_invoice) {
				if (frappe.model.can_read("Sales Invoice")) {
					frm.add_custom_button(
						__("Sales Invoice"),
						() => {
							frappe.set_route("Form", "Sales Invoice", jc_invoice);
						},
						ACTIONS_GROUP
					);
				}
				add_delivery_note_sales_invoice_payment_action(frm, jc_invoice);
				return;
			}

			if (!frappe.model.can_create("Sales Invoice")) {
				return;
			}

			if (cint(jc.docstatus) !== 1) {
				return;
			}

			if (frm.doc.sales_invoice) {
				return;
			}

			frm.add_custom_button(
				__("Create Sales Invoice"),
				() => {
					frappe.confirm(
						__(
							"Create a draft Sales Invoice from this vehicle delivery note? Billing is locked to one invoice per job — if one was already created on the Job Card, this action will stop."
						),
						() => {
							frappe.call({
								method:
									"dms.dealer_management_system.doctype.vehicle_delivery_note.vehicle_delivery_note.make_sales_invoice_from_delivery_note",
								args: { delivery_note: frm.doc.name },
								freeze: true,
								callback: (res) => {
									const si = res.message;
									if (si) {
										frappe.set_route("Form", "Sales Invoice", si);
									}
								},
							});
						}
					);
				},
				ACTIONS_GROUP
			);
		});
}

function add_delivery_note_sales_invoice_payment_action(frm, sales_invoice_name) {
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
					open_payment_entry_from_sales_invoice_delivery(sales_invoice_name);
				},
				ACTIONS_GROUP
			);
		});
}

function open_payment_entry_from_sales_invoice_delivery(sales_invoice) {
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
