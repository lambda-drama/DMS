# Copyright (c) 2026, Mania and contributors
"""Import Vehicle Models and Vehicle Service Items from FRT labour Excel workbooks."""

from __future__ import annotations

import os
import re

import frappe
from frappe import _
from frappe.utils import cint, flt, get_files_path

from dms.overrides.vehicle_service_item import (
	_erpnext_item_link_fieldname,
	ensure_labour_erpnext_item,
	sync_labour_erpnext_item_name,
)

SKIP_SHEETS = frozenset({"Remarks Sheet", "Sum of Models", "Sum"})
DEFAULT_BRAND = "JETOUR"
DEFAULT_FUEL_TYPE = "Petrol"
DEFAULT_TRANSMISSION = "Automatic (AT)"


def import_frt_workbook(file_path: str, brand: str = DEFAULT_BRAND) -> dict:
	"""Parse workbook and upsert Vehicle Models + Vehicle Service Items per sheet."""
	try:
		import xlrd
	except ImportError as exc:
		raise ImportError(_("Excel import requires xlrd. Install it in the bench environment.")) from exc

	if not os.path.isfile(file_path):
		frappe.throw(_("File not found: {0}").format(file_path))

	ensure_brand(brand)
	book = xlrd.open_workbook(file_path)
	summary = {
		"models_created": 0,
		"models_updated": 0,
		"services_created": 0,
		"services_updated": 0,
		"services_skipped": 0,
		"sheets_processed": 0,
		"errors": [],
		"details": [],
	}

	for sheet_name in book.sheet_names():
		if sheet_name in SKIP_SHEETS:
			continue
		try:
			result = _import_model_sheet(book.sheet_by_name(sheet_name), sheet_name, brand)
			if not result:
				continue
			summary["sheets_processed"] += 1
			summary["models_created"] += result["models_created"]
			summary["models_updated"] += result["models_updated"]
			summary["services_created"] += result["services_created"]
			summary["services_updated"] += result["services_updated"]
			summary["services_skipped"] += result["services_skipped"]
			summary["details"].append(result)
		except Exception as exc:
			frappe.log_error(title=f"FRT import — {sheet_name}")
			summary["errors"].append({"sheet": sheet_name, "error": str(exc)})

	frappe.db.commit()
	return summary


def import_frt_file_url(file_url: str, brand: str = DEFAULT_BRAND) -> dict:
	path = _resolve_file_path(file_url)
	return import_frt_workbook(path, brand=brand)


def _resolve_file_path(file_url: str) -> str:
	file_url = (file_url or "").strip()
	if not file_url:
		frappe.throw(_("File URL is required"))

	if file_url.startswith("/private/files/"):
		return get_files_path(*file_url.replace("/private/files/", "").split("/"), is_private=1)

	if file_url.startswith("/files/"):
		return get_files_path(*file_url.replace("/files/", "").split("/"), is_private=0)

	if os.path.isabs(file_url) and os.path.isfile(file_url):
		return file_url

	frappe.throw(_("Could not resolve uploaded file path"))


def ensure_brand(brand: str) -> str:
	brand = (brand or DEFAULT_BRAND).strip()
	if not brand:
		brand = DEFAULT_BRAND
	if not frappe.db.exists("Brand", brand):
		frappe.get_doc({"doctype": "Brand", "brand": brand}).insert(ignore_permissions=True)
	return brand


