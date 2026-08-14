"""DMS CRM vehicle allocation APIs — §8.1."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from dms.crm_api.common import ensure_crm_read, ensure_crm_write, parse_json

BOOKING = "DMS CRM Booking"
ACTIVE_ALLOCATION_STATUSES = ("Confirmed", "Allocation Pending", "Allocated")


@frappe.whitelist()
def search_allocatable_vins(search=None, company=None, model=None, preferred_color=None, limit=40):
	"""In-stock VINs that are not already reserved by an active CRM booking."""
	ensure_crm_read(BOOKING)
	filters = {"vehicle_status": ["in", ["In Stock"]]}
	if company:
		filters["company"] = company
	if model:
		filters["model"] = model
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = {
			"name": ["like", q],
			"vin_number": ["like", q],
			"plate_number": ["like", q],
			"linked_item": ["like", q],
		}
	meta = frappe.get_meta("VIN No")
	fields = [
		"name",
		"vin_number",
		"plate_number",
		"linked_item",
		"model",
		"model_name",
		"status",
		"vehicle_status",
		"company",
	]
	for optional in ("branch", "exterior_color", "color", "location"):
		if meta.has_field(optional):
			fields.append(optional)

	rows = frappe.get_all(
		"VIN No",
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by="modified desc",
		limit_page_length=min(cint(limit) or 40, 100),
	)
	reserved = {
		r.vehicle_vin
		for r in frappe.get_all(
			BOOKING,
			filters={
				"vehicle_vin": ["is", "set"],
				"status": ["in", list(ACTIVE_ALLOCATION_STATUSES)],
			},
			fields=["vehicle_vin"],
		)
		if r.vehicle_vin
	}
	result = []
	for row in rows:
		if row.name in reserved:
			continue
		vin_color = getattr(row, "exterior_color", None) or getattr(row, "color", None)
		if preferred_color and vin_color and vin_color != preferred_color:
			continue
		location = None
		if row.status:
			location = frappe.db.get_value("Vehicle Location Status", row.status, "status") or row.status
		result.append(
			{
				**row,
				"location": location,
				"readiness": "Available",
				"payment_status": "N/A",
				"documentation_status": "Pending allocation",
				"pdi_status": "Not Started",
			}
		)
	return result


@frappe.whitelist()
def get_allocation_snapshot(booking):
	"""Vehicle location / readiness snapshot for an allocated booking."""
	ensure_crm_read(BOOKING)
	doc = frappe.get_doc(BOOKING, booking)
	vin = {}
	if doc.vehicle_vin and frappe.db.exists("VIN No", doc.vehicle_vin):
		meta = frappe.get_meta("VIN No")
		vin_fields = [
			"name",
			"vin_number",
			"plate_number",
			"linked_item",
			"model",
			"model_name",
			"vehicle_status",
			"status",
			"current_customer",
			"company",
		]
		for optional in ("branch", "exterior_color", "color"):
			if meta.has_field(optional):
				vin_fields.append(optional)
		vin = frappe.db.get_value(
			"VIN No",
			doc.vehicle_vin,
			vin_fields,
			as_dict=True,
		) or {}
		if vin.get("status"):
			vin["location"] = (
				frappe.db.get_value("Vehicle Location Status", vin["status"], "status")
				or vin["status"]
			)
	readiness = None
	if doc.opportunity:
		readiness_name = frappe.db.get_value(
			"DMS CRM Delivery Readiness", {"opportunity": doc.opportunity}, "name"
		)
		if readiness_name:
			readiness = frappe.db.get_value(
				"DMS CRM Delivery Readiness",
				readiness_name,
				[
					"name",
					"status",
					"payment_status",
					"documentation_status",
					"pdi_status",
					"vehicle_location",
					"delivery_appointment",
				],
				as_dict=True,
			)
	history = []
	if hasattr(doc, "allocation_history"):
		history = [
			{
				"action": row.action,
				"from_vin": row.from_vin,
				"to_vin": row.to_vin,
				"notes": row.notes,
				"approved_by": row.approved_by,
				"action_by": row.action_by,
				"action_on": row.action_on,
			}
			for row in (doc.allocation_history or [])
		]
	return {
		"booking": doc.as_dict(),
		"vin": vin,
		"readiness": readiness,
		"history": history,
		"status_summary": {
			"vehicle_location": (readiness or {}).get("vehicle_location") or vin.get("location"),
			"payment_status": (readiness or {}).get("payment_status") or "Pending",
			"documentation_status": (readiness or {}).get("documentation_status") or "Pending",
			"pdi_status": (readiness or {}).get("pdi_status") or "Not Started",
			"readiness_status": (readiness or {}).get("status") or "Not Started",
		},
	}


@frappe.whitelist()
def allocate_vin(booking, vehicle_vin=None, factory_order_reference=None, notes=None):
	"""Match a booking to a VIN / stock unit or factory order and prevent double allocation."""
	ensure_crm_write(BOOKING)
	doc = frappe.get_doc(BOOKING, booking)
	if doc.status in ("Cancelled", "Expired", "Converted to Sale"):
		frappe.throw(_("Cannot allocate against a {0} booking.").format(doc.status))

	vehicle_vin = (vehicle_vin or "").strip() or None
	factory_order_reference = (factory_order_reference or "").strip() or None
	if not vehicle_vin and not factory_order_reference:
		frappe.throw(_("Select a VIN / stock unit or enter a factory order reference."))

	previous = doc.vehicle_vin
	if vehicle_vin:
		vin = frappe.get_doc("VIN No", vehicle_vin)
		if vin.vehicle_status not in ("In Stock", "Allocated"):
			frappe.throw(
				_("VIN {0} is not available for allocation (status: {1}).").format(
					vehicle_vin, vin.vehicle_status
				)
			)
		if vin.vehicle_status == "Allocated" and previous != vehicle_vin:
			other = frappe.db.get_value(
				BOOKING,
				{
					"vehicle_vin": vehicle_vin,
					"name": ["!=", doc.name],
					"status": ["in", list(ACTIVE_ALLOCATION_STATUSES)],
				},
				"name",
			)
			if other:
				frappe.throw(_("VIN {0} is already allocated to {1}.").format(vehicle_vin, other))
		if previous and previous != vehicle_vin and not doc.allocation_switch_approved:
			frappe.throw(
				_("Manager approval is required before switching the allocated VIN.")
			)

	if previous and previous != vehicle_vin:
		_release_vin_status(previous)

	doc.vehicle_vin = vehicle_vin
	if factory_order_reference:
		doc.factory_order_reference = factory_order_reference
	doc.status = "Allocated"
	doc.allocated_on = now_datetime()
	doc.allocated_by = frappe.session.user
	doc.allocation_switch_requested = 0
	doc.allocation_switch_approved = 0
	doc.append_allocation_history(
		"Allocated",
		from_vin=previous,
		to_vin=vehicle_vin,
		notes=notes,
		approved_by=doc.allocation_switch_approved_by if previous else None,
	)
	doc.save()
	if vehicle_vin:
		frappe.db.set_value("VIN No", vehicle_vin, "vehicle_status", "Allocated")
	_notify_allocation(doc)
	if doc.opportunity:
		frappe.db.set_value(
			"DMS CRM Opportunity",
			doc.opportunity,
			"allocated_vin",
			vehicle_vin,
			update_modified=False,
		)
	frappe.db.commit()
	return get_allocation_snapshot(doc.name)


@frappe.whitelist()
def request_allocation_switch(booking, reason, new_vin=None):
	ensure_crm_write(BOOKING)
	doc = frappe.get_doc(BOOKING, booking)
	if not reason:
		frappe.throw(_("Enter the reason for switching the vehicle allocation."))
	doc.allocation_switch_requested = 1
	doc.allocation_switch_reason = reason
	doc.allocation_switch_approved = 0
	doc.allocation_switch_approved_by = None
	doc.append_allocation_history(
		"Switch Requested",
		from_vin=doc.vehicle_vin,
		to_vin=new_vin,
		notes=reason,
	)
	doc.save()
	frappe.db.commit()
	return get_allocation_snapshot(doc.name)


@frappe.whitelist()
def approve_allocation_switch(booking, approve=1, new_vin=None, notes=None):
	ensure_crm_write(BOOKING)
	doc = frappe.get_doc(BOOKING, booking)
	approve = cint(approve)
	if not doc.allocation_switch_requested:
		frappe.throw(_("No allocation switch has been requested."))
	if approve:
		doc.allocation_switch_approved = 1
		doc.allocation_switch_approved_by = frappe.session.user
		doc.append_allocation_history(
			"Switch Approved",
			from_vin=doc.vehicle_vin,
			to_vin=new_vin,
			notes=notes or doc.allocation_switch_reason,
			approved_by=frappe.session.user,
		)
		doc.save()
		if new_vin:
			return allocate_vin(doc.name, vehicle_vin=new_vin, notes=notes)
		frappe.db.commit()
		return get_allocation_snapshot(doc.name)

	doc.allocation_switch_requested = 0
	doc.allocation_switch_approved = 0
	doc.append_allocation_history(
		"Switch Rejected",
		from_vin=doc.vehicle_vin,
		to_vin=new_vin,
		notes=notes or "Switch rejected",
		approved_by=frappe.session.user,
	)
	doc.save()
	frappe.db.commit()
	return get_allocation_snapshot(doc.name)


@frappe.whitelist()
def release_vin(booking, reason=None):
	ensure_crm_write(BOOKING)
	doc = frappe.get_doc(BOOKING, booking)
	previous = doc.vehicle_vin
	if previous:
		_release_vin_status(previous)
	doc.append_allocation_history(
		"Released",
		from_vin=previous,
		to_vin=None,
		notes=reason,
	)
	doc.vehicle_vin = None
	doc.status = "Allocation Pending" if doc.status == "Allocated" else doc.status
	doc.allocated_on = None
	doc.allocated_by = None
	doc.save()
	if doc.opportunity:
		frappe.db.set_value(
			"DMS CRM Opportunity", doc.opportunity, "allocated_vin", None, update_modified=False
		)
	frappe.db.commit()
	return get_allocation_snapshot(doc.name)


def _release_vin_status(vin):
	if not vin or not frappe.db.exists("VIN No", vin):
		return
	still_held = frappe.db.exists(
		BOOKING,
		{
			"vehicle_vin": vin,
			"status": ["in", list(ACTIVE_ALLOCATION_STATUSES)],
		},
	)
	if still_held:
		return
	status = frappe.db.get_value("VIN No", vin, "vehicle_status")
	if status == "Allocated":
		frappe.db.set_value("VIN No", vin, "vehicle_status", "In Stock")


# Blueprint §8.1 — notify sales, logistics, PDI and customer care on assignment.
ALLOCATION_NOTIFY_ROLES = (
	"DMS CRM Manager",
	"Sales Manager",
	"Sales User",
	"Stock Manager",
	"Stock User",
	"Purchase Manager",
	"Purchase User",
	"Fleet Manager",
	"Service Advisor",
	"Customer Care",
	"Support Team",
	"System Manager",
)


def _notify_allocation(doc):
	recipients = set()
	if doc.allocated_by:
		recipients.add(doc.allocated_by)
	opp_owner = frappe.db.get_value("DMS CRM Opportunity", doc.opportunity, "opportunity_owner")
	if opp_owner:
		recipients.add(opp_owner)
	for role in ALLOCATION_NOTIFY_ROLES:
		if not frappe.db.exists("Role", role):
			continue
		for user in frappe.get_all(
			"Has Role", filters={"role": role, "parenttype": "User"}, pluck="parent"
		):
			if user not in ("Administrator", "Guest"):
				recipients.add(user)
	unit = doc.vehicle_vin or doc.factory_order_reference or doc.name
	message = _(
		"Vehicle {0} allocated to booking {1} for customer {2}. "
		"Sales, logistics, PDI and customer care should prepare delivery readiness."
	).format(unit, doc.name, doc.customer)
	for user in recipients:
		try:
			frappe.get_doc(
				{
					"doctype": "Notification Log",
					"subject": _("VIN allocated: {0}").format(unit),
					"email_content": message,
					"for_user": user,
					"type": "Alert",
					"document_type": BOOKING,
					"document_name": doc.name,
				}
			).insert(ignore_permissions=True)
		except Exception:
			frappe.log_error(frappe.get_traceback(), "CRM Allocation Notify")
