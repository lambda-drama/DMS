"""Forward-only document links (child → parent). Resolve related docs for the UI."""

from __future__ import annotations

import frappe


def linked_inspection_for_appointment(appointment: str | None) -> str | None:
	appointment = (appointment or "").strip()
	if not appointment:
		return None
	return frappe.db.get_value(
		"Vehicle Inspection",
		{"appointment": appointment},
		"name",
		order_by="creation desc",
	)


def linked_job_card_for_appointment(appointment: str | None) -> str | None:
	appointment = (appointment or "").strip()
	if not appointment:
		return None
	return frappe.db.get_value(
		"DMS Job Card",
		{"appointment": appointment},
		"name",
		order_by="creation desc",
	)


def linked_job_card_for_inspection(inspection: str | None) -> str | None:
	inspection = (inspection or "").strip()
	if not inspection:
		return None
	return frappe.db.get_value(
		"DMS Job Card",
		{"inspection": inspection},
		"name",
		order_by="creation desc",
	)


def linked_job_card_for_estimate(estimate: str | None) -> str | None:
	estimate = (estimate or "").strip()
	if not estimate:
		return None
	return frappe.db.get_value(
		"DMS Job Card",
		{"service_estimate": estimate},
		"name",
		order_by="creation desc",
	)


def linked_service_estimate_for_inspection(inspection: str | None) -> str | None:
	inspection = (inspection or "").strip()
	if not inspection:
		return None
	return frappe.db.get_value(
		"DMS Service Estimate",
		{"inspection": inspection, "status": ["not in", ["Rejected", "Cancelled"]]},
		"name",
		order_by="creation desc",
	)


def enrich_appointment_row(row: dict) -> dict:
	name = row.get("name")
	if name:
		row["inspection"] = linked_inspection_for_appointment(name)
		row["job_card"] = linked_job_card_for_appointment(name)
	return row


def enrich_inspection_row(row: dict) -> dict:
	name = row.get("name")
	if name:
		row["job_card"] = linked_job_card_for_inspection(name)
		row["service_estimate"] = linked_service_estimate_for_inspection(name)
	return row


def enrich_estimate_row(row: dict) -> dict:
	name = row.get("name")
	if name:
		row["job_card"] = linked_job_card_for_estimate(name)
	return row
