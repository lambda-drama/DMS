"""DMS Reconciliation Hub — match customer receipts / advances against unpaid invoices.

Thin, stateless wrapper around ERPNext's virtual **Payment Reconciliation** tool:
the hub fetches the unreconciled invoices and payments for a customer, lets the
user tick which ones to match, previews the planned allocation, then performs the
reconciliation (ERPNext posts the Payment Ledger reconciliation entries).
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt

from dms.api.payment_entries import apply_dms_company_dimensions, missing_mandatory_dimensions
from dms.dealer_management_system.utils.stock_operations import get_default_dms_company

RECONCILIATION_PARTY_TYPE = "Customer"

_SKIP_FIELDTYPES = ("Section Break", "Column Break", "Tab Break")


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for payment reconciliation."))


def _invoice_key(row) -> str:
	return f"{(row.get('invoice_type') or '').strip()}::{(row.get('invoice_number') or '').strip()}"


def _payment_key(row) -> str:
	return "::".join(
		[
			(row.get("reference_type") or "").strip(),
			(row.get("reference_name") or "").strip(),
			(row.get("reference_row") or "").strip(),
		]
	)


def _row_dict(row) -> dict:
	"""Child row -> plain dict with only the useful fields."""
	return {
		df.fieldname: row.get(df.fieldname)
		for df in row.meta.fields
		if df.fieldtype not in _SKIP_FIELDTYPES and df.fieldname
	}


def _shape_invoice(row) -> dict:
	return {
		"key": _invoice_key(row),
		"name": row.invoice_number,
		"type": row.invoice_type,
		"date": row.invoice_date,
		"amount": flt(row.amount),
		"outstanding": flt(row.outstanding_amount),
		"currency": row.currency,
	}


def _shape_payment(row) -> dict:
	return {
		"key": _payment_key(row),
		"name": row.reference_name,
		"type": row.reference_type,
		"date": row.posting_date,
		"amount": flt(row.amount),
		"is_advance": bool(cint(row.is_advance)),
		"currency": row.currency,
		"remarks": row.remarks,
	}


def _open_advance_rows(pr) -> list:
	"""Payment rows of the tool that still hold money nobody allocated yet.

	A customer receipt with nothing applied has no *reference row* on the tool,
	and the excess left over after an earlier allocation looks the same. The
	tool's own `is_advance` cannot be used for this: ERPNext fills it from
	`book_advance_payments_in_separate_party_account`, which is off for ordinary
	DMS receipts, so every real advance would read `is_advance = 0`.
	"""
	return [
		row
		for row in pr.get("payments") or []
		if (row.get("reference_type") or "").strip() == "Payment Entry"
		and not (row.get("reference_row") or "").strip()
	]


def _build_reconciliation(customer: str | None, company: str | None = None):
	"""Return an in-memory Payment Reconciliation tool doc with entries fetched."""
	from erpnext.accounts.party import get_party_account

	customer = (customer or "").strip()
	if not customer:
		frappe.throw(_("Customer is required."))
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} was not found.").format(frappe.bold(customer)))

	company = (company or "").strip() or get_default_dms_company()
	if not company:
		frappe.throw(_("Company is required."))

	account = get_party_account(RECONCILIATION_PARTY_TYPE, customer, company)
	if not account:
		frappe.throw(
			_("No receivable account is configured for customer {0} in company {1}.").format(
				frappe.bold(customer), frappe.bold(company)
			)
		)

	pr = frappe.get_doc(
		{
			"doctype": "Payment Reconciliation",
			"company": company,
			"party_type": RECONCILIATION_PARTY_TYPE,
			"party": customer,
			"receivable_payable_account": account,
			"invoice_limit": 500,
			"payment_limit": 500,
		}
	)
	# Fetch the unreconciled entries BEFORE setting dimensions: the tool treats a
	# dimension value on the doc as a *filter* while collecting entries, which
	# would hide invoices that carry no dimension yet. The values only need to be
	# present when the allocation is posted (Payment Ledger Entry validation).
	pr.get_unreconciled_entries()

	# ERPNext posts a Payment Ledger Entry per reconciled row and validates the
	# mandatory accounting dimensions (e.g. Branch) on it, so carry the DMS
	# Settings → Company Defaults dimensions onto the tool document.
	apply_dms_company_dimensions(pr, company)
	return pr


def _selected_rows(pr, invoice_keys: list[str] | None, payment_keys: list[str] | None):
	"""Pull the requested child rows (all rows when no keys are given)."""
	invoice_wanted = {key for key in (invoice_keys or []) if key}
	payment_wanted = {key for key in (payment_keys or []) if key}

	invoices = [
		_row_dict(row)
		for row in pr.get("invoices") or []
		if not invoice_wanted or _invoice_key(row) in invoice_wanted
	]
	payments = [
		_row_dict(row)
		for row in pr.get("payments") or []
		if not payment_wanted or _payment_key(row) in payment_wanted
	]
	return invoices, payments


def _assert_reconciliation_dimensions(pr, company: str) -> None:
	"""Block reconciliation with an actionable error when DMS Settings is incomplete."""
	missing = missing_mandatory_dimensions(pr, company)
	if missing:
		frappe.throw(
			_(
				"Set {0} for company {1} in DMS Settings → Company Defaults. "
				"ERPNext requires it as an accounting dimension when posting the reconciliation."
			).format(frappe.bold(", ".join(missing)), frappe.bold(company))
		)


def _plan_allocations(customer, company, invoice_keys, payment_keys):
	"""Run the tool's (in-memory) greedy allocation and return the reconciliation doc."""
	pr = _build_reconciliation(customer, company)
	invoices, payments = _selected_rows(pr, invoice_keys, payment_keys)

	if not invoices:
		frappe.throw(_("Tick at least one unpaid invoice to reconcile against."))
	if not payments:
		frappe.throw(_("Tick at least one payment or advance to reconcile with."))

	pr.allocate_entries({"invoices": invoices, "payments": payments})
	return pr


