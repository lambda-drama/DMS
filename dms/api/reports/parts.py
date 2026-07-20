# Copyright (c) 2026, Mania and contributors
"""Parts & Inventory reports and dashboard."""

from __future__ import annotations

import datetime

import frappe
from frappe import _
from frappe.utils import (
	cint,
	date_diff,
	flt,
	get_datetime,
	getdate,
	nowdate,
	time_diff_in_hours,
)

from dms.api.reports.common import (
	OPEN_JOB_CARD_STATUSES,
	_apply_link_display_names,
	_apply_vin_numbers,
	_bulk_full_names,
	_jc_filters,
	_parse_filters,
	_report_filters_response,
	_result,
	_strip_html,
	_vin_link_filter_value,
	_vin_sql_clause,
)
from dms.api.utils import get_dms_companies

def get_parts_fill_rate_report(filters=None):
	f = _parse_filters(filters)
	vin_sql, vin_params = _vin_sql_clause(f, "jc.vehicle_vin")
	sql_params = {"from_date": f["from_date"], "to_date": f["to_date"], **vin_params}
	data = frappe.db.sql(
		f"""
		SELECT
			SUM(COALESCE(p.quantity_requested, 0)) AS requested,
			SUM(COALESCE(p.quantity_issued, 0)) AS issued,
			SUM(CASE WHEN COALESCE(p.is_backordered, 0) = 1
				THEN COALESCE(p.quantity_requested, 0) - COALESCE(p.quantity_issued, 0)
				ELSE 0 END) AS backordered_qty,
			COUNT(*) AS line_count
		FROM `tabJob Card Part Item` p
		INNER JOIN `tabDMS Job Card` jc ON p.parent = jc.name
		WHERE p.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  {vin_sql}
		""",
		sql_params,
		as_dict=True,
	)
	row = data[0] if data else {}
	requested = flt(row.get("requested"))
	issued = flt(row.get("issued"))
	backordered = flt(row.get("backordered_qty"))
	fill_rate = round((issued / requested) * 100, 1) if requested else 0

	by_part = frappe.db.sql(
		f"""
		SELECT p.item_code,
			SUM(COALESCE(p.quantity_requested, 0)) AS requested,
			SUM(COALESCE(p.quantity_issued, 0)) AS issued,
			MAX(COALESCE(p.is_backordered, 0)) AS has_backorder
		FROM `tabJob Card Part Item` p
		INNER JOIN `tabDMS Job Card` jc ON p.parent = jc.name
		WHERE p.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND p.item_code IS NOT NULL
		  {vin_sql}
		GROUP BY p.item_code
		ORDER BY requested DESC
		LIMIT 100
		""",
		sql_params,
		as_dict=True,
	)

	return {
		"report_id": "parts_fill_rate",
		"title": "Parts Fill Rate",
		"filters": _report_filters_response(f),
		"summary": {
			"requested": requested,
			"issued": issued,
			"backordered": backordered,
			"fill_rate_pct": fill_rate,
			"line_count": int(row.get("line_count") or 0),
		},
		"columns": [
			{"key": "item_code", "label": "Part"},
			{"key": "requested", "label": "Requested"},
			{"key": "issued", "label": "Issued"},
			{"key": "has_backorder", "label": "Backordered"},
		],
		"rows": by_part,
	}

