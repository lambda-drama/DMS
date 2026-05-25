# Copyright (c) 2026, Mania and contributors
"""BRD §20 management reports for the DMS frontend."""

import datetime

import frappe
from frappe import _
from frappe.utils import add_days, cint, date_diff, flt, getdate, nowdate

from dms.api.dashboard import ACTIVE_JOB_CARD_STATUSES
from dms.api.utils import get_dms_companies

OPEN_JOB_CARD_STATUSES = list(ACTIVE_JOB_CARD_STATUSES)


def _strip_html(text) -> str:
	if not text:
		return ""
	import re
	return re.sub(r"<[^>]+>", "", str(text)).strip()


def _parse_filters(data=None):
	if isinstance(data, str):
		import json
		data = json.loads(data) if data else {}
	data = data or {}
	from_date = getdate(data.get("from_date") or add_days(nowdate(), -30))
	to_date = getdate(data.get("to_date") or nowdate())
	if from_date > to_date:
		from_date, to_date = to_date, from_date
	vin_no = (data.get("vin_no") or data.get("vehicle_vin_name") or "").strip() or None
	vin_search = (data.get("vehicle_vin") or data.get("vin") or "").strip() or None
	vin_names, vin_number_map, vin_display = _resolve_vin_filter(vin_no, vin_search)
	return {
		"from_date": from_date,
		"to_date": to_date,
		"company": (data.get("company") or "").strip() or None,
		"vin_no": vin_no,
		"vehicle_vin_search": vin_display,
		"vin_names": vin_names,
		"vin_number_map": vin_number_map,
	}


def _resolve_vin_filter(vin_no=None, vin_search=None):
	"""Resolve VIN filter from dropdown (exact link) or free-text search."""
	if vin_no and frappe.db.exists("VIN No", vin_no):
		vin_number = frappe.db.get_value("VIN No", vin_no, "vin_number") or vin_no
		return [vin_no], {vin_no: vin_number}, vin_number
	if vin_no:
		return [], {}, vin_no
	if vin_search:
		names, mapping = _lookup_vins(vin_search)
		return names, mapping, vin_search
	return None, {}, None


def _lookup_vins(search_term):
	"""Resolve partial VIN search to VIN No link names (None = no filter)."""
	if not search_term:
		return None, {}
	term = search_term.strip()
	if not term:
		return None, {}
	rows = frappe.get_all(
		"VIN No",
		or_filters={
			"vin_number": ["like", f"%{term}%"],
			"name": ["like", f"%{term}%"],
		},
		fields=["name", "vin_number"],
		limit=100,
	)
	if not rows:
		return [], {}
	return [r.name for r in rows], {r.name: (r.vin_number or r.name) for r in rows}


def _vin_link_filter_value(filters):
	"""Value for Link fields (vehicle_vin / vin_chassis) when VIN search is active."""
	if filters.get("vin_names") is None:
		return None
	return filters["vin_names"] or ["__NO_VIN_MATCH__"]


def _vin_sql_clause(filters, column="jc.vehicle_vin"):
	if filters.get("vin_names") is None:
		return "", {}
	if not filters["vin_names"]:
		return " AND 1=0", {}
	return f" AND {column} IN %(vin_names)s", {"vin_names": filters["vin_names"]}


def _report_filters_response(f):
	out = {"from_date": str(f["from_date"]), "to_date": str(f["to_date"])}
	if f.get("vin_no"):
		out["vin_no"] = f["vin_no"]
	if f.get("vehicle_vin_search"):
		out["vehicle_vin"] = f["vehicle_vin_search"]
	return out


def _jc_filters(filters, extra=None):
	conds = {
		"posting_date": ["between", [filters["from_date"], filters["to_date"]]],
	}
	if filters.get("company"):
		conds["company"] = filters["company"]
	vin_val = _vin_link_filter_value(filters)
	if vin_val is not None:
		conds["vehicle_vin"] = ["in", vin_val]
	if extra:
		conds.update(extra)
	return conds


def _apply_vin_numbers(rows, link_field="vehicle_vin", output_field="vin_number"):
	if not rows:
		return rows
	ids = list({_row_get(r, link_field) for r in rows if _row_get(r, link_field)})
	vin_map = {}
	if ids:
		for row in frappe.get_all(
			"VIN No",
			filters={"name": ["in", ids]},
			fields=["name", "vin_number"],
		):
			vin_map[row.name] = (row.vin_number or row.name)
	for row in rows:
		vid = _row_get(row, link_field)
		_row_set(row, output_field, vin_map.get(vid, vid or ""))
	return rows


def _apply_vin_numbers_from_field(rows, link_field="vin", output_field="vin_number"):
	return _apply_vin_numbers(rows, link_field=link_field, output_field=output_field)


