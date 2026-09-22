import frappe
from frappe import _
from frappe.query_builder import DocType, Order
from frappe.query_builder.functions import Count
from frappe.utils import cint, flt, getdate, today

from dms.api.utils import (
	add_company_filter,
	get_dms_companies,
	parse_filter_date,
	resolve_dms_customer,
)
from dms.dealer_management_system.utils.branch_permissions import apply_branch_filter_to_qb


def _ensure_erpnext():
	try:
		import erpnext  # noqa: F401
	except ImportError:
		frappe.throw(_("ERPNext must be installed for Sales Invoice and Payment Entry."))


def _is_dms_sales_invoice(si) -> bool:
	meta = frappe.get_meta("Sales Invoice")
	if meta.has_field("custom_dms_job_card") and si.get("custom_dms_job_card"):
		return True
	if meta.has_field("custom_spare_parts") and cint(si.get("custom_spare_parts")):
		return True
	if meta.has_field("custom_is_dms_transaction") and cint(si.get("custom_is_dms_transaction")):
		return True
	if meta.has_field("custom_missing_dms") and cint(si.get("custom_missing_dms")):
		return True
	return False


def _has_manual_tax_rows(si) -> bool:
	"""True when the invoice has tax rows other than the TCS/withholding line."""
	for row in si.get("taxes") or []:
		if not cint(row.get("is_tax_withholding_account")):
			return True
	return False


def _dms_sales_invoice_condition():
	"""Invoices linked to a DMS job card and/or standalone DMS spare-parts invoices."""
	si_meta = frappe.get_meta("Sales Invoice")
	has_jc = si_meta.has_field("custom_dms_job_card")
	has_spare = si_meta.has_field("custom_spare_parts")
	has_ui = si_meta.has_field("custom_is_dms_transaction")
	has_missing = si_meta.has_field("custom_missing_dms")
	if not has_jc and not has_spare and not has_ui and not has_missing:
		return None

	SI = DocType("Sales Invoice")
	cond = None
	if has_jc:
		cond = (SI.custom_dms_job_card != "") & (SI.custom_dms_job_card.isnotnull())
	if has_spare:
		spare_cond = SI.custom_spare_parts == 1
		cond = spare_cond if cond is None else (cond | spare_cond)
	if has_ui:
		ui_cond = SI.custom_is_dms_transaction == 1
		cond = ui_cond if cond is None else (cond | ui_cond)
	if has_missing:
		missing_cond = SI.custom_missing_dms == 1
		cond = missing_cond if cond is None else (cond | missing_cond)
	return cond


def _returned_qty_map(sales_invoice: str) -> dict:
	"""Already-returned qty per original Sales Invoice Item row (submitted credit notes)."""
	if not sales_invoice:
		return {}

	rows = frappe.db.sql(
		"""
		select sii.sales_invoice_item as source_row, sum(abs(sii.qty)) as returned_qty
		from `tabSales Invoice Item` sii
		inner join `tabSales Invoice` si on si.name = sii.parent
		where si.is_return = 1
		  and si.docstatus = 1
		  and si.return_against = %s
		  and ifnull(sii.sales_invoice_item, '') != ''
		group by sii.sales_invoice_item
		""",
		sales_invoice,
		as_dict=True,
	)
	return {row.source_row: flt(row.returned_qty) for row in rows}


def _credit_notes_for_invoice(sales_invoice: str) -> list:
	"""Credit notes (Sales Invoice returns) raised against an invoice, newest first."""
	return frappe.get_all(
		"Sales Invoice",
		filters={"return_against": sales_invoice, "is_return": 1, "docstatus": ["<", 2]},
		fields=[
			"name",
			"posting_date",
			"grand_total",
			"outstanding_amount",
			"status",
			"docstatus",
			"currency",
			"creation",
		],
		order_by="creation desc",
	)


@frappe.whitelist()
def get_invoices(
	limit=50,
	offset=0,
	status=None,
	search=None,
	include_total=0,
	posting_from=None,
	posting_to=None,
):
	_ensure_erpnext()

	dms_cond = _dms_sales_invoice_condition()
	if dms_cond is None:
		return {"data": [], "total": 0} if cint(include_total) else []

	SI = DocType("Sales Invoice")
	companies = get_dms_companies()
	posting_start = parse_filter_date(posting_from)
	posting_end = parse_filter_date(posting_to)
	if posting_start and posting_end and posting_start > posting_end:
		posting_start, posting_end = posting_end, posting_start

	fields = [
		SI.name,
		SI.customer,
		SI.customer_name,
		SI.posting_date,
		SI.due_date,
		SI.grand_total,
		SI.net_total,
		SI.total_taxes_and_charges,
		SI.outstanding_amount,
		SI.status,
		SI.currency,
		SI.docstatus,
		SI.is_return,
		SI.return_against,
		SI.creation,
		SI.modified,
	]

	def build_query(select_fields, with_paging=True):
		query = frappe.qb.from_(SI).select(*select_fields).where(dms_cond)

		if companies:
			query = query.where(SI.company.isin(companies))

		if status:
			query = query.where(SI.status == status)
		else:
			# Default list: hide cancelled so they stay out of the active queue
			query = query.where((SI.status != "Cancelled") & (SI.docstatus != 2))

		if search:
			like = f"%{search}%"
			query = query.where((SI.name.like(like)) | (SI.customer_name.like(like)))

		if posting_start:
			query = query.where(SI.posting_date >= posting_start)

		if posting_end:
			query = query.where(SI.posting_date <= posting_end)

		query = apply_branch_filter_to_qb(query, SI, doctype="Sales Invoice")

		if with_paging:
			query = query.orderby(SI.creation, order=Order.desc).limit(int(limit)).offset(int(offset))

		return query

	rows = build_query(fields).run(as_dict=True)

	total = None
	if cint(include_total):
		count_rows = build_query([Count(SI.name)], with_paging=False).run()
		total = int(count_rows[0][0] or 0) if count_rows else 0

	if not rows:
		return {"data": [], "total": total or 0} if cint(include_total) else []

	names = [r.name for r in rows if r.get("name")]
	amended_as_map: dict[str, str] = {}
	if names:
		for link in frappe.get_all(
			"Sales Invoice",
			filters={"amended_from": ["in", names]},
			fields=["name", "amended_from"],
		):
			# One amendment per cancelled invoice (Desk rule); keep first if duplicates.
			amended_as_map.setdefault(link.amended_from, link.name)

	for row in rows:
		amended_as = amended_as_map.get(row.name)
		row["already_amended"] = 1 if amended_as else 0
		row["amended_as"] = amended_as

	if cint(include_total):
		return {"data": rows, "total": total or 0}
	return rows