def get_parts_issued_per_job_report(filters=None):
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "DMS Parts Request"):
		return _result(
			"parts_issued_per_job",
			_("Parts Issued per Job Card"),
			f,
			{"total_lines": 0},
			[],
			[],
		)

	meta = frappe.get_meta("DMS Parts Request")
	req_fields = ["name", "job_card", "status", "creation"]
	if meta.has_field("technician"):
		req_fields.append("technician")
	if meta.has_field("lead_technician"):
		req_fields.append("lead_technician")

	reqs = frappe.get_all(
		"DMS Parts Request",
		filters={
			"creation": ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]],
			"docstatus": ["<", 2],
		},
		fields=req_fields,
		limit=1000,
	)
	req_names = [r.name for r in reqs]
	items = []
	if req_names and frappe.db.exists("DocType", "DMS Parts Request Item"):
		items = frappe.get_all(
			"DMS Parts Request Item",
			filters={"parent": ["in", req_names]},
			fields=[
				"parent",
				"item_code",
				"part_name",
				"quantity_requested",
				"quantity_issued",
				"line_status",
			],
			limit=5000,
		)
	req_map = {r.name: r for r in reqs}
	rows = []
	issued_qty_total = 0.0
	for it in items:
		req = req_map.get(it.parent) or frappe._dict()
		qty_issued = flt(it.get("quantity_issued"))
		issued_qty_total += qty_issued
		rows.append(
			{
				"parts_request": it.parent,
				"job_card": req.get("job_card"),
				"technician": req.get("technician") or req.get("lead_technician"),
				"status": req.get("status") or it.get("line_status"),
				"spare_part": it.get("item_code"),
				"part_name": it.get("part_name"),
				"qty_requested": flt(it.get("quantity_requested")),
				"qty_issued": qty_issued,
			}
		)

	return _result(
		"parts_issued_per_job",
		_("Parts Issued per Job Card"),
		f,
		{
			"total_lines": len(rows),
			"requests": len(reqs),
			"qty_issued_total": round(issued_qty_total, 2),
		},
		[
			{"key": "job_card", "label": _("Job Card")},
			{"key": "parts_request", "label": _("Parts Request")},
			{"key": "technician", "label": _("Technician")},
			{"key": "spare_part", "label": _("Part")},
			{"key": "part_name", "label": _("Part Name")},
			{"key": "qty_requested", "label": _("Requested")},
			{"key": "qty_issued", "label": _("Issued")},
			{"key": "status", "label": _("Status")},
		],
		rows,
	)

def get_material_request_status_report(filters=None):
	"""DMS Parts Request status (workshop material requests)."""
	f = _parse_filters(filters)
	if not frappe.db.exists("DocType", "DMS Parts Request"):
		return _result(
			"material_request_status",
			_("Material Request Status"),
			f,
			{"total": 0},
			[],
			[],
		)

	meta = frappe.get_meta("DMS Parts Request")
	fields = ["name", "job_card", "status", "creation", "modified"]
	for optional in ("technician", "lead_technician", "workshop", "warehouse", "requested_by"):
		if meta.has_field(optional):
			fields.append(optional)

	rows = frappe.get_all(
		"DMS Parts Request",
		filters={
			"creation": ["between", [str(f["from_date"]), str(f["to_date"]) + " 23:59:59"]],
			"docstatus": ["<", 2],
		},
		fields=fields,
		order_by="creation desc",
		limit=1500,
	)
	by_status = {}
	for row in rows:
		by_status[row.status or "—"] = by_status.get(row.status or "—", 0) + 1
		created = get_datetime(row.creation)
		row["waiting_hours"] = (
			round(time_diff_in_hours(frappe.utils.now_datetime(), created), 1) if created else None
		)
		row["technician"] = row.get("technician") or row.get("lead_technician")

	return _result(
		"material_request_status",
		_("Material Request Status"),
		f,
		{"total": len(rows), "by_status": by_status},
		[
			{"key": "name", "label": _("Request")},
			{"key": "job_card", "label": _("Job Card")},
			{"key": "status", "label": _("Status")},
			{"key": "technician", "label": _("Technician")},
			{"key": "workshop", "label": _("Workshop")},
			{"key": "waiting_hours", "label": _("Age (h)")},
			{"key": "creation", "label": _("Created")},
		],
		rows,
	)

