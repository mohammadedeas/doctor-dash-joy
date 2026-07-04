import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ToothMap, LegendItem } from "./ToothMap";
import { ToothDetailPanel } from "./ToothDetailPanel";
import type { ToothClinicalData, ToothCondition } from "./types";
import { CONDITION_CONFIG } from "./types";
import type { ToothMeta } from "./constants";
import type { ToothTreatment } from "@/lib/clinic-types";
import { PERMANENT_TEETH } from "./constants";
import { TREATMENT_STATUS_CONFIG } from "./treatment-constants";
import { toneCssVar } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const CONDITION_LEGEND: ToothCondition[] = [
  "crown",
  "implant",
  "caries",
  "rootCanal",
  "veneer",
  "fracture",
  "extractionPlanned",
  "missing",
];

interface DentalChartProps {
  patientId: string;
  initialData?: Record<number, ToothClinicalData>;
  onDataChange?: (data: Record<number, ToothClinicalData>) => void;
  toothTreatments?: ToothTreatment[];
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
  toothTreatments = [],
  className,
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothMeta | null>(null);
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

  const getTreatmentStatus = useCallback(
    (number: number) => {
      const tts = toothTreatments.filter((t) => t.toothNumber === number);
      if (tts.length === 0) return undefined;
      const sorted = [...tts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sorted[0].status;
    },
    [toothTreatments]
  );

  const getToothHistory = useCallback(
    (number: number) => {
      return toothTreatments
        .filter((t) => t.toothNumber === number)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    [toothTreatments]
  );

  const handleToothClick = useCallback((tooth: ToothMeta) => {
    setSelectedTooth((prev: ToothMeta | null) => (prev?.number === tooth.number ? null : tooth));
  }, []);

  const getToothProps = useCallback(
    (number: number) => ({
      conditions: getConditions(number),
      treatmentStatus: getTreatmentStatus(number),
    }),
    [getConditions, getTreatmentStatus]
  );

  const selectedData = useMemo(() => {
    if (!selectedTooth) return null;
    return toothData[selectedTooth.number] || createDefaultToothData(selectedTooth.number);
  }, [selectedTooth, toothData]);

  return (
    <div className={cn("relative", className)}>
      <ToothMap
        title="Permanent Dentition"
        subtitle="ISO 3950 notation · Click tooth to examine"
        selectedToothNumber={selectedTooth?.number}
        onToothClick={handleToothClick}
        getToothProps={getToothProps}
        legend={
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Findings
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-muted-foreground">
              {CONDITION_LEGEND.map((condition) => (
                <LegendItem
                  key={condition}
                  color={CONDITION_CONFIG[condition].fill}
                  label={CONDITION_CONFIG[condition].label}
                  dashed={condition === "missing"}
                />
              ))}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-3 mb-1.5 pt-2 border-t border-border/50">
              Treatment Status
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
              {Object.values(TREATMENT_STATUS_CONFIG).map((cfg) => (
                <LegendItem key={cfg.label} color={toneCssVar(cfg.tone)} label={cfg.label} />
              ))}
            </div>
          </>
        }
      />

      {/* Tooth Detail Panel */}
      <AnimatePresence>
        {selectedTooth && selectedData && (
          <ToothDetailPanel
            tooth={selectedTooth}
            data={selectedData}
            treatmentHistory={getToothHistory(selectedTooth.number)}
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
