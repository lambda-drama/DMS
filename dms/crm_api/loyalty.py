# Copyright (c) 2026, Mania and contributors
"""Loyalty, referral & customer value — dms.crm_api.loyalty (blueprint §16).

Architecture:
- Points balance → ERPNext Loyalty Program / Loyalty Point Entry (when configured)
- Tier benefits / fleet rules → DMS CRM Loyalty Settings (+ optional Pricing Rule link)
- Referral lifecycle → DMS CRM Referral
- Health / LTV → computed from sales + aftersales + engagement
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, cint, date_diff, flt, getdate, now_datetime, today

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

SETTINGS = "DMS CRM Loyalty Settings"
ADJUSTMENT = "DMS CRM Loyalty Adjustment"
REFERRAL = "DMS CRM Referral"


def _settings():
	try:
		return frappe.get_cached_doc(SETTINGS)
	except Exception:
		return None


def _erpnext_points(customer: str) -> dict:
	"""Read ERPNext loyalty balance when available."""
	out = {
		"points": 0,
		"loyalty_program": None,
		"loyalty_program_tier": None,
		"source": "none",
	}
	if not frappe.db.exists("DocType", "Loyalty Point Entry"):
		return out
	cust = frappe.db.get_value(
		"Customer",
		customer,
		["loyalty_program", "loyalty_program_tier"]
		if frappe.get_meta("Customer").has_field("loyalty_program")
		else ["name"],
		as_dict=True,
	)
	if cust and getattr(cust, "loyalty_program", None):
		out["loyalty_program"] = cust.loyalty_program
		out["loyalty_program_tier"] = getattr(cust, "loyalty_program_tier", None)

	try:
		# Prefer ERPNext helper if present
		from erpnext.accounts.doctype.loyalty_program.loyalty_program import (
			get_loyalty_program_details_with_points,
		)

		program = out.get("loyalty_program")
		if not program:
			raise ValueError("No loyalty program assigned to customer")
		company = None
		if program:
			company = frappe.db.get_value("Loyalty Program", program, "company")
		company = (
			company
			or frappe.defaults.get_user_default("Company")
			or frappe.db.get_default("company")
		)
		details = get_loyalty_program_details_with_points(
			customer,
			loyalty_program=program,
			company=company,
			silent=True,
		)
		if details and details.get("loyalty_program"):
			out["points"] = flt(details.get("loyalty_points") or details.get("total_points"))
			out["loyalty_program"] = out["loyalty_program"] or details.get("loyalty_program")
			out["loyalty_program_tier"] = out["loyalty_program_tier"] or details.get(
				"tier_name"
			)
			out["source"] = "erpnext"
			return out
	except Exception:
		pass

	# Fallback SQL
	try:
		pts = frappe.db.sql(
			"""
			SELECT COALESCE(SUM(loyalty_points), 0)
			FROM `tabLoyalty Point Entry`
			WHERE customer = %s
			  AND (expiry_date IS NULL OR expiry_date >= %s)
			""",
			(customer, today()),
		)[0][0]
		out["points"] = flt(pts)
		out["source"] = "erpnext_entries" if pts else "erpnext_empty"
	except Exception:
		pass
	return out


def _tier_from_settings(ltv: float, visits: int, scope: str = "Retail") -> dict | None:
	s = _settings()
	if not s or not s.tiers:
		return None
	best = None
	for row in s.tiers:
		if row.program_scope not in (scope, "Both", None, ""):
			continue
		if flt(ltv) < flt(row.min_lifetime_value):
			continue
		if cint(visits) < cint(row.min_service_visits):
			continue
		if best is None or flt(row.min_lifetime_value) >= flt(best.min_lifetime_value):
			best = row
	if not best:
		return None
	return {
		"tier_name": best.tier_name,
		"service_discount_pct": flt(best.service_discount_pct),
		"priority_booking": cint(best.priority_booking),
		"event_access": cint(best.event_access),
		"referral_bonus_points": cint(best.referral_bonus_points),
		"pricing_rule": best.pricing_rule,
	}


def compute_customer_value(customer: str) -> dict:
	"""§16.3 — lifetime revenue, retention, health, repurchase, churn."""
	if not customer or not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer is required."))

	# Finance from SI
	invoiced = 0.0
	if frappe.db.exists("DocType", "Sales Invoice"):
		invoiced = flt(
			frappe.db.sql(
				"""
				SELECT COALESCE(SUM(base_grand_total), 0)
				FROM `tabSales Invoice`
				WHERE customer = %s AND docstatus = 1 AND is_return = 0
				""",
				customer,
			)[0][0]
		)

	job_cards = []
	if frappe.db.exists("DocType", "DMS Job Card"):
		job_cards = frappe.get_all(
			"DMS Job Card",
			filters={"customer": customer, "docstatus": ["<", 2]},
			fields=["name", "total_amount", "status", "modified", "creation"],
			limit=200,
		)
	aftersales = sum(flt(j.get("total_amount")) for j in job_cards)
	ltv = invoiced + aftersales

	# Gross contribution: revenue - approximate COGS if available on SI items (soft)
	gross = invoiced  # placeholder until cost available; keep equal to sales for now
	if frappe.db.exists("DocType", "Sales Invoice Item"):
		try:
			cost = flt(
				frappe.db.sql(
					"""
					SELECT COALESCE(SUM(sii.incoming_rate * sii.qty), 0)
					FROM `tabSales Invoice Item` sii
					INNER JOIN `tabSales Invoice` si ON si.name = sii.parent
					WHERE si.customer = %s AND si.docstatus = 1 AND si.is_return = 0
					""",
					customer,
				)[0][0]
			)
			if cost:
				gross = invoiced - cost + aftersales
		except Exception:
			pass

	cases_open = 0
	if frappe.db.exists("DocType", "DMS CRM Case"):
		cases_open = frappe.db.count(
			"DMS CRM Case",
			{"customer": customer, "status": ["not in", ["Resolved", "Closed"]]},
		)

	last_touch = None
	for dt, field in (
		("DMS CRM Activity", "modified"),
		("DMS Job Card", "modified"),
		("Sales Invoice", "modified"),
	):
		if not frappe.db.exists("DocType", dt):
			continue
		filters = {"customer": customer} if dt != "Sales Invoice" else {"customer": customer, "docstatus": 1}
		row = frappe.get_all(dt, filters=filters, fields=[field], order_by=f"{field} desc", limit=1)
		if row:
			ts = row[0].get(field)
			if not last_touch or str(ts) > str(last_touch):
				last_touch = ts

	inactive_days = date_diff(today(), getdate(last_touch)) if last_touch else 999
	s = _settings()
	at_risk_days = cint(getattr(s, "at_risk_inactive_days", None) or 90)
	lapsed_days = cint(getattr(s, "lapsed_inactive_days", None) or 180)

	# Service due overdue count
	missed = 0
	if frappe.db.exists("DocType", "DMS CRM Service Due"):
		missed = frappe.db.count(
			"DMS CRM Service Due",
			{"customer": customer, "classification": ["in", ["Overdue", "Lapsed"]]},
		)

	if inactive_days >= lapsed_days:
		retention = "Lapsed"
	elif inactive_days >= at_risk_days or missed >= cint(getattr(s, "churn_missed_services", None) or 2):
		retention = "At Risk"
	elif job_cards or invoiced:
		retention = "Active"
	else:
		retention = "Inactive"

	# Relationship health 0-100
	health = 50
	if retention == "Active":
		health += 20
	elif retention == "At Risk":
		health -= 15
	elif retention == "Lapsed":
		health -= 30
	if cases_open:
		health -= min(25, cases_open * 8)
	if len(job_cards) >= 3:
		health += 10
	if invoiced >= 20000:
		health += 10
	health = max(0, min(100, health))

	churn_risk = "High" if retention in ("Lapsed", "At Risk") or missed >= 2 else (
		"Medium" if inactive_days > 45 else "Low"
	)

	opps = []
	if frappe.db.exists("DocType", "DMS CRM Opportunity"):
		opps = frappe.get_all(
			"DMS CRM Opportunity",
			filters={"customer": customer},
			fields=["status", "stage"],
			limit=50,
		)
	won = sum(1 for o in opps if (o.get("status") or "") == "Won" or (o.get("stage") or "") == "Won")
	repurchase = "High" if won or (len(job_cards) >= 3 and health >= 70) else (
		"Medium" if job_cards or opps else "Low"
	)

	scope = "Fleet" if frappe.db.get_value("Customer", customer, "customer_type") == "Company" else "Retail"
	tier_info = _tier_from_settings(ltv, len(job_cards), scope) or {}
	erp = _erpnext_points(customer)
	tier = erp.get("loyalty_program_tier") or tier_info.get("tier_name")
	if not tier:
		# heuristic fallback matching previous 360
		if ltv >= 50000 or len(job_cards) >= 10:
			tier = "Platinum"
		elif ltv >= 20000 or len(job_cards) >= 5:
			tier = "Gold"
		elif ltv >= 5000 or len(job_cards) >= 2:
			tier = "Silver"
		elif ltv > 0 or job_cards:
			tier = "Bronze"
		else:
			tier = "Prospect"

	return {
		"customer": customer,
		"customer_name": customer_display_name(customer),
		"lifetime_revenue": ltv,
		"sales_revenue": invoiced,
		"aftersales_revenue": aftersales,
		"gross_contribution": gross,
		"retention_status": retention,
		"relationship_health": health,
		"repurchase_propensity": repurchase,
		"churn_risk": churn_risk,
		"inactive_days": inactive_days,
		"missed_services": missed,
		"open_cases": cases_open,
		"service_visits": len(job_cards),
		"loyalty_tier": tier,
		"tier_benefits": tier_info,
		"points": erp.get("points") or 0,
		"points_source": erp.get("source"),
		"loyalty_program": erp.get("loyalty_program"),
		"program_scope": scope,
		"last_engagement_on": last_touch,
	}


# ─── Whitelisted ─────────────────────────────────────────────────────────────


@frappe.whitelist()
def get_customer_loyalty(customer):
	ensure_crm_read("Customer")
	value = compute_customer_value(customer)
	referrals = []
	if frappe.db.exists("DocType", REFERRAL):
		referrals = frappe.get_all(
			REFERRAL,
			filters={"referrer_customer": customer},
			fields=[
				"name",
				"referred_name",
				"referred_customer",
				"status",
				"reward_points",
				"reward_paid",
				"modified",
			],
			order_by="modified desc",
			limit=30,
		)
	adjustments = []
	if frappe.db.exists("DocType", ADJUSTMENT):
		adjustments = frappe.get_all(
			ADJUSTMENT,
			filters={"customer": customer},
			fields=["name", "adjustment_type", "points", "status", "reason", "modified"],
			order_by="modified desc",
			limit=20,
		)
	value["referrals"] = referrals
	value["referral_count"] = len(referrals)
	value["adjustments"] = adjustments
	return value


@frappe.whitelist()
def get_loyalty_settings():
	ensure_crm_read(SETTINGS)
	doc = frappe.get_single(SETTINGS)
	return doc.as_dict()


@frappe.whitelist()
def update_loyalty_settings(data=None):
	ensure_crm_write(SETTINGS)
	payload = parse_json(data)
	doc = frappe.get_single(SETTINGS)
	for key in (
		"enable_loyalty",
		"use_erpnext_loyalty_program",
		"retail_loyalty_program",
		"fleet_loyalty_program",
		"referral_reward_event",
		"referral_reward_points",
		"prevent_self_referral",
		"at_risk_inactive_days",
		"lapsed_inactive_days",
		"churn_missed_services",
	):
		if key in payload:
			doc.set(key, payload.get(key))
	if "tiers" in payload:
		doc.set("tiers", [])
		for row in payload.get("tiers") or []:
			doc.append("tiers", row)
	doc.save()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def create_loyalty_adjustment(data=None):
	ensure_crm_create(ADJUSTMENT)
	payload = parse_json(data)
	if not payload.get("customer") or not payload.get("points") or not payload.get("reason"):
		frappe.throw(_("Customer, points and reason are required."))
	doc = frappe.get_doc(
		{
			"doctype": ADJUSTMENT,
			"customer": payload["customer"],
			"points": cint(payload["points"]),
			"adjustment_type": payload.get("adjustment_type") or "Credit",
			"reason": payload["reason"],
			"notes": payload.get("notes"),
			"status": "Pending",
		}
	)
	doc.insert()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def decide_loyalty_adjustment(name, decision=None):
	ensure_crm_write(ADJUSTMENT)
	decision = (decision or "").strip().title()
	if decision not in ("Approved", "Rejected"):
		frappe.throw(_("Decision must be Approved or Rejected."))
	doc = frappe.get_doc(ADJUSTMENT, name)
	doc.status = decision
	doc.save()
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def get_loyalty_adjustments(status=None, customer=None, limit=50, offset=0):
	ensure_crm_read(ADJUSTMENT)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	if customer:
		filters["customer"] = customer
	rows = frappe.get_all(
		ADJUSTMENT,
		filters=filters,
		fields=[
			"name",
			"customer",
			"adjustment_type",
			"points",
			"status",
			"reason",
			"requested_by",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for r in rows:
		r["customer_name"] = customer_display_name(r.get("customer"))
		r["requester_name"] = user_display_name(r.get("requested_by"))
	return {"data": rows}


# ─── Referrals ───────────────────────────────────────────────────────────────


@frappe.whitelist()
def get_referrals(status=None, search=None, limit=50, offset=0):
	ensure_crm_read(REFERRAL)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	search = (search or "").strip()
	if search:
		or_filters = [
			["referred_name", "like", f"%{search}%"],
			["referrer_customer", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
		]
	rows = frappe.get_all(
		REFERRAL,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"referrer_customer",
			"referred_name",
			"referred_customer",
			"status",
			"reward_points",
			"reward_paid",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for r in rows:
		r["referrer_name"] = customer_display_name(r.get("referrer_customer"))
	# Top advocates
	advocates = frappe.db.sql(
		"""
		SELECT referrer_customer, COUNT(*) AS cnt,
			SUM(CASE WHEN status IN ('Won','Delivered','Rewarded') THEN 1 ELSE 0 END) AS converted
		FROM `tabDMS CRM Referral`
		GROUP BY referrer_customer
		ORDER BY converted DESC, cnt DESC
		LIMIT 10
		""",
		as_dict=True,
	)
	for a in advocates:
		a["referrer_name"] = customer_display_name(a.referrer_customer)
	return {
		"data": rows,
		"advocates": advocates,
		"total": frappe.db.count(REFERRAL, filters=filters),
	}


@frappe.whitelist()
def get_referral(name):
	ensure_crm_read(REFERRAL)
	data = frappe.get_doc(REFERRAL, name).as_dict()
	data["referrer_name"] = customer_display_name(data.get("referrer_customer"))
	return data


@frappe.whitelist()
def create_referral(data=None):
	ensure_crm_create(REFERRAL)
	payload = parse_json(data)
	if not payload.get("referrer_customer") or not payload.get("referred_name"):
		frappe.throw(_("Referrer and referred prospect name are required."))
	doc = frappe.new_doc(REFERRAL)
	for key, value in payload.items():
		if key in (
			"referrer_customer",
			"referred_name",
			"referred_lead",
			"referred_opportunity",
			"referred_customer",
			"status",
			"reward_event",
			"reward_points",
			"source_channel",
			"notes",
			"company",
			"branch",
		):
			doc.set(key, value)
	doc.insert()
	frappe.db.commit()
	return get_referral(doc.name)


@frappe.whitelist()
def update_referral(name, data=None):
	ensure_crm_write(REFERRAL)
	payload = parse_json(data)
	doc = frappe.get_doc(REFERRAL, name)
	for key, value in payload.items():
		if key in (
			"referred_name",
			"referred_lead",
			"referred_opportunity",
			"referred_customer",
			"status",
			"reward_event",
			"reward_points",
			"source_channel",
			"notes",
		):
			doc.set(key, value)
	doc.save()
	frappe.db.commit()
	return get_referral(doc.name)


@frappe.whitelist()
def mark_referral_event(name, event=None):
	"""Advance referral toward reward when booking/payment/delivery happens."""
	ensure_crm_write(REFERRAL)
	doc = frappe.get_doc(REFERRAL, name)
	event = (event or "").strip()
	status_map = {
		"Lead Converted": "Lead Created",
		"Booking": "In Opportunity",
		"Full Payment": "Won",
		"Delivery": "Delivered",
	}
	if event in status_map and doc.status not in ("Rewarded", "Disqualified", "Duplicate"):
		doc.status = status_map[event]
	# Pay reward when event matches configured gate
	s = _settings()
	gate = (s.referral_reward_event if s else None) or "Delivery"
	if event == gate or (event == "Delivery" and gate == "Delivery"):
		_pay_referral_reward(doc)
	else:
		doc.save()
		frappe.db.commit()
	return get_referral(doc.name)


def _pay_referral_reward(doc):
	if cint(doc.reward_paid):
		return
	points = cint(doc.reward_points)
	if not points:
		s = _settings()
		points = cint(getattr(s, "referral_reward_points", None) or 100)
		doc.reward_points = points

	# Create pending adjustment for audit; auto-approve if manager path
	adj = frappe.get_doc(
		{
			"doctype": ADJUSTMENT,
			"customer": doc.referrer_customer,
			"adjustment_type": "Credit",
			"points": points,
			"reason": f"Referral reward for {doc.name} ({doc.referred_name})",
			"status": "Approved",
		}
	)
	adj.insert(ignore_permissions=True)
	# on_update posts when Approved — ensure trigger
	if adj.status != "Posted":
		adj.status = "Approved"
		adj.save(ignore_permissions=True)

	doc.reward_paid = 1
	doc.rewarded_on = now_datetime()
	doc.status = "Rewarded"
	doc.save(ignore_permissions=True)
	frappe.db.commit()


@frappe.whitelist()
def get_referral_form_options():
	ensure_crm_read(REFERRAL)
	meta = frappe.get_meta(REFERRAL)

	def opts(f):
		df = meta.get_field(f)
		return [o for o in (df.options or "").split("\n") if o.strip()] if df else []

	return {
		"statuses": opts("status"),
		"reward_events": opts("reward_event"),
		"channels": opts("source_channel"),
	}


# ─── Setup / enrollment / sync (§16 configure) ───────────────────────────────

RETAIL_PROGRAM_NAME = "DMS Retail Loyalty"
FLEET_PROGRAM_NAME = "DMS Fleet Loyalty"

# min_spent mirrors CRM LTV thresholds; collection_factor = amount spent per 1 LP
_DEFAULT_COLLECTION = (
	("Bronze", 0, 100),
	("Silver", 5000, 90),
	("Gold", 20000, 80),
	("Platinum", 50000, 70),
)


def _default_company(company=None):
	return (
		company
		or frappe.defaults.get_user_default("Company")
		or frappe.db.get_default("company")
		or (frappe.get_all("Company", pluck="name", limit=1) or [None])[0]
	)


def _ensure_loyalty_program(name: str, company: str) -> str:
	if frappe.db.exists("Loyalty Program", name):
		return name
	doc = frappe.get_doc(
		{
			"doctype": "Loyalty Program",
			"loyalty_program_name": name,
			"loyalty_program_type": "Multiple Tier Program",
			"from_date": today(),
			"company": company,
			"conversion_factor": 1,
			"expiry_duration": 365,
			"auto_opt_in": 0,
			"collection_rules": [
				{
					"tier_name": tier,
					"min_spent": min_spent,
					"collection_factor": factor,
				}
				for tier, min_spent, factor in _DEFAULT_COLLECTION
			],
		}
	)
	cc = frappe.db.get_value(
		"Cost Center", {"company": company, "is_group": 0}, "name"
	)
	if cc and doc.meta.has_field("cost_center"):
		doc.cost_center = cc
	doc.insert(ignore_permissions=True)
	return doc.name


def _pricing_rule_title(tier_name: str) -> str:
	return f"DMS Loyalty · {tier_name} Service Discount"


def _ensure_tier_pricing_rule(tier_name: str, discount_pct: float, company: str) -> str | None:
	"""Transaction Pricing Rule gated on Customer.loyalty_program_tier."""
	if flt(discount_pct) <= 0 or not frappe.db.exists("DocType", "Pricing Rule"):
		return None
	title = _pricing_rule_title(tier_name)
	existing = frappe.db.get_value("Pricing Rule", {"title": title}, "name")
	if existing:
		frappe.db.set_value(
			"Pricing Rule",
			existing,
			{
				"discount_percentage": flt(discount_pct),
				"disable": 0,
				"company": company,
			},
			update_modified=False,
		)
		return existing

	condition = (
		f'frappe.db.get_value("Customer", doc.get("customer"), "loyalty_program_tier") '
		f'== "{tier_name}"'
	)
	doc = frappe.get_doc(
		{
			"doctype": "Pricing Rule",
			"title": title,
			"apply_on": "Transaction",
			"price_or_product_discount": "Price",
			"selling": 1,
			"buying": 0,
			"rate_or_discount": "Discount Percentage",
			"discount_percentage": flt(discount_pct),
			"company": company,
			"valid_from": today(),
			"condition": condition,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def setup_loyalty_engine(company=None, create_pricing_rules=True):
	"""Create ERPNext programs, Pricing Rules, and wire DMS CRM Loyalty Settings."""
	if not frappe.db.exists("DocType", "Loyalty Program"):
		frappe.throw(_("ERPNext Loyalty Program DocType is not installed."))

	company = _default_company(company)
	if not company:
		frappe.throw(_("Company is required to set up loyalty programs."))

	retail = _ensure_loyalty_program(RETAIL_PROGRAM_NAME, company)
	fleet = _ensure_loyalty_program(FLEET_PROGRAM_NAME, company)

	settings = frappe.get_single(SETTINGS)
	settings.enable_loyalty = 1
	settings.use_erpnext_loyalty_program = 1
	settings.retail_loyalty_program = retail
	settings.fleet_loyalty_program = fleet
	# ensure default tiers exist via validate
	if not settings.tiers:
		settings.validate()

	linked = []
	if cint(create_pricing_rules):
		for row in settings.tiers or []:
			rule = _ensure_tier_pricing_rule(
				row.tier_name, flt(row.service_discount_pct), company
			)
			if rule:
				row.pricing_rule = rule
				linked.append({"tier": row.tier_name, "pricing_rule": rule})

	settings.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"company": company,
		"retail_loyalty_program": retail,
		"fleet_loyalty_program": fleet,
		"pricing_rules": linked,
		"tiers": [r.tier_name for r in (settings.tiers or [])],
	}


def resolve_program_for_customer(customer: str) -> str | None:
	s = _settings()
	if not s:
		return None
	ctype = frappe.db.get_value("Customer", customer, "customer_type")
	if ctype == "Company":
		return s.fleet_loyalty_program or s.retail_loyalty_program
	return s.retail_loyalty_program or s.fleet_loyalty_program


def _sync_preference_tier(customer: str, tier: str | None):
	if not tier or not frappe.db.exists("DocType", "DMS CRM Customer Preference"):
		return
	# Preference options include Bronze; map Prospect → skip
	pref_tier = tier if tier in ("Bronze", "Standard", "Silver", "Gold", "Platinum") else None
	if tier == "Prospect":
		return
	if not pref_tier:
		pref_tier = "Bronze"
	name = frappe.db.get_value(
		"DMS CRM Customer Preference", {"customer": customer}, "name"
	)
	if name:
		frappe.db.set_value(
			"DMS CRM Customer Preference",
			name,
			"loyalty_tier",
			pref_tier,
			update_modified=False,
		)
	else:
		frappe.get_doc(
			{
				"doctype": "DMS CRM Customer Preference",
				"customer": customer,
				"loyalty_tier": pref_tier,
			}
		).insert(ignore_permissions=True)


def enroll_customer(customer: str, program: str | None = None, sync_tier: bool = True) -> dict:
	"""Assign ERPNext Loyalty Program + optional CRM tier from LTV."""
	if not customer or not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer is required."))
	if not frappe.get_meta("Customer").has_field("loyalty_program"):
		frappe.throw(_("Customer DocType has no loyalty_program field."))

	program = program or resolve_program_for_customer(customer)
	if not program:
		frappe.throw(_("No Loyalty Program configured. Run setup_loyalty_programs first."))

	updates = {"loyalty_program": program}
	tier = None
	if sync_tier:
		value = compute_customer_value(customer)
		tier = value.get("loyalty_tier")
		if tier and tier != "Prospect":
			updates["loyalty_program_tier"] = tier
			_sync_preference_tier(customer, tier)

	frappe.db.set_value("Customer", customer, updates, update_modified=False)
	return {
		"customer": customer,
		"loyalty_program": program,
		"loyalty_program_tier": tier,
	}


def sync_customer_loyalty_tier(customer: str) -> dict:
	"""Recompute CRM tier from LTV/visits and write to Customer + Preference."""
	value = compute_customer_value(customer)
	tier = value.get("loyalty_tier")
	program = value.get("loyalty_program") or resolve_program_for_customer(customer)
	updates = {}
	if program and frappe.get_meta("Customer").has_field("loyalty_program"):
		updates["loyalty_program"] = program
	if frappe.get_meta("Customer").has_field("loyalty_program_tier"):
		if tier and tier != "Prospect":
			updates["loyalty_program_tier"] = tier
		elif tier == "Prospect":
			updates["loyalty_program_tier"] = ""
	if updates:
		frappe.db.set_value("Customer", customer, updates, update_modified=False)
	_sync_preference_tier(customer, tier)
	return {
		"customer": customer,
		"loyalty_tier": tier,
		"loyalty_program": program,
		"points": value.get("points"),
	}


def get_service_discount_pct(customer: str) -> float:
	"""Tier service discount for aftersales invoicing (when Pricing Rule is ignored)."""
	s = _settings()
	if not s or not cint(getattr(s, "enable_loyalty", 0)):
		return 0.0
	tier = None
	if frappe.get_meta("Customer").has_field("loyalty_program_tier"):
		tier = frappe.db.get_value("Customer", customer, "loyalty_program_tier")
	if not tier:
		value = compute_customer_value(customer)
		tier = value.get("loyalty_tier")
		benefits = value.get("tier_benefits") or {}
		return flt(benefits.get("service_discount_pct"))
	for row in s.tiers or []:
		if row.tier_name == tier:
			return flt(row.service_discount_pct)
	return 0.0


@frappe.whitelist()
def setup_loyalty_programs(company=None, create_pricing_rules=1):
	ensure_crm_write(SETTINGS)
	return setup_loyalty_engine(
		company=company, create_pricing_rules=cint(create_pricing_rules)
	)


@frappe.whitelist()
def enroll_customer_in_loyalty(customer, program=None, sync_tier=1):
	ensure_crm_write("Customer")
	result = enroll_customer(customer, program=program or None, sync_tier=cint(sync_tier))
	frappe.db.commit()
	return result


@frappe.whitelist()
def enroll_customers_bulk(limit=200, only_unenrolled=1):
	"""Enroll customers into retail/fleet programs (batch)."""
	ensure_crm_write("Customer")
	limit = min(cint(limit) or 200, 2000)
	if cint(only_unenrolled) and frappe.get_meta("Customer").has_field("loyalty_program"):
		customers = frappe.get_all(
			"Customer",
			filters={"loyalty_program": ["is", "not set"]},
			pluck="name",
			limit=limit,
			order_by="modified desc",
		)
		if not customers:
			customers = [
				r[0]
				for r in frappe.db.sql(
					"""
					SELECT name FROM `tabCustomer`
					WHERE IFNULL(loyalty_program, '') = ''
					ORDER BY modified DESC
					LIMIT %s
					""",
					limit,
				)
			]
	else:
		customers = frappe.get_all(
			"Customer",
			pluck="name",
			limit=limit,
			order_by="modified desc",
		)
	enrolled = 0
	errors = []
	for name in customers:
		try:
			enroll_customer(name, sync_tier=True)
			enrolled += 1
		except Exception as e:
			errors.append({"customer": name, "error": str(e)})
	frappe.db.commit()
	return {"enrolled": enrolled, "attempted": len(customers), "errors": errors[:20]}


@frappe.whitelist()
def sync_loyalty_tiers(limit=200, customer=None):
	ensure_crm_write("Customer")
	if customer:
		out = sync_customer_loyalty_tier(customer)
		frappe.db.commit()
		return {"synced": 1, "results": [out]}
	limit = min(cint(limit) or 200, 2000)
	names = frappe.get_all(
		"Customer",
		filters={"loyalty_program": ["is", "set"]}
		if frappe.get_meta("Customer").has_field("loyalty_program")
		else {},
		pluck="name",
		limit=limit,
		order_by="modified desc",
	)
	results = []
	for name in names:
		try:
			results.append(sync_customer_loyalty_tier(name))
		except Exception as e:
			results.append({"customer": name, "error": str(e)})
	frappe.db.commit()
	return {"synced": len([r for r in results if not r.get("error")]), "results": results[:50]}


@frappe.whitelist()
def get_loyalty_setup_status():
	ensure_crm_read(SETTINGS)
	s = _settings()
	company = _default_company()
	retail = getattr(s, "retail_loyalty_program", None) if s else None
	fleet = getattr(s, "fleet_loyalty_program", None) if s else None
	enrolled = 0
	if frappe.get_meta("Customer").has_field("loyalty_program"):
		enrolled = frappe.db.sql(
			"""
			SELECT COUNT(*) FROM `tabCustomer`
			WHERE IFNULL(loyalty_program, '') != ''
			"""
		)[0][0]
	rules = []
	if s:
		for row in s.tiers or []:
			rules.append(
				{
					"tier": row.tier_name,
					"discount_pct": flt(row.service_discount_pct),
					"pricing_rule": row.pricing_rule,
				}
			)
	return {
		"enable_loyalty": cint(getattr(s, "enable_loyalty", 0)) if s else 0,
		"use_erpnext_loyalty_program": cint(getattr(s, "use_erpnext_loyalty_program", 0))
		if s
		else 0,
		"company": company,
		"retail_loyalty_program": retail,
		"fleet_loyalty_program": fleet,
		"retail_exists": bool(retail and frappe.db.exists("Loyalty Program", retail)),
		"fleet_exists": bool(fleet and frappe.db.exists("Loyalty Program", fleet)),
		"enrolled_customers": enrolled,
		"tiers": rules,
		"ready": bool(retail or fleet),
	}
