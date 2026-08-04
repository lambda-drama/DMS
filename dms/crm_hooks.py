# Copyright (c) 2026, Mania and contributors
"""CRM-only hooks — kept separate from DMS hooks.

Imported and merged by `dms.hooks` so CRM fixtures / events never live inside
DMS business logic modules.
"""

from __future__ import annotations

# Roles are synced via the shared Role fixture entry in hooks.py
# (DMS CRM User / DMS CRM Manager). Keep CRM-only fixture additions here.
crm_fixtures: list = []

crm_doc_events: dict = {}

# "all" runs every few minutes — used for unaccepted lead reassignment (§5.3)
crm_scheduler_events: dict = {
	"all": ["dms.crm_api.tasks.reassign_unaccepted_leads"],
	"daily": [
		"dms.crm_api.tasks.expire_quotations",
		"dms.crm_api.tasks.ownership_journey_reminders",
		"dms.crm_api.tasks.service_retention_daily",
		"dms.crm_api.tasks.case_sla_daily",
		"dms.crm_api.tasks.activity_engine_daily",
	],
}


def apply_crm_hooks(hooks_globals: dict) -> None:
	"""Merge CRM fixtures / events into the app hooks namespace."""
	existing_fixtures = hooks_globals.get("fixtures") or []
	if isinstance(existing_fixtures, list):
		hooks_globals["fixtures"] = list(existing_fixtures) + list(crm_fixtures)

	existing_doc_events = hooks_globals.get("doc_events") or {}
	if isinstance(existing_doc_events, dict):
		merged = dict(existing_doc_events)
		for doctype, events in crm_doc_events.items():
			if doctype in merged:
				base = merged[doctype]
				if isinstance(base, dict) and isinstance(events, dict):
					combined = dict(base)
					for event, handlers in events.items():
						prev = combined.get(event)
						if prev is None:
							combined[event] = handlers
						elif isinstance(prev, list):
							combined[event] = prev + (
								handlers if isinstance(handlers, list) else [handlers]
							)
						else:
							combined[event] = [prev] + (
								handlers if isinstance(handlers, list) else [handlers]
							)
					merged[doctype] = combined
				else:
					merged[doctype] = events
			else:
				merged[doctype] = events
		hooks_globals["doc_events"] = merged

	existing_scheduler = hooks_globals.get("scheduler_events") or {}
	if isinstance(existing_scheduler, dict):
		sched = dict(existing_scheduler)
		for freq, jobs in crm_scheduler_events.items():
			# cron is a nested dict: {"*/5 * * * *": [jobs]}
			if freq == "cron" and isinstance(jobs, dict):
				cron = dict(sched.get("cron") or {})
				for expression, cron_jobs in jobs.items():
					prev = cron.get(expression) or []
					extra = cron_jobs if isinstance(cron_jobs, list) else [cron_jobs]
					cron[expression] = list(prev) + list(extra)
				sched["cron"] = cron
				continue

			prev = sched.get(freq) or []
			extra = jobs if isinstance(jobs, list) else [jobs]
			sched[freq] = list(prev) + list(extra)
		hooks_globals["scheduler_events"] = sched
