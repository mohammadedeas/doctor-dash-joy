import type { TreatmentStatus } from "@/lib/clinic-types";
import type { BadgeTone } from "@/components/status-badge";

export type { TreatmentStatus };

export const TREATMENT_PROCEDURES = [
  "Examination",
  "Composite Restoration",
  "Amalgam Restoration",
  "Temporary Filling",
  "Crown",
  "Bridge",
  "Veneer",
  "Root Canal Treatment",
  "Retreatment RCT",
  "Extraction",
  "Surgical Extraction",
  "Implant",
  "Bone Graft",
  "Scaling & Polishing",
  "Deep Scaling",
  "Periodontal Treatment",
  "Sealant",
  "Fluoride Application",
  "Denture",
  "Orthodontic Treatment",
  "Follow-up",
  "Emergency Treatment",
  "Other",
] as const;

export type TreatmentProcedure = (typeof TREATMENT_PROCEDURES)[number];

export const TREATMENT_STATUS_CONFIG: Record<TreatmentStatus, { label: string; tone: BadgeTone }> = {
  Planned: { label: "Planned", tone: "info" },
  "In Progress": { label: "In Progress", tone: "warn" },
  Completed: { label: "Completed", tone: "success" },
  Cancelled: { label: "Cancelled", tone: "neutral" },
  Referred: { label: "Referred", tone: "purple" },
  Failed: { label: "Failed", tone: "destructive" },
};

export const TREATMENT_STATUS_LIST: TreatmentStatus[] = [
  "Planned",
  "In Progress",
  "Completed",
  "Cancelled",
  "Referred",
  "Failed",
];
