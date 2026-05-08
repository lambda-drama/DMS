# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

# Copyright (c) 2024, Suweys Motors and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, getdate, add_months, date_diff
from frappe import _

class VINNo(Document):
    
    def validate(self):
        """Validate before saving"""
        self.validate_vin_format()
        self.validate_duplicate_vin()
        self.validate_engine_number()
        self.calculate_warranty_status()
        self.calculate_next_service()
        self.validate_odometer()
    
    def on_submit(self):
        """When document is submitted - create Serial No"""
        if not self.linked_serial:
            self.create_serial_no()
    
    def on_update(self):
        """When document is updated - sync to Serial No"""
        if self.linked_serial and not self.is_new():
            self.sync_to_serial_no()
    
    def on_trash(self):
        """When document is deleted - unlink Serial No"""
        if self.linked_serial:
            # Just unlink, don't delete Serial No
            frappe.db.set_value("Serial No", self.linked_serial, "reference_name", None)
            frappe.db.set_value("Serial No", self.linked_serial, "reference_doctype", None)
    
    # ========== VALIDATION METHODS ==========
    
    def validate_vin_format(self):
        """Validate VIN format"""
        if not self.vin_number:
            frappe.throw(_("VIN / Chassis Number is required"))
        
        if len(self.vin_number) != 17:
            frappe.msgprint(
                _("Warning: VIN should be 17 characters. Current length: {0}").format(len(self.vin_number)),
                alert=True,
                indicator="orange"
            )
    
    def validate_duplicate_vin(self):
        """Prevent duplicate VIN creation"""
        existing = frappe.db.exists("VIN No", {
            "vin_number": self.vin_number, 
            "name": ["!=", self.name or ""]
        })
        if existing:
            frappe.throw(_("VIN Number {0} already exists.").format(self.vin_number))
        
        # Also check if Serial No already exists with this VIN
        serial_exists = frappe.db.exists("Serial No", {"serial_no": self.vin_number})
        if serial_exists:
            frappe.throw(_("Serial No with VIN {0} already exists. Cannot create duplicate.").format(self.vin_number))
    
    def validate_engine_number(self):
        """Warn on duplicate engine numbers"""
        if self.engine_number:
            existing = frappe.db.exists("VIN No", {
                "engine_number": self.engine_number, 
                "name": ["!=", self.name or ""]
            })
            if existing:
                frappe.msgprint(
                    _("Warning: Engine Number {0} is already registered.").format(self.engine_number),
                    alert=True,
                    indicator="red"
                )
    
    def calculate_warranty_status(self):
        """Calculate warranty status based on date and mileage"""
        today = getdate(nowdate())
        
        if self.warranty_end_date:
            if getdate(self.warranty_end_date) < today:
                self.warranty_status = "Expired by Time"
                return
        
        if self.warranty_km_limit and self.current_odometer:
            if self.current_odometer >= self.warranty_km_limit:
                self.warranty_status = "Expired by Mileage"
                return
        
        self.warranty_status = "Active"
    
    def calculate_next_service(self):
        """Calculate next service due"""
        if self.current_odometer and self.service_interval_km:
            self.next_service_due_km = self.current_odometer + self.service_interval_km
        
        if self.last_service_date and self.service_interval_months:
            self.next_service_due_date = add_months(self.last_service_date, self.service_interval_months)
        elif self.delivery_date and self.service_interval_months:
            self.next_service_due_date = add_months(self.delivery_date, self.service_interval_months)
    
    def validate_odometer(self):
        """Prevent odometer rollback"""
        if self.is_new():
            return
        
        previous_odometer = frappe.db.get_value("VIN No", self.name, "current_odometer")
        
        if previous_odometer and self.current_odometer:
            if self.current_odometer < previous_odometer:
                frappe.throw(
                    _("Odometer rollback detected! Previous: {0} km, New: {1} km.").format(
                        previous_odometer, self.current_odometer
                    )
                )
            
            increase = self.current_odometer - previous_odometer
            if increase > 30000:
                frappe.msgprint(
                    _("Warning: Unusual mileage increase of {0} km. Please verify.").format(increase),
                    alert=True,
                    indicator="orange"
                )
    
    # ========== SERIAL NO METHODS ==========
    
    def create_serial_no(self):
        """Create Serial No using ALL existing fields from VIN No"""
        
        # Calculate warranty period in days (not months)
        warranty_days = 0
        if self.warranty_start_date and self.warranty_end_date:
            warranty_days = date_diff(self.warranty_end_date, self.warranty_start_date)
        
        # Prepare serial_no data using ALL standard fields
        serial_no_data = {
            # Core identification
            "doctype": "Serial No",
            "serial_no": self.vin_number,                    # VIN as Serial No
            "item_code": self.linked_item,                   # Vehicle Model Item
            "item_name": self.model_name,                    # Model Name
            "description": f"{self.model_name} - {self.vin_number} - {self.exterior_color}",
            "company": frappe.defaults.get_default_company(),
            
            # Customer & Status
            "customer": self.current_customer,               # Owner
            "status": self._get_serial_status(),             # Active/Delivered
            
            # Warranty
            "warranty_period": warranty_days,                # Warranty in days
            "warranty_expiry_date": self.warranty_end_date,  # Warranty expiry
            "amc_expiry_date": None,                         # Can be set later
            "maintenance_status": "Under Warranty" if self.warranty_status == "Active" else "Out of Warranty",
            
            # Purchase / Delivery
            "purchase_date": self.delivery_date,             # Delivery date
            "purchase_rate": 0,                              # Can be set from invoice
            
            # Reference to source document (VIN No)
            "reference_doctype": "VIN No",
            "reference_name": self.name,
            "posting_date": nowdate(),
            
            # Location tracking
            "location": None,                                # Can be set later
            "warehouse": None,                               # Can be set later
            "employee": None,                                # Can be set later
            "work_order": None,                              # Can be set later
            
            # Asset linkage (if vehicle is capitalized)
            "asset": None,                                   # Can be set later
            "asset_status": None,
            "batch_no": None,
        }
        
        # Add custom fields that exist on Serial No (from your JSON)
        custom_fields = {
            "custom_engine_number": self.engine_number,
            "custom_model": self.model,
            "custom_vehicle_brand": self.brand,
            "custom_vehicle_template": None,                  # Can link to Vehicle Template doc
            "custom_transmission_type": self.transmission,
            "custom_max_power": None,                         # Can be set from Item
            "custom_exterior_color": self.exterior_color,
            "custom_interior_color": self.interior_color,
            "custom_year": str(self.model_year) if self.model_year else None,
            "custom_seat_capacity": None,                     # Can be set from Item
            "custom_max_torque": None,                        # Can be set from Item
            "custom_engine_description": None,                # Can be set from Item
            "custom_front_tire": None,                        # Can be set from Item
            "custom_rear_tire": None,                         # Can be set from Item
            "custom_wheel_base": None,                        # Can be set from Item
            "custom_overall_width": None,                     # Can be set from Item
            "custom_overall_length": None,                    # Can be set from Item
            "custom_overall_height": None,                    # Can be set from Item
        }
        
        # Merge custom fields if they exist in the target system
        # Only add fields that are actually present in Serial No doctype
        for field, value in custom_fields.items():
            if value is not None:
                # Check if field exists in Serial No
                if frappe.db.has_column("Serial No", field):
                    serial_no_data[field] = value
        
        # Create the Serial No
        serial_no = frappe.get_doc(serial_no_data)
        serial_no.insert(ignore_permissions=True)
        
        # Store reference in VIN No
        self.linked_serial = serial_no.name
        self.db_set("linked_serial", serial_no.name)
        
        frappe.msgprint(
            _("ERPNext Serial No '{0}' has been created for VIN {1}.").format(
                serial_no.name, self.vin_number
            ),
            indicator="green",
            alert=True
        )
        
        return serial_no
    
    def sync_to_serial_no(self):
        """Sync changes from VIN No to existing Serial No"""
        if not self.linked_serial:
            return
        
        serial_no = frappe.get_doc("Serial No", self.linked_serial)
        needs_update = False
        
        # Sync standard fields
        if serial_no.customer != self.current_customer:
            serial_no.customer = self.current_customer
            needs_update = True
        
        # Update warranty period in days
        warranty_days = 0
        if self.warranty_start_date and self.warranty_end_date:
            warranty_days = date_diff(self.warranty_end_date, self.warranty_start_date)
        
        if serial_no.warranty_period != warranty_days:
            serial_no.warranty_period = warranty_days
            needs_update = True
        
        if serial_no.warranty_expiry_date != self.warranty_end_date:
            serial_no.warranty_expiry_date = self.warranty_end_date
            needs_update = True
        
        # Update maintenance status
        new_maintenance_status = "Under Warranty" if self.warranty_status == "Active" else "Out of Warranty"
        if serial_no.maintenance_status != new_maintenance_status:
            serial_no.maintenance_status = new_maintenance_status
            needs_update = True
        
        # Update status
        new_status = self._get_serial_status()
        if serial_no.status != new_status:
            serial_no.status = new_status
            needs_update = True
        
        # Update purchase date
        if serial_no.purchase_date != self.delivery_date:
            serial_no.purchase_date = self.delivery_date
            needs_update = True
        
        # Update description
        new_description = f"{self.model_name} - {self.vin_number} - {self.exterior_color}"
        if serial_no.description != new_description:
            serial_no.description = new_description
            needs_update = True
        
        # Update item name if changed
        if serial_no.item_name != self.model_name:
            serial_no.item_name = self.model_name
            needs_update = True
        
        # Sync custom fields that exist on Serial No
        custom_field_mapping = {
            "custom_engine_number": self.engine_number,
            "custom_transmission_type": self.transmission,
            "custom_exterior_color": self.exterior_color,
            "custom_interior_color": self.interior_color,
            "custom_year": str(self.model_year) if self.model_year else None,
        }
        
        for field, value in custom_field_mapping.items():
            if value is not None and frappe.db.has_column("Serial No", field):
                if serial_no.get(field) != value:
                    serial_no.db_set(field, value)
        
        if needs_update:
            serial_no.save(ignore_permissions=True)
    
    def _get_serial_status(self):
        """Map VIN status to Serial No status"""
        status_map = {
            "In Stock": "Active",
            "Delivered to Customer": "Delivered",
            "In Service": "Active",
            "In Transit": "Active",
            "Total Loss": "Inactive",
            "Scrapped": "Consumed"
        }
        return status_map.get(self.vehicle_status, "Active")
    
    # ========== HELPER METHODS ==========
    
    def get_serial_no(self):
        """Get linked Serial No document"""
        if self.linked_serial:
            return frappe.get_doc("Serial No", self.linked_serial)
        return None
    
    def get_service_history(self):
        """Get all Job Cards for this vehicle"""
        return frappe.get_all(
            "Job Card",
            filters={"vehicle_vin": self.name},
            fields=["name", "status", "service_date", "odometer"],
            order_by="modified desc"
        )
    
    def mark_as_delivered(self, customer_name, delivery_date, sales_invoice=None):
        """Mark vehicle as delivered to customer"""
        self.vehicle_status = "Delivered to Customer"
        self.current_customer = customer_name
        self.delivery_date = delivery_date
        self.warranty_start_date = delivery_date
        self.save(ignore_permissions=True)
        
        # Also update Serial No
        if self.linked_serial:
            serial_no = frappe.get_doc("Serial No", self.linked_serial)
            serial_no.customer = customer_name
            serial_no.status = "Delivered"
            serial_no.purchase_date = delivery_date
            if sales_invoice:
                serial_no.reference_doctype = "Sales Invoice"
                serial_no.reference_name = sales_invoice
            serial_no.save(ignore_permissions=True)
    
    def transfer_ownership(self, new_customer_name, transfer_date):
        """Transfer vehicle to new owner"""
        old_customer = self.current_customer
        self.current_customer = new_customer_name
        
        # Add to ownership history (requires child table)
        self.append("ownership_history", {
            "previous_owner": old_customer,
            "new_owner": new_customer_name,
            "transfer_date": transfer_date
        })
        
        self.save(ignore_permissions=True)
        
        # Update Serial No
        if self.linked_serial:
            serial_no = frappe.get_doc("Serial No", self.linked_serial)
            serial_no.customer = new_customer_name
            serial_no.save(ignore_permissions=True)
            
    def get_service_interval_km(self):
        """Get the appropriate service interval based on vehicle conditions"""
        if not self.vehicle_model:
            return 10000
        
        model = frappe.get_doc("Vehicle Model", self.vehicle_model)
        
        # Find matching service interval rule
        for rule in model.service_intervals:
            if rule.is_default:
                default_km = rule.interval_km
                default_months = rule.interval_months
            
            # Check if conditions match
            if rule.condition == "Fleet Vehicle" and self.is_fleet_vehicle:
                return rule.interval_km
        
        return default_km or 10000

    def calculate_warranty_dates(self):
        """Calculate warranty end dates based on vehicle model rules"""
        if not self.vehicle_model:
            return
        
        model = frappe.get_doc("Vehicle Model", self.vehicle_model)
        
        for rule in model.warranty_rules:
            if rule.is_default:
                if rule.component_category == "Full Vehicle":
                    # Set main warranty
                    self.warranty_end_date = add_months(self.warranty_start_date, rule.warranty_months)
                    self.warranty_km_limit = rule.warranty_km
                
                elif rule.component_category == "Battery (EV/Hybrid)" and self.fuel_type in ["EV", "Hybrid", "PHEV"]:
                    # Set battery warranty
                    self.battery_warranty_end_date = add_months(self.warranty_start_date, rule.warranty_months)
                    self.battery_warranty_km_limit = rule.warranty_km
                
                elif rule.component_category == "Engine/Powertrain":
                    # Set engine warranty
                    self.engine_warranty_end_date = add_months(self.warranty_start_date, rule.warranty_months)
                    self.engine_warranty_km_limit = rule.warranty_km