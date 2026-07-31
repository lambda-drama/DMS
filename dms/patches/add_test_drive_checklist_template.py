import frappe


CHECKLIST = (
	("Identity & Consent", "Driver licence / ID verified", 1),
	("Identity & Consent", "Customer consent captured", 1),
	("Vehicle & Safety", "Vehicle VIN / stock unit verified", 1),
	("Vehicle & Safety", "Tyres and warning lights checked", 1),
	("Vehicle & Safety", "Seat belts and mirrors checked", 1),
	("Pre-drive Condition", "Existing body and interior condition recorded", 1),
	("Pre-drive Condition", "Fuel / charge level recorded", 1),
	("Pre-drive Condition", "Start odometer recorded", 1),
	("During Drive", "Approved route and safety briefing confirmed", 1),
	("Post-drive Condition", "End odometer and vehicle condition recorded", 1),
	("Customer Evaluation", "Customer feedback and preferences captured", 1),
	("Customer Evaluation", "Outcome and next action selected", 1),
)


def execute():
	name = "Standard Test Drive Checklist"
	if frappe.db.exists("DMS CRM Test Drive Checklist Template", name):
		return

	template = frappe.get_doc(
		{
			"doctype": "DMS CRM Test Drive Checklist Template",
			"template_name": name,
			"is_active": 1,
			"is_default": 1,
			"version": "1.0",
			"description": "Standard safety, consent, vehicle condition and customer evaluation checklist.",
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