def _row_get(row, field):
	if isinstance(row, dict):
		return row.get(field)
	return getattr(row, field, None)


def _row_set(row, field, value):
	if isinstance(row, dict):
		row[field] = value
	else:
		setattr(row, field, value)


def _bulk_full_names(doctype, ids):
	"""Map document name → full_name for Service Advisor / Technician."""
	unique = list({str(n).strip() for n in ids if n and str(n).strip()})
	if not unique:
		return {}
	if not frappe.db.exists("DocType", doctype):
		return {n: n for n in unique}

	rows = frappe.get_all(
		doctype,
		filters={"name": ["in", unique]},
		fields=["name", "full_name"],
	)
	mapping = {r.name: (r.full_name or r.name).strip() or r.name for r in rows}
	for name in unique:
		mapping.setdefault(name, name)
	return mapping


def _apply_link_display_names(rows, field_doctype_map):
	"""Replace link IDs on each row with human-readable full_name."""
	if not rows:
		return rows
	for field, doctype in field_doctype_map.items():
		mapping = _bulk_full_names(doctype, [_row_get(r, field) for r in rows])
		for row in rows:
			raw = _row_get(row, field)
			if raw:
				_row_set(row, field, mapping.get(raw, raw))
	return rows


@frappe.whitelist()
def list_reports():
	"""Metadata for the Reports hub (BRD §20)."""
	return [
		{"id": "daily_wip", "title": "Daily WIP Report", "description": "Open job cards by status, advisor, technician, bay, promised delivery."},
		{"id": "service_revenue", "title": "Service Revenue Report", "description": "Labor, parts, discounts, net revenue by period, model, and advisor."},
		{"id": "technician_productivity", "title": "Technician Productivity", "description": "Available, sold, actual hours, efficiency, and idle time."},
		{"id": "parts_fill_rate", "title": "Parts Fill Rate", "description": "Requested vs issued vs backordered parts."},
		{"id": "warranty", "title": "Warranty Report", "description": "Warranty job cards, claims value, and approval status."},
		{"id": "repeat_repair", "title": "Repeat Repair Report", "description": "Repeat complaints by VIN, model, technician, and category."},
		{"id": "customer_retention", "title": "Customer Retention", "description": "Returning customers and first-service conversion."},
		{"id": "appointment_conversion", "title": "Appointment Conversion", "description": "Booked, arrived, no-show, rescheduled, walk-in mix."},
		{"id": "qc_failure", "title": "QC Failure Report", "description": "QC fail rate, reasons, rework, and responsible team."},
		{"id": "customer_satisfaction", "title": "Customer Satisfaction", "description": "Ratings, complaints, follow-up, advisor performance."},
		{"id": "odometer_exception", "title": "Odometer Exception Report", "description": "Rollback, unreadable, or large mileage jumps."},
		{"id": "aging", "title": "Aging Report", "description": "Vehicles in workshop by days open and hold reason."},
		{
			"id": "spare_parts_stock",
			"title": "Spare Parts Stock",
			"description": "On-hand stock for one company and warehouse (Spare Part → Item, ERPNext stock balance).",
			"filter_type": "stock",
		},
	]


@frappe.whitelist()
def get_report(report_id, filters=None):
	"""Run a BRD report by id."""
	if isinstance(filters, str):
		import json
		filters = json.loads(filters) if filters else {}

	handlers = {
		"daily_wip": get_daily_wip_report,
		"service_revenue": get_service_revenue_report,
		"technician_productivity": get_technician_productivity_report,
		"parts_fill_rate": get_parts_fill_rate_report,
		"warranty": get_warranty_report,
		"repeat_repair": get_repeat_repair_report,
		"customer_retention": get_customer_retention_report,
		"appointment_conversion": get_appointment_conversion_report,
		"qc_failure": get_qc_failure_report,
		"customer_satisfaction": get_customer_satisfaction_report,
		"odometer_exception": get_odometer_exception_report,
		"aging": get_aging_report,
		"spare_parts_stock": get_spare_parts_stock_report,
	}
	fn = handlers.get((report_id or "").strip())
	if not fn:
		frappe.throw(_("Unknown report: {0}").format(report_id))
	return fn(filters)


