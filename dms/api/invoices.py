import frappe
from frappe import _
from frappe.utils import cint, flt, today

from dms.api.utils import add_company_filter


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for Sales Invoice and Payment Entry."))


@frappe.whitelist()
def get_invoices(limit=50, offset=0, status=None, search=None):
	filters = {}
	if status:
		filters["status"] = status

	add_company_filter(filters)

	# Aftersales / DMS only: invoice created from job card
	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		filters["custom_dms_job_card"] = ["!=", ""]

	or_filters = None
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
			"name",
			"customer",
			"customer_name",
			"posting_date",
			"due_date",
			"grand_total",
			"outstanding_amount",
			"status",
			"currency",
			"docstatus",
			"creation",
			"modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by="creation desc",
	)

	return invoices


@frappe.whitelist()
def get_invoice_preview_from_job_card(
	job_card, warranty_application_type=None, discount_amount=None
):
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		build_invoice_preview_from_job_card,
	)

	job_card_name = (job_card or "").strip()
	if not job_card_name:
		frappe.throw(_("Job Card name is required."))

	frappe.has_permission("DMS Job Card", "read", job_card_name, throw=True)
	frappe.has_permission("Sales Invoice", "create", throw=True)

	return build_invoice_preview_from_job_card(
		job_card_name,
		warranty_application_type=warranty_application_type,
		discount_amount=discount_amount,
	)


@frappe.whitelist()
def get_sales_invoice_detail(sales_invoice):
	_ensure_erpnext()

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	frappe.has_permission("Sales Invoice", "read", name, throw=True)

	si = frappe.get_doc("Sales Invoice", name)
	items = []
	for row in si.get("items") or []:
		items.append(
			{
				"item_code": row.item_code,
				"description": row.description or row.item_name,
				"qty": flt(row.qty),
				"rate": flt(row.rate),
				"amount": flt(row.amount),
			}
		)

	result = {
		"name": si.name,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"company": si.company,
		"posting_date": si.posting_date,
		"due_date": si.due_date,
		"grand_total": flt(si.grand_total),
		"outstanding_amount": flt(si.outstanding_amount),
		"status": si.status,
		"currency": si.currency,
		"docstatus": si.docstatus,
		"remarks": si.remarks,
		"items": items,
	}
	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		result["dms_job_card"] = si.get("custom_dms_job_card")
	return result


@frappe.whitelist()
def list_modes_of_payment(company=None):
	_ensure_erpnext()

	filters = {"enabled": 1}
	if company:
		modes = frappe.get_all(
			"Mode of Payment Account",
			filters={"parenttype": "Mode of Payment", "company": company},
			pluck="parent",
			distinct=True,
		)
		if modes:
			filters["name"] = ["in", modes]

	modes = frappe.get_all(
		"Mode of Payment",
		filters=filters,
		fields=["name", "type"],
		order_by="name asc",
	)
	if company and not modes:
		modes = frappe.get_all(
			"Mode of Payment",
			filters={"enabled": 1},
			fields=["name", "type"],
			order_by="name asc",
		)
	return modes


@frappe.whitelist()
def collect_payment(
	sales_invoice,
	mode_of_payment,
	paid_amount=None,
	reference_no=None,
):
	_ensure_erpnext()

	invoice_name = (sales_invoice or "").strip()
	if not invoice_name:
		frappe.throw(_("Sales Invoice name is required."))

	if not mode_of_payment:
		frappe.throw(_("Mode of payment is required."))

	frappe.has_permission("Payment Entry", "create", throw=True)
	frappe.has_permission("Sales Invoice", "read", invoice_name, throw=True)

	si = frappe.get_doc("Sales Invoice", invoice_name)
	if si.docstatus != 1:
		frappe.throw(_("Submit the Sales Invoice before recording payment."))

	outstanding = flt(si.outstanding_amount)
	if outstanding <= 0:
		frappe.throw(_("This invoice has no outstanding amount to collect."))

	amount = flt(paid_amount) if paid_amount not in (None, "") else outstanding
	if amount <= 0:
		frappe.throw(_("Payment amount must be greater than zero."))
	if amount > outstanding + 0.01:
		frappe.throw(
			_("Payment amount cannot exceed outstanding amount ({0}).").format(outstanding)
		)

	from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

	pe = get_payment_entry("Sales Invoice", invoice_name)
	if isinstance(pe, dict):
		pe = frappe.get_doc(pe)

	pe.mode_of_payment = mode_of_payment
	if reference_no:
		pe.reference_no = reference_no

	if amount < outstanding - 0.01:
		pe.paid_amount = amount
		pe.received_amount = amount
		for ref in pe.get("references") or []:
			ref.allocated_amount = amount
			break

	pe.insert()
	pe.submit()

	si.reload()

	return {
		"payment_entry": pe.name,
		"paid_amount": amount,
		"outstanding_amount": flt(si.outstanding_amount),
		"status": si.status,
	}
