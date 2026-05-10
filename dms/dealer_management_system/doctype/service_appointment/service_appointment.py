# Copyright (c) 2026, Mania and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import cint


class ServiceAppointment(Document):
	pass




@frappe.whitelist()
def get_vehicle_customers(doctype, txt, searchfield, start, page_len, filters):
    """Return customers who are vehicle customers (via Customer Group or direct flag)"""
    
    # Get all customer groups marked as vehicle customers
    vehicle_groups = frappe.get_all("Customer Group", 
        filters={"custom_is_vehicle_customer": 1},
        pluck="name")
    
    if not vehicle_groups:
        return []
    
    # Build query
    query = """
        SELECT 
            c.name, 
            c.customer_name,
            c.customer_group,
            c.mobile_no
        FROM `tabCustomer` c
        WHERE c.customer_group IN (%s)
        AND c.name LIKE %s
    """ % (','.join(['%s'] * len(vehicle_groups)), '%s')
    
    # Prepare parameters
    params = vehicle_groups + [f"%{txt}%"]
    
    # Add status filter (optional)
    # query += " AND c.disabled = 0"
    
    # Add sorting and limits
    query += f" ORDER BY c.customer_name ASC LIMIT {start}, {page_len}"
    
    results = frappe.db.sql(query, params)
    
    # Format results as (value, label) pairs
    return [(r[0], f"{r[1]} ({r[2]}) - {r[3] or ''}") for r in results]


@frappe.whitelist()
def get_vehicle_items(doctype, txt, searchfield, start, page_len, filters):
    """
    Return Items that belong to Item Groups marked as 'Is Vehicle Group'
    Used as a query in Link fields
    """
    
    # Get all item groups marked as vehicle groups
    vehicle_groups = frappe.get_all("Item Group",
        filters={"custom_is_vehicle": 1},
        pluck="name")
    
    if not vehicle_groups:
        return []
    
    # Build the WHERE clause for item groups
    group_placeholders = ','.join(['%s'] * len(vehicle_groups))
    
    query = f"""
        SELECT 
            i.name,
            i.item_name,
            i.item_group,
            i.brand
        FROM `tabItem` i
        WHERE i.item_group IN ({group_placeholders})
        AND i.disabled = 0
        AND i.is_sales_item = 1
        AND i.name LIKE %s
        ORDER BY i.name ASC
        LIMIT {start}, {page_len}
    """
    
    params = vehicle_groups + [f"%{txt}%"]
    
    results = frappe.db.sql(query, params)
    
    # Format results as (value, label) pairs
    return [(r[0], f"{r[0]} - {r[1]} ({r[2]})") for r in results]

@frappe.whitelist()
def get_vehicle_vins(doctype, txt, searchfield, start, page_len, filters):
    """
    Return VIN No records that are linked to vehicle items
    Used for 'vin_chassis' field (Link to VIN No)
    """
    
    # Get all item groups marked as vehicle groups
    vehicle_groups = frappe.get_all("Item Group",
        filters={"custom_is_vehicle": 1},
        pluck="name")
    
    if not vehicle_groups:
        return []
    
    group_placeholders = ','.join(['%s'] * len(vehicle_groups))
    
    # Get specific vehicle item filter (from the 'vehicle' field)
    vehicle_item = filters.get("vehicle_item") if filters else None

    start = cint(start)
    page_len = cint(page_len)

    # Build query
    if vehicle_item:
        # Case 1: Filter by specific vehicle item
        query = f"""
            SELECT 
                v.name,
                v.vin_number,
                v.plate_number,
                v.model_name
            FROM `tabVIN No` v
            WHERE v.linked_item = %s
            AND v.vehicle_status != 'Scrapped'
            AND (v.vin_number LIKE %s OR v.plate_number LIKE %s OR v.model_name LIKE %s)
            ORDER BY v.vin_number ASC
            LIMIT {start}, {page_len}
        """
        params = [vehicle_item, f"%{txt}%", f"%{txt}%", f"%{txt}%"]
    else:
        # Case 2: Return all VINs linked to vehicle items
        query = f"""
            SELECT 
                v.name,
                v.vin_number,
                v.plate_number,
                v.model_name
            FROM `tabVIN No` v
            WHERE v.linked_item IN (
                SELECT i.name FROM `tabItem` i
                WHERE i.item_group IN ({group_placeholders})
                AND i.disabled = 0
            )
            AND v.vehicle_status != 'Scrapped'
            AND (v.vin_number LIKE %s OR v.plate_number LIKE %s OR v.model_name LIKE %s)
            ORDER BY v.vin_number ASC
            LIMIT {start}, {page_len}
        """
        params = vehicle_groups + [f"%{txt}%", f"%{txt}%", f"%{txt}%"]
    
    results = frappe.db.sql(query, params)
    
    # Format results as (value, label) pairs
    return [(r[0], f"{r[1]} - {r[3]} ({r[2] or 'No Plate'})") for r in results]