@frappe.whitelist()
def get_brd_dashboard_kpis(filters=None):
	"""Summary KPIs for the home dashboard (BRD §20 highlights)."""
	f = _parse_filters(filters)
	wip = get_daily_wip_report(f)
	revenue = get_service_revenue_report(f)
	apt = get_appointment_conversion_report(f)
	qc = get_qc_failure_report(f)
	fill = get_parts_fill_rate_report(f)
	return {
		"from_date": str(f["from_date"]),
		"to_date": str(f["to_date"]),
		"open_job_cards": wip["summary"].get("total_open", 0),
		"overdue_promised": wip["summary"].get("overdue_promised", 0),
		"net_revenue": revenue["summary"].get("net_revenue", 0),
		"labour_revenue": revenue["summary"].get("labour_total", 0),
		"parts_revenue": revenue["summary"].get("parts_total", 0),
		"appointment_arrival_rate": apt["summary"].get("arrival_rate_pct", 0),
		"qc_fail_rate_pct": qc["summary"].get("fail_rate_pct", 0),
		"parts_fill_rate_pct": fill["summary"].get("fill_rate_pct", 0),
		"warranty_jobs": get_warranty_report(f)["summary"].get("total_jobs", 0),
	}


@frappe.whitelist()
def get_daily_wip_report(filters=None):
	f = _parse_filters(filters)
	conds = {"status": ["in", OPEN_JOB_CARD_STATUSES]}
	if f.get("company"):
		conds["company"] = f["company"]
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		conds["vehicle_vin"] = ["in", vin_val]

	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "status", "priority", "customer_name", "vehicle_model",
			"vehicle_vin", "license_plate", "service_advisor", "lead_technician", "assigned_bay",
			"promised_delivery_date_time", "opened_date_time", "posting_date",
		],
		order_by="promised_delivery_date_time asc",
		limit=500,
	)

	_apply_link_display_names(
		rows,
		{"service_advisor": "Service Advisor", "lead_technician": "Technician"},
	)
	_apply_vin_numbers(rows)

	today = getdate(nowdate())
	overdue = 0
	by_status = {}
	by_advisor = {}
	by_technician = {}
	by_bay = {}

	for row in rows:
		if row.promised_delivery_date_time:
			pd = getdate(row.promised_delivery_date_time)
			if pd < today:
				overdue += 1
		by_status[row.status] = by_status.get(row.status, 0) + 1
		advisor = row.service_advisor or _("Unassigned")
		by_advisor[advisor] = by_advisor.get(advisor, 0) + 1
		tech = row.lead_technician or _("Unassigned")
		by_technician[tech] = by_technician.get(tech, 0) + 1
		bay = row.assigned_bay or _("Unassigned")
		by_bay[bay] = by_bay.get(bay, 0) + 1

	return {
		"report_id": "daily_wip",
		"title": "Daily WIP Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_open": len(rows),
			"overdue_promised": overdue,
			"by_status": by_status,
			"by_advisor": by_advisor,
			"by_technician": by_technician,
			"by_bay": by_bay,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "customer_name", "label": "Customer"},
			{"key": "vehicle_model", "label": "Model"},
			{"key": "service_advisor", "label": "Advisor"},
			{"key": "lead_technician", "label": "Technician"},
			{"key": "assigned_bay", "label": "Bay"},
			{"key": "promised_delivery_date_time", "label": "Promised Delivery"},
		],
		"rows": rows,
	}