@frappe.whitelist()
def get_invoice_preview_from_job_card(
	job_card,
	warranty_application_type=None,
	discount_amount=None,
	labour_discount=None,
	parts_discount=None,
	rate_overrides=None,
	exclude_rows=None,
	qty_overrides=None,
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
		labour_discount=labour_discount,
		parts_discount=parts_discount,
		rate_overrides=rate_overrides,
		exclude_rows=exclude_rows,
		qty_overrides=qty_overrides,
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
		customer=resolve_dms_customer(data.get("customer")),
		company=data.get("company"),
		labour_lines=data.get("labour") or data.get("labour_lines") or [],
		parts_lines=data.get("parts") or data.get("parts_lines") or [],
		warehouse=data.get("warehouse"),
		currency=data.get("currency"),
		due_date=data.get("due_date"),
		posting_date=data.get("posting_date"),
		remarks=data.get("remarks"),
		submit=cint(data.get("submit", 1)),
		labour_discount=data.get("labour_discount"),
		parts_discount=data.get("parts_discount"),
		is_dms_invoice=cint(data.get("is_dms_invoice", 0)),
		vehicle_vin=data.get("vehicle_vin"),
		vehicle_brand=data.get("vehicle_brand"),
		vehicle_model=data.get("vehicle_model"),
		current_odometer=data.get("current_odometer"),
		apply_taxes=bool(cint(data.get("apply_taxes", 0))),
		apply_tax_withholding=(
			cint(data.get("apply_tax_withholding")) if "apply_tax_withholding" in data else None
		),
	)

	si = frappe.get_doc("Sales Invoice", name)
	return {
		"name": si.name,
		"docstatus": si.docstatus,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"grand_total": flt(si.grand_total),
	}


def _linked_payments_for_invoice(invoice_name: str) -> list[dict]:
	"""Payment Entries that settle this invoice, with their DMS remarks.

	Powers the "Payments" block on the invoice detail sheet (job-card and invoice
	screens): each receipt shows its mode, amount and the note typed on the DMS
	payment dialog (``Payment Entry.custom_dms_remarks``).
	"""
	if not frappe.db.exists("DocType", "Payment Entry Reference"):
		return []

	refs = frappe.get_all(
		"Payment Entry Reference",
		filters={"reference_doctype": "Sales Invoice", "reference_name": invoice_name},
		fields=["parent", "allocated_amount"],
	)
	allocated_by_parent: dict[str, float] = {}
	for ref in refs:
		if not ref.parent:
			continue
		allocated_by_parent[ref.parent] = flt(allocated_by_parent.get(ref.parent)) + flt(
			ref.allocated_amount
		)

	names = list(allocated_by_parent)
	if not names:
		return []

	meta = frappe.get_meta("Payment Entry")
	fields = [
		"name",
		"posting_date",
		"mode_of_payment",
		"reference_no",
		"paid_amount",
		"unallocated_amount",
		"docstatus",
		"remarks",
		"creation",
	]
	if meta.has_field("custom_dms_remarks"):
		fields.append("custom_dms_remarks")
	if meta.has_field("custom_dms_job_card"):
		fields.append("custom_dms_job_card")

	rows = frappe.get_all(
		"Payment Entry",
		filters={"name": ["in", names], "docstatus": ["!=", 2]},
		fields=fields,
		order_by="posting_date desc, creation desc",
	)

	out: list[dict] = []
	for row in rows:
		dms_remarks = (
			(row.get("custom_dms_remarks") or "").strip()
			if meta.has_field("custom_dms_remarks")
			else ""
		)
		out.append(
			{
				"name": row.name,
				"posting_date": row.posting_date,
				"mode_of_payment": row.mode_of_payment,
				"reference_no": row.reference_no,
				"paid_amount": flt(row.paid_amount),
				"allocated_amount": flt(allocated_by_parent.get(row.name)),
				"unallocated_amount": flt(row.unallocated_amount),
				"docstatus": cint(row.docstatus),
				"status": "Submitted" if cint(row.docstatus) == 1 else "Draft",
				"dms_remarks": dms_remarks or None,
				"remarks": row.remarks,
				"job_card": row.get("custom_dms_job_card")
				if meta.has_field("custom_dms_job_card")
				else None,
			}
		)
	return out


