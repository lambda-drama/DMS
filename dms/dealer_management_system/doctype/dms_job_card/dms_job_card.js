// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

// Timer variables
let timer_interval = null;
let timer_display_div = null;

// ============================================================
// HELPER: Save multiple fields on a submitted document
// Uses frappe.client.set_value for each field to avoid
// the docstatus 1→0 transition error that frm.save() causes
// ============================================================
function save_submitted_doc(frm, field_map, callback) {
    const doctype = frm.doctype;
    const docname = frm.doc.name;

    const entries = Object.entries(field_map);

    // Apply all values locally first so the UI reflects them immediately
    entries.forEach(([fieldname, value]) => {
        frappe.model.set_value(doctype, docname, fieldname, value);
    });

    // Build sequential set_value calls
    const set_next = (index) => {
        if (index >= entries.length) {
            // All fields saved — reload the form so buttons re-render correctly
            frm.reload_doc();
            if (callback) callback();
            return;
        }
        const [fieldname, value] = entries[index];
        frappe.call({
            method: "frappe.client.set_value",
            args: { doctype, name: docname, fieldname, value },
            callback: () => set_next(index + 1),
            error: (err) => {
                frappe.msgprint(__("Failed to save field {0}: {1}", [fieldname, err.message || ""]));
            }
        });
    };

    set_next(0);
}

// ============================================================
// MAIN FORM EVENTS
// ============================================================
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
        add_status_flow_buttons(frm);

        frm._scheduling_modal_open = false;

        if (frm.doc.status === "Repair In Progress") {
            start_timer_display(frm);
        }
    },

    customer_approval_status(frm) {
        if (
            frm.doc.customer_approval_status === "Approved" &&
            frm.doc.status === "Estimation Pending"
        ) {
            save_submitted_doc(frm, { status: "Estimation Approved" }, () => {
                frappe.show_alert("Estimation Approved. Ready for workshop scheduling.", 5);
            });
        }
    }
});

// ============================================================
// QC RESULTS POPULATION
// ============================================================
function populate_qc_results_from_template(frm, opts = {}) {
    const { silent, force } = opts;
    if (!frm.doc.qc_checklist_template) return Promise.resolve();

    const existing = frm.doc.qc_results || [];
    if (existing.length && !force) return Promise.resolve();

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
                    if (m?.qc_checklist_item) text = m.qc_checklist_item;
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
            if (!silent) frappe.show_alert("QC checklist lines added to QC Results.", 5);
        });
}

function refresh_qc_dashboard(frm) {
    const results = frm.doc.qc_results || [];
    if (!results.length) return;

    const mandatory_fails = results.filter(
        (row) => cint(row.is_mandatory) === 1 && row.result === "Fail"
    );
    if (mandatory_fails.length && frm.doc.status === "QC In Progress") {
        frm.dashboard.set_headline_alert(
            __("{0} mandatory QC item(s) failed. Resolve before completing the job.", [
                mandatory_fails.length
            ])
        );
    }

    const pass_count = results.filter((r) => r.result === "Pass").length;
    const fail_count = results.filter((r) => r.result === "Fail").length;
    const na_count = results.filter((r) => r.result === "N/A").length;
    frm.dashboard.add_indicator(
        __("QC: {0} Pass, {1} Fail, {2} N/A", [pass_count, fail_count, na_count]),
        fail_count > 0 ? "red" : "green"
    );
}

// ============================================================
// VEHICLE DELIVERY & SALES INVOICE
// ============================================================
const VEHICLE_DELIVERY_NOTE_DOCTYPE = "Vehicle Delivery Note";
const ACTIONS_GROUP = __("Action");

