import frappe
from frappe.utils import add_days, add_months, getdate, nowdate

from dms.api.utils import get_dms_companies

REMINDER_MARKER_PREFIX = "[service-reminder:"


def daily():
	"""Daily scheduler entrypoint for DMS background tasks."""
	send_service_due_reminders()
	_crm_daily()


def _crm_daily():
	"""CRM retention / activity / report snapshot jobs (best-effort)."""
	try:
		from dms.crm_api.activities import activity_engine_daily

		activity_engine_daily()
	except Exception:
		frappe.log_error(frappe.get_traceback(), "CRM activity_engine_daily")
	try:
		from dms.crm_api.ownership_journey import create_anniversary_and_service_reminders

		create_anniversary_and_service_reminders()
	except Exception:
		frappe.log_error(frappe.get_traceback(), "CRM ownership journey daily")
	try:
		from dms.crm_api.reports import daily_pipeline_snapshot

		daily_pipeline_snapshot()
	except Exception:
		frappe.log_error(frappe.get_traceback(), "CRM daily_pipeline_snapshot")

def send_service_due_reminders():
	"""Send periodic service reminders based on Vehicle Model interval-month rules."""
	if not _is_service_reminder_enabled():
		return

	today = getdate(nowdate())
	vehicles = _get_eligible_vehicles()
	if not vehicles:
		return

	last_inspection_by_vin = _get_last_inspection_dates([v.name for v in vehicles])

	sent_count = 0
	for vin in vehicles:
		rule = _resolve_service_interval_rule(vin)
		if not rule:
			continue

		interval_months = int(rule.get("interval_months") or 0)
		if interval_months <= 0:
			continue

		reminder_days = int(rule.get("reminder_days_before") or 0)
		base_date = (
			last_inspection_by_vin.get(vin.name)
			or _to_date(getattr(vin, "delivery_date", None))
			or _to_date(getattr(vin, "registration_date", None))
		)
		if not base_date:
			continue

		due_date = add_months(base_date, interval_months)
		reminder_date = add_days(due_date, -reminder_days)
		if getdate(reminder_date) != today:
			continue

		marker = f"{REMINDER_MARKER_PREFIX}{getdate(due_date)}]"
		if _reminder_already_sent(vin.name, marker):
			continue

		customer = _get_customer_contact(vin.current_customer)
		if not customer:
			continue

		message = _build_reminder_message(vin, customer, due_date, interval_months, rule.get("rule_name"))
		subject = f"Service Reminder: {vin.plate_number or vin.vin_number or vin.name}"

		channel_sent = False
		if customer.get("email_id"):
			channel_sent = _send_email_reminder(customer["email_id"], subject, message, vin.name) or channel_sent
		if customer.get("mobile_no"):
			channel_sent = _send_whatsapp_reminder(customer["mobile_no"], message, vin.name) or channel_sent

		if channel_sent:
			_mark_reminder_sent(vin.name, marker, customer.get("customer_name"), due_date)
			sent_count += 1

	if sent_count:
		frappe.logger().info(f"DMS service reminders sent: {sent_count}")


def _is_service_reminder_enabled() -> bool:
	if not frappe.db.exists("DocType", "DMS Settings"):
		return False
	return bool(int(frappe.db.get_single_value("DMS Settings", "send_reminders_for_servicing") or 0))


def _get_eligible_vehicles():
	filters = {"current_customer": ["is", "set"], "model": ["is", "set"]}
	companies = get_dms_companies()
	if companies:
		filters["company"] = ["in", companies]

	return frappe.get_all(
		"VIN No",
		filters=filters,
		fields=[
			"name",
			"vin_number",
			"plate_number",
			"model",
			"model_name",
			"current_customer",
			"delivery_date",
			"registration_date",
			"fuel_type",
			"is_fleet_vehicle",
		],
		limit_page_length=0,
	)


def _get_last_inspection_dates(vin_names):
	if not vin_names:
		return {}
	rows = frappe.db.sql(
		"""
		SELECT vin_chassis, MAX(inspection_date) AS last_inspection_date
		FROM `tabVehicle Inspection`
		WHERE docstatus < 2 AND vin_chassis IN %(vin_names)s
		GROUP BY vin_chassis
		""",
		{"vin_names": tuple(vin_names)},
		as_dict=True,
	)
	return {r.vin_chassis: _to_date(r.last_inspection_date) for r in rows if r.vin_chassis}