def _as_list(value) -> list[str]:
	"""Accept a list or a JSON-encoded string from the client."""
	import json

	if value is None or value == "":
		return []
	if isinstance(value, str):
		try:
			value = json.loads(value)
		except ValueError:
			value = [value]
	if isinstance(value, (list, tuple, set)):
		return [str(item).strip() for item in value if str(item).strip()]
	return [str(value).strip()]


def _annotate_payment_flags(payments: list[dict]) -> None:
	"""Mark DMS-created payments and their source document."""
	pe_meta = frappe.get_meta("Payment Entry")
	fields = [
		fieldname
		for fieldname in (
			"custom_is_dms",
			"custom_dms_job_card",
			"custom_dms_service_estimate",
			"custom_dms_remarks",
		)
		if pe_meta.has_field(fieldname)
	]
	names = [row["name"] for row in payments if row.get("type") == "Payment Entry" and row.get("name")]
	if not fields or not names:
		return

	info = {
		row.name: row
		for row in frappe.get_all("Payment Entry", filters={"name": ["in", names]}, fields=["name", *fields])
	}
	for row in payments:
		data = info.get(row.get("name"))
		if not data:
			continue
		# Receipts recorded on a DMS screen before the flag was ticked still carry the
		# operator note — treat that as DMS too so the hub badge lights up.
		row["is_dms"] = bool(cint(data.get("custom_is_dms"))) or bool(
			(data.get("custom_dms_remarks") or "").strip()
		)
		row["dms_remarks"] = (data.get("custom_dms_remarks") or "").strip() or None
		row["job_card"] = data.get("custom_dms_job_card")
		row["service_estimate"] = data.get("custom_dms_service_estimate")


def _allocation_rows(pr) -> list[dict]:
	return [
		{
			"payment": row.reference_name,
			"payment_type": row.reference_type,
			"invoice": row.invoice_number,
			"invoice_type": row.invoice_type,
			"allocated": flt(row.allocated_amount),
			"currency": row.currency,
			"difference_amount": flt(row.difference_amount),
		}
		for row in pr.get("allocation") or []
		if flt(row.allocated_amount)
	]


@frappe.whitelist()
def get_reconciliation_overview(customer=None, company=None):
	"""Unpaid invoices plus unallocated payments / advances for a customer."""
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "read", throw=True)
	frappe.has_permission("Sales Invoice", "read", throw=True)

	pr = _build_reconciliation(customer, company)

	invoices = [_shape_invoice(row) for row in pr.get("invoices") or []]
	payments = [_shape_payment(row) for row in pr.get("payments") or []]
	_annotate_payment_flags(payments)

	return {
		"customer": pr.party,
		"customer_name": frappe.db.get_value("Customer", pr.party, "customer_name") or pr.party,
		"company": pr.company,
		"account": pr.receivable_payable_account,
		"invoices": invoices,
		"payments": payments,
		"totals": {
			"invoice_outstanding": sum(row["outstanding"] for row in invoices),
			"payment_available": sum(row["amount"] for row in payments),
		},
		# Surfaced so the UI can warn before the user tries to post.
		"missing_dimensions": missing_mandatory_dimensions(pr, pr.company),
	}


