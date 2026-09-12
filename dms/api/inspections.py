import frappe
from frappe import _
from frappe.utils import cint, today

from dms.api.utils import (
	LIST_ORDER_LATEST_CREATED,
	add_branch_filter,
	enrich_vin_listing_fields,
	get_dms_companies,
	resolve_dms_customer,
)
from dms.dealer_management_system.utils.document_links import enrich_inspection_row

# Frontend warning-light labels → Vehicle Warning Light.select option
EXTERIOR_COMPONENT_ALIASES = {
	"Hood": "Bonnet/Hood",
	"Trunk/Tailgate": "Boot/Tailgate",
	"Left Rear Fender": "Left Rear Quarter Panel",
	"Right Rear Fender": "Right Rear Quarter Panel",
	"Windshield": "Front Windshield",
	"Rear Window": "Rear Windshield",
	"Left Mirror": "Left Side Mirror",
	"Right Mirror": "Right Side Mirror",
	"Headlights": "Headlamps (Left)",
	"Taillights": "Tail Lamps (Left)",
}

WARNING_LIGHT_MAP = {
	"Check Engine": "Check Engine",
	"ABS": "ABS",
	"Airbag": "Airbag",
	"Battery": "Battery",
	"Brake": "Brake System",
	"Engine Temperature": "Coolant Temperature",
	"Oil Pressure": "Oil Pressure",
	"Power Steering": "EPS",
	"TPMS": "TPMS",
	"Traction Control": "Traction Control",
}


def _customer_display_name(customer):
	if not customer:
		return None
	return frappe.db.get_value("Customer", customer, "customer_name")


def _first_photo(photos):
	if not photos or not isinstance(photos, dict):
		return None
	for key in ("front", "rear", "left", "right"):
		if photos.get(key):
			return photos[key]
	for url in photos.values():
		if url:
			return url
	return None


def _get_or_create_warning_light(warning_light_value, notes=None):
	name = frappe.db.get_value("Vehicle Warning Light", {"warning_light": warning_light_value}, "name")
	if name:
		return name
	doc = frappe.new_doc("Vehicle Warning Light")
	doc.warning_light = warning_light_value
	if notes:
		doc.notes = notes
	doc.insert(ignore_permissions=True)
	return doc.name


def _resolve_service_advisor(data, required=True):
	advisor = data.get("service_advisor")
	if advisor and frappe.db.exists("Service Advisor", advisor):
		return advisor
	user = frappe.session.user
	if user and user != "Guest":
		advisor = frappe.db.get_value(
			"Service Advisor", {"user_id": user, "status": "Active"}, "name"
		)
		if advisor:
			return advisor
	if not required:
		return None
	frappe.throw(_("Service Advisor is required. Select an advisor or link your user to a Service Advisor record."))


def _resolve_customer_vehicle(data, required=True):
	vehicle = data.get("customer_vehicle")
	if vehicle and frappe.db.exists("Item", vehicle):
		return vehicle
	vin = data.get("vin_chassis") or data.get("vehicle_vin")
	if vin and frappe.db.exists("VIN No", vin):
		linked = frappe.db.get_value("VIN No", vin, "linked_item")
		if linked:
			return linked
	if not required:
		return None
	frappe.throw(_("Vehicle model (Item) is required. Set Linked Item on the VIN record."))


def _append_warning_lights(doc, labels):
	if not labels:
		labels = ["None"]
	for label in labels:
		if label == "None":
			light_name = _get_or_create_warning_light(
				"Other", notes="No illuminated warning lights reported"
			)
		else:
			erp_value = WARNING_LIGHT_MAP.get(label, label)
			light_name = _get_or_create_warning_light(erp_value)
		doc.append("warning_lights", {"vehicle_warning_light": light_name})


@frappe.whitelist()
def get_current_service_advisor():
	user = frappe.session.user
	if not user or user == "Guest":
		return None
	return frappe.db.get_value(
		"Service Advisor",
		{"user_id": user, "status": "Active"},
		["name", "full_name"],
		as_dict=True,
	)


