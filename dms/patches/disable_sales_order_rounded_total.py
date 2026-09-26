# Copyright (c) 2026, Mania and contributors

"""Turn off rounded totals on the Sales Orders DMS owns.

Rounding on a Sales Order is display-only — nothing posts from it — and DMS shows
the exact figure on orders and on the invoices converted from them, so an order
must never print "Rounded Total" next to a different Grand Total. New orders get
the flag from ``create_standalone_dms_sales_order`` / ``amend_dms_order``; this
backfills the ones created before that.

Only the Sales Order families this app creates are touched: DMS orders, spare
part proformas, and rows only identifiable through the DMS Order remarks marker.
Cancelled orders are left alone.
"""

from __future__ import annotations

import frappe


def execute():
	meta = frappe.get_meta("Sales Order")
	if not meta.has_field("disable_rounded_total"):
		return

	from dms.api.orders import (
		ORDER_FLAG_FIELD,
		ORDER_REMARKS_PREFIX,
		PROFORMA_FLAG_FIELD,
	)

	# (condition SQL, params) for every way a Sales Order can belong to DMS.
	conditions: list[tuple[str, list]] = []
	for fieldname in (ORDER_FLAG_FIELD, PROFORMA_FLAG_FIELD):
		if meta.has_field(fieldname):
			conditions.append((f"ifnull(`{fieldname}`, 0) = 1", []))
	if meta.has_field("remarks"):
		conditions.append(("ifnull(`remarks`, '') like %s", [f"%{ORDER_REMARKS_PREFIX}%"]))

	if not conditions:
		frappe.log_error(
			message="No DMS marker on Sales Order — skipped the rounded total backfill",
			title="Disable rounded total on Sales Orders",
		)
		return

	# Zero the stored rounding too: print formats show the row whenever the value
	# is non-zero, so flipping the flag alone would leave the old figure visible.
	updates = ["`disable_rounded_total` = 1"]
	for fieldname in (
		"rounded_total",
		"base_rounded_total",
		"rounding_adjustment",
		"base_rounding_adjustment",
	):
		if meta.has_field(fieldname):
			updates.append(f"`{fieldname}` = 0")

	where = " or ".join(f"({condition})" for condition, _ in conditions)
	params = [value for _, values in conditions for value in values]

	touched = frappe.db.sql(
		f"""
		update `tabSales Order`
		set {", ".join(updates)}
		where ifnull(`disable_rounded_total`, 0) = 0
		  and docstatus < 2
		  and ({where})
		""",
		params,
	)
	frappe.db.commit()

	frappe.logger("dms").info(
		"disable_sales_order_rounded_total: cleared rounding on %s Sales Order(s)",
		touched or 0,
	)
