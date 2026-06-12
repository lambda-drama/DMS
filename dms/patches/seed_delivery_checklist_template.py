"""Seed the standard vehicle delivery checklist template."""

import frappe

TEMPLATE_NAME = "Standard Vehicle Delivery"

CHECKLIST_ITEMS = [
	"Vehicle interior cleaned",
	"Vehicle exterior washed/wiped",
	"No tools/parts left inside vehicle",
	"Personal items returned to customer",
	"All keys returned (quantity checked)",
	"Remote/key fob working",
	"Owner manual/service booklet in glovebox",
	"Warranty booklet stamped/updated",
	"Service reminder sticker applied",
	"Invoice explained and copy given",
	"Next service due communicated",
	"Vehicle damage explained (if any)",
	"Fuel level confirmed",
	"Any warning lights on?",
	"Test drive completed with customer (if requested)",
	"Customer satisfied with repair",
]


def execute():
	if frappe.db.exists("Delivery Checklist Template", TEMPLATE_NAME):
		doc = frappe.get_doc("Delivery Checklist Template", TEMPLATE_NAME)
	else:
		doc = frappe.new_doc("Delivery Checklist Template")
		doc.template_name = TEMPLATE_NAME

	doc.is_active = 1
	doc.is_default = 1
	doc.version = doc.version or "1.0"
	doc.description = (
		doc.description
		or "Standard handover checklist — complete all items before releasing the vehicle to the customer."
	)
	doc.set("checklist_items", [])
	for item in CHECKLIST_ITEMS:
		doc.append("checklist_items", {"check_item": item})

	doc.save(ignore_permissions=True)
	frappe.db.commit()
