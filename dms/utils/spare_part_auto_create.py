# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt

AUTO_SPARE_PART_FIELD = "custom_auto_generate_spare_parts"
DEFAULT_PART_CATEGORY = "Genuine Part"
SPARE_PART_BIN_LOCATION_FLAG = "spare_part_bin_location"


def item_group_auto_generates_spare_parts(item_group: str | None) -> bool:
	if not item_group:
		return False
	return bool(frappe.db.get_value("Item Group", item_group, AUTO_SPARE_PART_FIELD))


def spare_part_exists_for_item(item_code: str) -> bool:
	return bool(frappe.db.exists("Spare Part", {"spare_part_item": item_code}))


def _get_item_doc(item: str | Document) -> Document:
	if isinstance(item, Document):
		return item
	return frappe.get_doc("Item", item)


def _resolve_bin_location(bin_location: str | None = None) -> str:
	return (bin_location or frappe.flags.get(SPARE_PART_BIN_LOCATION_FLAG) or "").strip()


def build_spare_part_data_from_item(item: str | Document, bin_location: str | None = None) -> dict:
	item_doc = _get_item_doc(item)
	selling_price = flt(item_doc.get("standard_rate") or 0)

	data = {
		"doctype": "Spare Part",
		"spare_part_item": item_doc.name,
		"oem_part_number": item_doc.item_code,
		"part_category": DEFAULT_PART_CATEGORY,
		"selling_price": selling_price or None,
	}
	resolved = _resolve_bin_location(bin_location)
	if resolved:
		data["bin_location"] = resolved
	return data


def apply_bin_location_to_item_spare_part(item_code: str | None, bin_location: str | None) -> None:
	"""Copy a create-form bin location onto the Spare Part linked to this Item."""
	item_code = (item_code or "").strip()
	bin_location = (bin_location or "").strip()
	if not item_code or not bin_location:
		return
	spare_name = frappe.db.get_value("Spare Part", {"spare_part_item": item_code}, "name")
	if spare_name:
		frappe.db.set_value("Spare Part", spare_name, "bin_location", bin_location)


def try_create_spare_part_from_item(
	item: str | Document, show_message: bool = False, bin_location: str | None = None
) -> str | None:
	"""Create a Spare Part for an Item when its Item Group has auto-generation enabled."""
	if frappe.flags.get("skip_auto_spare_part_from_item"):
		return None

	item_doc = _get_item_doc(item)

	if item_doc.get("disabled"):
		return "skipped"

	if not item_group_auto_generates_spare_parts(item_doc.item_group):
		return None

	if spare_part_exists_for_item(item_doc.name):
		return "skipped"

	if frappe.db.exists("Spare Part", item_doc.item_code):
		return "skipped"

	try:
		sp_doc = frappe.get_doc(build_spare_part_data_from_item(item_doc, bin_location=bin_location))
		sp_doc.insert(ignore_permissions=True)

		if show_message:
			frappe.msgprint(
				_("Spare Part {0} was created automatically for Item {1}.").format(
					frappe.bold(sp_doc.name),
					frappe.bold(item_doc.item_code),
				),
				alert=True,
				indicator="green",
			)
		return "created"
	except Exception:
		frappe.log_error(
			title="Auto-create Spare Part from Item",
			message=f"Item: {item_doc.name}\n{frappe.get_traceback()}",
		)
		return "error"


def auto_create_spare_part_on_item_insert(doc: Document, method=None):
	try_create_spare_part_from_item(doc, show_message=True)


def auto_create_spare_part_on_item_update(doc: Document, method=None):
	if doc.is_new() or not doc.has_value_changed("item_group"):
		return
	try_create_spare_part_from_item(doc, show_message=True)


@frappe.whitelist()
def create_spare_parts_for_item_group(item_group: str | None = None):
	"""Bulk-create Spare Part records for Items in an auto-generate Item Group."""
	frappe.only_for(("System Manager", "Dealer Manager", "Spare Parts Manager"))
	frappe.has_permission("Spare Part", "create", throw=True)

	item_group = (item_group or "").strip()
	if not item_group:
		frappe.throw(_("Item Group is required."))

	if not frappe.db.exists("Item Group", item_group):
		frappe.throw(_("Item Group {0} does not exist.").format(frappe.bold(item_group)))

	if not item_group_auto_generates_spare_parts(item_group):
		frappe.throw(
			_("{0} is not enabled for Item Group {1}.").format(
				frappe.bold(_("Auto Generate Spare Parts")),
				frappe.bold(item_group),
			)
		)

	items = frappe.get_all(
		"Item",
		filters={"item_group": item_group, "disabled": 0},
		pluck="name",
	)

	created = skipped = errors = 0
	for item_code in items:
		result = try_create_spare_part_from_item(item_code)
		if result == "created":
			created += 1
		elif result == "skipped":
			skipped += 1
		elif result == "error":
			errors += 1

	return {
		"total_items": len(items),
		"created": created,
		"skipped": skipped,
		"errors": errors,
	}
