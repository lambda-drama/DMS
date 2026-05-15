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

    // ----------------------------------------------------------
    // QC Checklist Template handler
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // Road Test Template handler
    // ----------------------------------------------------------
    road_test_template(frm) {
        if (!frm.doc.road_test_template) {
            frm._dms_prev_road_test_template = "";
            return;
        }

        const rows = frm.doc.road_test_results || [];
        const previous = frm._dms_prev_road_test_template;

        if (rows.length) {
            frappe.confirm(
                __("Replace existing Road Test Results with lines from this template?"),
                () => {
                    populate_road_test_from_template(frm, { force: true }).then(() => {
                        frm._dms_prev_road_test_template = frm.doc.road_test_template;
                    });
                },
                () => {
                    frappe.model.set_value(
                        frm.doctype,
                        frm.doc.name,
                        "road_test_template",
                        previous || ""
                    );
                }
            );
            return;
        }

        populate_road_test_from_template(frm).then(() => {
            frm._dms_prev_road_test_template = frm.doc.road_test_template;
        });
    },

    // ----------------------------------------------------------
    // onload_post_render: auto-populate child tables for new docs
    // ----------------------------------------------------------
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
        if (
            frm.is_new() &&
            frm.doc.road_test_template &&
            !(frm.doc.road_test_results || []).length
        ) {
            populate_road_test_from_template(frm, { silent: true }).then(() => {
                frm._dms_prev_road_test_template = frm.doc.road_test_template || "";
            });
        }
    },

    // ----------------------------------------------------------
    // before_submit: validate required fields before submitting
    // ----------------------------------------------------------
    before_submit(frm) {
        const required = [
            { field: "lead_technician",    label: __("Lead Technician") },
            { field: "service_advisor",    label: __("Service Advisor") },
            { field: "schedule_start_time", label: __("Schedule Start Time") },
            { field: "schedule_end_time",   label: __("Schedule End Time") }
        ];

        const missing = required
            .filter(r => !frm.doc[r.field])
            .map(r => r.label);

        if (missing.length) {
            frappe.throw(
                __("Please fill in the following required fields before submitting:<br><b>{0}</b>",
                    [missing.join(", ")])
            );
        }
    },

    // ----------------------------------------------------------
    // on_submit: trigger after document is submitted
    // ----------------------------------------------------------
    on_submit(frm) {
        // Trigger auto-start repair after submit
        if (frm.doc.status === "Estimation Approved") {
            setTimeout(() => {
                auto_start_repair_on_submit(frm);
            }, 500);
        }
    },

    // ----------------------------------------------------------
    // refresh: wire up all UI logic
    // ----------------------------------------------------------
    refresh(frm) {
        if (frm._dms_prev_qc_template === undefined) {
            frm._dms_prev_qc_template = frm.doc.qc_checklist_template || "";
        }

        set_job_card_warehouse_queries(frm);
        add_vehicle_delivery_button(frm);
        add_sales_invoice_button(frm);
        refresh_qc_dashboard(frm);
        add_status_flow_buttons(frm);
        apply_customer_filter_advanced(frm);
        add_customer_approval_button(frm);
        control_submit_button(frm);

        // AFTER the document is submitted (docstatus=1), start the repair process
        if (frm.doc.docstatus === 1) {
            // If status is still "Estimation Approved", auto-start repair
            if (frm.doc.status === "Estimation Approved") {
                auto_start_repair_on_submit(frm);
            }
            
            // If repair is in progress, show timer
            if (frm.doc.status === "Repair In Progress") {
                start_timer_display(frm);
            }
        }

        // Hide the Submit button after submission
        if (frm.doc.docstatus === 1) {
            let $submit_btn = $('.primary-action');
            if ($submit_btn) $submit_btn.hide();
        }
    },

    // ----------------------------------------------------------
    // customer_approval_status: reveal Submit button on approval
    // ----------------------------------------------------------
    customer_approval_status(frm) {
        control_submit_button(frm);
    },

    setup(frm) {
        set_job_card_warehouse_queries(frm);
    },

    company(frm) {
        set_job_card_warehouse_queries(frm);
        clear_warehouse_if_wrong_company(frm);
    },

    warehouse(frm) {
        apply_job_card_warehouse_to_parts(frm);
    },

    workshop(frm) {
        suggest_warehouse_from_workshop(frm);
    },

    warranty_application_type(frm) {
        update_job_card_net_amount(frm);
    },

    discount_amount(frm) {
        update_job_card_net_amount(frm);
    }
});