@frappe.whitelist()
def get_sales_invoice_detail(sales_invoice):
	_ensure_erpnext()

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	frappe.has_permission("Sales Invoice", "read", name, throw=True)

	si = frappe.get_doc("Sales Invoice", name)
	is_return = cint(si.get("is_return"))
	returned_by_row = _returned_qty_map(name) if not is_return else {}
	items = []
	for row in si.get("items") or []:
		returned_qty = flt(returned_by_row.get(row.name))
		item = {
			"name": row.name,
			"idx": row.idx,
			"item_code": row.item_code,
			"item_name": row.item_name,
			"description": row.description or row.item_name,
			"qty": flt(row.qty),
			"rate": flt(row.rate),
			"amount": flt(row.amount),
			"returned_qty": returned_qty,
			"returnable_qty": max(flt(row.qty) - returned_qty, 0.0),
		}
		if frappe.get_meta("Sales Invoice Item").has_field("custom_dms_discount"):
			item["dms_discount"] = flt(row.get("custom_dms_discount"))
		items.append(item)

	result = {
		"name": si.name,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"company": si.company,
		"posting_date": si.posting_date,
		"due_date": si.due_date,
		"net_total": flt(si.net_total),
		"total_taxes_and_charges": flt(si.total_taxes_and_charges),
		"grand_total": flt(si.grand_total),
		"outstanding_amount": flt(si.outstanding_amount),
		"status": si.status,
		"currency": si.currency,
		"docstatus": si.docstatus,
		"remarks": si.remarks,
		"items": items,
		"amended_from": si.get("amended_from"),
		"additional_discount_percentage": flt(si.get("additional_discount_percentage")),
		"discount_amount": flt(si.get("discount_amount")),
		"apply_discount_on": si.get("apply_discount_on") or "Net Total",
		"apply_taxes": 1 if _has_manual_tax_rows(si) else 0,
		"apply_tax_withholding": 1 if cint(si.get("apply_tds")) else 0,
		"is_return": is_return,
		"return_against": si.get("return_against"),
	}
	amended_as = frappe.db.exists("Sales Invoice", {"amended_from": si.name})
	result["already_amended"] = 1 if amended_as else 0
	result["amended_as"] = amended_as or None
	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		result["dms_job_card"] = si.get("custom_dms_job_card")
		job_card = (si.get("custom_dms_job_card") or "").strip()
		if (
			job_card
			and frappe.db.exists("DMS Job Card", job_card)
			and frappe.get_meta("DMS Job Card").has_field("remark")
		):
			result["job_card_remark"] = frappe.db.get_value("DMS Job Card", job_card, "remark") or ""
	if frappe.get_meta("Sales Invoice").has_field("custom_spare_parts"):
		result["custom_spare_parts"] = cint(si.get("custom_spare_parts"))
	if frappe.get_meta("Sales Invoice").has_field("custom_is_dms_transaction"):
		result["is_dms_transaction"] = cint(si.get("custom_is_dms_transaction"))
	if frappe.get_meta("Sales Invoice").has_field("custom_missing_dms"):
		result["missing_dms"] = cint(si.get("custom_missing_dms"))
	if not is_return:
		result["credit_notes"] = _credit_notes_for_invoice(name)
	# Receipts recorded against this invoice (DMS collect-payment / reconciliation),
	# each carrying the operator note from the payment dialog.
	result["payments"] = _linked_payments_for_invoice(name)
	result["payment_total"] = sum(flt(row["allocated_amount"]) for row in result["payments"])
	return result


@frappe.whitelist()
def get_credit_note_preview(sales_invoice):
	"""Lines (with already-returned qty) needed to build a credit note for an invoice."""
	_ensure_erpnext()

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	frappe.has_permission("Sales Invoice", "read", name, throw=True)

	si = frappe.get_doc("Sales Invoice", name)
	if cint(si.get("is_return")):
		frappe.throw(_("A credit note cannot be raised against another credit note."))
	if si.docstatus != 1:
		frappe.throw(_("Only submitted invoices can be credited."))

	returned_by_row = _returned_qty_map(name)
	lines = []
	has_returnable = False
	for row in si.get("items") or []:
		returned_qty = flt(returned_by_row.get(row.name))
		returnable_qty = max(flt(row.qty) - returned_qty, 0.0)
		if returnable_qty > 0:
			has_returnable = True
		lines.append(
			{
				"name": row.name,
				"idx": row.idx,
				"item_code": row.item_code,
				"item_name": row.item_name,
				"description": row.description or row.item_name,
				"qty": flt(row.qty),
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"returned_qty": returned_qty,
				"returnable_qty": returnable_qty,
			}
		)

	return {
		"name": si.name,
		"customer": si.customer,
		"customer_name": si.customer_name,
		"company": si.company,
		"currency": si.currency,
		"posting_date": si.posting_date,
		"net_total": flt(si.net_total),
		"grand_total": flt(si.grand_total),
		"total_taxes_and_charges": flt(si.total_taxes_and_charges),
		"update_stock": cint(si.update_stock),
		"has_returnable_lines": has_returnable,
		"credit_notes": _credit_notes_for_invoice(name),
		"lines": lines,
	}


