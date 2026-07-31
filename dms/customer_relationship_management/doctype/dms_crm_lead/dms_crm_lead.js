// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

function calculate_lead_item(frm, cdt, cdn) {
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

async function update_trade_in_currency_label(frm) {
	const company = frm.doc.company;
	let symbol = "";
	if (company) {
		const currency = await frappe.db.get_value("Company", company, "default_currency");
		const code = currency?.message?.default_currency;
		if (code) {
			const cur = await frappe.db.get_value("Currency", code, "symbol");
			symbol = cur?.message?.symbol || code;
		}
	}
	const label = symbol ? __("Expected Value ({0})", [symbol]) : __("Expected Value");
	frm.set_df_property("trade_in_expected_value", "label", label);
}

frappe.ui.form.on("DMS CRM Lead", {
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
		update_trade_in_currency_label(frm);
	},

	company(frm) {
		update_trade_in_currency_label(frm);
		if (frm.doc.branch) {
			frm.set_value("branch", "");
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

frappe.ui.form.on("DMS CRM Lead Item", {
	items_add(frm, cdt, cdn) {
		calculate_lead_item(frm, cdt, cdn);
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
		calculate_lead_item(frm, cdt, cdn);
	},

	qty(frm, cdt, cdn) {
		calculate_lead_item(frm, cdt, cdn);
	},

	rate(frm, cdt, cdn) {
		calculate_lead_item(frm, cdt, cdn);
	},

	discount_percentage(frm, cdt, cdn) {
		calculate_lead_item(frm, cdt, cdn);
	},
});
