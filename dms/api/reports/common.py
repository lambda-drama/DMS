# Copyright (c) 2026, Mania and contributors
"""Shared helpers for DMS aftersales reports."""

from __future__ import annotations

from calendar import monthrange
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_days, cint, date_diff, flt, get_datetime, get_first_day, getdate, nowdate

from dms.api.dashboard import ACTIVE_JOB_CARD_STATUSES

OPEN_JOB_CARD_STATUSES = list(ACTIVE_JOB_CARD_STATUSES)

# Spec §1.1 recommended period grains
PERIOD_PRESETS = ("daily", "weekly", "monthly", "quarterly", "yearly")


def _strip_html(text) -> str:
	if not text:
		return ""
	import re
	return re.sub(r"<[^>]+>", "", str(text)).strip()


def _dates_for_period(period: str, as_of=None):
	"""Map daily/weekly/monthly/quarterly/yearly → inclusive from/to dates."""
	today = getdate(as_of or nowdate())
	period = (period or "").strip().lower()
	if period == "daily":
		return today, today
	if period == "weekly":
		# Monday–Sunday week containing as_of
		start = today - timedelta(days=today.weekday())
		return start, start + timedelta(days=6)
	if period == "monthly":
		start = get_first_day(today)
		last = monthrange(today.year, today.month)[1]
		return start, today.replace(day=last)
	if period == "quarterly":
		q = (today.month - 1) // 3
		start_month = q * 3 + 1
		start = today.replace(month=start_month, day=1)
		end_month = start_month + 2
		end_day = monthrange(today.year, end_month)[1]
		return start, today.replace(month=end_month, day=end_day)
	if period == "yearly":
		return today.replace(month=1, day=1), today.replace(month=12, day=31)
	return add_days(today, -30), today


