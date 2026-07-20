// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

const RATING_LABELS = {
	1: "1 - Very Unsatisfied",
	2: "2 - Unsatisfied",
	3: "3 - Neutral",
	4: "4 - Satisfied",
	5: "5 - Very Satisfied",
};

function scoreFromLabel(label) {
	if (!label) return 0;
	const m = String(label).trim().match(/^(\d+)/);
	return m ? cint(m[1]) : 0;
}

frappe.ui.form.on("Customer Follow Up", {
	customer_rating(frm) {
		const score = scoreFromLabel(frm.doc.customer_rating);
		if (score >= 1 && score <= 5) {
			frm.set_value("customer_rating_score", score);
		}
	},
	customer_rating_score(frm) {
		const score = cint(frm.doc.customer_rating_score);
		if (score >= 1 && score <= 5 && RATING_LABELS[score]) {
			if (frm.doc.customer_rating !== RATING_LABELS[score]) {
				frm.set_value("customer_rating", RATING_LABELS[score]);
			}
		}
	},
	refresh(frm) {
		if (!frm.doc.customer_rating_score && frm.doc.customer_rating) {
			const score = scoreFromLabel(frm.doc.customer_rating);
			if (score) frm.set_value("customer_rating_score", score);
		}
	},
});
