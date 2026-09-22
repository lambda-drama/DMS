# Copyright (c) 2026, Mania and contributors

"""Flag existing DMS orders before the Orders list filters on the DMS Order flag.

``custom_dms_order`` is a runtime Custom Field: orders created before it existed
were only identifiable through the "DMS Order" remarks marker (when the site has a
``remarks`` field on Sales Order). The Orders list filters on the flag as soon as
the field exists, so flag those rows now — otherwise they would silently disappear
from the Orders screen after this deploy.
"""

from __future__ import annotations

import frappe


def execute():
	from dms.api.orders import (
		ORDER_FLAG_FIELD,
		ORDER_REMARKS_PREFIX,
		ensure_sales_order_dms_order_field,
	)

	# Creates the field (and its column) when the site never had it.
	ensure_sales_order_dms_order_field()

	meta = frappe.get_meta("Sales Order")
	if not meta.has_field(ORDER_FLAG_FIELD):
		frappe.log_error(
			message="custom_dms_order missing — skipped DMS order flag backfill",
			title="DMS order flag backfill",
		)
		return

	# Stock ERPNext Sales Order has no remarks column — nothing to identify legacy rows by.
	if not meta.has_field("remarks"):
		return

	# Never touch spare part proformas (the other Sales Order family).
	proforma_guard = ""
	if meta.has_field("custom_spare_parts_proforma"):
		proforma_guard = " and ifnull(`custom_spare_parts_proforma`, 0) = 0"

	frappe.db.sql(
		f"""
		update `tabSales Order`
		set `{ORDER_FLAG_FIELD}` = 1
		where ifnull(`{ORDER_FLAG_FIELD}`, 0) = 0
		  and ifnull(remarks, '') like %s
		  {proforma_guard}
		""",
		f"%{ORDER_REMARKS_PREFIX}%",
	)
	frappe.db.commit()
