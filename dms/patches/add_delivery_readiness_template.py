import frappe


CHECKLIST = (
	("Commercial", "Final price confirmed", 1),
	("Commercial", "Invoice prepared / linked", 1),
	("Commercial", "Deposit received and receipt referenced", 1),
	("Commercial", "Outstanding balance cleared or credit approved", 1),
	("Commercial", "Commercial approvals completed", 1),
	("Vehicle", "VIN / stock unit allocated", 1),
	("Vehicle", "PDI passed", 1),
	("Vehicle", "Accessories installed", 1),
	("Vehicle", "Fuel / charge level set", 1),
	("Vehicle", "Cleaning completed", 1),
	("Documents", "Registration documents ready", 1),
	("Documents", "Insurance documents ready", 1),
	("Documents", "Warranty booklet available", 1),
	("Documents", "Owner manuals available", 1),
	("Documents", "Invoice and delivery note available", 1),
	("Customer", "Delivery appointment scheduled", 1),
	("Customer", "Customer contact confirmation completed", 1),
	("Customer", "Special requests captured", 0),
	("Customer", "Nominated driver confirmed", 1),
	("Handover", "Feature explanation completed", 1),
	("Handover", "Connectivity setup completed", 0),
	("Handover", "Warranty explanation completed", 1),
	("Handover", "First-service schedule confirmed", 1),
	("Handover", "Customer / dealer signatures captured", 1),
	("CRM", "Delivery status updated", 1),
	("CRM", "Actual handover time recorded", 1),
	("CRM", "Handover photos attached where permitted", 0),
	("CRM", "Satisfaction callback scheduled", 1),
	("CRM", "Next contact task created", 1),
)


def execute():
	name = "Standard New Vehicle Delivery Readiness"
	if frappe.db.exists("DMS CRM Delivery Readiness Template", name):
		return
	template = frappe.get_doc(
		{
			"doctype": "DMS CRM Delivery Readiness Template",
			"template_name": name,
			"is_active": 1,
			"is_default": 1,
			"version": "1.0",
			"description": "Blueprint §8.2 commercial, vehicle, documents, customer, handover and CRM readiness.",
		}
	)
	for category, check_item, is_mandatory in CHECKLIST:
		template.append(
			"checklist_items",
			{
				"category": category,
				"check_item": check_item,
				"is_mandatory": is_mandatory,
			},
		)
	template.insert(ignore_permissions=True)
