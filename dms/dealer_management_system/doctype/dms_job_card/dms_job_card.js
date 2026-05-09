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
	frm.dashboard.set_indicator(
		__("QC: {0} Pass, {1} Fail, {2} N/A", [pass_count, fail_count, na_count]),
		fail_count > 0 ? "red" : "green"
	);
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