@frappe.whitelist()
def create_credit_note(data):
	"""Create a Credit Note (Sales Invoice return) against a submitted DMS invoice.

	Lines can be partially credited (qty), re-rated (rate), or dropped entirely
	(include = 0) before the return is created. The return reverses taxes and
	inventory the same way ERPNext's own Credit Note does.
	"""
	_ensure_erpnext()

	if isinstance(data, str):
		import json

		data = json.loads(data)

	name = (data.get("sales_invoice") or data.get("name") or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	frappe.has_permission("Sales Invoice", "create", throw=True)

	si = frappe.get_doc("Sales Invoice", name)
	si.check_permission("read")

	if not _is_dms_sales_invoice(si):
		frappe.throw(_("This invoice was not created from DMS."))
	if cint(si.get("is_return")):
		frappe.throw(_("A credit note cannot be raised against another credit note."))
	if si.docstatus != 1:
		frappe.throw(_("Only submitted invoices can be credited."))

	posting_date = getdate(data.get("posting_date") or today())
	if posting_date < getdate(si.posting_date):
		frappe.throw(
			_("Credit note date cannot be before the invoice date {0}.").format(
				frappe.bold(si.posting_date)
			)
		)

	from erpnext.accounts.doctype.sales_invoice.sales_invoice import make_sales_return

	credit_note = make_sales_return(name)

	# Overrides are keyed by the original Sales Invoice Item row name, which
	# make_sales_return copies onto each return row as `sales_invoice_item`.
	overrides = {}
	for line in data.get("lines") or []:
		key = (line.get("name") or line.get("sales_invoice_item") or "").strip()
		if key:
			overrides[key] = line

	for row in list(credit_note.get("items") or []):
		override = overrides.get(row.get("sales_invoice_item"))
		if override is None:
			continue

		include = override.get("include")
		if include is not None and not cint(include):
			credit_note.remove(row)
			continue

		if override.get("qty") is not None:
			qty = abs(flt(override.get("qty")))
			if qty <= 0:
				credit_note.remove(row)
				continue
			# make_sales_return already caps the row to the returnable qty.
			qty = min(qty, abs(flt(row.qty)))
			row.qty = -1 * qty
			if row.meta.has_field("stock_qty") and flt(row.get("conversion_factor")):
				row.stock_qty = flt(row.qty) * flt(row.get("conversion_factor"))

		if override.get("rate") is not None:
			row.rate = max(abs(flt(override.get("rate"))), 0.0)
			row.price_list_rate = row.rate
			row.discount_percentage = 0
			row.discount_amount = 0

	if not (credit_note.get("items") or []):
		frappe.throw(_("Select at least one line to credit."))

	credit_note.posting_date = posting_date
	if credit_note.meta.has_field("set_posting_time"):
		credit_note.set_posting_time = 1
	if data.get("remarks") or data.get("reason"):
		credit_note.remarks = (data.get("remarks") or data.get("reason") or "").strip()

	if "apply_taxes" in data:
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			_apply_sales_invoice_tax_choice,
		)

		_apply_sales_invoice_tax_choice(credit_note, bool(cint(data.get("apply_taxes"))))

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		disable_sales_invoice_round_off,
	)

	disable_sales_invoice_round_off(credit_note)
	if credit_note.meta.has_field("custom_is_dms_transaction"):
		credit_note.custom_is_dms_transaction = 1

	# make_sales_return copies custom fields from the source invoice. DMS sites keep
	# a unique custom_invoice_no, which would then collide with the original invoice,
	# so allocate a fresh number for the credit note.
	if credit_note.meta.has_field("custom_invoice_no"):
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			_generate_invoice_no,
		)

		credit_note.custom_invoice_no = _generate_invoice_no(credit_note.company)

	_reset_sales_invoice_workflow_to_draft(credit_note)

	credit_note.run_method("calculate_taxes_and_totals")
	credit_note.insert()

	if cint(data.get("submit", 1)):
		_submit_draft_sales_invoice(credit_note)
		credit_note.reload()

	frappe.db.commit()

	result = get_sales_invoice_detail(credit_note.name)
	result["credit_note"] = {
		"name": credit_note.name,
		"return_against": credit_note.return_against,
		"grand_total": flt(credit_note.grand_total),
		"docstatus": credit_note.docstatus,
	}
	result["credit_note_of"] = name
	return result


@frappe.whitelist()
def cancel_sales_invoice(sales_invoice):
	"""Cancel a submitted DMS Sales Invoice (same as Desk cancel)."""
	_ensure_erpnext()

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	si = frappe.get_doc("Sales Invoice", name)
	if not _is_dms_sales_invoice(si):
		frappe.throw(_("This invoice was not created from DMS."))

	if si.docstatus != 1:
		frappe.throw(_("Only submitted invoices can be cancelled."))

	si.check_permission("cancel")
	si.cancel()

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		clear_job_card_invoice_link_on_cancel,
	)

	clear_job_card_invoice_link_on_cancel(
		si.name,
		si.get("custom_dms_job_card") if hasattr(si, "custom_dms_job_card") else None,
	)

	frappe.db.commit()
	si.reload()

	return {
		"name": si.name,
		"docstatus": si.docstatus,
		"status": si.status,
		"outstanding_amount": flt(si.outstanding_amount),
	}


