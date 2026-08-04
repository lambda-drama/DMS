# Copyright (c) 2026, Mania and contributors
"""CRM Campaigns & Segmentation — dms.crm_api.campaigns (blueprint §13)."""

from __future__ import annotations

import random

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, now_datetime, today

from dms.crm_api.common import (
	customer_display_name,
	ensure_crm_create,
	ensure_crm_read,
	ensure_crm_write,
	paginate,
	parse_json,
	user_display_name,
)

CAMPAIGN = "DMS CRM Campaign"
MEMBER = "DMS CRM Campaign Member"
SEGMENT = "DMS CRM Segment"
SUPPRESSION = "DMS CRM Suppression List"
PREFERENCE = "DMS CRM Customer Preference"


def _apply_payload(doc, payload: dict, *, allow_readonly=False):
	allowed = {
		df.fieldname
		for df in frappe.get_meta(doc.doctype).fields
		if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML", "Table")
		and (allow_readonly or not df.read_only)
	}
	for key, value in (payload or {}).items():
		if key in allowed:
			doc.set(key, value)


def _opts(doctype, fieldname):
	df = frappe.get_meta(doctype).get_field(fieldname)
	if not df or not df.options:
		return []
	return [o for o in df.options.split("\n") if o.strip()]


# ─── Segment audience resolution ─────────────────────────────────────────────


def _suppressed_customers(suppression_list: str | None = None) -> set[str]:
	out = set()
	if suppression_list and frappe.db.exists(SUPPRESSION, suppression_list):
		doc = frappe.get_doc(SUPPRESSION, suppression_list)
		for row in doc.entries or []:
			if row.customer:
				out.add(row.customer)
	# Global active suppression lists
	for name in frappe.get_all(
		SUPPRESSION, filters={"status": "Active", "list_type": "Global"}, pluck="name"
	):
		if suppression_list and name == suppression_list:
			continue
		doc = frappe.get_doc(SUPPRESSION, name)
		for row in doc.entries or []:
			if row.customer:
				out.add(row.customer)
	return out


def _preference_map(customers: list[str]) -> dict[str, dict]:
	if not customers or not frappe.db.exists("DocType", PREFERENCE):
		return {}
	rows = frappe.get_all(
		PREFERENCE,
		filters={"customer": ["in", customers]},
		fields=["customer", "marketing_consent", "do_not_contact", "preferred_channel", "preferred_language", "loyalty_tier"],
	)
	return {r.customer: r for r in rows}