// ============================================================
// SUBMIT BUTTON CONTROL
// Show Submit button only after customer approval
// ============================================================
function control_submit_button(frm) {
    if (frm.doc.docstatus !== 0) return;
    
    // Check if customer has approved
    const can_submit = frm.doc.customer_approval_status === "Approved";
    
    // Get the submit button element
    let $submit_btn = null;
    
    // Try different selectors for different Frappe versions
    if (frm.page && frm.page.btn_primary) {
        $submit_btn = $(frm.page.btn_primary);
    } else {
        $submit_btn = $('.primary-action');
    }
    
    if ($submit_btn && $submit_btn.length) {
        if (can_submit) {
            $submit_btn.show();
            $submit_btn.removeAttr('disabled');
        } else {
            $submit_btn.hide();
        }
    }
}

// ============================================================
// CUSTOMER APPROVAL BUTTON
// ============================================================
function add_customer_approval_button(frm) {
    if (frm.doc.docstatus !== 0) return;
    if (frm.doc.customer_approval_status === "Approved") return;
    if (frm.doc.status !== "Estimation Pending") return;
    
    frm.add_custom_button(__("Mark Customer Approved"), () => {
        frappe.prompt([
            {
                fieldname: "approval_reference",
                label: __("Approval Reference (WhatsApp/Email)"),
                fieldtype: "Data",
                reqd: 1
            },
            {
                fieldname: "approved_amount",
                label: __("Approved Amount"),
                fieldtype: "Currency"
            }
        ], (values) => {
            save_submitted_doc(frm, {
                customer_approval_status: "Approved",
                approval_reference: values.approval_reference,
                approved_amount: values.approved_amount,
                status: "Estimation Approved"
            }, () => {
                frappe.show_alert(__("Customer approved. Submit button is now available."), 5);
                control_submit_button(frm);
                frm.refresh();
            });
        }, __("Customer Approval"), __("Confirm Approval"));
    }, __("Approval"));
}

// ============================================================
// AUTO-START REPAIR ON SUBMIT
// Timer starts automatically when document is submitted
// ============================================================
function auto_start_repair_on_submit(frm) {
    // Only run if document is submitted (docstatus=1)
    if (frm.doc.docstatus !== 1) return;
    
    // If already in progress or completed, don't restart
    if (frm.doc.status !== "Estimation Approved") return;
    
    // Check if already has time logs
    if (frm.doc.time_logs && frm.doc.time_logs.length > 0) return;
    
    // Get technicians
    const technicians = [];
    if (frm.doc.lead_technician) technicians.push(frm.doc.lead_technician);
    if (frm.doc.assistant_technicians) {
        frm.doc.assistant_technicians.forEach(tech => {
            if (tech.technician) technicians.push(tech.technician);
        });
    }
    
    if (!technicians.length) {
        frappe.msgprint(__("Warning: No technician assigned. Timer will not start."));
        return;
    }
    
    const now = frappe.datetime.now_datetime();
    
    // Clear existing time logs and add new ones
    frm.clear_table("time_logs");
    technicians.forEach(tech => {
        const row = frm.add_child("time_logs");
        row.technician = tech;
        row.start_time = now;
    });
    frm.refresh_field("time_logs");
    
    // Save time logs and update status
    frm.save().then(() => {
        // Update status to Repair In Progress
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
                frm.reload_doc().then(() => {
                    start_timer_display(frm);
                    frappe.show_alert(__("Job submitted. Repair timer started automatically."), 4);
                    frm.refresh();
                });
            }
        });
    });
}

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
    const na_count   = results.filter((r) => r.result === "N/A").length;
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
    if (
        frm.doc.docstatus !== 1 ||
        frm.is_new() ||
        (frm.doc.status !== "Completed" && frm.doc.status !== "Delivered")
    ) return;
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
    if (
        !frappe.model.can_read(VEHICLE_DELIVERY_NOTE_DOCTYPE) &&
        !frappe.model.can_create(VEHICLE_DELIVERY_NOTE_DOCTYPE)
    ) return;

    frm.add_custom_button(
        __("Vehicle Delivery Note"),
        () => open_or_create_vehicle_delivery(frm),
        ACTIONS_GROUP
    );
}

