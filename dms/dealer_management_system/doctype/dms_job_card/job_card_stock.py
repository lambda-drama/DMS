# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Work-in-progress warehouse transfers for DMS Job Card spare parts."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	part_issue_qty,
	spare_part_erp_item_code,
)


def get_dms_company_defaults_row(company: str | None):
	if not company:
		return None
	settings = frappe.get_single("DMS Settings")
	for row in settings.get("company_defaults") or []:
		if row.company == company:
			return row
	return None


def get_wip_warehouse(company: str | None) -> str | None:
	"""Work In Progress warehouse from DMS Settings → Company Defaults."""
	row = get_dms_company_defaults_row(company)
	if not row:
		return None
	wh = (getattr(row, "work_in_progress", None) or "").strip()
	return wh or None


def resolve_workshop_warehouse(jc) -> str | None:
	"""Source warehouse (workshop / job card header)."""
	for candidate in (
		getattr(jc, "warehouse", None),
	):
		wh = (candidate or "").strip()
		if wh:
			return wh

	workshop = getattr(jc, "workshop", None)
	if workshop:
		wh = frappe.db.get_value("Workshop", workshop, "warehouse")
		if wh:
			return wh

	for part in jc.get("parts") or []:
		wh = (getattr(part, "warehouse", None) or "").strip()
		if wh:
			return wh

	company = getattr(jc, "company", None)
	if company:
		default_wh = frappe.db.get_single_value("Stock Settings", "default_warehouse")
		if default_wh and frappe.db.get_value("Warehouse", default_wh, "company") == company:
			return default_wh

	return None


def _stock_lines_for_job_card(jc) -> list[dict]:
	lines = []
	for part in jc.get("parts") or []:
		if not part.item_code:
			continue
		erp_item = spare_part_erp_item_code(part.item_code)
		if not erp_item or not cint(frappe.db.get_value("Item", erp_item, "is_stock_item")):
			continue
		qty = part_issue_qty(part)
		if qty <= 0:
			continue
		lines.append(
			{
				"item_code": erp_item,
				"qty": qty,
				"part_row": part.name,
				"spare_part": part.item_code,
			}
		)
	return lines


def transfer_job_card_parts_to_wip(jc) -> str | None:
	"""
	Move spare-part stock from workshop warehouse to WIP on repair start.
	Returns Stock Entry name or None if nothing to transfer / WIP not configured.
	"""
	if jc.get("wip_material_transfer"):
		return jc.wip_material_transfer

	wip_wh = get_wip_warehouse(jc.company)
	if not wip_wh:
		return None

	source_wh = resolve_workshop_warehouse(jc)
	if not source_wh:
		frappe.throw(
			_("Set a workshop warehouse on the Job Card or Workshop before starting repair."),
			title=_("Warehouse required"),
		)

	if source_wh == wip_wh:
		frappe.throw(
			_("Work In Progress warehouse must be different from the workshop warehouse."),
			title=_("Invalid warehouse setup"),
		)

	lines = _stock_lines_for_job_card(jc)
	if not lines:
		return None

	_ensure_erpnext()

	from erpnext.stock.utils import get_stock_balance

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Transfer"
	se.purpose = "Material Transfer"
	se.company = jc.company
	se.posting_date = jc.posting_date or frappe.utils.today()
	se.set_posting_time = 1
	se.from_bom = 0
	se.add_to_transit = 0
	se.remarks = _("DMS Job Card {0} — parts to work in progress").format(jc.name)

	defaults_row = get_dms_company_defaults_row(jc.company)
	if defaults_row:
		for field in ("branch", "cost_center", "project"):
			val = getattr(defaults_row, field, None)
			if val and se.meta.has_field(field):
				se.set(field, val)

	for line in lines:
		available = flt(get_stock_balance(line["item_code"], source_wh))
		if available < line["qty"]:
			frappe.throw(
				_(
					"Insufficient stock for {0} in {1}. Required {2}, available {3}."
				).format(
					frappe.bold(line["item_code"]),
					frappe.bold(source_wh),
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
				"s_warehouse": source_wh,
				"t_warehouse": wip_wh,
			},
		)

	se.insert(ignore_permissions=True)
	se.submit()

	frappe.db.set_value(
		"DMS Job Card",
		jc.name,
		"wip_material_transfer",
		se.name,
		update_modified=False,
	)

	for line in lines:
		if line.get("part_row"):
			frappe.db.set_value(
				"Job Card Part Item",
				line["part_row"],
				"warehouse",
				wip_wh,
				update_modified=False,
			)

	return se.name


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for stock transfers."))