@frappe.whitelist()
def get_inspections(limit=50, offset=0, customer=None, date=None, search=None):
	filters = {}
	if customer:
		filters["customer"] = customer
	if date:
		filters["inspection_date"] = ["like", f"{date}%"]

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer": ["like", f"%{search}%"],
			"vin_chassis": ["like", f"%{search}%"],
			"license_plate": ["like", f"%{search}%"],
		}

	filters = add_branch_filter(filters, doctype="Vehicle Inspection")

	total = len(frappe.get_all(
		"Vehicle Inspection",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		limit_page_length=0,
		pluck="name",
	))

	inspections = frappe.get_all(
		"Vehicle Inspection",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "customer", "vin_chassis",
			"license_plate", "model_year", "inspection_date",
			"service_advisor", "customer_vehicle", "company",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)

	inspections = _enrich_inspection_list_rows(inspections)
	enrich_vin_listing_fields(inspections, vin_field="vin_chassis")

	return {"data": inspections, "total": total}


def _enrich_inspection_list_rows(rows: list[dict]) -> list[dict]:
	"""Attach warning-light and complaint summaries for the DMS list UI."""
	if not rows:
		return rows

	names = [row["name"] for row in rows if row.get("name")]
	if not names:
		return rows

	warnings_by_parent: dict[str, list[str]] = {name: [] for name in names}
	for row in frappe.get_all(
		"Vehicle Warning Light TB",
		filters={"parent": ["in", names], "parenttype": "Vehicle Inspection"},
		fields=["parent", "vehicle_warning_light"],
		order_by="idx asc",
	):
		parent = row.get("parent")
		light = (row.get("vehicle_warning_light") or "").strip()
		if parent and light:
			warnings_by_parent.setdefault(parent, []).append(light)

	complaints_by_parent: dict[str, int] = {name: 0 for name in names}
	for row in frappe.get_all(
		"Vehicle Customer Complaint",
		filters={"parent": ["in", names], "parenttype": "Vehicle Inspection"},
		fields=["parent"],
	):
		parent = row.get("parent")
		if parent:
			complaints_by_parent[parent] = complaints_by_parent.get(parent, 0) + 1

	for row in rows:
		name = row.get("name")
		lights = warnings_by_parent.get(name, [])
		complaint_count = complaints_by_parent.get(name, 0)
		row["warning_lights"] = [{"vehicle_warning_light": light} for light in lights]
		row["warning_lights_count"] = len(lights)
		row["customer_complaints_count"] = complaint_count
		# Keep length-compatible shape for list UI without loading full child rows.
		row["customer_complaints"] = [{}] * complaint_count
		enrich_inspection_row(row)

	return rows


@frappe.whitelist()
def get_inspection(name):
	if not name:
		frappe.throw(_("Inspection name is required"))

	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("read")

	result = doc.as_dict()
	result["customer_name"] = _customer_display_name(doc.customer)
	if doc.customer:
		result["contact_number"] = frappe.db.get_value(
			"Customer", doc.customer, "mobile_no"
		)
	if doc.company:
		result["company_name"] = frappe.db.get_value(
			"Company", doc.company, "company_name"
		)
	enrich_inspection_row(result)
	result["warning_light_labels"] = _warning_light_ui_labels(doc)
	return result


WARNING_LIGHT_REVERSE = {v: k for k, v in WARNING_LIGHT_MAP.items()}


def _warning_light_ui_labels(doc):
	labels = []
	for row in doc.get("warning_lights") or []:
		name = row.get("vehicle_warning_light") if isinstance(row, dict) else row.vehicle_warning_light
		if not name:
			continue
		info = frappe.db.get_value(
			"Vehicle Warning Light", name, ["warning_light", "notes"], as_dict=True
		) or {}
		erp = (info.get("warning_light") or "").strip()
		notes = info.get("notes") or ""
		if "No illuminated warning lights" in notes:
			labels.append("None")
			continue
		labels.append(WARNING_LIGHT_REVERSE.get(erp, erp))
	return labels


