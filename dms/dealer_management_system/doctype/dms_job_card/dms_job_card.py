# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt

from dms.dealer_management_system.doctype.dms_job_card.job_card_costing import (
	is_labour_row_billable,
	is_part_row_billable,
	part_issue_qty,
	spare_part_default_selling_price,
	spare_part_unit_cost,
	apply_vehicle_labour_row_pricing,
)


class DMSJobCard(Document):
	def validate(self):
		self.ensure_qc_results_from_template()
		self.validate_qc_measurements()
		self.calculate_costing_and_totals()

	def before_submit(self):
		if not self.company:
			frappe.throw(_("Set Company before submitting the Job Card."))

	def calculate_costing_and_totals(self):
		"""Totals exclude warranty labour/parts.

		• total_labor_cost — billable labour (hours × rate).
		• total_parts_cost — billable parts at cost (qty × spare/Item cost basis).
		• total_amount / net_amount — customer subtotal incl. discounted parts pricing.
		"""
		total_labor = 0.0
		total_parts_at_cost = 0.0
		total_parts_sell = 0.0

		for row in self.labour or []:
			row.amount = apply_vehicle_labour_row_pricing(row)
			if is_labour_row_billable(row):
				total_labor += flt(row.amount)

		for row in self.parts or []:
			if not row.item_code:
				continue

			qty = part_issue_qty(row)
			if flt(row.unit_price or 0) <= 0:
				row.unit_price = spare_part_default_selling_price(row.item_code)

			row.total_amount = round(qty * flt(row.unit_price or 0), 2)

			if not is_part_row_billable(row):
				continue

			unit_cost = spare_part_unit_cost(row.item_code)
			total_parts_at_cost += round(qty * unit_cost, 2)
			total_parts_sell += flt(row.total_amount)

		self.total_labor_cost = round(total_labor, 2)
		self.total_parts_cost = round(total_parts_at_cost, 2)
		self.total_amount = round(total_labor + total_parts_sell, 2)
		self.net_amount = round(self.total_amount - flt(self.discount_amount or 0), 2)

	def ensure_qc_results_from_template(self):
		"""When a template is set and results are empty, copy lines (no link to template child names)."""
		if not self.qc_checklist_template:
			return
		if self.qc_results:
			return
		template = frappe.get_doc("QC Checklist Template", self.qc_checklist_template)
		for item in template.get("checklist_items") or []:
			display = item.get("check_item")
			if display:
				display = (
					frappe.db.get_value("QC Checklist Item Master", display, "qc_checklist_item") or display
				)

			req_m = cint(item.get("requires_measurement"))
			self.append(
				"qc_results",
				{
					"check_item_text": display or "",
					"category": item.get("category"),
					"is_mandatory": item.get("is_mandatory"),
					"requires_photo": item.get("requires_photo"),
					"requires_measurement": item.get("requires_measurement"),
					"min_value": item.min_value if req_m else None,
					"max_value": item.max_value if req_m else None,
					"result": "Pass",
				},
			)

	def validate_qc_measurements(self):
		"""Use min/max copied onto each QC result row (no checklist_item link)."""
		for result in self.qc_results or []:
			if not cint(getattr(result, "requires_measurement", 0)):
				continue
			if getattr(result, "measurement_value", None) is None:
				continue

			fail = False
			min_v = getattr(result, "min_value", None)
			max_v = getattr(result, "max_value", None)
			if min_v is not None and result.measurement_value < min_v:
				fail = True
			if max_v is not None and result.measurement_value > max_v:
				fail = True
			if fail:
				result.result = "Fail"


@frappe.whitelist()
def make_sales_invoice_from_job_card(job_card):
	from dms.dealer_management_system.doctype.dms_job_card.invoice_utils import (
		create_sales_invoice_from_dms_job_card,
	)

	job_card_name = (job_card or "").strip()
	if not job_card_name:
		frappe.throw(_("Job Card name is required."))

	frappe.has_permission("Sales Invoice", "create", throw=True)
	frappe.has_permission("DMS Job Card", "read", job_card_name, throw=True)

	return create_sales_invoice_from_dms_job_card(job_card_name)


@frappe.whitelist()
def get_job_card_part_stock_available(spare_part: str | None = None, warehouse: str | None = None):
	"""Qty on hand for the Spare Part's linked ERP Item (replaces invalid fetch_from on actual_qty)."""
	spare_part = (spare_part or "").strip()
	if not spare_part:
		return None
	if not frappe.db.exists("Spare Part", spare_part):
		return None

	erp_item = frappe.db.get_value("Spare Part", spare_part, "spare_part_item")
	if not erp_item:
		return None

	warehouse = (warehouse or "").strip() or None

	try:
		from erpnext.stock.utils import get_stock_balance
	except ImportError:
		get_stock_balance = None

	if get_stock_balance and warehouse:
		return flt(get_stock_balance(erp_item, warehouse))

	if not frappe.db.has_table("tabBin"):
		return None

	if warehouse:
		qty = frappe.db.sql(
			"""select sum(actual_qty) from `tabBin` where item_code = %s and warehouse = %s""",
			(erp_item, warehouse),
		)
	else:
		qty = frappe.db.sql(
			"""select sum(actual_qty) from `tabBin` where item_code = %s""",
			(erp_item,),
		)

	return flt(qty[0][0]) if qty and qty[0][0] is not None else 0.0
