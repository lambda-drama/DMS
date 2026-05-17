# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Sync VIN No from Serial No + Serial and Batch Bundle.

ERPNext sets serial status/customer via SQL (qb.update), not doc.save(), so Serial No
on_update does not run on Delivery Note / Sales Invoice. Use Stock Ledger Entry instead.
"""

import frappe
from frappe.utils import getdate

SERIAL_TO_VEHICLE_STATUS = {
	"Active": "In Stock",
	"Delivered": "Delivered to Customer",
	"Consumed": "Scrapped",
	"Inactive": "In Stock",
	"Expired": "In Stock",
}

# Standard vehicle sale only (not repair / workshop delivery)
SALES_VOUCHERS = frozenset({"Delivery Note", "Sales Invoice"})


def map_serial_status_to_vehicle_status(serial_status):
	return SERIAL_TO_VEHICLE_STATUS.get(serial_status or "", "In Stock")


def get_vin_name_for_serial(serial):
	serial_no = serial.serial_no if hasattr(serial, "serial_no") else serial.get("serial_no")
	serial_name = serial.name if hasattr(serial, "name") else serial.get("name")

	vin_name = frappe.db.get_value("VIN No", {"vin_number": serial_no})
	if vin_name:
		return vin_name
	return frappe.db.get_value("VIN No", {"linked_serial": serial_name})


def get_latest_outward_bundle_for_serial(serial_name):
	"""Latest submitted outward bundle that includes this serial."""
	parents = frappe.get_all(
		"Serial and Batch Entry",
		filters={"serial_no": serial_name},
		pluck="parent",
	)
	if not parents:
		return None

	bundle_name = frappe.db.get_value(
		"Serial and Batch Bundle",
		{
			"name": ["in", parents],
			"docstatus": 1,
			"type_of_transaction": "Outward",
			"voucher_type": ["in", list(SALES_VOUCHERS)],
		},
		"name",
		order_by="posting_datetime desc, creation desc",
	)
	return frappe.get_doc("Serial and Batch Bundle", bundle_name) if bundle_name else None


def resolve_delivery_customer_and_date(serial, bundle=None):
	customer = serial.customer
	delivery_date = serial.posting_date

	bundle = bundle or get_latest_outward_bundle_for_serial(serial.name)
	if bundle and bundle.voucher_type in SALES_VOUCHERS and bundle.voucher_no:
		if bundle.posting_datetime:
			delivery_date = getdate(bundle.posting_datetime)
		if not customer:
			customer = frappe.db.get_value(bundle.voucher_type, bundle.voucher_no, "customer")

	return customer, delivery_date


def build_vin_updates_from_serial(serial, bundle=None):
	updates = {"vehicle_status": map_serial_status_to_vehicle_status(serial.status)}

	if serial.status == "Delivered":
		customer, delivery_date = resolve_delivery_customer_and_date(serial, bundle=bundle)
		if customer:
			updates["current_customer"] = customer
		if delivery_date:
			updates["delivery_date"] = delivery_date
		if not serial.warranty_start_date and delivery_date:
			updates["warranty_start_date"] = delivery_date
	elif serial.customer:
		updates["current_customer"] = serial.customer

	if serial.warranty_expiry_date:
		updates["warranty_end_date"] = serial.warranty_expiry_date

	return updates


def sync_vin_from_serial_no(serial_name, bundle=None):
	if frappe.flags.get("skip_vin_serial_sync"):
		return

	serial = frappe.get_doc("Serial No", serial_name)
	vin_name = get_vin_name_for_serial(serial)
	if not vin_name:
		return

	updates = build_vin_updates_from_serial(serial, bundle=bundle)
	vin = frappe.get_doc("VIN No", vin_name)

	changed = False
	for field, value in updates.items():
		if value is not None and vin.get(field) != value:
			vin.set(field, value)
			changed = True

	if not changed:
		return

	frappe.flags.skip_vin_serial_sync = True
	try:
		vin.calculate_warranty_status()
		vin.save(ignore_permissions=True)
	finally:
		frappe.flags.skip_vin_serial_sync = False


def sync_vin_on_serial_update(doc, method=None):
	"""Desk manual save only — stock sales do not trigger on_update."""
	if frappe.flags.get("skip_auto_vin_from_serial") or frappe.flags.get("skip_vin_serial_sync"):
		return

	def _run():
		sync_vin_from_serial_no(doc.name)

	frappe.db.after_commit.add(_run)


def sync_vin_on_stock_ledger_entry(doc, method=None):
	"""Outward DN/SI: ERPNext updates serial via SQL after bundle submit; sync after commit."""
	if doc.is_cancelled or doc.actual_qty >= 0 or doc.voucher_type not in SALES_VOUCHERS:
		return

	bundle_name = doc.serial_and_batch_bundle
	if not bundle_name:
		return

	def _run():
		bundle = frappe.get_doc("Serial and Batch Bundle", bundle_name)
		for row in bundle.entries:
			if row.serial_no:
				sync_vin_from_serial_no(row.serial_no, bundle=bundle)

	frappe.db.after_commit.add(_run)
