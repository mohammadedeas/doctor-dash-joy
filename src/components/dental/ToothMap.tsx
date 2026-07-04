import { useState, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ToothSVG } from "./ToothSVG";
import type { ToothCondition } from "./types";
import type { ToothMeta } from "./constants";
import type { TreatmentStatus } from "./treatment-constants";
import {
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
} from "./constants";
import { JawLabel } from "./JawLabel";
import { cn } from "@/lib/utils";

interface ToothMapProps {
  title: string;
  subtitle: string;
  selectedToothNumber?: number;
  onToothClick: (tooth: ToothMeta) => void;
  getToothProps: (toothNumber: number) => {
    conditions?: ToothCondition[];
    treatmentStatus?: TreatmentStatus;
  };
  /** Tighter spacing/sizing used when the chart is embedded in a dialog (visit entry). */
  compact?: boolean;
  legend: ReactNode;
  className?: string;
}

export function ToothMap({
  title,
  subtitle,
  selectedToothNumber,
  onToothClick,
  getToothProps,
  compact = false,
  legend,
  className,
}: ToothMapProps) {
  const [hoveredTooth, setHoveredTooth] = useState<ToothMeta | null>(null);
  const toothSize = compact ? 44 : 48;

  const renderTooth = useCallback(
    (tooth: ToothMeta) => (
      <ToothSVG
        key={tooth.number}
        tooth={tooth}
        selected={selectedToothNumber === tooth.number}
        onClick={onToothClick}
        onHover={setHoveredTooth}
        size={toothSize}
        {...getToothProps(tooth.number)}
      />
    ),
    [selectedToothNumber, onToothClick, getToothProps, toothSize]
  );

  return (
    <div
      className={cn(
        "bg-card rounded-2xl shadow-card border border-border",
        compact ? "p-4 sm:p-6" : "p-4 sm:p-8",
        className
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between", compact ? "mb-4" : "mb-6")}>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
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
            {UPPER_RIGHT.map(renderTooth)}
            {UPPER_LEFT.map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Midline separator */}
      <div className={cn("flex justify-center", compact ? "my-3" : "my-4")}>
        <div className={cn("w-px bg-border", compact ? "h-6" : "h-8")} />
      </div>

      {/* Lower Jaw */}
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="flex items-start gap-1 sm:gap-1.5">
            {LOWER_RIGHT.map(renderTooth)}
            {LOWER_LEFT.map(renderTooth)}
          </div>
        </div>
        <JawLabel label="Lower Jaw" />
      </div>

      {/* Legend */}
      <div className={cn("border-t border-border", compact ? "mt-4 pt-3" : "mt-6 pt-4")}>{legend}</div>
    </div>
  );
}

export function LegendItem({
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
