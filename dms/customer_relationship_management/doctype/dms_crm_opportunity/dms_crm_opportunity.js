// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

function calculate_opportunity_item(frm, cdt, cdn) {
	const row = frappe.get_doc(cdt, cdn);
	const qty = Math.max(flt(row.qty), 0);
	const rate = Math.max(flt(row.rate), 0);
	const discount_percentage = Math.min(Math.max(flt(row.discount_percentage), 0), 100);
	const amount = qty * rate;
	const discount_amount = (amount * discount_percentage) / 100;

	frappe.model.set_value(cdt, cdn, {
		amount,
		discount_amount,
		net_amount: amount - discount_amount,
	});
	frm.trigger("update_item_totals");
}

frappe.ui.form.on("DMS CRM Opportunity", {
	setup(frm) {
		frm.set_query("company", () => ({
			query: "dms.crm_api.common.company_link_query",
		}));
		frm.set_query("branch", () => ({
			query: "dms.crm_api.common.branch_link_query",
			filters: { company: frm.doc.company || "" },
		}));
		frm.set_query("model", () => ({
			filters: {
				is_active: 1,
				...(frm.doc.brand ? { brand: frm.doc.brand } : {}),
			},
		}));
	},

	refresh(frm) {
		frm.trigger("update_item_totals");
		if (frm.is_new()) return;

		const can_quote =
			["Won", "Booking / Deposit", "Order Confirmed", "Quotation Submitted", "Negotiation"].includes(
				frm.doc.stage,
			) || frm.doc.status === "Won";

		if (can_quote) {
			frm.add_custom_button(__("Create Quotation"), () => {
				frappe.call({
					method: "dms.crm_api.opportunities.create_quotation_from_opportunity",
					args: { name: frm.doc.name },
					freeze: true,
					freeze_message: __("Creating Quotation…"),
					callback(r) {
						if (!r.message) return;
						frm.reload_doc();
						frappe.set_route("Form", "Quotation", r.message.quotation);
					},
				});
			}).addClass("btn-primary");
		}

		if (frm.doc.quotation) {
			frm.add_custom_button(__("Open Quotation"), () => {
				frappe.set_route("Form", "Quotation", frm.doc.quotation);
			});
		}
	},

	company(frm) {
		if (frm.doc.branch) {
			frm.set_value("branch", "");
		}
		if (frm.doc.company && !frm.doc.currency) {
			frappe.db.get_value("Company", frm.doc.company, "default_currency").then(({ message }) => {
				if (message?.default_currency) {
					frm.set_value("currency", message.default_currency);
				}
			});
		}
	},

	brand(frm) {
		if (frm.doc.model) {
			frappe.db.get_value("Vehicle Model", frm.doc.model, "brand").then(({ message }) => {
				if (message?.brand && frm.doc.brand && message.brand !== frm.doc.brand) {
					frm.set_value("model", "");
					frm.set_value("variant", "");
				}
			});
		}
	},

	async model(frm) {
		if (!frm.doc.model) return;
		const { message } = await frappe.db.get_value(
			"Vehicle Model",
			frm.doc.model,
			["brand", "variant"],
		);
		if (!message) return;
		if (message.brand && !frm.doc.brand) {
			frm.set_value("brand", message.brand);
		}
		if (message.variant && !frm.doc.variant) {
			frm.set_value("variant", message.variant);
		}
	},

	update_item_totals(frm) {
		let total = 0;
		let net_total = 0;

		(frm.doc.items || []).forEach((row) => {
			total += flt(row.amount);
			net_total += flt(row.net_amount);
		});

		frm.set_value("total", total);
		frm.set_value("net_total", net_total);
	},
});

frappe.ui.form.on("DMS CRM Opportunity Item", {
	items_add(frm, cdt, cdn) {
		calculate_opportunity_item(frm, cdt, cdn);
	},

	items_remove(frm) {
		frm.trigger("update_item_totals");
	},

	async item_code(frm, cdt, cdn) {
		const row = frappe.get_doc(cdt, cdn);
		if (!row.item_code) return;

		const { message } = await frappe.db.get_value(
			"Item",
			row.item_code,
			["item_name", "stock_uom", "standard_rate"],
		);
		if (!message) return;

		await frappe.model.set_value(cdt, cdn, {
			item_name: message.item_name,
			uom: message.stock_uom,
			rate: flt(row.rate) || flt(message.standard_rate),
		});
		calculate_opportunity_item(frm, cdt, cdn);
	},

	qty(frm, cdt, cdn) {
		calculate_opportunity_item(frm, cdt, cdn);
	},

	rate(frm, cdt, cdn) {
		calculate_opportunity_item(frm, cdt, cdn);
	},

	discount_percentage(frm, cdt, cdn) {
		calculate_opportunity_item(frm, cdt, cdn);
	},
});
