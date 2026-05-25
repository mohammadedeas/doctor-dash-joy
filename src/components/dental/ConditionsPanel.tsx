import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ToothClinicalData, ToothCondition, MobilityGrade, FurcationGrade } from "./types";
import { CONDITION_CONFIG } from "./types";
import { cn } from "@/lib/utils";

interface ConditionsPanelProps {
  data: ToothClinicalData;
  onChange: (
    conditions: ToothCondition[],
    mobilityGrade?: MobilityGrade,
    furcationGrade?: FurcationGrade
  ) => void;
}

const MOBILITY_OPTIONS: { value: MobilityGrade; label: string }[] = [
  { value: null, label: "None" },
  { value: "I", label: "Grade I" },
  { value: "II", label: "Grade II" },
  { value: "III", label: "Grade III" },
];

const FURCATION_OPTIONS: { value: FurcationGrade; label: string }[] = [
  { value: null, label: "None" },
  { value: "I", label: "Grade I" },
  { value: "II", label: "Grade II" },
  { value: "III", label: "Grade III" },
];

export function ConditionsPanel({ data, onChange }: ConditionsPanelProps) {
  const toggleCondition = (condition: ToothCondition) => {
    const has = data.conditions.includes(condition);
    const next = has
      ? data.conditions.filter((c) => c !== condition)
      : [...data.conditions, condition];

    let mobility = data.mobilityGrade;
    let furcation = data.furcationGrade;

    if (condition === "mobility" && has) mobility = undefined;
    if (condition === "furcation" && has) furcation = undefined;

    onChange(next, mobility, furcation);
  };

  const setMobility = (grade: MobilityGrade) => {
    const hasMobility = data.conditions.includes("mobility");
    let conditions = data.conditions;
    if (grade && !hasMobility) {
      conditions = [...conditions, "mobility"];
    } else if (!grade && hasMobility) {
      conditions = conditions.filter((c) => c !== "mobility");
    }
    onChange(conditions, grade || undefined, data.furcationGrade);
  };

  const setFurcation = (grade: FurcationGrade) => {
    const hasFurcation = data.conditions.includes("furcation");
    let conditions = data.conditions;
    if (grade && !hasFurcation) {
      conditions = [...conditions, "furcation"];
    } else if (!grade && hasFurcation) {
      conditions = conditions.filter((c) => c !== "furcation");
    }
    onChange(conditions, data.mobilityGrade, grade || undefined);
  };

  const conditionList: ToothCondition[] = Object.keys(CONDITION_CONFIG) as ToothCondition[];

  return (
    <div className="space-y-5">
      {/* Condition Grid */}
      <div>
        <h5 className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">
          Tooth Conditions
        </h5>
        <div className="grid grid-cols-2 gap-2">
          {conditionList.map((condition) => {
            const config = CONDITION_CONFIG[condition];
            const isActive = data.conditions.includes(condition);
            const isGradingCondition = condition === "mobility" || condition === "furcation";

            return (
              <motion.button
                key={condition}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleCondition(condition)}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all",
                  isActive
                    ? "border-border shadow-sm bg-card"
                    : "border-border/60 bg-muted/50 hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                    isActive ? "border-current" : "border-border bg-card"
                  )}
                  style={{ color: isActive ? config.fill : undefined }}
                >
                  {isActive && <Check className="h-3 w-3 text-white" style={{ color: config.fill }} />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? config.color : "text-muted-foreground"
                  )}
                >
                  {config.label}
                </span>
                {isActive && !isGradingCondition && (
                  <motion.div
                    layoutId={`cond-dot-${condition}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: config.fill }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobility Grade */}
      {data.conditions.includes("mobility") && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Mobility Grade
          </h5>
          <div className="flex gap-2">
            {MOBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setMobility(opt.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                  data.mobilityGrade === opt.value
                    ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Furcation Grade */}
      {data.conditions.includes("furcation") && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Furcation Grade
          </h5>
          <div className="flex gap-2">
            {FURCATION_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setFurcation(opt.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                  data.furcationGrade === opt.value
                    ? "bg-pink-50 border-pink-200 text-pink-700 shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
