import type { ToothNumber, ToothType, Jaw, ToothSide } from "./types";

export interface ToothMeta {
  number: ToothNumber;
  iso: string;
  name: string;
  type: ToothType;
  jaw: Jaw;
  side: ToothSide;
  quadrant: number;
  universal: number;
}

// ISO 3950 numbering: quadrant (1-4) + tooth (1-8)
// Quadrant 1: upper right permanent
// Quadrant 2: upper left permanent
// Quadrant 3: lower left permanent
// Quadrant 4: lower right permanent

export const PERMANENT_TEETH: ToothMeta[] = [
  // Quadrant 1 — Upper Right
  { number: 18, iso: "18", name: "3rd Molar (UR)", type: "wisdom", jaw: "upper", side: "right", quadrant: 1, universal: 1 },
  { number: 17, iso: "17", name: "2nd Molar (UR)", type: "molar", jaw: "upper", side: "right", quadrant: 1, universal: 2 },
  { number: 16, iso: "16", name: "1st Molar (UR)", type: "molar", jaw: "upper", side: "right", quadrant: 1, universal: 3 },
  { number: 15, iso: "15", name: "2nd Premolar (UR)", type: "premolar", jaw: "upper", side: "right", quadrant: 1, universal: 4 },
  { number: 14, iso: "14", name: "1st Premolar (UR)", type: "premolar", jaw: "upper", side: "right", quadrant: 1, universal: 5 },
  { number: 13, iso: "13", name: "Canine (UR)", type: "canine", jaw: "upper", side: "right", quadrant: 1, universal: 6 },
  { number: 12, iso: "12", name: "Lateral Incisor (UR)", type: "incisor", jaw: "upper", side: "right", quadrant: 1, universal: 7 },
  { number: 11, iso: "11", name: "Central Incisor (UR)", type: "incisor", jaw: "upper", side: "right", quadrant: 1, universal: 8 },
  // Quadrant 2 — Upper Left
  { number: 21, iso: "21", name: "Central Incisor (UL)", type: "incisor", jaw: "upper", side: "left", quadrant: 2, universal: 9 },
  { number: 22, iso: "22", name: "Lateral Incisor (UL)", type: "incisor", jaw: "upper", side: "left", quadrant: 2, universal: 10 },
  { number: 23, iso: "23", name: "Canine (UL)", type: "canine", jaw: "upper", side: "left", quadrant: 2, universal: 11 },
  { number: 24, iso: "24", name: "1st Premolar (UL)", type: "premolar", jaw: "upper", side: "left", quadrant: 2, universal: 12 },
  { number: 25, iso: "25", name: "2nd Premolar (UL)", type: "premolar", jaw: "upper", side: "left", quadrant: 2, universal: 13 },
  { number: 26, iso: "26", name: "1st Molar (UL)", type: "molar", jaw: "upper", side: "left", quadrant: 2, universal: 14 },
  { number: 27, iso: "27", name: "2nd Molar (UL)", type: "molar", jaw: "upper", side: "left", quadrant: 2, universal: 15 },
  { number: 28, iso: "28", name: "3rd Molar (UL)", type: "wisdom", jaw: "upper", side: "left", quadrant: 2, universal: 16 },
  // Quadrant 3 — Lower Left
  { number: 38, iso: "38", name: "3rd Molar (LL)", type: "wisdom", jaw: "lower", side: "left", quadrant: 3, universal: 17 },
  { number: 37, iso: "37", name: "2nd Molar (LL)", type: "molar", jaw: "lower", side: "left", quadrant: 3, universal: 18 },
  { number: 36, iso: "36", name: "1st Molar (LL)", type: "molar", jaw: "lower", side: "left", quadrant: 3, universal: 19 },
  { number: 35, iso: "35", name: "2nd Premolar (LL)", type: "premolar", jaw: "lower", side: "left", quadrant: 3, universal: 20 },
  { number: 34, iso: "34", name: "1st Premolar (LL)", type: "premolar", jaw: "lower", side: "left", quadrant: 3, universal: 21 },
  { number: 33, iso: "33", name: "Canine (LL)", type: "canine", jaw: "lower", side: "left", quadrant: 3, universal: 22 },
  { number: 32, iso: "32", name: "Lateral Incisor (LL)", type: "incisor", jaw: "lower", side: "left", quadrant: 3, universal: 23 },
  { number: 31, iso: "31", name: "Central Incisor (LL)", type: "incisor", jaw: "lower", side: "left", quadrant: 3, universal: 24 },
  // Quadrant 4 — Lower Right
  { number: 41, iso: "41", name: "Central Incisor (LR)", type: "incisor", jaw: "lower", side: "right", quadrant: 4, universal: 25 },
  { number: 42, iso: "42", name: "Lateral Incisor (LR)", type: "incisor", jaw: "lower", side: "right", quadrant: 4, universal: 26 },
  { number: 43, iso: "43", name: "Canine (LR)", type: "canine", jaw: "lower", side: "right", quadrant: 4, universal: 27 },
  { number: 44, iso: "44", name: "1st Premolar (LR)", type: "premolar", jaw: "lower", side: "right", quadrant: 4, universal: 28 },
  { number: 45, iso: "45", name: "2nd Premolar (LR)", type: "premolar", jaw: "lower", side: "right", quadrant: 4, universal: 29 },
  { number: 46, iso: "46", name: "1st Molar (LR)", type: "molar", jaw: "lower", side: "right", quadrant: 4, universal: 30 },
  { number: 47, iso: "47", name: "2nd Molar (LR)", type: "molar", jaw: "lower", side: "right", quadrant: 4, universal: 31 },
  { number: 48, iso: "48", name: "3rd Molar (LR)", type: "wisdom", jaw: "lower", side: "right", quadrant: 4, universal: 32 },
];

export const UPPER_TEETH = PERMANENT_TEETH.filter((t) => t.jaw === "upper");
export const LOWER_TEETH = PERMANENT_TEETH.filter((t) => t.jaw === "lower");

export const getToothByNumber = (n: ToothNumber): ToothMeta | undefined =>
  PERMANENT_TEETH.find((t) => t.number === n);

export const UPPER_RIGHT = UPPER_TEETH.filter((t) => t.side === "right");
export const UPPER_LEFT = UPPER_TEETH.filter((t) => t.side === "left");
export const LOWER_LEFT = LOWER_TEETH.filter((t) => t.side === "left").reverse();
export const LOWER_RIGHT = LOWER_TEETH.filter((t) => t.side === "right").reverse();

export const DEFAULT_PERIO_SURFACES: import("./types").Surface[] = [
  "mesioBuccal",
  "buccal",
  "distoBuccal",
  "mesioPalatal",
  "palatal",
  "distoPalatal",
];

export function getPocketDepthColor(depth?: number): string {
  if (depth === undefined || depth === null) return "#94a3b8";
  if (depth <= 3) return "#10b981"; // healthy
  if (depth <= 5) return "#f59e0b"; // moderate
  return "#ef4444"; // severe
}

export function getPocketDepthBg(depth?: number): string {
  if (depth === undefined || depth === null) return "bg-muted text-muted-foreground";
  if (depth <= 3) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400";
  if (depth <= 5) return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400";
  return "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400";
}

export function getPocketDepthSolidBg(depth?: number): string {
  if (depth === undefined || depth === null) return "bg-slate-400";
  if (depth <= 3) return "bg-emerald-500 dark:bg-emerald-400";
  if (depth <= 5) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
}
