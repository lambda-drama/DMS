import re

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, now_datetime

from dms.api.utils import LIST_ORDER_LATEST_CREATED, add_branch_filter, get_dms_companies, resolve_dms_customer
from dms.dealer_management_system.utils.document_links import enrich_appointment_row

_TERMINAL_STATUSES = frozenset({
	"Completed", "Cancelled", "No-Show",
})
_ARRIVED_STATUSES = frozenset({
	"Arrived", "In Inspection", "In Workshop", "Ready for Pickup", "Completed",
})
_REMINDER_STATUSES = frozenset({"Booked", "Rescheduled"})


def _append_status_history(doc, message):
	stamp = now_datetime().strftime("%Y-%m-%d %H:%M")
	line = f"{stamp} - {message}"
	history = (doc.get("status_history") or "").strip()
	return f"{history}\n{line}" if history else line


def _get_appointment_doc(name):
	if not name:
		frappe.throw(_("Appointment name is required"))
	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("read")
	return doc


def _resolve_appointment_phone(doc):
	"""primary_phone is fetched from customer; mobile_no is editable on the appointment."""
	for field in ("primary_phone", "mobile_no"):
		phone = (doc.get(field) if isinstance(doc, dict) else getattr(doc, field, None)) or ""
		phone = str(phone).strip()
		if phone:
			return phone

	customer = doc.get("customer") if isinstance(doc, dict) else getattr(doc, "customer", None)
	if customer:
		return (frappe.db.get_value("Customer", customer, "mobile_no") or "").strip()
	return ""


def _get_appointment_whatsapp_template():
	if not frappe.db.exists("DocType", "WhatsApp Setup"):
		frappe.throw(_("WhatsApp Setup is not available. Install and configure the NextLayer WhatsApp app."))

	setup = frappe.get_doc("WhatsApp Setup", "WhatsApp Setup")
	if not setup.enabled:
		frappe.throw(_("WhatsApp is not enabled in WhatsApp Setup"))

	for row in setup.get("template_details") or []:
		if row.reference_doctype == "Service Appointment" and row.whatsapp_template:
			return row.whatsapp_template

	frappe.throw(
		_("No WhatsApp template mapped for Service Appointment in WhatsApp Setup → Template Details")
	)


def _build_whatsapp_template_parameters(doc, template_name):
	template = frappe.get_doc("WhatsApp Message Templates", template_name)
	raw_fields = (template.field_names or "").strip()
	if not raw_fields:
		return []

	field_names = [f.strip() for f in re.split(r"[\n,]+", raw_fields) if f.strip()]
	parameters = []
	for fieldname in field_names:
		try:
			value = doc.get_formatted(fieldname)
		except Exception:
			value = doc.get(fieldname)
		parameters.append("" if value is None else str(value))
	return parameters


def _send_whatsapp_template(to_number, template_name, template_parameters, reference_doctype, reference_name):
	try:
		from nextlayer.next_layer.api.whatsapp_utils import send_whatsapp_message
	except ImportError:
		frappe.throw(_("NextLayer WhatsApp integration is not installed"))

	return send_whatsapp_message(
		to_number=to_number,
		message_type="template",
		template_name=template_name,
		template_parameters=template_parameters,
		reference_doctype=reference_doctype,
		reference_name=reference_name,
	)