def ensure_vehicle_service_type(category: str) -> str:
	"""Ensure a Vehicle Service Type exists for the FRT category label."""
	category = (category or "").strip()
	if not category:
		return ""

	if frappe.db.exists("Vehicle Service Type", category):
		return category

	existing = frappe.db.get_value(
		"Vehicle Service Type", {"service_type_name": category}, "name"
	)
	if existing:
		return existing

	doc = frappe.get_doc(
		{
			"doctype": "Vehicle Service Type",
			"service_type_name": category,
			"is_active": 1,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def _import_model_sheet(sheet, sheet_name: str, brand: str) -> dict | None:
	if sheet.nrows < 3:
		return None

	header_row_idx, colmap = _find_header_row(sheet)
	if not _is_frt_model_sheet(sheet_name, colmap):
		return None

	model_name, model_code, model_year = _sheet_model_meta(sheet, sheet_name)
	if not model_code:
		return None

	vehicle_model = ensure_vehicle_model(
		model_code=model_code,
		model_name=model_name,
		brand=brand,
		model_year=model_year,
	)

	stats = {
		"sheet": sheet_name,
		"vehicle_model": vehicle_model,
		"model_code": model_code,
		"model_name": model_name,
		"models_created": 0,
		"models_updated": 0,
		"services_created": 0,
		"services_updated": 0,
		"services_skipped": 0,
	}

	for row_idx in range(header_row_idx + 1, sheet.nrows):
		row = [_cell(sheet, row_idx, col) for col in range(sheet.ncols)]
		description = _text(row, colmap.get("description"))
		if not description:
			continue

		category = _text(row, colmap.get("category"))
		hours = flt(row[colmap["hours"]]) if colmap.get("hours") is not None else 0
		row_model_code = _text(row, colmap.get("model_code")) or model_code
		cat_code = _text(row, colmap.get("cat_code"))
		sub_code_raw = row[colmap["sub_code"]] if colmap.get("sub_code") is not None else ""
		sub_code = _format_sub_code(sub_code_raw, cat_code)
		service_code = _text(row, colmap.get("service_code"))

		if not service_code and row_model_code and cat_code and sub_code:
			service_code = f"{row_model_code}{cat_code.upper()}{sub_code}"

		if not service_code:
			stats["services_skipped"] += 1
			continue

		created = upsert_vehicle_service_item(
			vehicle_model=vehicle_model,
			service_code=service_code,
			description=description,
			category=category,
			cat_code=cat_code,
			sub_code=sub_code,
			hours=hours,
			model_code=row_model_code,
		)
		if created:
			stats["services_created"] += 1
		else:
			stats["services_updated"] += 1

	return stats


def _parse_sheet_vehicle_model(sheet_name: str) -> tuple[str, str] | None:
	"""Parse tab titles like X50-JX50 into (model_name, model_code)."""
	sheet_name = (sheet_name or "").strip()
	if "-" not in sheet_name:
		return None

	left, right = sheet_name.split("-", 1)
	left = left.strip()
	right = right.strip()
	if not left or not _looks_like_model_code(right):
		return None

	return left, right.upper()


def _is_frt_model_sheet(sheet_name: str, colmap: dict) -> bool:
	"""Only import per-model tabs (Name-CODE) with a service-code column."""
	if _parse_sheet_vehicle_model(sheet_name) is None:
		return False
	if colmap.get("description") is None:
		return False
	if colmap.get("model_code") is None:
		return False
	if colmap.get("service_code") is None:
		return False
	return True


def _sheet_model_meta(sheet, sheet_name: str) -> tuple[str, str, int | None]:
	model_year = None
	parsed = _parse_sheet_vehicle_model(sheet_name)

	if parsed:
		model_name, model_code = parsed
	else:
		model_name = ""
		model_code = ""

	# Row 0 may carry the model year at the end of the sheet.
	if sheet.nrows:
		row0 = [_cell(sheet, 0, c) for c in range(sheet.ncols)]
		for val in reversed(row0):
			if _looks_numeric(val):
				year = cint(val)
				if 1980 <= year <= 2100:
					model_year = year
					break

	if not parsed:
		model_name = model_name or sheet_name.strip()
		model_code = _slug_code(model_name)

	return model_name, model_code.upper(), model_year


def _find_header_row(sheet) -> tuple[int, dict]:
	for row_idx in range(min(5, sheet.nrows)):
		row = [_cell(sheet, row_idx, c) for c in range(sheet.ncols)]
		colmap = _header_map(row)
		if colmap.get("description") is not None and (
			colmap.get("hours") is not None or colmap.get("cat_code") is not None
		):
			return row_idx, colmap
	return 1, {}


def _header_map(row) -> dict:
	colmap: dict[str, int] = {}
	# Workbooks duplicate headers on the right — only read the left block.
	limit = min(len(row), 8)
	for idx in range(limit):
		raw = row[idx]
		key = _text_value(raw).lower()
		if not key:
			continue
		if "job description" in key:
			colmap.setdefault("description", idx)
		elif key == "category":
			colmap.setdefault("category", idx)
		elif key in ("hours", "frt", "front"):
			colmap.setdefault("hours", idx)
		elif "model code" in key:
			colmap.setdefault("model_code", idx)
		elif "cat code" in key:
			colmap.setdefault("cat_code", idx)
		elif "sub code" in key:
			colmap.setdefault("sub_code", idx)
		elif "service" in key and "code" in key:
			colmap.setdefault("service_code", idx)
	return colmap


def ensure_vehicle_model(
	model_code: str,
	model_name: str,
	brand: str,
	model_year: int | None = None,
) -> str:
	model_code = (model_code or "").strip().upper()
	model_name = (model_name or model_code).strip()
	if not model_code:
		frappe.throw(_("Model code is required"))

	existing = frappe.db.get_value("Vehicle Model", {"model_code": model_code}, "name")
	if existing:
		doc = frappe.get_doc("Vehicle Model", existing)
		doc.model_name = model_name
		doc.brand = brand
		if model_year:
			doc.model_year = model_year
		doc.is_active = 1
		doc.save(ignore_permissions=True)
		return doc.name

	item_code = ensure_vehicle_item(model_code, model_name, brand)
	doc = frappe.get_doc(
		{
			"doctype": "Vehicle Model",
			"model": item_code,
			"model_code": model_code,
			"model_name": model_name,
			"brand": brand,
			"model_year": model_year,
			"fuel_type": DEFAULT_FUEL_TYPE,
			"transmission": DEFAULT_TRANSMISSION,
			"is_active": 1,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def ensure_vehicle_item(item_code: str, item_name: str, brand: str) -> str:
	item_code = (item_code or "").strip().upper()
	if frappe.db.exists("Item", item_code):
		return item_code

	item_group = _vehicle_item_group()
	frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": item_name[:140] or item_code,
			"item_group": item_group,
			"brand": brand,
			"stock_uom": "Nos",
			"is_stock_item": 1,
			"has_serial_no": 1,
			"is_sales_item": 1,
			"is_purchase_item": 1,
		}
	).insert(ignore_permissions=True)
	return item_code


def _vehicle_item_group() -> str:
	groups = frappe.get_all("Item Group", filters={"custom_is_vehicle": 1}, pluck="name", limit=1)
	if groups:
		return groups[0]
	if frappe.db.exists("Item Group", "Vehicles"):
		return "Vehicles"
	return frappe.db.get_single_value("DMS Settings", "default_item_group") or "All Item Groups"


def upsert_vehicle_service_item(
	vehicle_model: str,
	service_code: str,
	description: str,
	category: str,
	cat_code: str,
	sub_code: str,
	hours: float,
	model_code: str,
) -> bool:
	service_code = (service_code or "").strip().upper()
	description = (description or service_code).strip()
	if not service_code:
		return False

	meta = frappe.get_meta("Vehicle Service Item")
	link_field = _erpnext_item_link_fieldname()

	existing_name = frappe.db.get_value(
		"Vehicle Service Item",
		{"custom_service_code": service_code, "custom_vehicle_model": vehicle_model},
		"name",
	)
	if not existing_name and frappe.db.exists("Vehicle Service Item", service_code):
		candidate = frappe.db.get_value("Vehicle Service Item", service_code, "custom_vehicle_model")
		if candidate == vehicle_model:
			existing_name = service_code

	category_link = ensure_vehicle_service_type(category)
	service_item_name = _service_item_display_name(description, service_code, existing_name)

	values = {
		"service_item": service_item_name,
		"custom_item_name": description,
		"custom_service_code": service_code,
		"custom_vehicle_model": vehicle_model,
		"custom_category": category_link,
		"custom_cat_code": cat_code,
		"custom_sub_code": sub_code,
		"custom_frt": _hours_text(hours),
	}

	if meta.has_field("custom_estimated_timehours"):
		values["custom_estimated_timehours"] = _hours_text(hours)

	if existing_name:
		doc = frappe.get_doc("Vehicle Service Item", existing_name)
		doc.update(values)
		if not (doc.get(link_field) or "").strip():
			ensure_labour_erpnext_item(doc, link_field)
		else:
			sync_labour_erpnext_item_name(doc, link_field)
		doc.save(ignore_permissions=True)
		return False

	doc = frappe.get_doc({"doctype": "Vehicle Service Item", **values})
	ensure_labour_erpnext_item(doc, link_field)
	doc.insert(ignore_permissions=True)
	return True


def _service_item_display_name(
	description: str, service_code: str, existing_name: str | None = None
) -> str:
	"""Use job description as Service Item name; suffix code if needed for uniqueness."""
	description = (description or service_code).strip()
	if not description:
		return service_code

	if not frappe.db.exists("Vehicle Service Item", description):
		return description

	owner = frappe.db.get_value("Vehicle Service Item", description, "name")
	if existing_name and owner == existing_name:
		return description

	fallback = f"{description} ({service_code})"
	if not frappe.db.exists("Vehicle Service Item", fallback):
		return fallback

	return service_code


def _hours_text(hours: float) -> str:
	if not hours:
		return "0"
	if hours == int(hours):
		return str(int(hours))
	return str(round(hours, 2))


def _format_sub_code(value, cat_code: str) -> str:
	if value in (None, ""):
		return ""
	cat = (cat_code or "").strip().upper()
	if isinstance(value, float):
		if value == int(value):
			n = int(value)
			return f"{n:02d}" if cat == "EN" else str(n)
		return str(value).strip()
	text = str(value).strip()
	if cat == "EN" and text.isdigit():
		return text.zfill(2)
	return text


def _cell(sheet, row: int, col: int):
	try:
		return sheet.cell_value(row, col)
	except IndexError:
		return ""


def _text(row, idx) -> str:
	if idx is None:
		return ""
	return _text_value(row[idx])


def _text_value(value) -> str:
	if value is None:
		return ""
	if isinstance(value, float):
		if value == int(value):
			return str(int(value))
		return str(value).strip()
	return str(value).strip()


def _looks_numeric(value) -> bool:
	try:
		float(value)
		return True
	except (TypeError, ValueError):
		return False


def _looks_like_model_code(code: str) -> bool:
	code = (code or "").strip()
	if len(code) < 3:
		return False
	return any(c.isalpha() for c in code)


def _slug_code(text: str) -> str:
	base = re.sub(r"[^\w\-]+", "-", (text or "").upper()).strip("-")
	return base or "MODEL"
