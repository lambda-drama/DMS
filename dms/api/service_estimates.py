"""Service Estimate API for the DMS frontend."""

import frappe
from frappe import _
from frappe.utils import flt

from dms.api.utils import LIST_ORDER_LATEST_CREATED, add_branch_filter, get_dms_companies
from dms.dealer_management_system.doctype.dms_service_estimate.estimate_utils import (
	sync_job_card_from_accepted_estimate,
)
from dms.dealer_management_system.utils.document_links import (
	enrich_estimate_row,
	linked_job_card_for_estimate,
)


def _customer_display_name(customer):
	if not customer:
		return None
	return frappe.db.get_value("Customer", customer, "customer_name")


@frappe.whitelist()
def get_service_estimates(limit=50, offset=0, status=None, customer=None, search=None):
	filters = {}
	if status:
		filters["status"] = status
	if customer:
		filters["customer"] = customer

	companies = get_dms_companies()
	if companies:
		filters["company"] = ["in", companies]

	or_filters = {}
	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"customer": ["like", f"%{search}%"],
			"license_plate": ["like", f"%{search}%"],
			"vehicle_vin": ["like", f"%{search}%"],
		}

	filters = add_branch_filter(filters, doctype="DMS Service Estimate")

	total = len(
		frappe.get_all(
			"DMS Service Estimate",
			filters=filters,
			or_filters=or_filters or None,
			limit_page_length=0,
			pluck="name",
		)
	)

	rows = frappe.get_all(
		"DMS Service Estimate",
		filters=filters,
		or_filters=or_filters or None,
		fields=[
			"name",
			"status",
			"customer",
			"customer_name",
			"vehicle_vin",
			"license_plate",
			"inspection",
			"appointment",
			"diagnostic_invoice",
			"diagnostic_fee",
			"total_before_vat",
			"grand_total",
			"customer_decision",
			"company",
			"posting_date",
			"creation",
			"modified",
		],
		limit=int(limit),
		limit_start=int(offset),
		order_by=LIST_ORDER_LATEST_CREATED,
	)

	for row in rows:
		enrich_estimate_row(row)

	return {"data": rows, "total": total}


@frappe.whitelist()
def get_service_estimate(name):
	if not name:
		frappe.throw(_("Service Estimate name is required"))

	doc = frappe.get_doc("DMS Service Estimate", name)
	doc.check_permission("read")

	result = doc.as_dict()
	result["customer_name"] = result.get("customer_name") or _customer_display_name(doc.customer)
	if doc.vehicle_vin:
		from dms.api.service_packages import resolve_vehicle_model_from_vin

		vm, vm_label = resolve_vehicle_model_from_vin(doc.vehicle_vin)
		result["vehicle_model"] = vm
		result["vehicle_model_label"] = vm_label
	enrich_estimate_row(result)
	if doc.appointment:
		result["assigned_bay"] = frappe.db.get_value(
			"Service Appointment", doc.appointment, "assigned_bay"
		)
	return result


@frappe.whitelist()
def get_customer_terms_and_conditions():
	"""English + Arabic customer terms for estimate approval."""
	from dms.api.common import get_customer_terms_and_conditions as _get

	return _get()


@frappe.whitelist()
def update_service_estimate(name, data):
	if isinstance(data, str):
		import json

		data = json.loads(data)

	doc = frappe.get_doc("DMS Service Estimate", name)
	doc.check_permission("write")

	if doc.status in ("Rejected", "Cancelled"):
		frappe.throw(_("This estimate can no longer be edited."))

	was_accepted = doc.status == "Accepted"

	allowed_child = {"labour", "parts"}
	scalar_fields = {
		"diagnosis_findings",
		"recommended_repairs",
		"service_advisor_notes",
		"internal_notes",
		"service_package",
		"vat_rate",
		"status",
		"warranty_application_type",
		"labour_discount_type",
		"labour_discount_value",
		"parts_discount_type",
		"parts_discount_value",
	}

	for field in scalar_fields:
		if field in data:
			doc.set(field, data[field])

	from dms.dealer_management_system.doctype.dms_job_card.job_card_discount import (
		apply_discount_fields_from_payload,
	)

	if any(k in data for k in ("labour_discount", "parts_discount")):
		apply_discount_fields_from_payload(doc, data)

	for table in allowed_child:
		if table in data and isinstance(data[table], list):
			doc.set(table, [])
			for row in data[table]:
				doc.append(table, row)

	doc.save()
	synced_job_card = None
	if was_accepted:
		synced_job_card = sync_job_card_from_accepted_estimate(doc)
	frappe.db.commit()

	result = doc.as_dict()
	result["customer_name"] = result.get("customer_name") or _customer_display_name(doc.customer)
	if synced_job_card:
		result["synced_job_card"] = synced_job_card
	enrich_estimate_row(result)
	return result


@frappe.whitelist()
def delete_service_estimate(name):
	if not name:
		frappe.throw(_("Service Estimate name is required"))

	doc = frappe.get_doc("DMS Service Estimate", name)
	doc.check_permission("delete")

	linked_jc = linked_job_card_for_estimate(doc.name)
	if linked_jc and frappe.db.exists("DMS Job Card", linked_jc):
		frappe.throw(
			_("Cannot delete — linked job card {0} exists.").format(frappe.bold(linked_jc))
		)

	if doc.diagnostic_invoice and frappe.db.exists("Sales Invoice", doc.diagnostic_invoice):
		frappe.throw(
			_("Cannot delete — diagnostic invoice {0} exists.").format(
				frappe.bold(doc.diagnostic_invoice)
			)
		)

	frappe.delete_doc("DMS Service Estimate", name, force=1)
	frappe.db.commit()
	return {"deleted": name}


@frappe.whitelist()
def get_dms_estimate_settings():
	return {
		"default_diagnostic_fee": flt(
			frappe.db.get_single_value("DMS Settings", "default_diagnostic_fee") or 3000
		),
		"default_vat_rate": flt(frappe.db.get_single_value("DMS Settings", "default_vat_rate") or 15),
		"diagnostic_fee_item": frappe.db.get_single_value("DMS Settings", "diagnostic_fee_item"),
	}
