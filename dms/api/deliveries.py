import frappe
from frappe import _

from dms.api.utils import LIST_ORDER_LATEST_CREATED
from dms.dealer_management_system.utils.template_defaults import get_default_template_name

DEFAULT_DELIVERY_CHECKLIST_ITEMS = [
	"Vehicle interior cleaned",
	"Vehicle exterior washed/wiped",
	"No tools/parts left inside vehicle",
	"Personal items returned to customer",
	"All keys returned (quantity checked)",
	"Remote/key fob working",
	"Owner manual/service booklet in glovebox",
	"Warranty booklet stamped/updated",
	"Service reminder sticker applied",
	"Invoice explained and copy given",
	"Next service due communicated",
	"Vehicle damage explained (if any)",
	"Fuel level confirmed",
	"Any warning lights on?",
	"Test drive completed with customer (if requested)",
	"Customer satisfied with repair",
]


def _checklist_items_from_template(template_name: str | None) -> tuple[str | None, list[str]]:
	if not template_name:
		template_name = get_default_template_name("Delivery Checklist Template")
	if not template_name:
		return None, list(DEFAULT_DELIVERY_CHECKLIST_ITEMS)

	doc = frappe.get_doc("Delivery Checklist Template", template_name)
	items = [row.check_item for row in doc.checklist_items or [] if (row.check_item or "").strip()]
	if not items:
		return template_name, list(DEFAULT_DELIVERY_CHECKLIST_ITEMS)
	return template_name, items


@frappe.whitelist()
def get_delivery_checklist_templates():
	"""Active delivery checklist templates for the UI picker."""
	return frappe.get_all(
		"Delivery Checklist Template",
		filters={"is_active": 1},
		fields=["name", "template_name", "is_default", "description", "version"],
		order_by="is_default desc, template_name asc",
	)


@frappe.whitelist()
def get_delivery_checklist_template_items(template=None):
	"""Return checklist line labels for a template (default template if omitted)."""
	template_name, items = _checklist_items_from_template(template)
	display_name = None
	if template_name:
		display_name = frappe.db.get_value(
			"Delivery Checklist Template", template_name, "template_name"
		)
	return {
		"template": template_name,
		"template_name": display_name,
		"items": items,
	}


@frappe.whitelist()
def get_delivery_checklist_items():
	"""Backward-compatible: default template items as a plain list."""
	_, items = _checklist_items_from_template(None)
	return items


@frappe.whitelist()
def get_deliveries(limit=50, offset=0, search=None):
	filters = {}

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer": ["like", f"%{search}%"],
			"vehicle_vin": ["like", f"%{search}%"],
		}

	deliveries = frappe.get_all(
		"Vehicle Delivery Note",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "job_card", "customer",
			"vehicle_vin", "vehicle_model", "license_plate",
			"delivered_by", "delivery_date_time", "status",
			"final_odometer_km", "next_service_due_km",
			"next_service_due_date",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)

	return deliveries


@frappe.whitelist()
def get_delivery(name):
	if not name:
		frappe.throw(_("Delivery name is required"))

	doc = frappe.get_doc("Vehicle Delivery Note", name)
	doc.check_permission("read")

	return doc.as_dict()


def _build_customer_comments(received_by, comments):
	parts = []
	if (received_by or "").strip():
		parts.append(_("Received by: {0}").format(received_by.strip()))
	if (comments or "").strip():
		parts.append(comments.strip())
	return "\n\n".join(parts) if parts else ""


