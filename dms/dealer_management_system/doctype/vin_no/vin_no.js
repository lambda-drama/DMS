// Copyright (c) 2026, Mania and contributors
// For license information, please see license.txt

frappe.ui.form.on('VIN No', {
	refresh: function (frm) {
		if (frm.doc.linked_serial) {
			frm.add_custom_button(__('Open Serial No'), function () {
				frappe.set_route('Form', 'Serial No', frm.doc.linked_serial);
			}, __('ERPNext'));
		}

		apply_vehicle_item_filter(frm);

		if (frm.doc.linked_item) {
			frm.add_custom_button(__('Open Vehicle Model (Item)'), function () {
				frappe.set_route('Form', 'Item', frm.doc.linked_item);
			}, __('Reference'));
		}

		frm.add_custom_button(__('Service History'), function () {
			frappe.set_route('List', 'Job Card', { vehicle_vin: frm.doc.name });
		}, __('View'));

		// Do not recalculate warranty_status on refresh — that dirties the form
		// ("Not Saved") and overwrites Inactive set from the DMS UI.
	},

	warranty_start_date: function (frm) {
		calculate_warranty_status(frm);
	},

	warranty_end_date: function (frm) {
		calculate_warranty_status(frm);
	},

	warranty_km_limit: function (frm) {
		calculate_warranty_status(frm);
	},

	current_odometer: function (frm) {
		calculate_warranty_status(frm);

		if (frm.doc.current_odometer && frm.doc.service_interval_km) {
			frm.set_value(
				'next_service_due_km',
				frm.doc.current_odometer + frm.doc.service_interval_km
			);
		}
	},

	delivery_date: function (frm) {
		if (frm.doc.delivery_date && !frm.doc.warranty_start_date) {
			frm.set_value('warranty_start_date', frm.doc.delivery_date);
		}
		calculate_warranty_status(frm);
	},

	vin_number: function (frm) {
		if (frm.doc.vin_number && frm.doc.vin_number.length !== 17) {
			frappe.msgprint({
				title: __('Invalid VIN'),
				message: __('Standard VIN should be 17 characters. Please verify.'),
				indicator: 'orange',
			});
		}
	},
});

function calculate_warranty_status(frm) {
	// Preserve manual / registration statuses set from Desk or DMS UI
	const preserve = ['Void', 'Pending Verification'];
	if (preserve.includes(frm.doc.warranty_status)) {
		return;
	}

	const today = frappe.datetime.get_today();
	const has_started = !!(frm.doc.delivery_date || frm.doc.warranty_start_date);

	let next = 'Inactive';
	if (has_started) {
		const expired_time =
			frm.doc.warranty_end_date && frm.doc.warranty_end_date < today;
		const expired_mileage =
			frm.doc.warranty_km_limit &&
			frm.doc.current_odometer &&
			frm.doc.current_odometer >= frm.doc.warranty_km_limit;

		if (expired_time) {
			next = 'Inactive';
		} else if (expired_mileage) {
			next = 'Expired by Mileage';
		} else {
			next = 'Active';
		}
	}

	if (frm.doc.warranty_status !== next) {
		frm.set_value('warranty_status', next);
	}
}

function apply_vehicle_item_filter(frm) {
	frm.fields_dict.linked_item.get_query = function () {
		return {
			query: 'dms.dealer_management_system.doctype.service_appointment.service_appointment.get_vehicle_items',
			filters: {},
		};
	};
}