@frappe.whitelist()
def delete_draft_sales_invoice(sales_invoice):
	"""Permanently delete a draft DMS Sales Invoice (Desk-style delete)."""
	_ensure_erpnext()

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	si = frappe.get_doc("Sales Invoice", name)
	if not _is_dms_sales_invoice(si):
		frappe.throw(_("This invoice was not created from DMS."))
	if si.docstatus != 0:
		frappe.throw(_("Only draft invoices can be deleted. Cancel submitted invoices instead."))

	si.check_permission("delete")

	job_card = (
		si.get("custom_dms_job_card")
		if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card")
		else None
	)

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		clear_job_card_invoice_link_on_cancel,
	)

	clear_job_card_invoice_link_on_cancel(si.name, job_card)

	# Free service estimates that pointed at this draft diagnostic invoice.
	if frappe.db.exists("DocType", "DMS Service Estimate"):
		for est_name in frappe.get_all(
			"DMS Service Estimate",
			filters={"diagnostic_invoice": name},
			pluck="name",
		):
			frappe.db.set_value(
				"DMS Service Estimate",
				est_name,
				"diagnostic_invoice",
				None,
				update_modified=True,
			)

	frappe.delete_doc("Sales Invoice", name, force=1)
	frappe.db.commit()
	return {"deleted": name}


@frappe.whitelist()
def amend_sales_invoice(sales_invoice):
	"""
	Amend a cancelled DMS Sales Invoice (same idea as Desk Amend).

	Creates a new *draft* copy with amended_from set so the UI can edit
	qty/rates/discounts before submit.
	"""
	_ensure_erpnext()

	from frappe.model.document import copy_doc
	from frappe.utils import nowdate

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	si = frappe.get_doc("Sales Invoice", name)
	if not _is_dms_sales_invoice(si):
		frappe.throw(_("This invoice was not created from DMS."))

	if si.docstatus != 2:
		frappe.throw(_("Only cancelled invoices can be amended. Cancel the invoice first."))

	existing = frappe.db.exists("Sales Invoice", {"amended_from": name})
	if existing:
		frappe.throw(
			_("This invoice is already amended as {0}.").format(frappe.bold(existing))
		)

	frappe.has_permission("Sales Invoice", "create", throw=True)
	si.check_permission("read")

	# Mirror Desk amend: copy cancelled doc (including no_copy fields), then set amended_from.
	amended = copy_doc(si, ignore_no_copy=True)
	amended.amended_from = name
	if amended.meta.has_field("amendment_date"):
		amended.amendment_date = nowdate()

	# Always start as an editable draft.
	amended.docstatus = 0
	if amended.meta.has_field("status"):
		amended.status = "Draft"

	# Cancelled SI often still carries workflow_state=Submitted; reset to the
	# workflow's draft state so insert does not try Draft → Submitted.
	_reset_sales_invoice_workflow_to_draft(amended)

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		_apply_dms_selling_price_list_to_sales_invoice,
		disable_sales_invoice_round_off,
	)

	disable_sales_invoice_round_off(amended)
	# Prefer DMS Settings price list over whatever was on the cancelled invoice.
	_apply_dms_selling_price_list_to_sales_invoice(amended)

	# Clear payment / return leftovers that should not carry into the amendment draft.
	for fieldname in (
		"outstanding_amount",
		"paid_amount",
		"base_paid_amount",
		"write_off_amount",
		"base_write_off_amount",
		"loyalty_points",
		"loyalty_amount",
		"is_consolidated",
	):
		if amended.meta.has_field(fieldname):
			amended.set(fieldname, 0 if fieldname.endswith("amount") or fieldname.endswith("points") else amended.get(fieldname))

	if amended.meta.has_field("is_return"):
		# Keep return flag only if the cancelled doc was a return.
		pass

	# Drop advances / payment schedule rows that reference the cancelled invoice.
	for table in ("advances", "payments", "payment_schedule"):
		if amended.meta.has_field(table):
			amended.set(table, [])

	if hasattr(amended, "ignore_pricing_rule"):
		amended.ignore_pricing_rule = 1

	amended.insert()
	frappe.db.commit()

	return get_sales_invoice_detail(amended.name)


def _reset_sales_invoice_workflow_to_draft(doc) -> None:
	"""Force amended / catch-up drafts onto the workflow's initial Draft state."""
	try:
		from frappe.model.workflow import get_workflow_name, get_workflow
	except Exception:
		return

	if not get_workflow_name(doc.doctype):
		return

	workflow = get_workflow(doc.doctype)
	field = workflow.workflow_state_field
	if not field or not doc.meta.has_field(field):
		return

	draft_state = None
	for state in workflow.states or []:
		if cint(state.doc_status) == 0:
			draft_state = state.state
			break
	if not draft_state and workflow.states:
		draft_state = workflow.states[0].state

	if draft_state:
		doc.set(field, draft_state)