function add_sales_invoice_button(frm) {
    if (frm.doc.docstatus !== 1 || frm.is_new() || frm.doc.status !== "Completed") return;
    if (!frappe.model.can_read("DMS Job Card")) return;

    if (frm.doc.invoice) {
        if (frappe.model.can_read("Sales Invoice")) {
            frm.add_custom_button(
                __("Sales Invoice"),
                () => frappe.set_route("Form", "Sales Invoice", frm.doc.invoice),
                ACTIONS_GROUP
            );
        }
        add_sales_invoice_payment_action(frm, frm.doc.invoice);
        return;
    }

    if (!frappe.model.can_create("Sales Invoice")) return;

    frm.add_custom_button(
        __("Create Sales Invoice"),
        () => {
            frappe.confirm(__("Create a draft Sales Invoice from this job card?"), () => {
                frappe.call({
                    method: "dms.dealer_management_system.doctype.dms_job_card.dms_job_card.make_sales_invoice_from_job_card",
                    args: { job_card: frm.doc.name },
                    freeze: true,
                    callback: (r) => {
                        if (r.message) frappe.set_route("Form", "Sales Invoice", r.message);
                    }
                });
            });
        },
        ACTIONS_GROUP
    );
}

function add_sales_invoice_payment_action(frm, sales_invoice_name) {
    if (!sales_invoice_name || !frappe.model.can_create("Payment Entry")) return;

    frappe.db
        .get_value("Sales Invoice", sales_invoice_name, ["docstatus", "outstanding_amount"])
        .then((r) => {
            const m = r.message || {};
            if (cint(m.docstatus) !== 1 || !flt(m.outstanding_amount)) return;
            frm.add_custom_button(
                __("Payment"),
                () => open_payment_entry_from_sales_invoice(sales_invoice_name),
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
                    if (doclist?.length) {
                        frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
                    }
                }
            });
        });
}

function add_vehicle_delivery_button(frm) {
    if (frm.doc.docstatus !== 1 || frm.doc.status !== "Completed") return;
    if (!frappe.model.can_read(VEHICLE_DELIVERY_NOTE_DOCTYPE) &&
        !frappe.model.can_create(VEHICLE_DELIVERY_NOTE_DOCTYPE)) return;

    frm.add_custom_button(
        __("Vehicle Delivery Note"),
        () => open_or_create_vehicle_delivery(frm),
        ACTIONS_GROUP
    );
}

function open_or_create_vehicle_delivery(frm) {
    const can_read = frappe.model.can_read(VEHICLE_DELIVERY_NOTE_DOCTYPE);
    const can_create = frappe.model.can_create(VEHICLE_DELIVERY_NOTE_DOCTYPE);
    if (!can_read && !can_create) return;

    frappe.db
        .get_list(VEHICLE_DELIVERY_NOTE_DOCTYPE, {
            filters: { job_card: frm.doc.name },
            fields: ["name"],
            order_by: "creation desc",
            limit: 1
        })
        .then((rows) => {
            const existing = rows?.length ? rows[0].name : null;
            if (existing) {
                if (!can_read) frappe.throw(__("You do not have permission to read Vehicle Delivery Note."));
                frappe.set_route("Form", VEHICLE_DELIVERY_NOTE_DOCTYPE, existing);
                return;
            }
            if (!can_create) {
                frappe.msgprint(__("No Vehicle Delivery Note linked. You do not have permission to create one."));
                return;
            }
            const opts = { job_card: frm.doc.name };
            const odo = frm.doc.final_odometer ?? frm.doc.current_odometer;
            if (odo != null && odo !== "") opts.final_odometer_km = cint(odo);
            if (frm.doc.next_service_due_km != null && frm.doc.next_service_due_km !== "")
                opts.next_service_due_km = cint(frm.doc.next_service_due_km);
            if (frm.doc.next_service_due_date) opts.next_service_due_date = frm.doc.next_service_due_date;

            frappe.route_options = opts;
            frappe.set_route("Form", VEHICLE_DELIVERY_NOTE_DOCTYPE, "new");
        })
        .catch(() => frappe.msgprint(__("Unable to check for an existing Vehicle Delivery Note.")));
}

