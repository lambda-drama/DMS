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
  | 'Draft'
  | 'Requested'
  | 'Scheduled'
  | 'Confirmed'
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
  | 'Assigned'
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
  company?: string;
  promised_delivery_date_time?: string;
  estimated_duration_hours?: number;
  priority: Priority;
  
  // Customer & Vehicle
  customer: string;
  customer_name?: string;
  primary_phone?: string;
  /** Editable on appointment when customer has no mobile (label: Mobile No 2). */
  mobile_no?: string;
  /** Resolved phone for UI/reminders: primary_phone → mobile_no → customer. */
  contact_phone?: string;
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
  status: AppointmentStatus;
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
  name?: string;
  complaint_sequence?: number;
  customer_exact_words?: string;
  symptom_category?: string;
  severity?: string;
  frequency?: string;
  notes?: string;
  /** @deprecated use customer_exact_words */
  complaint?: string;
  /** @deprecated use symptom_category */
  category?: string;
  /** @deprecated use severity */
  priority?: Priority;
}

export interface VehicleInspection {
  name: string;
  naming_series?: string;
  company?: string;
  company_name?: string;
  appointment?: string;
  job_card?: string;
  service_estimate?: string;
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
  vin_number?: string;
  vehicle_model?: string;
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
  terms_and_conditions?: string;
  terms_and_conditions_ar?: string;
  terms_accepted?: number | boolean;
  terms_accepted_at?: string;
  manager_override_signature?: string;
  customer_digital_sign?: string;
  service_advisor_sign?: string;
  
  // Meta
  docstatus?: 0 | 1 | 2;
  creation?: string;
  modified?: string;
}

// ============ VEHICLE SERVICE PACKAGE ============

export interface ServicePackageListItem {
  name: string;
  package_name: string;
  package_id?: string;
  description?: string;
  interval_km?: number;
  interval_months?: number;
  total_labor_hours?: number;
  before_discount?: number;
  after_discount?: number;
  total_amount?: number;
  package_price?: number;
  labour_discount_amount?: number;
}

export interface ServicePackageForVehicleResponse {
  vehicle_model: string | null;
  vehicle_model_label?: string | null;
  packages: ServicePackageListItem[];
  message?: string;
}

export interface ServicePackageLabourLine {
  vehicle_service_item: string;
  service_code?: string;
  service_name?: string;
  estimated_hours: number;
  rate_per_hour: number;
  notes?: string;
}

export interface ServicePackagePartLine {
  item_code: string;
  item_name?: string;
  bin_location?: string;
  quantity_requested: number;
  unit_price: number;
}

export interface ServicePackageLinesResponse {
  package: string;
  package_name: string;
  package_id?: string;
  description?: string;
  before_discount?: number;
  after_discount?: number;
  total_amount?: number;
  package_price?: number;
  labour_discount_amount?: number;
  interval_km?: number;
  interval_months?: number;
  labour: ServicePackageLabourLine[];
  parts: ServicePackagePartLine[];
}

// ============ DMS SERVICE ESTIMATE ============

export type ServiceEstimateStatus =
  | 'Draft'
  | 'Diagnosis In Progress'
  | 'Diagnosis Complete'
  | 'Estimation In Progress'
  | 'Pending Customer Approval'
  | 'Accepted'
  | 'Rejected'
  | 'Cancelled';

export type ServiceEstimateDecision = 'Pending' | 'Accepted' | 'Rejected' | 'Partially Accepted';

export type ServiceEstimateType = 'Original' | 'Supplementary';

export interface DMSServiceEstimate {
  name: string;
  status: ServiceEstimateStatus;
  estimate_type?: ServiceEstimateType;
  parent_job_card?: string;
  parent_estimate?: string;
  additional_work_request?: string;
  posting_date?: string;
  company?: string;
  currency?: string;
  inspection?: string;
  appointment?: string;
  assigned_bay?: string;
  job_card?: string;
  diagnostic_invoice?: string;
  customer: string;
  customer_name?: string;
  vehicle_vin: string;
  vehicle_model?: string;
  vehicle_model_label?: string;
  license_plate?: string;
  service_advisor?: string;
  diagnostic_fee?: number;
  diagnostic_fee_voided?: number | boolean;
  diagnosis_completed_date?: string;
  /** Problems found during diagnosis */
  diagnosis_findings?: string;
  /** Recommended work to fix diagnosed problems */
  recommended_repairs?: string;
  /** Vehicle Service Package used to autofill labour and parts */
  service_package?: string;
  labour?: VehicleLabourItem[];
  parts?: JobCardPartItem[];
  total_labor_cost?: number;
  total_parts_cost?: number;
  total_before_vat?: number;
  vat_rate?: number;
  vat_amount?: number;
  grand_total?: number;
  warranty_status?: string;
  warranty_expiry_date?: string;
  warranty_application_type?: WarrantyApplicationType | '';
  labour_discount_type?: string;
  labour_discount_value?: number;
  parts_discount_type?: string;
  parts_discount_value?: number;
  discount_amount?: number;
  customer_decision?: ServiceEstimateDecision;
  decision_date?: string;
  customer_signature?: string;
  rejection_signature?: string;
  terms_and_conditions?: string;
  terms_and_conditions_ar?: string;
  terms_accepted?: number | boolean;
  terms_accepted_at?: string;
  service_advisor_notes?: string;
  internal_notes?: string;
  creation?: string;
  modified?: string;
}

