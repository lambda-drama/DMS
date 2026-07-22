# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, now_datetime  # ← Fixed import
from datetime import timedelta  # Alternative


_APPOINTMENT_PRIORITY_TO_JOB_CARD = {
	"Normal": "Normal",
	"VIP": "VIP",
	"Comeback/Repeat Repair": "Comeback/Repeat Repair",
	"Safety Critical": "Safety Critical",
	"Immobilized": "Immobilized",
	"Fleet Priority": "Fleet Priority",
	"Emergency": "Urgent",
}


class VehicleInspection(Document):
	def before_submit(self):
		# Permanent stage timestamp for TAT (§2.3) — do not rely on modified/editable text
		if not self.inspection_completed_date:
			self.inspection_completed_date = now_datetime()

	def on_submit(self):
		"""When inspection is submitted, update VIN owner and odometer on the VIN record."""
		if not self.vin_chassis or not frappe.db.exists("VIN No", self.vin_chassis):
			return

		vin = frappe.get_doc("VIN No", self.vin_chassis)
		old_odometer = vin.current_odometer

		if self.customer and vin.current_customer != self.customer:
			vin.current_customer = self.customer

		if self.odometer:
			vin.last_service_odometer = vin.current_odometer
			vin.current_odometer = self.odometer
			vin.odometer_last_updated = now_datetime()

		vin.save(ignore_permissions=True)

		if self.odometer and old_odometer != self.odometer:
			frappe.msgprint(
				_("Vehicle odometer updated from {0} to {1} km").format(
					old_odometer, self.odometer
				)
			)


@frappe.whitelist()
def make_dms_job_card_from_inspection(source_name: str) -> str:
	if not frappe.has_permission("Vehicle Inspection", "write", doc=source_name):
		frappe.throw(_("Not permitted to update this Vehicle Inspection"), frappe.PermissionError)
	if not frappe.has_permission("DMS Job Card", "create"):
		frappe.throw(_("Not permitted to create DMS Job Card"), frappe.PermissionError)

	inv = frappe.get_doc("Vehicle Inspection", source_name)

	existing_jc = frappe.db.get_value("DMS Job Card", {"inspection": inv.name}, "name")
	if existing_jc and frappe.db.exists("DMS Job Card", existing_jc):
		frappe.throw(
			_("This inspection is already linked to Job Card {0}.").format(frappe.bold(existing_jc)),
			title=_("Job Card exists"),
		)

	if not inv.customer:
		frappe.throw(_("Customer is required on the Vehicle Inspection."))
	if not inv.vin_chassis:
		frappe.throw(_("VIN / Chassis Number is required on the Vehicle Inspection."))

	job_items_child = frappe.get_meta("DMS Job Card").get_field("job_items").options
	if not frappe.db.exists("DocType", job_items_child):
		frappe.throw(
			_("Child DocType {0} is missing. Run `bench migrate` after updating the app.").format(
				frappe.bold(job_items_child)
			)
		)

	jc = frappe.new_doc("DMS Job Card")
	jc.update(
		{
			"inspection": inv.name,
			"appointment": inv.appointment,
			"customer": inv.customer,
			"vehicle_vin": inv.vin_chassis,
			"service_advisor": inv.service_advisor,
			"service_advisor_notes": inv.service_advisor_notes or "",
			"internal_notes": inv.internal_notes or "",
		}
	)

	if inv.odometer is not None:
		jc.current_odometer = inv.odometer

	sa_doc = None
	if inv.appointment:
		try:
			sa_doc = frappe.get_doc("Service Appointment", inv.appointment)
		except frappe.DoesNotExistError:
			sa_doc = None

	if sa_doc:
		if sa_doc.get("assigned_bay"):
			jc.assigned_bay = sa_doc.assigned_bay
		if sa_doc.get("estimated_duration_hours") is not None:
			jc.estimated_duration_hours = sa_doc.estimated_duration_hours

		priority_key = (sa_doc.get("priority") or "").strip()
		jc.priority = _APPOINTMENT_PRIORITY_TO_JOB_CARD.get(priority_key, "Normal")

		# FIXED: Use add_to_date instead of add_hours
		jc.promised_delivery_date_time = (
			sa_doc.get("promised_delivery_date_time")
			or sa_doc.get("appointment_date_time")
			or add_to_date(now_datetime(), hours=48)  # ← FIXED
		)

		tech_rows = [r for r in (sa_doc.get("technicians") or []) if r.get("technician")]
		lead_tech = None
		assist_rows = []

		for row in tech_rows:
			role = (row.get("role") or "").strip().lower()
			if "lead" in role:
				if not lead_tech:
					lead_tech = row.technician
				else:
					assist_rows.append(row)
			else:
				assist_rows.append(row)

		if tech_rows and not lead_tech:
			lead_tech = tech_rows[0].technician
			assist_rows = tech_rows[1:]

		if lead_tech:
			jc.lead_technician = lead_tech

		for row in assist_rows:
			line = jc.append("assistant_technicians", {})
			line.technician = row.technician
			line.role = "Assistant"
	else:
		jc.priority = "Normal"
		# FIXED: Use add_to_date instead of add_hours
		jc.promised_delivery_date_time = add_to_date(now_datetime(), hours=48)  # ← FIXED

	has_job_row = False
	for row in inv.get("customer_complaints") or []:
		jc.append(
			"job_items",
			{
				"complaint_description": row.get("customer_exact_words") or _("(No description)"),
				"symptom_category": row.get("symptom_category"),
				"severity": row.get("severity"),
			},
		)
		has_job_row = True

	if not has_job_row:
		jc.append(
			"job_items",
			{
				"complaint_description": _(
					"No complaint rows were captured on Vehicle Inspection {0}. Add labour lines below."
				).format(frappe.bold(inv.name)),
			},
		)

	jc.insert()

	return jc.name