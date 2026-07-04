import type { ReactNode } from "react";

interface MetricStatProps {
  label: string;
  value: ReactNode;
  variant?: "inline" | "tile";
  valueClassName?: string;
}

export function MetricStat({ label, value, variant = "inline", valueClassName }: MetricStatProps) {
  if (variant === "tile") {
    return (
      <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
        <div className="text-lg font-semibold font-display">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{label}</div>
      <div className={valueClassName ?? "font-semibold mt-1"}>{value}</div>
    </div>
  );
}