def _submit_draft_sales_invoice(si) -> None:
	"""Submit draft SI, preferring workflow Apply Action when a workflow is active."""
	si.check_permission("submit")

	try:
		from frappe.model.workflow import apply_workflow, get_transitions, get_workflow, get_workflow_name
	except Exception:
		si.submit()
		return

	if not get_workflow_name(si.doctype):
		si.submit()
		return

	workflow = get_workflow(si.doctype)
	submitted_states = {
		s.state for s in (workflow.states or []) if cint(s.doc_status) == 1
	}
	transitions = get_transitions(si) or []

	# Prefer an action literally named Submit, else any transition into a submitted state.
	chosen = None
	for transition in transitions:
		action = (transition.get("action") or "").strip()
		if action.lower() == "submit" and transition.get("next_state") in submitted_states:
			chosen = action
			break
	if not chosen:
		for transition in transitions:
			if transition.get("next_state") in submitted_states:
				chosen = (transition.get("action") or "").strip()
				if chosen:
					break

	if chosen:
		apply_workflow(si, chosen)
		return

	si.submit()


@frappe.whitelist()
def update_draft_sales_invoice(data):
	"""
	Update a draft DMS Sales Invoice (typically after Amend): line qty/rate,
	invoice-level discount, remarks/dates, then optionally submit.
	"""
	_ensure_erpnext()

	if isinstance(data, str):
		import json

		data = json.loads(data)

	name = (data.get("name") or data.get("sales_invoice") or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	si = frappe.get_doc("Sales Invoice", name)
	if not _is_dms_sales_invoice(si):
		frappe.throw(_("This invoice was not created from DMS."))
	if si.docstatus != 0:
		frappe.throw(_("Only draft invoices can be updated."))

	si.check_permission("write")

	if "remarks" in data:
		si.remarks = data.get("remarks") or ""
	if data.get("posting_date"):
		si.posting_date = getdate(data.get("posting_date"))
		si.set_posting_time = 1
	if data.get("due_date"):
		si.due_date = getdate(data.get("due_date"))

	# Invoice-level additional discount (ERPNext)
	discount = data.get("discount") or data.get("invoice_discount")
	has_discount = discount is not None or "discount_mode" in data or "additional_discount_percentage" in data
	if has_discount:
		_apply_draft_invoice_discount(si, data)

	items_payload = data.get("items") or []
	if items_payload:
		# Always apply qty/rate from the UI. Invoice-level discount may change rates
		# without Edit Price; direct rate edits still require Edit Price.
		discount_mode = (data.get("discount_mode") or "").strip().lower()
		applying_invoice_discount = discount_mode in ("percentage", "amount")
		if not applying_invoice_discount and isinstance(discount, dict):
			applying_invoice_discount = flt(discount.get("value")) > 0

		from dms.dealer_management_system.utils.price_permissions import (
			assert_price_allowed_if_changed,
		)

		by_name = {str(r.get("name")): r for r in items_payload if r.get("name")}
		has_dms_disc = frappe.get_meta("Sales Invoice Item").has_field("custom_dms_discount")
		for row in si.get("items") or []:
			payload = by_name.get(str(row.name))
			if not payload:
				continue
			if (
				not applying_invoice_discount
				and "rate" in payload
				and payload.get("rate") is not None
			):
				assert_price_allowed_if_changed(flt(row.rate), payload.get("rate"))
			if "qty" in payload and payload.get("qty") is not None:
				row.qty = flt(payload.get("qty"))
			if "rate" in payload and payload.get("rate") is not None:
				row.rate = flt(payload.get("rate"))
				row.price_list_rate = flt(payload.get("rate"))
				row.discount_percentage = 0
				row.discount_amount = 0
			if has_dms_disc and "dms_discount" in payload:
				row.custom_dms_discount = flt(payload.get("dms_discount"))

	if hasattr(si, "ignore_pricing_rule"):
		si.ignore_pricing_rule = 1

	if "apply_taxes" in data:
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			_apply_sales_invoice_tax_choice,
		)

		_apply_sales_invoice_tax_choice(si, bool(cint(data.get("apply_taxes"))))

	# Applied after taxes so turning taxes off does not wipe the withholding setup.
	if "apply_tax_withholding" in data:
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			_apply_tax_withholding_choice,
		)

		_apply_tax_withholding_choice(si, cint(data.get("apply_tax_withholding")))

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		_apply_dms_selling_price_list_to_sales_invoice,
		disable_sales_invoice_round_off,
	)

	disable_sales_invoice_round_off(si)
	_apply_dms_selling_price_list_to_sales_invoice(si)

	si.run_method("calculate_taxes_and_totals")
	si.save()
	si.reload()

	# Amended / edited rates on a job-card invoice → push onto the Job Card
	# (db.set_value so submitted job cards still update).
	if items_payload:
		from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
			sync_sales_invoice_rates_to_job_card,
		)

		sync_sales_invoice_rates_to_job_card(si)

	if cint(data.get("submit")):
		_submit_draft_sales_invoice(si)
		si.reload()
		_relink_job_card_after_amend_submit(si)

	frappe.db.commit()
	return get_sales_invoice_detail(si.name)


