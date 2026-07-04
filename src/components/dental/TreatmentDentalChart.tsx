import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ToothMap } from "./ToothMap";
import { TreatmentEntryPanel } from "./TreatmentEntryPanel";
import type { ToothTreatment } from "@/lib/clinic-types";
import type { ToothMeta } from "./constants";
import { TREATMENT_STATUS_CONFIG } from "./treatment-constants";
import { TONE_STYLES } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface TreatmentDentalChartProps {
  patientId: string;
  visitId?: string;
  treatments: ToothTreatment[];
  onAddTreatment: (treatment: Omit<ToothTreatment, "id" | "createdAt">) => void;
  onUpdateTreatment: (id: string, treatment: Partial<ToothTreatment>) => void;
  onDeleteTreatment: (id: string) => void;
  className?: string;
}

export function TreatmentDentalChart({
  patientId,
  visitId,
  treatments,
  onAddTreatment,
  onUpdateTreatment,
  onDeleteTreatment,
  className,
}: TreatmentDentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothMeta | null>(null);

  const handleToothClick = useCallback((tooth: ToothMeta) => {
    setSelectedTooth((prev) => (prev?.number === tooth.number ? null : tooth));
  }, []);

  const getToothStatus = useCallback(
    (number: number) => {
      const toothTreatments = treatments.filter((t) => t.toothNumber === number);
      if (toothTreatments.length === 0) return undefined;
      // Return the most recent non-completed status, or completed if all done
      const sorted = [...toothTreatments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sorted[0].status;
    },
    [treatments]
  );

  const getToothProps = useCallback(
    (number: number) => ({ treatmentStatus: getToothStatus(number) }),
    [getToothStatus]
  );

  const selectedTreatments = useMemo(() => {
    if (!selectedTooth) return [];
    return treatments.filter((t) => t.toothNumber === selectedTooth.number);
  }, [selectedTooth, treatments]);

  const handleSave = useCallback(
    (treatment: Omit<ToothTreatment, "id" | "createdAt">) => {
      onAddTreatment({ ...treatment, patientId, visitId: visitId || "" });
    },
    [patientId, visitId, onAddTreatment]
  );

  return (
    <div className={cn("relative", className)}>
      <ToothMap
        title="Dental Chart"
        subtitle="FDI notation · Click tooth to add treatment"
        selectedToothNumber={selectedTooth?.number}
        onToothClick={handleToothClick}
        getToothProps={getToothProps}
        compact
        legend={
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
            {Object.entries(TREATMENT_STATUS_CONFIG).map(([status, cfg]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={cn("w-2.5 h-2.5 rounded-full", TONE_STYLES[cfg.tone].dot)} />
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        }
      />

      {/* Treatment Entry Modal */}
      <AnimatePresence>
        {selectedTooth && (
          <TreatmentEntryPanel
            tooth={selectedTooth}
            existingTreatments={selectedTreatments}
            onSave={handleSave}
            onUpdate={onUpdateTreatment}
            onDelete={onDeleteTreatment}
            onClose={() => setSelectedTooth(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