def resolve_segment_customers(segment_name: str | None = None, *, segment_doc=None, limit: int = 5000) -> list[str]:
	"""Return deduplicated customer names matching segment criteria."""
	seg = segment_doc or frappe.get_doc(SEGMENT, segment_name)
	customers: set[str] | None = None

	def _intersect(names: set[str]):
		nonlocal customers
		if customers is None:
			customers = names
		else:
			customers &= names

	# Base: all customers (scoped later) — start from vehicle / service filters when set
	has_vehicle_filter = any(
		[
			seg.brand,
			seg.vehicle_model,
			seg.model_year_from,
			seg.model_year_to,
			seg.fuel_type,
			seg.warranty_status,
			seg.mileage_min,
			seg.mileage_max,
			seg.vehicle_age_max_years,
		]
	)
	has_service_filter = any(
		[seg.retention_category, seg.service_overdue_days_min, cint(seg.has_deferred_work)]
	)
	has_sales_filter = any(
		[seg.sales_status, seg.lost_reason, seg.last_enquiry_days, seg.purchase_timeframe]
	)

	if has_vehicle_filter and frappe.db.exists("DocType", "VIN No"):
		vin_filters = {}
		if seg.brand:
			vin_filters["brand"] = seg.brand
		if seg.vehicle_model:
			vin_filters["model"] = seg.vehicle_model
		if seg.warranty_status and frappe.get_meta("VIN No").has_field("warranty_status"):
			vin_filters["warranty_status"] = seg.warranty_status
		vins = frappe.get_all(
			"VIN No",
			filters=vin_filters or None,
			fields=["customer", "model_year", "current_odometer", "fuel_type", "delivery_date"],
			limit_page_length=limit * 2,
		)
		matched = set()
		for v in vins:
			if not v.customer:
				continue
			if seg.model_year_from and cint(v.model_year) and cint(v.model_year) < cint(seg.model_year_from):
				continue
			if seg.model_year_to and cint(v.model_year) and cint(v.model_year) > cint(seg.model_year_to):
				continue
			if seg.mileage_min and cint(v.current_odometer) < cint(seg.mileage_min):
				continue
			if seg.mileage_max and cint(v.current_odometer) > cint(seg.mileage_max):
				continue
			if seg.fuel_type and (v.fuel_type or "").lower() != seg.fuel_type.lower():
				continue
			matched.add(v.customer)
		_intersect(matched)

	if has_service_filter and frappe.db.exists("DocType", "DMS CRM Service Due"):
		sd_filters = {"status": ["not in", ["Closed", "Completed"]]}
		if seg.retention_category and seg.retention_category != "Deferred":
			# map to classification if field exists
			meta = frappe.get_meta("DMS CRM Service Due")
			if meta.has_field("classification"):
				sd_filters["classification"] = seg.retention_category
		rows = frappe.get_all(
			"DMS CRM Service Due",
			filters=sd_filters,
			fields=["customer", "overdue_days"] if frappe.get_meta("DMS CRM Service Due").has_field("overdue_days") else ["customer"],
			limit_page_length=limit * 2,
		)
		matched = set()
		for r in rows:
			if not r.customer:
				continue
			if seg.service_overdue_days_min and cint(getattr(r, "overdue_days", 0)) < cint(
				seg.service_overdue_days_min
			):
				continue
			matched.add(r.customer)
		_intersect(matched)

	if cint(seg.has_deferred_work) and frappe.db.exists("DocType", "DMS CRM Deferred Work"):
		dw = frappe.get_all(
			"DMS CRM Deferred Work",
			filters={"status": ["not in", ["Completed", "Cancelled"]]},
			pluck="customer",
			limit_page_length=limit * 2,
		)
		_intersect({c for c in dw if c})

	if has_sales_filter and frappe.db.exists("DocType", "DMS CRM Opportunity"):
		opp_filters = {}
		if seg.sales_status == "Open":
			opp_filters["status"] = ["not in", ["Won", "Lost", "Cancelled"]]
		elif seg.sales_status in ("Won", "Lost"):
			opp_filters["status"] = seg.sales_status
		if seg.last_enquiry_days:
			opp_filters["modified"] = [">=", add_days(today(), -cint(seg.last_enquiry_days))]
		rows = frappe.get_all(
			"DMS CRM Opportunity",
			filters=opp_filters or None,
			fields=["customer", "lost_reason"],
			limit_page_length=limit * 2,
		)
		matched = set()
		for r in rows:
			if not r.customer:
				continue
			if seg.lost_reason and seg.lost_reason.lower() not in (r.lost_reason or "").lower():
				continue
			matched.add(r.customer)
		_intersect(matched)

	if cint(seg.has_complaint_history) and frappe.db.exists("DocType", "DMS CRM Case"):
		cases = frappe.get_all(
			"DMS CRM Case",
			filters={"status": ["not in", ["Closed"]]},
			pluck="customer",
			limit_page_length=limit * 2,
		)
		_intersect({c for c in cases if c})

	# Customer master filters
	cust_filters = {}
	if seg.customer_type:
		cust_filters["customer_type"] = seg.customer_type
	if seg.customer_group:
		cust_filters["customer_group"] = seg.customer_group
	if seg.territory:
		cust_filters["territory"] = seg.territory
	if seg.city:
		cust_filters["city"] = ["like", f"%{seg.city}%"]

	if customers is None:
		# No specialized filter — take recent customers
		names = frappe.get_all(
			"Customer",
			filters=cust_filters or None,
			pluck="name",
			limit_page_length=limit,
			order_by="modified desc",
		)
		customers = set(names)
	elif cust_filters:
		allowed = set(
			frappe.get_all(
				"Customer",
				filters={**cust_filters, "name": ["in", list(customers)[:2000]]},
				pluck="name",
				limit_page_length=limit,
			)
		)
		customers &= allowed

	# Consent / DNC via Customer Preference
	pref = _preference_map(list(customers)[:limit])
	final = []
	for c in customers:
		p = pref.get(c) or {}
		if not cint(seg.include_do_not_contact) and cint(p.get("do_not_contact")):
			continue
		if (
			cint(seg.require_marketing_consent)
			and pref.get(c)
			and not cint(p.get("marketing_consent"))
		):
			continue
		if seg.loyalty_tier and p.get("loyalty_tier") and p.get("loyalty_tier") != seg.loyalty_tier:
			continue
		if (
			seg.channel_preference
			and p.get("preferred_channel")
			and p.get("preferred_channel") != seg.channel_preference
		):
			continue
		if (
			seg.preferred_language
			and p.get("preferred_language")
			and p.get("preferred_language") != seg.preferred_language
		):
			continue
		final.append(c)
		if len(final) >= limit:
			break

	return final


