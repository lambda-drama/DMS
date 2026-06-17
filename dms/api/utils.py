import frappe


def get_dms_companies():
	"""Return list of company names from DMS Settings Table MultiSelect."""
	rows = frappe.get_all(
		"Company TB",
		filters={"parent": "DMS Settings", "parenttype": "DMS Settings"},
		fields=["company"],
		order_by="idx asc",
	)
	return [r.company for r in rows if r.company]


def get_dms_sales_print_formats():
	"""Print formats allowed for Sales Invoice in the DMS UI (DMS Settings)."""
	rows = frappe.get_all(
		"Print Format TB",
		filters={
			"parent": "DMS Settings",
			"parenttype": "DMS Settings",
			"parentfield": "sales_print_format",
		},
		fields=["print_format"],
		order_by="idx asc",
	)
	return [r.print_format for r in rows if r.print_format]


def get_dms_purchase_receipt_print_formats():
	"""Print format(s) allowed for Purchase Receipt in the DMS UI (DMS Settings)."""
	pf = (frappe.db.get_single_value("DMS Settings", "purchase_receipt_print_format") or "").strip()
	if not pf or not frappe.db.exists("Print Format", pf):
		return []
	if frappe.db.get_value("Print Format", pf, "disabled"):
		return []
	doc_type = frappe.db.get_value("Print Format", pf, "doc_type")
	if doc_type and doc_type != "Purchase Receipt":
		return []
	return [pf]


def get_vehicle_customer_groups():
	"""Return customer group names where custom_is_vehicle_customer is checked."""
	groups = frappe.get_all(
		"Customer Group",
		filters={"custom_is_vehicle_customer": 1},
		fields=["name"],
	)
	return [g.name for g in groups]


def add_company_filter(filters, companies=None):
	"""Add company IN filter to an existing filters dict if DMS companies are configured."""
	if companies is None:
		companies = get_dms_companies()
	if companies:
		filters["company"] = ["in", companies]
	return filters


def get_dms_default_customer() -> str | None:
	"""Default Customer from DMS Settings (walk-in / fallback)."""
	customer = (frappe.db.get_single_value("DMS Settings", "default_customer") or "").strip()
	if customer and frappe.db.exists("Customer", customer):
		return customer
	return None


def get_dms_default_customer_group() -> str | None:
	"""Default Customer Group from DMS Settings (for quick-create from DMS UI)."""
	group = (frappe.db.get_single_value("DMS Settings", "default_customer_group") or "").strip()
	if not group or not frappe.db.exists("Customer Group", group):
		return None
	vehicle_groups = get_vehicle_customer_groups()
	if vehicle_groups and group not in vehicle_groups:
		return None
	return group


def resolve_dms_customer_group(explicit: str | None = None, allowed_groups: list | None = None) -> str | None:
	"""Use explicit group, then DMS Settings default, then first allowed vehicle group."""
	group = (explicit or "").strip()
	if group:
		return group
	default = get_dms_default_customer_group()
	if default:
		return default
	if allowed_groups:
		return allowed_groups[0]
	return None


def resolve_dms_customer(explicit: str | None = None) -> str | None:
	"""Use explicit customer when provided, otherwise DMS Settings default."""
	customer = (explicit or "").strip()
	if customer:
		return customer
	return get_dms_default_customer()