def _apply_draft_invoice_discount(si, data) -> None:
	"""Map UI discount payload onto Sales Invoice additional discount on Net Total."""
	mode = (data.get("discount_mode") or "").strip().lower()
	discount = data.get("discount") or data.get("invoice_discount")

	# Always apply additional discount on Net Total for DMS general discounts.
	if si.meta.has_field("apply_discount_on"):
		si.apply_discount_on = "Net Total"

	if "additional_discount_percentage" in data or "discount_amount" in data:
		if "additional_discount_percentage" in data:
			si.additional_discount_percentage = flt(data.get("additional_discount_percentage"))
		if "discount_amount" in data:
			si.discount_amount = flt(data.get("discount_amount"))
		return

	if mode in ("", "none") or discount is None:
		si.additional_discount_percentage = 0
		si.discount_amount = 0
		return

	dtype = None
	value = 0.0
	if isinstance(discount, dict):
		dtype = (discount.get("type") or "").strip().lower()
		value = flt(discount.get("value"))
	elif mode in ("percentage", "amount"):
		dtype = mode
		value = flt(discount)

	if dtype == "percentage":
		si.additional_discount_percentage = min(value, 100.0)
		si.discount_amount = 0
	elif dtype == "amount":
		si.additional_discount_percentage = 0
		si.discount_amount = max(value, 0.0)
	else:
		si.additional_discount_percentage = 0
		si.discount_amount = 0


def _relink_job_card_after_amend_submit(si) -> None:
	"""If amended invoice still points at a job card, restore Job Card.invoice."""
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		resolve_job_card_for_sales_invoice,
		sync_sales_invoice_rates_to_job_card,
	)

	jc = resolve_job_card_for_sales_invoice(si)
	if not jc:
		return
	frappe.db.set_value("DMS Job Card", jc, "invoice", si.name, update_modified=True)
	# Final rate sync at submit (covers rates saved only on last submit).
	sync_sales_invoice_rates_to_job_card(si)


@frappe.whitelist()
def update_job_card_prices_from_invoice(sales_invoice):
	"""Push this Sales Invoice's line rates onto the linked Job Card (manual sync)."""
	_ensure_erpnext()

	name = (sales_invoice or "").strip()
	if not name:
		frappe.throw(_("Sales Invoice name is required."))

	frappe.has_permission("Sales Invoice", "read", name, throw=True)
	si = frappe.get_doc("Sales Invoice", name)
	if not _is_dms_sales_invoice(si):
		frappe.throw(_("This invoice was not created from DMS."))

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		resolve_job_card_for_sales_invoice,
		sync_sales_invoice_rates_to_job_card,
	)

	jc = resolve_job_card_for_sales_invoice(si)
	if not jc:
		frappe.throw(_("This invoice is not linked to a Job Card."))

	frappe.has_permission("DMS Job Card", "write", jc, throw=True)
	result = sync_sales_invoice_rates_to_job_card(si)
	frappe.db.commit()

	updated = cint(result.get("updated_lines") or 0)
	if updated:
		message = _("Updated {0} line(s) on Job Card {1} from invoice rates.").format(
			updated, jc
		)
	else:
		message = _("Job Card {0} already matches invoice rates.").format(jc)

	return {
		"sales_invoice": si.name,
		"job_card": jc,
		"updated_lines": updated,
		"message": message,
	}


@frappe.whitelist()
def list_modes_of_payment(company=None):
	_ensure_erpnext()

	company = (company or "").strip() or None
	filters = {"enabled": 1}
	account_by_mode: dict[str, str] = {}

	if company:
		account_rows = frappe.get_all(
			"Mode of Payment Account",
			filters={"parenttype": "Mode of Payment", "company": company},
			fields=["parent", "default_account"],
		)
		for row in account_rows:
			parent = (row.parent or "").strip()
			account = (row.default_account or "").strip()
			if parent and account and parent not in account_by_mode:
				account_by_mode[parent] = account
		if account_by_mode:
			filters["name"] = ["in", list(account_by_mode.keys())]

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

	account_names: dict[str, str] = {}
	account_codes = list({a for a in account_by_mode.values() if a})
	if account_codes:
		for row in frappe.get_all(
			"Account",
			filters={"name": ["in", account_codes]},
			fields=["name", "account_name"],
		):
			account_names[row.name] = row.account_name or row.name

	out = []
	for mode in modes:
		account = account_by_mode.get(mode.name)
		out.append(
			{
				"name": mode.name,
				"type": mode.type,
				"account": account,
				"account_name": account_names.get(account) if account else None,
			}
		)
	return out


