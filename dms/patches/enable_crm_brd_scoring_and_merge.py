"""Enable CRM BRD gaps: hard pipeline enforce, scoring fields, settings defaults."""

from __future__ import annotations

import frappe


def execute():
	# Reload doctypes with new scoring / settings fields and sync DB columns
	for module, dt in (
		("customer_relationship_management", "dms_crm_lead"),
		("customer_relationship_management", "dms_crm_settings"),
	):
		try:
			frappe.reload_doc(module, "doctype", dt, force=True)
		except Exception:
			frappe.log_error(frappe.get_traceback(), f"reload {dt}")

	# Lead is a normal table DocType — sync columns.
	# Settings is a Single (stored in tabSingles) — no updatedb table.
	try:
		frappe.db.updatedb("DMS CRM Lead")
	except Exception:
		frappe.log_error(frappe.get_traceback(), "updatedb DMS CRM Lead")

	frappe.clear_cache(doctype="DMS CRM Lead")
	frappe.clear_cache(doctype="DMS CRM Settings")

	if not frappe.db.exists("DocType", "DMS CRM Settings"):
		return

	if not frappe.db.exists("DMS CRM Settings", "DMS CRM Settings"):
		frappe.get_doc({"doctype": "DMS CRM Settings"}).insert(ignore_permissions=True)

	doc = frappe.get_single("DMS CRM Settings")
	doc.hard_enforce_next_action = 1
	doc.require_close_date_on_opportunity = 1
	doc.require_next_action_on_lead = 1

	meta = frappe.get_meta("DMS CRM Settings")
	defaults = {
		"score_hot_threshold": 70,
		"score_warm_threshold": 40,
		"score_weight_engagement": 25,
		"score_weight_readiness": 30,
		"score_weight_fit": 20,
		"score_weight_relationship": 15,
		"score_weight_risk": 10,
	}
	for field, value in defaults.items():
		if meta.has_field(field) and not doc.get(field):
			doc.set(field, value)

	doc.flags.ignore_permissions = True
	doc.save()
	frappe.db.commit()

	# Backfill scores for open leads (best-effort)
	if not frappe.db.exists("DocType", "DMS CRM Lead"):
		return
	lead_meta = frappe.get_meta("DMS CRM Lead")
	if not lead_meta.has_field("score_band"):
		return
	if not frappe.db.has_column("DMS CRM Lead", "score_band"):
		return

	from dms.crm_api.scoring import apply_lead_score

	names = frappe.get_all(
		"DMS CRM Lead",
		filters={"status": ["not in", ["Converted", "Disqualified", "Duplicate", "Invalid"]]},
		pluck="name",
		limit_page_length=200,
	)
	for name in names:
		try:
			lead = frappe.get_doc("DMS CRM Lead", name)
			apply_lead_score(lead)
			lead.flags.ignore_permissions = True
			lead.save()
		except Exception:
			frappe.db.rollback()
			continue
	frappe.db.commit()
