# Copyright (c) 2026, Mania and contributors
"""Parts request → pick slip → issue (WIP transfer) → receive workflow."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import flt, now_datetime, today

from dms.api.utils import LIST_ORDER_LATEST_CREATED, add_branch_filter

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	spare_part_default_selling_price,
	spare_part_erp_item_code,
)
from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_dms_company_defaults_row,
	get_wip_warehouse,
	resolve_workshop_warehouse,
)


def _stock_available(spare_part: str, warehouse: str | None) -> float:
	from dms.dealer_management_system.utils.stock_operations import (
		get_dms_item_stock_balance,
		resolve_spare_part_erp_item_code,
	)

	erp_item = resolve_spare_part_erp_item_code(spare_part)
	if not erp_item:
		return 0.0
	if not frappe.db.get_value("Item", erp_item, "is_stock_item"):
		return 0.0

	return get_dms_item_stock_balance(erp_item, warehouse)


def refresh_parts_request_stock(pr_doc):
	warehouse = None
	if pr_doc.job_card:
		jc = frappe.get_doc("DMS Job Card", pr_doc.job_card)
		warehouse = resolve_workshop_warehouse(jc)
	for row in pr_doc.items or []:
		if row.item_code:
			row.stock_available = _stock_available(row.item_code, warehouse)


def _part_is_requestable(part) -> bool:
	"""True when this job card part line can be included in a new parts request."""
	status = (getattr(part, "line_status", None) or "Requested").strip()
	if status != "Requested":
		return False

	parts_request = (getattr(part, "parts_request", None) or "").strip()
	if parts_request:
		pr_status = frappe.db.get_value("DMS Parts Request", parts_request, "status")
		if pr_status and pr_status != "Cancelled":
			return False

	requested = flt(part.quantity_requested or 0)
	issued = flt(part.quantity_issued or 0)
	return requested > issued


def _eligible_job_card_parts(jc, part_row_names: list[str] | None = None):
	"""Parts lines that still need requesting (not already on an active request)."""
	for part in jc.get("parts") or []:
		if not part.item_code:
			continue
		if part_row_names and part.name not in part_row_names:
			continue
		if _part_is_requestable(part):
			yield part


_ADD_PART_ALLOWED_STATUSES = frozenset(
	{
		"Open",
		"Assigned",
		"Estimation Approved",
		"Repair In Progress",
		"Waiting Parts",
		"Waiting Customer Approval",
		"Rework",
	}
)


@frappe.whitelist()
def add_part_line_to_job_card(
	job_card: str,
	item_code: str,
	quantity_requested: float = 1,
	unit_price: float | None = None,
	notes: str | None = None,
	request_immediately: int | bool = 0,
	requested_by: str | None = None,
):
	"""Add a spare part line discovered during repair; optionally create a parts request for it."""
	if not item_code:
		frappe.throw(_("Part number is required."))

	jc = frappe.get_doc("DMS Job Card", job_card)
	jc.check_permission("write")

	if jc.status not in _ADD_PART_ALLOWED_STATUSES:
		frappe.throw(
			_("Cannot add parts when job card status is {0}.").format(jc.status or _("Unknown"))
		)

	if not frappe.db.exists("Spare Part", item_code):
		frappe.throw(_("Spare Part {0} does not exist.").format(item_code))

	qty = flt(quantity_requested) or 1
	if qty <= 0:
		frappe.throw(_("Quantity must be greater than zero."))

	default_price = spare_part_default_selling_price(item_code)
	if unit_price is not None:
		from dms.dealer_management_system.utils.price_permissions import (
			assert_price_allowed_if_changed,
		)

		assert_price_allowed_if_changed(default_price, unit_price)

	price = flt(unit_price) if unit_price is not None else default_price
	bin_location = frappe.db.get_value("Spare Part", item_code, "bin_location") or ""

	jc.append(
		"parts",
		{
			"item_code": item_code,
			"quantity_requested": qty,
			"unit_price": price,
			"bin_location": bin_location,
			"total_amount": round(qty * price, 2),
			"line_status": "Requested",
			"notes": notes,
		},
	)

	jc.flags.ignore_validate_update_after_submit = True
	if hasattr(jc, "calculate_costing_and_totals"):
		jc.calculate_costing_and_totals()
	jc.save(ignore_permissions=True)

	new_row = jc.parts[-1]
	result = {
		"job_card": jc.name,
		"part_row": new_row.name,
		"item_code": new_row.item_code,
		"quantity_requested": qty,
		"unit_price": price,
		"total_amount": new_row.total_amount,
		"total_parts_cost": jc.total_parts_cost,
		"total_amount_header": jc.total_amount,
		"net_amount": getattr(jc, "net_amount", None),
	}

	if int(request_immediately):
		pr_result = create_parts_request_from_job_card(
			job_card,
			part_row_names=[new_row.name],
			requested_by=requested_by,
		)
		result["parts_request"] = pr_result.get("name")
		result["parts_request_status"] = pr_result.get("status")

	frappe.db.commit()
	return result


@frappe.whitelist()
def update_job_card_line_pricing(job_card: str, parts=None, labour=None):
	"""Update selling price on part rows and/or rate/hour on labour rows.

	Only requires the Edit Price permission when a sent value actually differs
	from the current stored unit price / rate-per-hour. Discount-driven updates
	that write the same effective rates are allowed for everyone.
	"""
	if isinstance(parts, str):
		import json

		parts = json.loads(parts) if parts else []
	if isinstance(labour, str):
		import json

		labour = json.loads(labour) if labour else []

	if not job_card:
		frappe.throw(_("Job Card name is required."))

	jc = frappe.get_doc("DMS Job Card", job_card)
	jc.check_permission("write")

	if jc.invoice:
		frappe.throw(_("Cannot change line pricing after an invoice has been created."))

	# Detect real price changes — only those need Edit Price permission.
	from dms.dealer_management_system.utils.price_permissions import require_edit_price

	actual_changes = False
	for payload in parts or []:
		row_name = (payload.get("name") or payload.get("row_name") or "").strip()
		if not row_name:
			continue
		for row in jc.parts or []:
			if row.name == row_name:
				if abs(flt(row.unit_price or 0) - flt(payload.get("unit_price"))) >= 0.01:
					actual_changes = True
					break
		if actual_changes:
			break

	if not actual_changes:
		for payload in labour or []:
			row_name = (payload.get("name") or payload.get("row_name") or "").strip()
			if not row_name:
				continue
			for row in jc.labour or []:
				if row.name == row_name:
					if abs(flt(row.rate_per_hour or 0) - flt(payload.get("rate_per_hour"))) >= 0.01:
						actual_changes = True
						break
			if actual_changes:
				break

	if actual_changes:
		require_edit_price()

	changed = False
	for payload in parts or []:
		row_name = (payload.get("name") or payload.get("row_name") or "").strip()
		if not row_name:
			continue
		for row in jc.parts or []:
			if row.name == row_name:
				row.unit_price = flt(payload.get("unit_price"))
				changed = True
				break

	for payload in labour or []:
		row_name = (payload.get("name") or payload.get("row_name") or "").strip()
		if not row_name:
			continue
		for row in jc.labour or []:
			if row.name == row_name:
				row.rate_per_hour = flt(payload.get("rate_per_hour"))
				changed = True
				break

	if not changed:
		frappe.throw(_("No matching job card lines were updated."))

	jc.flags.ignore_validate_update_after_submit = True
	if hasattr(jc, "calculate_costing_and_totals"):
		jc.calculate_costing_and_totals()
	jc.save(ignore_permissions=True)
	frappe.db.commit()

	return {
		"job_card": jc.name,
		"total_labor_cost": jc.total_labor_cost,
		"total_parts_cost": jc.total_parts_cost,
		"total_amount": jc.total_amount,
		"net_amount": getattr(jc, "net_amount", None),
	}


@frappe.whitelist()
def create_parts_request_from_job_card(job_card: str, part_row_names=None, requested_by=None):
	"""Technician requests parts — creates PR and marks JC part lines Pending Approval."""
	if isinstance(part_row_names, str):
		import json

		part_row_names = json.loads(part_row_names) if part_row_names else None

	jc = frappe.get_doc("DMS Job Card", job_card)
	jc.check_permission("read")

	lines = list(_eligible_job_card_parts(jc, part_row_names))
	if not lines:
		frappe.throw(
			_(
				"No parts available to request. Parts may already be on a parts request, "
				"or fully issued. Add a new part line to request again."
			)
		)

	pr = frappe.new_doc("DMS Parts Request")
	pr.job_card = jc.name
	pr.company = jc.company
	pr.customer = jc.customer
	pr.vehicle_vin = jc.vehicle_vin
	pr.license_plate = jc.license_plate
	pr.requested_by = requested_by or jc.lead_technician
	pr.posting_date = today()
	pr.status = "Pending Approval"

	for part in lines:
		qty = flt(part.quantity_requested or 0) - flt(part.quantity_issued or 0)
		if qty <= 0:
			continue
		pr.append(
			"items",
			{
				"job_card_part_row": part.name,
				"item_code": part.item_code,
				"part_name": part.part_name,
				"quantity_requested": qty,
				"line_status": "Pending Approval",
			},
		)
		frappe.db.set_value(
			"Job Card Part Item",
			part.name,
			"line_status",
			"Pending Approval",
			update_modified=False,
		)

	if not pr.items:
		frappe.throw(_("No quantity remaining to request."))

	refresh_parts_request_stock(pr)
	pr.insert(ignore_permissions=True)
	for row in pr.items:
		if row.job_card_part_row:
			frappe.db.set_value(
				"Job Card Part Item",
				row.job_card_part_row,
				"parts_request",
				pr.name,
				update_modified=False,
			)
	frappe.db.commit()
	return {"name": pr.name, "status": pr.status}


@frappe.whitelist()
def approve_parts_request(name: str):
	"""Parts advisor approves — checks stock, sets Ready for Issue, generates pick slip."""
	pr = frappe.get_doc("DMS Parts Request", name)
	pr.check_permission("write")

	if pr.status not in ("Pending Approval", "Draft"):
		frappe.throw(_("Only pending parts requests can be approved."))

	jc = frappe.get_doc("DMS Job Card", pr.job_card)
	source_wh = resolve_workshop_warehouse(jc)
	if not source_wh:
		frappe.throw(_("Workshop warehouse is not configured on the job card."))

	all_backordered = True
	for row in pr.items:
		avail = _stock_available(row.item_code, source_wh)
		row.stock_available = avail
		qty = flt(row.quantity_requested)
		if avail >= qty:
			row.line_status = "Ready for Issue"
			all_backordered = False
			if row.job_card_part_row:
				frappe.db.set_value(
					"Job Card Part Item",
					row.job_card_part_row,
					{"line_status": "Reserved", "is_backordered": 0},
					update_modified=False,
				)
		else:
			row.line_status = "Backordered"
			if row.job_card_part_row:
				frappe.db.set_value(
					"Job Card Part Item",
					row.job_card_part_row,
					{
						"line_status": "Backordered",
						"is_backordered": 1,
						"backorder_quantity": max(0, qty - avail),
					},
					update_modified=False,
				)

	if all_backordered:
		pr.status = "Pending Approval"
		pr.save(ignore_permissions=True)
		frappe.db.commit()
		frappe.throw(_("Insufficient stock for all requested parts. Request remains pending."))

	pr.status = "Ready for Issue"
	pr.save(ignore_permissions=True)

	ps_name = _create_pick_slip(pr)
	frappe.db.set_value("DMS Parts Request", pr.name, "pick_slip", ps_name, update_modified=True)
	frappe.db.commit()

	return {"name": pr.name, "status": pr.status, "pick_slip": ps_name}


def _create_pick_slip(pr) -> str:
	ps = frappe.new_doc("DMS Pick Slip")
	ps.parts_request = pr.name
	ps.job_card = pr.job_card
	ps.posting_date = pr.posting_date or today()
	ps.status = "Pending"

	for row in pr.items:
		if row.line_status != "Ready for Issue":
			continue
		ps.append(
			"items",
			{
				"item_code": row.item_code,
				"part_name": row.part_name,
				"quantity": row.quantity_requested,
				"bin_location": row.bin_location,
				"picked": 0,
			},
		)

	if not ps.items:
		frappe.throw(_("No pick slip lines could be generated."))

	ps.insert(ignore_permissions=True)
	return ps.name


@frappe.whitelist()
def mark_pick_slip_picked(name: str):
	ps = frappe.get_doc("DMS Pick Slip", name)
	ps.check_permission("write")
	for row in ps.items:
		row.picked = 1
	ps.status = "Picked"
	ps.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": ps.name, "status": ps.status}


@frappe.whitelist()
def issue_parts_request(
	name: str,
	picker_signature: str | None = None,
	parts_staff_signature: str | None = None,
):
	"""Issue parts: Stock Entry workshop → WIP, update job card part qty issued."""
	pr = frappe.get_doc("DMS Parts Request", name)
	pr.check_permission("write")

	if pr.status not in ("Ready for Issue", "Partially Issued"):
		frappe.throw(_("Parts request must be ready for issue."))

	if not picker_signature or not parts_staff_signature:
		frappe.throw(_("Picker and parts staff signatures are required to issue parts."))

	jc = frappe.get_doc("DMS Job Card", pr.job_card)
	source_wh = resolve_workshop_warehouse(jc)
	wip_wh = get_wip_warehouse(jc.company)
	if not source_wh:
		frappe.throw(_("Workshop warehouse is not configured."))
	if not wip_wh:
		frappe.throw(_("Work In Progress warehouse is not set in DMS Settings for this company."))
	if source_wh == wip_wh:
		frappe.throw(_("WIP warehouse must differ from workshop warehouse."))

	se = _create_issue_stock_entry(pr, jc, source_wh, wip_wh)

	pr.picker_signature = picker_signature
	pr.parts_staff_signature = parts_staff_signature
	pr.issued_date = now_datetime()
	pr.stock_entry = se

	issued_any = False
	for row in pr.items:
		if row.line_status != "Ready for Issue":
			continue
		qty = flt(row.quantity_requested)
		row.quantity_issued = qty
		row.line_status = "Issued"
		issued_any = True
		if row.job_card_part_row:
			existing_issued = flt(
				frappe.db.get_value("Job Card Part Item", row.job_card_part_row, "quantity_issued") or 0
			)
			frappe.db.set_value(
				"Job Card Part Item",
				row.job_card_part_row,
				{
					"quantity_issued": existing_issued + qty,
					"line_status": "Issued",
					"warehouse": wip_wh,
				},
				update_modified=False,
			)

	if not issued_any:
		frappe.throw(_("No lines were ready for issue."))

	pr.status = "Issued"
	pr.save(ignore_permissions=True)

	if ps_name := pr.pick_slip:
		frappe.db.set_value("DMS Pick Slip", ps_name, "status", "Completed", update_modified=False)

	frappe.db.commit()
	return {"name": pr.name, "status": pr.status, "stock_entry": se}


def _create_issue_stock_entry(pr, jc, source_wh: str, wip_wh: str) -> str:
	from erpnext.stock.utils import get_stock_balance

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Transfer"
	se.purpose = "Material Transfer"
	se.company = jc.company
	se.posting_date = pr.posting_date or today()
	se.set_posting_time = 1
	se.remarks = _("Parts issue {0} for Job Card {1}").format(pr.name, jc.name)

	defaults_row = get_dms_company_defaults_row(jc.company)
	if defaults_row:
		for field in ("branch", "cost_center", "project"):
			val = getattr(defaults_row, field, None)
			if val and se.meta.has_field(field):
				se.set(field, val)

	for row in pr.items:
		if row.line_status != "Ready for Issue":
			continue
		erp_item = spare_part_erp_item_code(row.item_code)
		if not erp_item or not frappe.db.get_value("Item", erp_item, "is_stock_item"):
			continue
		qty = flt(row.quantity_requested)
		available = flt(get_stock_balance(erp_item, source_wh))
		if available < qty:
			frappe.throw(
				_("Insufficient stock for {0}. Required {1}, available {2}.").format(
					row.item_code, qty, available
				)
			)
		se.append(
			"items",
			{
				"item_code": erp_item,
				"qty": qty,
				"s_warehouse": source_wh,
				"t_warehouse": wip_wh,
			},
		)

	if not se.items:
		frappe.throw(_("No stock items to transfer."))

	se.insert(ignore_permissions=True)
	se.submit()
	return se.name


@frappe.whitelist()
def receive_parts_request(name: str, received_by_signature: str | None = None):
	"""Technician confirms receipt of issued parts."""
	pr = frappe.get_doc("DMS Parts Request", name)
	pr.check_permission("write")

	if pr.status != "Issued":
		frappe.throw(_("Only issued parts requests can be marked received."))

	if not received_by_signature:
		frappe.throw(_("Technician signature is required to confirm receipt."))

	pr.received_by_signature = received_by_signature
	pr.received_date = now_datetime()
	pr.status = "Received"

	for row in pr.items:
		if row.line_status == "Issued":
			row.line_status = "Received"
			if row.job_card_part_row:
				frappe.db.set_value(
					"Job Card Part Item",
					row.job_card_part_row,
					"line_status",
					"Received",
					update_modified=False,
				)

	pr.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": pr.name, "status": pr.status}


_CANCELLABLE_PARTS_REQUEST_STATUSES = frozenset(
	{"Draft", "Pending Approval", "Approved", "Ready for Issue", "Partially Issued"}
)


@frappe.whitelist()
def reverse_issued_parts_request(name: str):
	"""Reverse the material transfer for an issued parts request (before/after receipt).

	Cancels the parts request's linked Stock Entry so parts go back to the workshop
	warehouse, then marks the parts request Cancelled and releases job card part lines.
	"""
	pr = frappe.get_doc("DMS Parts Request", name)
	pr.check_permission("write")
	if pr.status not in ("Issued", "Partially Issued", "Received"):
		frappe.throw(_("Only issued or received parts requests can be reversed."))

	cancelled: list[str] = []
	stock_entry = (pr.stock_entry or "").strip()
	if stock_entry:
		se = frappe.get_doc("Stock Entry", stock_entry)
		if se.docstatus == 1:
			se.flags.ignore_permissions = True
			se.cancel()
			cancelled.append(stock_entry)

	for row in pr.items:
		if row.job_card_part_row:
			frappe.db.set_value(
				"Job Card Part Item",
				row.job_card_part_row,
				{
					"line_status": "Requested",
					"quantity_issued": 0,
					"quantity_returned": 0,
					"warehouse": "",
					"parts_request": "",
				},
				update_modified=False,
			)

	pr.stock_entry = ""
	pr.status = "Cancelled"
	pr.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"name": pr.name,
		"status": pr.status,
		"cancelled_stock_entries": cancelled,
	}


@frappe.whitelist()
def cancel_parts_request(name: str):
	"""Cancel a parts request before issue — releases linked job card part lines."""
	pr = frappe.get_doc("DMS Parts Request", name)
	pr.check_permission("write")

	if pr.status not in _CANCELLABLE_PARTS_REQUEST_STATUSES:
		frappe.throw(_("Cannot cancel a parts request in status {0}.").format(pr.status or _("Unknown")))

	for row in pr.items:
		if row.job_card_part_row:
			frappe.db.set_value(
				"Job Card Part Item",
				row.job_card_part_row,
				{"line_status": "Requested", "parts_request": "", "is_backordered": 0, "backorder_quantity": 0},
				update_modified=False,
			)

	pr.status = "Cancelled"
	pr.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": pr.name, "status": pr.status}


PARTS_REQUEST_FILTER_PRESETS: dict[str, list[str]] = {
	"active": [
		"Pending Approval",
		"Approved",
		"Ready for Issue",
		"Partially Issued",
		"Issued",
	],
	"pending_approval": ["Pending Approval"],
	"ready_for_issue": ["Ready for Issue", "Partially Issued"],
}


@frappe.whitelist()
def list_parts_requests(
	limit=50,
	offset=0,
	status=None,
	filter=None,
	search=None,
):
	"""List parts requests for the parts department (Spare Parts Manager) workspace."""
	filters: dict = {}
	if status:
		filters["status"] = status
	elif filter and filter in PARTS_REQUEST_FILTER_PRESETS:
		filters["status"] = ["in", PARTS_REQUEST_FILTER_PRESETS[filter]]

	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", term],
			"job_card": ["like", term],
			"license_plate": ["like", term],
			"customer": ["like", term],
		}

	filters = add_branch_filter(filters, doctype="DMS Parts Request")

	total = len(
		frappe.get_all(
			"DMS Parts Request",
			filters=filters,
			or_filters=or_filters,
			limit_page_length=0,
			pluck="name",
		)
	)

	rows = frappe.get_all(
		"DMS Parts Request",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"status",
			"posting_date",
			"job_card",
			"customer",
			"license_plate",
			"vehicle_vin",
			"pick_slip",
			"stock_entry",
			"requested_by",
			"issued_date",
			"received_date",
			"modified",
		],
		order_by=LIST_ORDER_LATEST_CREATED,
		limit_page_length=int(limit),
		limit_start=int(offset),
	)

	for row in rows:
		row["item_count"] = frappe.db.count("DMS Parts Request Item", {"parent": row.name})
		if row.get("customer"):
			row["customer_name"] = frappe.db.get_value("Customer", row.customer, "customer_name")

	return {"data": rows, "total": total}


@frappe.whitelist()
def list_parts_requests_for_job_card(job_card: str):
	return frappe.get_all(
		"DMS Parts Request",
		filters={"job_card": job_card},
		fields=[
			"name",
			"status",
			"posting_date",
			"pick_slip",
			"stock_entry",
			"requested_by",
			"issued_date",
			"received_date",
		],
		order_by="creation desc",
	)


@frappe.whitelist()
def get_parts_request(name: str):
	pr = frappe.get_doc("DMS Parts Request", name)
	pr.check_permission("read")
	return pr.as_dict()


@frappe.whitelist()
def assign_job_card_workshop(job_card: str, lead_technician: str, assigned_bay: str | None = None):
	"""Workshop controller assigns technician and bay without changing workflow status."""
	jc = frappe.get_doc("DMS Job Card", job_card)
	jc.check_permission("write")

	if not lead_technician:
		frappe.throw(_("Lead Technician is required."))

	jc.lead_technician = lead_technician
	if assigned_bay:
		jc.assigned_bay = assigned_bay
		from dms.api.job_cards import _sync_workshop_warehouse_from_bay

		_sync_workshop_warehouse_from_bay(jc, assigned_bay)

	# Assignment is tracked via lead_technician / assigned_bay — do not overwrite workflow status.
	if (jc.status or "").strip() == "Assigned":
		jc.status = "Estimation Approved" if jc.docstatus == 1 else "Open"

	jc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": jc.name, "status": jc.status}
