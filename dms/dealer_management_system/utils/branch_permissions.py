"""Branch scoping via standard Frappe User Permissions (Allow = Branch)."""

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


def insert_dms_branch(label: str, company: str | None = None) -> dict:
	"""Create a Branch linked to a DMS Settings company.

	Used by the Master screen and by the branch picker + button.
	"""
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies
	from dms.dealer_management_system.utils.stock_operations import get_default_dms_company

	if not frappe.db.exists("DocType", "Branch"):
		frappe.throw(_("Branch doctype is not installed."))
	ensure_branch_company_field()
	label = (label or "").strip()
	if not label:
		frappe.throw(_("Branch name is required."))
	if frappe.db.exists("Branch", label) or frappe.db.exists("Branch", {"branch": label}):
		frappe.throw(_("Branch {0} already exists.").format(frappe.bold(label)))

	company = (company or "").strip() or get_default_dms_company()
	if not company:
		frappe.throw(_("Company is required to create a branch."))
	dms_companies = get_dms_companies()
	if dms_companies and company not in dms_companies:
		frappe.throw(_("Company {0} is not in DMS Settings.").format(frappe.bold(company)))
	if not frappe.db.exists("Company", company):
		frappe.throw(_("Company {0} does not exist.").format(frappe.bold(company)))

	company_field = get_branch_company_field()
	doc = frappe.new_doc("Branch")
	doc.branch = label
	if company_field:
		doc.set(company_field, company)
	doc.flags.ignore_permissions = True
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	company_name = frappe.db.get_value("Company", company, "company_name") or company
	return {
		"name": doc.name,
		"branch": doc.branch or doc.name,
		"company": company,
		"company_name": company_name,
	}


def get_branch_company_field() -> str | None:
	"""Return the Company Link fieldname on Branch (stock or customised), if any."""
	if not frappe.db.exists("DocType", "Branch"):
		return None
	branch_meta = frappe.get_meta("Branch")
	for fieldname in ("company", "custom_company"):
		if branch_meta.has_field(fieldname):
			return fieldname
	return None


def ensure_branch_company_field() -> None:
	"""ERPNext Branch is name-only; DMS needs a Company link to scope branches."""
	from dms.utils.custom_fields import custom_field_exists, ensure_custom_fields

	if not frappe.db.exists("DocType", "Branch"):
		return
	if get_branch_company_field():
		return
	if custom_field_exists("Branch", "custom_company"):
		frappe.clear_cache(doctype="Branch")
		return
	ensure_custom_fields(
		{
			"Branch": [
				{
					"fieldname": "custom_company",
					"label": "Company",
					"fieldtype": "Link",
					"options": "Company",
					"insert_after": "branch",
					"in_list_view": 1,
					"in_standard_filter": 1,
				}
			]
		},
		update=True,
	)
	frappe.clear_cache(doctype="Branch")


def _branch_company_value(doc) -> str | None:
	field = get_branch_company_field()
	if not field:
		return None
	return (doc.get(field) or "").strip() or None


def list_user_branch_permission_rows(user: str | None = None) -> list[dict]:
	"""Frappe User Permission rows that Restrict Allow = Branch."""
	if not frappe.db.exists("DocType", "User Permission"):
		return []
	filters: dict = {"allow": "Branch"}
	user = (user or "").strip()
	if user:
		filters["user"] = user
	rows = frappe.get_all(
		"User Permission",
		filters=filters,
		fields=["name", "user", "for_value", "apply_to_all_doctypes"],
		order_by="user asc, for_value asc",
		ignore_permissions=True,
	)
	out = []
	for row in rows:
		branch = (row.for_value or "").strip()
		if not branch:
			continue
		user_name = row.user
		out.append(
			{
				"name": row.name,
				"user": user_name,
				"full_name": frappe.db.get_value("User", user_name, "full_name") or user_name,
				"branch": branch,
				"branch_label": frappe.db.get_value("Branch", branch, "branch") or branch,
				"apply_to_all_doctypes": int(row.apply_to_all_doctypes or 0),
			}
		)
	return out