// ============================================================
// QC RESULT ROW HANDLERS
// ============================================================
frappe.ui.form.on("Job Card QC Result", {
    measurement_value(frm, cdt, cdn) {
        const row = frappe.get_doc(cdt, cdn);
        if (!cint(row.requires_measurement) || row.measurement_value == null || row.measurement_value === "") return;

        let pass = true;
        if (row.min_value != null && row.measurement_value < row.min_value) pass = false;
        if (row.max_value != null && row.measurement_value > row.max_value) pass = false;

        if (!pass) {
            frappe.model.set_value(cdt, cdn, "result", "Fail");
            frappe.msgprint(__("Measurement {0} is outside the allowed range.", [row.measurement_value]));
        }
    },

    result(frm, cdt, cdn) {
        const row = frappe.get_doc(cdt, cdn);
        if (row.result !== "Fail" || !cint(row.is_mandatory)) return;
        if (frm.doc.status === "QC In Progress") {
            frappe.model.set_value(frm.doctype, frm.doc.name, "qc_result", "Fail");
        }
    }
});

// ============================================================
// STATUS FLOW BUTTONS
// ============================================================
function add_status_flow_buttons(frm) {
    if (frm.doc.docstatus !== 1) return;

    const status = frm.doc.status;

    if (status === "Draft") {
        frm.add_custom_button(__("Submit for Estimation"), () => {
            save_submitted_doc(frm, { status: "Estimation Pending" }, () => {
                frappe.show_alert("Job Card sent for estimation.", 3);
            });
        }, __("Status"));
    }

    if (status === "Estimation Approved") {
        frm.add_custom_button(__("Schedule Workshop"), () => {
            open_scheduling_modal(frm);
        }, __("Workshop"));
    }

    if (status === "Scheduled") {
        frm.add_custom_button(__("Start Repair"), () => {
            start_repair(frm);
        }, __("Workshop"));
    }

    if (status === "Repair In Progress") {
        frm.add_custom_button(__("Pause Repair"), () => {
            pause_repair(frm);
        }, __("Workshop"));

        frm.add_custom_button(__("Complete Repair"), () => {
            stop_repair(frm);
        }, __("Workshop"));
    }

    if (status === "Waiting Parts") {
        frm.add_custom_button(__("Parts Arrived"), () => {
            save_submitted_doc(frm, { status: "Repair In Progress" }, () => {
                frappe.show_alert("Repair resumed.", 3);
            });
        }, __("Workshop"));
    }

    if (status === "Waiting Customer Approval") {
        frm.add_custom_button(__("Customer Approved"), () => {
            save_submitted_doc(frm, { status: "Repair In Progress" }, () => {
                frappe.show_alert("Repair resumed.", 3);
            });
        }, __("Approval"));
    }

    if (status === "Repair Completed") {
        frm.add_custom_button(__("QC Check"), () => {
            save_submitted_doc(frm, { status: "QC In Progress" }, () => {
                frappe.show_alert("QC inspection started.", 3);
            });
        }, __("Quality"));
    }

    if (status === "QC In Progress") {
        frm.add_custom_button(__("Pass QC"), () => {
            save_submitted_doc(frm, {
                qc_result: "Pass",
                status: "Completed",
                qc_checked_date: frappe.datetime.now_datetime(),
                qc_inspector: frappe.session.user
            }, () => {
                frappe.show_alert("QC Passed. Job Completed.", 3);
            });
        }, __("Quality"));

        frm.add_custom_button(__("Fail QC"), () => {
            frappe.prompt(
                { fieldname: "fail_reason", label: __("Failure Reason"), fieldtype: "Small Text", reqd: 1 },
                (values) => {
                    save_submitted_doc(frm, {
                        qc_result: "Fail",
                        qc_fail_reason: values.fail_reason,
                        status: "Rework",
                        rework_required: 1
                    }, () => {
                        frappe.show_alert("QC Failed. Sent back for rework.", 3);
                    });
                },
                __("QC Failure Reason"),
                __("Submit")
            );
        }, __("Quality"));
    }

    if (status === "Rework") {
        frm.add_custom_button(__("Rework Completed"), () => {
            save_submitted_doc(frm, { status: "Repair Completed" }, () => {
                frappe.show_alert("Rework completed. Ready for QC re-check.", 3);
            });
        }, __("Workshop"));
    }

}

