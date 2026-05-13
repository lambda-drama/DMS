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