def add_user_branch_permission(user: str, branch: str) -> str:
	"""Create a Frappe User Permission (Allow=Branch) if it is not already there."""
	user = (user or "").strip()
	branch = (branch or "").strip()
	if not user:
		frappe.throw(_("User is required."))
	if not branch:
		frappe.throw(_("Branch is required."))
	if not frappe.db.exists("User", user):
		frappe.throw(_("User {0} does not exist.").format(frappe.bold(user)))
	if not frappe.db.exists("Branch", branch):
		frappe.throw(_("Branch {0} does not exist.").format(frappe.bold(branch)))

	existing = frappe.db.exists(
		"User Permission",
		{"user": user, "allow": "Branch", "for_value": branch},
	)
	if existing:
		return existing

	doc = frappe.get_doc(
		{
			"doctype": "User Permission",
			"user": user,
			"allow": "Branch",
			"for_value": branch,
			"apply_to_all_doctypes": 1,
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert(ignore_permissions=True)
	frappe.clear_cache(user=user)
	return doc.name


def delete_user_branch_permission(name: str) -> None:
	name = (name or "").strip()
	if not name:
		frappe.throw(_("User Permission is required."))
	if not frappe.db.exists("User Permission", name):
		return
	user = frappe.db.get_value("User Permission", name, "user")
	frappe.delete_doc("User Permission", name, ignore_permissions=True, force=True)
	if user:
		frappe.clear_cache(user=user)


def set_user_branches(user: str, branches: list[str] | None) -> list[str]:
	"""Replace the user's Branch User Permissions with ``branches``.

	An empty list removes the restriction so the user can see every branch.
	"""
	user = (user or "").strip()
	if not user:
		frappe.throw(_("User is required."))

	wanted = []
	seen: set[str] = set()
	for raw in branches or []:
		branch = (raw or "").strip()
		if not branch or branch in seen:
			continue
		if not frappe.db.exists("Branch", branch):
			frappe.throw(_("Branch {0} does not exist.").format(frappe.bold(branch)))
		seen.add(branch)
		wanted.append(branch)

	current = frappe.get_all(
		"User Permission",
		filters={"user": user, "allow": "Branch"},
		fields=["name", "for_value"],
		ignore_permissions=True,
	)
	current_by_branch = {(row.for_value or "").strip(): row.name for row in current if row.for_value}
	for branch, name in current_by_branch.items():
		if branch not in seen:
			frappe.delete_doc("User Permission", name, ignore_permissions=True, force=True)
	created = []
	for branch in wanted:
		if branch not in current_by_branch:
			created.append(add_user_branch_permission(user, branch))
	frappe.clear_cache(user=user)
	return wanted


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


def scope_branch_filters_to_dms_companies(filters: dict, company: str | None = None) -> bool:
	"""Restrict a Branch query to companies listed on DMS Settings.

	``company`` narrows further to that one company (must itself be on DMS Settings).
	Returns False when the query should yield no rows.
	"""
	from dms.dealer_management_system.utils.company_permissions import get_dms_companies

	company = (company or "").strip()
	dms_companies = [c for c in get_dms_companies() if c]
	if not dms_companies:
		return False
	if company and company not in dms_companies:
		return False

	wanted = [company] if company else dms_companies
	company_field = get_branch_company_field()
	if company_field:
		filters[company_field] = wanted[0] if len(wanted) == 1 else ["in", wanted]
		return True

	defaults = frappe.get_all(
		"DMS Company Defaults",
		filters={
			"parent": "DMS Settings",
			"parenttype": "DMS Settings",
			"company": ["in", wanted],
		},
		pluck="branch",
	)
	names = [branch for branch in defaults if branch]
	if not names:
		return False
	filters["name"] = ["in", names]
	return True


def get_dms_branches(
	search: str | None = None,
	company: str | None = None,
	limit: int = 50,
	user: str | None = None,
) -> list[dict]:
	"""Branches whose company is on DMS Settings, scoped by User Permissions.

	This is the canonical branch lookup for both the DMS and DMS CRM UIs.
	"""
	if not frappe.db.exists("DocType", "Branch"):
		return []

	filters: dict = {}
	if not scope_branch_filters_to_dms_companies(filters, company):
		return []

	company_field = get_branch_company_field()

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
	branch_company = frappe.db.get_value("Branch", branch, company_field) if company_field else None
	if company and branch_company and branch_company != company:
		frappe.throw(
			_("Branch {0} belongs to {1}, not {2}. Select a branch of the chosen company.").format(
				frappe.bold(branch), frappe.bold(branch_company), frappe.bold(company)
			),
			frappe.PermissionError,
		)

	frappe.throw(
		_("Branch {0} is not available for this DMS company or user.").format(frappe.bold(branch)),
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
