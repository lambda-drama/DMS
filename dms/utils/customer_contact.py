# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

"""Keep a Customer's phone / email in sync with its primary Contact.

ERPNext defines ``Customer.mobile_no`` and ``Customer.email_id`` as *Read Only*
fields with ``fetch_from = customer_primary_contact.mobile_no / .email_id``.
Frappe re-applies ``fetch_from`` on every insert / save
(``Document._validate_links`` -> ``BaseDocument.set_fetch_from_value``), so
assigning those columns on the Customer document is silently reverted and the
DMS / CRM screens keep showing the old value.

The linked Contact is therefore the source of truth. These helpers write the
phone / email there (creating and linking a primary Contact when the customer
has none) and then mirror the primary values back onto the ``tabCustomer`` row,
which is what the DMS / CRM APIs read directly.
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.contacts.doctype.contact.contact import get_default_contact

#: Sentinel so callers can pass an explicit ``""`` to clear a value.
UNSET = object()


def get_primary_contact(customer: str) -> str | None:
	"""Return the Contact that ``Customer.mobile_no`` / ``email_id`` fetch from."""
	if not customer:
		return None
	contact = frappe.db.get_value("Customer", customer, "customer_primary_contact")
	if contact:
		return contact
	return get_default_contact("Customer", customer) or None


def _ensure_primary_contact(customer: str, email_id: str, mobile_no: str) -> str:
	"""Create and link a primary Contact for a customer that has none."""
	customer_doc = frappe.get_doc("Customer", customer)
	contact = frappe.get_doc(
		{
			"doctype": "Contact",
			"is_primary_contact": 1,
			"links": [{"link_doctype": "Customer", "link_name": customer}],
		}
	)
	full_name = (customer_doc.customer_name or customer).strip()
	if (customer_doc.customer_type or "") == "Company":
		contact.company_name = full_name
	else:
		contact.first_name = full_name.split(" ")[0] or full_name
		if " " in full_name:
			contact.last_name = full_name.split(" ", 1)[1]

	_sync_email(contact, email_id)
	_sync_mobile(contact, mobile_no)
	# ERPNext performs the same writes from Customer.on_update via db_set /
	# frappe.set_value (i.e. without checking Contact permission). Callers already
	# hold Customer write permission, so keep the sync consistent with ERPNext.
	contact.insert(ignore_permissions=True)
	frappe.db.set_value(
		"Customer",
		customer,
		"customer_primary_contact",
		contact.name,
		update_modified=False,
	)
	return contact.name


def _drop_primary_rows(contact, rows: list, flag_field: str) -> None:
	"""Remove primary child rows so a cleared value stops resolving on the parent.

	``Contact.set_primary_email`` / ``set_primary`` re-promote the only remaining
	row, so clearing cannot be done by unsetting the flag alone. Removing the row
	is how the Desk Contact form clears a value, and the child ``email_id`` /
	``phone`` fields are mandatory, so a blank row is not an option.
	"""
	for row in [r for r in rows if r.get(flag_field)] or rows:
		contact.remove(row)


def _sync_email(contact, email_id: str) -> None:
	"""Make ``email_id`` the contact's primary email (no stale primary rows)."""
	email_id = (email_id or "").strip()
	rows = list(contact.get("email_ids") or [])
	if not email_id:
		_drop_primary_rows(contact, rows, "is_primary")
		return

	index = next(
		(i for i, r in enumerate(rows) if (r.email_id or "").strip().lower() == email_id.lower()),
		None,
	)
	if index is None:
		if not rows:
			contact.append("email_ids", {"email_id": email_id, "is_primary": 1})
			return
		# Reuse the current primary row (or the first) so the table stays tidy.
		index = next((i for i, r in enumerate(rows) if r.is_primary), 0)
		rows[index].email_id = email_id

	for i, row in enumerate(rows):
		row.is_primary = 1 if i == index else 0


def _sync_mobile(contact, mobile_no: str) -> None:
	"""Make ``mobile_no`` the contact's primary mobile number."""
	mobile_no = (mobile_no or "").strip()
	rows = list(contact.get("phone_nos") or [])
	if not mobile_no:
		_drop_primary_rows(contact, rows, "is_primary_mobile_no")
		return

	index = next((i for i, r in enumerate(rows) if (r.phone or "").strip() == mobile_no), None)
	if index is None:
		if not rows:
			contact.append("phone_nos", {"phone": mobile_no, "is_primary_mobile_no": 1})
			return
		index = next((i for i, r in enumerate(rows) if r.is_primary_mobile_no), 0)
		rows[index].phone = mobile_no

	for i, row in enumerate(rows):
		row.is_primary_mobile_no = 1 if i == index else 0


