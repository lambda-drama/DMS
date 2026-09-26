# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""DMS app setup — runs on install and on every ``bench migrate``.

The app creates a few *runtime* custom fields (Sales Order DMS flags and VIN link,
Vehicle Labour Item display name, Quotation ← CRM opportunity link…). They used to
be created lazily, the first time a screen touched them — which failed for normal
users with *"User … does not have doctype access via role permission for document
Custom Field"*.

Creating them here (migrate runs as Administrator) keeps every screen read-only
with respect to custom fields; the lazy fallbacks in the API modules now skip
silently for users without the privilege.
"""

from __future__ import annotations

import frappe


def ensure_runtime_custom_fields() -> None:
	"""Create every DMS runtime custom field (idempotent, Administrator context)."""
	from dms.api.orders import ensure_sales_order_dms_order_field
	from dms.crm_api.opportunities import _ensure_quotation_link_field
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		ensure_sales_order_tax_withholding_fields,
		ensure_sales_order_vehicle_vin_field,
	)
	from dms.dealer_management_system.doctype.vehicle_labour_item.vehicle_labour_item import (
		ensure_labour_display_name_field,
	)
	from dms.utils.user_password import ensure_force_password_field

	for ensure in (
		ensure_sales_order_dms_order_field,
		ensure_sales_order_vehicle_vin_field,
		ensure_sales_order_tax_withholding_fields,
		_ensure_quotation_link_field,
		ensure_labour_display_name_field,
		ensure_force_password_field,
	):
		try:
			ensure()
		except Exception:
			# Never block a migrate on one missing field — the lazy fallbacks and the
			# next migrate retry, and the error is visible in Error Log.
			frappe.log_error(
				message=frappe.get_traceback(),
				title=f"DMS runtime custom field setup failed: {ensure.__module__}.{ensure.__name__}",
			)


def after_migrate() -> None:
	"""Hook (dms.hooks.after_migrate) — keep runtime custom fields in sync."""
	ensure_runtime_custom_fields()


def after_install() -> None:
	"""New sites get the runtime custom fields right away."""
	ensure_runtime_custom_fields()