def _parse_filters(data=None):
	if isinstance(data, str):
		import json
		data = json.loads(data) if data else {}
	data = data or {}

	period = (data.get("period") or "").strip().lower() or None
	if period and period in PERIOD_PRESETS:
		from_date, to_date = _dates_for_period(period)
	else:
		period = None
		from_date = getdate(data.get("from_date") or add_days(nowdate(), -30))
		to_date = getdate(data.get("to_date") or nowdate())
	if from_date > to_date:
		from_date, to_date = to_date, from_date

	vin_no = (data.get("vin_no") or data.get("vehicle_vin_name") or "").strip() or None
	vin_search = (data.get("vehicle_vin") or data.get("vin") or "").strip() or None
	vin_names, vin_number_map, vin_display = _resolve_vin_filter(vin_no, vin_search)

	# Model may be Vehicle Model link name or display model_name on the job card
	vehicle_model = (data.get("vehicle_model") or data.get("model") or "").strip() or None
	vehicle_model_label = (data.get("vehicle_model_label") or "").strip() or None
	if vehicle_model and frappe.db.exists("DocType", "Vehicle Model") and frappe.db.exists(
		"Vehicle Model", vehicle_model
	):
		vehicle_model_label = (
			vehicle_model_label
			or frappe.db.get_value("Vehicle Model", vehicle_model, "model_name")
			or vehicle_model
		)

	from dms.dealer_management_system.utils.stock_operations import get_default_dms_company

	# Operating company from DMS Settings unless an explicit company is passed
	# (stock reports). Do not treat `branch` as company — Branch is its own doctype.
	company = (data.get("company") or "").strip() or get_default_dms_company() or None
	branch = (data.get("branch") or "").strip() or None

	return {
		"from_date": from_date,
		"to_date": to_date,
		"period": period,
		"company": company,
		"branch": branch,
		"service_advisor": (data.get("service_advisor") or data.get("advisor") or "").strip() or None,
		"technician": (
			data.get("technician") or data.get("lead_technician") or ""
		).strip()
		or None,
		"vehicle_model": vehicle_model,
		"vehicle_model_label": vehicle_model_label,
		"job_card_type": (data.get("job_card_type") or data.get("job_type") or "").strip() or None,
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
	if f.get("period"):
		out["period"] = f["period"]
	if f.get("company"):
		out["company"] = f["company"]
	if f.get("branch"):
		out["branch"] = f["branch"]
	if f.get("service_advisor"):
		out["service_advisor"] = f["service_advisor"]
	if f.get("technician"):
		out["technician"] = f["technician"]
	if f.get("vehicle_model"):
		out["vehicle_model"] = f["vehicle_model"]
	if f.get("vehicle_model_label"):
		out["vehicle_model_label"] = f["vehicle_model_label"]
	if f.get("job_card_type"):
		out["job_card_type"] = f["job_card_type"]
	if f.get("vin_no"):
		out["vin_no"] = f["vin_no"]
	if f.get("vehicle_vin_search"):
		out["vehicle_vin"] = f["vehicle_vin_search"]
	return out


def _jc_dimension_conds(filters):
	"""Company / branch / advisor / technician / model / job type / VIN (no date)."""
	conds = {}
	if filters.get("company"):
		conds["company"] = filters["company"]
	if filters.get("branch"):
		conds["branch"] = filters["branch"]
	if filters.get("service_advisor"):
		conds["service_advisor"] = filters["service_advisor"]
	if filters.get("technician"):
		conds["lead_technician"] = filters["technician"]
	if filters.get("job_card_type"):
		conds["job_card_type"] = filters["job_card_type"]
	# Job Card.vehicle_model stores display model_name
	model_text = filters.get("vehicle_model_label") or filters.get("vehicle_model")
	if model_text:
		conds["vehicle_model"] = ["like", f"%{model_text}%"]
	vin_val = _vin_link_filter_value(filters)
	if vin_val is not None:
		conds["vehicle_vin"] = ["in", vin_val]
	return conds


def _jc_filters(filters, extra=None):
	conds = {
		"posting_date": ["between", [filters["from_date"], filters["to_date"]]],
	}
	conds.update(_jc_dimension_conds(filters))
	if extra:
		conds.update(extra)
	return conds


def _jc_sql_filters(filters, alias="jc"):
	"""AND clauses + params for raw SQL against DMS Job Card."""
	clauses = []
	params = {}
	if filters.get("company"):
		clauses.append(f" AND {alias}.company = %(r_company)s")
		params["r_company"] = filters["company"]
	if filters.get("branch"):
		clauses.append(f" AND {alias}.branch = %(r_branch)s")
		params["r_branch"] = filters["branch"]
	if filters.get("service_advisor"):
		clauses.append(f" AND {alias}.service_advisor = %(r_service_advisor)s")
		params["r_service_advisor"] = filters["service_advisor"]
	if filters.get("technician"):
		clauses.append(f" AND {alias}.lead_technician = %(r_technician)s")
		params["r_technician"] = filters["technician"]
	if filters.get("job_card_type"):
		clauses.append(f" AND {alias}.job_card_type = %(r_job_card_type)s")
		params["r_job_card_type"] = filters["job_card_type"]
	model_text = filters.get("vehicle_model_label") or filters.get("vehicle_model")
	if model_text:
		clauses.append(f" AND {alias}.vehicle_model LIKE %(r_vehicle_model)s")
		params["r_vehicle_model"] = f"%{model_text}%"
	vin_sql, vin_params = _vin_sql_clause(filters, f"{alias}.vehicle_vin")
	clauses.append(vin_sql)
	params.update(vin_params)
	return "".join(clauses), params
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

def _format_datetime_minute(value):
	"""Format datetime as YYYY-MM-DD HH:MM (no seconds / fractions)."""
	if not value:
		return ""
	dt = get_datetime(value)
	if not dt:
		return ""
	return dt.strftime("%Y-%m-%d %H:%M")


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

def _result(report_id, title, filters, summary, columns, rows):
	return {
		"report_id": report_id,
		"title": title,
		"filters": _report_filters_response(filters),
		"summary": summary,
		"columns": columns,
		"rows": rows,
	}