// ============================================================
// SCHEDULING MODAL
// ============================================================
function open_scheduling_modal(frm) {
    if (frm._scheduling_modal_open) return;
    frm._scheduling_modal_open = true;

    const d = new frappe.ui.Dialog({
        title: __("Schedule Workshop"),
        fields: [
            {
                fieldname: "schedule_start_time",
                label: __("Start Time"),
                fieldtype: "Datetime",
                reqd: 1,
                default: frappe.datetime.now_datetime()
            },
            {
                fieldname: "schedule_end_time",
                label: __("End Time"),
                fieldtype: "Datetime",
                reqd: 1,
                default: frappe.datetime.add_days(frappe.datetime.now_datetime(), 1)
            },
            {
                fieldname: "assigned_bay",
                label: __("Service Bay"),
                fieldtype: "Link",
                options: "Service Bay",
                reqd: 1
            },
            {
                fieldname: "lead_technician",
                label: __("Lead Technician"),
                fieldtype: "Link",
                options: "Technician",
                reqd: 1
            }
        ],
        primary_action_label: __("Schedule"),
        primary_action(values) {
            d.hide();
            frm._scheduling_modal_open = false;

            save_submitted_doc(frm, {
                schedule_start_time: values.schedule_start_time,
                schedule_end_time: values.schedule_end_time,
                assigned_bay: values.assigned_bay,
                lead_technician: values.lead_technician,
                status: "Scheduled"
            }, () => {
                frappe.show_alert("Workshop scheduled.", 3);
            });
        }
    });

    d.on_hide = () => { frm._scheduling_modal_open = false; };
    d.show();
}

// ============================================================
// REPAIR TIMER & TIME LOGS
// ============================================================
function start_repair(frm) {
    frappe.confirm("Start repair work? This will begin timing for assigned technicians.", () => {
        const technicians = [];
        if (frm.doc.lead_technician) technicians.push(frm.doc.lead_technician);
        (frm.doc.assistant_technicians || []).forEach(tech => {
            if (tech.technician) technicians.push(tech.technician);
        });

        const now = frappe.datetime.now_datetime();

        // Build time_logs rows as a value to set via server
        // We'll use a custom server call to set status + clear and add time_logs
        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: frm.doctype,
                name: frm.doc.name,
                fieldname: "status",
                value: "Repair In Progress"
            },
            freeze: true,
            callback: () => {
                // Now reload and add time_log rows locally then save child table
                frm.reload_doc().then(() => {
                    frm.clear_table("time_logs");
                    technicians.forEach(tech => {
                        const row = frm.add_child("time_logs");
                        row.technician = tech;
                        row.start_time = now;
                    });
                    frm.refresh_field("time_logs");
                    // Save the child table rows via normal save (only time_logs changed, status already persisted)
                    frm.save().then(() => {
                        start_timer_display(frm);
                        frappe.show_alert("Repair started. Timer is running.", 3);
                    });
                });
            }
        });
    });
}

