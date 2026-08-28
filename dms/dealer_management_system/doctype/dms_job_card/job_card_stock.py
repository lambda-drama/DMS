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


def _part_row_map_from_original(target, source) -> dict:
	"""Map original Job Card Part Item names to rows on the new job card."""
	mapping = {}
	src_parts = list(source.get("parts") or [])
	tgt_parts = list(target.get("parts") or [])
	used = set()
	for idx, src in enumerate(src_parts):
		src_name = src.name if not isinstance(src, dict) else src.get("name")
		src_item = src.item_code if not isinstance(src, dict) else src.get("item_code")
		if idx < len(tgt_parts) and idx not in used:
			tgt = tgt_parts[idx]
			tgt_item = tgt.item_code if not isinstance(tgt, dict) else tgt.get("item_code")
			if not src_item or tgt_item == src_item:
				mapping[src_name] = tgt
				used.add(idx)
				continue
		for j, tgt in enumerate(tgt_parts):
			if j in used:
				continue
			tgt_item = tgt.item_code if not isinstance(tgt, dict) else tgt.get("item_code")
			if tgt_item == src_item:
				mapping[src_name] = tgt
				used.add(j)
				break
	return mapping


def clone_cancelled_stock_entry(old_name: str, remarks: str | None = None) -> str:
	"""Amend a cancelled Stock Entry, or recreate the same warehouse move if already amended."""
	_ensure_erpnext()
	from frappe.model.document import copy_doc
	from frappe.utils import nowtime, today

	old = frappe.get_doc("Stock Entry", old_name)
	if not old.items:
		frappe.throw(_("Stock Entry {0} has no items to recreate.").format(frappe.bold(old_name)))

	already_amended = frappe.db.exists("Stock Entry", {"amended_from": old.name})
	use_amend = cint(old.docstatus) == 2 and not already_amended

	new_se = copy_doc(old, ignore_no_copy=True)
	new_se.docstatus = 0
	new_se.name = None
	if new_se.meta.has_field("amended_from"):
		new_se.amended_from = old.name if use_amend else None
	new_se.posting_date = today()
	new_se.set_posting_time = 1
	if new_se.meta.has_field("posting_time"):
		new_se.posting_time = nowtime()
	if remarks:
		new_se.remarks = remarks

	new_se.flags.ignore_permissions = True
	try:
		new_se.insert()
		new_se.submit()
	except Exception:
		frappe.log_error(frappe.get_traceback(), "clone_cancelled_stock_entry")
		frappe.throw(
			_(
				"Could not recreate Stock Entry {0} for this job card. "
				"Check warehouse stock, then try Use the main job card again."
			).format(frappe.bold(old_name)),
			title=_("Stock transfer recreate failed"),
		)
	return new_se.name


def _clone_issued_parts_request(source_pr, target_jc, part_map, new_stock_entry: str | None):
	"""Create an Issued/Received parts request on the new job card, linked to the new stock entry."""
	from frappe.utils import now_datetime, today

	pr = frappe.new_doc("DMS Parts Request")
	pr.job_card = target_jc.name
	pr.company = target_jc.company
	pr.customer = target_jc.customer
	pr.vehicle_vin = target_jc.vehicle_vin
	pr.license_plate = target_jc.license_plate
	pr.requested_by = source_pr.requested_by or target_jc.lead_technician
	pr.posting_date = today()
	src_status = (source_pr.status or "").strip()
	pr.status = "Received" if src_status == "Received" else "Issued"
	pr.stock_entry = new_stock_entry
	pr.issued_date = source_pr.issued_date or now_datetime()
	if pr.status == "Received":
		pr.received_date = source_pr.received_date or now_datetime()
	if source_pr.picker_signature:
		pr.picker_signature = source_pr.picker_signature
	if source_pr.parts_staff_signature:
		pr.parts_staff_signature = source_pr.parts_staff_signature
	if source_pr.received_by_signature:
		pr.received_by_signature = source_pr.received_by_signature
	pr.remarks = _("Recreated from {0} on main job card {1}").format(
		source_pr.name, source_pr.job_card
	)

	line_status = "Received" if pr.status == "Received" else "Issued"
	wip_wh = get_wip_warehouse(target_jc.company)
	updated_rows = set()

	for row in source_pr.items or []:
		qty_issued = flt(row.quantity_issued or row.quantity_requested or 0)
		target_part = part_map.get(row.job_card_part_row)
		pr.append(
			"items",
			{
				"job_card_part_row": target_part.name if target_part else None,
				"item_code": row.item_code,
				"part_name": row.part_name,
				"quantity_requested": row.quantity_requested,
				"quantity_issued": qty_issued,
				"bin_location": row.bin_location,
				"line_status": line_status,
			},
		)
		if target_part:
			target_part.quantity_issued = flt(target_part.quantity_issued) + qty_issued
			target_part.line_status = line_status
			if wip_wh:
				target_part.warehouse = wip_wh
			updated_rows.add(target_part.name)

	pr.insert(ignore_permissions=True)

	for part in target_jc.get("parts") or []:
		if part.name not in updated_rows:
			continue
		frappe.db.set_value(
			"Job Card Part Item",
			part.name,
			{
				"quantity_issued": flt(part.quantity_issued),
				"line_status": part.line_status or line_status,
				"warehouse": part.warehouse or wip_wh or "",
				"parts_request": pr.name,
			},
			update_modified=False,
		)

	return pr.name


def recreate_issued_stock_from_original(target_jc, source_jc) -> list[str]:
	"""Recreate cancelled parts-issue / WIP stock moves onto an Amend or New Version card.

	Job card cancel reverses those Stock Entries. Using the main job card for Repair
	puts the same material transfer back (amend the cancelled entry when possible).
	"""
	if isinstance(target_jc, str):
		target_jc = frappe.get_doc("DMS Job Card", target_jc)
	if isinstance(source_jc, str):
		source_jc = frappe.get_doc("DMS Job Card", source_jc)

	part_map = _part_row_map_from_original(target_jc, source_jc)
	recreated: list[str] = []
	seen_stock: set[str] = set()

	source_prs = frappe.get_all(
		"DMS Parts Request",
		filters={"job_card": source_jc.name, "stock_entry": ["is", "set"]},
		pluck="name",
		order_by="creation asc",
	)

	for pr_name in source_prs:
		source_pr = frappe.get_doc("DMS Parts Request", pr_name)
		old_se = (source_pr.stock_entry or "").strip()
		if not old_se or old_se in seen_stock:
			continue
		if not frappe.db.exists("Stock Entry", old_se):
			continue
		new_se = clone_cancelled_stock_entry(
			old_se,
			remarks=_("Amended/recreated from {0} for Job Card {1} (main {2})").format(
				old_se, target_jc.name, source_jc.name
			),
		)
		seen_stock.add(old_se)
		recreated.append(new_se)
		_clone_issued_parts_request(source_pr, target_jc, part_map, new_se)

	old_wip = (source_jc.get("wip_material_transfer") or "").strip()
	if old_wip and old_wip not in seen_stock and frappe.db.exists("Stock Entry", old_wip):
		new_se = clone_cancelled_stock_entry(
			old_wip,
			remarks=_("WIP transfer recreated from {0} for Job Card {1}").format(
				old_wip, target_jc.name
			),
		)
		recreated.append(new_se)
		frappe.db.set_value(
			"DMS Job Card",
			target_jc.name,
			"wip_material_transfer",
			new_se,
			update_modified=False,
		)
		target_jc.wip_material_transfer = new_se

	return recreated

