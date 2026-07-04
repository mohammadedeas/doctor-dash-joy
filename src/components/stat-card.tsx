import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

const VARIANT_STYLES = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
};

const DEFAULT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  hint?: string;
  icon: ReactNode;
  variant?: keyof typeof VARIANT_STYLES;
  motionVariants?: Variants;
}

export function StatCard({
  label,
  value,
  prefix,
  hint,
  icon,
  variant = "blue",
  motionVariants,
}: StatCardProps) {
  const animatedValue = useCountUp(value, 1400);
  const displayValue = prefix
    ? `${prefix}${Number(animatedValue.replace(/,/g, "")).toLocaleString(undefined, {
        minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })}`
    : animatedValue;

  return (
    <motion.div
      variants={motionVariants ?? DEFAULT_VARIANTS}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4 lg:p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`size-9 rounded-lg flex items-center justify-center ${VARIANT_STYLES[variant]}`}>
          {icon}
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
      <div className="text-2xl font-bold font-display tracking-tight text-foreground tabular-nums">
        {displayValue}
      </div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
        {label}
      </div>
      {hint && <div className="text-xs text-muted-foreground/70 mt-2">{hint}</div>}
    </motion.div>
  );
}
