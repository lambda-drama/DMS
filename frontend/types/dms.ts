// DMS (Dealer Management System) Type Definitions

// ============ ENUMS ============

export type BookingSource = 
  | 'Walk-in' 
  | 'Phone Call' 
  | 'WhatsApp' 
  | 'Website' 
  | 'Social Media' 
  | 'Sales Referral' 
  | 'Fleet Contract' 
  | 'Email' 
  | 'Referral Customer' 
  | 'Other';

export type Priority = 
  | 'Normal' 
  | 'VIP' 
  | 'Comeback/Repeat Repair' 
  | 'Safety Critical' 
  | 'Immobilized' 
  | 'Fleet Priority' 
  | 'Emergency' 
  | 'Urgent';

export type AppointmentStatus = 
  | 'Booked' 
  | 'Reminder Sent' 
  | 'Arrived' 
  | 'In Inspection' 
  | 'In Workshop' 
  | 'Ready for Pickup' 
  | 'Completed' 
  | 'No-Show' 
  | 'Cancelled' 
  | 'Rescheduled';

export type VehicleArrivalStatus = 
  | 'Customer Waiting' 
  | 'Drop-off' 
  | 'Pick-up Later' 
  | 'Tow-in' 
  | 'Fleet Driver Drop-off';

export type CustomerConfirmationStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Rescheduled' 
  | 'Cancelled' 
  | 'No Response';

export type ArrivalMethod = 
  | 'Driven In' 
  | 'Towed In' 
  | 'Carried' 
  | 'PDI/Internal Transfer';

export type FuelLevel = 
  | 'Empty' 
  | '1/8' 
  | '1/4' 
  | '3/8' 
  | '1/2' 
  | '5/8' 
  | '3/4' 
  | '7/8' 
  | 'Full';

export type RemoteCondition = 
  | 'Working' 
  | 'Weak Battery' 
  | 'Damaged' 
  | 'Not Available';

export type InspectionItemCondition = 
  | 'Good' 
  | 'Fair' 
  | 'Poor' 
  | 'Damaged' 
  | 'Missing' 
  | 'N/A';

export type JobCardType = 
  | 'Customer Paid' 
  | 'Warranty' 
  | 'Internal' 
  | 'PDI' 
  | 'Campaign/Recall' 
  | 'Insurance' 
  | 'Goodwill' 
  | 'Fleet Contract';

export type JobCardStatus = 
  | 'Draft' 
  | 'Open' 
  | 'Estimation Pending' 
  | 'Estimation Approved' 
  | 'Waiting Customer Approval' 
  | 'Scheduled' 
  | 'Repair In Progress' 
  | 'Repair Completed' 
  | 'Waiting Parts' 
  | 'Road Test In Progress' 
  | 'Road Test Completed' 
  | 'QC In Progress' 
  | 'QC Failed' 
  | 'Rework' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Delivered';

export type CustomerApprovalStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Partially Approved' 
  | 'Rejected' 
  | 'Verbal Approval' 
  | 'Written Approval' 
  | 'Not Required';

export type QCResult = 
  | 'Pass' 
  | 'Fail' 
  | 'Pass with Advisory' 
  | 'Hold';

export type PaymentStatus = 
  | 'Unpaid' 
  | 'Partially Paid' 
  | 'Paid' 
  | 'Credit' 
  | 'Warranty' 
  | 'Internal';

export type WarrantyApplicationType = 
  | 'All Invoice' 
  | 'Labour' 
  | 'Spare Part' 
  | 'Discount';

// ============ SERVICE APPOINTMENT ============

export interface ServiceTypeItem {
  name: string;
  service_type: string;
  description?: string;
  estimated_hours?: number;
  is_warranty?: boolean;
}

export interface VehicleCampaignItem {
  name: string;
  campaign_code: string;
  campaign_name: string;
  campaign_type: string;
  due_date?: string;
}

export interface PreviousJobCardReference {
  name: string;
  job_card: string;
  complaint: string;
  completion_date: string;
}

export interface AssignedTechnician {
  name: string;
  technician: string;
  technician_name: string;
}