@frappe.whitelist()
def get_service_revenue_report(filters=None):
	f = _parse_filters(filters)
	conds = _jc_filters(f, {"docstatus": ["<", 2]})

	jcs = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "posting_date", "vehicle_model", "vehicle_vin", "service_advisor",
			"total_labor_cost", "total_parts_cost", "discount_amount",
			"net_amount", "total_amount", "job_card_type",
		],
		limit=2000,
	)

	_apply_link_display_names(jcs, {"service_advisor": "Service Advisor"})
	_apply_vin_numbers(jcs)

	labour_total = parts_total = discount_total = net_total = 0.0
	by_month = {}
	by_advisor = {}
	by_model = {}

	for jc in jcs:
		lab = flt(jc.total_labor_cost)
		prt = flt(jc.total_parts_cost)
		disc = flt(jc.discount_amount)
		net = flt(jc.net_amount or jc.total_amount)
		labour_total += lab
		parts_total += prt
		discount_total += disc
		net_total += net

		month = str(getdate(jc.posting_date))[:7] if jc.posting_date else "—"
		if month not in by_month:
			by_month[month] = {"labour": 0, "parts": 0, "discount": 0, "net": 0, "count": 0}
		by_month[month]["labour"] += lab
		by_month[month]["parts"] += prt
		by_month[month]["discount"] += disc
		by_month[month]["net"] += net
		by_month[month]["count"] += 1

		adv = jc.service_advisor or _("Unassigned")
		if adv not in by_advisor:
			by_advisor[adv] = {"labour": 0, "parts": 0, "net": 0, "count": 0}
		by_advisor[adv]["labour"] += lab
		by_advisor[adv]["parts"] += prt
		by_advisor[adv]["net"] += net
		by_advisor[adv]["count"] += 1

		mdl = jc.vehicle_model or _("Unknown")
		if mdl not in by_model:
			by_model[mdl] = {"labour": 0, "parts": 0, "net": 0, "count": 0}
		by_model[mdl]["labour"] += lab
		by_model[mdl]["parts"] += prt
		by_model[mdl]["net"] += net
		by_model[mdl]["count"] += 1

	# VAT / tax from linked Sales Invoices when ERPNext is installed
	vat_total = 0.0
	if frappe.db.exists("DocType", "Sales Invoice"):
		si_filters = {
			"posting_date": ["between", [f["from_date"], f["to_date"]]],
			"docstatus": 1,
		}
		if f.get("company"):
			si_filters["company"] = f["company"]
		if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
			inv_names = [jc.name for jc in jcs if jc.name]
			if inv_names:
				sis = frappe.get_all(
					"Sales Invoice",
					filters={
						**si_filters,
						"custom_dms_job_card": ["in", inv_names],
					},
					fields=["name", "total_taxes_and_charges", "grand_total", "net_total"],
				)
				vat_total = sum(flt(s.total_taxes_and_charges) for s in sis)

	return {
		"report_id": "service_revenue",
		"title": "Service Revenue Report",
		"filters": _report_filters_response(f),
		"summary": {
			"labour_total": round(labour_total, 2),
			"parts_total": round(parts_total, 2),
			"discount_total": round(discount_total, 2),
			"vat_total": round(vat_total, 2),
			"net_revenue": round(net_total, 2),
			"job_card_count": len(jcs),
			"by_month": by_month,
			"by_advisor": by_advisor,
			"by_model": by_model,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "posting_date", "label": "Date"},
			{"key": "vehicle_model", "label": "Model"},
			{"key": "service_advisor", "label": "Advisor"},
			{"key": "total_labor_cost", "label": "Labour"},
			{"key": "total_parts_cost", "label": "Parts"},
			{"key": "discount_amount", "label": "Discount"},
			{"key": "net_amount", "label": "Net"},
		],
		"rows": jcs,
	}


