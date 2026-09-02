# Copyright (c) 2026, Mania and contributors
"""Internal (company fleet) job cards — no estimate, no invoice, material issue on completion."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	part_issue_qty,
	spare_part_erp_item_code,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_dms_company_defaults_row,
	get_wip_warehouse,
	resolve_workshop_warehouse,
)

INTERNAL_JOB_CARD_TYPE = "Internal"


def is_internal_job_card(doc) -> bool:
	return (getattr(doc, "job_card_type", None) or "").strip() == INTERNAL_JOB_CARD_TYPE


def prepare_internal_job_card(doc) -> None:
	"""Apply non-billable defaults; clear customer estimate / approval statuses."""
	doc.payment_status = "Internal"
	doc.customer_approval_status = "Approved"
	if (doc.status or "").strip() in (
		"Draft",
		"Estimation Pending",
		"Estimation Approved",
		"Waiting Customer Approval",
		"Scheduled",
	):
		doc.status = "Open"
	apply_internal_job_card_billing(doc)


def bootstrap_internal_job_card_to_repair(job_card_name: str) -> dict:
	"""Submit internal job card and start repair when assignment fields are set."""
	jc = frappe.get_doc("DMS Job Card", job_card_name)
	jc.check_permission("write")
	prepare_internal_job_card(jc)

	if not jc.lead_technician or not jc.service_advisor:
		if jc.docstatus == 0:
			jc.save()
		else:
			jc.flags.ignore_validate_update_after_submit = True
			jc.save(ignore_permissions=True)
		frappe.db.commit()
		return {
			"name": jc.name,
			"status": jc.status,
			"repair_started": False,
		}

	from dms.dealer_management_system.doctype.dms_job_card.dms_job_card import (
		_ensure_job_card_submitted_for_repair,
		start_repair,
	)

	jc = _ensure_job_card_submitted_for_repair(jc)
	prepare_internal_job_card(jc)
	jc.flags.ignore_validate_update_after_submit = True
	jc.save(ignore_permissions=True)

	start_repair(job_card_name, time_logs=[])
	jc = frappe.get_doc("DMS Job Card", job_card_name)
	frappe.db.commit()
	return {
		"name": jc.name,
		"status": jc.status,
		"repair_started": jc.status == "Repair In Progress",
	}


def apply_internal_job_card_billing(doc) -> None:
	"""Zero customer-facing amounts — internal fleet / company cars."""
	doc.total_labor_cost = 0
	doc.total_parts_cost = 0
	doc.total_amount = 0
	doc.discount_amount = 0
	doc.net_amount = 0
	doc.payment_status = "Internal"

	for row in doc.get("labour") or []:
		row.rate_per_hour = 0
		row.amount = 0

	for row in doc.get("parts") or []:
		row.unit_price = 0
		row.total_amount = 0


def consumable_part_qty(part) -> float:
	"""Qty still sitting on the job that must leave stock via Material Issue.

	Parts request already moved stock workshop → WIP and set ``quantity_issued``.
	That transfer is not consumption — completion must issue the net issued qty
	out of WIP. Unissued lines (no PR yet) fall back to requested qty.
	"""
	issued = flt(getattr(part, "quantity_issued", None) or 0)
	returned = flt(getattr(part, "quantity_returned", None) or 0)
	if issued > 0:
		return max(0.0, issued - returned)
	return part_issue_qty(part)


def _issue_warehouse_for_part(jc, part) -> str | None:
	"""Prefer the warehouse the part was transferred into (WIP after issue)."""
	wh = (getattr(part, "warehouse", None) or "").strip()
	if wh:
		return wh

	wip = get_wip_warehouse(jc.company)
	if wip and (
		jc.get("wip_material_transfer") or flt(getattr(part, "quantity_issued", None) or 0) > 0
	):
		return wip

	return resolve_workshop_warehouse(jc)


def create_material_issue_for_job_card(jc) -> str | None:
	"""Consume spare parts from stock when an internal job card is completed."""
	if jc.get("material_issue"):
		return jc.material_issue

	lines: list[dict] = []
	for part in jc.get("parts") or []:
		if not part.item_code:
			continue
		erp_item = spare_part_erp_item_code(part.item_code)
		if not erp_item or not cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
			continue
		qty = consumable_part_qty(part)
		if qty <= 0:
			continue
		source_wh = _issue_warehouse_for_part(jc, part)
		if not source_wh:
			frappe.throw(
				_("Set a workshop warehouse (via service bay) before completing this internal job card."),
				title=_("Warehouse required"),
			)
		lines.append(
			{
				"item_code": erp_item,
				"qty": qty,
				"s_warehouse": source_wh,
				"part_row": part.name,
				"spare_part": part.item_code,
			}
		)

	if not lines:
		return None

	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for material issue."))

	from erpnext.stock.utils import get_stock_balance

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Issue"
	se.purpose = "Material Issue"
	se.company = jc.company
	se.posting_date = jc.posting_date or frappe.utils.today()
	se.set_posting_time = 1
	se.remarks = _("Internal job card {0} — consume parts from work in progress").format(jc.name)

	defaults_row = get_dms_company_defaults_row(jc.company)
	if defaults_row:
		for field in ("branch", "cost_center", "project"):
			val = getattr(defaults_row, field, None)
			if val and se.meta.has_field(field):
				se.set(field, val)

	for line in lines:
		available = flt(get_stock_balance(line["item_code"], line["s_warehouse"]))
		if available < line["qty"]:
			frappe.throw(
				_(
					"Insufficient stock for {0} in {1}. Required {2}, available {3}."
				).format(
					frappe.bold(line["spare_part"]),
					frappe.bold(line["s_warehouse"]),
					line["qty"],
					available,
				),
				title=_("Insufficient stock"),
			)
		se.append(
			"items",
			{
				"item_code": line["item_code"],
				"qty": line["qty"],
				"s_warehouse": line["s_warehouse"],
			},
		)

	se.insert(ignore_permissions=True)
	se.submit()

	for line in lines:
		part = next((p for p in jc.get("parts") or [] if p.name == line["part_row"]), None)
		if not part:
			continue
		# PR issue already set quantity_issued (workshop → WIP). Consumption
		# must not inflate issued qty; only stamp warehouse / status.
		issued = flt(part.quantity_issued or 0)
		updates = {
			"line_status": "Issued",
			"warehouse": line["s_warehouse"],
		}
		if issued <= 0:
			updates["quantity_issued"] = flt(line["qty"])
		frappe.db.set_value(
			"Job Card Part Item",
			part.name,
			updates,
			update_modified=False,
		)

	frappe.db.set_value(
		"DMS Job Card",
		jc.name,
		"material_issue",
		se.name,
		update_modified=True,
	)
	return se.name


def complete_internal_job_card(jc) -> dict:
	"""QC pass for internal job cards — issue materials and mark completed."""
	material_issue = create_material_issue_for_job_card(jc)
	jc.reload()
	apply_internal_job_card_billing(jc)
	jc.qc_result = "Pass"
	jc.qc_checked_date = frappe.utils.now_datetime()
	jc.status = "Completed"
	jc.payment_status = "Internal"
	jc.flags.ignore_validate_update_after_submit = True
	jc.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"status": jc.status,
		"material_issue": material_issue,
		"payment_status": jc.payment_status,
	}