# ─── Metrics ─────────────────────────────────────────────────────────────────


def refresh_campaign_metrics(campaign_name: str) -> dict:
	ensure_crm_write(CAMPAIGN)
	doc = frappe.get_doc(CAMPAIGN, campaign_name)
	members = frappe.get_all(
		MEMBER,
		filters={"campaign": campaign_name},
		fields=[
			"status",
			"in_control_group",
			"converted",
			"opted_out",
			"attributed_revenue",
		],
	)
	doc.members_count = len(members)
	doc.control_group_count = sum(1 for m in members if cint(m.in_control_group))
	status_map = {
		"delivered_count": {"Delivered", "Opened", "Responded", "Appointment", "Test Drive", "Quoted", "Booked", "Sold", "Workshop Visit"},
		"opened_count": {"Opened", "Responded", "Appointment", "Test Drive", "Quoted", "Booked", "Sold", "Workshop Visit"},
		"response_count": {"Responded", "Appointment", "Test Drive", "Quoted", "Booked", "Sold", "Workshop Visit"},
		"appointment_count": {"Appointment", "Test Drive", "Quoted", "Booked", "Sold"},
		"test_drive_count": {"Test Drive", "Quoted", "Booked", "Sold"},
		"quotation_count": {"Quoted", "Booked", "Sold"},
		"booking_count": {"Booked", "Sold"},
		"sale_count": {"Sold"},
		"workshop_visit_count": {"Workshop Visit"},
	}
	for field, statuses in status_map.items():
		setattr(doc, field, sum(1 for m in members if m.status in statuses and not cint(m.in_control_group)))

	doc.campaign_revenue = sum(flt(m.attributed_revenue) for m in members if cint(m.converted))
	budget = flt(doc.budget)
	leads = cint(doc.response_count) or 0
	appts = cint(doc.appointment_count) or 0
	sales = cint(doc.sale_count) or 0
	doc.cost_per_lead = (budget / leads) if leads else 0
	doc.cost_per_appointment = (budget / appts) if appts else 0
	doc.cost_per_sale = (budget / sales) if sales else 0
	doc.roi_pct = ((flt(doc.campaign_revenue) - budget) / budget * 100) if budget else 0
	doc.metrics_refreshed_on = now_datetime()
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


# ─── Whitelisted APIs ────────────────────────────────────────────────────────