// ============ DMS JOB CARD ============

export interface JobCardItem {
  name: string;
  /** Customer words from inspection (Job Card Item field) */
  complaint_description?: string;
  /** Legacy alias — prefer complaint_description */
  complaint?: string;
  symptom_category?: string;
  severity?: string;
  labor_operation?: string;
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
  part_code?: string;
  item_code?: string;
  part_name: string;
  bin_location?: string;
  quantity?: number;
  quantity_requested?: number;
  quantity_issued?: number;
  quantity_returned?: number;
  unit_price: number;
  total_price?: number;
  total_amount?: number;
  is_warranty?: boolean;
  line_status?:
    | 'Requested'
    | 'Pending Approval'
    | 'Reserved'
    | 'Ready for Issue'
    | 'Issued'
    | 'Received'
    | 'Returned'
    | 'Backordered';
  status?: 'Requested' | 'Reserved' | 'Issued' | 'Returned';
  parts_request?: string;
  warehouse?: string;
  /** True when this line was never included on an active Parts Requisition. */
  never_requested?: boolean;
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
  name?: string;
  test_item: string;
  test_description?: string;
  category?: string;
  test_condition?: string;
  is_critical?: number | boolean;
  result: 'Pass' | 'Fail' | 'N/A' | '';
  observations?: string;
  tested_by?: string;
  tested_on?: string;
}

export interface JobCardQCResult {
  name?: string;
  check_item_text?: string;
  category?: string;
  section_classification?: string;
  is_mandatory?: number | boolean;
  requires_photo?: number | boolean;
  requires_measurement?: number | boolean;
  min_value?: number;
  max_value?: number;
  result: 'Pass' | 'Fail' | 'N/A' | '';
  measurement_value?: number;
  photo?: string;
  notes?: string;
}

export interface DMSJobCard {
  name: string;
  naming_series?: string;
  job_card_type: JobCardType;
  status: JobCardStatus;
  posting_date: string;
  company?: string;
  /** Billing currency for costing and sales invoice (default ETB). */
  currency?: string;
  opened_date_time: string;
  completed_date_time?: string;
  promised_delivery_date_time: string;
  
  // Customer & Vehicle
  customer: string;
  customer_name?: string;
  customer_mobile?: string;
  vehicle_vin: string;
  vin_number?: string;
  vehicle_model?: string;
  license_plate?: string;
  current_odometer?: number;
  appointment?: string;
  skip_vehicle_inspection?: boolean | number;
  inspection: string;
  service_estimate?: string;
  warranty_status?: string;
  warranty_expiry_date?: string;
  warranty_application_type?: WarrantyApplicationType;
  
  // Priority & Assignment
  priority: Priority;
  is_repeat_repair?: boolean | number;
  repeat_repair_reference?: string;
  repeat_repair_eligible?: boolean;
  repeat_repair_eligibility?: {
    eligible?: boolean;
    probation_days?: number;
    days_since_closure?: number | null;
    days_remaining?: number | null;
    closure_date?: string | null;
    reason?: string;
  };
  service_advisor: string;
  service_advisor_name?: string;
  assigned_bay: string;
  workshop?: string;
  warehouse?: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  total_labor_hours?: number;
  total_hours?: number;
  lead_technician?: string;
  lead_technician_name?: string;
  workshop_assigned?: boolean;
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
  parts_requests?: Array<{
    name: string;
    status: string;
    pick_slip?: string;
    stock_entry?: string;
  }>;
  
  // Estimate & Approval
  total_labor_cost?: number;
  total_parts_cost?: number;
  total_amount?: number;
  labour_discount_type?: string;
  labour_discount_value?: number;
  parts_discount_type?: string;
  parts_discount_value?: number;
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
  qc_started_at?: string;
  qc_checked_date?: string;
  rework_required?: boolean;
  rework_job_item?: string;

