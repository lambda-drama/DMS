"""DMS Branch master — create branches and list them for the Master screen.

ERPNext Branch is a name-only Setup doctype (HR roles). Dealer Manager / System
Manager / Administrator manage it from DMS; company is stored on the Branch when
the Company link field exists (stock or ``custom_company``).
"""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint

from dms.api.permissions import has_management_view_role
from dms.dealer_management_system.utils.branch_permissions import (
	ensure_branch_company_field,
	get_branch_company_field,
	scope_branch_filters_to_dms_companies,
)
from dms.dealer_management_system.utils.company_permissions import get_dms_companies
from dms.dealer_management_system.utils.stock_operations import get_default_dms_company


def _assert_manager():
	if not has_management_view_role():
		frappe.throw(
			_("Only Dealer Manager, System Manager, or Administrator can manage Branches."),
			frappe.PermissionError,
		)


def _parse(data):
	if isinstance(data, str):
		data = json.loads(data) if data else {}
	return data or {}


def _shape(doc) -> dict:
	company_field = get_branch_company_field()
	company = (doc.get(company_field) or "").strip() if company_field else None
	company_name = None
	if company:
		company_name = frappe.db.get_value("Company", company, "company_name") or company
	return {
		"name": doc.name,
		"branch": doc.branch or doc.name,
		"company": company,
		"company_name": company_name,
	}


def _set_company(doc, company: str | None) -> None:
	company_field = get_branch_company_field()
	if not company_field:
		return
	company = (company or "").strip() or None
	if company:
		dms_companies = get_dms_companies()
		if dms_companies and company not in dms_companies:
			frappe.throw(_("Company {0} is not in DMS Settings.").format(frappe.bold(company)))
		if not frappe.db.exists("Company", company):
			frappe.throw(_("Company {0} does not exist.").format(frappe.bold(company)))
	doc.set(company_field, company)


@frappe.whitelist()
def list_branches(search=None, company=None, limit=50, offset=0):
	"""All branches for the DMS companies — not scoped by the caller's User Permissions."""
	_assert_manager()
	if not frappe.db.exists("DocType", "Branch"):
		return {"data": [], "total": 0}

	ensure_branch_company_field()
	company_field = get_branch_company_field()
	filters: dict = {}
	if not scope_branch_filters_to_dms_companies(filters, company):
		return {"data": [], "total": 0}

	or_filters = None
	search = (search or "").strip()
	if search:
		q = f"%{search}%"
		or_filters = {"name": ["like", q], "branch": ["like", q]}

	fields = ["name", "branch"]
	if company_field:
		fields.append(company_field)

	total = len(
		frappe.get_all(
			"Branch",
			filters=filters,
			or_filters=or_filters,
			pluck="name",
			limit_page_length=0,
			ignore_permissions=True,
		)
	)
	rows = frappe.get_all(
		"Branch",
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by="name asc",
		limit=max(1, min(cint(limit) or 50, 200)),
		start=max(0, cint(offset)),
		ignore_permissions=True,
	)
	data = []
	for row in rows:
		company_val = (row.get(company_field) or "").strip() if company_field else None
		data.append(
			{
				"name": row.name,
				"branch": row.branch or row.name,
				"company": company_val,
				"company_name": (
					frappe.db.get_value("Company", company_val, "company_name") or company_val
					if company_val
					else None
				),
			}
		)
	return {"data": data, "total": total}


@frappe.whitelist()
def get_branch(name=None):
	_assert_manager()
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Branch is required."))
	if not frappe.db.exists("Branch", name):
		frappe.throw(_("Branch {0} does not exist.").format(frappe.bold(name)))
	return _shape(frappe.get_doc("Branch", name))


@frappe.whitelist()
def create_branch(data=None):
	_assert_manager()
	from dms.dealer_management_system.utils.branch_permissions import insert_dms_branch

	data = _parse(data)
	label = (data.get("branch") or data.get("name") or "").strip()
	company = (data.get("company") or "").strip() or get_default_dms_company()
	return insert_dms_branch(label, company)


@frappe.whitelist()
def update_branch(name=None, data=None):
	_assert_manager()
	ensure_branch_company_field()
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Branch is required."))
	if not frappe.db.exists("Branch", name):
		frappe.throw(_("Branch {0} does not exist.").format(frappe.bold(name)))
	data = _parse(data)
	doc = frappe.get_doc("Branch", name)
	if data.get("branch") is not None:
		label = (data.get("branch") or "").strip()
		if not label:
			frappe.throw(_("Branch name is required."))
		doc.branch = label
	if "company" in data:
		_set_company(doc, data.get("company"))
	doc.flags.ignore_permissions = True
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return _shape(doc)


@frappe.whitelist()
def delete_branch(name=None):
	_assert_manager()
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Branch is required."))
	if not frappe.db.exists("Branch", name):
		frappe.throw(_("Branch {0} does not exist.").format(frappe.bold(name)))
	linked = frappe.db.exists("User Permission", {"allow": "Branch", "for_value": name})
	if linked:
		frappe.throw(
			_("Cannot delete {0} — it is used on a user permission. Remove those first.").format(
				frappe.bold(name)
			)
		)
	frappe.delete_doc("Branch", name, ignore_permissions=True)
	frappe.db.commit()
	return {"ok": True, "deleted": name}
