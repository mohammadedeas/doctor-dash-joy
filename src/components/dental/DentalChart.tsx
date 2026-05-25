import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToothSVG } from "./ToothSVG";
import { ToothDetailPanel } from "./ToothDetailPanel";
import type { ToothClinicalData, ToothCondition } from "./types";
import type { ToothMeta } from "./constants";
import {
  PERMANENT_TEETH,
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
} from "./constants";
import { cn } from "@/lib/utils";

interface DentalChartProps {
  patientId: string;
  initialData?: Record<number, ToothClinicalData>;
  onDataChange?: (data: Record<number, ToothClinicalData>) => void;
  className?: string;
}

function createDefaultToothData(number: number): ToothClinicalData {
  return {
    toothNumber: number,
    conditions: [],
    endoTests: [],
    perioData: [],
    notes: "",
  };
}

export function DentalChart({
  patientId,
  initialData = {},
  onDataChange,
  className,
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothMeta | null>(null);
  const [hoveredTooth, setHoveredTooth] = useState<ToothMeta | null>(null);
  const [toothData, setToothData] = useState<Record<number, ToothClinicalData>>(() => {
    const data: Record<number, ToothClinicalData> = {};
    for (const t of PERMANENT_TEETH) {
      data[t.number] = initialData[t.number] || createDefaultToothData(t.number);
    }
    return data;
  });

  const updateTooth = useCallback(
    (number: number, updater: (prev: ToothClinicalData) => ToothClinicalData) => {
      setToothData((prev) => {
        const existing = prev[number] || createDefaultToothData(number);
        const next = {
          ...prev,
          [number]: updater(structuredClone(existing)),
        };
        onDataChange?.(next);
        return next;
      });
    },
    [onDataChange]
  );

  const getConditions = useCallback(
    (number: number): ToothCondition[] => {
      return toothData[number]?.conditions || [];
    },
    [toothData]
  );

  const handleToothClick = useCallback((tooth: ToothMeta) => {
    setSelectedTooth((prev: ToothMeta | null) => (prev?.number === tooth.number ? null : tooth));
  }, []);

  const selectedData = useMemo(() => {
    if (!selectedTooth) return null;
    return toothData[selectedTooth.number] || createDefaultToothData(selectedTooth.number);
  }, [selectedTooth, toothData]);

  return (
    <div className={cn("relative", className)}>
      {/* Chart Container */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Permanent Dentition
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ISO 3950 notation · Click tooth to examine
            </p>
          </div>
          {hoveredTooth && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border"
            >
              {hoveredTooth.iso} — {hoveredTooth.name}
            </motion.div>
          )}
        </div>

        {/* Upper Jaw */}
        <div className="space-y-2">
          <JawLabel label="Upper Jaw" />
          <div className="flex justify-center">
            <div className="flex items-end gap-1 sm:gap-1.5">
              {UPPER_RIGHT.map((tooth) => (
                <ToothSVG
                  key={tooth.number}
                  tooth={tooth}
                  selected={selectedTooth?.number === tooth.number}
                  conditions={getConditions(tooth.number)}
                  onClick={handleToothClick}
                  onHover={setHoveredTooth}
                  size={48}
                />
              ))}
              {UPPER_LEFT.map((tooth) => (
                <ToothSVG
                  key={tooth.number}
                  tooth={tooth}
                  selected={selectedTooth?.number === tooth.number}
                  conditions={getConditions(tooth.number)}
                  onClick={handleToothClick}
                  onHover={setHoveredTooth}
                  size={48}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Midline separator */}
        <div className="flex justify-center my-4">
          <div className="w-px h-8 bg-border" />
        </div>

        {/* Lower Jaw */}
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="flex items-start gap-1 sm:gap-1.5">
              {LOWER_RIGHT.map((tooth) => (
                <ToothSVG
                  key={tooth.number}
                  tooth={tooth}
                  selected={selectedTooth?.number === tooth.number}
                  conditions={getConditions(tooth.number)}
                  onClick={handleToothClick}
                  onHover={setHoveredTooth}
                  size={48}
                />
              ))}
              {LOWER_LEFT.map((tooth) => (
                <ToothSVG
                  key={tooth.number}
                  tooth={tooth}
                  selected={selectedTooth?.number === tooth.number}
                  conditions={getConditions(tooth.number)}
                  onClick={handleToothClick}
                  onHover={setHoveredTooth}
                  size={48}
                />
              ))}
            </div>
          </div>
          <JawLabel label="Lower Jaw" />
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-muted-foreground">
            <LegendItem color="#fbbf24" label="Crown" />
            <LegendItem color="#94a3b8" label="Implant" />
            <LegendItem color="#ef4444" label="Caries" />
            <LegendItem color="#2563eb" label="Root Canal" />
            <LegendItem color="#5eead4" label="Veneer" />
            <LegendItem color="#be123c" label="Fracture" />
            <LegendItem color="#c2410c" label="Extraction Planned" />
            <LegendItem color="#cbd5e1" label="Missing" dashed />
          </div>
        </div>
      </div>

      {/* Tooth Detail Panel */}
      <AnimatePresence>
        {selectedTooth && selectedData && (
          <ToothDetailPanel
            tooth={selectedTooth}
            data={selectedData}
            onClose={() => setSelectedTooth(null)}
            onUpdate={(updated) =>
              updateTooth(selectedTooth.number, () => updated)
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JawLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="h-px flex-1 max-w-[80px] bg-border" />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="h-px flex-1 max-w-[80px] bg-border" />
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-3 rounded-sm border border-border"
        style={{
          backgroundColor: color,
          borderStyle: dashed ? "dashed" : "solid",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
