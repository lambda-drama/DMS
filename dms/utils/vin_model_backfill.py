"""Backfill VIN No.model links from legacy model labels."""

from __future__ import annotations

import re

import frappe

_MODEL_CODE_BY_LABEL = {
	"JETOURX70PLUS15LTURBO": "JX70P",
	"JETOURX5015TURBO": "JX50",
	"JETOURX5015L": "JX50",
	"JETOURX50": "JX50",
	"JETOURX70CDM15": "JX70H",
	"JETOURX70CDM15TURBO": "JX70H",
	"JETOURX9015TURBO": "JX90P",
	"JETOURX90PLUS15TURBO": "JX90P",
	"JETOURDASHING15TURBO": "JD15",
	"JETOURDASHING15": "JD15",
	"JETOURX70": "JX70",
}


def _norm(value: str | None) -> str:
	return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def backfill_vin_model_links(dry_run: bool = False) -> dict:
	"""Populate VIN No.model from legacy model_name / linked_item labels."""
	vehicle_models = frappe.get_all(
		"Vehicle Model",
		fields=["name", "model_code", "model", "model_name"],
	)
	model_name_by_code = {
		(row.get("model_code") or "").strip().upper(): row["name"]
		for row in vehicle_models
		if (row.get("model_code") or "").strip()
	}

	rows = frappe.get_all(
		"VIN No",
		fields=["name", "model", "model_name", "linked_item"],
		limit_page_length=0,
	)

	updated = 0
	already_linked = 0
	unmatched: list[dict] = []
	preview: list[dict] = []

	for row in rows:
		if row.get("model"):
			already_linked += 1
			continue

		candidates = [row.get("model_name"), row.get("linked_item")]
		model_code = None
		for raw in candidates:
			model_code = _MODEL_CODE_BY_LABEL.get(_norm(raw))
			if model_code:
				break

		if not model_code:
			unmatched.append(
				{
					"name": row["name"],
					"model_name": row.get("model_name"),
					"linked_item": row.get("linked_item"),
				}
			)
			continue

		vehicle_model = model_name_by_code.get(model_code)
		if not vehicle_model:
			unmatched.append(
				{
					"name": row["name"],
					"model_name": row.get("model_name"),
					"linked_item": row.get("linked_item"),
					"resolved_model_code": model_code,
					"reason": "Vehicle Model missing",
				}
			)
			continue

		preview.append(
			{
				"name": row["name"],
				"model_name": row.get("model_name"),
				"linked_item": row.get("linked_item"),
				"model_code": model_code,
				"vehicle_model": vehicle_model,
			}
		)
		if not dry_run:
			frappe.db.set_value("VIN No", row["name"], "model", vehicle_model, update_modified=False)
		updated += 1

	if not dry_run and updated:
		frappe.db.commit()

	return {
		"total_vins": len(rows),
		"already_linked": already_linked,
		"updated": updated,
		"unmatched_count": len(unmatched),
		"preview": preview[:20],
		"unmatched_preview": unmatched[:20],
	}