def _inspection_response(doc, as_draft):
	return {
		"name": doc.name,
		"docstatus": doc.docstatus,
		"customer": doc.customer,
		"customer_name": _customer_display_name(doc.customer),
		"inspection_date": str(doc.inspection_date) if doc.inspection_date else None,
		"as_draft": 1 if as_draft or doc.docstatus == 0 else 0,
	}


def _validate_inspection_company(data, as_draft):
	company = (data.get("company") or "").strip()
	allowed = get_dms_companies()
	if allowed:
		if company and company not in allowed:
			frappe.throw(_("Company must be one of the companies selected in DMS Settings."))
		if not company and not as_draft:
			frappe.throw(_("Company is required"))
	if as_draft and not data.get("customer") and not (data.get("vin_chassis") or data.get("vehicle_vin")):
		frappe.throw(_("Select at least a customer or vehicle before saving a draft"))
	return company


def _normalize_received_from_phone(phone):
	"""Store as E.164 (+251…) so Phone validation passes before/after migrate."""
	raw = (phone or "").strip()
	if not raw:
		return None
	if raw.startswith("+"):
		digits = "".join(c for c in raw if c.isdigit())
		return f"+{digits}" if digits else None
	digits = "".join(c for c in raw if c.isdigit())
	if not digits:
		return None
	if digits.startswith("251"):
		return f"+{digits}"
	if digits.startswith("0"):
		digits = digits[1:]
	return f"+251{digits}"


def _apply_inspection_payload(doc, data, as_draft):
	exterior_photos = data.get("exterior_photos") or _first_photo(data.get("exterior_view_photos"))
	service_advisor = _resolve_service_advisor(data, required=not as_draft)
	customer_vehicle = _resolve_customer_vehicle(data, required=not as_draft)
	company = (data.get("company") or "").strip()

	doc.customer = resolve_dms_customer(data.get("customer")) if data.get("customer") else None
	doc.service_advisor = service_advisor
	doc.customer_vehicle = customer_vehicle
	doc.vin_chassis = data.get("vin_chassis") or data.get("vehicle_vin")
	doc.license_plate = data.get("license_plate")
	doc.odometer = data.get("odometer") or data.get("current_odometer")
	doc.odometer_unit = data.get("odometer_unit") or "km"
	doc.odometer_photo = data.get("odometer_photo")
	doc.fuel_level = data.get("fuel_level")
	doc.fuel_photo = data.get("fuel_photo")
	doc.dashboard_photo = data.get("dashboard_photo")
	doc.exterior_photos = exterior_photos
	doc.inspection_date = data.get("inspection_date") or doc.inspection_date or today()
	if "inspector" in data:
		doc.inspector = data.get("inspector")
	doc.appointment = data.get("appointment")
	# Always persist explicit 0/1 — falsy 0 must not fall back to "present".
	if "customer_present" in data:
		doc.customer_present = 1 if cint(data.get("customer_present")) else 0
	elif doc.is_new() and doc.customer_present is None:
		doc.customer_present = 1

	if cint(doc.customer_present):
		doc.received_from_name = None
		doc.received_from_phone = None
		doc.received_from_relationship = None
	else:
		doc.received_from_name = (data.get("received_from_name") or "").strip() or None
		doc.received_from_phone = _normalize_received_from_phone(data.get("received_from_phone"))
		doc.received_from_relationship = (data.get("received_from_relationship") or "").strip() or None

	doc.scan_performed = data.get("scan_performed", 0)
	doc.customer_signature = data.get("customer_signature")
	doc.advisor_signature = data.get("advisor_signature")
	doc.company = company or None

	if "battery_voltage" in data:
		doc.battery_voltage = data.get("battery_voltage")
	if data.get("arrival_method"):
		doc.arrival_method = data.get("arrival_method")
	elif doc.is_new() and not doc.arrival_method:
		doc.arrival_method = "Driven In"
	if "keys_received" in data:
		doc.keys_received = cint(data.get("keys_received")) or 1
	elif doc.is_new() and not doc.keys_received:
		doc.keys_received = 1
	if data.get("remote_condition"):
		doc.remote_condition = data.get("remote_condition")
	elif doc.is_new() and not doc.remote_condition:
		doc.remote_condition = "Working"
	if "personal_items" in data:
		doc.personal_items = data.get("personal_items") or None
	if "service_advisor_notes" in data:
		doc.service_advisor_notes = data.get("service_advisor_notes") or None
	if "internal_notes" in data:
		doc.internal_notes = data.get("internal_notes") or None

	doc.set("exterior_checklist", [])
	for row in data.get("exterior_checklist") or []:
		row = dict(row)
		row["component"] = EXTERIOR_COMPONENT_ALIASES.get(row.get("component"), row.get("component"))
		row.setdefault("condition", "OK")
		doc.append("exterior_checklist", row)

	doc.set("interior_checklist", [])
	for row in data.get("interior_checklist") or []:
		row = dict(row)
		row.setdefault("condition", "OK")
		doc.append("interior_checklist", row)

	doc.set("tires_checklist", [])
	for row in data.get("tires_checklist") or []:
		row = dict(row)
		row.setdefault("tire_condition", "OK")
		doc.append("tires_checklist", row)

	doc.set("customer_complaints", [])
	complaints = data.get("customer_complaints") or []
	if not complaints and not as_draft:
		complaints = [{
			"customer_exact_words": "No customer complaints reported at intake.",
			"symptom_category": "Other",
		}]
	for idx, row in enumerate(complaints, start=1):
		if isinstance(row, str):
			row = {"customer_exact_words": row}
		words = (row.get("customer_exact_words") or row.get("complaint") or "").strip()
		if not words:
			continue
		doc.append("customer_complaints", {
			"complaint_sequence": idx,
			"customer_exact_words": words,
			"symptom_category": row.get("symptom_category") or "Other",
			"frequency": row.get("frequency") or "Sometimes",
			"severity": row.get("severity") or "3 - Moderate",
		})

	if not as_draft and not doc.get("customer_complaints"):
		frappe.throw(_("At least one customer complaint is required."))

	doc.set("warning_lights", [])
	if data.get("warning_lights"):
		_append_warning_lights(doc, data.get("warning_lights"))
	elif not as_draft:
		_append_warning_lights(doc, None)

	from dms.dealer_management_system.utils.customer_terms import require_and_record_terms_acceptance

	if not as_draft:
		require_and_record_terms_acceptance(doc, data.get("terms_accepted"))
	elif cint(data.get("terms_accepted")):
		require_and_record_terms_acceptance(doc, data.get("terms_accepted"))

	if as_draft:
		doc.flags.ignore_mandatory = True


