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

// Colors reuse the app's semantic status tokens where the meaning lines up
// (caries/fracture = concerning finding -> destructive, root canal = procedural -> info,
// extraction planned = needs action -> warn, mobility = flagged for review -> purple).
// A few dental-specific conventions (crown/bridge gold, veneer teal, furcation pink) keep
// bespoke colors since there's no generic token for them, but the palette is curated to
// stay visually distinct across the smaller set of hues actually in use.
export const CONDITION_CONFIG: Record<
  ToothCondition,
  { label: string; color: string; fill: string }
> = {
  caries: {
    label: "Caries",
    color: "text-destructive",
    fill: "var(--destructive)",
  },
  crown: {
    label: "Crown",
    color: "text-amber-600",
    fill: "#d97706",
  },
  implant: {
    label: "Implant",
    color: "text-muted-foreground",
    fill: "var(--muted-foreground)",
  },
  missing: {
    label: "Missing",
    color: "text-muted-foreground",
    fill: "transparent",
  },
  fracture: {
    label: "Fracture",
    color: "text-destructive",
    fill: "var(--destructive)",
  },
  rootCanal: {
    label: "Root Canal",
    color: "text-info",
    fill: "var(--info)",
  },
  bridge: {
    label: "Bridge",
    color: "text-amber-600",
    fill: "#d97706",
  },
  veneer: {
    label: "Veneer",
    color: "text-teal-600",
    fill: "#0d9488",
  },
  extractionPlanned: {
    label: "Extraction Planned",
    color: "text-warn",
    fill: "var(--warn)",
  },
  mobility: {
    label: "Mobility",
    color: "text-purple",
    fill: "var(--purple)",
  },
  furcation: {
    label: "Furcation",
    color: "text-pink-600",
    fill: "#db2777",
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
