"""DMS Payment Entries — customer advances / downpayments and DMS receipt listing.

The Payment Entry list here is scoped to DMS activity: entries flagged
``custom_is_dms`` (created from the DMS UI) **or** entries that settle a DMS
Sales Invoice (job-card / spare-parts / standalone DMS invoice).

Customer advances ("downpayments") are created as unallocated ``Receive``
Payment Entries for the customer — no invoice reference — so ERPNext keeps them
as an available advance until a Sales Invoice is raised and settled.
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.query_builder import DocType, Order
from frappe.query_builder.functions import Count
from frappe.utils import cint, flt, today

from dms.api.invoices import _dms_sales_invoice_condition
from dms.api.invoices import list_modes_of_payment  # noqa: F401  (re-exported for the UI)
from dms.api.utils import get_dms_companies, parse_filter_date
from dms.dealer_management_system.doctype.dms_job_card.job_card_stock import (
	get_dms_company_defaults_row,
)
from dms.dealer_management_system.utils.branch_permissions import apply_branch_filter_to_qb

# Source links stored on Payment Entry (optional custom fields — see fixtures).
DMS_FLAG_FIELD = "custom_is_dms"
JOB_CARD_FIELD = "custom_dms_job_card"
ESTIMATE_FIELD = "custom_dms_service_estimate"
# Operator remarks typed on the DMS payment screens (advance / collect payment).
DMS_REMARKS_FIELD = "custom_dms_remarks"

ADVANCE_PAYMENT_TYPE = "Receive"
ADVANCE_PARTY_TYPE = "Customer"

_LIST_FIELDS = (
	"name",
	"payment_type",
	"party",
	"party_name",
	"posting_date",
	"company",
	"paid_from_account_currency",
	"paid_to_account_currency",
	"mode_of_payment",
	"reference_no",
	"reference_date",
	"paid_amount",
	"unallocated_amount",
	"docstatus",
	"remarks",
	"amended_from",
	"creation",
	"modified",
)


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for Payment Entry."))


def _pe_meta():
	return frappe.get_meta("Payment Entry")


def _has_field(fieldname: str) -> bool:
	return bool(fieldname) and _pe_meta().has_field(fieldname)


def _dms_payment_entry_condition():
	"""``custom_is_dms = 1``, a DMS operator note, or a DMS Sales Invoice link."""
	PE = DocType("Payment Entry")
	cond = None

	if _has_field(DMS_FLAG_FIELD):
		cond = PE[DMS_FLAG_FIELD] == 1

	# Receipts captured on a DMS screen keep the operator note even when the DMS flag
	# was never ticked (e.g. "Collect Payment" entries created before the flag was
	# set there), so treat a non-empty note as DMS activity too.
	if _has_field(DMS_REMARKS_FIELD):
		remarks_cond = PE[DMS_REMARKS_FIELD].isnotnull() & (PE[DMS_REMARKS_FIELD] != "")
		cond = remarks_cond if cond is None else (cond | remarks_cond)

	si_cond = _dms_sales_invoice_condition()
	if si_cond is not None:
		PER = DocType("Payment Entry Reference")
		SI = DocType("Sales Invoice")
		linked = (
			frappe.qb.from_(PER)
			.join(SI)
			.on(PER.reference_name == SI.name)
			.select(PER.parent)
			.where((PER.reference_doctype == "Sales Invoice") & si_cond)
			.distinct()
		)
		linked_cond = PE.name.isin(linked)
		cond = linked_cond if cond is None else (cond | linked_cond)

	return cond


def _payment_entry_status(docstatus) -> str:
	if cint(docstatus) == 1:
		return "Submitted"
	if cint(docstatus) == 2:
		return "Cancelled"
	return "Draft"


def _references_for(names: list[str]) -> dict[str, list[dict]]:
	"""Map Payment Entry name -> reference rows (child table)."""
	if not names:
		return {}
	rows = frappe.get_all(
		"Payment Entry Reference",
		filters={"parent": ["in", names], "parenttype": "Payment Entry"},
		fields=[
			"parent",
			"reference_doctype",
			"reference_name",
			"total_amount",
			"outstanding_amount",
			"allocated_amount",
		],
		order_by="idx asc",
	)
	out: dict[str, list[dict]] = {}
	for row in rows:
		out.setdefault(row.parent, []).append(
			{
				"reference_doctype": row.reference_doctype,
				"reference_name": row.reference_name,
				"total_amount": flt(row.total_amount),
				"outstanding_amount": flt(row.outstanding_amount),
				"allocated_amount": flt(row.allocated_amount),
			}
		)
	return out


def _source_links(name: str) -> dict:
	"""Job card / service estimate the advance was recorded against."""
	fields = [fieldname for fieldname in (JOB_CARD_FIELD, ESTIMATE_FIELD) if _has_field(fieldname)]
	if not fields:
		return {}
	row = frappe.db.get_value("Payment Entry", name, fields, as_dict=True) or {}
	return {
		"job_card": row.get(JOB_CARD_FIELD),
		"service_estimate": row.get(ESTIMATE_FIELD),
	}


def apply_dms_company_dimensions(doc, company: str | None, overrides: dict | None = None) -> None:
	"""Copy DMS Settings → Company Defaults dimensions onto a voucher.

	ERPNext requires mandatory accounting dimensions (e.g. Branch) on Balance
	Sheet / Profit & Loss accounts. A standalone advance has no Sales Invoice or
	Order to inherit them from, so the Branch / Cost Center / Project (and any
	other dimension) configured for the company on DMS Settings must be applied
	to the Payment Entry itself.
	"""
	if not doc or not company:
		return

	row = get_dms_company_defaults_row(company)
	if not row:
		return

	overrides = overrides or {}
	doc_meta = doc.meta
	for df in frappe.get_meta("DMS Company Defaults").fields:
		fieldname = df.fieldname
		if not fieldname or fieldname == "company":
			continue
		if df.fieldtype not in ("Link", "Dynamic Link"):
			continue
		if not doc_meta.has_field(fieldname) or doc.get(fieldname):
			continue
		value = overrides.get(fieldname) or getattr(row, fieldname, None)
		if value:
			doc.set(fieldname, value)


def _reset_workflow_to_initial_state(doc) -> None:
	"""Put an amendment on the workflow's initial state.

	A copied cancelled voucher still carries the state it was cancelled from
	(e.g. "Approved"). Frappe rejects that on insert because a brand-new document
	may only start at the workflow's first state.
	"""
	try:
		from frappe.model.workflow import get_workflow, get_workflow_name
	except Exception:
		return

	if not get_workflow_name(doc.doctype):
		return

	workflow = get_workflow(doc.doctype)
	field = workflow.workflow_state_field
	if not field or not doc.meta.has_field(field):
		return

	states = workflow.states or []
	if states:
		doc.set(field, states[0].state)


def missing_mandatory_dimensions(doc, company: str | None) -> list[str]:
	"""Labels of the Balance Sheet dimensions required but not set on ``doc``.

	Customer advances and reconciliations always post to Balance Sheet accounts
	(Debtors / Bank-Cash), so a dimension marked mandatory for Balance Sheet
	accounts must be present on the voucher. Without this guard ERPNext fails
	later with a cryptic Payment Ledger Entry error naming only the account.
	"""
	if not company:
		return []
	try:
		from erpnext.accounts.doctype.accounting_dimension.accounting_dimension import (
			get_checks_for_pl_and_bs_accounts,
		)
	except Exception:
		return []

	return [
		dimension.label
		for dimension in get_checks_for_pl_and_bs_accounts()
		if dimension.company == company
		and dimension.mandatory_for_bs
		and doc.meta.has_field(dimension.fieldname)
		and not doc.get(dimension.fieldname)
	]


def _assert_advance_dimensions(doc, company: str | None) -> None:
	"""Throw an actionable error when DMS Settings lacks a mandatory dimension."""
	if not company:
		return

	missing = missing_mandatory_dimensions(doc, company)
	if missing:
		frappe.throw(
			_(
				"Set {0} for company {1} in DMS Settings → Company Defaults. "
				"ERPNext requires it as an accounting dimension on this company's Balance Sheet accounts."
			).format(frappe.bold(", ".join(missing)), frappe.bold(company))
		)


def _amended_as_map(names: list[str]) -> dict[str, str]:
	"""Map a cancelled Payment Entry name -> the amendment that replaced it."""
	if not names:
		return {}
	rows = frappe.get_all(
		"Payment Entry",
		filters={"amended_from": ["in", names]},
		fields=["name", "amended_from"],
	)
	return {row.amended_from: row.name for row in rows if row.amended_from}


_SI_DMS_FLAG_FIELDS = (
	"custom_dms_job_card",
	"custom_spare_parts",
	"custom_is_dms_transaction",
	"custom_missing_dms",
)


def _is_dms_payment_entry(pe) -> bool:
	"""True when the entry is flagged DMS or settles a DMS Sales Invoice."""
	if _has_field(DMS_FLAG_FIELD) and cint(pe.get(DMS_FLAG_FIELD)):
		return True

	# An operator note can only come from a DMS payment screen, so it marks the entry
	# as DMS activity even when the flag was missed (see _dms_payment_entry_condition).
	if _has_field(DMS_REMARKS_FIELD) and (pe.get(DMS_REMARKS_FIELD) or "").strip():
		return True

	si_meta = frappe.get_meta("Sales Invoice")
	check_fields = [fieldname for fieldname in _SI_DMS_FLAG_FIELDS if si_meta.has_field(fieldname)]
	if not check_fields:
		return False

	for ref in pe.get("references") or []:
		if ref.reference_doctype != "Sales Invoice" or not ref.reference_name:
			continue
		values = frappe.db.get_value("Sales Invoice", ref.reference_name, check_fields, as_dict=True)
		if not values:
			continue
		if (values.get("custom_dms_job_card") or "").strip():
			return True
		if any(
			cint(values.get(fieldname))
			for fieldname in check_fields
			if fieldname != "custom_dms_job_card"
		):
			return True
	return False


def _shape_row(row: dict, references: list[dict], links: dict, amend: dict | None = None) -> dict:
	invoice_refs = [r for r in references if r.get("reference_doctype") == "Sales Invoice"]
	docstatus = cint(row.get("docstatus"))
	is_advance = not references and row.get("payment_type") == ADVANCE_PAYMENT_TYPE
	dms_remarks = (row.get(DMS_REMARKS_FIELD) or "").strip() if DMS_REMARKS_FIELD in row else ""
	# The DMS flag is missing on receipts recorded before "Collect Payment" ticked it;
	# the operator note typed on that dialog still identifies them as DMS activity.
	is_dms = bool(cint(row.get(DMS_FLAG_FIELD))) if DMS_FLAG_FIELD in row else False
	if dms_remarks:
		is_dms = True

	return {
		"name": row.get("name"),
		"payment_type": row.get("payment_type"),
		"party": row.get("party"),
		"customer": row.get("party"),
		"party_name": row.get("party_name"),
		"customer_name": row.get("party_name"),
		"posting_date": row.get("posting_date"),
		"company": row.get("company"),
		"currency": row.get("paid_from_account_currency") or row.get("paid_to_account_currency"),
		"mode_of_payment": row.get("mode_of_payment"),
		"reference_no": row.get("reference_no"),
		"paid_amount": flt(row.get("paid_amount")),
		"unallocated_amount": flt(row.get("unallocated_amount")),
		"docstatus": docstatus,
		"status": _payment_entry_status(docstatus),
		"is_advance": bool(is_advance),
		"is_dms": is_dms,
		"job_card": links.get("job_card"),
		"service_estimate": links.get("service_estimate"),
		"remarks": row.get("remarks"),
		# Remarks typed on the DMS payment UI (advance / collect payment). Kept
		# separate from ERPNext's auto-generated `remarks` text.
		"dms_remarks": dms_remarks or None,
		"creation": row.get("creation"),
		"modified": row.get("modified"),
		"references": references,
		"invoice_reference": invoice_refs[0]["reference_name"] if invoice_refs else None,
		"reference_count": len(references),
		"amended_from": row.get("amended_from"),
		"amended_as": (amend or {}).get("amended_as"),
		"already_amended": bool((amend or {}).get("amended_as")),
	}


@frappe.whitelist()
def get_payment_entries(
	limit=30,
	offset=0,
	search=None,
	status=None,
	party=None,
	advance_only=0,
	include_total=0,
	posting_from=None,
	posting_to=None,
):
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "read", throw=True)

	dms_cond = _dms_payment_entry_condition()
	if dms_cond is None:
		return {"data": [], "total": 0} if cint(include_total) else []

	PE = DocType("Payment Entry")
	companies = get_dms_companies()
	posting_start = parse_filter_date(posting_from)
	posting_end = parse_filter_date(posting_to)
	if posting_start and posting_end and posting_start > posting_end:
		posting_start, posting_end = posting_end, posting_start

	select_fields = [PE[fieldname] for fieldname in _LIST_FIELDS]
	if _has_field(DMS_FLAG_FIELD):
		select_fields.append(PE[DMS_FLAG_FIELD])
	if _has_field(DMS_REMARKS_FIELD):
		select_fields.append(PE[DMS_REMARKS_FIELD])

	status = (status or "").strip() or None
	advance_only = cint(advance_only)
	party = (party or "").strip() or None

	def build_query(select, with_paging=True):
		query = frappe.qb.from_(PE).select(*select).where(dms_cond)

		if companies:
			query = query.where(PE.company.isin(companies))

		if status == "Draft":
			query = query.where(PE.docstatus == 0)
		elif status == "Submitted":
			query = query.where(PE.docstatus == 1)
		elif status == "Cancelled":
			query = query.where(PE.docstatus == 2)
		else:
			# Default list: hide cancelled entries.
			query = query.where(PE.docstatus != 2)

		if advance_only or status == "Advance":
			# Advances = unallocated receipts (no reference rows).
			query = query.where(PE.unallocated_amount > 0)
			query = query.where(PE.payment_type == ADVANCE_PAYMENT_TYPE)

		if party:
			query = query.where(PE.party == party)

		if search:
			like = f"%{search.strip()}%"
			query = query.where(
				(PE.name.like(like))
				| (PE.party_name.like(like))
				| (PE.party.like(like))
				| (PE.reference_no.like(like))
			)

		if posting_start:
			query = query.where(PE.posting_date >= posting_start)
		if posting_end:
			query = query.where(PE.posting_date <= posting_end)

		query = apply_branch_filter_to_qb(query, PE, doctype="Payment Entry")

		if with_paging:
			query = query.orderby(PE.creation, order=Order.desc).limit(int(limit)).offset(int(offset))

		return query

	rows = build_query(select_fields).run(as_dict=True)

	total = None
	if cint(include_total):
		count_rows = build_query([Count(PE.name)], with_paging=False).run()
		total = int(count_rows[0][0] or 0) if count_rows else 0

	if not rows:
		return {"data": [], "total": total or 0} if cint(include_total) else []

	names = [r.get("name") for r in rows if r.get("name")]
	refs_by_name = _references_for(names)
	links_by_name = {
		name: _source_links(name)
		for name in names
		if _has_field(JOB_CARD_FIELD) or _has_field(ESTIMATE_FIELD)
	}

	amend_map = _amended_as_map(names)

	data = [
		_shape_row(
			row,
			refs_by_name.get(row.get("name"), []),
			links_by_name.get(row.get("name"), {}),
			{"amended_as": amend_map.get(row.get("name"))},
		)
		for row in rows
	]

	# "Advances only" means truly unallocated receipts (no invoice references),
	# so drop partially-allocated overpayments that the SQL pre-filter kept.
	if advance_only or status == "Advance":
		data = [row for row in data if row["is_advance"]]
		if cint(include_total):
			return {"data": data, "total": len(data)}
		return data

	if cint(include_total):
		return {"data": data, "total": total or 0}
	return data


@frappe.whitelist()
def get_payment_entry_detail(name=None):
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "read", throw=True)

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Payment Entry name is required."))

	pe = frappe.get_doc("Payment Entry", name)
	pe.check_permission("read")

	fields = [
		"name",
		"payment_type",
		"party_type",
		"party",
		"party_name",
		"posting_date",
		"company",
		"paid_from_account_currency",
		"paid_to_account_currency",
		"mode_of_payment",
		"reference_no",
		"reference_date",
		"paid_from",
		"paid_to",
		"paid_amount",
		"received_amount",
		"total_allocated_amount",
		"unallocated_amount",
		"docstatus",
		"remarks",
		"amended_from",
		"creation",
		"modified",
	]
	if _has_field(DMS_REMARKS_FIELD):
		fields.append(DMS_REMARKS_FIELD)
	row = {fieldname: pe.get(fieldname) for fieldname in fields}
	if _has_field(DMS_FLAG_FIELD):
		row[DMS_FLAG_FIELD] = pe.get(DMS_FLAG_FIELD)

	references = [
		{
			"reference_doctype": ref.reference_doctype,
			"reference_name": ref.reference_name,
			"total_amount": flt(ref.total_amount),
			"outstanding_amount": flt(ref.outstanding_amount),
			"allocated_amount": flt(ref.allocated_amount),
		}
		for ref in pe.get("references") or []
	]

	detail = _shape_row(
		row,
		references,
		_source_links(name),
		{"amended_as": _amended_as_map([name]).get(name)},
	)
	detail.update(
		{
			"party_type": pe.party_type,
			"paid_from": pe.paid_from,
			"paid_to": pe.paid_to,
			"received_amount": flt(pe.received_amount),
			"total_allocated_amount": flt(pe.total_allocated_amount),
			"reference_date": pe.reference_date,
		}
	)
	return detail


def _advance_request(data) -> dict:
	"""Validate the shared advance payload and normalise its payment rows.

	A downpayment can be split across several modes (e.g. part cash, part bank).
	Each row becomes its own unallocated Payment Entry — the same way
	:func:`dms.api.invoices.collect_payment` splits a receipt across modes.
	"""
	import json

	if isinstance(data, str):
		data = json.loads(data) if data else {}
	data = data or {}

	customer = (data.get("customer") or data.get("party") or "").strip()
	company = (data.get("company") or "").strip()
	job_card = (data.get("job_card") or "").strip() or None
	service_estimate = (data.get("service_estimate") or "").strip() or None
	amended_from = (data.get("amended_from") or "").strip() or None

	if not customer:
		frappe.throw(_("Customer is required."))
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} was not found.").format(frappe.bold(customer)))
	if not company:
		frappe.throw(_("Company is required."))
	if not _has_field(DMS_FLAG_FIELD):
		frappe.throw(
			_(
				"Add the Custom Field {0} on Payment Entry (DMS fixtures) before recording advances."
			).format(frappe.bold(DMS_FLAG_FIELD))
		)

	if amended_from:
		_assert_amendable_advance(amended_from, customer)

	rows = _advance_payment_rows(data)
	if amended_from and len(rows) > 1:
		# Frappe derives the amended document name from `amended_from`, so one
		# amendment replaces exactly one entry — record extra modes separately.
		frappe.throw(
			_(
				"Amend one payment entry at a time. Record the other modes as new advance rows instead."
			)
		)

	return {
		"data": data,
		"customer": customer,
		"company": company,
		"job_card": job_card,
		"service_estimate": service_estimate,
		"amended_from": amended_from,
		"rows": rows,
	}


def _assert_amendable_advance(source: str, customer: str) -> None:
	"""Validate that ``source`` can be replaced by an amended advance."""
	if not frappe.db.exists("Payment Entry", source):
		frappe.throw(_("Payment Entry {0} was not found.").format(frappe.bold(source)))

	source_pe = frappe.get_doc("Payment Entry", source)
	source_pe.check_permission("read")
	if not _is_dms_payment_entry(source_pe):
		frappe.throw(_("This payment entry was not created from DMS."))
	if source_pe.docstatus != 2:
		frappe.throw(_("Only cancelled payment entries can be amended. Cancel it first."))
	if (source_pe.party or "").strip() != customer:
		frappe.throw(
			_("The amendment must stay on customer {0}.").format(frappe.bold(source_pe.party))
		)
	existing = frappe.db.exists("Payment Entry", {"amended_from": source})
	if existing:
		frappe.throw(_("This payment entry is already amended as {0}.").format(frappe.bold(existing)))


def _advance_payment_rows(data) -> list[dict]:
	"""Normalise ``payments`` rows (multi-mode) or the legacy single amount."""
	import json

	raw = data.get("payments")
	if isinstance(raw, str):
		raw = json.loads(raw) if raw else None

	rows: list[dict] = []
	if raw:
		if not isinstance(raw, (list, tuple)):
			frappe.throw(_("Payments must be a list of mode/amount rows."))
		for item in raw:
			if not isinstance(item, dict):
				continue
			amount = flt(item.get("amount"))
			if amount <= 0:
				frappe.throw(_("Each advance amount must be greater than zero."))
			rows.append(
				{
					"mode_of_payment": (item.get("mode_of_payment") or "").strip(),
					"amount": amount,
					"reference_no": (item.get("reference_no") or "").strip() or None,
					"remarks": (item.get("remarks") or "").strip() or None,
				}
			)
		if len(rows) > 1 and any(not row["mode_of_payment"] for row in rows):
			frappe.throw(_("Select a mode of payment for each advance row."))
	else:
		amount = flt(data.get("amount") or data.get("paid_amount"))
		if amount <= 0:
			frappe.throw(_("Advance amount must be greater than zero."))
		rows.append(
			{
				"mode_of_payment": (data.get("mode_of_payment") or "").strip(),
				"amount": amount,
				"reference_no": (data.get("reference_no") or "").strip() or None,
				"remarks": (data.get("remarks") or "").strip() or None,
			}
		)

	if not rows:
		frappe.throw(_("Add at least one advance amount."))
	return rows


def _make_advance_doc(request: dict, row: dict):
	"""Build one unallocated customer-advance Payment Entry for a payment row."""
	from erpnext.accounts.doctype.payment_entry.payment_entry import get_bank_cash_account

	data = request["data"]
	amount = flt(row.get("amount"))

	pe = frappe.new_doc("Payment Entry")
	pe.payment_type = ADVANCE_PAYMENT_TYPE
	pe.party_type = ADVANCE_PARTY_TYPE
	pe.party = request["customer"]
	pe.company = request["company"]
	pe.posting_date = data.get("posting_date") or today()
	pe.set_posting_time = 1
	pe.mode_of_payment = row.get("mode_of_payment") or None
	pe.paid_amount = amount
	# ERPNext validates received_amount before it auto-fills it from paid_amount,
	# so both must be set when building the document programmatically.
	pe.received_amount = amount

	if row.get("reference_no"):
		pe.reference_no = row["reference_no"]
	pe.reference_date = data.get("reference_date") or pe.posting_date

	operator_remarks = (row.get("remarks") or data.get("remarks") or "").strip()
	remarks = operator_remarks
	if not remarks:
		parts = [_("Customer advance from DMS")]
		if request["job_card"]:
			parts.append(_("Job Card {0}").format(request["job_card"]))
		if request["service_estimate"]:
			parts.append(_("Service Estimate {0}").format(request["service_estimate"]))
		remarks = " — ".join(parts)
	# This bench keeps user-entered Payment Entry remarks on `custom_remarks`;
	# ERPNext skips generating `remarks` once it is set.
	if _has_field("custom_remarks"):
		pe.custom_remarks = remarks
	pe.remarks = remarks
	# Mirror the operator's note onto the dedicated DMS remarks field so every
	# payment screen (payment detail sheet, invoice detail sheet) shows it
	# verbatim, separate from ERPNext's generated `remarks` text.
	if operator_remarks and _has_field(DMS_REMARKS_FIELD):
		pe.set(DMS_REMARKS_FIELD, operator_remarks)

	# The party side (paid_from on a Receive) is resolved by ERPNext from the
	# customer's receivable / advance account; only the bank/cash side is needed.
	bank = get_bank_cash_account(pe, None)
	account = (bank or {}).get("account")
	if not account:
		frappe.throw(
			_(
				"No Bank/Cash account is configured for mode of payment {0}. Set it on the Company or Mode of Payment."
			).format(frappe.bold(pe.mode_of_payment or _("(default)")))
		)
	pe.paid_to = account

	pe.set(DMS_FLAG_FIELD, 1)
	if request["job_card"] and _has_field(JOB_CARD_FIELD):
		pe.set(JOB_CARD_FIELD, request["job_card"])
	if request["service_estimate"] and _has_field(ESTIMATE_FIELD):
		pe.set(ESTIMATE_FIELD, request["service_estimate"])
	if request.get("amended_from"):
		# Replaces a cancelled entry with the edited amount / mode(s).
		pe.amended_from = request["amended_from"]

	# Accounting dimensions (Branch / Cost Center / Project / …) come from
	# DMS Settings → Company Defaults; ERPNext requires them for accounts with a
	# mandatory dimension (e.g. Branch on Debtors) and an advance has no
	# reference document to inherit them from.
	apply_dms_company_dimensions(pe, request["company"], overrides=data)
	_assert_advance_dimensions(pe, request["company"])

	return pe


def _build_advance_payments(data) -> list:
	"""Validate the payload and return unsaved docs — one Payment Entry per mode.

	Exposed separately from :func:`create_advance_payment` so the document
	construction can be verified without writing to the database.
	"""
	request = _advance_request(data)
	return [_make_advance_doc(request, row) for row in request["rows"]]


def _build_advance_payment(data):
	"""Single-row convenience wrapper around :func:`_build_advance_payments`."""
	return _build_advance_payments(data)[0]


@frappe.whitelist()
def create_advance_payment(data):
	"""Create and submit standalone customer advance(s) / downpayment(s).

	``data`` keys: ``customer`` (required), ``company`` (required), plus either

	* ``payments`` — a list of ``{mode_of_payment, amount, reference_no?}`` rows, so
	  a downpayment can be split across modes (e.g. part cash, part bank), or
	* the single-row ``amount`` / ``mode_of_payment`` / ``reference_no``.

	Shared header keys: ``posting_date``, ``reference_date``, ``remarks``,
	``job_card``, ``service_estimate``. Each row is submitted as its own
	unallocated Payment Entry.
	"""
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "create", throw=True)

	docs = _build_advance_payments(data)

	created: list[str] = []
	paid_total = 0.0
	unallocated_total = 0.0
	for pe in docs:
		pe.insert()
		pe.submit()
		created.append(pe.name)
		paid_total += flt(pe.paid_amount)
		unallocated_total += flt(pe.unallocated_amount)

	first = docs[0]
	return {
		"name": first.name,
		"payment_entry": first.name,
		"payment_entries": created,
		"count": len(created),
		"docstatus": first.docstatus,
		"paid_amount": paid_total,
		"unallocated_amount": unallocated_total,
		"customer": first.party,
		"customer_name": first.party_name,
		"amended_from": first.amended_from,
	}



@frappe.whitelist()
def get_customer_advances(customer=None, company=None, limit=100):
	"""Open (unallocated) customer advances — powers the Job Card / Estimate payment section."""
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "read", throw=True)

	customer = (customer or "").strip()
	if not customer:
		return {"customer": None, "customer_name": None, "total_available": 0, "advances": []}

	filters: dict = {
		"party_type": ADVANCE_PARTY_TYPE,
		"party": customer,
		"payment_type": ADVANCE_PAYMENT_TYPE,
		"docstatus": 1,
		"unallocated_amount": [">", 0],
	}
	company = (company or "").strip()
	if company:
		filters["company"] = company

	# `frappe.get_all` rejects unknown columns, so only ask for the custom fields
	# this site actually has.
	list_fields = list(_LIST_FIELDS)
	if _has_field(DMS_REMARKS_FIELD):
		list_fields.append(DMS_REMARKS_FIELD)

	rows = frappe.get_all(
		"Payment Entry",
		filters=filters,
		fields=list_fields,
		order_by="posting_date desc, creation desc",
		limit=max(1, min(cint(limit) or 100, 500)),
	)

	names = [r.name for r in rows if r.get("name")]
	refs_by_name = _references_for(names)
	links_by_name = {
		name: _source_links(name)
		for name in names
		if _has_field(JOB_CARD_FIELD) or _has_field(ESTIMATE_FIELD)
	}
	# Only truly unallocated receipts count as advances — an overpayment that is
	# partly allocated to an invoice is a receipt, not a downpayment.
	unallocated_rows = [row for row in rows if not refs_by_name.get(row.get("name"))]
	advances = [
		_shape_row(row, [], links_by_name.get(row.get("name"), {}))
		for row in unallocated_rows
	]

	customer_name = next(
		(row.get("party_name") for row in rows if row.get("party_name")), None
	)
	if not customer_name and frappe.db.exists("Customer", customer):
		customer_name = frappe.db.get_value("Customer", customer, "customer_name") or customer

	return {
		"customer": customer,
		"customer_name": customer_name,
		"total_available": sum(flt(row.unallocated_amount) for row in unallocated_rows),
		"advances": advances,
	}


@frappe.whitelist()
def cancel_payment_entry(name=None):
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "cancel", throw=True)

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Payment Entry name is required."))

	pe = frappe.get_doc("Payment Entry", name)
	pe.check_permission("cancel")
	if pe.docstatus != 1:
		frappe.throw(_("Only submitted Payment Entries can be cancelled."))

	pe.cancel()
	return {"name": pe.name, "docstatus": pe.docstatus}


@frappe.whitelist()
def delete_draft_payment_entry(name=None):
	_ensure_erpnext()
	frappe.has_permission("Payment Entry", "delete", throw=True)

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Payment Entry name is required."))

	pe = frappe.get_doc("Payment Entry", name)
	pe.check_permission("delete")
	if pe.docstatus != 0:
		frappe.throw(_("Only draft Payment Entries can be deleted."))

	frappe.delete_doc("Payment Entry", name, force=1)
	return {"deleted": name}



@frappe.whitelist()
def amend_payment_entry(name=None, submit=1):
	"""Amend a cancelled DMS Payment Entry (Desk-style copy with ``amended_from``).

	The DMS UI has no draft editor for Payment Entry, so the copy is submitted
	right away; pass ``submit=0`` to get an editable draft instead.
	"""
	_ensure_erpnext()
	from frappe.model.document import copy_doc

	frappe.has_permission("Payment Entry", "create", throw=True)

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Payment Entry name is required."))

	pe = frappe.get_doc("Payment Entry", name)
	pe.check_permission("read")
	if not _is_dms_payment_entry(pe):
		frappe.throw(_("This payment entry was not created from DMS."))
	if pe.docstatus != 2:
		frappe.throw(_("Only cancelled payment entries can be amended. Cancel it first."))

	existing = frappe.db.exists("Payment Entry", {"amended_from": name})
	if existing:
		frappe.throw(
			_("This payment entry is already amended as {0}.").format(frappe.bold(existing))
		)

	# Mirror Desk amend: copy the cancelled document (including no_copy fields).
	amended = copy_doc(pe, ignore_no_copy=True)
	amended.amended_from = name
	amended.docstatus = 0
	if amended.meta.has_field("amendment_date"):
		amended.amendment_date = today()

	# A Payment Entry workflow may exist (e.g. "Post Dated Cheque"); the copy must
	# restart at its initial state or Frappe blocks the insert.
	_reset_workflow_to_initial_state(amended)

	# Keep the cancelled entry's dimensions when present, otherwise take them
	# from DMS Settings → Company Defaults.
	apply_dms_company_dimensions(amended, amended.company, overrides={})
	_assert_advance_dimensions(amended, amended.company)

	amended.insert()
	if cint(submit):
		amended.submit()
	frappe.db.commit()

	return {
		"name": amended.name,
		"docstatus": amended.docstatus,
		"amended_from": name,
		"paid_amount": flt(amended.paid_amount),
		"unallocated_amount": flt(amended.unallocated_amount),
	}

