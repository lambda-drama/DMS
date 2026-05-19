import frappe
from frappe import _
from frappe.query_builder import DocType, Order
from frappe.utils import cint, flt, today

from dms.api.utils import add_company_filter, get_dms_companies


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for Sales Invoice and Payment Entry."))


def _dms_sales_invoice_condition():
	"""Invoices from a DMS job card and/or created from the DMS UI."""
	si_meta = frappe.get_meta("Sales Invoice")
	has_jc = si_meta.has_field("custom_dms_job_card")
	has_ui = si_meta.has_field("custom_is_dms_transaction")
	if not has_jc and not has_ui:
		return None

	SI = DocType("Sales Invoice")
	cond = None
	if has_jc:
		cond = (SI.custom_dms_job_card != "") & (SI.custom_dms_job_card.isnotnull())
	if has_ui:
		ui_cond = SI.custom_is_dms_transaction == 1
		cond = ui_cond if cond is None else (cond | ui_cond)
	return cond


@frappe.whitelist()
def get_invoices(limit=50, offset=0, status=None, search=None):
	_ensure_erpnext()

	dms_cond = _dms_sales_invoice_condition()
	if dms_cond is None:
		return []

	SI = DocType("Sales Invoice")
	query = (
		frappe.qb.from_(SI)
		.select(
			SI.name,
			SI.customer,
			SI.customer_name,
			SI.posting_date,
			SI.due_date,
			SI.grand_total,
			SI.outstanding_amount,
			SI.status,
			SI.currency,
			SI.docstatus,
			SI.creation,
			SI.modified,
		)
		.where(dms_cond)
		.orderby(SI.creation, order=Order.desc)
		.limit(int(limit))
		.offset(int(offset))
	)

	companies = get_dms_companies()
	if companies:
		query = query.where(SI.company.isin(companies))

	if status:
		query = query.where(SI.status == status)

	if search:
		like = f"%{search}%"
		query = query.where((SI.name.like(like)) | (SI.customer_name.like(like)))

	return query.run(as_dict=True)


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
def create_standalone_invoice(data):
	"""Create a Sales Invoice from the DMS UI (labour + parts, no job card)."""
	_ensure_erpnext()

	if isinstance(data, str):
		import json
		data = json.loads(data)

	frappe.has_permission("Sales Invoice", "create", throw=True)

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_standalone_dms_sales_invoice,
	)

	name = create_standalone_dms_sales_invoice(
		customer=data.get("customer"),
		company=data.get("company"),
		labour_lines=data.get("labour") or data.get("labour_lines") or [],
		parts_lines=data.get("parts") or data.get("parts_lines") or [],
		warehouse=data.get("warehouse"),
		currency=data.get("currency"),
		due_date=data.get("due_date"),
		posting_date=data.get("posting_date"),
		remarks=data.get("remarks"),
		submit=cint(data.get("submit", 1)),
	)

	si = frappe.get_doc("Sales Invoice", name)
	return {
		"name": si.name,
		"docstatus": si.docstatus,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"grand_total": flt(si.grand_total),
	}


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
	if frappe.get_meta("Sales Invoice").has_field("custom_is_dms_transaction"):
		result["is_dms_transaction"] = cint(si.get("custom_is_dms_transaction"))
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