@frappe.whitelist()
def get_campaigns(status=None, campaign_type=None, search=None, limit=50, offset=0):
	ensure_crm_read(CAMPAIGN)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	if campaign_type and campaign_type != "all":
		filters["campaign_type"] = campaign_type
	or_filters = None
	search = (search or "").strip()
	if search:
		or_filters = [
			["campaign_name", "like", f"%{search}%"],
			["name", "like", f"%{search}%"],
		]
	rows = frappe.get_all(
		CAMPAIGN,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"campaign_name",
			"campaign_type",
			"status",
			"campaign_owner",
			"channel",
			"start_date",
			"end_date",
			"budget",
			"members_count",
			"sale_count",
			"roi_pct",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	for r in rows:
		r["owner_name"] = user_display_name(r.get("campaign_owner"))
	return {
		"data": rows,
		"total": frappe.db.count(CAMPAIGN, filters=filters),
		"limit": limit,
		"offset": offset,
	}


@frappe.whitelist()
def get_campaign(name):
	ensure_crm_read(CAMPAIGN)
	doc = frappe.get_doc(CAMPAIGN, name)
	data = doc.as_dict()
	data["owner_name"] = user_display_name(doc.campaign_owner)
	data["segment_name"] = (
		frappe.db.get_value(SEGMENT, doc.segment, "segment_name") if doc.segment else None
	)
	data["members"] = frappe.get_all(
		MEMBER,
		filters={"campaign": doc.name},
		fields=[
			"name",
			"customer",
			"status",
			"response",
			"converted",
			"opted_out",
			"in_control_group",
			"attribution",
			"attributed_revenue",
			"last_activity_on",
		],
		order_by="modified desc",
		limit_page_length=200,
	)
	for m in data["members"]:
		m["customer_name"] = customer_display_name(m.get("customer"))
	return data


@frappe.whitelist()
def create_campaign(data=None):
	ensure_crm_create(CAMPAIGN)
	payload = parse_json(data)
	if not payload.get("campaign_name"):
		frappe.throw(_("Campaign name is required."))
	if not payload.get("campaign_type"):
		frappe.throw(_("Campaign type is required."))
	doc = frappe.new_doc(CAMPAIGN)
	_apply_payload(doc, payload, allow_readonly=True)
	doc.insert()
	frappe.db.commit()
	return get_campaign(doc.name)


@frappe.whitelist()
def update_campaign(name, data=None):
	ensure_crm_write(CAMPAIGN)
	payload = parse_json(data)
	doc = frappe.get_doc(CAMPAIGN, name)
	_apply_payload(doc, payload)
	doc.save()
	frappe.db.commit()
	return get_campaign(doc.name)


@frappe.whitelist()
def approve_campaign(name):
	ensure_crm_write(CAMPAIGN)
	doc = frappe.get_doc(CAMPAIGN, name)
	doc.status = "Approved"
	doc.save()
	frappe.db.commit()
	return get_campaign(doc.name)


@frappe.whitelist()
def build_campaign_audience(name, replace_existing=0):
	"""Sync members from campaign segment with dedupe + suppression + control group."""
	ensure_crm_write(CAMPAIGN)
	ensure_crm_create(MEMBER)
	doc = frappe.get_doc(CAMPAIGN, name)
	if not doc.segment:
		frappe.throw(_("Assign a target segment before building the audience."))

	customers = resolve_segment_customers(doc.segment, limit=5000)
	suppressed = _suppressed_customers(doc.suppression_list)

	if cint(replace_existing):
		for mname in frappe.get_all(MEMBER, filters={"campaign": doc.name}, pluck="name"):
			frappe.delete_doc(MEMBER, mname, ignore_permissions=True, force=True)

	existing = set(
		frappe.get_all(MEMBER, filters={"campaign": doc.name}, pluck="customer")
	)
	added = skipped_suppressed = 0
	eligible = []
	for c in customers:
		if c in existing:
			continue
		if c in suppressed:
			skipped_suppressed += 1
			continue
		eligible.append(c)

	# Control group hold-out
	pct = max(0.0, min(50.0, flt(doc.control_group_pct)))
	control_n = int(len(eligible) * pct / 100.0) if pct else 0
	control_set = set(random.sample(eligible, control_n)) if control_n else set()

	for c in eligible:
		member = frappe.get_doc(
			{
				"doctype": MEMBER,
				"campaign": doc.name,
				"customer": c,
				"status": "Queued",
				"in_control_group": 1 if c in control_set else 0,
				"attribution": doc.campaign_name,
			}
		)
		member.insert(ignore_permissions=True)
		added += 1
		# §15.2 — individual campaign tasks (skip control group)
		if c not in control_set:
			_maybe_create_campaign_member_task(doc, member)

	frappe.db.commit()
	metrics = refresh_campaign_metrics(doc.name)
	return {
		"added": added,
		"skipped_suppressed": skipped_suppressed,
		"already_members": len(existing),
		"control_group": control_n,
		"campaign": metrics,
	}


def _maybe_create_campaign_member_task(campaign, member):
	"""Create one Activity per campaign member for accountability."""
	try:
		settings = frappe.get_cached_doc("DMS CRM Settings")
		if not cint(getattr(settings, "create_campaign_member_tasks", None) or 1):
			return
		due_days = cint(getattr(settings, "campaign_task_due_days", None) or 2)
	except Exception:
		due_days = 2

	from frappe.utils import add_days, today

	assignee = campaign.campaign_owner or frappe.session.user
	frappe.get_doc(
		{
			"doctype": "DMS CRM Activity",
			"activity_type": "Call",
			"subject": f"{campaign.campaign_name}: follow up {member.customer}",
			"status": "Open",
			"priority": "Medium",
			"assigned_to": assignee,
			"customer": member.customer,
			"campaign": campaign.name,
			"campaign_member": member.name,
			"due_datetime": f"{add_days(today(), due_days)} 09:00:00",
			"outcome_notes": "Campaign member task — individual accountability",
		}
	).insert(ignore_permissions=True)


@frappe.whitelist()
def update_campaign_member(name, data=None):
	ensure_crm_write(MEMBER)
	payload = parse_json(data)
	doc = frappe.get_doc(MEMBER, name)
	_apply_payload(doc, payload)
	doc.save()
	frappe.db.commit()
	refresh_campaign_metrics(doc.campaign)
	return frappe.get_doc(MEMBER, name).as_dict()


@frappe.whitelist()
def refresh_metrics(name):
	return refresh_campaign_metrics(name)


@frappe.whitelist()
def get_campaign_form_options():
	ensure_crm_read(CAMPAIGN)
	return {
		"campaign_types": _opts(CAMPAIGN, "campaign_type"),
		"statuses": _opts(CAMPAIGN, "status"),
		"channels": _opts(CAMPAIGN, "channel"),
		"member_statuses": _opts(MEMBER, "status"),
	}


# ─── Segments ────────────────────────────────────────────────────────────────


@frappe.whitelist()
def get_segments(status=None, search=None, limit=50, offset=0):
	ensure_crm_read(SEGMENT)
	limit, offset = paginate(limit, offset)
	filters = {}
	if status and status != "all":
		filters["status"] = status
	or_filters = None
	search = (search or "").strip()
	if search:
		or_filters = [["segment_name", "like", f"%{search}%"], ["name", "like", f"%{search}%"]]
	rows = frappe.get_all(
		SEGMENT,
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"segment_name",
			"status",
			"audience_count",
			"brand",
			"retention_category",
			"modified",
		],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	return {"data": rows, "total": frappe.db.count(SEGMENT, filters=filters)}


@frappe.whitelist()
def get_segment(name):
	ensure_crm_read(SEGMENT)
	return frappe.get_doc(SEGMENT, name).as_dict()


@frappe.whitelist()
def create_segment(data=None):
	ensure_crm_create(SEGMENT)
	payload = parse_json(data)
	if not payload.get("segment_name"):
		frappe.throw(_("Segment name is required."))
	doc = frappe.new_doc(SEGMENT)
	_apply_payload(doc, payload, allow_readonly=True)
	doc.insert()
	frappe.db.commit()
	return get_segment(doc.name)


@frappe.whitelist()
def update_segment(name, data=None):
	ensure_crm_write(SEGMENT)
	payload = parse_json(data)
	doc = frappe.get_doc(SEGMENT, name)
	_apply_payload(doc, payload)
	doc.save()
	frappe.db.commit()
	return get_segment(doc.name)


@frappe.whitelist()
def preview_segment(name=None, data=None):
	"""Count / sample audience for a saved or draft segment."""
	ensure_crm_read(SEGMENT)
	if name:
		customers = resolve_segment_customers(name, limit=5000)
		frappe.db.set_value(
			SEGMENT,
			name,
			{"audience_count": len(customers), "last_refreshed_on": now_datetime()},
			update_modified=False,
		)
		frappe.db.commit()
	else:
		payload = parse_json(data)
		tmp = frappe.new_doc(SEGMENT)
		_apply_payload(tmp, payload, allow_readonly=True)
		customers = resolve_segment_customers(segment_doc=tmp, limit=5000)
	sample = [
		{"name": c, "customer_name": customer_display_name(c)} for c in customers[:25]
	]
	return {"count": len(customers), "sample": sample}


@frappe.whitelist()
def get_segment_form_options():
	ensure_crm_read(SEGMENT)
	return {
		"statuses": _opts(SEGMENT, "status"),
		"customer_types": _opts(SEGMENT, "customer_type"),
		"loyalty_tiers": _opts(SEGMENT, "loyalty_tier"),
		"warranty_statuses": _opts(SEGMENT, "warranty_status"),
		"sales_statuses": _opts(SEGMENT, "sales_status"),
		"retention_categories": _opts(SEGMENT, "retention_category"),
		"channels": _opts(SEGMENT, "channel_preference"),
	}


# ─── Suppression lists ───────────────────────────────────────────────────────


@frappe.whitelist()
def get_suppression_lists(limit=50, offset=0):
	ensure_crm_read(SUPPRESSION)
	limit, offset = paginate(limit, offset)
	rows = frappe.get_all(
		SUPPRESSION,
		fields=["name", "list_name", "status", "list_type", "modified"],
		order_by="modified desc",
		limit_start=offset,
		limit_page_length=limit,
	)
	return {"data": rows}


@frappe.whitelist()
def get_suppression_list(name):
	ensure_crm_read(SUPPRESSION)
	return frappe.get_doc(SUPPRESSION, name).as_dict()


@frappe.whitelist()
def create_suppression_list(data=None):
	ensure_crm_create(SUPPRESSION)
	payload = parse_json(data)
	if not payload.get("list_name"):
		frappe.throw(_("List name is required."))
	doc = frappe.new_doc(SUPPRESSION)
	doc.list_name = payload.get("list_name")
	doc.status = payload.get("status") or "Active"
	doc.list_type = payload.get("list_type") or "Global"
	doc.company = payload.get("company")
	doc.notes = payload.get("notes")
	for row in payload.get("entries") or []:
		if row.get("customer"):
			doc.append(
				"entries",
				{
					"customer": row["customer"],
					"reason": row.get("reason"),
					"added_on": row.get("added_on") or now_datetime(),
				},
			)
	doc.insert()
	frappe.db.commit()
	return get_suppression_list(doc.name)


@frappe.whitelist()
def update_suppression_list(name, data=None):
	ensure_crm_write(SUPPRESSION)
	payload = parse_json(data)
	doc = frappe.get_doc(SUPPRESSION, name)
	for key in ("list_name", "status", "list_type", "company", "notes"):
		if key in payload:
			doc.set(key, payload.get(key))
	if "entries" in payload:
		doc.set("entries", [])
		for row in payload.get("entries") or []:
			if row.get("customer"):
				doc.append(
					"entries",
					{
						"customer": row["customer"],
						"reason": row.get("reason"),
						"added_on": row.get("added_on") or now_datetime(),
					},
				)
	doc.save()
	frappe.db.commit()
	return get_suppression_list(doc.name)
