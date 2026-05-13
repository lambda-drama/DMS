import frappe
from frappe import _
from dms.api.utils import add_company_filter


@frappe.whitelist()
def get_invoices(limit=50, offset=0, status=None, search=None):
	filters = {}
	if status:
		filters["status"] = status

	add_company_filter(filters)

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer_name": ["like", f"%{search}%"],
		}

	invoices = frappe.get_all(
		"Sales Invoice",
		filters=filters,
		or_filters=or_filters if or_filters else None,
		fields=[
			"name", "customer", "customer_name", "posting_date",
			"due_date", "grand_total", "outstanding_amount",
			"status", "currency",
			"docstatus", "creation", "modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="creation desc",
	)

	return invoices
