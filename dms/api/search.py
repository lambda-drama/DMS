import frappe
from frappe import _
from frappe.utils import cint

from dms.api.utils import get_vehicle_customer_groups, add_company_filter

MIN_QUERY_LEN = 2
DEFAULT_LIMIT = 6


def _like_filters(fields, query):
	return [[field, "like", f"%{query}%"] for field in fields]


def _item(name, title, subtitle, doctype, view, params=None):
	return {
		"name": name,
		"title": title or name,
		"subtitle": subtitle or "",
		"doctype": doctype,
		"view": view,
		"params": params or {"id": name},
	}


def _search_doctype(doctype, fields, display_fn, view, query, limit, extra_filters=None):
	if not frappe.has_permission(doctype, "read"):
		return []

	filters = dict(extra_filters or {})
	or_filters = _like_filters(fields, query)

	rows = frappe.get_all(
		doctype,
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		limit=cint(limit),
		order_by="modified desc",
	)

	items = []
	for row in rows:
		title, subtitle = display_fn(row)
		items.append(_item(row.name, title, subtitle, doctype, view))
	return items


def _search_customers(query, limit):
	if not frappe.has_permission("Customer", "read"):
		return []

	filters = {}
	groups = get_vehicle_customer_groups()
	if groups:
		filters["customer_group"] = ["in", groups]

	rows = frappe.get_all(
		"Customer",
		filters=filters,
		or_filters=_like_filters(
			["name", "customer_name", "mobile_no", "email_id"],
			query,
		),
		fields=["name", "customer_name", "mobile_no"],
		limit=cint(limit),
		order_by="modified desc",
	)

	return [
		_item(
			r.name,
			r.customer_name or r.name,
			r.mobile_no or "",
			"Customer",
			"customers",
			{"id": r.name},
		)
		for r in rows
	]


def _search_invoices(query, limit):
	if not frappe.has_permission("Sales Invoice", "read"):
		return []

	filters = {}
	add_company_filter(filters)

	rows = frappe.get_all(
		"Sales Invoice",
		filters=filters,
		or_filters=_like_filters(["name", "customer_name", "customer"], query),
		fields=["name", "customer_name", "status", "grand_total"],
		limit=cint(limit),
		order_by="modified desc",
	)

	items = []
	for r in rows:
		subtitle = " · ".join(
			p for p in [r.customer_name, r.status, str(r.grand_total or "")] if p
		)
		items.append(_item(r.name, r.name, subtitle, "Sales Invoice", "invoices", {"id": r.name}))
	return items


@frappe.whitelist()
def global_search(query="", limit=DEFAULT_LIMIT):
	"""Cross-doctype search for the DMS frontend (similar to ERPNext awesome bar)."""
	query = (query or "").strip()
	limit = min(max(cint(limit) or DEFAULT_LIMIT, 1), 15)

	if len(query) < MIN_QUERY_LEN:
		return {"query": query, "groups": []}

	per_type = limit
	groups = []

	appointments = _search_doctype(
		"Service Appointment",
		["name", "customer_name", "license_plate", "vin_chassis", "primary_phone", "status"],
		lambda r: (
			r.name,
			" · ".join(
				p
				for p in [
					r.customer_name,
					r.license_plate,
					r.status,
				]
				if p
			),
		),
		"appointment-detail",
		query,
		per_type,
	)
	if appointments:
		groups.append({"label": _("Appointments"), "items": appointments})

	job_cards = _search_doctype(
		"DMS Job Card",
		["name", "customer_name", "license_plate", "vehicle_model", "status"],
		lambda r: (
			r.name,
			" · ".join(p for p in [r.customer_name, r.license_plate or r.vehicle_model, r.status] if p),
		),
		"job-card-detail",
		query,
		per_type,
	)
	if job_cards:
		groups.append({"label": _("Job Cards"), "items": job_cards})

	inspections = _search_doctype(
		"Vehicle Inspection",
		["name", "customer", "license_plate", "vin_chassis", "inspection_date"],
		lambda r: (
			r.name,
			" · ".join(p for p in [r.license_plate, r.vin_chassis] if p),
		),
		"inspection-detail",
		query,
		per_type,
	)
	if inspections:
		groups.append({"label": _("Inspections"), "items": inspections})

	customers = _search_customers(query, per_type)
	if customers:
		groups.append({"label": _("Customers"), "items": customers})

	vehicles = _search_doctype(
		"VIN No",
		["name", "vin_number", "plate_number", "model_name", "current_customer"],
		lambda r: (
			r.plate_number or r.vin_number or r.name,
			" · ".join(p for p in [r.model_name, r.name] if p),
		),
		"vehicles",
		query,
		per_type,
	)
	if vehicles:
		# vehicles list uses name as VIN doc id
		for v in vehicles:
			v["params"] = {"id": v["name"]}
		groups.append({"label": _("Vehicles"), "items": vehicles})

	deliveries = _search_doctype(
		"Vehicle Delivery Note",
		["name", "customer", "license_plate", "vehicle_vin", "vehicle_model", "job_card"],
		lambda r: (
			r.name,
			" · ".join(p for p in [r.license_plate, r.vehicle_model, r.job_card] if p),
		),
		"deliveries",
		query,
		per_type,
	)
	if deliveries:
		for d in deliveries:
			d["params"] = {"id": d["name"]}
		groups.append({"label": _("Deliveries"), "items": deliveries})

	invoices = _search_invoices(query, per_type)
	if invoices:
		groups.append({"label": _("Invoices"), "items": invoices})

	technicians = _search_doctype(
		"Technician",
		["name", "full_name", "personal_phone", "status"],
		lambda r: (
			r.full_name or r.name,
			" · ".join(p for p in [r.personal_phone, r.status] if p),
		),
		"technician-detail",
		query,
		per_type,
	)
	if technicians:
		groups.append({"label": _("Technicians"), "items": technicians})

	return {"query": query, "groups": groups}
