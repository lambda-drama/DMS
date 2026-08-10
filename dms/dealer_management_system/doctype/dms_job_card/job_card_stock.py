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
		wh = frappe.db.get_value("WorkShop", workshop, "warehouse")
		if wh:
			return wh

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
			_("Kindly add a warehouse on the Workshop before starting repair."),
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


def _collect_job_card_stock_entry_names(job_card: str) -> list[str]:
	"""All Stock Entries created for parts issue / return / WIP / material issue on a job card."""
	names: list[str] = []

	for field in ("wip_material_transfer", "material_issue"):
		val = frappe.db.get_value("DMS Job Card", job_card, field)
		if val:
			names.append(val)

	for doctype in ("DMS Parts Request", "DMS Parts Return"):
		if not frappe.db.exists("DocType", doctype):
			continue
		linked = frappe.get_all(
			doctype,
			filters={"job_card": job_card, "stock_entry": ["is", "set"]},
			pluck="stock_entry",
		)
		names.extend([n for n in linked if n])

	# Unique, preserve order
	seen = set()
	unique = []
	for n in names:
		if n not in seen:
			seen.add(n)
			unique.append(n)
	return unique


def cancel_job_card_stock_transfers(job_card: str) -> list[str]:
	"""
	Cancel submitted Stock Entries linked to a job card (parts issue transfers, returns,
	WIP transfer, material issue). Newest first so dependent moves reverse cleanly.
	"""
	_ensure_erpnext()
	entry_names = _collect_job_card_stock_entry_names(job_card)
	if not entry_names:
		return []

	rows = frappe.get_all(
		"Stock Entry",
		filters={"name": ["in", entry_names]},
		fields=["name", "docstatus", "creation", "posting_date", "posting_time"],
	)
	# Newest first
	rows.sort(
		key=lambda r: (
			str(r.get("posting_date") or ""),
			str(r.get("posting_time") or ""),
			str(r.get("creation") or ""),
		),
		reverse=True,
	)

	cancelled: list[str] = []
	for row in rows:
		if cint(row.docstatus) != 1:
			continue
		se = frappe.get_doc("Stock Entry", row.name)
		se.flags.ignore_permissions = True
		try:
			se.cancel()
		except Exception:
			frappe.throw(
				_(
					"Could not cancel Stock Entry {0} linked to this job card. "
					"Resolve the stock entry first, then cancel the job card again."
				).format(frappe.bold(row.name)),
				title=_("Stock transfer cancel failed"),
			)
		cancelled.append(row.name)

	# Reset part issue qty / warehouse after reversing transfers
	part_rows = frappe.get_all(
		"Job Card Part Item",
		filters={"parent": job_card},
		pluck="name",
	)
	for part_name in part_rows:
		frappe.db.set_value(
			"Job Card Part Item",
			part_name,
			{
				"quantity_issued": 0,
				"quantity_returned": 0,
				"line_status": "Requested",
				"warehouse": "",
			},
			update_modified=False,
		)

	return cancelled
