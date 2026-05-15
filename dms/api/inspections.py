import frappe
from frappe import _
from frappe.utils import today

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


def _resolve_service_advisor(data):
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
	frappe.throw(_("Service Advisor is required. Select an advisor or link your user to a Service Advisor record."))


def _resolve_customer_vehicle(data):
	vehicle = data.get("customer_vehicle")
	if vehicle and frappe.db.exists("Item", vehicle):
		return vehicle
	vin = data.get("vin_chassis") or data.get("vehicle_vin")
	if vin and frappe.db.exists("VIN No", vin):
		linked = frappe.db.get_value("VIN No", vin, "linked_item")
		if linked:
			return linked
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
			"license_plate": ["like", f"%{search}%"],
		}

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
			"service_advisor", "customer_vehicle",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="inspection_date desc",
	)

	return {"data": inspections, "total": total}


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
	return result


@frappe.whitelist()
def create_inspection(data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	exterior_photos = data.get("exterior_photos") or _first_photo(data.get("exterior_view_photos"))
	service_advisor = _resolve_service_advisor(data)
	customer_vehicle = _resolve_customer_vehicle(data)

	doc = frappe.get_doc({
		"doctype": "Vehicle Inspection",
		"customer": data.get("customer"),
		"service_advisor": service_advisor,
		"customer_vehicle": customer_vehicle,
		"vin_chassis": data.get("vin_chassis") or data.get("vehicle_vin"),
		"license_plate": data.get("license_plate"),
		"odometer": data.get("odometer") or data.get("current_odometer"),
		"odometer_unit": data.get("odometer_unit", "km"),
		"odometer_photo": data.get("odometer_photo"),
		"fuel_level": data.get("fuel_level"),
		"fuel_photo": data.get("fuel_photo"),
		"dashboard_photo": data.get("dashboard_photo"),
		"exterior_photos": exterior_photos,
		"inspection_date": data.get("inspection_date") or today(),
		"inspector": data.get("inspector"),
		"appointment": data.get("appointment"),
		"customer_present": data.get("customer_present", 1),
		"scan_performed": data.get("scan_performed", 0),
		"customer_signature": data.get("customer_signature"),
		"advisor_signature": data.get("advisor_signature"),
		"company": data.get("company"),
	})

	for row in data.get("exterior_checklist") or []:
		row = dict(row)
		row["component"] = EXTERIOR_COMPONENT_ALIASES.get(row.get("component"), row.get("component"))
		row.setdefault("condition", "OK")
		doc.append("exterior_checklist", row)

	for row in data.get("interior_checklist") or []:
		row = dict(row)
		row.setdefault("condition", "OK")
		doc.append("interior_checklist", row)

	for row in data.get("tires_checklist") or []:
		row = dict(row)
		row.setdefault("tire_condition", "OK")
		doc.append("tires_checklist", row)

	complaints = data.get("customer_complaints") or []
	if not complaints:
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

	if not doc.get("customer_complaints"):
		frappe.throw(_("At least one customer complaint is required."))

	_append_warning_lights(doc, data.get("warning_lights"))

	doc.insert()
	frappe.db.commit()

	return {
		"name": doc.name,
		"customer": doc.customer,
		"customer_name": _customer_display_name(doc.customer),
		"inspection_date": str(doc.inspection_date),
	}


@frappe.whitelist()
def update_inspection(name, data):
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("write")

	updatable = [
		"inspector", "fuel_level", "overall_condition",
		"customer_concerns", "inspector_notes",
	]

	for field in updatable:
		if field in data:
			doc.set(field, data[field])

	doc.save()
	frappe.db.commit()

	return {"name": doc.name}


@frappe.whitelist()
def submit_inspection(name):
	doc = frappe.get_doc("Vehicle Inspection", name)
	doc.check_permission("submit")
	doc.submit()
	frappe.db.commit()

	return {"name": doc.name, "docstatus": doc.docstatus}
