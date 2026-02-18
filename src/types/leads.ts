export type JobType = "Live-in" | "Full-time" | "Part-time";
export type LeadPriority = "Hot" | "Warm" | "Cold";
export type LeadStatus = "In-progress" | "Won" | "Lost";
export type SalesPerson = "Laxmi" | "Anjum" | "Saritha" | "Rashmi";
export type TaskOption = "Housekeeping" | "Dusting" | "Cooking";
export type LanguageOption = "Hindi" | "Kannada";

export const JOB_TYPES: JobType[] = ["Live-in", "Full-time", "Part-time"];
export const PRIORITIES: LeadPriority[] = ["Hot", "Warm", "Cold"];
export const STATUSES: LeadStatus[] = ["In-progress", "Won", "Lost"];
export const SALES_PERSONS: SalesPerson[] = ["Laxmi", "Anjum", "Saritha", "Rashmi"];
export const TASK_OPTIONS: TaskOption[] = ["Housekeeping", "Dusting", "Cooking"];
export const LANGUAGE_OPTIONS: LanguageOption[] = ["Hindi", "Kannada"];

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
