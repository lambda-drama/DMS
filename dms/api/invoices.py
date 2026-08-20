import frappe
from frappe import _
from frappe.query_builder import DocType, Order
from frappe.utils import cint, flt, getdate, today

from dms.api.utils import add_company_filter, get_dms_companies, resolve_dms_customer
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

	query = apply_branch_filter_to_qb(query, SI, doctype="Sales Invoice")

	rows = query.run(as_dict=True)
	if not rows:
		return []

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
		item = {
			"name": row.name,
			"idx": row.idx,
			"item_code": row.item_code,
			"item_name": row.item_name,
			"description": row.description or row.item_name,
			"qty": flt(row.qty),
			"rate": flt(row.rate),
			"amount": flt(row.amount),
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
	}
	amended_as = frappe.db.exists("Sales Invoice", {"amended_from": si.name})
	result["already_amended"] = 1 if amended_as else 0
	result["amended_as"] = amended_as or None
	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		result["dms_job_card"] = si.get("custom_dms_job_card")
	if frappe.get_meta("Sales Invoice").has_field("custom_spare_parts"):
		result["custom_spare_parts"] = cint(si.get("custom_spare_parts"))
	if frappe.get_meta("Sales Invoice").has_field("custom_is_dms_transaction"):
		result["is_dms_transaction"] = cint(si.get("custom_is_dms_transaction"))
	if frappe.get_meta("Sales Invoice").has_field("custom_missing_dms"):
		result["missing_dms"] = cint(si.get("custom_missing_dms"))
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
		# Discounts may change line rates — that is allowed without Edit Price.
		# Only direct unit-price edits (without a discount action) require Edit Price.
		if not has_discount:
			from dms.dealer_management_system.utils.price_permissions import (
				assert_price_allowed_if_changed,
			)

			by_name = {str(r.get("name")): r for r in items_payload if r.get("name")}
			has_dms_disc = frappe.get_meta("Sales Invoice Item").has_field("custom_dms_discount")
			for row in si.get("items") or []:
				payload = by_name.get(str(row.name))
				if not payload:
					continue
				if "rate" in payload and payload.get("rate") is not None:
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

	si.run_method("calculate_taxes_and_totals")
	si.save()
	si.reload()

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
	jc = None
	if frappe.get_meta("Sales Invoice").has_field("custom_dms_job_card"):
		jc = (si.get("custom_dms_job_card") or "").strip()
	if not jc or not frappe.db.exists("DMS Job Card", jc):
		return
	frappe.db.set_value("DMS Job Card", jc, "invoice", si.name, update_modified=True)


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
):
	"""Record one or more Payment Entries against a Sales Invoice.

	``payments`` may be a list of:
	  ``{mode_of_payment, amount, reference_no?}``

	Legacy single-mode args (``mode_of_payment`` / ``paid_amount`` / ``reference_no``)
	remain supported.
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
				}
			)
	elif mode_of_payment:
		rows.append(
			{
				"mode_of_payment": (mode_of_payment or "").strip(),
				"amount": flt(paid_amount) if paid_amount not in (None, "") else None,
				"reference_no": (reference_no or "").strip() or None,
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
	if total > outstanding + 0.01:
		frappe.throw(
			_("Payment total ({0}) cannot exceed outstanding amount ({1}).").format(
				total, outstanding
			)
		)

	from erpnext.accounts.doctype.payment_entry.payment_entry import (
		get_bank_cash_account,
		get_payment_entry,
	)

	created: list[str] = []
	paid_total = 0.0

	for row in rows:
		si.reload()
		current_outstanding = flt(si.outstanding_amount)
		if current_outstanding <= 0:
			break

		amount = min(flt(row["amount"]), current_outstanding)
		if amount <= 0:
			continue

		pe = get_payment_entry("Sales Invoice", invoice_name)
		if isinstance(pe, dict):
			pe = frappe.get_doc(pe)

		pe.mode_of_payment = row["mode_of_payment"]
		if row.get("reference_no"):
			pe.reference_no = row["reference_no"]

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

		if amount < current_outstanding - 0.01:
			pe.paid_amount = amount
			pe.received_amount = amount
			for ref in pe.get("references") or []:
				ref.allocated_amount = amount
				break

		pe.insert()
		pe.submit()
		created.append(pe.name)
		paid_total += amount

	if not created:
		frappe.throw(_("No payment entries were created."))

	si.reload()

	return {
		"payment_entry": created[0],
		"payment_entries": created,
		"paid_amount": paid_total,
		"outstanding_amount": flt(si.outstanding_amount),
		"status": si.status,
	}