export interface ServiceAppointment {
  name: string;
  naming_series?: string;
  booking_source: BookingSource;
  booking_reference?: string;
  appointment_date_time: string;
  promised_delivery_date_time: string;
  estimated_duration_hours?: number;
  priority: Priority;
  
  // Customer & Vehicle
  customer: string;
  customer_name?: string;
  primary_phone?: string;
  customer_email?: string;
  vehicle: string;
  vin_chassis?: string;
  license_plate?: string;
  current_odometer?: number;
  warranty_status?: string;
  
  // Service Details
  service_type_requested: ServiceTypeItem[];
  service_package?: string;
  customer_complaint_summary: string;
  preferred_advisor?: string;
  preferred_technician?: string;
  vehicle_arrival_status: VehicleArrivalStatus;
  special_instructions?: string;
  
  // Warranty & Campaign
  warranty_eligibility_checked?: boolean;
  warranty_eligibility_note?: string;
  open_campaigns?: VehicleCampaignItem[];
  campaign_check_completed?: boolean;
  
  // Repeat Repair
  repeat_repair_alert?: boolean;
  repeat_repair_details?: string;
  previous_job_cards?: PreviousJobCardReference[];
  
  // Communication
  reminder_sent?: boolean;
  reminder_sent_datetime?: string;
  reminder_method?: string;
  confirmation_sent?: boolean;
  confirmation_sent_datetime?: string;
  customer_confirmed?: CustomerConfirmationStatus;
  
  // Status
  appointment_status: AppointmentStatus;
  arrived_date_time?: string;
  status_history?: string;
  no_show_reason?: string;
  no_show_notes?: string;
  
  // Assignment
  lead_technician?: string;
  technicians?: AssignedTechnician[];
  assigned_service_advisor?: string;
  assigned_bay?: string;
  alternate_bay?: string;
  
  // Estimated Costs
  estimated_labor_cost?: number;
  estimated_parts_cost?: number;
  estimated_total_cost?: number;
  cost_estimate_provided_to_customer?: boolean;
  
  // Links
  inspection?: string;
  job_card?: string;
  
  // Meta
  docstatus?: 0 | 1 | 2;
  creation?: string;
  modified?: string;
}

// ============ VEHICLE INSPECTION ============

export interface VehicleWarningLight {
  name: string;
  warning_light: string;
}

export interface VehicleDTCCode {
  name: string;
  code: string;
  description: string;
  severity?: string;
}

export interface VehicleExteriorInspectionItem {
  name: string;
  area: string;
  condition: InspectionItemCondition;
  notes?: string;
  photo?: string;
}

export interface VehicleInteriorInspectionItem {
  name: string;
  area: string;
  condition: InspectionItemCondition;
  notes?: string;
}

export interface VehicleTireInspectionItem {
  name: string;
  position: 'Front Left' | 'Front Right' | 'Rear Left' | 'Rear Right' | 'Spare';
  tread_depth_mm?: number;
  condition: InspectionItemCondition;
  pressure_psi?: number;
  brand?: string;
  notes?: string;
}

export interface VehicleEngineBayItem {
  name: string;
  component: string;
  condition: InspectionItemCondition;
  level?: string;
  notes?: string;
}

export interface VehicleUnderbodyItem {
  name: string;
  component: string;
  condition: InspectionItemCondition;
  notes?: string;
}

export interface VehicleCustomerComplaint {
  name: string;
  complaint: string;
  category?: string;
  priority?: Priority;
  notes?: string;
}

export interface VehicleInspection {
  name: string;
  naming_series?: string;
  appointment?: string;
  job_card?: string;
  inspection_date: string;
  inspection_completed_date?: string;
  customer_present: boolean;
  service_advisor: string;
  service_advisor_name?: string;
  
  // Received From (if customer not present)
  received_from_name?: string;
  received_from_phone?: string;
  received_from_relationship?: string;
  
  // Vehicle Status
  customer_vehicle: string;
  vin_chassis: string;
  customer: string;
  license_plate?: string;
  model_year?: number;
  
  // Odometer & Fuel
  odometer: number;
  odometer_unit: 'km' | 'miles';
  odometer_photo: string;
  fuel_level: FuelLevel;
  fuel_photo?: string;
  battery_voltage?: number;
  
