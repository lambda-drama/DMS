# Copyright (c) 2026, Mania and contributors

import hashlib

import frappe
from frappe import _

from dms.utils.frt_sheet_import import DEFAULT_BRAND, import_frt_file_url

FRT_IMPORT_CACHE_TTL = 86400


def _frt_job_id(file_url: str, brand: str) -> str:
	raw = f"{(file_url or '').strip()}|{(brand or DEFAULT_BRAND).strip()}"
	digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]
	return f"frt_import_{digest}"


def _cache_key(job_id: str) -> str:
	return f"frt_import_result:{job_id}"


def run_frt_import(file_url: str, brand: str = DEFAULT_BRAND, cache_key: str | None = None):
	"""Background worker: import the workbook and cache the summary."""
	summary = import_frt_file_url(file_url, brand=brand or DEFAULT_BRAND)
	if cache_key:
		frappe.cache.set_value(_cache_key(cache_key), summary, expires_in_sec=FRT_IMPORT_CACHE_TTL)
		frappe.publish_realtime(
			"frt_import_done",
			{"job_id": cache_key, **summary},
			user=frappe.session.user,
		)
	return summary


@frappe.whitelist()
def import_frt_sheet(file_url=None, brand=None):
	"""Queue FRT workbook import in the background (long queue)."""
	frappe.has_permission("Vehicle Service Item", "create", throw=True)

	file_url = (file_url or "").strip()
	if not file_url:
		frappe.throw(_("Upload an Excel file first"))

	brand = (brand or DEFAULT_BRAND).strip() or DEFAULT_BRAND
	job_id = _frt_job_id(file_url, brand)
	frappe.cache.delete_value(_cache_key(job_id))

	frappe.enqueue(
		"dms.api.frt_import.run_frt_import",
		queue="long",
		timeout=3600,
		job_id=job_id,
		deduplicate=True,
		enqueue_after_commit=True,
		file_url=file_url,
		brand=brand,
		cache_key=job_id,
	)
	return {"queued": 1, "job_id": job_id}


@frappe.whitelist()
def get_frt_import_status(job_id=None):
	"""Poll background FRT import progress."""
	job_id = (job_id or "").strip()
	if not job_id:
		frappe.throw(_("Job is required"))

	cached = frappe.cache.get_value(_cache_key(job_id))
	if cached:
		return {"status": "finished", "result": cached}

	from frappe.utils.background_jobs import get_job, get_job_status

	job = get_job(job_id)
	status = (get_job_status(job_id) or "queued")
	status = str(getattr(status, "value", status) or "queued").lower()
	if not job:
		return {"status": "queued"}
	if status == "finished":
		result = job.result if isinstance(job.result, dict) else cached
		if result:
			frappe.cache.set_value(_cache_key(job_id), result, expires_in_sec=FRT_IMPORT_CACHE_TTL)
		return {"status": "finished", "result": result}
	if status == "failed":
		return {"status": "failed", "error": (job.exc_info or "Import failed")[:2000]}
	return {"status": status}