@frappe.whitelist()
def preview_allocation(customer=None, company=None, invoice_keys=None, payment_keys=None):
	"""Dry run: the payment -> invoice allocation that would be posted."""
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "read", throw=True)
	frappe.has_permission("Sales Invoice", "read", throw=True)

	invoice_keys = _as_list(invoice_keys)
	payment_keys = _as_list(payment_keys)

	pr = _plan_allocations(customer, company, invoice_keys, payment_keys)
	allocations = _allocation_rows(pr)
	selected_invoices, selected_payments = _selected_rows(pr, invoice_keys, payment_keys)

	return {
		"customer": pr.party,
		"company": pr.company,
		"allocations": allocations,
		"allocated_total": sum(row["allocated"] for row in allocations),
		"invoice_count": len({row["invoice"] for row in allocations}),
		"invoice_outstanding_total": sum(flt(row.get("outstanding_amount")) for row in selected_invoices),
		"payment_available_total": sum(flt(row.get("amount")) for row in selected_payments),
	}


@frappe.whitelist()
def reconcile_payments(customer=None, company=None, invoice_keys=None, payment_keys=None):
	"""Post the allocation (Payment Ledger reconciliation) for the ticked rows."""
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "write", throw=True)
	frappe.has_permission("Sales Invoice", "read", throw=True)

	pr = _plan_allocations(customer, company, _as_list(invoice_keys), _as_list(payment_keys))
	allocations = _allocation_rows(pr)
	if not allocations:
		frappe.throw(
			_("Nothing to reconcile — the selected payments do not cover any of the ticked invoices.")
		)

	_assert_reconciliation_dimensions(pr, pr.company)
	pr.reconcile()
	frappe.db.commit()

	return {
		"customer": pr.party,
		"company": pr.company,
		"reconciled": allocations,
		"allocated_total": sum(row["allocated"] for row in allocations),
		"invoice_count": len({row["invoice"] for row in allocations}),
	}


@frappe.whitelist()
def reconcile_invoice_advances(sales_invoice=None, company=None, payment_keys=None):
	"""Apply a customer's advances / downpayments to one just-created invoice.

	Backs the invoice screens' optional *reconcile immediately* step: the invoice is
	created / submitted first, then its customer's unallocated receipts (the ticked
	``payment_keys``, or every advance when none are ticked) are allocated to it by the
	same Payment Reconciliation engine the hub uses. Returns the invoice's balance
	before / after so the screen can show what is left for the customer to pay.

	``payment_keys`` are the ``key`` values from :func:`get_reconciliation_overview`.
	"""
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "write", throw=True)
	frappe.has_permission("Sales Invoice", "read", throw=True)

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice is required."))
	if not frappe.db.exists("Sales Invoice", name):
		frappe.throw(_("Sales Invoice {0} was not found.").format(frappe.bold(name)))

	si = frappe.get_doc("Sales Invoice", name)
	si.check_permission("read")
	if si.docstatus != 1:
		frappe.throw(_("Submit the invoice before reconciling its advances."))

	company = (company or "").strip() or si.company
	outstanding_before = flt(si.outstanding_amount)
	result = {
		"sales_invoice": si.name,
		"customer": si.customer,
		"customer_name": si.get("customer_name"),
		"company": company,
		"currency": si.currency,
		"outstanding_before": outstanding_before,
		"allocated_total": 0.0,
		"outstanding_after": outstanding_before,
		"reconciled": [],
	}
	if outstanding_before <= 0:
		# Already settled — paid in full, or covered by an on-account receipt.
		return result

	pr = _build_reconciliation(si.customer, company)
	invoice_key = f"Sales Invoice::{si.name}"
	invoices = [row for row in pr.get("invoices") or [] if _invoice_key(row) == invoice_key]
	if not invoices:
		return result

	wanted = set(_as_list(payment_keys))
	if wanted:
		payments = [row for row in pr.get("payments") or [] if _payment_key(row) in wanted]
	else:
		# Nothing ticked → apply every open advance of the customer, i.e. the same
		# receipts the invoice screens list as downpayments.
		payments = _open_advance_rows(pr)
	if not payments:
		return result

	pr.allocate_entries(
		{
			"invoices": [_row_dict(row) for row in invoices],
			"payments": [_row_dict(row) for row in payments],
		}
	)
	# Read the planned allocation before reconciling: the tool refetches its entries
	# (and therefore its allocation rows) at the end of `reconcile()`.
	allocations = _allocation_rows(pr)
	if not allocations:
		return result

	_assert_reconciliation_dimensions(pr, pr.company)
	pr.reconcile()
	frappe.db.commit()

	result.update(
		{
			"allocated_total": sum(row["allocated"] for row in allocations),
			"outstanding_after": flt(frappe.db.get_value("Sales Invoice", si.name, "outstanding_amount")),
			"reconciled": allocations,
		}
	)
	return result