  // Journey timestamps (TAT — permanent stamps)
  technician_assigned_at?: string;
  repair_started_at?: string;
  invoiced_at?: string;
  
  // Billing & Payment
  invoice?: string;
  material_issue?: string;
  wip_material_transfer?: string;
  payment_status: PaymentStatus;
  payment_reference?: string;
  release_blocked?: boolean;
  release_block_reason?: string;
  
  // Time Log
  time_logs?: DMSJobCardTimeLog[];
  /** UTC epoch ms for earliest open time log — used by live repair timer */
  repair_session_start_ms?: number | null;
  
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
  terms?: string;
  terms_and_conditions?: string;
  customer_satisfaction?: string;
  /** Cancelled job card this draft was amended from (Frappe Amend). */
  amended_from?: string;
  /** Cancelled source for Amend and New Version — used to reuse stage details. */
  original_job_card?: string | null;
  original_stage_reuse?: {
    customer_approval?: { available?: boolean };
    repair?: { available?: boolean };
    road_test?: { available?: boolean };
    qc?: { available?: boolean };
  };
  already_amended?: number | boolean;
  amended_as?: string | null;
  
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
  customer_group?: string;
  territory?: string;
  creation?: string;
  modified?: string;
}

export interface Vehicle {
  name: string;
  item_name: string;
  item_code: string;
}

export interface VehicleItem {
  name: string;
  item_name: string;
  item_code?: string;
  item_group?: string;
  brand?: string;
}

export interface VehicleServiceType {
  name: string;
  service_type_name: string;
  description?: string;
  default_estimated_hours?: number;
  warranty_applicable?: number;
  requires_diagnostic?: number;
}

export interface VehicleWarrantySummary {
  warranty_active: boolean;
  warranty_status: string;
  warranty_start_date?: string | null;
  warranty_end_date?: string | null;
  warranty_km_limit?: number | null;
  current_odometer?: number | null;
  delivery_date?: string | null;
  sale_date?: string | null;
  warranty_years?: number;
  days_remaining?: number | null;
  km_remaining?: number | null;
  warranty_reason?: string;
}

export interface VINNo {
  name: string;
  vin_number: string;
  linked_item?: string;
  plate_number?: string;
  /** Link to Vehicle Model doctype */
  model?: string;
  model_name?: string;
  brand?: string;
  brand_label?: string;
  resolved_vehicle_model?: string;
  resolved_vehicle_model_label?: string;
  model_year?: number;
  current_customer?: string;
  customer_name?: string;
  current_odometer?: number;
  warranty_status?: string;
  warranty_end_date?: string;
}

export interface VehicleModelOption {
  name: string;
  model_name?: string;
  model_code?: string;
  brand?: string;
  brand_label?: string;
  model_year?: number;
  variant?: string;
}

export interface VINNoListItem {
  name: string;
  vin_number: string;
  engine_number?: string;
  plate_number?: string;
  linked_item?: string;
  model?: string;
  model_name?: string;
  model_year?: number;
  brand?: string;
  fuel_type?: string;
  transmission?: string;
  exterior_color?: string;
  current_customer?: string;
  customer_name?: string;
  current_odometer?: number;
  odometer_unit?: string;
  warranty_status?: string;
  warranty_end_date?: string;
  vehicle_status?: string;
  company?: string;
  next_service_due_km?: number;
  next_service_due_date?: string;
  creation?: string;
  modified?: string;
}

export interface VINCustomerHistoryRow {
  name?: string;
  customer: string;
  customer_name?: string;
  mobile_no?: string;
  email_id?: string;
  tax_id?: string;
  relationship?: string;
  from_date?: string;
  to_date?: string;
  is_current?: number;
  notes?: string;
}

export interface VINNoFull {
  name: string;
  vin_number: string;
  engine_number?: string;
  plate_number?: string;
  company?: string;
  status?: string;
  linked_item?: string;
  model?: string;
  model_name?: string;
  linked_serial?: string;
  brand?: string;
  brand_label?: string;
  model_variant?: string;
  model_year?: number;
  production_date?: string;
  fuel_type?: string;
  transmission?: string;
  drive_type?: string;
  engine_code?: string;
  exterior_color?: string;
  interior_color?: string;
  interior_material?: string;
  current_customer?: string;
  customer_name?: string;
  resolved_vehicle_model?: string;
  resolved_vehicle_model_label?: string;
  warranty_summary?: VehicleWarrantySummary;
  owner_mobile?: string;
  owner_email?: string;
  owner_tax_id?: string;
  customer_history?: VINCustomerHistoryRow[];
  delivery_date?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  warranty_km_limit?: number;
  warranty_status?: string;
  current_odometer?: number;
  odometer_unit?: string;
  last_service_odometer?: number;
  last_service_date?: string;
  next_service_due_km?: number;
  next_service_due_date?: string;
  vehicle_status?: string;
  import_type?: string;
  registration_date?: string;
  insurance_company?: string;
  insurance_expiry_date?: string;
  is_fleet_vehicle?: boolean;
  special_notes?: string;
  internal_notes?: string;
}

