/** Shared with Vehicle Inspection → Job Card Item complaint rows */

export const SYMPTOM_CATEGORIES = [
  'Engine',
  'Transmission',
  'Brake',
  'Steering',
  'Suspension',
  'Electrical',
  'AC',
  'Body',
  'Infotainment',
  'Warning Light',
  'Noise',
  'Vibration',
  'Leak',
  'Smell',
  'Performance',
  'Charging/PHEV',
  'Other',
] as const;

export type SymptomCategory = (typeof SYMPTOM_CATEGORIES)[number];

/** Matches Vehicle Customer Complaint severity options */
export const COMPLAINT_SEVERITY_OPTIONS = [
  '1 - Low',
  '2 - Minor',
  '3 - Moderate',
  '4 - High',
  '5 - Safety Critical',
] as const;

export type ComplaintSeverity = (typeof COMPLAINT_SEVERITY_OPTIONS)[number];

export const DEFAULT_SYMPTOM_CATEGORY: SymptomCategory = 'Other';
export const DEFAULT_COMPLAINT_SEVERITY: ComplaintSeverity = '3 - Moderate';