  // Arrival
  arrival_method: ArrivalMethod;
  keys_received: number;
  remote_condition: RemoteCondition;
  personal_items?: string;
  
  // Warning Lights
  warning_lights: VehicleWarningLight[];
  dashboard_photo?: string;
  scan_performed: boolean;
  dtc_codes?: VehicleDTCCode[];
  scan_tool_used?: string;
  
  // Checklists
  exterior_checklist: VehicleExteriorInspectionItem[];
  exterior_photos?: string;
  interior_checklist: VehicleInteriorInspectionItem[];
  tires_checklist: VehicleTireInspectionItem[];
  engine_checklist?: VehicleEngineBayItem[];
  underbody_checklist?: VehicleUnderbodyItem[];
  
  // Customer Complaints
  customer_complaints: VehicleCustomerComplaint[];
  
  // Notes
  service_advisor_notes?: string;
  internal_notes?: string;
  
  // Signatures
  customer_signature: string;
  advisor_signature: string;
  manager_override_signature?: string;
  customer_digital_sign?: string;
  service_advisor_sign?: string;
  
  // Meta
  docstatus?: 0 | 1 | 2;
  creation?: string;
  modified?: string;
}

// ============ DMS JOB CARD ============

export interface JobCardItem {
  name: string;
  complaint: string;
  cause?: string;
  correction?: string;
  labor_type?: string;
  estimated_hours?: number;
  actual_hours?: number;
  is_warranty?: boolean;
  status?: 'Pending' | 'In Progress' | 'Completed';
  technician?: string;
}

export interface JobCardPartItem {
  name: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_warranty?: boolean;
  status?: 'Requested' | 'Reserved' | 'Issued' | 'Returned';
  warehouse?: string;
}

export interface VehicleLabourItem {
  name: string;
  operation: string;
  hours: number;
  rate: number;
  amount: number;
  technician?: string;
  is_warranty?: boolean;
}

export interface JobCardTechnicianAssignment {
  name: string;
  technician: string;
  technician_name: string;
  role?: string;
}

export interface DMSJobCardTimeLog {
  name: string;
  technician: string;
  technician_name: string;
  start_time: string;
  end_time?: string;
  duration_hours?: number;
  pause_reason?: string;
  job_item?: string;
  notes?: string;
}

export interface RoadTestItemResult {
  name: string;
  test_item: string;
  result: 'Pass' | 'Fail' | 'N/A';
  notes?: string;
}

export interface JobCardQCResult {
  name: string;
  check_item: string;
  result: 'Pass' | 'Fail' | 'N/A';
  notes?: string;
}

export interface DMSJobCard {
  name: string;
  naming_series?: string;
  job_card_type: JobCardType;
  status: JobCardStatus;
  posting_date: string;
  company?: string;
  opened_date_time: string;
  completed_date_time?: string;
  promised_delivery_date_time: string;
  
  // Customer & Vehicle
  customer: string;
  customer_name?: string;
  customer_mobile?: string;
  vehicle_vin: string;
  vehicle_model?: string;
  license_plate?: string;
  current_odometer?: number;
  appointment?: string;
  inspection: string;
  warranty_status?: string;
  warranty_expiry_date?: string;
  warranty_application_type?: WarrantyApplicationType;
  
  // Priority & Assignment
  priority: Priority;
  is_repeat_repair?: boolean;
  repeat_repair_reference?: string;
  service_advisor: string;
  assigned_bay: string;
  workshop?: string;
  warehouse?: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  total_labor_hours?: number;
  total_sold_hours?: string;
  lead_technician?: string;
  lead_technician_name?: string;
  assistant_technicians?: JobCardTechnicianAssignment[];
  schedule_start_time?: string;
  schedule_end_time?: string;
  reason_for_stop?: string;
  
  // Job Items (Complaint -> Cause -> Correction)
  job_items: JobCardItem[];
  
  // Labour
  labour?: VehicleLabourItem[];
  
  // Parts
  parts?: JobCardPartItem[];
  
  // Estimate & Approval
  total_labor_cost?: number;
  total_parts_cost?: number;
  total_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  customer_approval_status: CustomerApprovalStatus;
  approval_reference?: string;
  approval_attachment?: string;
  approved_amount?: number;
  