export interface ServiceAdvisor {
  name: string;
  full_name: string;
  email?: string;
  phone?: string;
}

export type TechnicianStatus = 'Active' | 'On Leave' | 'Inactive' | 'Terminated';

export type TechnicianSkillLevel =
  | 'Trainee'
  | 'Junior'
  | 'Intermediate'
  | 'Senior'
  | 'Master Technician'
  | 'EV/PHEV Certified'
  | 'Expert';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';

export interface TechnicianSpecialization {
  name: string;
  specialization: string;
  proficiency_level?: string;
  years_experience_in_area?: number;
  last_training_date?: string;
  certification_held?: string;
}

export interface TechnicianCertification {
  name: string;
  certification_name: string;
  issuing_authority?: string;
  certification_date?: string;
  expiry_date?: string;
  certificate_number?: string;
  is_active?: boolean;
  notes?: string;
}

export interface TechnicianFull {
  name: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  status: TechnicianStatus;
  skill_level: TechnicianSkillLevel;
  labor_rate_group?: string;
  personal_phone: string;
  alternative_phone?: string;
  address?: string;
  branch?: string;
  department?: string;
  designation?: string;
  work_shift?: string;
  weekly_off_days?: string;
  hourly_base_rate?: number;
  years_of_experience?: number;
  experience_at_suweys?: number;
  date_of_joining?: string;

  specialization?: TechnicianSpecialization[];
  certifications?: TechnicianCertification[];

  efficiency_rating?: number;
  productivity_score?: number;
  first_time_fix_rate?: number;
  customer_satisfaction_score?: number;
  total_jobs_completed?: number;
  total_labor_hours?: number;
  total_sold_hours?: number;
  total_idle_hours?: number;

  current_assigned_bay?: string;
  current_job_card?: string;
  today_scheduled_jobs?: number;
  attendance_today?: AttendanceStatus;
  clock_in_time?: string;
  clock_out_time?: string;

  profile_photo?: string;
  digital_signature?: string;
  notes?: string;
  performance_notes?: string;
}

export interface TechnicianListItem {
  name: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  status: TechnicianStatus;
  skill_level: TechnicianSkillLevel;
  labor_rate_group?: string;
  personal_phone?: string;
  branch?: string;
  work_shift?: string;
  weekly_off_days?: string;
  current_assigned_bay?: string;
  current_job_card?: string;
  today_scheduled_jobs?: number;
  attendance_today?: AttendanceStatus;
  clock_in_time?: string;
  clock_out_time?: string;
  efficiency_rating?: number;
  total_jobs_completed?: number;
  total_labor_hours?: number;
  profile_photo?: string;
  years_of_experience?: number;
}

export type TechnicianAvailabilityStatus = 'available' | 'busy' | 'not_available';

export interface TechnicianDayCalendarBlock {
  job_card: string;
  status: string;
  role: string;
  customer_name?: string;
  vehicle_model?: string;
  start?: string | null;
  end?: string | null;
  kind: 'scheduled' | 'in_progress';
}

export interface TechnicianDayCalendar {
  blocks: TechnicianDayCalendarBlock[];
  free_slots: Array<{ start: string; end: string }>;
}

export interface TechnicianDayAvailability {
  date: string;
  in_month?: boolean;
  availability_status: TechnicianAvailabilityStatus;
  unavailable_reason?: string | null;
  currently_working?: boolean;
  is_available?: boolean;
  has_schedule_conflict?: boolean;
  active_job_count: number;
  active_jobs?: Array<{
    name: string;
    status: string;
    customer_name?: string;
    vehicle_model?: string;
    schedule_start_time?: string;
    schedule_end_time?: string;
    role?: string;
  }>;
  day_calendar?: TechnicianDayCalendar;
}

export interface TechnicianAvailabilityCalendar {
  technician: string;
  view: 'week' | 'month';
  start_date: string;
  end_date: string;
  anchor_date: string;
  days: Record<string, TechnicianDayAvailability>;
}