function open_or_create_vehicle_delivery(frm) {
    const can_read   = frappe.model.can_read(VEHICLE_DELIVERY_NOTE_DOCTYPE);
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
// COMPANY → WAREHOUSE (filter + sync)
// ============================================================
function set_job_card_warehouse_queries(frm) {
    const company = frm.doc.company;
    const filters = company ? { company } : { name: ["in", []] };

    frm.set_query("warehouse", () => ({ filters }));
    frm.set_query("warehouse", "parts", () => ({ filters }));
}

function clear_warehouse_if_wrong_company(frm) {
    if (!frm.doc.company) {
        if (frm.doc.warehouse) {
            frm.set_value("warehouse", "");
        }
        return;
    }

    if (!frm.doc.warehouse) {
        return;
    }

    frappe.db.get_value("Warehouse", frm.doc.warehouse, "company", (r) => {
        const wh_company = r.message;
        if (wh_company && wh_company !== frm.doc.company) {
            frm.set_value("warehouse", "");
        }
    });
}

function suggest_warehouse_from_workshop(frm) {
    if (!frm.doc.workshop || !frm.doc.company) {
        return;
    }

    frappe.db.get_value("WorkShop", frm.doc.workshop, "warehouse", (r) => {
        const wh = r.message;
        if (!wh) {
            return;
        }
        frappe.db.get_value("Warehouse", wh, "company", (wr) => {
            if (wr.message === frm.doc.company) {
                frm.set_value("warehouse", wh);
            }
        });
    });
}

// ============================================================
// PART ROW HANDLERS
// ============================================================
frappe.ui.form.on("Job Card Part Item", {
    item_code(frm, cdt, cdn) {
        if (!ensure_assigned_bay_for_part(frm, cdt, cdn)) return;

        set_part_warehouse_from_job_card(frm, cdt, cdn).then(() => {
            queue_part_stock_refresh(cdt, cdn);
            queue_part_unit_price_refresh(frm, cdt, cdn);
        });
    },

    warehouse(frm, cdt, cdn) {
        queue_part_stock_refresh(cdt, cdn);
    },

    quantity_requested(frm, cdt, cdn) {
        update_part_total(frm, cdt, cdn);
    },

    quantity_issued(frm, cdt, cdn) {
        update_part_total(frm, cdt, cdn);
    },

    unit_price(frm, cdt, cdn) {
        update_part_total(frm, cdt, cdn);
    }
});

function ensure_assigned_bay_for_part(frm, cdt, cdn) {
    if (frm.doc.assigned_bay) return true;

    frappe.msgprint(__("Please fill Assigned Service Bay before choosing a spare part."));
    frappe.model.set_value(cdt, cdn, "item_code", "");
    frappe.model.set_value(cdt, cdn, "unit_price", null);
    frappe.model.set_value(cdt, cdn, "total_amount", null);
    frappe.model.set_value(cdt, cdn, "stock_available", null);
    return false;
}

function set_part_warehouse_from_job_card(frm, cdt, cdn) {
    if (!frm.doc.warehouse) return Promise.resolve();
    return frappe.model.set_value(cdt, cdn, "warehouse", frm.doc.warehouse);
}

function apply_job_card_warehouse_to_parts(frm) {
    if (!frm.doc.warehouse) return;

    (frm.doc.parts || []).forEach((row) => {
        if (row.item_code) {
            frappe.model.set_value(row.doctype, row.name, "warehouse", frm.doc.warehouse);
            queue_part_stock_refresh(row.doctype, row.name);
        }
    });
}

function queue_part_stock_refresh(cdt, cdn) {
    setTimeout(() => refresh_part_stock_available(cdt, cdn), 0);
}

function queue_part_unit_price_refresh(frm, cdt, cdn) {
    setTimeout(() => refresh_part_unit_price(frm, cdt, cdn), 0);
}

function refresh_part_stock_available(cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);
    if (!row.item_code) {
        frappe.model.set_value(cdt, cdn, "stock_available", null);
        return;
    }

    frappe.call({
        method:
            "dms.dealer_management_system.doctype.dms_job_card.dms_job_card.get_job_card_part_stock_available",
        args: {
            spare_part: row.item_code,
            warehouse: row.warehouse || ""
        },
        callback: (r) => {
            if (r.message !== undefined && r.message !== null) {
                frappe.model.set_value(cdt, cdn, "stock_available", r.message);
            }
        }
    });
}