  // Road Test
  road_test_template?: string;
  road_test_results?: RoadTestItemResult[];
  road_test_note?: string;
  rt_result?: 'Pass' | 'Fail';
  
  // Quality Control
  qc_checklist_template?: string;
  qc_results?: JobCardQCResult[];
  qc_inspector?: string;
  qc_result?: QCResult;
  qc_fail_reason?: string;
  qc_checked_date?: string;
  rework_required?: boolean;
  rework_job_item?: string;
  
  // Billing & Payment
  invoice?: string;
  payment_status: PaymentStatus;
  payment_reference?: string;
  release_blocked?: boolean;
  release_block_reason?: string;
  
  // Time Log
  time_logs?: DMSJobCardTimeLog[];
  
  // Delivery
  delivered_to?: string;
  delivered_to_phone?: string;
  delivery_date_time?: string;
  final_odometer?: number;
  customer_signature?: string;
  next_service_due_km?: number;
  next_service_due_date?: string;
  service_advisor_notes?: string;
  internal_notes?: string;
  customer_satisfaction?: string;
  
  // Display / List
  vehicle_registration?: string;
  service_type?: string;
  expected_completion_date?: string;
  
  // Meta
  docstatus?: 0 | 1 | 2;
  creation?: string;
  modified?: string;
}

// ============ LOOKUP TYPES ============

export interface Customer {
  name: string;
  customer_name: string;
  mobile_no?: string;
  email_id?: string;
  customer_type?: string;
}

export interface Vehicle {
  name: string;
  item_name: string;
  item_code: string;
}

export interface VINNo {
  name: string;
  vin_number: string;
  plate_number?: string;
  model_name?: string;
  model_year?: number;
  current_customer?: string;
  current_odometer?: number;
  warranty_status?: string;
  warranty_end_date?: string;
}

export interface ServiceAdvisor {
  name: string;
  full_name: string;
  email?: string;
  phone?: string;
}

export interface Technician {
  name: string;
  full_name: string;
  specialization?: string;
}

export interface ServiceBay {
  name: string;
  bay_name: string;
  bay_type?: string;
  branch?: string;
  status?: 'Available' | 'Occupied' | 'Maintenance';
}

export interface Workshop {
  name: string;
  workshop_name: string;
  warehouse?: string;
}

// ============ DELIVERY TYPES ============

export interface VehicleDelivery {
  name: string;
  job_card: string;
  customer: string;
  customer_name?: string;
  vehicle_vin: string;
  delivery_date_time: string;
  delivered_to: string;
  delivered_to_phone?: string;
  delivered_to_relationship?: string;
  final_odometer: number;
  fuel_level: FuelLevel;
  customer_signature: string;
  next_service_due_km?: number;
  next_service_due_date?: string;
  feedback_rating?: number;
  feedback_comments?: string;
  docstatus?: 0 | 1 | 2;
}

// ============ DELIVERY (UI) ============

export interface Delivery {
  name?: string;
  job_card: string;
  vehicle_registration: string;
  vehicle_model?: string;
  customer_name: string;
  contact_number: string;
  delivery_date: string;
  delivery_time: string;
  delivered_by: string;
  received_by: string;
  odometer_at_delivery: number;
  fuel_level_at_delivery: string;
  delivery_notes: string;
  checklist_completed: boolean;
  status?: string;
  creation?: string;
  modified?: string;
}

// ============ INVOICE (UI) ============

export interface InvoiceLine {
  idx?: number;
  description: string;
  line_type: 'Labour' | 'Parts' | 'Other';
  quantity: number;
  unit_price: number;
  amount: number;
  part_number?: string;
}

export interface Invoice {
  name?: string;
  job_card: string;
  vehicle_registration: string;
  vehicle_model?: string;
  customer_name: string;
  customer_address: string;
  contact_number: string;
  email: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  lines: InvoiceLine[];
  labour_total: number;
  parts_total: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string;
  status?: string;
  creation?: string;
  modified?: string;
}

// ============ API RESPONSE TYPES ============

export interface FrappeListResponse<T> {
  data: T[];
  total_count?: number;
}

export interface FrappeDocResponse<T> {
  data: T;
}

export interface FrappeError {
  exc_type: string;
  message: string;
  _server_messages?: string;
}