function pause_repair(frm) {
    frappe.prompt(
        {
            fieldname: "pause_reason",
            label: __("Pause Reason"),
            fieldtype: "Select",
            options: "Waiting Parts\nWaiting Customer Approval\nLunch Break\nTool Unavailable\nTechnical Support\nOther",
            reqd: 1
        },
        (values) => {
            const now = frappe.datetime.now_datetime();
            const new_status = values.pause_reason === "Waiting Parts"
                ? "Waiting Parts"
                : "Waiting Customer Approval";

            // Close open time log rows locally
            (frm.doc.time_logs || []).filter(log => !log.end_time).forEach(log => {
                log.end_time = now;
                log.duration_hours = calculate_duration(log.start_time, log.end_time);
                log.pause_reason = values.pause_reason;
            });
            frm.refresh_field("time_logs");

            // Save status first, then save child rows
            frappe.call({
                method: "frappe.client.set_value",
                args: { doctype: frm.doctype, name: frm.doc.name, fieldname: "status", value: new_status },
                freeze: true,
                callback: () => {
                    frm.save().then(() => {
                        stop_timer();
                        frappe.show_alert("Repair paused: " + values.pause_reason, 3);
                        frm.reload_doc();
                    });
                }
            });
        }
    );
}

function stop_repair(frm) {
    frappe.confirm("Mark repair as completed? This will record all time logs.", () => {
        const now = frappe.datetime.now_datetime();

        (frm.doc.time_logs || []).filter(log => !log.end_time).forEach(log => {
            log.end_time = now;
            log.duration_hours = calculate_duration(log.start_time, log.end_time);
        });

        const total_actual = (frm.doc.time_logs || []).reduce((sum, log) => sum + (log.duration_hours || 0), 0);

        frm.refresh_field("time_logs");

        // Save status fields first, then save child rows (time_logs)
        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: frm.doctype,
                name: frm.doc.name,
                fieldname: {
                    status: "Repair Completed",
                    actual_duration_hours: total_actual,
                    total_sold_hours: total_actual,
                    completed_date_time: now
                }
            },
            freeze: true,
            callback: () => {
                frm.save().then(() => {
                    stop_timer();
                    frappe.show_alert("Repair completed. Ready for QC check.", 3);
                    frm.reload_doc();
                });
            }
        });
    });
}

function stop_timer() {
    if (timer_interval) {
        clearInterval(timer_interval);
        timer_interval = null;
    }
    if (timer_display_div) {
        timer_display_div.remove();
        timer_display_div = null;
    }
}

function start_timer_display(frm) {
    if (!timer_display_div) {
        timer_display_div = $('<div id="job-card-timer" style="background:#e8f4f8;padding:10px;margin:10px 0;border-radius:5px;text-align:center;font-size:20px;font-weight:bold;">⏱️ Timer: 00:00:00</div>');
        const $wrapper = $('.form-page');
        if ($wrapper.length) {
            timer_display_div.prependTo($wrapper);
        } else if (frm.wrapper) {
            $(frm.wrapper).find('.form-body').prepend(timer_display_div);
        }
    }

    update_timer_display(frm);

    if (timer_interval) clearInterval(timer_interval);

    timer_interval = setInterval(() => {
        if (frm.doc.status === "Repair In Progress") {
            update_timer_display(frm);
        } else {
            stop_timer();
        }
    }, 1000);
}

function update_timer_display(frm) {
    const active_logs = (frm.doc.time_logs || []).filter(log => log.start_time && !log.end_time);
    if (!active_logs.length) {
        if (timer_display_div) timer_display_div.html('⏱️ Timer: 00:00:00');
        return;
    }

    let total_seconds = 0;
    const now = new Date();
    active_logs.forEach(log => {
        total_seconds += Math.floor((now - new Date(log.start_time)) / 1000);
    });

    const h = Math.floor(total_seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((total_seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (total_seconds % 60).toString().padStart(2, '0');

    if (timer_display_div) timer_display_div.html(`⏱️ Timer: ${h}:${m}:${s}`);
}

function calculate_duration(start_time, end_time) {
    return Math.round(((new Date(end_time) - new Date(start_time)) / 1000 / 3600) * 10) / 10;
}

// Clean up timer when form is closed
$(document).on('form-closed', function () {
    stop_timer();
});