function refresh_part_unit_price(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);
    if (!row.item_code) {
        frappe.model.set_value(cdt, cdn, "unit_price", null);
        return;
    }

    const spare_part = row.item_code;
    frappe.call({
        method:
            "dms.dealer_management_system.doctype.dms_job_card.dms_job_card.get_job_card_part_unit_price",
        args: {
            spare_part
        },
        callback: (r) => {
            const current_row = frappe.get_doc(cdt, cdn);
            if (current_row.item_code === spare_part && r.message !== undefined && r.message !== null) {
                frappe.model.set_value(cdt, cdn, "unit_price", r.message).then(() => {
                    update_part_total(frm, cdt, cdn);
                });
            }
        }
    });
}

function update_part_total(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);
    const qty = flt(row.quantity_issued || row.quantity_requested || 0);
    const rate = flt(row.unit_price || 0);
    frappe.model.set_value(cdt, cdn, "total_amount", flt(qty * rate, 2)).then(() => {
        update_job_card_parts_total(frm);
    });
}

function update_job_card_parts_total(frm) {
    const total_parts = (frm.doc.parts || []).reduce((total, row) => {
        if (cint(row.is_warranty)) return total;
        return total + flt(row.total_amount || 0);
    }, 0);

    frappe.model.set_value(frm.doctype, frm.doc.name, "total_parts_cost", flt(total_parts, 2)).then(() => {
        const total_amount = flt(frm.doc.total_labor_cost || 0) + flt(frm.doc.total_parts_cost || 0);
        frappe.model.set_value(frm.doctype, frm.doc.name, "total_amount", flt(total_amount, 2)).then(() => {
            update_job_card_net_amount(frm);
        });
    });
}

