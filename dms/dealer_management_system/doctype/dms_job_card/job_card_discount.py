"""Labour / parts group discounts on DMS Job Card (warranty type Discount)."""

from __future__ import annotations

import json

from frappe.utils import flt


def normalize_job_card_discount_type(dtype) -> str | None:
	d = (dtype or "").strip().lower()
	if d in ("percentage", "amount"):
		return d
	return None


def discount_type_for_select(dtype) -> str | None:
	"""Map API / internal type to DocType Select option."""
	n = normalize_job_card_discount_type(dtype)
	if n == "percentage":
		return "Percentage"
	if n == "amount":
		return "Amount"
	return None


def parse_discount_payload(discount) -> dict | None:
	"""Parse {type: percentage|amount, value: number} from API or JSON string."""
	if not discount:
		return None
	if isinstance(discount, str):
		try:
			discount = json.loads(discount)
		except Exception:
			return None
	if not isinstance(discount, dict):
		return None
	dtype = (discount.get("type") or discount.get("discount_type") or "").strip().lower()
	if dtype not in ("percentage", "amount"):
		return None
	value = flt(
		discount.get("value")
		if discount.get("value") is not None
		else discount.get("discount_value")
	)
	if value <= 0:
		return None
	return {"type": dtype, "value": value}


def compute_group_discount_amount(
	subtotal: float, discount_type, discount_value: float
) -> float:
	subtotal = flt(subtotal)
	dtype = normalize_job_card_discount_type(discount_type)
	value = flt(discount_value)
	if not dtype or subtotal <= 0 or value <= 0:
		return 0.0
	if dtype == "percentage":
		return flt(subtotal * min(value, 100.0) / 100.0)
	return min(value, subtotal)


def job_card_labour_discount_dict(doc) -> dict | None:
	dtype = normalize_job_card_discount_type(getattr(doc, "labour_discount_type", None))
	value = flt(getattr(doc, "labour_discount_value", 0))
	if dtype and value > 0:
		return {"type": dtype, "value": value}
	return None


def job_card_parts_discount_dict(doc) -> dict | None:
	dtype = normalize_job_card_discount_type(getattr(doc, "parts_discount_type", None))
	value = flt(getattr(doc, "parts_discount_value", 0))
	if dtype and value > 0:
		return {"type": dtype, "value": value}
	return None


def job_card_combined_discount_amount(doc) -> float:
	labour = compute_group_discount_amount(
		flt(doc.total_labor_cost or 0),
		getattr(doc, "labour_discount_type", None),
		getattr(doc, "labour_discount_value", 0),
	)
	parts = compute_group_discount_amount(
		flt(doc.total_parts_cost or 0),
		getattr(doc, "parts_discount_type", None),
		getattr(doc, "parts_discount_value", 0),
	)
	return round(labour + parts, 2)


def apply_discount_fields_from_payload(doc, data: dict) -> None:
	"""Set labour/parts discount fields from API payload (objects or type/value keys)."""
	for prefix in ("labour", "parts"):
		payload_key = f"{prefix}_discount"
		type_key = f"{prefix}_discount_type"
		value_key = f"{prefix}_discount_value"

		if payload_key in data:
			parsed = parse_discount_payload(data.get(payload_key))
			if parsed:
				doc.set(type_key, discount_type_for_select(parsed["type"]))
				doc.set(value_key, parsed["value"])
			else:
				doc.set(type_key, None)
				doc.set(value_key, 0)
			continue

		if type_key in data:
			raw_type = data.get(type_key)
			if raw_type in (None, ""):
				doc.set(type_key, None)
			else:
				sel = discount_type_for_select(raw_type)
				if sel:
					doc.set(type_key, sel)
				else:
					doc.set(type_key, None)
		if value_key in data:
			doc.set(value_key, flt(data.get(value_key)))


def clear_split_discount_fields(doc) -> None:
	for field in (
		"labour_discount_type",
		"labour_discount_value",
		"parts_discount_type",
		"parts_discount_value",
	):
		if hasattr(doc, field):
			if field.endswith("_type"):
				doc.set(field, None)
			else:
				doc.set(field, 0)
	if hasattr(doc, "discount_amount"):
		doc.discount_amount = 0
