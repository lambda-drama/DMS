# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Branch backfill for DMS doctypes.

Almost every DMS doctype carries a ``branch`` link that mirrors the job card /
company the record belongs to. Records created before the field was added stay
blank, so DMS Settings exposes a button that queues ``backfill_missing_branches``
in the background and fills the branch from DMS Settings → Company Defaults.

Only doctypes belonging to this app (see ``dms/modules.txt``) are considered, so
unrelated doctypes that happen to have a Branch field — for example the custom
``Sales Shipment Cost`` in the Stock module — are left alone, and only rows whose
branch is still empty are touched.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import frappe
from frappe import _
from frappe.utils import cint

from dms.dealer_management_system.utils.branch_permissions import get_branch_field_for_doctype
from dms.dealer_management_system.utils.stock_operations import get_default_dms_company

# Used only if ``dms/modules.txt`` cannot be read.
DMS_MODULES_FALLBACK = ("Dealer Management System", "Customer Relationship Management")

BRANCH_BACKFILL_JOB_ID = "dms_branch_backfill"
BRANCH_BACKFILL_CACHE_TTL = 86400
BRANCH_BACKFILL_BATCH_SIZE = 200


@lru_cache(maxsize=1)
def get_dms_modules() -> tuple:
	"""Modules shipped by this app — read from ``dms/modules.txt`` so it cannot drift."""
	try:
		content = Path(frappe.get_app_path("dms", "modules.txt")).read_text()
	except OSError:
		return DMS_MODULES_FALLBACK

	return tuple(line.strip() for line in content.splitlines() if line.strip()) or DMS_MODULES_FALLBACK


# --------------------------------------------------------------------------- #
# Branch resolution
# --------------------------------------------------------------------------- #
def get_company_defaults_branches() -> dict:
	"""Company → Branch as configured on DMS Settings → Company Defaults."""
	branches: dict[str, str] = {}
	for row in frappe.get_all(
		"DMS Company Defaults",
		filters={"parent": "DMS Settings", "parenttype": "DMS Settings"},
		fields=["company", "branch"],
		order_by="idx asc",
	):
		company = (row.get("company") or "").strip()
		branch = (row.get("branch") or "").strip()
		if company and branch and company not in branches:
			branches[company] = branch
	return branches


def get_default_branch(branches: dict | None = None) -> str | None:
	"""Branch of the default DMS company, else the first company that has one."""
	branches = branches if branches is not None else get_company_defaults_branches()
	company = (get_default_dms_company() or "").strip()
	if company and branches.get(company):
		return branches[company]
	for branch in branches.values():
		return branch
	return None


# --------------------------------------------------------------------------- #
# Target doctypes
# --------------------------------------------------------------------------- #
def get_branch_backfill_doctypes() -> list:
	"""DMS doctypes that carry a Branch link field.

	Scope is this app's own modules, so doctypes from other apps/modules that
	happen to have a Branch field (e.g. ``Sales Shipment Cost`` in Stock) are not
	part of the backfill. Custom doctypes created inside a DMS module are included,
	since their module is the DMS one.
	"""
	doctypes: list[str] = []
	for doctype in frappe.get_all(
		"DocType",
		filters={"module": ["in", get_dms_modules()], "istable": 0, "issingle": 0},
		pluck="name",
		order_by="name asc",
	):
		if doctype and get_branch_field_for_doctype(doctype):
			doctypes.append(doctype)
	return doctypes


def _missing_branch_filters(fieldname: str) -> dict:
	return {fieldname: ["in", ["", None]]}


def _count_missing_branch(doctype: str, fieldname: str) -> int:
	return cint(frappe.db.count(doctype, filters=_missing_branch_filters(fieldname)))


def _missing_branch_rows(doctype: str, fieldname: str, has_company: bool) -> list:
	fields = ["name", fieldname] + (["company"] if has_company else [])
	return frappe.get_all(
		doctype,
		filters=_missing_branch_filters(fieldname),
		fields=fields,
		order_by="creation asc",
		limit_page_length=0,
		ignore_permissions=True,
	)


def _branch_for_row(row: dict, has_company: bool, branches: dict, default_branch: str | None) -> str | None:
	"""Branch a blank record should get — None means leave it alone."""
	company = (row.get("company") or "").strip() if has_company else ""
	if not company:
		return default_branch
	return branches.get(company)


# --------------------------------------------------------------------------- #
# Preview + backfill
# --------------------------------------------------------------------------- #
def preview_branch_backfill() -> dict:
	"""Count the DMS records whose Branch is still empty (nothing is written)."""
	branches = get_company_defaults_branches()
	rows: list[dict] = []
	total = 0

	for doctype in get_branch_backfill_doctypes():
		fieldname = get_branch_field_for_doctype(doctype)
		if not fieldname:
			continue
		missing = _count_missing_branch(doctype, fieldname)
		if not missing:
			continue
		total += missing
		rows.append({"doctype": doctype, "fieldname": fieldname, "missing": missing})

	return {
		"doctypes": rows,
		"total": total,
		"modules": list(get_dms_modules()),
		"company_branches": branches,
		"default_branch": get_default_branch(branches),
	}