function update_job_card_net_amount(frm) {
    const warranty_type = frm.doc.warranty_application_type;
    const total_amount = flt(frm.doc.total_amount || 0);
    const total_labor = flt(frm.doc.total_labor_cost || 0);
    const total_parts = flt(frm.doc.total_parts_cost || 0);
    const discount_amount = flt(frm.doc.discount_amount || 0);

    let net_amount = total_amount - discount_amount;
    if (warranty_type === "All Invoice") {
        net_amount = 0;
    } else if (warranty_type === "Spare Part") {
        net_amount = total_labor;
    } else if (warranty_type === "Labour") {
        net_amount = total_parts;
    } else if (warranty_type === "Discount" && discount_amount < 1) {
        frappe.show_alert(__("Discount Amount must be at least 1."), 5);
    }

    frappe.model.set_value(frm.doctype, frm.doc.name, "net_amount", flt(net_amount, 2));
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
// Includes Road Test Pass/Fail with reasons
// ============================================================
function add_status_flow_buttons(frm) {
    if (frm.doc.docstatus !== 1) return;

    const status = frm.doc.status;

    // ── Estimation ──────────────────────────────────────────
    if (status === "Draft") {
        frm.add_custom_button(__("Submit for Estimation"), () => {
            save_submitted_doc(frm, { status: "Estimation Pending" }, () => {
                frappe.show_alert(__("Job Card sent for estimation."), 3);
            });
        }, __("Status"));
    }

    // ── Repair ──────────────────────────────────────────────
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
                frappe.show_alert(__("Repair resumed."), 3);
            });
        }, __("Workshop"));
    }

    if (status === "Waiting Customer Approval") {
        frm.add_custom_button(__("Customer Approved"), () => {
            save_submitted_doc(frm, { status: "Repair In Progress" }, () => {
                frappe.show_alert(__("Repair resumed."), 3);
            });
        }, __("Approval"));
    }

    // ── Road Test ────────────────────────────────────────────
    if (status === "Repair Completed") {
        frm.add_custom_button(__("Start Road Test"), () => {
            save_submitted_doc(frm, { status: "Road Test In Progress" }, () => {
                frappe.show_alert(__("Road test started."), 3);
            });
        }, __("Workshop"));
    }

    if (status === "Road Test In Progress") {
        // Pass Road Test button
        frm.add_custom_button(__("Pass Road Test"), () => {
            // Check if any critical items failed
            const critical_fails = (frm.doc.road_test_results || []).filter(
                row => cint(row.is_critical) === 1 && row.result === "Fail"
            );
            
            if (critical_fails.length > 0) {
                frappe.msgprint({
                    title: __("Cannot Pass Road Test"),
                    message: __("{0} critical item(s) failed. Please fix before passing.", [critical_fails.length]),
                    indicator: "red"
                });
                return;
            }
            
            frappe.prompt(
                {
                    fieldname: "road_test_notes",
                    label: __("Road Test Notes (Optional)"),
                    fieldtype: "Small Text",
                    reqd: 0,
                    description: __("Enter any observations or comments about the road test.")
                },
                (values) => {
                    save_submitted_doc(frm, {
                        road_test_note: values.road_test_notes || "",
                        rt_result: "Pass",
                        status: "Road Test Completed"
                    }, () => {
                        frappe.show_alert(__("Road test passed. Ready for QC."), 3);
                    });
                },
                __("Pass Road Test"),
                __("Confirm Pass")
            );
        }, __("Workshop"));
        
        // Fail Road Test button
        frm.add_custom_button(__("Fail Road Test"), () => {
            frappe.prompt(
                {
                    fieldname: "fail_reason",
                    label: __("Failure Reason"),
                    fieldtype: "Small Text",
                    reqd: 1,
                    description: __("Please explain why the road test failed.")
                },
                (values) => {
                    save_submitted_doc(frm, {
                        road_test_note: values.fail_reason,
                        rt_result: "Fail",
                        status: "Rework",
                        rework_required: 1
                    }, () => {
                        frappe.show_alert(__("Road test failed. Sent back for rework."), 3);
                    });
                },
                __("Fail Road Test"),
                __("Confirm Fail")
            );
        }, __("Workshop"));
    }

    // ── QC ──────────────────────────────────────────────────
    if (status === "Road Test Completed") {
        frm.add_custom_button(__("Start QC Check"), () => {
            save_submitted_doc(frm, { status: "QC In Progress" }, () => {
                frappe.show_alert(__("QC inspection started."), 3);
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
                frappe.show_alert(__("QC Passed. Job Completed."), 3);
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
                        frappe.show_alert(__("QC Failed. Sent back for rework."), 3);
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
                frappe.show_alert(__("Rework completed. Ready for road test / QC re-check."), 3);
            });
        }, __("Workshop"));
    }
}