@frappe.whitelist()
def create_delivery(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	if not data.get("job_card"):
		frappe.throw(_("Job Card is required"))

	job_card = frappe.get_doc("DMS Job Card", data["job_card"])
	job_card.check_permission("read")

	customer = data.get("customer") or job_card.customer
	if data.get("customer_mobile") and customer:
		existing_mobile = frappe.db.get_value("Customer", customer, "mobile_no")
		if not existing_mobile:
			frappe.db.set_value("Customer", customer, "mobile_no", data["customer_mobile"])

	delivery_dt = data.get("delivery_date_time")
	if not delivery_dt and data.get("delivery_date"):
		time_part = (data.get("delivery_time") or "00:00").strip()
		delivery_dt = f"{data['delivery_date']} {time_part}:00"

	template_name, template_items = _checklist_items_from_template(
		data.get("delivery_checklist_template")
	)

	doc = frappe.get_doc({
		"doctype": "Vehicle Delivery Note",
		"job_card": job_card.name,
		"customer": customer,
		"vehicle_vin": data.get("vehicle_vin") or job_card.vehicle_vin,
		"delivered_by": data.get("delivered_by") or frappe.session.user,
		"delivery_date_time": delivery_dt or frappe.utils.now_datetime(),
		"status": data.get("status") or "Completed",
		"delivery_checklist_template": template_name,
		"final_odometer_km": data.get("final_odometer_km") or data.get("final_odometer"),
		"final_fuel_level": data.get("final_fuel_level") or "1/2",
		"vehicle_condition": data.get("vehicle_condition") or "Good",
		"new_damage_notes": data.get("new_damage_notes"),
		"invoice_explained": 1 if data.get("invoice_explained") else 0,
		"invoice_copy_given": 1 if data.get("invoice_copy_given", 1) else 0,
		"payment_cleared": 1 if data.get("payment_cleared") else 0,
		"payment_method": data.get("payment_method"),
		"payment_receipt_no": data.get("payment_receipt_no"),
		"next_service_due_km": data.get("next_service_due_km"),
		"next_service_due_date": data.get("next_service_due_date"),
		"service_reminder_sticker_given": 1 if data.get("service_reminder_sticker_given", 1) else 0,
		"service_booklet_updated": 1 if data.get("service_booklet_updated", 1) else 0,
		"customer_signature": data.get("customer_signature"),
		"delivered_by_signature": data.get("delivered_by_signature"),
		"customer_satisfaction_initial": data.get("customer_satisfaction_initial"),
		"customer_comments": _build_customer_comments(
			data.get("received_by"), data.get("customer_comments")
		),
		"delivery_notes": data.get("delivery_notes"),
	})

	checklist = data.get("delivery_checklist")
	if isinstance(checklist, str):
		import json
		checklist = json.loads(checklist) if checklist else []

	if checklist:
		for row in checklist:
			doc.append("delivery_checklist", {
				"check_item": row.get("check_item"),
				"is_completed": 1 if row.get("is_completed") else 0,
				"notes": row.get("notes") or "",
			})
	else:
		completed = data.get("checklist_completed") or {}
		if isinstance(completed, str):
			import json
			completed = json.loads(completed)
		for item in template_items:
			doc.append("delivery_checklist", {
				"check_item": item,
				"is_completed": 1 if completed.get(item) else 0,
			})

	if not doc.customer_signature:
		frappe.throw(_("Customer signature is required"))
	if not doc.delivered_by_signature:
		frappe.throw(_("Delivered by signature is required"))
	if not doc.customer_satisfaction_initial:
		frappe.throw(_("Customer satisfaction is required"))

	doc.insert()

	if data.get("submit", True):
		doc.submit()

	frappe.db.commit()

	return {
		"name": doc.name,
		"job_card": doc.job_card,
		"customer": doc.customer,
		"status": doc.status,
		"docstatus": doc.docstatus,
	}


@frappe.whitelist()
def update_delivery(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Vehicle Delivery Note", name)
	doc.check_permission("write")

	updatable = [
		"delivery_date_time", "delivered_by", "final_odometer_km",
		"final_fuel_level", "vehicle_condition", "new_damage_notes",
		"next_service_due_km", "next_service_due_date",
		"customer_signature", "delivered_by_signature",
		"customer_satisfaction_initial", "customer_comments",
		"delivery_notes", "invoice_explained", "invoice_copy_given",
		"payment_cleared", "payment_method", "payment_receipt_no",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	if "received_by" in data or "customer_comments" in data:
		doc.customer_comments = _build_customer_comments(
			data.get("received_by"), data.get("customer_comments", doc.customer_comments)
		)

	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def submit_delivery(name):
	doc = frappe.get_doc("Vehicle Delivery Note", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "docstatus": doc.docstatus}
