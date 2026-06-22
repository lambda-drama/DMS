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