// ============================================================
// REPAIR TIMER & TIME LOGS
// ============================================================
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

            // Persist status first, then save child rows
            frappe.call({
                method: "frappe.client.set_value",
                args: { doctype: frm.doctype, name: frm.doc.name, fieldname: "status", value: new_status },
                freeze: true,
                callback: () => {
                    frm.save().then(() => {
                        stop_timer();
                        frappe.show_alert(__("Repair paused: {0}", [values.pause_reason]), 3);
                        frm.reload_doc();
                    });
                }
            });
        }
    );
}

function stop_repair(frm) {
    frappe.confirm(__("Mark repair as completed? This will record all time logs."), () => {
        const now = frappe.datetime.now_datetime();

        (frm.doc.time_logs || []).filter(log => !log.end_time).forEach(log => {
            log.end_time = now;
            log.duration_hours = calculate_duration(log.start_time, log.end_time);
        });

        const total_actual = (frm.doc.time_logs || [])
            .reduce((sum, log) => sum + (log.duration_hours || 0), 0);

        frm.refresh_field("time_logs");

        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: frm.doctype,
                name: frm.doc.name,
                fieldname: {
                    status: "Repair Completed",
                    actual_duration_hours: total_actual,
                    total_hours: total_actual,
                    completed_date_time: now
                }
            },
            freeze: true,
            callback: () => {
                frm.save().then(() => {
                    stop_timer();
                    frappe.show_alert(__("Repair completed. Ready for road test."), 3);
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
        timer_display_div = $(
            '<div id="job-card-timer" style="background:#e8f4f8;padding:10px;margin:10px 0;' +
            'border-radius:5px;text-align:center;font-size:20px;font-weight:bold;">' +
            '⏱️ Timer: 00:00:00</div>'
        );
        const $wrapper = $(".form-page");
        if ($wrapper.length) {
            timer_display_div.prependTo($wrapper);
        } else if (frm.wrapper) {
            $(frm.wrapper).find(".form-body").prepend(timer_display_div);
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
        if (timer_display_div) timer_display_div.html("⏱️ Timer: 00:00:00");
        return;
    }

    let total_seconds = 0;
    const now = new Date();
    active_logs.forEach(log => {
        total_seconds += Math.floor((now - new Date(log.start_time)) / 1000);
    });

    const h = Math.floor(total_seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((total_seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (total_seconds % 60).toString().padStart(2, "0");

    if (timer_display_div) timer_display_div.html(`⏱️ Timer: ${h}:${m}:${s}`);
}

function calculate_duration(start_time, end_time) {
    return Math.round(((new Date(end_time) - new Date(start_time)) / 1000 / 3600) * 10) / 10;
}

// Clean up timer when form is closed
$(document).on("form-closed", function () {
    stop_timer();
});

// ============================================================
// CUSTOMER FILTER
// ============================================================
function apply_customer_filter_advanced(frm) {
    frm.fields_dict.customer.get_query = function (doc, cdt, cdn) {
        return {
            query: "dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_customers",
            filters: {}
        };
    };
}

// ============================================================
// ROAD TEST POPULATION FROM TEMPLATE
// ============================================================
function populate_road_test_from_template(frm, opts = {}) {
    const { silent, force } = opts;

    if (!frm.doc.road_test_template) return Promise.resolve();

    const existing = frm.doc.road_test_results || [];
    if (existing.length && !force) return Promise.resolve();

    return frappe.db
        .get_doc("Road Test Template", frm.doc.road_test_template)
        .then((template) => {
            const items = template.test_items || [];
            if (!items.length) {
                frappe.msgprint(__("This Road Test Template has no test items."));
                return;
            }

            frm.clear_table("road_test_results");

            for (const item of items) {
                const row = frm.add_child("road_test_results");
                row.test_item        = item.test_item;
                row.test_description = item.test_item;
                row.category         = item.category;
                row.test_condition   = item.test_condition;
                row.is_critical      = item.is_critical;
                row.result           = "Pass";
                row.tested_by        = frappe.session.user;
                row.tested_on        = frappe.datetime.now_datetime();
            }

            frm.refresh_field("road_test_results");

            if (!silent) {
                frappe.show_alert(__("Road test items added from template."), 5);
            }
        });
}