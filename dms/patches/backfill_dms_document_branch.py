# Copyright (c) 2026, Mania and contributors
"""Backfill the DMS Branch on the documents that carry the service chain.

``branch`` is mandatory on Service Appointment, Vehicle Inspection, DMS Job Card,
DMS Service Estimate, DMS Parts Request, Sales Order and Sales Invoice. Documents
raised before the field existed (or before a Company branch was configured on
DMS Settings → Company Defaults) would otherwise block every later edit and stay
invisible to branch-scoped users.

Every document is filled from the branch of the document it was raised from
(Appointment → Inspection → Job Card → Estimate / Parts Request → Order →
Invoice); when no source branch is available the Company's branch from
DMS Settings → Company Defaults is used. Documents with no resolvable branch are
left untouched and reported in the Error Log.
"""

import frappe

# doctype → source link fields (in priority order) carrying the branch to inherit.
# Documents are backfilled in this order, so a branch read from an upstream
# document is already the resolved one.
BACKFILL_CHAIN = (
	("Service Appointment", ("amended_from", "rescheduled_from")),
	("Vehicle Inspection", ("appointment", "sales_order", "amended_from")),
	(
		"DMS Job Card",
		("inspection", "appointment", "sales_order", "amended_from", "original_job_card"),
	),
	(
		"DMS Service Estimate",
		("inspection", "parent_job_card", "appointment", "sales_order", "parent_estimate"),
	),
	("DMS Parts Request", ("job_card",)),
	("Sales Order", ("custom_dms_job_card", "custom_spare_parts_proforma")),
	("Sales Invoice", ("custom_dms_job_card",)),
)


def execute():
	from dms.dealer_management_system.utils.branch_permissions import get_company_branch

	filled = 0
	unresolved: dict[str, int] = {}

	for doctype, link_fields in BACKFILL_CHAIN:
		count = _backfill_doctype(doctype, link_fields, get_company_branch)
		filled += count[0]
		if count[1]:
			unresolved[doctype] = count[1]

	if unresolved:
		detail = ", ".join(f"{doctype}: {count}" for doctype, count in unresolved.items())
		frappe.log_error(
			title="DMS branch backfill — documents left without a branch",
			message=(
				f"{sum(unresolved.values())} document(s) could not be given a branch "
				f"({detail}): no branch on the source document and no Company branch on "
				"DMS Settings → Company Defaults. Configure the branch per Company and "
				"re-run `bench --site <site> execute "
				"dms.patches.backfill_dms_document_branch.execute`."
			),
		)


def _backfill_doctype(doctype, link_fields, get_company_branch) -> tuple[int, int]:
	"""Fill the blank branches on ``doctype``; return ``(filled, unresolved)``."""
	if not frappe.db.exists("DocType", doctype):
		return 0, 0

	meta = frappe.get_meta(doctype)
	if not meta.has_field("branch"):
		return 0, 0

	field_map = _link_targets(meta, link_fields)
	select_fields = ["`name`"]
	if meta.has_field("company"):
		select_fields.append("`company`")
	select_fields.extend(f"`{field}`" for field in field_map)

	rows = frappe.db.sql(
		f"""
		select {", ".join(select_fields)}
		from `tab{doctype}`
		where ifnull(`branch`, '') = ''
		""",
		as_dict=True,
	)
	if not rows:
		return 0, 0

	source_branches = {
		field: _source_branch_map(source_doctype, [row.get(field) for row in rows])
		for field, source_doctype in field_map.items()
	}

	filled = 0
	unresolved = 0
	company_branches: dict[str, str] = {}

	for row in rows:
		branch = ""
		for field in field_map:
			branch = source_branches[field].get((row.get(field) or "").strip()) or ""
			if branch:
				break

		if not branch:
			# No source branch: fall back to the Company branch configured on
			# DMS Settings → Company Defaults (get_company_branch handles the
			# default DMS company when the row has no company).
			company = (row.get("company") or "").strip()
			if company not in company_branches:
				company_branches[company] = (get_company_branch(company) or "").strip()
			branch = company_branches[company]

		if not branch or not frappe.db.exists("Branch", branch):
			unresolved += 1
			continue

		frappe.db.set_value(doctype, row["name"], "branch", branch, update_modified=False)
		filled += 1

	frappe.db.commit()
	return filled, unresolved


def _link_targets(meta, link_fields) -> dict[str, str]:
	"""``{fieldname: source doctype}`` for the Link fields present on the doctype."""
	targets: dict[str, str] = {}
	for field in link_fields:
		if not meta.has_field(field):
			continue
		df = meta.get_field(field)
		if df.fieldtype not in ("Link", "Dynamic Link") or not df.options:
			continue
		targets[field] = df.options
	return targets


def _source_branch_map(source_doctype, names) -> dict[str, str]:
	"""``{source name: branch}`` for the source documents that carry a branch."""
	names = sorted({(name or "").strip() for name in names if (name or "").strip()})
	if not names or not frappe.db.exists("DocType", source_doctype):
		return {}
	if not frappe.get_meta(source_doctype).has_field("branch"):
		return {}

	placeholders = ", ".join(["%s"] * len(names))
	rows = frappe.db.sql(
		f"""
		select `name`, `branch`
		from `tab{source_doctype}`
		where `name` in ({placeholders})
		  and ifnull(`branch`, '') <> ''
		""",
		tuple(names),
		as_dict=True,
	)
	return {row["name"]: (row["branch"] or "").strip() for row in rows}
