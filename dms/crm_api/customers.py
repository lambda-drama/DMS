# Copyright (c) 2026, Mania and contributors
"""CRM Customer 360 — aggregate profile for one ERPNext Customer (all blueprint phases)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, today

from dms.crm_api.common import ensure_crm_create, ensure_crm_read, ensure_crm_write, parse_json
from dms.crm_api.contacts import _dms_customer_groups

GATE = "DMS CRM Lead"

OPEN_LEAD_STATUSES = {"New", "Assigned", "Contact Attempted", "Contacted", "Qualified", "Nurture"}
OPEN_OPP_STATUSES = {"Open", "On Hold"}
OPEN_CASE_STATUSES = {
	"New",
	"Acknowledged",
	"Assigned",
	"Investigation",
	"Awaiting Customer",
	"Awaiting Internal Action",
	"Resolution Proposed",
	"Reopened",
}
OPEN_ACTIVITY_STATUSES = {"Open", "Pending", "Scheduled"}


def _safe_all(doctype: str, *, filters=None, fields=None, order_by=None, limit=50):
	if not frappe.db.exists("DocType", doctype):
		return []
	return frappe.get_all(
		doctype,
		filters=filters or {},
		fields=fields or ["name"],
		order_by=order_by or "modified desc",
		limit_page_length=limit,
	)


def _fields_present(doctype: str, wanted: list[str]) -> list[str]:
	if not frappe.db.exists("DocType", doctype):
		return ["name"] if "name" in wanted else []
	meta = frappe.get_meta(doctype)
	return [f for f in wanted if f == "name" or meta.has_field(f)]


def _customer_contacts(customer: str) -> list[dict]:
	if not frappe.db.exists("DocType", "Contact") or not frappe.db.exists("DocType", "Dynamic Link"):
		return []
	contact_names = frappe.get_all(
		"Dynamic Link",
		filters={
			"link_doctype": "Customer",
			"link_name": customer,
			"parenttype": "Contact",
		},
		pluck="parent",
	)
	if not contact_names:
		return []
	fields = _fields_present(
		"Contact",
		[
			"name",
			"first_name",
			"last_name",
			"email_id",
			"mobile_no",
			"phone",
			"company_name",
			"designation",
			"status",
			"is_primary_contact",
		],
	)
	rows = frappe.get_all(
		"Contact",
		filters={"name": ["in", contact_names]},
		fields=fields,
		order_by="modified desc",
		limit_page_length=50,
	)
	data = []
	for r in rows:
		row = dict(r)
		row["full_name"] = (
			" ".join(p for p in [row.get("first_name"), row.get("last_name")] if p).strip()
			or row.get("name")
		)
		# Blueprint org roles — best-effort from designation / company
		role = (row.get("designation") or "").strip()
		if not role and row.get("company_name"):
			role = "Company contact"
		row["org_role"] = role or "Contact"
		data.append(row)
	return data


def _customer_vehicles(customer: str) -> list[dict]:
	if not frappe.db.exists("DocType", "VIN No"):
		return []
	fields = _fields_present(
		"VIN No",
		[
			"name",
			"vin_number",
			"plate_number",
			"brand",
			"model",
			"model_name",
			"model_year",
			"current_odometer",
			"warranty_status",
			"warranty_end_date",
			"customer_name",
			"status",
		],
	)
	return frappe.get_all(
		"VIN No",
		filters={"current_customer": customer},
		fields=fields,
		order_by="modified desc",
		limit_page_length=50,
	)


def _vehicle_ownership_history(customer: str) -> list[dict]:
	"""Previous / co-owner / fleet relationships via VIN Customer History child table."""
	if not frappe.db.exists("DocType", "VIN Customer History"):
		return []
	try:
		rows = frappe.db.sql(
			"""
			SELECT
				h.parent AS vin,
				h.customer,
				h.customer_name,
				h.relationship,
				h.mobile_no,
				h.email_id,
				h.from_date,
				h.to_date,
				h.is_current,
				h.notes,
				v.vin_number,
				v.plate_number,
				v.brand,
				v.model,
				v.model_name,
				v.model_year,
				v.current_customer
			FROM `tabVIN Customer History` h
			LEFT JOIN `tabVIN No` v ON v.name = h.parent
			WHERE h.customer = %s
			ORDER BY h.is_current DESC, h.from_date DESC
			LIMIT 100
			""",
			customer,
			as_dict=True,
		)
	except Exception:
		frappe.log_error(title="CRM Customer 360 vehicle history")
		return []
	for r in rows:
		r["ownership_status"] = (
			"Current"
			if cint(r.get("is_current")) or r.get("current_customer") == customer
			else "Previous"
		)
	return rows


def _job_cards(customer: str) -> list[dict]:
	fields = _fields_present(
		"DMS Job Card",
		[
			"name",
			"status",
			"vehicle_vin",
			"vehicle_model",
			"service_advisor",
			"total_amount",
			"total_labor_cost",
			"total_parts_cost",
			"delivery_date_time",
			"next_service_due_date",
			"next_service_due_km",
			"customer_satisfaction",
			"invoice",
			"modified",
			"creation",
		],
	)
	return _safe_all(
		"DMS Job Card",
		filters={"customer": customer},
		fields=fields,
		order_by="modified desc",
		limit=40,
	)


def _service_estimates(customer: str) -> list[dict]:
	fields = _fields_present(
		"DMS Service Estimate",
		[
			"name",
			"status",
			"vehicle_vin",
			"grand_total",
			"customer_decision",
			"modified",
			"creation",
		],
	)
	return _safe_all(
		"DMS Service Estimate",
		filters={"customer": customer},
		fields=fields,
		limit=30,
	)


def _follow_ups(customer: str) -> list[dict]:
	fields = _fields_present(
		"Customer Follow Up",
		[
			"name",
			"job_card",
			"vehicle_vin",
			"follow_up_due_date",
			"follow_up_completed_date",
			"assigned_to",
			"contact_method",
			"contact_status",
			"customer_rating",
			"nps_score",
			"case_status",
			"repeat_repair_risk",
			"modified",
		],
	)
	return _safe_all(
		"Customer Follow Up",
		filters={"customer": customer},
		fields=fields,
		order_by="follow_up_due_date desc, modified desc",
		limit=30,
	)


def _deliveries(customer: str) -> list[dict]:
	fields = _fields_present(
		"Vehicle Delivery Note",
		[
			"name",
			"status",
			"vehicle_vin",
			"vehicle_model",
			"delivery_date_time",
			"customer_satisfaction_score",
			"modified",
		],
	)
	return _safe_all(
		"Vehicle Delivery Note",
		filters={"customer": customer},
		fields=fields,
		order_by="delivery_date_time desc, modified desc",
		limit=20,
	)


def _appointments(customer: str) -> list[dict]:
	if not frappe.db.exists("DocType", "Service Appointment"):
		return []
	meta = frappe.get_meta("Service Appointment")
	if not meta.has_field("customer"):
		return []
	fields = _fields_present(
		"Service Appointment",
		[
			"name",
			"status",
			"appointment_date_time",
			"vehicle",
			"assigned_service_advisor",
			"modified",
		],
	)
	order_by = (
		"appointment_date_time desc, modified desc"
		if meta.has_field("appointment_date_time")
		else "modified desc"
	)
	return frappe.get_all(
		"Service Appointment",
		filters={"customer": customer},
		fields=fields,
		order_by=order_by,
		limit_page_length=20,
	)


def _finance_summary(customer: str) -> dict:
	invoices = []
	payments = []
	outstanding = 0.0
	invoiced_total = 0.0
	paid_total = 0.0
	overdue_count = 0

	if frappe.db.exists("DocType", "Sales Invoice"):
		fields = _fields_present(
			"Sales Invoice",
			[
				"name",
				"posting_date",
				"due_date",
				"status",
				"grand_total",
				"outstanding_amount",
				"currency",
				"is_return",
				"docstatus",
			],
		)
		invoices = frappe.get_all(
			"Sales Invoice",
			filters={"customer": customer, "docstatus": ["<", 2]},
			fields=fields,
			order_by="posting_date desc",
			limit_page_length=40,
		)
		today_d = getdate(today())
		for inv in invoices:
			gt = flt(inv.get("grand_total"))
			out = flt(inv.get("outstanding_amount"))
			if not cint(inv.get("is_return")):
				invoiced_total += gt
			outstanding += out
			paid_total += max(gt - out, 0)
			due = inv.get("due_date")
			if out > 0 and due and getdate(due) < today_d:
				overdue_count += 1
				inv["is_overdue"] = 1
			else:
				inv["is_overdue"] = 0

	# Payment Entry Party rows (ERPNext)
	if frappe.db.exists("DocType", "Payment Entry"):
		pay_fields = _fields_present(
			"Payment Entry",
			[
				"name",
				"posting_date",
				"paid_amount",
				"received_amount",
				"payment_type",
				"mode_of_payment",
				"status",
				"docstatus",
			],
		)
		# party field may be Customer
		meta = frappe.get_meta("Payment Entry")
		if meta.has_field("party") and meta.has_field("party_type"):
			payments = frappe.get_all(
				"Payment Entry",
				filters={"party_type": "Customer", "party": customer, "docstatus": 1},
				fields=pay_fields,
				order_by="posting_date desc",
				limit_page_length=20,
			)

	credit_limit = 0.0
	payment_terms = None
	cust_meta = frappe.get_meta("Customer")
	if cust_meta.has_field("credit_limits"):
		# child table — sum limits if present
		try:
			limits = frappe.get_all(
				"Customer Credit Limit",
				filters={"parent": customer},
				fields=["credit_limit"],
				limit_page_length=10,
			)
			credit_limit = sum(flt(r.get("credit_limit")) for r in limits)
		except Exception:
			credit_limit = 0.0
	if cust_meta.has_field("payment_terms"):
		payment_terms = frappe.db.get_value("Customer", customer, "payment_terms")

	return {
		"invoices": invoices,
		"payments": payments,
		"outstanding": outstanding,
		"invoiced_total": invoiced_total,
		"paid_total": paid_total,
		"overdue_count": overdue_count,
		"credit_limit": credit_limit,
		"payment_terms": payment_terms,
	}


def _campaigns(customer: str) -> list[dict]:
	"""Phase 3 campaign membership — ready when DMS CRM Campaign Member exists."""
	if not frappe.db.exists("DocType", "DMS CRM Campaign Member"):
		return []
	fields = _fields_present(
		"DMS CRM Campaign Member",
		[
			"name",
			"campaign",
			"status",
			"response",
			"converted",
			"opted_out",
			"attribution",
			"modified",
		],
	)
	members = _safe_all(
		"DMS CRM Campaign Member",
		filters={"customer": customer},
		fields=fields,
		limit=40,
	)
	# Enrich with campaign title if available
	if members and frappe.db.exists("DocType", "DMS CRM Campaign"):
		names = [m.get("campaign") for m in members if m.get("campaign")]
		if names:
			titles = {
				r.name: r
				for r in frappe.get_all(
					"DMS CRM Campaign",
					filters={"name": ["in", names]},
					fields=["name", "campaign_name", "campaign_type", "status", "start_date", "end_date"],
				)
			}
			for m in members:
				c = titles.get(m.get("campaign")) or {}
				m["campaign_name"] = c.get("campaign_name") or m.get("campaign")
				m["campaign_type"] = c.get("campaign_type")
				m["campaign_status"] = c.get("status")
	return members


def _loyalty_value(
	customer: str,
	*,
	finance: dict,
	job_cards: list[dict],
	opportunities: list[dict],
	follow_ups: list[dict],
	deliveries: list[dict],
) -> dict:
	"""§16 — prefer dedicated loyalty engine; fall back to heuristics."""
	if frappe.db.exists("DocType", "DMS CRM Loyalty Settings"):
		try:
			from dms.crm_api.loyalty import compute_customer_value

			value = compute_customer_value(customer)
			referrals = []
			if frappe.db.exists("DocType", "DMS CRM Referral"):
				referrals = _safe_all(
					"DMS CRM Referral",
					filters={"referrer_customer": customer},
					fields=_fields_present(
						"DMS CRM Referral",
						[
							"name",
							"referred_name",
							"referred_customer",
							"status",
							"reward_points",
							"reward_paid",
							"modified",
						],
					),
					limit=20,
				)
			ratings = [
				flt(f.get("nps_score"))
				for f in follow_ups
				if f.get("nps_score") is not None and str(f.get("nps_score")).strip() != ""
			]
			avg_nps = (sum(ratings) / len(ratings)) if ratings else None
			return {
				"lifetime_value": value.get("lifetime_revenue"),
				"sales_revenue": value.get("sales_revenue"),
				"aftersales_revenue": value.get("aftersales_revenue"),
				"gross_contribution": value.get("gross_contribution"),
				"loyalty_tier": value.get("loyalty_tier"),
				"points": value.get("points") or 0,
				"points_source": value.get("points_source"),
				"tier_benefits": value.get("tier_benefits") or {},
				"retention_status": value.get("retention_status"),
				"relationship_health": value.get("relationship_health"),
				"churn_risk": value.get("churn_risk"),
				"referrals": referrals,
				"referral_count": len(referrals),
				"won_deals": sum(
					1
					for o in opportunities
					if (o.get("status") or "") == "Won" or (o.get("stage") or "") == "Won"
				),
				"service_visits": value.get("service_visits") or len(job_cards),
				"avg_nps": avg_nps,
				"repurchase_potential": value.get("repurchase_propensity"),
				"source": "loyalty_engine",
			}
		except Exception:
			frappe.log_error(frappe.get_traceback(), "loyalty_value")

	# Legacy heuristic fallback
	sales_revenue = flt(finance.get("invoiced_total"))
	aftersales_revenue = sum(flt(j.get("total_amount")) for j in job_cards)
	ltv = sales_revenue + aftersales_revenue

	won_deals = sum(1 for o in opportunities if (o.get("status") or "") == "Won" or (o.get("stage") or "") == "Won")
	service_visits = len(job_cards)
	deliveries_count = len(deliveries)

	ratings = [
		flt(f.get("nps_score"))
		for f in follow_ups
		if f.get("nps_score") is not None and str(f.get("nps_score")).strip() != ""
	]
	avg_nps = (sum(ratings) / len(ratings)) if ratings else None

	if ltv >= 50000 or service_visits >= 10:
		tier = "Platinum"
	elif ltv >= 20000 or service_visits >= 5:
		tier = "Gold"
	elif ltv >= 5000 or service_visits >= 2 or deliveries_count:
		tier = "Silver"
	elif ltv > 0 or won_deals or service_visits:
		tier = "Bronze"
	else:
		tier = "Prospect"

	repurchase = "High" if won_deals or (service_visits >= 3 and avg_nps and avg_nps >= 7) else (
		"Medium" if service_visits or opportunities else "Low"
	)

	referrals = []
	if frappe.db.exists("DocType", "DMS CRM Referral"):
		referrals = _safe_all(
			"DMS CRM Referral",
			filters={"referrer_customer": customer},
			fields=_fields_present(
				"DMS CRM Referral",
				["name", "referred_customer", "referred_name", "status", "reward_points", "modified"],
			),
			limit=20,
		)

	return {
		"lifetime_value": ltv,
		"sales_revenue": sales_revenue,
		"aftersales_revenue": aftersales_revenue,
		"loyalty_tier": tier,
		"points": 0,
		"referrals": referrals,
		"referral_count": len(referrals),
		"won_deals": won_deals,
		"service_visits": service_visits,
		"avg_nps": avg_nps,
		"repurchase_potential": repurchase,
		"source": "computed",
	}


def _audit_trail(customer: str) -> list[dict]:
	events = []

	# Ownership changes from VIN history
	for h in _vehicle_ownership_history(customer)[:30]:
		events.append(
			{
				"event_type": "Ownership",
				"summary": f"{h.get('relationship') or 'Owner'} · {h.get('vin_number') or h.get('vin')}",
				"detail": h.get("ownership_status"),
				"when": h.get("from_date") or h.get("to_date"),
				"user": None,
				"ref_doctype": "VIN No",
				"ref_name": h.get("vin"),
			}
		)

	# Version history on Customer
	if frappe.db.exists("DocType", "Version"):
		versions = frappe.get_all(
			"Version",
			filters={"ref_doctype": "Customer", "docname": customer},
			fields=["name", "owner", "creation", "data"],
			order_by="creation desc",
			limit_page_length=25,
		)
		for v in versions:
			changed = []
			try:
				import json

				payload = json.loads(v.get("data") or "{}")
				for item in payload.get("changed") or []:
					if isinstance(item, (list, tuple)) and len(item) >= 1:
						changed.append(str(item[0]))
				for item in payload.get("added") or []:
					if isinstance(item, (list, tuple)) and item:
						changed.append(f"+{item[0]}")
			except Exception:
				pass
			events.append(
				{
					"event_type": "Field change",
					"summary": ", ".join(changed[:8]) or "Document updated",
					"detail": None,
					"when": v.get("creation"),
					"user": v.get("owner"),
					"ref_doctype": "Version",
					"ref_name": v.get("name"),
				}
			)

	# Activity Log (if present)
	if frappe.db.exists("DocType", "Activity Log"):
		logs = frappe.get_all(
			"Activity Log",
			filters={"reference_doctype": "Customer", "reference_name": customer},
			fields=["name", "subject", "status", "user", "creation", "operation"],
			order_by="creation desc",
			limit_page_length=20,
		)
		for log in logs:
			events.append(
				{
					"event_type": log.get("operation") or "Access",
					"summary": log.get("subject") or log.get("name"),
					"detail": log.get("status"),
					"when": log.get("creation"),
					"user": log.get("user"),
					"ref_doctype": "Activity Log",
					"ref_name": log.get("name"),
				}
			)

	events.sort(key=lambda e: str(e.get("when") or ""), reverse=True)
	return events[:60]


def _communications_extra(customer: str) -> list[dict]:
	"""ERPNext Communication rows linked to this customer."""
	if not frappe.db.exists("DocType", "Communication"):
		return []
	rows = frappe.get_all(
		"Communication",
		filters={
			"reference_doctype": "Customer",
			"reference_name": customer,
		},
		fields=[
			"name",
			"communication_type",
			"communication_medium",
			"subject",
			"status",
			"sent_or_received",
			"creation",
			"sender",
			"recipients",
		],
		order_by="creation desc",
		limit_page_length=30,
	)
	return [dict(r) for r in rows]


def _retention_status(job_cards: list[dict], follow_ups: list[dict]) -> dict:
	next_due = None
	for j in job_cards:
		d = j.get("next_service_due_date")
		if d and (next_due is None or getdate(d) < getdate(next_due)):
			next_due = d

	open_followups = [
		f
		for f in follow_ups
		if not f.get("follow_up_completed_date")
		and (f.get("case_status") or "") not in {"Closed", "Completed", "Resolved"}
	]

	today_d = getdate(today())
	if next_due:
		due_d = getdate(next_due)
		delta = (due_d - today_d).days
		if delta < 0:
			status = "Overdue"
		elif delta <= 30:
			status = "Due soon"
		else:
			status = "On schedule"
	elif job_cards:
		status = "No next service set"
	else:
		status = "No service history"

	return {
		"status": status,
		"next_service_due_date": next_due,
		"open_follow_ups": len(open_followups),
		"job_cards": len(job_cards),
	}


def _identity(cust) -> dict:
	identity = {
		"name": cust.name,
		"customer_name": cust.customer_name,
		"customer_type": cust.customer_type,
		"customer_group": cust.customer_group,
		"territory": cust.territory,
		"mobile_no": cust.mobile_no,
		"email_id": cust.email_id,
		"disabled": cint(cust.disabled),
		"creation": cust.creation,
		"modified": cust.modified,
		"owner": cust.owner,
		"modified_by": cust.modified_by,
	}
	for optional in (
		"customer_primary_address",
		"primary_address",
		"website",
		"tax_id",
		"language",
		"gender",
		"salutation",
		"industry",
		"market_segment",
		"default_currency",
		"default_bank_account",
		"customer_primary_contact",
	):
		if hasattr(cust, optional):
			identity[optional] = getattr(cust, optional)
	return identity


@frappe.whitelist()
def get_customer_create_options():
	"""Options for CRM New Customer form (DMS vehicle groups + territories)."""
	ensure_crm_read(GATE)
	groups = _dms_customer_groups()
	territories = []
	if frappe.db.exists("DocType", "Territory"):
		territories = frappe.get_all(
			"Territory",
			filters={"is_group": 0} if frappe.get_meta("Territory").has_field("is_group") else {},
			fields=["name"],
			order_by="name asc",
			limit_page_length=200,
			pluck="name",
		)
	countries = []
	default_country = None
	if frappe.db.exists("DocType", "Country"):
		countries = frappe.get_all(
			"Country",
			fields=["name"],
			order_by="name asc",
			limit_page_length=300,
			pluck="name",
		)
		default_country = (
			frappe.db.get_default("country")
			or frappe.db.get_single_value("System Settings", "country")
			or None
		)
	address_types = [
		"Billing",
		"Shipping",
		"Office",
		"Personal",
		"Current",
		"Permanent",
		"Other",
	]
	return {
		"customer_groups": groups,
		"territories": territories,
		"customer_types": ["Individual", "Company"],
		"default_customer_group": groups[0] if groups else None,
		"countries": countries,
		"default_country": default_country,
		"address_types": address_types,
	}


@frappe.whitelist()
def create_customer(data=None, force=0):
	"""Create an ERPNext Customer in a DMS vehicle customer group."""
	ensure_crm_create(GATE)
	frappe.has_permission("Customer", "create", throw=True)

	payload = parse_json(data)
	if not payload:
		frappe.throw(_("Customer data is required."))

	customer_name = (payload.get("customer_name") or "").strip()
	if not customer_name:
		frappe.throw(_("Customer name is required."))

	groups = _dms_customer_groups()
	if not groups:
		frappe.throw(
			_("No DMS customer groups configured. Mark Customer Groups with Is Vehicle Customer in DMS Settings.")
		)

	customer_group = (payload.get("customer_group") or "").strip() or groups[0]
	if customer_group not in groups:
		frappe.throw(_("Customer group must be a DMS vehicle customer group."))

	mobile_no = (payload.get("mobile_no") or "").strip() or None
	email_id = (payload.get("email_id") or "").strip() or None
	tax_id = (payload.get("tax_id") or "").strip() or None

	# Blueprint §4.3 — warn on likely duplicates unless force
	dup_filters = []
	if mobile_no:
		dup_filters.append({"mobile_no": mobile_no})
	if email_id:
		dup_filters.append({"email_id": email_id})
	if tax_id and frappe.get_meta("Customer").has_field("tax_id"):
		dup_filters.append({"tax_id": tax_id})

	duplicates = []
	seen = set()
	for filt in dup_filters:
		for r in frappe.get_all(
			"Customer",
			filters=filt,
			fields=["name", "customer_name", "mobile_no", "email_id", "customer_group"],
			limit_page_length=5,
		):
			if r.name in seen:
				continue
			seen.add(r.name)
			duplicates.append(dict(r))

	if duplicates and not cint(force):
		return {
			"ok": False,
			"error": "possible_duplicates",
			"message": _("Possible duplicate customers found. Confirm to create anyway."),
			"duplicates": duplicates,
		}

	doc = frappe.new_doc("Customer")
	doc.customer_name = customer_name
	doc.customer_type = payload.get("customer_type") or "Individual"
	doc.customer_group = customer_group
	if mobile_no:
		doc.mobile_no = mobile_no
	if email_id:
		doc.email_id = email_id
	if payload.get("territory"):
		doc.territory = payload.get("territory")
	if tax_id and hasattr(doc, "tax_id"):
		doc.tax_id = tax_id
	if payload.get("website") and hasattr(doc, "website"):
		doc.website = payload.get("website")

	doc.insert()

	address_name = None
	raw_address = payload.get("address")
	if isinstance(raw_address, str):
		raw_address = parse_json(raw_address)
	address = raw_address if isinstance(raw_address, dict) else {}
	# Flat address_* keys also accepted for convenience
	if not address:
		address = {
			"address_line1": payload.get("address_line1"),
			"address_line2": payload.get("address_line2"),
			"city": payload.get("city"),
			"state": payload.get("state"),
			"pincode": payload.get("pincode"),
			"country": payload.get("country"),
			"address_type": payload.get("address_type"),
			"phone": payload.get("address_phone") or mobile_no,
		}

	line1 = (address.get("address_line1") or "").strip()
	city = (address.get("city") or "").strip()
	country = (address.get("country") or "").strip()
	if line1 and city and country:
		frappe.has_permission("Address", "create", throw=True)
		addr = frappe.get_doc(
			{
				"doctype": "Address",
				"address_title": customer_name,
				"address_type": (address.get("address_type") or "Billing").strip() or "Billing",
				"address_line1": line1,
				"address_line2": (address.get("address_line2") or "").strip() or None,
				"city": city,
				"state": (address.get("state") or "").strip() or None,
				"pincode": (address.get("pincode") or "").strip() or None,
				"country": country,
				"phone": (address.get("phone") or mobile_no or "").strip() or None,
				"email_id": email_id,
				"is_primary_address": 1,
				"is_shipping_address": 1,
				"links": [{"link_doctype": "Customer", "link_name": doc.name}],
			}
		)
		addr.insert()
		address_name = addr.name
		from frappe.contacts.doctype.address.address import get_address_display

		doc.db_set("customer_primary_address", addr.name)
		doc.db_set("primary_address", get_address_display(addr.name))

	frappe.db.commit()
	return {
		"ok": True,
		"name": doc.name,
		"customer_name": doc.customer_name,
		"customer_group": doc.customer_group,
		"address": address_name,
	}


@frappe.whitelist()
def update_customer(name, data=None):
	"""Update core Customer master fields from DMS / CRM UI."""
	ensure_crm_write(GATE)
	frappe.has_permission("Customer", "write", throw=True)

	name = (name or "").strip()
	if not name:
		frappe.throw(_("Customer name is required."))
	if not frappe.db.exists("Customer", name):
		frappe.throw(_("Customer {0} not found.").format(name))

	payload = parse_json(data) or {}
	doc = frappe.get_doc("Customer", name)
	doc.check_permission("write")

	groups = _dms_customer_groups()
	if groups and doc.customer_group and doc.customer_group not in groups:
		frappe.throw(_("Customer {0} is not a DMS vehicle customer.").format(name))

	if "customer_name" in payload:
		customer_name = (payload.get("customer_name") or "").strip()
		if not customer_name:
			frappe.throw(_("Customer name is required."))
		doc.customer_name = customer_name

	if "customer_type" in payload and payload.get("customer_type"):
		doc.customer_type = payload.get("customer_type")

	if "customer_group" in payload:
		customer_group = (payload.get("customer_group") or "").strip()
		if customer_group:
			if groups and customer_group not in groups:
				frappe.throw(_("Customer group must be a DMS vehicle customer group."))
			doc.customer_group = customer_group

	if "mobile_no" in payload:
		doc.mobile_no = (payload.get("mobile_no") or "").strip() or None
	if "email_id" in payload:
		doc.email_id = (payload.get("email_id") or "").strip() or None
	if "territory" in payload:
		doc.territory = (payload.get("territory") or "").strip() or None
	if "tax_id" in payload and hasattr(doc, "tax_id"):
		doc.tax_id = (payload.get("tax_id") or "").strip() or None
	if "website" in payload and hasattr(doc, "website"):
		doc.website = (payload.get("website") or "").strip() or None

	doc.save()
	frappe.db.commit()
	return {
		"ok": True,
		"name": doc.name,
		"customer_name": doc.customer_name,
		"customer_group": doc.customer_group,
		"mobile_no": doc.mobile_no,
		"email_id": doc.email_id,
	}


@frappe.whitelist()
def get_customer_360(customer: str):
	"""Return full Customer 360 payload (blueprint §4 tabs, all phases)."""
	ensure_crm_read(GATE)
	customer = (customer or "").strip()
	if not customer:
		frappe.throw(_("Customer is required."))
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found.").format(customer))

	cust = frappe.get_doc("Customer", customer)
	groups = _dms_customer_groups()
	if groups and cust.customer_group and cust.customer_group not in groups:
		frappe.throw(_("Customer {0} is not a DMS vehicle customer.").format(customer))

	identity = _identity(cust)

	leads = _safe_all(
		"DMS CRM Lead",
		filters={"customer": customer},
		fields=_fields_present(
			"DMS CRM Lead",
			[
				"name",
				"lead_name",
				"status",
				"priority",
				"source",
				"lead_owner",
				"next_action_due",
				"brand",
				"model",
				"lost_reason",
				"modified",
			],
		),
		limit=30,
	)
	opportunities = _safe_all(
		"DMS CRM Opportunity",
		filters={"customer": customer},
		fields=_fields_present(
			"DMS CRM Opportunity",
			[
				"name",
				"title",
				"stage",
				"status",
				"expected_value",
				"currency",
				"probability",
				"expected_close_date",
				"opportunity_owner",
				"brand",
				"model",
				"lost_reason",
				"modified",
			],
		),
		limit=30,
	)
	activities = _safe_all(
		"DMS CRM Activity",
		filters={"customer": customer},
		fields=_fields_present(
			"DMS CRM Activity",
			[
				"name",
				"activity_type",
				"subject",
				"status",
				"due_datetime",
				"completed_on",
				"assigned_to",
				"priority",
				"disposition",
				"modified",
			],
		),
		order_by=(
			"due_datetime desc, modified desc"
			if frappe.db.exists("DocType", "DMS CRM Activity")
			and frappe.get_meta("DMS CRM Activity").has_field("due_datetime")
			else "modified desc"
		),
		limit=40,
	)
	cases = _safe_all(
		"DMS CRM Case",
		filters={"customer": customer},
		fields=_fields_present(
			"DMS CRM Case",
			[
				"name",
				"subject",
				"category",
				"priority",
				"status",
				"case_owner",
				"vehicle_vin",
				"response_deadline",
				"sla_breached",
				"root_cause",
				"resolution",
				"modified",
			],
		),
		limit=30,
	)

	vehicles = _customer_vehicles(customer)
	vehicle_history = _vehicle_ownership_history(customer)
	contacts = _customer_contacts(customer)
	appointments = _appointments(customer)
	job_cards = _job_cards(customer)
	estimates = _service_estimates(customer)
	follow_ups = _follow_ups(customer)
	deliveries = _deliveries(customer)
	finance = _finance_summary(customer)
	campaigns = _campaigns(customer)
	loyalty = _loyalty_value(
		customer,
		finance=finance,
		job_cards=job_cards,
		opportunities=opportunities,
		follow_ups=follow_ups,
		deliveries=deliveries,
	)
	audit = _audit_trail(customer)
	communications = _communications_extra(customer)
	retention = _retention_status(job_cards, follow_ups)

	# Organizations: company-type customers + linked contact companies
	organizations = []
	if (cust.customer_type or "") == "Company":
		organizations.append(
			{
				"name": cust.name,
				"organization_name": cust.customer_name,
				"relationship": "Account",
				"industry": identity.get("industry"),
				"territory": cust.territory,
			}
		)
	seen_orgs = {cust.customer_name}
	for c in contacts:
		co = (c.get("company_name") or "").strip()
		if co and co not in seen_orgs:
			seen_orgs.add(co)
			organizations.append(
				{
					"name": co,
					"organization_name": co,
					"relationship": c.get("org_role") or "Related company",
					"contact": c.get("full_name"),
				}
			)

	summary = {
		"vehicles": len(vehicles),
		"vehicles_history": len(vehicle_history),
		"contacts": len(contacts),
		"organizations": len(organizations),
		"leads_total": len(leads),
		"leads_open": sum(1 for r in leads if (r.get("status") or "") in OPEN_LEAD_STATUSES),
		"opportunities_total": len(opportunities),
		"opportunities_open": sum(1 for r in opportunities if (r.get("status") or "") in OPEN_OPP_STATUSES),
		"activities_total": len(activities),
		"activities_open": sum(1 for r in activities if (r.get("status") or "") in OPEN_ACTIVITY_STATUSES),
		"cases_total": len(cases),
		"cases_open": sum(1 for r in cases if (r.get("status") or "") in OPEN_CASE_STATUSES),
		"appointments": len(appointments),
		"job_cards": len(job_cards),
		"follow_ups": len(follow_ups),
		"deliveries": len(deliveries),
		"campaigns": len(campaigns),
		"pipeline_value": sum(
			flt(r.get("expected_value")) for r in opportunities if (r.get("status") or "") in OPEN_OPP_STATUSES
		),
		"outstanding": finance.get("outstanding") or 0,
		"lifetime_value": loyalty.get("lifetime_value") or 0,
		"loyalty_tier": loyalty.get("loyalty_tier"),
		"retention_status": retention.get("status"),
		"next_service_due_date": retention.get("next_service_due_date"),
	}

	return {
		"customer": identity,
		"summary": summary,
		"contacts": contacts,
		"organizations": organizations,
		"vehicles": vehicles,
		"vehicle_history": vehicle_history,
		"leads": leads,
		"opportunities": opportunities,
		"activities": activities,
		"cases": cases,
		"appointments": appointments,
		"job_cards": job_cards,
		"estimates": estimates,
		"follow_ups": follow_ups,
		"deliveries": deliveries,
		"communications": communications,
		"campaigns": campaigns,
		"finance": finance,
		"loyalty": loyalty,
		"retention": retention,
		"audit": audit,
		"phases": {
			"overview": True,
			"identity": True,
			"organizations": True,
			"vehicles": True,
			"sales": True,
			"aftersales": True,
			"communications": True,
			"cases": True,
			"campaigns": True,  # membership when campaign doctypes exist
			"finance": True,
			"loyalty": True,
			"audit": True,
		},
	}


@frappe.whitelist()
def find_customer_duplicates(customer: str):
	"""Blueprint §4.3 — warn on likely duplicates by mobile / email / tax_id."""
	ensure_crm_read(GATE)
	customer = (customer or "").strip()
	if not customer or not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer is required."))

	cust = frappe.get_doc("Customer", customer)
	groups = _dms_customer_groups()
	matches = []
	seen = {customer}

	def _add(rows, reason):
		for r in rows:
			if r.name in seen:
				continue
			if groups and r.customer_group and r.customer_group not in groups:
				continue
			seen.add(r.name)
			matches.append(
				{
					"name": r.name,
					"customer_name": r.customer_name,
					"mobile_no": r.mobile_no,
					"email_id": r.email_id,
					"tax_id": getattr(r, "tax_id", None),
					"customer_group": r.customer_group,
					"reason": reason,
				}
			)

	if cust.mobile_no:
		_add(
			frappe.get_all(
				"Customer",
				filters={"mobile_no": cust.mobile_no, "name": ["!=", customer]},
				fields=["name", "customer_name", "mobile_no", "email_id", "tax_id", "customer_group"],
				limit_page_length=10,
			),
			"Same mobile",
		)
	if cust.email_id:
		_add(
			frappe.get_all(
				"Customer",
				filters={"email_id": cust.email_id, "name": ["!=", customer]},
				fields=["name", "customer_name", "mobile_no", "email_id", "tax_id", "customer_group"],
				limit_page_length=10,
			),
			"Same email",
		)
	tax_id = getattr(cust, "tax_id", None)
	if tax_id and frappe.get_meta("Customer").has_field("tax_id"):
		_add(
			frappe.get_all(
				"Customer",
				filters={"tax_id": tax_id, "name": ["!=", customer]},
				fields=["name", "customer_name", "mobile_no", "email_id", "tax_id", "customer_group"],
				limit_page_length=10,
			),
			"Same tax ID",
		)

	return {"customer": customer, "duplicates": matches, "count": len(matches)}


# DocTypes whose customer Link field should move from duplicate → master on merge
_MERGE_CUSTOMER_LINK_MAP = (
	("DMS CRM Lead", "customer"),
	("DMS CRM Opportunity", "customer"),
	("DMS CRM Activity", "customer"),
	("DMS CRM Case", "customer"),
	("DMS CRM Booking", "customer"),
	("DMS CRM Test Drive", "customer"),
	("DMS CRM Delivery Readiness", "customer"),
	("DMS CRM Sales Appointment", "customer"),
	("DMS CRM Campaign Member", "customer"),
	("DMS CRM Referral", "referrer_customer"),
	("DMS CRM Referral", "referred_customer"),
	("DMS CRM Account", "customer"),
	("DMS CRM Customer Preference", "customer"),
	("DMS CRM Service Due", "customer"),
	("DMS CRM Deferred Work", "customer"),
	("DMS CRM Loyalty Adjustment", "customer"),
	("Quotation", "party_name"),
	("Sales Order", "customer"),
	("Sales Invoice", "customer"),
	("Payment Entry", "party"),
	("Contact", "customer"),  # may not exist — skip if no field
	("Address", "link_name"),  # handled specially via Dynamic Link
)


def _can_merge_customers() -> bool:
	roles = set(frappe.get_roles())
	return bool(roles & {"System Manager", "DMS CRM Manager", "Sales Manager"})


@frappe.whitelist()
def merge_customers(master: str, duplicate: str, field_overrides=None, confirm_different_vehicles=0):
	"""Blueprint §4.3 — audited customer merge with surviving master.

	Moves CRM / sales links from ``duplicate`` onto ``master``, optionally
	copies blank master fields from the duplicate, then deactivates the
	duplicate (never hard-deletes). Requires DMS CRM Manager (or System Manager).
	"""
	ensure_crm_write(GATE)
	if not _can_merge_customers():
		frappe.throw(_("Only CRM Managers may merge customers."), frappe.PermissionError)

	master = (master or "").strip()
	duplicate = (duplicate or "").strip()
	if not master or not duplicate:
		frappe.throw(_("Master and duplicate customers are required."))
	if master == duplicate:
		frappe.throw(_("Master and duplicate must be different customers."))
	if not frappe.db.exists("Customer", master) or not frappe.db.exists("Customer", duplicate):
		frappe.throw(_("Both customers must exist."))

	overrides = parse_json(field_overrides) or {}
	master_doc = frappe.get_doc("Customer", master)
	dup_doc = frappe.get_doc("Customer", duplicate)

	# Never silently merge two different vehicle owners (Blueprint §4.3)
	master_vins = set()
	dup_vins = set()
	if frappe.db.exists("DocType", "VIN No"):
		vin_filters_m = {"customer": master}
		vin_filters_d = {"customer": duplicate}
		# field may be customer or owner depending on schema
		meta = frappe.get_meta("VIN No")
		cust_field = "customer" if meta.has_field("customer") else (
			"customer_name" if meta.has_field("customer_name") else None
		)
		if cust_field:
			master_vins = set(
				frappe.get_all("VIN No", filters={cust_field: master}, pluck="name")
			)
			dup_vins = set(
				frappe.get_all("VIN No", filters={cust_field: duplicate}, pluck="name")
			)
	if master_vins and dup_vins and master_vins != dup_vins and not cint(confirm_different_vehicles):
		frappe.throw(
			_(
				"These customers own different vehicles. Confirm merge only after human review "
				"(pass confirm_different_vehicles=1)."
			)
		)

	moved = []
	for doctype, fieldname in _MERGE_CUSTOMER_LINK_MAP:
		if not frappe.db.exists("DocType", doctype):
			continue
		meta = frappe.get_meta(doctype)
		if not meta.has_field(fieldname):
			continue
		# Payment Entry party must be Customer type
		filters = {fieldname: duplicate}
		if doctype == "Payment Entry" and meta.has_field("party_type"):
			filters["party_type"] = "Customer"
		if doctype == "Quotation" and meta.has_field("quotation_to"):
			filters["quotation_to"] = "Customer"
		names = frappe.get_all(doctype, filters=filters, pluck="name")
		for name in names:
			frappe.db.set_value(doctype, name, fieldname, master, update_modified=False)
			moved.append({"doctype": doctype, "name": name, "field": fieldname})

	# Dynamic Link: Address / Contact links
	for dl_dt in ("Address", "Contact"):
		if not frappe.db.exists("DocType", "Dynamic Link"):
			break
		links = frappe.get_all(
			"Dynamic Link",
			filters={"link_doctype": "Customer", "link_name": duplicate, "parenttype": dl_dt},
			fields=["name", "parent"],
		)
		for link in links:
			frappe.db.set_value("Dynamic Link", link.name, "link_name", master, update_modified=False)
			moved.append({"doctype": dl_dt, "name": link.parent, "field": "Dynamic Link"})

	# Field-by-field: fill blank master fields from duplicate, or apply overrides
	copyable = [
		"mobile_no",
		"email_id",
		"customer_type",
		"customer_group",
		"territory",
		"tax_id",
		"customer_primary_contact",
		"customer_primary_address",
		"default_currency",
		"language",
	]
	copied_fields = []
	for fieldname in copyable:
		if not master_doc.meta.has_field(fieldname):
			continue
		override = overrides.get(fieldname)
		if override is not None and override != "":
			master_doc.set(fieldname, override)
			copied_fields.append(fieldname)
			continue
		if not master_doc.get(fieldname) and dup_doc.get(fieldname):
			master_doc.set(fieldname, dup_doc.get(fieldname))
			copied_fields.append(fieldname)

	master_doc.flags.ignore_permissions = True
	master_doc.save()

	# Deactivate duplicate — never hard-delete (Blueprint §20.3)
	dup_doc.disabled = 1
	if dup_doc.meta.has_field("customer_name"):
		# Keep searchable but mark merged
		if " [MERGED]" not in (dup_doc.customer_name or ""):
			dup_doc.customer_name = f"{dup_doc.customer_name} [MERGED → {master}]"
	dup_doc.flags.ignore_permissions = True
	dup_doc.save()

	# Immutable merge log on both records
	summary = (
		f"Merged customer {duplicate} into {master}. "
		f"Moved {len(moved)} linked records. Copied fields: {', '.join(copied_fields) or 'none'}."
	)
	for target in (master, duplicate):
		frappe.get_doc(
			{
				"doctype": "Comment",
				"comment_type": "Info",
				"reference_doctype": "Customer",
				"reference_name": target,
				"content": summary,
			}
		).insert(ignore_permissions=True)

	frappe.db.commit()
	return {
		"master": master,
		"duplicate": duplicate,
		"moved": moved,
		"moved_count": len(moved),
		"copied_fields": copied_fields,
		"message": summary,
	}