@frappe.whitelist()
def collect_payment(
	sales_invoice,
	mode_of_payment=None,
	paid_amount=None,
	reference_no=None,
	payments=None,
	remarks=None,
):
	"""Record one or more Payment Entries against a Sales Invoice.

	``payments`` may be a list of:
	  ``{mode_of_payment, amount, reference_no?, remarks?}``

	Legacy single-mode args (``mode_of_payment`` / ``paid_amount`` / ``reference_no``)
	remain supported. ``remarks`` (header level) is the operator's receipt note; it is
	stored on ``Payment Entry.custom_dms_remarks`` and shown on the invoice/payment
	screens. A row-level ``remarks`` overrides the header value for that entry.
	"""
	_ensure_erpnext()
	import json

	invoice_name = (sales_invoice or "").strip()
	if not invoice_name:
		frappe.throw(_("Sales Invoice name is required."))

	if isinstance(payments, str):
		payments = json.loads(payments) if payments else None

	rows: list[dict] = []
	if payments:
		if not isinstance(payments, (list, tuple)):
			frappe.throw(_("Payments must be a list of mode/amount rows."))
		for raw in payments:
			if not isinstance(raw, dict):
				continue
			mode = (raw.get("mode_of_payment") or "").strip()
			amount = flt(raw.get("amount"))
			if not mode:
				frappe.throw(_("Each payment row needs a mode of payment."))
			if amount <= 0:
				frappe.throw(_("Each payment amount must be greater than zero."))
			rows.append(
				{
					"mode_of_payment": mode,
					"amount": amount,
					"reference_no": (raw.get("reference_no") or "").strip() or None,
					"remarks": (raw.get("remarks") or "").strip() or None,
				}
			)
	elif mode_of_payment:
		rows.append(
			{
				"mode_of_payment": (mode_of_payment or "").strip(),
				"amount": flt(paid_amount) if paid_amount not in (None, "") else None,
				"reference_no": (reference_no or "").strip() or None,
				"remarks": (remarks or "").strip() or None,
			}
		)

	if not rows:
		frappe.throw(_("Add at least one mode of payment."))

	frappe.has_permission("Payment Entry", "create", throw=True)
	frappe.has_permission("Sales Invoice", "read", invoice_name, throw=True)

	si = frappe.get_doc("Sales Invoice", invoice_name)
	if si.docstatus != 1:
		frappe.throw(_("Submit the Sales Invoice before recording payment."))

	outstanding = flt(si.outstanding_amount)
	if outstanding <= 0:
		frappe.throw(_("This invoice has no outstanding amount to collect."))

	# Fill omitted single-row amount with full outstanding.
	for row in rows:
		if row["amount"] is None:
			row["amount"] = outstanding

	total = sum(flt(row["amount"]) for row in rows)
	if total <= 0:
		frappe.throw(_("Payment amount must be greater than zero."))

	# Overpayment is allowed: allocate up to outstanding and leave the rest
	# unallocated on the Payment Entry (customer advance / change).
	remaining_outstanding = outstanding
	payment_specs: list[dict] = []
	for row in rows:
		requested = flt(row["amount"])
		allocate = min(requested, remaining_outstanding)
		remaining_outstanding = max(remaining_outstanding - allocate, 0)
		if allocate > 0 or not payment_specs:
			payment_specs.append(
				{
					"mode_of_payment": row["mode_of_payment"],
					"reference_no": row.get("reference_no"),
					"remarks": row.get("remarks"),
					"paid_amount": requested,
					"allocated_amount": allocate,
				}
			)
		else:
			# Invoice already fully allocated — fold further receipts into the
			# last PE so excess stays unallocated on that entry.
			payment_specs[-1]["paid_amount"] = flt(payment_specs[-1]["paid_amount"]) + requested

	from erpnext.accounts.doctype.payment_entry.payment_entry import (
		get_bank_cash_account,
		get_payment_entry,
	)

	created: list[str] = []
	paid_total = 0.0
	pe_meta = frappe.get_meta("Payment Entry")
	si_job_card = (
		(si.get("custom_dms_job_card") or "").strip()
		if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card")
		else ""
	)

	for spec in payment_specs:
		si.reload()
		current_outstanding = flt(si.outstanding_amount)
		paid_amount = flt(spec["paid_amount"])
		allocated = min(flt(spec["allocated_amount"]), current_outstanding)
		if paid_amount <= 0:
			continue
		if allocated <= 0 and current_outstanding <= 0 and not created:
			frappe.throw(_("This invoice has no outstanding amount to collect."))

		pe = get_payment_entry("Sales Invoice", invoice_name)
		if isinstance(pe, dict):
			pe = frappe.get_doc(pe)

		pe.mode_of_payment = spec["mode_of_payment"]
		if spec.get("reference_no"):
			pe.reference_no = spec["reference_no"]

		# Point paid_to / paid_from at the account for this mode of payment.
		try:
			bank = get_bank_cash_account(pe, None)
			account = (bank or {}).get("account")
			if account:
				if pe.payment_type == "Receive":
					pe.paid_to = account
				elif pe.payment_type == "Pay":
					pe.paid_from = account
		except Exception:
			pass

		pe.paid_amount = paid_amount
		pe.received_amount = paid_amount
		for ref in pe.get("references") or []:
			ref.allocated_amount = allocated
			break

		# Operator note from the DMS "Collect Payment" dialog. Kept on the dedicated
		# DMS remarks field so it never clashes with ERPNext's generated `remarks`.
		pe_remarks = (spec.get("remarks") or "").strip()
		if pe_remarks and pe_meta.has_field("custom_dms_remarks"):
			pe.set("custom_dms_remarks", pe_remarks)

		# Flag the receipt as DMS activity, exactly like the standalone advance flow
		# (``dms.api.payment_entries``). Without it the entry loses its DMS identity
		# the moment its reference rows no longer resolve to a DMS Sales Invoice.
		if pe_meta.has_field("custom_is_dms"):
			pe.set("custom_is_dms", 1)
		if si_job_card and pe_meta.has_field("custom_dms_job_card"):
			pe.set("custom_dms_job_card", si_job_card)

		pe.insert()
		pe.submit()
		created.append(pe.name)
		paid_total += paid_amount

	if not created:
		frappe.throw(_("No payment entries were created."))

	si.reload()

	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		sync_job_card_payment_status_from_invoice,
	)

	sync_job_card_payment_status_from_invoice(sales_invoice=si.name)

	return {
		"payment_entry": created[0],
		"payment_entries": created,
		"paid_amount": paid_total,
		"outstanding_amount": flt(si.outstanding_amount),
		"status": si.status,
	}

