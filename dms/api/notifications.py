import frappe
from frappe.utils import cint
from frappe.utils import add_user_info

DMS_NOTIFICATION_DOCTYPES = (
	"Service Appointment",
	"DMS Job Card",
	"DMS Service Estimate",
	"DMS Parts Request",
)


@frappe.whitelist()
def get_dms_notification_logs(limit=20):
	"""Notification logs for DMS workflow doctypes only."""
	limit = max(1, min(cint(limit) or 20, 50))

	notification_logs = frappe.db.get_list(
		"Notification Log",
		filters={"document_type": ["in", list(DMS_NOTIFICATION_DOCTYPES)]},
		fields=["*"],
		limit=limit,
		order_by="creation desc",
	)

	users = {log.from_user for log in notification_logs if log.from_user}
	user_info = frappe._dict()
	for user in users:
		add_user_info(user, user_info)

	return {"notification_logs": notification_logs, "user_info": user_info}


@frappe.whitelist()
def mark_dms_notifications_read(docname=None):
	"""Mark one or all unread DMS notification logs as read for the current user."""
	if docname:
		frappe.has_permission("Notification Log", docname=str(docname), ptype="read", throw=True)
		frappe.db.set_value("Notification Log", str(docname), "read", 1, update_modified=False)
		return

	unread = frappe.get_all(
		"Notification Log",
		filters={
			"read": 0,
			"for_user": frappe.session.user,
			"document_type": ["in", list(DMS_NOTIFICATION_DOCTYPES)],
		},
		pluck="name",
	)
	if unread:
		frappe.db.set_value(
			"Notification Log",
			{"name": ["in", unread]},
			"read",
			1,
			update_modified=False,
		)
