"""Carry a DMS Sales Order into inspection / estimate / job card.

Workshop work often starts as an order (key programming, parts on order) with a
downpayment. When the customer arrives, those lines and advances move onto the
inspection → estimate → job card path instead of being invoiced from the order.
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.api.payment_entries import JOB_CARD_FIELD, _has_field


def _linked_doc(doctype: str, sales_order: str) -> str | None:
	if not sales_order or not frappe.get_meta(doctype).has_field("sales_order"):
		return None
	return frappe.db.get_value(
		doctype,
		{"sales_order": sales_order, "docstatus": ["<", 2]},
		"name",
	)


def workshop_links_for_order(sales_order: str) -> dict:
	return {
		"inspection": _linked_doc("Vehicle Inspection", sales_order),
		"estimate": _linked_doc("DMS Service Estimate", sales_order),
		"job_card": _linked_doc("DMS Job Card", sales_order),
	}


def _workshop_order_detail(sales_order: str) -> dict:
	"""Load order lines even when the workshop user cannot read Sales Order."""
	from dms.api.orders import get_dms_order

	previous = frappe.flags.ignore_permissions
	frappe.flags.ignore_permissions = True
	try:
		return get_dms_order(sales_order)
	finally:
		frappe.flags.ignore_permissions = previous


def apply_order_lines_to_job_card(doc, sales_order: str) -> None:
	"""Copy labour + parts from a DMS order onto a Job Card or Service Estimate."""
	from dms.api.job_cards import _append_labour_line_payload
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		resolve_item_code_to_vehicle_service_item,
	)

	detail = _workshop_order_detail(sales_order)
	complaint = (detail.get("remarks") or "").strip()
	notes_bits = []
	if complaint:
		notes_bits.append(complaint)

	existing_labour = {
		(row.vehicle_service_item or "").strip()
		for row in (doc.get("labour") or [])
		if row.vehicle_service_item
	}
	for line in detail.get("labour") or []:
		vsi = resolve_item_code_to_vehicle_service_item(line.get("vehicle_service_item")) or ""
		if not vsi or vsi in existing_labour:
			continue
		label = (line.get("description") or line.get("vehicle_service_item_name") or "").strip()
		_append_labour_line_payload(
			doc,
			{
				"vehicle_service_item": vsi,
				"estimated_hours": line.get("hours") or 1,
				"rate_per_hour": line.get("rate_per_hour"),
				"complaint": label or complaint,
				"custom_display_name": label or None,
				"display_name": label or None,
				"discount_type": line.get("discount_type") or "",
				"discount_value": line.get("discount_value") or 0,
			},
			default_complaint=complaint,
		)
		existing_labour.add(vsi)
		if label:
			notes_bits.append(label)

	existing_parts = {(row.item_code or "").strip() for row in (doc.get("parts") or []) if row.item_code}
	warehouse = (detail.get("warehouse") or getattr(doc, "warehouse", None) or "").strip() or None
	for line in detail.get("parts") or []:
		part = (line.get("spare_part") or line.get("item_code") or "").strip()
		if not part or part in existing_parts:
			continue
		if not frappe.db.exists("Spare Part", part):
			continue
		qty = flt(line.get("qty")) or 1
		bin_location = frappe.db.get_value("Spare Part", part, "bin_location") or ""
		doc.append(
			"parts",
			{
				"item_code": part,
				"quantity_requested": qty,
				"unit_price": flt(line.get("rate")),
				"bin_location": bin_location,
				"warehouse": (line.get("warehouse") or "").strip() or warehouse,
				"line_status": "Requested",
			},
		)
		row = doc.parts[-1]
		if line.get("discount_type") or line.get("discount_value"):
			from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
				apply_line_discount_from_payload,
			)

			apply_line_discount_from_payload(row, line)
		existing_parts.add(part)

	if doc.meta.has_field("job_items") and not doc.get("job_items"):
		summary = "\n".join(bit for bit in notes_bits if bit).strip() or _(
			"Work from Sales Order {0}"
		).format(sales_order)
		doc.append(
			"job_items",
			{
				"complaint_description": summary[:1400],
				"severity": "3 - Moderate",
			},
		)

	if notes_bits and not (doc.get("service_advisor_notes") or "").strip():
		doc.service_advisor_notes = "\n".join(notes_bits)[:4000]

	copy_order_line_discounts_onto_doc(doc, detail)

	if hasattr(doc, "calculate_costing_and_totals"):
		doc.calculate_costing_and_totals()


def copy_order_line_discounts_onto_doc(doc, detail) -> bool:
	"""Fill empty JC/estimate line discounts from the matching sales order lines.

	Does not overwrite a discount already set on the job card. Order group discounts
	are stored on each Sales Order Item, so they arrive here as reconstructed line
	discounts (same shape as the order screen).
	"""
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		resolve_item_code_to_vehicle_service_item,
	)
	from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
		apply_line_discount_from_payload,
		normalize_job_card_discount_type,
	)

	def _row_has_discount(row) -> bool:
		mode = normalize_job_card_discount_type(getattr(row, "discount_type", None))
		return bool(mode and flt(getattr(row, "discount_value", 0)) > 0)

	def _src_discount(line) -> dict | None:
		mode = normalize_job_card_discount_type(line.get("discount_type"))
		value = flt(line.get("discount_value"))
		if not mode or value <= 0:
			return None
		return {"discount_type": line.get("discount_type"), "discount_value": value}

	changed = False
	labour_src = {}
	for line in detail.get("labour") or []:
		vsi = resolve_item_code_to_vehicle_service_item(line.get("vehicle_service_item")) or ""
		if vsi:
			labour_src[vsi] = line
	for row in doc.get("labour") or []:
		if _row_has_discount(row):
			continue
		src = labour_src.get((row.vehicle_service_item or "").strip())
		payload = _src_discount(src) if src else None
		if not payload:
			continue
		apply_line_discount_from_payload(row, payload)
		changed = True

	parts_src = {}
	for line in detail.get("parts") or []:
		part = (line.get("spare_part") or line.get("item_code") or "").strip()
		if part:
			parts_src[part] = line
	for row in doc.get("parts") or []:
		if _row_has_discount(row):
			continue
		src = parts_src.get((row.item_code or "").strip())
		payload = _src_discount(src) if src else None
		if not payload:
			continue
		apply_line_discount_from_payload(row, payload)
		changed = True

	return changed


def link_order_advances_to_job_card(sales_order: str, job_card: str) -> list[str]:
	"""Turn Sales Order downpayments into unallocated advances tagged to the job card.

	Order receipts are allocated against the Sales Order, so they would not show as
	customer advances on the job card or invoice screen. Dropping the SO reference
	releases the amount; ``custom_dms_job_card`` keeps the trail.
	"""
	sales_order = (sales_order or "").strip()
	job_card = (job_card or "").strip()
	if not sales_order or not job_card:
		return []

	refs = frappe.get_all(
		"Payment Entry Reference",
		filters={
			"reference_doctype": "Sales Order",
			"reference_name": sales_order,
			"parenttype": "Payment Entry",
		},
		fields=["name", "parent", "allocated_amount"],
	)
	linked: list[str] = []
	seen: set[str] = set()
	for ref in refs:
		pe_name = ref.parent
		if pe_name in seen:
			continue
		seen.add(pe_name)
		pe = frappe.get_doc("Payment Entry", pe_name)
		if pe.docstatus != 1:
			continue

		released = 0.0
		for row in list(pe.get("references") or []):
			if row.reference_doctype == "Sales Order" and row.reference_name == sales_order:
				released += flt(row.allocated_amount)
				frappe.db.delete("Payment Entry Reference", {"name": row.name})

		values = {}
		if released > 0:
			values["unallocated_amount"] = flt(pe.unallocated_amount) + released
			values["total_allocated_amount"] = max(flt(pe.total_allocated_amount) - released, 0)
		if _has_field(JOB_CARD_FIELD) and not (pe.get(JOB_CARD_FIELD) or "").strip():
			values[JOB_CARD_FIELD] = job_card
		if not values:
			continue
		frappe.db.set_value("Payment Entry", pe_name, values, update_modified=True)
		linked.append(pe_name)

	if linked and frappe.db.exists("Sales Order", sales_order):
		try:
			so = frappe.get_doc("Sales Order", sales_order)
			if hasattr(so, "set_total_advance_paid"):
				so.flags.ignore_permissions = True
				so.flags.ignore_validate_update_after_submit = True
				so.set_total_advance_paid()
		except Exception:
			pass

	return linked


@frappe.whitelist()
def create_job_card_from_order(name, service_advisor=None):
	"""Draft job card from a submitted order — labour/parts and downpayments carried forward."""
	from dms.api.job_cards import create_job_card
	from dms.api.orders import get_dms_order
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		get_sales_order_vehicle_vin,
	)
	from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
		resolve_item_code_to_vehicle_service_item,
	)

	frappe.has_permission("DMS Job Card", "create", throw=True)
	detail = get_dms_order(name)
	if cint(detail.get("docstatus")) != 1:
		frappe.throw(_("Submit the order before creating a job card."))
	if detail.get("converted"):
		frappe.throw(_("This order is already invoiced. Use the sales invoice instead of a job card."))

	existing = workshop_links_for_order(name).get("job_card")
	if existing:
		return {"name": existing, "sales_order": name, "existing": 1}

	so = frappe.get_doc("Sales Order", name)
	vin = get_sales_order_vehicle_vin(so)
	complaint_bits = [(detail.get("remarks") or "").strip()]
	for line in detail.get("labour") or []:
		complaint_bits.append(
			(line.get("description") or line.get("vehicle_service_item_name") or "").strip()
		)
	complaint = "\n".join(bit for bit in complaint_bits if bit)

	payload = {
		"as_draft": 1,
		"job_card_type": "Customer Paid",
		"skip_vehicle_inspection": 1,
		"sales_order": name,
		"customer": detail.get("customer"),
		"company": detail.get("company"),
		"currency": detail.get("currency"),
		"vehicle_vin": vin,
		"warehouse": detail.get("warehouse"),
		"customer_complaint_summary": complaint or _("Work from Sales Order {0}").format(name),
		"service_advisor_notes": complaint or None,
		"service_advisor": (service_advisor or "").strip() or None,
		"labour": [
			{
				"vehicle_service_item": resolve_item_code_to_vehicle_service_item(
					line.get("vehicle_service_item")
				),
				"estimated_hours": line.get("hours") or 1,
				"rate_per_hour": line.get("rate_per_hour"),
				"service_name": line.get("vehicle_service_item_name") or None,
				"complaint": line.get("description") or line.get("vehicle_service_item_name"),
				"custom_display_name": line.get("description") or line.get("vehicle_service_item_name"),
				"discount_type": line.get("discount_type") or "",
				"discount_value": line.get("discount_value") or 0,
			}
			for line in (detail.get("labour") or [])
			if resolve_item_code_to_vehicle_service_item(line.get("vehicle_service_item"))
		],
		"parts": [
			{
				"item_code": line.get("spare_part") or line.get("item_code"),
				"quantity_requested": line.get("qty") or 1,
				"unit_price": line.get("rate"),
				"warehouse": line.get("warehouse") or detail.get("warehouse"),
				"discount_type": line.get("discount_type") or "",
				"discount_value": line.get("discount_value") or 0,
			}
			for line in (detail.get("parts") or [])
			if (line.get("spare_part") or line.get("item_code"))
			and frappe.db.exists("Spare Part", line.get("spare_part") or line.get("item_code"))
		],
	}

	created = create_job_card(payload)
	jc_name = created.get("name") if isinstance(created, dict) else created
	if jc_name and frappe.get_meta("DMS Job Card").has_field("sales_order"):
		frappe.db.set_value("DMS Job Card", jc_name, "sales_order", name, update_modified=False)
	link_order_advances_to_job_card(name, jc_name)
	return {"name": jc_name, "sales_order": name, "existing": 0}


def carry_order_onto_job_card(job_card_name: str, sales_order: str | None) -> None:
	so = (sales_order or "").strip()
	if not so or not job_card_name:
		return
	if frappe.get_meta("DMS Job Card").has_field("sales_order"):
		current = frappe.db.get_value("DMS Job Card", job_card_name, "sales_order")
		if not current:
			frappe.db.set_value("DMS Job Card", job_card_name, "sales_order", so, update_modified=False)

	# The order's branch follows onto the job card it starts (never overwriting a
	# branch already carried from an inspection / appointment).
	if frappe.get_meta("Sales Order").has_field("branch"):
		order_branch = frappe.db.get_value("Sales Order", so, "branch")
		if order_branch and frappe.get_meta("DMS Job Card").has_field("branch"):
			if not frappe.db.get_value("DMS Job Card", job_card_name, "branch"):
				frappe.db.set_value(
					"DMS Job Card", job_card_name, "branch", order_branch, update_modified=False
				)

	link_order_advances_to_job_card(so, job_card_name)

	# Drafts created from an order before line discounts were copied: fill them in
	# when the job card is opened, without clobbering discounts already on the card.
	if not frappe.db.exists("DMS Job Card", job_card_name):
		return
	docstatus = cint(frappe.db.get_value("DMS Job Card", job_card_name, "docstatus"))
	if docstatus != 0:
		return
	doc = frappe.get_doc("DMS Job Card", job_card_name)
	detail = _workshop_order_detail(so)
	if copy_order_line_discounts_onto_doc(doc, detail):
		if hasattr(doc, "calculate_costing_and_totals"):
			doc.calculate_costing_and_totals()
		doc.flags.ignore_mandatory = True
		doc.save(ignore_permissions=True)