def _resolve_service_interval_rule(vin):
	if not vin.model or not frappe.db.exists("Vehicle Model", vin.model):
		return None

	model_doc = frappe.get_cached_doc("Vehicle Model", vin.model)
	rules = [r for r in (model_doc.get("service_intervals") or []) if int(r.interval_months or 0) > 0]
	if not rules:
		return None

	default_rule = next((r for r in rules if int(r.is_default or 0) == 1), None)

	# Specific condition currently supported in core VIN logic.
	if int(vin.is_fleet_vehicle or 0):
		fleet_rule = next((r for r in rules if (r.condition or "").strip() == "Fleet Vehicle"), None)
		if _rule_fuel_matches(fleet_rule, vin.fuel_type):
			return fleet_rule

	always_rule = next((r for r in rules if (r.condition or "").strip() in ("", "Always")), None)
	if _rule_fuel_matches(always_rule, vin.fuel_type):
		return always_rule

	if _rule_fuel_matches(default_rule, vin.fuel_type):
		return default_rule

	for rule in rules:
		if _rule_fuel_matches(rule, vin.fuel_type):
			return rule
	return None


def _rule_fuel_matches(rule, fuel_type):
	if not rule:
		return False
	applicable = (rule.applicable_fuel_types or "").strip()
	if not applicable:
		return True
	return applicable == (fuel_type or "").strip()


def _get_customer_contact(customer_name):
	if not customer_name:
		return None
	return frappe.db.get_value(
		"Customer",
		customer_name,
		["name", "customer_name", "email_id", "mobile_no"],
		as_dict=True,
	)


def _build_reminder_message(vin, customer, due_date, interval_months, rule_name):
	vehicle_label = vin.model_name or vin.vin_number or vin.name
	plate = vin.plate_number or "N/A"
	customer_name = customer.get("customer_name") or customer.get("name") or "Customer"
	rule_text = f" ({rule_name})" if rule_name else ""
	return (
		f"Dear {customer_name},\n\n"
		f"Your vehicle {vehicle_label} (Plate: {plate}) is due for periodic service on {getdate(due_date)}.\n"
		f"This reminder is based on the {interval_months}-month service interval{rule_text}.\n\n"
		"Please book your service appointment with us.\n\n"
		"Thank you,\n"
		"Service Team"
	)


def _send_email_reminder(email_id, subject, message, vin_name):
	try:
		frappe.sendmail(
			recipients=[email_id],
			subject=subject,
			message=message.replace("\n", "<br>"),
			reference_doctype="VIN No",
			reference_name=vin_name,
		)
		return True
	except Exception:
		frappe.log_error(frappe.get_traceback(), "DMS Service Reminder Email Failed")
		return False


def _send_whatsapp_reminder(mobile_no, message, vin_name):
	try:
		from nextlayer.next_layer.api.whatsapp_utils import send_whatsapp_message
	except ImportError:
		return False

	try:
		result = send_whatsapp_message(
			to_number=mobile_no,
			message_type="text",
			message_content=message,
			reference_doctype="VIN No",
			reference_name=vin_name,
		)
		return bool(result and result.get("success"))
	except Exception:
		frappe.log_error(frappe.get_traceback(), "DMS Service Reminder WhatsApp Failed")
		return False


def _reminder_already_sent(vin_name, marker):
	return bool(
		frappe.db.exists(
			"Comment",
			{
				"reference_doctype": "VIN No",
				"reference_name": vin_name,
				"content": ["like", f"%{marker}%"],
			},
		)
	)


def _mark_reminder_sent(vin_name, marker, customer_name, due_date):
	content = f"{marker} Service reminder sent to {customer_name or 'customer'} for due date {getdate(due_date)}."
	comment = frappe.get_doc(
		{
			"doctype": "Comment",
			"comment_type": "Info",
			"reference_doctype": "VIN No",
			"reference_name": vin_name,
			"content": content,
		}
	)
	comment.insert(ignore_permissions=True)


def _to_date(value):
	if not value:
		return None
	return getdate(value)

