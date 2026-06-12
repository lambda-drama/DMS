# Copyright (c) 2026, Mania and contributors
"""Unused parts return: WIP warehouse → workshop warehouse."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import flt, today

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import spare_part_erp_item_code
from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_wip_warehouse,
	resolve_workshop_warehouse,
)


def _returnable_qty(part) -> float:
	issued = flt(part.quantity_issued or 0)
	returned = flt(part.quantity_returned or 0)
	return max(0, issued - returned)


@frappe.whitelist()
def create_parts_return_from_job_card(job_card: str, items=None, raised_by=None, remarks=None):
	"""Technician returns unused issued parts to warehouse."""
	if isinstance(items, str):
		import json

		items = json.loads(items) if items else None

	if not items:
		frappe.throw(_("Select at least one part line to return."))

	jc = frappe.get_doc("DMS Job Card", job_card)
	jc.check_permission("read")

	part_map = {p.name: p for p in jc.get("parts") or []}

	doc = frappe.new_doc("DMS Parts Return")
	doc.job_card = jc.name
	doc.company = jc.company
	doc.customer = jc.customer
	doc.vehicle_vin = jc.vehicle_vin
	doc.license_plate = jc.license_plate
	doc.raised_by = raised_by or jc.lead_technician
	doc.posting_date = today()
	doc.status = "Draft"
	doc.remarks = remarks

	for line in items:
		row_name = line.get("job_card_part_row")
		qty = flt(line.get("quantity_returned") or 0)
		if not row_name or qty <= 0:
			continue
		part = part_map.get(row_name)
		if not part:
			frappe.throw(_("Job card part row {0} not found.").format(row_name))

		available = _returnable_qty(part)
		if qty > available:
			frappe.throw(
				_("Cannot return {0} of {1}. Only {2} available to return.").format(
					qty, part.item_code, available
				)
			)

		doc.append(
			"items",
			{
				"job_card_part_row": row_name,
				"item_code": part.item_code,
				"part_name": part.part_name,
				"quantity_issued": flt(part.quantity_issued or 0),
				"quantity_returned": qty,
				"line_status": "Draft",
			},
		)

	if not doc.items:
		frappe.throw(_("No valid return lines."))

	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def submit_parts_return(name: str):
	doc = frappe.get_doc("DMS Parts Return", name)
	doc.check_permission("write")

	if doc.status != "Draft":
		frappe.throw(_("Only draft return notes can be submitted."))

	for row in doc.items:
		row.line_status = "Submitted"

	doc.status = "Submitted"
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def approve_parts_return(name: str):
	"""Parts advisor approves — stock transfer WIP → workshop, update job card qty returned."""
	doc = frappe.get_doc("DMS Parts Return", name)
	doc.check_permission("write")

	if doc.status != "Submitted":
		frappe.throw(_("Only submitted return notes can be approved."))

	jc = frappe.get_doc("DMS Job Card", doc.job_card)
	jc.check_permission("write")
	source_wh = get_wip_warehouse(jc.company)
	target_wh = resolve_workshop_warehouse(jc)
	if not source_wh:
		frappe.throw(_("Work In Progress warehouse is not set in DMS Settings for this company."))
	if not target_wh:
		frappe.throw(_("Workshop warehouse is not configured on the job card."))
	if source_wh == target_wh:
		frappe.throw(_("WIP warehouse must differ from workshop warehouse."))

	se = _create_return_stock_entry(doc, jc, source_wh, target_wh)
	doc.stock_entry = se

	part_map = {p.name: p for p in jc.get("parts") or []}
	for row in doc.items:
		qty = flt(row.quantity_returned)
		row.line_status = "Completed"
		part = part_map.get(row.job_card_part_row)
		if not part:
			continue
		part.quantity_returned = flt(part.quantity_returned or 0) + qty
		part.quantity_issued = max(0, flt(part.quantity_issued or 0) - qty)
		if part.quantity_issued == 0 and flt(part.quantity_returned or 0) > 0:
			part.line_status = "Returned"

	jc.calculate_costing_and_totals()
	jc.flags.ignore_validate_update_after_submit = True
	jc.save(ignore_permissions=True)

	doc.status = "Completed"
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "status": doc.status, "stock_entry": se}


def _create_return_stock_entry(doc, jc, source_wh: str, target_wh: str) -> str:
	from erpnext.stock.utils import get_stock_balance

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Transfer"
	se.purpose = "Material Transfer"
	se.company = jc.company
	se.posting_date = doc.posting_date or today()
	se.set_posting_time = 1
	se.remarks = _("Parts return {0} for Job Card {1}").format(doc.name, jc.name)

	for row in doc.items:
		erp_item = spare_part_erp_item_code(row.item_code)
		if not erp_item or not frappe.db.get_value("Item", erp_item, "is_stock_item"):
			continue
		qty = flt(row.quantity_returned)
		available = flt(get_stock_balance(erp_item, source_wh))
		if available < qty:
			frappe.throw(
				_("Insufficient stock in WIP for {0}. Required {1}, available {2}.").format(
					row.item_code, qty, available
				)
			)
		se.append(
			"items",
			{
				"item_code": erp_item,
				"qty": qty,
				"s_warehouse": source_wh,
				"t_warehouse": target_wh,
			},
		)

	if not se.items:
		frappe.throw(_("No stock items to return."))

	se.insert(ignore_permissions=True)
	se.submit()
	return se.name


@frappe.whitelist()
def list_parts_returns_for_job_card(job_card: str):
	return frappe.get_all(
		"DMS Parts Return",
		filters={"job_card": job_card},
		fields=["name", "status", "posting_date", "stock_entry", "raised_by"],
		order_by="creation desc",
	)


@frappe.whitelist()
def get_parts_return(name: str):
	doc = frappe.get_doc("DMS Parts Return", name)
	doc.check_permission("read")
	return doc.as_dict()
