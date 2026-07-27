# Copyright (c) 2026, Mania and contributors
"""Shared helpers for CRM APIs — independent of dms.api.*."""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint


def parse_json(value):
	if value is None or value == "":
		return {}
	if isinstance(value, (dict, list)):
		return value
	if isinstance(value, str):
		try:
			return json.loads(value)
		except Exception:
			return {}
	return {}


def paginate(limit=50, offset=0):
	limit = max(1, min(cint(limit) or 50, 200))
	offset = max(0, cint(offset) or 0)
	return limit, offset


def ensure_crm_read(doctype: str):
	frappe.has_permission(doctype, "read", throw=True)


def ensure_crm_write(doctype: str):
	frappe.has_permission(doctype, "write", throw=True)


def ensure_crm_create(doctype: str):
	frappe.has_permission(doctype, "create", throw=True)


def customer_display_name(customer: str | None) -> str:
	if not customer:
		return ""
	return frappe.db.get_value("Customer", customer, "customer_name") or customer


def user_display_name(user: str | None) -> str:
	if not user:
		return ""
	return frappe.db.get_value("User", user, "full_name") or user


@frappe.whitelist()
def get_csrf_token():
	"""CRM-local CSRF helper so the CRM UI never depends on dms.api.common."""
	return frappe.sessions.get_csrf_token()


@frappe.whitelist()
def ping():
	return {"ok": 1, "module": "crm"}
