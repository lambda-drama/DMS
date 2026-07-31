"""Branch scoping via standard Frappe User Permissions (Allow = Branch).

Expects a Link field to Branch on each transaction doctype (added via Customize Form /
Property Setter — not shipped in this app's JSON or fixtures). Filtering is skipped when
the field is not present on the doctype yet.
"""

from __future__ import annotations

import frappe
from frappe import _

BRANCH_SCOPED_DOCTYPES = frozenset(
	{
		"Service Appointment",
		"Vehicle Inspection",
		"DMS Job Card",
		"DMS Service Estimate",
		"DMS Parts Request",
		"Vehicle Delivery Note",
		"Sales Invoice",
	}
)


def get_branch_field_for_doctype(doctype: str) -> str | None:
	"""Return the branch Link fieldname on `doctype`, if any."""
	meta = frappe.get_meta(doctype)
	for fieldname in ("branch", "custom_branch"):
		if meta.has_field(fieldname) and meta.get_field(fieldname).options == "Branch":
			return fieldname
	return None


def get_branch_company_field() -> str | None:
	"""Return the Company Link fieldname on Branch (stock or customised), if any."""
	branch_meta = frappe.get_meta("Branch")
	for fieldname in ("company", "custom_company"):
		if branch_meta.has_field(fieldname):
			return fieldname
	return None


def get_allowed_branches(user: str | None = None) -> list[str] | None:
	"""Branches the user may access, or None when branch rules do not apply."""
	user = user or frappe.session.user
	if not user or user in ("Administrator", "Guest"):
		return None

	branch_perms = frappe.permissions.get_user_permissions(user).get("Branch") or []
	if not branch_perms:
		return None

	allowed = []
	for perm in branch_perms:
		docname = perm.get("doc") if isinstance(perm, dict) else getattr(perm, "doc", None)
		if docname:
			allowed.append(docname)
	return allowed or None


def get_dms_branches(
	search: str | None = None,
	company: str | None = None,
	limit: int = 50,
	user: str | None = None,
) -> list[dict]:
	"""Branches for the configured DMS company, scoped by User Permissions.

	This is the canonical branch lookup for both the DMS and DMS CRM UIs.
	"""
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies
	from dms.dealer_management_system.utils.stock_operations import get_default_dms_company

	company = (company or "").strip() or get_default_dms_company()
	if not company or not frappe.db.exists("DocType", "Branch"):
		return []

	# A company outside DMS Settings has no DMS branches — never leak its branches here.
	dms_companies = get_dms_companies()
	if dms_companies and company not in dms_companies:
		return []

	company_field = get_branch_company_field()

	filters: dict = {}
	if company_field:
		filters[company_field] = company
	else:
		# Older ERPNext Branch schemas use the DMS Settings company mapping.
		defaults = frappe.get_all(
			"DMS Company Defaults",
			filters={"parent": "DMS Settings", "parenttype": "DMS Settings", "company": company},
			pluck="branch",
		)
		names = [branch for branch in defaults if branch]
		if not names:
			return []
		filters["name"] = ["in", names]

	allowed = get_allowed_branches(user)
	if allowed is not None:
		if filters.get("name"):
			names = [name for name in filters["name"][1] if name in allowed]
			if not names:
				return []
			filters["name"] = ["in", names]
		else:
			filters["name"] = ["in", allowed]

	or_filters = None
	search = (search or "").strip()
	if search:
		query = f"%{search}%"
		or_filters = {"name": ["like", query], "branch": ["like", query]}

	fields = ["name", "branch"]
	if company_field:
		fields.append(company_field)

	return frappe.get_all(
		"Branch",
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		limit=max(1, min(int(limit or 50), 500)),
		order_by="name asc",
	)


def assert_dms_branch_access(
	branch: str | None,
	user: str | None = None,
	company: str | None = None,
) -> None:
	"""Require a branch to be available in the canonical DMS branch lookup."""
	from dms.dealer_management_system.utils.stock_operations import get_default_dms_company

	branch = (branch or "").strip()
	if not branch:
		return

	allowed = {row["name"] for row in get_dms_branches(company=company, limit=500, user=user)}
	if branch in allowed:
		return

	company = (company or "").strip() or get_default_dms_company()
	company_field = get_branch_company_field()
	branch_company = (
		frappe.db.get_value("Branch", branch, company_field) if company_field else None
	)
	if company and branch_company and branch_company != company:
		frappe.throw(
			_("Branch {0} belongs to {1}, not {2}. Select a branch of the chosen company.").format(
				frappe.bold(branch), frappe.bold(branch_company), frappe.bold(company)
			),
			frappe.PermissionError,
		)

	frappe.throw(
		_("Branch {0} is not available for this DMS company or user.").format(
			frappe.bold(branch)
		),
		frappe.PermissionError,
	)


def add_branch_filter(
	filters: dict | None,
	doctype: str,
	user: str | None = None,
) -> dict:
	"""Apply branch IN filter for custom API list queries (mirrors Frappe list behaviour)."""
	filters = dict(filters or {})
	branch_field = get_branch_field_for_doctype(doctype)
	if not branch_field:
		return filters

	allowed = get_allowed_branches(user)
	if not allowed:
		return filters

	if frappe.get_system_settings("apply_strict_user_permissions"):
		filters[branch_field] = ["in", allowed]
	else:
		filters[branch_field] = ["in", allowed + [""]]
	return filters


def apply_branch_filter_to_qb(query, table, doctype: str, user: str | None = None):
	"""Filter a frappe Query Builder query by allowed branches."""
	branch_field = get_branch_field_for_doctype(doctype)
	if not branch_field:
		return query

	allowed = get_allowed_branches(user)
	if not allowed:
		return query

	col = getattr(table, branch_field)
	if frappe.get_system_settings("apply_strict_user_permissions"):
		return query.where(col.isin(allowed))
	return query.where((col.isin(allowed)) | (col.isnull()) | (col == ""))


def assert_branch_access(branch: str | None, user: str | None = None) -> None:
	branch = (branch or "").strip()
	if not branch:
		return

	allowed = get_allowed_branches(user)
	if allowed is None:
		return
	if branch not in allowed:
		frappe.throw(
			_("You do not have permission to access branch {0}.").format(frappe.bold(branch)),
			frappe.PermissionError,
		)