def changed_contact_values(customer: str, *, mobile_no=UNSET, email_id=UNSET) -> dict:
	"""Return only the phone / email values that differ from the Customer row.

	Callers use this to translate a form post-back into a real change set, so a
	form that echoes back the values it was seeded with never rewrites — or
	clears — the primary Contact.
	"""
	current = frappe.db.get_value("Customer", customer, ["mobile_no", "email_id"], as_dict=True) or {}
	stored_mobile = (current.get("mobile_no") or "").strip()
	stored_email = (current.get("email_id") or "").strip()

	changes: dict[str, str] = {}
	if mobile_no is not UNSET:
		value = (mobile_no or "").strip()
		if value != stored_mobile:
			changes["mobile_no"] = value
	if email_id is not UNSET:
		value = (email_id or "").strip()
		if value != stored_email:
			changes["email_id"] = value
	return changes


def sync_customer_contact(customer: str, *, mobile_no=UNSET, email_id=UNSET) -> dict:
	"""Write phone / email to the customer's primary Contact and mirror onto the row.

	Pass only the fields you want to change: omit a field (or leave it
	``UNSET``) to keep the current value, pass ``""`` to clear it. Use
	:func:`changed_contact_values` to work out what actually changed.

	Returns ``{"contact", "mobile_no", "email_id"}`` with the stored values.
	"""
	customer = (customer or "").strip()
	if not customer:
		frappe.throw(_("Customer is required."))
	if not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found.").format(customer))

	new_mobile = None if mobile_no is UNSET else (mobile_no or "").strip()
	new_email = None if email_id is UNSET else (email_id or "").strip()

	if new_mobile is None and new_email is None:
		current = frappe.db.get_value("Customer", customer, ["mobile_no", "email_id"], as_dict=True) or {}
		return {
			"contact": get_primary_contact(customer),
			"mobile_no": (current.get("mobile_no") or "").strip(),
			"email_id": (current.get("email_id") or "").strip(),
		}

	contact_name = get_primary_contact(customer)
	if not contact_name and (new_mobile or new_email):
		# No Contact yet — create and link one carrying the new values.
		contact_name = _ensure_primary_contact(customer, new_email or "", new_mobile or "")
	elif contact_name:
		contact = frappe.get_doc("Contact", contact_name)
		if new_email is not None:
			_sync_email(contact, new_email)
		if new_mobile is not None:
			_sync_mobile(contact, new_mobile)
		if not frappe.db.get_value("Customer", customer, "customer_primary_contact"):
			# Adopt the linked contact as the customer's explicit primary.
			contact.is_primary_contact = 1
			frappe.db.set_value(
				"Customer",
				customer,
				"customer_primary_contact",
				contact_name,
				update_modified=False,
			)
		contact.flags.ignore_mandatory = True
		contact.save(ignore_permissions=True)
	else:
		# Clears only, and no Contact to sync: write the row directly.
		row_updates: dict = {}
		if new_mobile is not None:
			row_updates["mobile_no"] = new_mobile or None
		if new_email is not None:
			row_updates["email_id"] = new_email or None
		if row_updates:
			frappe.db.set_value("Customer", customer, row_updates, update_modified=False)
		row = frappe.db.get_value("Customer", customer, ["mobile_no", "email_id"], as_dict=True) or {}
		return {
			"contact": None,
			"mobile_no": (row.get("mobile_no") or "").strip(),
			"email_id": (row.get("email_id") or "").strip(),
		}

	# Customer.mobile_no / email_id are read-only fetch_from fields, so mirror the
	# contact's primaries directly — same approach as ERPNext's create_primary_contact.
	stored = frappe.db.get_value("Contact", contact_name, ["email_id", "mobile_no"], as_dict=True) or {}
	stored_mobile = (stored.get("mobile_no") or "").strip()
	stored_email = (stored.get("email_id") or "").strip()
	frappe.db.set_value(
		"Customer",
		customer,
		{"mobile_no": stored_mobile or None, "email_id": stored_email or None},
		update_modified=False,
	)
	return {
		"contact": contact_name,
		"mobile_no": stored_mobile,
		"email_id": stored_email,
	}