@frappe.whitelist()
def get_technician_productivity_report(filters=None):
	f = _parse_filters(filters)
	tech_filters = {"status": "Active"}
	technicians = frappe.get_all(
		"Technician",
		filters=tech_filters,
		fields=[
			"name", "full_name", "efficiency_rating", "productivity_score",
			"total_sold_hours", "total_labor_hours", "total_idle_hours",
			"first_time_fix_rate", "customer_satisfaction_score",
		],
		order_by="full_name asc",
		limit=200,
	)

	vin_sql, vin_params = _vin_sql_clause(f, "jc.vehicle_vin")
	labour_hours = frappe.db.sql(
		f"""
		SELECT l.technician, SUM(COALESCE(l.estimated_hours, 0)) AS sold_hours
		FROM `tabVehicle Labour Item` l
		INNER JOIN `tabDMS Job Card` jc ON l.parent = jc.name
		WHERE l.parenttype = 'DMS Job Card'
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND l.technician IS NOT NULL AND l.technician != ''
		  {vin_sql}
		GROUP BY l.technician
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
		as_dict=True,
	)
	sold_by_tech = {r.technician: flt(r.sold_hours) for r in labour_hours}

	rows = []
	for t in technicians:
		sold = sold_by_tech.get(t.name, flt(t.total_sold_hours))
		actual = flt(t.total_labor_hours)
		idle = flt(t.total_idle_hours)
		available = sold + idle if (sold + idle) > 0 else actual or sold
		efficiency = flt(t.efficiency_rating)
		if not efficiency and available > 0:
			efficiency = round((sold / available) * 100, 1)
		rows.append({
			"technician": t.name,
			"full_name": t.full_name or t.name,
			"available_hours": round(available, 2),
			"sold_hours": round(sold, 2),
			"actual_hours": round(actual, 2),
			"idle_hours": round(idle, 2),
			"efficiency_pct": efficiency,
			"productivity_score": flt(t.productivity_score),
			"first_time_fix_rate": flt(t.first_time_fix_rate),
		})

	return {
		"report_id": "technician_productivity",
		"title": "Technician Productivity",
		"filters": _report_filters_response(f),
		"summary": {
			"technician_count": len(rows),
			"total_sold_hours": round(sum(r["sold_hours"] for r in rows), 2),
			"avg_efficiency_pct": round(
				sum(r["efficiency_pct"] for r in rows) / len(rows), 1
			) if rows else 0,
		},
		"columns": [
			{"key": "full_name", "label": "Technician"},
			{"key": "available_hours", "label": "Available Hrs"},
			{"key": "sold_hours", "label": "Sold Hrs"},
			{"key": "actual_hours", "label": "Actual Hrs"},
			{"key": "idle_hours", "label": "Idle Hrs"},
			{"key": "efficiency_pct", "label": "Efficiency %"},
			{"key": "productivity_score", "label": "Productivity"},
		],
		"rows": rows,
	}


@frappe.whitelist()
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


@frappe.whitelist()
def get_warranty_report(filters=None):
	f = _parse_filters(filters)
	conds = _jc_filters(
		f,
		{
			"docstatus": ["<", 2],
			"job_card_type": ["in", ["Warranty", "Goodwill", "Campaign/Recall"]],
		},
	)
	# Also include any job card with warranty application
	rows = frappe.get_all(
		"DMS Job Card",
		filters=conds,
		fields=[
			"name", "posting_date", "customer_name", "vehicle_model", "vehicle_vin", "license_plate",
			"job_card_type", "warranty_application_type", "warranty_status",
			"customer_approval_status", "payment_status", "net_amount", "invoice",
		],
		order_by="posting_date desc",
		limit=500,
	)

	extra = frappe.get_all(
		"DMS Job Card",
		filters={
			**_jc_filters(f, {"docstatus": ["<", 2]}),
			"warranty_application_type": ["is", "set"],
			"name": ["not in", [r.name for r in rows] or ["__none__"]],
		},
		fields=[
			"name", "posting_date", "customer_name", "vehicle_model", "vehicle_vin", "license_plate",
			"job_card_type", "warranty_application_type", "warranty_status",
			"customer_approval_status", "payment_status", "net_amount", "invoice",
		],
		limit=500,
	)
	seen = {r.name for r in rows}
	for r in extra:
		if r.name not in seen:
			rows.append(r)
			seen.add(r.name)

	approved = rejected = pending = 0
	reimbursement = 0.0
	for r in rows:
		status = (r.customer_approval_status or "").lower()
		if "approved" in status:
			approved += 1
		elif "rejected" in status or "declined" in status:
			rejected += 1
		else:
			pending += 1
		reimbursement += flt(r.net_amount)

	_apply_vin_numbers(rows)

	return {
		"report_id": "warranty",
		"title": "Warranty Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_jobs": len(rows),
			"approved": approved,
			"rejected": rejected,
			"pending": pending,
			"reimbursement_value": round(reimbursement, 2),
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "posting_date", "label": "Date"},
			{"key": "job_card_type", "label": "Type"},
			{"key": "warranty_application_type", "label": "Application"},
			{"key": "customer_approval_status", "label": "Approval"},
			{"key": "payment_status", "label": "Payment"},
			{"key": "net_amount", "label": "Value"},
		],
		"rows": rows,
	}


@frappe.whitelist()
def get_repeat_repair_report(filters=None):
	f = _parse_filters(filters)
	company_sql = ""
	vin_sql, vin_params = _vin_sql_clause(f, "jc.vehicle_vin")
	params = {"from_date": f["from_date"], "to_date": f["to_date"], **vin_params}
	if f.get("company"):
		company_sql = " AND jc.company = %(company)s"
		params["company"] = f["company"]

	rows = frappe.db.sql(
		f"""
		SELECT
			jc.name,
			jc.posting_date,
			jc.vehicle_vin,
			jc.vehicle_model,
			jc.license_plate,
			jc.lead_technician,
			jc.repeat_repair_reference,
			(
				SELECT ji.complaint_description
				FROM `tabJob Card Item` ji
				WHERE ji.parent = jc.name
				  AND ji.parenttype = 'DMS Job Card'
				  AND ji.parentfield = 'job_items'
				ORDER BY ji.idx ASC
				LIMIT 1
			) AS complaint_description,
			(
				SELECT ji.symptom_category
				FROM `tabJob Card Item` ji
				WHERE ji.parent = jc.name
				  AND ji.parenttype = 'DMS Job Card'
				  AND ji.parentfield = 'job_items'
				ORDER BY ji.idx ASC
				LIMIT 1
			) AS symptom_category
		FROM `tabDMS Job Card` jc
		WHERE jc.is_repeat_repair = 1
		  AND jc.posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.docstatus < 2
		  {company_sql}
		  {vin_sql}
		ORDER BY jc.posting_date DESC
		LIMIT 300
		""",
		params,
		as_dict=True,
	)

	_apply_link_display_names(rows, {"lead_technician": "Technician"})
	_apply_vin_numbers(rows)

	by_vin = {}
	by_model = {}
	by_tech = {}
	by_category = {}
	for r in rows:
		r.complaint_description = _strip_html(r.complaint_description)[:500]
		vin = r.vin_number or r.vehicle_vin or "—"
		by_vin[vin] = by_vin.get(vin, 0) + 1
		mdl = r.vehicle_model or "—"
		by_model[mdl] = by_model.get(mdl, 0) + 1
		tech = r.lead_technician or "—"
		by_tech[tech] = by_tech.get(tech, 0) + 1
		cat = (r.symptom_category or "").strip() or _("Uncategorized")
		by_category[cat] = by_category.get(cat, 0) + 1

	return {
		"report_id": "repeat_repair",
		"title": "Repeat Repair Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_repeat_repairs": len(rows),
			"by_vin": by_vin,
			"by_model": by_model,
			"by_technician": by_tech,
			"by_symptom_category": by_category,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "posting_date", "label": "Date"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "vehicle_model", "label": "Model"},
			{"key": "symptom_category", "label": "Symptom category"},
			{"key": "complaint_description", "label": "Complaint"},
			{"key": "lead_technician", "label": "Technician"},
			{"key": "repeat_repair_reference", "label": "Reference JC"},
		],
		"rows": rows,
	}


@frappe.whitelist()
def get_customer_retention_report(filters=None):
	f = _parse_filters(filters)
	vin_sql, vin_params = _vin_sql_clause(f, "vehicle_vin")
	# Customers with more than one job card in period (per VIN when filtered)
	repeat_customers = frappe.db.sql(
		f"""
		SELECT customer, customer_name, vehicle_vin, COUNT(*) AS visit_count,
			SUM(COALESCE(net_amount, total_amount, 0)) AS total_spent
		FROM `tabDMS Job Card`
		WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND customer IS NOT NULL AND customer != ''
		  AND docstatus < 2
		  {vin_sql}
		GROUP BY customer, vehicle_vin
		HAVING COUNT(*) > 1
		ORDER BY visit_count DESC
		LIMIT 100
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
		as_dict=True,
	)
	_apply_vin_numbers(repeat_customers)

	unique_customers = frappe.db.sql(
		f"""
		SELECT COUNT(DISTINCT customer) FROM `tabDMS Job Card`
		WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
		  AND customer IS NOT NULL AND docstatus < 2
		  {vin_sql}
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
	)[0][0]

	first_from_appointment = frappe.db.count(
		"Service Appointment",
		{
			"appointment_date_time": ["between", [
				datetime.datetime.combine(f["from_date"], datetime.time.min),
				datetime.datetime.combine(f["to_date"], datetime.time.max),
			]],
			"status": ["in", ["Completed", "In Workshop", "Ready for Pickup"]],
		},
	)

	return {
		"report_id": "customer_retention",
		"title": "Customer Retention",
		"filters": _report_filters_response(f),
		"summary": {
			"unique_customers": int(unique_customers or 0),
			"returning_customers": len(repeat_customers),
			"retention_rate_pct": round(
				(len(repeat_customers) / int(unique_customers)) * 100, 1
			) if unique_customers else 0,
			"completed_appointments": first_from_appointment,
		},
		"columns": [
			{"key": "customer_name", "label": "Customer"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "visit_count", "label": "Visits"},
			{"key": "total_spent", "label": "Total Spent"},
		],
		"rows": repeat_customers,
	}


@frappe.whitelist()
def get_appointment_conversion_report(filters=None):
	f = _parse_filters(filters)
	start = datetime.datetime.combine(f["from_date"], datetime.time.min)
	end = datetime.datetime.combine(f["to_date"], datetime.time.max)

	apt_filters = {"appointment_date_time": ["between", [start, end]]}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		apt_filters["vin_chassis"] = ["in", vin_val]

	apts = frappe.get_all(
		"Service Appointment",
		filters=apt_filters,
		fields=["name", "status", "booking_source", "customer_name", "vin_chassis"],
		limit=5000,
	)
	_apply_vin_numbers(apts, link_field="vin_chassis")

	by_status = {}
	walk_in = 0
	for a in apts:
		st = a.status or "Booked"
		by_status[st] = by_status.get(st, 0) + 1
		if (a.booking_source or "").lower() in ("walk-in", "walk in", "walkin"):
			walk_in += 1

	total = len(apts) or 1
	arrived = sum(
		by_status.get(s, 0)
		for s in ("Arrived", "In Inspection", "In Workshop", "Ready for Pickup", "Completed")
	)
	no_show = by_status.get("No-Show", 0)
	rescheduled = by_status.get("Rescheduled", 0)
	booked = by_status.get("Booked", 0) + by_status.get("Reminder Sent", 0)

	return {
		"report_id": "appointment_conversion",
		"title": "Appointment Conversion",
		"filters": _report_filters_response(f),
		"summary": {
			"total": len(apts),
			"booked": booked,
			"arrived": arrived,
			"no_show": no_show,
			"rescheduled": rescheduled,
			"walk_in": walk_in,
			"walk_in_pct": round((walk_in / total) * 100, 1),
			"arrival_rate_pct": round((arrived / total) * 100, 1),
			"by_status": by_status,
		},
		"columns": [
			{"key": "name", "label": "Appointment"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "booking_source", "label": "Source"},
			{"key": "customer_name", "label": "Customer"},
		],
		"rows": apts[:200],
	}


@frappe.whitelist()
def get_qc_failure_report(filters=None):
	f = _parse_filters(filters)
	failed = frappe.get_all(
		"DMS Job Card",
		filters={
			**_jc_filters(f),
			"status": ["in", ["QC Failed", "Rework"]],
		},
		fields=[
			"name", "status", "vehicle_vin", "qc_fail_reason", "qc_result", "rework_required",
			"lead_technician", "service_advisor", "opened_date_time", "completed_date_time",
		],
		limit=300,
	)

	_apply_link_display_names(
		failed,
		{"lead_technician": "Technician", "service_advisor": "Service Advisor"},
	)
	_apply_vin_numbers(failed)

	total_qc = frappe.db.count(
		"DMS Job Card",
		{
			**_jc_filters(f),
			"status": ["in", ["QC In Progress", "QC Failed", "Rework", "Completed", "Delivered"]],
		},
	)
	fail_count = len(failed)
	fail_rate = round((fail_count / total_qc) * 100, 1) if total_qc else 0

	by_reason = {}
	for r in failed:
		reason = r.qc_fail_reason or _("Unspecified")
		by_reason[reason] = by_reason.get(reason, 0) + 1

	return {
		"report_id": "qc_failure",
		"title": "QC Failure Report",
		"filters": _report_filters_response(f),
		"summary": {
			"fail_count": fail_count,
			"total_qc_jobs": total_qc,
			"fail_rate_pct": fail_rate,
			"by_reason": by_reason,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "status", "label": "Status"},
			{"key": "qc_fail_reason", "label": "Fail Reason"},
			{"key": "lead_technician", "label": "Technician"},
			{"key": "service_advisor", "label": "Advisor"},
		],
		"rows": failed,
	}


@frappe.whitelist()
def get_customer_satisfaction_report(filters=None):
	f = _parse_filters(filters)
	fu_filters = {
		"follow_up_completed_date": ["between", [f["from_date"], f["to_date"]]],
	}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		fu_filters["vehicle_vin"] = ["in", vin_val]

	follow_ups = frappe.get_all(
		"Customer Follow Up",
		filters=fu_filters,
		fields=[
			"name", "job_card", "vehicle_vin", "customer", "customer_rating", "nps_score",
			"service_quality_rating", "advisor_courtesy_rating", "technician_courtesy_rating",
			"timeliness_rating", "customer_complaint", "issue_resolved", "assigned_to",
		],
		limit=500,
	)
	_apply_vin_numbers(follow_ups)

	ratings = [flt(r.customer_rating) for r in follow_ups if r.customer_rating]
	avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0
	complaints = sum(1 for r in follow_ups if r.customer_complaint)
	resolved = sum(1 for r in follow_ups if cint(r.issue_resolved))

	vin_sql, vin_params = _vin_sql_clause(f, "COALESCE(cf.vehicle_vin, jc.vehicle_vin)")
	by_advisor = frappe.db.sql(
		f"""
		SELECT jc.service_advisor,
			AVG(COALESCE(cf.customer_rating, 0)) AS avg_rating,
			COUNT(*) AS cnt
		FROM `tabCustomer Follow Up` cf
		LEFT JOIN `tabDMS Job Card` jc ON cf.job_card = jc.name
		WHERE cf.follow_up_completed_date BETWEEN %(from_date)s AND %(to_date)s
		  AND jc.service_advisor IS NOT NULL
		  {vin_sql}
		GROUP BY jc.service_advisor
		ORDER BY avg_rating DESC
		LIMIT 20
		""",
		{"from_date": f["from_date"], "to_date": f["to_date"], **vin_params},
		as_dict=True,
	)

	advisor_map = _bulk_full_names(
		"Service Advisor", [r.service_advisor for r in by_advisor if r.service_advisor]
	)
	for row in by_advisor:
		if row.service_advisor:
			row.service_advisor = advisor_map.get(row.service_advisor, row.service_advisor)

	return {
		"report_id": "customer_satisfaction",
		"title": "Customer Satisfaction",
		"filters": _report_filters_response(f),
		"summary": {
			"follow_up_count": len(follow_ups),
			"avg_rating": avg_rating,
			"complaints": complaints,
			"issues_resolved": resolved,
			"by_advisor": by_advisor,
		},
		"columns": [
			{"key": "job_card", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "customer_rating", "label": "Rating"},
			{"key": "nps_score", "label": "NPS"},
			{"key": "issue_resolved", "label": "Resolved"},
			{"key": "customer_complaint", "label": "Complaint"},
		],
		"rows": follow_ups,
	}


@frappe.whitelist()
def get_odometer_exception_report(filters=None):
	f = _parse_filters(filters)
	exceptions = []

	insp_filters = {
		"inspection_date": ["between", [f["from_date"], f["to_date"]]],
		"docstatus": 1,
	}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		insp_filters["vin_chassis"] = ["in", vin_val]

	inspections = frappe.get_all(
		"Vehicle Inspection",
		filters=insp_filters,
		fields=["name", "vin_chassis", "odometer", "inspection_date", "license_plate"],
		order_by="vin_chassis, inspection_date",
		limit=1000,
	)
	vin_display = f.get("vin_number_map") or {}

	prev_by_vin = {}
	for inv in inspections:
		vin = inv.vin_chassis
		vin_label = vin_display.get(vin) or frappe.db.get_value("VIN No", vin, "vin_number") if vin else ""
		if not vin_label and vin:
			vin_label = vin
		odo = flt(inv.odometer)
		if odo <= 0:
			exceptions.append({
				"type": "Unreadable / Missing",
				"document": inv.name,
				"vin": vin_label or vin,
				"odometer": odo,
				"detail": _("No odometer reading on inspection"),
				"date": inv.inspection_date,
			})
			continue
		if vin in prev_by_vin:
			prev = prev_by_vin[vin]
			if odo < prev:
				exceptions.append({
					"type": "Rollback",
					"document": inv.name,
					"vin": vin_label or vin,
					"odometer": odo,
					"detail": _("Dropped from {0} to {1} km").format(prev, odo),
					"date": inv.inspection_date,
				})
			elif odo - prev > 50000:
				exceptions.append({
					"type": "High Jump",
					"document": inv.name,
					"vin": vin_label or vin,
					"odometer": odo,
					"detail": _("Jump of {0} km since last reading").format(odo - prev),
					"date": inv.inspection_date,
				})
		prev_by_vin[vin] = odo

	return {
		"report_id": "odometer_exception",
		"title": "Odometer Exception Report",
		"filters": _report_filters_response(f),
		"summary": {
			"exception_count": len(exceptions),
			"rollback": sum(1 for e in exceptions if e["type"] == "Rollback"),
			"unreadable": sum(1 for e in exceptions if "Unreadable" in e["type"]),
			"high_jump": sum(1 for e in exceptions if e["type"] == "High Jump"),
		},
		"columns": [
			{"key": "type", "label": "Exception"},
			{"key": "document", "label": "Document"},
			{"key": "vin", "label": "VIN"},
			{"key": "odometer", "label": "Reading"},
			{"key": "detail", "label": "Detail"},
			{"key": "date", "label": "Date"},
		],
		"rows": exceptions,
	}


@frappe.whitelist()
def get_aging_report(filters=None):
	f = _parse_filters(filters)
	today = getdate(nowdate())
	aging_filters = {"status": ["in", OPEN_JOB_CARD_STATUSES]}
	vin_val = _vin_link_filter_value(f)
	if vin_val is not None:
		aging_filters["vehicle_vin"] = ["in", vin_val]

	rows = frappe.get_all(
		"DMS Job Card",
		filters=aging_filters,
		fields=[
			"name", "status", "customer_name", "vehicle_vin", "license_plate", "vehicle_model",
			"opened_date_time", "reason_for_stop", "assigned_bay", "lead_technician",
		],
		order_by="opened_date_time asc",
		limit=500,
	)

	_apply_link_display_names(rows, {"lead_technician": "Technician"})
	_apply_vin_numbers(rows)

	buckets = {"0-3 days": 0, "4-7 days": 0, "8-14 days": 0, "15+ days": 0}
	aged_rows = []
	for jc in rows:
		opened = getdate(jc.opened_date_time) if jc.opened_date_time else today
		days = date_diff(today, opened)
		if days <= 3:
			buckets["0-3 days"] += 1
		elif days <= 7:
			buckets["4-7 days"] += 1
		elif days <= 14:
			buckets["8-14 days"] += 1
		else:
			buckets["15+ days"] += 1
		aged_rows.append({**jc, "days_open": days})

	return {
		"report_id": "aging",
		"title": "Aging Report",
		"filters": _report_filters_response(f),
		"summary": {
			"total_in_workshop": len(rows),
			"by_age_bucket": buckets,
		},
		"columns": [
			{"key": "name", "label": "Job Card"},
			{"key": "vin_number", "label": "VIN"},
			{"key": "days_open", "label": "Days Open"},
			{"key": "status", "label": "Status"},
			{"key": "reason_for_stop", "label": "Hold Reason"},
			{"key": "customer_name", "label": "Customer"},
			{"key": "lead_technician", "label": "Technician"},
		],
		"rows": aged_rows,
	}


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


@frappe.whitelist()
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