export interface TechnicianAvailability extends TechnicianListItem {
  active_jobs: Array<{
    name: string;
    status: string;
    customer_name?: string;
    vehicle_model?: string;
    schedule_start_time?: string;
    schedule_end_time?: string;
    priority?: string;
    role?: string;
  }>;
  active_job_count: number;
  currently_working: boolean;
  is_available: boolean;
  availability_status: TechnicianAvailabilityStatus;
  unavailable_reason?: string | null;
  has_schedule_conflict?: boolean;
  day_calendar?: TechnicianDayCalendar;
}

export interface TechnicianScheduleJob {
  name: string;
  status: string;
  customer_name?: string;
  vehicle_model?: string;
  license_plate?: string;
  priority?: string;
  posting_date?: string;
  schedule_start_time?: string;
  schedule_end_time?: string;
  assigned_bay?: string;
  job_card_type?: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  role?: 'Lead' | 'Assistant';
}

export interface Technician {
  name: string;
  full_name: string;
  specialization?: string;
}

export interface ServiceBay {
  name: string;
  bay_number?: string;
  bay_name?: string;
  bay_type?: string;
  branch?: string;
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
  job_card?: string;
  customer?: string;
  vehicle_vin?: string;
  vehicle_model?: string;
  license_plate?: string;
  delivered_by?: string;
  delivery_date_time?: string;
  delivery_date?: string;
  delivery_time?: string;
  final_odometer_km?: number;
  final_fuel_level?: string;
  vehicle_condition?: string;
  new_damage_notes?: string;
  received_by?: string;
  customer_mobile?: string;
  invoice_explained?: boolean;
  invoice_copy_given?: boolean;
  payment_cleared?: boolean;
  payment_method?: string;
  customer_satisfaction_initial?: string;
  customer_satisfaction_score?: number;
  customer_comments?: string;
  customer_signature?: string;
  delivered_by_signature?: string;
  delivery_notes?: string;
  checklist_completed?: Record<string, boolean>;
  submit?: boolean;
  next_service_due_km?: number;
  next_service_due_date?: string;
  docstatus?: number;
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

// ============ SALES INVOICE (from Frappe) ============

export interface SalesInvoiceListItem {
  name: string;
  customer: string;
  customer_name?: string;
  posting_date: string;
  due_date?: string;
  grand_total: number;
  outstanding_amount: number;
  status: string;
  currency?: string;
  docstatus?: 0 | 1 | 2;
  creation?: string;
  modified?: string;
  /** Set when another Sales Invoice was amended from this one. */
  already_amended?: number | boolean;
  amended_as?: string | null;
}

export interface InvoicePreviewLine {
  line_type: 'Labour' | 'Parts';
  item_code: string;
  description: string;
  /** Complaint / diagnosis — show on hover, not as the line label. */
  issue?: string | null;
  qty: number;
  rate: number;
  amount: number;
  base_rate?: number;
  discount_percentage?: number;
  is_warranty_covered?: boolean;
  /** Child-table row name on the job card (for price overrides). */
  source_row?: string;
  /** Per-line share when warranty type is Discount (audit / preview). */
  dms_discount?: number;
  /** True when the part was never included on a Parts Request for this job card. */
  never_requested?: boolean;
}

export interface InvoicePreview {
  job_card: string;
  customer: string;
  customer_name: string;
  company: string;
  warranty_application_type?: WarrantyApplicationType | '' | null;
  job_card_warranty_application_type?: WarrantyApplicationType | '' | null;
  lines: InvoicePreviewLine[];
  has_labour: boolean;
  labour_total: number;
  parts_total: number;
  subtotal: number;
  discount_amount: number;
  labour_discount?: { type: 'percentage' | 'amount'; value: number } | null;
  parts_discount?: { type: 'percentage' | 'amount'; value: number } | null;
  estimated_total: number;
  currency?: string;
  existing_invoice?: string;
  add_full_warranty_item_on_invoice?: boolean;
}

export interface SalesInvoiceDetail extends SalesInvoiceListItem {
  company?: string;
  remarks?: string;
  net_total?: number;
  total_taxes_and_charges?: number;
  amended_from?: string;
  additional_discount_percentage?: number;
  discount_amount?: number;
  apply_discount_on?: string;
  missing_dms?: number;
  is_dms_transaction?: number;
  dms_job_card?: string;
  items: {
    name?: string;
    idx?: number;
    item_code: string;
    item_name?: string;
    description?: string;
    qty: number;
    rate: number;
    amount: number;
    dms_discount?: number;
  }[];
}

export interface ModeOfPayment {
  name: string;
  type?: string;
  account?: string | null;
  account_name?: string | null;
}

// ============ API RESPONSE TYPES ============

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

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