def backfill_missing_branches(dry_run: bool = True, doctypes: list | None = None) -> dict:
	"""Set Branch on DMS records that have none, from Company Defaults.

	Records whose company is not listed on DMS Settings → Company Defaults are
	never given another company's branch — they are reported as skipped.
	With ``dry_run`` nothing is written and ``total_updated`` is the count that
	*would* be updated.
	"""
	dry_run = bool(cint(dry_run))
	branches = get_company_defaults_branches()
	default_branch = get_default_branch(branches)

	summary = {
		"dry_run": dry_run,
		"default_branch": default_branch,
		"company_branches": branches,
		"total_missing": 0,
		"total_updated": 0,
		"total_skipped": 0,
		"doctypes": [],
	}

	for doctype in doctypes or get_branch_backfill_doctypes():
		fieldname = get_branch_field_for_doctype(doctype)
		if not fieldname:
			continue

		has_company = frappe.get_meta(doctype).has_field("company")
		rows = _missing_branch_rows(doctype, fieldname, has_company)
		if not rows:
			continue

		by_branch: dict[str, list[str]] = {}
		skipped = 0
		for row in rows:
			branch = _branch_for_row(row, has_company, branches, default_branch)
			if not branch:
				skipped += 1
				continue
			by_branch.setdefault(branch, []).append(row["name"])

		entry = {
			"doctype": doctype,
			"fieldname": fieldname,
			"missing": len(rows),
			"updated": sum(len(names) for names in by_branch.values()),
			"skipped": skipped,
			"branches": {branch: len(names) for branch, names in by_branch.items()},
		}
		summary["total_missing"] += entry["missing"]
		summary["total_skipped"] += skipped
		summary["total_updated"] += entry["updated"]

		if not dry_run:
			for branch, names in by_branch.items():
				for start in range(0, len(names), BRANCH_BACKFILL_BATCH_SIZE):
					frappe.db.set_value(
						doctype,
						{"name": ["in", names[start : start + BRANCH_BACKFILL_BATCH_SIZE]]},
						fieldname,
						branch,
						update_modified=False,
					)

		summary["doctypes"].append(entry)

	if not dry_run and summary["total_updated"]:
		frappe.db.commit()

	return summary


# --------------------------------------------------------------------------- #
# Background job
# --------------------------------------------------------------------------- #
def _cache_key(job_id: str | None = None) -> str:
	return f"dms_branch_backfill_result:{job_id or BRANCH_BACKFILL_JOB_ID}"


def queue_branch_backfill() -> dict:
	"""Queue the Branch backfill on the long queue (only empty branches)."""
	job_id = BRANCH_BACKFILL_JOB_ID
	frappe.cache.delete_value(_cache_key(job_id))

	frappe.enqueue(
		"dms.utils.branch_backfill.run_branch_backfill",
		queue="long",
		timeout=3600,
		job_id=job_id,
		deduplicate=True,
		enqueue_after_commit=True,
		cache_key=job_id,
	)
	return {"queued": 1, "job_id": job_id}


def run_branch_backfill(cache_key: str | None = None):
	"""Background worker: fill the missing branches and cache the summary."""
	summary = backfill_missing_branches(dry_run=False)
	if cache_key:
		frappe.cache.set_value(_cache_key(cache_key), summary, expires_in_sec=BRANCH_BACKFILL_CACHE_TTL)
		frappe.publish_realtime(
			"dms_branch_backfill_done",
			{"job_id": cache_key, **summary},
			user=frappe.session.user,
		)
	return summary


def get_branch_backfill_status(job_id: str | None = None) -> dict:
	"""Poll the background Branch backfill (mirrors the FRT import status API)."""
	job_id = (job_id or "").strip() or BRANCH_BACKFILL_JOB_ID

	cached = frappe.cache.get_value(_cache_key(job_id))
	if cached:
		return {"status": "finished", "result": cached}

	from frappe.utils.background_jobs import get_job, get_job_status

	job = get_job(job_id)
	status = get_job_status(job_id) or "queued"
	status = str(getattr(status, "value", status) or "queued").lower()
	if not job:
		return {"status": "queued"}
	if status == "finished":
		result = job.result if isinstance(job.result, dict) else cached
		if result:
			frappe.cache.set_value(_cache_key(job_id), result, expires_in_sec=BRANCH_BACKFILL_CACHE_TTL)
		return {"status": "finished", "result": result}
	if status == "failed":
		return {"status": "failed", "error": (job.exc_info or _("Branch backfill failed"))[:2000]}
	return {"status": status}
