export type JobType = "Live-in" | "Full-time" | "Part-time";
export type LeadPriority = "Hot" | "Warm" | "Cold";
export type LeadStatus = "In-progress" | "Won" | "Lost";

export const SALES_PERSONS = ["Laxmi", "Anjum", "Saritha", "Rashmi", "Ashma"] as const;
export type SalesPerson = (typeof SALES_PERSONS)[number];

export const JOB_TYPES: JobType[] = ["Live-in", "Full-time", "Part-time"];
export const PRIORITIES: LeadPriority[] = ["Hot", "Warm", "Cold"];
export const STATUSES: LeadStatus[] = ["In-progress", "Won", "Lost"];

export const TASK_OPTIONS: string[] = [
  "Housekeeping", "Dusting", "Cooking - South", "Cooking - North", "Elderly care",
  "Child care", "Driving", "Mopping", "Masseur", "Patient care",
  "Utensils cleaning", "Washing Cloths", "Carpentry", "Gardening",
];

export const LANGUAGE_OPTIONS: string[] = [
  "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Marathi", "Bengali",
  "Gujarati", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", "Konkani",
  "Manipuri", "Bodo", "Dogri", "Kashmiri", "Maithili", "Santali", "Sindhi",
  "Nepali", "Tulu", "Bhojpuri", "Rajasthani", "Haryanvi", "Chhattisgarhi",
];

export interface NewPlacement {
  id: string;
  lead_in_date: string;
  area: string;
  apartment: string;
  job_type: JobType;
  tasks: string[];
  language: string[];
  salary: string;
  lead_priority: LeadPriority;
  lead_status: LeadStatus;
  sales_person: SalesPerson;
  created_at: string;
  updated_at: string;
}

export interface Replacement extends NewPlacement {
  assign_to: string;
}