@frappe.whitelist()
def create_inspection(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	as_draft = cint(data.get("as_draft") or data.get("save_as_draft"))
	_validate_inspection_company(data, as_draft)

	doc = frappe.new_doc("Vehicle Inspection")
	_apply_inspection_payload(doc, data, as_draft)
	doc.insert()
	if not as_draft:
		doc.submit()
	frappe.db.commit()
	return _inspection_response(doc, as_draft)


@frappe.whitelist()
def update_inspection(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("write")

	full_form = (
		"as_draft" in data
		or "save_as_draft" in data
		or "vin_chassis" in data
		or "vehicle_vin" in data
		or "exterior_checklist" in data
		or "customer_complaints" in data
	)

	if doc.docstatus != 0 or not full_form:
		updatable = [
			"inspector", "fuel_level", "overall_condition",
			"customer_concerns", "inspector_notes",
		]
		for field in updatable:
			if field in data:
				doc.set(field, data[field])
		doc.save()
		frappe.db.commit()
		return _inspection_response(doc, cint(doc.docstatus == 0))

	as_draft = cint(data.get("as_draft") or data.get("save_as_draft"))
	if as_draft == 0 and "as_draft" not in data and "save_as_draft" not in data:
		as_draft = 0

	_validate_inspection_company(data, as_draft)
	_apply_inspection_payload(doc, data, as_draft)
	doc.save()
	if not as_draft:
		doc.submit()
	frappe.db.commit()
	return _inspection_response(doc, as_draft)


@frappe.whitelist()
def submit_inspection(name):
	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "docstatus": doc.docstatus}