@frappe.whitelist()
def get_appointments(limit=50, offset=0, status=None, date=None, search=None):
	filters = {}
	if status:
		filters["status"] = status
	if date:
		filters["appointment_date_time"] = ["like", f"{date}%"]

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer_name": ["like", f"%{search}%"],
			"license_plate": ["like", f"%{search}%"],
		}

	filters = add_branch_filter(filters, doctype="Service Appointment")

	total = len(frappe.get_all(
		"Service Appointment",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	appointments = frappe.get_all(
		"Service Appointment",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "booking_source", "appointment_date_time", "company",
			"promised_delivery_date_time", "estimated_duration_hours",
			"priority", "customer", "customer_name", "primary_phone", "mobile_no",
			"customer_email", "vehicle", "vin_chassis", "license_plate",
			"current_odometer", "warranty_status",
			"customer_complaint_summary", "preferred_advisor",
			"vehicle_arrival_status", "status",
			"assigned_service_advisor", "assigned_bay",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)

	if appointments:
		names = [a.name for a in appointments]
		service_rows = frappe.get_all(
			"Service Type Item",
			filters={
				"parent": ["in", names],
				"parenttype": "Service Appointment",
				"parentfield": "service_type_requested",
			},
			fields=["parent", "service_type", "estimated_hours", "is_urgent"],
			order_by="idx asc",
		)
		by_parent = {}
		for row in service_rows:
			by_parent.setdefault(row.parent, []).append({
				"service_type": row.service_type,
				"estimated_hours": row.estimated_hours,
				"is_urgent": row.is_urgent,
			})
		for apt in appointments:
			apt["service_type_requested"] = by_parent.get(apt.name, [])
			apt["contact_phone"] = _resolve_appointment_phone(apt)
			enrich_appointment_row(apt)

	return {"data": appointments, "total": total}


@frappe.whitelist()
def get_appointment(name):
	if not name:
		frappe.throw(_("Appointment name is required"))

	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("read")

	result = doc.as_dict()
	enrich_appointment_row(result)
	return result


@frappe.whitelist()
def create_appointment(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	vehicle = data.get("vehicle")
	vin_chassis = data.get("vin_chassis")

	# vehicle links to Item; vin_chassis links to VIN No (often same string as vin_number)
	if vin_chassis:
		if not frappe.db.exists("VIN No", vin_chassis):
			# Legacy: client sent vin_number instead of VIN No doc name
			vin_name = frappe.db.get_value("VIN No", {"vin_number": vin_chassis}, "name")
			if vin_name:
				vin_chassis = vin_name

		if not vehicle or not frappe.db.exists("Item", vehicle):
			linked_item = frappe.db.get_value("VIN No", vin_chassis, "linked_item")
			if linked_item:
				vehicle = linked_item

	if vin_chassis and not vehicle:
		frappe.throw(_("Selected vehicle has no linked model item. Update the VIN record first."))

	company = (data.get("company") or "").strip()
	allowed = get_dms_companies()
	if allowed:
		if not company:
			frappe.throw(_("Company is required"))
		if company not in allowed:
			frappe.throw(_("Company must be one of the companies selected in DMS Settings."))

	doc_data = {
		"doctype": "Service Appointment",
		"booking_source": data.get("booking_source", "Walk-in"),
		"booking_reference": data.get("booking_reference"),
		"appointment_date_time": data.get("appointment_date_time"),
		"company": company or None,
		"estimated_duration_hours": data.get("estimated_duration_hours"),
		"priority": data.get("priority", "Normal"),
		"customer": resolve_dms_customer(data.get("customer")),
		"vehicle": vehicle,
		"vin_chassis": vin_chassis,
		"license_plate": data.get("license_plate"),
		"current_odometer": data.get("current_odometer"),
		"customer_complaint_summary": data.get("customer_complaint_summary"),
		"preferred_advisor": data.get("preferred_advisor"),
		"preferred_technician": data.get("preferred_technician"),
		"special_instructions": data.get("special_instructions"),
		"mobile_no": data.get("mobile_no"),
		"customer_email": data.get("customer_email"),
	}
	promised = (data.get("promised_delivery_date_time") or "").strip()
	if promised:
		doc_data["promised_delivery_date_time"] = promised

	doc = frappe.get_doc(doc_data)

	service_types = data.get("service_type_requested") or []
	if not service_types:
		frappe.throw(_("Add at least one service type"))

	for svc in service_types:
		service_type = (svc.get("service_type") or "").strip()
		if not service_type:
			continue
		doc.append(
			"service_type_requested",
			{
				"service_type": service_type,
				"estimated_hours": svc.get("estimated_hours") or 1.0,
				"is_urgent": cint(svc.get("is_urgent") or svc.get("is_warranty")),
				"notes": (svc.get("notes") or svc.get("description") or "")[:140],
			},
		)

	if not doc.service_type_requested:
		frappe.throw(_("Add at least one service type"))

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"customer": doc.customer,
		"customer_name": doc.customer_name,
		"appointment_date_time": str(doc.appointment_date_time),
		"status": doc.status,
	}


@frappe.whitelist()
def update_appointment(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Service Appointment", name)
	doc.check_permission("write")

	updatable = [
		"appointment_date_time", "promised_delivery_date_time", "company",
		"estimated_duration_hours", "priority", "customer_complaint_summary",
		"preferred_advisor", "preferred_technician", "special_instructions",
		"assigned_service_advisor", "assigned_bay", "vehicle_arrival_status",
		"mobile_no",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	if "company" in data:
		company = (data.get("company") or "").strip()
		allowed = get_dms_companies()
		if allowed:
			if not company:
				frappe.throw(_("Company is required"))
			if company not in allowed:
				frappe.throw(_("Company must be one of the companies selected in DMS Settings."))

	doc.save()
	frappe.db.commit()

	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def submit_appointment(name):
	"""Legacy alias — use confirm_appointment."""
	return confirm_appointment(name)


@frappe.whitelist()
def confirm_appointment(name):
	"""Submit draft appointment and mark customer confirmation."""
	doc = _get_appointment_doc(name)
	if doc.docstatus != 0:
		frappe.throw(_("Only draft appointments can be confirmed"))
	if doc.status in _TERMINAL_STATUSES:
		frappe.throw(_("Cannot confirm a {0} appointment").format(doc.status))

	doc.check_permission("submit")
	doc.customer_confirmed = "Confirmed"
	doc.confirmation_sent = 1
	doc.confirmation_sent_datetime = now_datetime()
	doc.status_history = _append_status_history(doc, "Confirmed")
	doc.submit()
	frappe.db.commit()

	return {
		"name": doc.name,
		"docstatus": doc.docstatus,
		"status": doc.status,
		"customer_confirmed": doc.customer_confirmed,
	}


@frappe.whitelist()
def send_appointment_reminder(name):
	"""Send appointment reminder via Meta WhatsApp using the mapped template."""
	doc = _get_appointment_doc(name)
	doc.check_permission("write")

	if doc.docstatus != 1:
		frappe.throw(_("Confirm the appointment before sending a reminder"))
	if doc.status in _TERMINAL_STATUSES:
		frappe.throw(_("Cannot send a reminder for a {0} appointment").format(doc.status))
	if doc.status in _ARRIVED_STATUSES:
		frappe.throw(_("Cannot send a reminder after the vehicle has arrived"))
	if doc.status not in _REMINDER_STATUSES:
		frappe.throw(_("Cannot send a reminder from status {0}").format(doc.status))

	phone = _resolve_appointment_phone(doc)
	if not phone:
		frappe.throw(
			_("Add a phone number on the appointment (Mobile No) or on the customer record before sending a reminder")
		)

	template_name = _get_appointment_whatsapp_template()
	template_parameters = _build_whatsapp_template_parameters(doc, template_name)

	result = _send_whatsapp_template(
		phone,
		template_name,
		template_parameters,
		"Service Appointment",
		doc.name,
	)
	if not result.get("success"):
		frappe.throw(result.get("error") or _("Failed to send WhatsApp reminder"))

	now = now_datetime()
	updates = {
		"reminder_sent": 1,
		"reminder_sent_datetime": now,
		"reminder_method": "WhatsApp",
		"status": "Reminder Sent",
		"status_history": _append_status_history(doc, "Reminder sent via WhatsApp"),
	}
	frappe.db.set_value("Service Appointment", doc.name, updates, update_modified=True)
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": "Reminder Sent",
		"reminder_sent": 1,
		"reminder_sent_datetime": str(now),
		"reminder_method": "WhatsApp",
		"message_id": result.get("message_id"),
	}


@frappe.whitelist()
def mark_arrived(name):
	doc = _get_appointment_doc(name)
	if doc.docstatus != 1:
		frappe.throw(_("Confirm the appointment before marking as arrived"))
	if doc.status in _TERMINAL_STATUSES:
		frappe.throw(_("Cannot mark a {0} appointment as arrived").format(doc.status))
	if doc.status in _ARRIVED_STATUSES:
		frappe.throw(_("Appointment is already marked as arrived"))
	if doc.status not in ("Booked", "Reminder Sent", "Rescheduled"):
		frappe.throw(_("Cannot mark as arrived from status {0}").format(doc.status))

	doc.check_permission("write")
	now = now_datetime()
	updates = {
		"status": "Arrived",
		"arrived_date_time": now,
		"status_history": _append_status_history(doc, "Arrived"),
	}
	frappe.db.set_value("Service Appointment", doc.name, updates, update_modified=True)
	frappe.db.commit()

	return {
		"name": doc.name,
		"status": "Arrived",
		"arrived_date_time": str(now),
	}


@frappe.whitelist()
def cancel_appointment(name, reason=None, notes=None):
	doc = _get_appointment_doc(name)
	if doc.status == "Completed":
		frappe.throw(_("Completed appointments cannot be cancelled"))
	if doc.docstatus == 2:
		frappe.throw(_("This appointment is already cancelled"))

	updates = {
		"status": "Cancelled",
		"customer_confirmed": "Cancelled",
		"no_show_reason": reason,
		"no_show_notes": notes,
		"status_history": _append_status_history(doc, "Cancelled"),
	}

	if doc.docstatus == 1:
		doc.check_permission("cancel")
		frappe.db.set_value("Service Appointment", doc.name, updates, update_modified=True)
		doc.reload()
		doc.cancel()
	elif doc.docstatus == 0:
		doc.check_permission("write")
		doc.update(updates)
		doc.save()
	else:
		frappe.throw(_("Cannot cancel this appointment"))

	frappe.db.commit()
	doc.reload()
	return {
		"name": doc.name,
		"docstatus": doc.docstatus,
		"status": doc.status,
	}


@frappe.whitelist()
def reschedule_appointment(name, appointment_date_time=None, promised_delivery_date_time=None):
	doc = _get_appointment_doc(name)
	if doc.status in _TERMINAL_STATUSES:
		frappe.throw(_("Cannot reschedule a {0} appointment").format(doc.status))
	if doc.status in _ARRIVED_STATUSES:
		frappe.throw(_("Cannot reschedule after the vehicle has arrived"))

	if not appointment_date_time:
		frappe.throw(_("New appointment date and time is required"))

	new_dt = get_datetime(appointment_date_time)
	updates = {
		"appointment_date_time": new_dt,
		"status": "Rescheduled",
		"customer_confirmed": "Rescheduled",
		"status_history": _append_status_history(doc, f"Rescheduled to {new_dt}"),
	}
	if promised_delivery_date_time:
		updates["promised_delivery_date_time"] = get_datetime(promised_delivery_date_time)

	if doc.docstatus == 0:
		doc.check_permission("write")
		for field, value in updates.items():
			doc.set(field, value)
		doc.save()
	elif doc.docstatus == 1:
		doc.check_permission("write")
		frappe.db.set_value("Service Appointment", doc.name, updates, update_modified=True)
	else:
		frappe.throw(_("Cannot reschedule a cancelled appointment"))

	frappe.db.commit()
	doc.reload()
	return {
		"name": doc.name,
		"status": doc.status,
		"appointment_date_time": str(doc.appointment_date_time),
		"promised_delivery_date_time": str(doc.promised_delivery_date_time)
		if doc.promised_delivery_date_time
		else None,
	}
