export type ToothNumber = number;

export type Jaw = "upper" | "lower";
export type ToothSide = "left" | "right";
export type ToothType =
  | "incisor"
  | "canine"
  | "premolar"
  | "molar"
  | "wisdom";

export type Surface =
  | "buccal"
  | "lingual"
  | "mesial"
  | "distal"
  | "occlusal"
  | "palatal"
  | "mesioBuccal"
  | "distoBuccal"
  | "mesioPalatal"
  | "distoPalatal";

export type EndoTestType =
  | "cold"
  | "percussion"
  | "palpation"
  | "heat"
  | "electricPulp";

export type EndoTestResult =
  | "normal"
  | "positive"
  | "negative"
  | "delayed"
  | "severePain"
  | "noResponse";

export type ToothCondition =
  | "caries"
  | "crown"
  | "implant"
  | "missing"
  | "fracture"
  | "rootCanal"
  | "bridge"
  | "veneer"
  | "extractionPlanned"
  | "mobility"
  | "furcation";

export type MobilityGrade = "I" | "II" | "III" | null;
export type FurcationGrade = "I" | "II" | "III" | null;

export interface EndoTest {
  type: EndoTestType;
  result: EndoTestResult;
  notes?: string;
}

export interface PerioMeasurement {
  pocketDepth?: number;
  recession?: number;
  bleedingOnProbing?: boolean;
  plaque?: boolean;
  furcation?: FurcationGrade;
  mobility?: MobilityGrade;
}

export interface PerioSurfaceData {
  surface: Surface;
  measurements: PerioMeasurement;
}

export interface ToothClinicalData {
  toothNumber: ToothNumber;
  conditions: ToothCondition[];
  mobilityGrade?: MobilityGrade;
  furcationGrade?: FurcationGrade;
  endoTests: EndoTest[];
  perioData: PerioSurfaceData[];
  notes?: string;
  lastUpdated?: string;
}

export interface XrayImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: "xray" | "cbct" | "intraoral";
  title: string;
  toothNumbers?: ToothNumber[];
  visitId?: string;
  date: string;
  notes?: string;
  tags?: string[];
  annotations?: XrayAnnotation[];
}

export interface XrayAnnotation {
  id: string;
  type: "arrow" | "circle" | "text" | "line" | "measurement";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  points?: { x: number; y: number }[];
}

export interface ToothHistoryEntry {
  id: string;
  date: string;
  type: "visit" | "xray" | "procedure" | "note";
  title: string;
  description?: string;
  performedBy?: string;
}

export interface DentalChartState {
  patientId: string;
  teeth: Record<ToothNumber, ToothClinicalData>;
  xrays: XrayImage[];
  history: ToothHistoryEntry[];
}

export const ENDO_TEST_CONFIG: Record<
  EndoTestType,
  { label: string; icon: string }
> = {
  cold: { label: "Cold Test", icon: "snowflake" },
  percussion: { label: "Percussion", icon: "hammer" },
  palpation: { label: "Palpation", icon: "hand" },
  heat: { label: "Heat Test", icon: "flame" },
  electricPulp: { label: "Electric Pulp Test", icon: "zap" },
};

export const ENDO_RESULT_CONFIG: Record<
  EndoTestResult,
  { label: string; color: string; bg: string; ring: string }
> = {
  normal: {
    label: "Normal",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  positive: {
    label: "Positive",
    color: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  negative: {
    label: "Negative",
    color: "text-muted-foreground",
    bg: "bg-muted",
    ring: "ring-border",
  },
  delayed: {
    label: "Delayed",
    color: "text-orange-700",
    bg: "bg-orange-50",
    ring: "ring-orange-200",
  },
  severePain: {
    label: "Severe Pain",
    color: "text-red-700",
    bg: "bg-red-50",
    ring: "ring-red-200",
  },
  noResponse: {
    label: "No Response",
    color: "text-muted-foreground",
    bg: "bg-muted",
    ring: "ring-border",
  },
};

export const CONDITION_CONFIG: Record<
  ToothCondition,
  { label: string; color: string; fill: string; stroke: string }
> = {
  caries: {
    label: "Caries",
    color: "text-red-600",
    fill: "#ef4444",
    stroke: "#dc2626",
  },
  crown: {
    label: "Crown",
    color: "text-amber-600",
    fill: "#fbbf24",
    stroke: "#d97706",
  },
  implant: {
    label: "Implant",
    color: "text-muted-foreground",
    fill: "#94a3b8",
    stroke: "#64748b",
  },
  missing: {
    label: "Missing",
    color: "text-muted-foreground",
    fill: "transparent",
    stroke: "#9ca3af",
  },
  fracture: {
    label: "Fracture",
    color: "text-rose-600",
    fill: "#fda4af",
    stroke: "#e11d48",
  },
  rootCanal: {
    label: "Root Canal",
    color: "text-blue-600",
    fill: "#60a5fa",
    stroke: "#2563eb",
  },
  bridge: {
    label: "Bridge",
    color: "text-amber-700",
    fill: "#f59e0b",
    stroke: "#b45309",
  },
  veneer: {
    label: "Veneer",
    color: "text-teal-600",
    fill: "#5eead4",
    stroke: "#0d9488",
  },
  extractionPlanned: {
    label: "Extraction Planned",
    color: "text-orange-600",
    fill: "#fb923c",
    stroke: "#ea580c",
  },
  mobility: {
    label: "Mobility",
    color: "text-purple-600",
    fill: "#c084fc",
    stroke: "#9333ea",
  },
  furcation: {
    label: "Furcation",
    color: "text-pink-600",
    fill: "#f9a8d4",
    stroke: "#db2777",
  },
};

export const PERIO_SURFACE_LABELS: Record<Surface, string> = {
  buccal: "Buccal",
  lingual: "Lingual",
  mesial: "Mesial",
  distal: "Distal",
  occlusal: "Occlusal",
  palatal: "Palatal",
  mesioBuccal: "Mesio-Buccal",
  distoBuccal: "Disto-Buccal",
  mesioPalatal: "Mesio-Palatal",
  distoPalatal: "Disto-Palatal",
};
