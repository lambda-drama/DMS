// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

function scoreToLabel(score) {
	const n = cint(score);
	if (n >= 4) return "Happy";
	if (n === 3) return "Neutral";
	if (n >= 1) return "Unhappy";
	return "";
}

function labelToScore(label) {
	const s = (label || "").trim().toLowerCase();
	if (s === "happy") return 5;
	if (s === "neutral") return 3;
	if (s === "unhappy") return 1;
	return 0;
}

frappe.ui.form.on("Vehicle Delivery Note", {
	customer_satisfaction_score(frm) {
		const score = cint(frm.doc.customer_satisfaction_score);
		const label = scoreToLabel(score);
		if (label && frm.doc.customer_satisfaction_initial !== label) {
			frm.set_value("customer_satisfaction_initial", label);
		}
	},
	customer_satisfaction_initial(frm) {
		const score = labelToScore(frm.doc.customer_satisfaction_initial);
		if (score && cint(frm.doc.customer_satisfaction_score) !== score) {
			frm.set_value("customer_satisfaction_score", score);
		}
	},
	refresh(frm) {
		if (!frm.doc.customer_satisfaction_score && frm.doc.customer_satisfaction_initial) {
			const score = labelToScore(frm.doc.customer_satisfaction_initial);
			if (score) frm.set_value("customer_satisfaction_score", score);
		}
	},
});