def _parse_stock_report_filters(data=None):
	if isinstance(data, str):
		import json
		data = json.loads(data) if data else {}
	data = data or {}
	company = (data.get("company") or "").strip() or None
	warehouse = (data.get("warehouse") or "").strip() or None
	spare_part = (data.get("spare_part") or "").strip() or None
	search = (data.get("search") or data.get("spare_part_search") or "").strip() or None
	if not company:
		frappe.throw(_("Company is required for the Spare Parts Stock report."))
	if not warehouse:
		frappe.throw(_("Warehouse is required for the Spare Parts Stock report."))

	allowed = get_dms_companies()
	if allowed and company not in allowed:
		frappe.throw(_("Company must be one of the companies selected in DMS Settings."))
	if not frappe.db.exists("Warehouse", warehouse):
		frappe.throw(_("Warehouse {0} was not found.").format(frappe.bold(warehouse)))

	wh_company = frappe.db.get_value("Warehouse", warehouse, "company")
	if wh_company and wh_company != company:
		frappe.throw(_("Warehouse does not belong to the selected company."))
	return {
		"company": company,
		"warehouse": warehouse,
		"spare_part": spare_part,
		"search": search,
		"below_minimum_only": cint(data.get("below_minimum_only")),
		"include_zero_stock": cint(data.get("include_zero_stock", 1)),
	}

def _stock_report_filters_response(f):
	out = {}
	if f.get("company"):
		out["company"] = f["company"]
	if f.get("warehouse"):
		out["warehouse"] = f["warehouse"]
	if f.get("spare_part"):
		out["spare_part"] = f["spare_part"]
	if f.get("search"):
		out["search"] = f["search"]
	if f.get("below_minimum_only"):
		out["below_minimum_only"] = "1"
	return out

def _warehouses_for_stock_report(filters):
	"""Company and warehouse are required; returns a single-warehouse list."""
	warehouse = (filters.get("warehouse") or "").strip()
	if warehouse and frappe.db.exists("Warehouse", warehouse):
		return [warehouse]
	return []

def _spare_part_stock_status(qty, minimum_level):
	qty = flt(qty)
	minimum_level = flt(minimum_level)
	if qty <= 0:
		return _("Out of Stock")
	if minimum_level > 0 and qty < minimum_level:
		return _("Below Minimum")
	return _("OK")

