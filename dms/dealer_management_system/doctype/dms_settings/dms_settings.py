# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

# import frappe

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, nowdate


class DMSSettings(Document):
    pass


@frappe.whitelist()
def create_vin_from_serial_numbers(company, start_date, end_date, item_code=None, status_filter=None, force_recreate=0):
    """
    Create VIN No records from existing Serial Numbers
    
    Args:
        company: Company filter (required)
        start_date: Filter serials created on or after this date
        end_date: Filter serials created on or before this date
        item_code: Optional - filter by specific item/vehicle model
        status_filter: Optional - filter by serial status (Active, Delivered, Inactive)
        force_recreate: If 1, update existing VIN records instead of skipping
    """
    
    result = {
        "total_serial": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0,
        "error_details": []
    }
    
    if not company:
        frappe.throw(_("Company is required."))
    
    # Build filters for Serial No
    serial_filters = [
        ["company", "=", company],
        ["creation", ">=", getdate(start_date)],
        ["creation", "<=", getdate(end_date)],
        ["item_code", "is", "set"]
    ]
    
    # Add item filter if provided
    if item_code:
        serial_filters.append(["item_code", "=", item_code])
    
    # Add status filter if provided
    if status_filter:
        serial_filters.append(["status", "=", status_filter])
    
    # Get all serial numbers matching filters
    serials = frappe.get_all("Serial No", 
        filters=serial_filters,
        fields=["name", "serial_no", "item_code", "item_name", "customer", 
                "status", "posting_date", "warranty_expiry_date", "description", "company",
                "custom_engine_number", "custom_model"]
    )
    
    result["total_serial"] = len(serials)
    
    if not serials:
        frappe.msgprint(_("No serial numbers found for company {0} in the selected date range.").format(company))
        return result
    
    for serial in serials:
        try:
            # Check if VIN No already exists
            existing_vin = frappe.db.exists("VIN No", {"vin_number": serial.serial_no})
            
            if existing_vin and not force_recreate:
                result["skipped"] += 1
                continue
            
            # Get vehicle model details from Item
            item = frappe.get_cached_doc("Item", serial.item_code)
            
            # Prepare VIN No data
            vin_data = {
                "doctype": "VIN No",
                "vin_number": serial.serial_no,
                "linked_item": serial.item_code,
                "model_name": serial.item_name,
                "engine_number": serial.custom_engine_number,
                # "model": serial.custom_model,
                "model_year": serial.custom_year,
                "interior_color":serial.custom_interior_color,
                "exterior_color":serial.custom_exterior_color,
                "transmission":serial.custom_transmission_type,
                "custom_vehicle_brand":serial.brand,
                "current_customer": serial.customer,
                "delivery_date": serial.posting_date,
                "warranty_end_date": serial.warranty_expiry_date,
                "linked_serial": serial.name,
                "company": serial.company,
                "vehicle_status": "Delivered to Customer" if serial.status == "Delivered" else "In Stock"
            }
            
            # Add custom fields from Item if available
            if hasattr(item, "custom_brand"):
                vin_data["brand"] = item.custom_brand
            if hasattr(item, "custom_fuel_type"):
                vin_data["fuel_type"] = item.custom_fuel_type
            if hasattr(item, "custom_transmission"):
                vin_data["transmission"] = item.custom_transmission
            if hasattr(item, "custom_service_interval_km"):
                vin_data["service_interval_km"] = item.custom_service_interval_km
            if hasattr(item, "custom_service_interval_months"):
                vin_data["service_interval_months"] = item.custom_service_interval_months
            if hasattr(item, "custom_exterior_color"):
                vin_data["exterior_color"] = item.custom_exterior_color
            if hasattr(item, "custom_model_year"):
                vin_data["model_year"] = item.custom_model_year
            
            if existing_vin and force_recreate:
                # Update existing VIN No
                frappe.db.set_value("VIN No", existing_vin, vin_data)
                result["updated"] += 1
            else:
                # Create new VIN No
                vin_doc = frappe.get_doc(vin_data)
                vin_doc.insert(ignore_permissions=True)
                result["created"] += 1
                
        except Exception as e:
            result["errors"] += 1
            result["error_details"].append({
                "serial": serial.serial_no,
                "error": str(e)
            })
            frappe.log_error(f"Error creating VIN for serial {serial.serial_no}: {str(e)}", "VIN Creation")
    
    # Commit the changes
    frappe.db.commit()
    
    return result