def get_spare_parts_stock_report(filters=None):
	"""Spare parts on-hand stock by warehouse (ERPNext get_stock_balance on linked Item)."""
	from erpnext.stock.utils import get_stock_balance

	f = _parse_stock_report_filters(filters)
	warehouses = _warehouses_for_stock_report(f)
	if not warehouses:
		msg = _("Select company and warehouse in Filters, then click Apply.")
		if not get_dms_companies():
			msg = _("Add companies in DMS Settings, then select company and warehouse.")
		return {
			"report_id": "spare_parts_stock",
			"title": _("Spare Parts Stock"),
			"filters": _stock_report_filters_response(f),
			"summary": {"message": msg, "total_rows": 0},
			"columns": _spare_parts_stock_columns(),
			"rows": [],
		}

	sp_filters = {}
	if f.get("spare_part"):
		sp_filters["name"] = f["spare_part"]

	spare_parts = frappe.get_all(
		"Spare Part",
		filters=sp_filters,
		fields=[
			"name",
			"item_name",
			"item_code",
			"oem_part_number",
			"part_category",
			"spare_part_item",
			"stock_uom",
			"minimum_stock_level",
			"maximum_stock_level",
			"reorder_quantity",
			"selling_price",
		],
		order_by="item_name asc",
		limit_page_length=0,
	)

	needle = (f.get("search") or "").lower()
	if needle:
		def _matches(sp):
			for field in ("name", "item_name", "item_code", "oem_part_number", "part_category"):
				val = (sp.get(field) or "").lower()
				if needle in val:
					return True
			return False

		spare_parts = [sp for sp in spare_parts if _matches(sp)]

	wh_company = {}
	if warehouses:
		for row in frappe.get_all(
			"Warehouse",
			filters={"name": ["in", warehouses]},
			fields=["name", "company", "warehouse_name"],
		):
			wh_company[row.name] = row

	rows = []
	total_qty = 0.0
	below_min = 0
	out_of_stock = 0
	posting_date = nowdate()

	for sp in spare_parts:
		item_code = (sp.get("spare_part_item") or sp.get("item_code") or "").strip()
		if not item_code or not frappe.db.exists("Item", item_code):
			continue
		if not cint(frappe.db.get_value("Item", item_code, "is_stock_item")):
			continue

		min_level = flt(sp.get("minimum_stock_level"))
		for wh in warehouses:
			try:
				qty = flt(get_stock_balance(item_code, wh, posting_date) or 0)
			except Exception:
				qty = 0.0

			if not f.get("include_zero_stock") and qty == 0:
				continue

			status = _spare_part_stock_status(qty, min_level)
			if f.get("below_minimum_only") and status != _("Below Minimum"):
				continue

			wh_row = wh_company.get(wh) or {}
			rows.append({
				"spare_part": sp.name,
				"item_code": item_code,
				"item_name": sp.get("item_name") or item_code,
				"oem_part_number": sp.get("oem_part_number") or "",
				"part_category": sp.get("part_category") or "",
				"warehouse": wh,
				"warehouse_name": wh_row.get("warehouse_name") or wh,
				"company": wh_row.get("company") or f.get("company") or "",
				"stock_uom": sp.get("stock_uom") or frappe.db.get_value("Item", item_code, "stock_uom"),
				"qty": qty,
				"minimum_stock_level": min_level,
				"reorder_quantity": flt(sp.get("reorder_quantity")),
				"selling_price": flt(sp.get("selling_price")),
				"stock_status": status,
			})
			total_qty += qty
			if status == _("Below Minimum"):
				below_min += 1
			elif status == _("Out of Stock"):
				out_of_stock += 1

	return {
		"report_id": "spare_parts_stock",
		"title": _("Spare Parts Stock"),
		"filters": _stock_report_filters_response(f),
		"summary": {
			"as_at_date": str(posting_date),
			"warehouse_count": len(warehouses),
			"spare_part_count": len({r["spare_part"] for r in rows}),
			"total_rows": len(rows),
			"total_qty": round(total_qty, 2),
			"below_minimum_rows": below_min,
			"out_of_stock_rows": out_of_stock,
		},
		"columns": _spare_parts_stock_columns(),
		"rows": rows,
	}

def _spare_parts_stock_columns():
	return [
		{"key": "spare_part", "label": _("Spare Part")},
		{"key": "item_code", "label": _("Item Code")},
		{"key": "item_name", "label": _("Item Name")},
		{"key": "oem_part_number", "label": _("OEM Part No.")},
		{"key": "part_category", "label": _("Category")},
		{"key": "warehouse_name", "label": _("Warehouse")},
		{"key": "company", "label": _("Company")},
		{"key": "qty", "label": _("Qty On Hand")},
		{"key": "stock_uom", "label": _("UOM")},
		{"key": "minimum_stock_level", "label": _("Min Level")},
		{"key": "reorder_quantity", "label": _("Reorder Qty")},
		{"key": "stock_status", "label": _("Status")},
		{"key": "selling_price", "label": _("Selling Price")},
	]


def get_parts_dashboard(filters=None):
	f = _parse_filters(filters)
	mr = get_material_request_status_report(f)
	fill = get_parts_fill_rate_report(f)
	return {
		"section_id": "parts",
		"title": _("Parts & Inventory"),
		"filters": _report_filters_response(f),
		"summary": {
			"open_requests": mr["summary"].get("total", 0),
			"fill_rate_pct": fill["summary"].get("fill_rate_pct", 0),
			"requested": fill["summary"].get("requested", 0),
			"issued": fill["summary"].get("issued", 0),
			"by_status": mr["summary"].get("by_status", {}),
		},
	}


REPORT_HANDLERS = {
	"spare_parts_stock": get_spare_parts_stock_report,
	"parts_issued_per_job": get_parts_issued_per_job_report,
	"material_request_status": get_material_request_status_report,
	"parts_fill_rate": get_parts_fill_rate_report,
}
