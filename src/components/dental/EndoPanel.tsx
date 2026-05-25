import { useCallback } from "react";
import { motion } from "framer-motion";
import { Snowflake, Hammer, Hand, Flame, Zap } from "lucide-react";
import type { EndoTest, EndoTestType, EndoTestResult } from "./types";
import { ENDO_TEST_CONFIG, ENDO_RESULT_CONFIG } from "./types";
import { cn } from "@/lib/utils";

interface EndoPanelProps {
  tests: EndoTest[];
  onChange: (tests: EndoTest[]) => void;
}

const TEST_ICONS: Record<EndoTestType, React.ElementType> = {
  cold: Snowflake,
  percussion: Hammer,
  palpation: Hand,
  heat: Flame,
  electricPulp: Zap,
};

const RESULT_ORDER: EndoTestResult[] = [
  "normal",
  "positive",
  "negative",
  "delayed",
  "severePain",
  "noResponse",
];

export function EndoPanel({ tests, onChange }: EndoPanelProps) {
  const getTestResult = useCallback(
    (type: EndoTestType): EndoTestResult | undefined => {
      return tests.find((t) => t.type === type)?.result;
    },
    [tests]
  );

  const setTestResult = useCallback(
    (type: EndoTestType, result: EndoTestResult) => {
      const existing = tests.filter((t) => t.type !== type);
      const current = getTestResult(type);
      if (current === result) {
        // Toggle off
        onChange(existing);
      } else {
        onChange([...existing, { type, result }]);
      }
    },
    [tests, onChange, getTestResult]
  );

  const testTypes: EndoTestType[] = ["cold", "percussion", "palpation", "heat", "electricPulp"];

  return (
    <div className="space-y-4">
      {testTypes.map((type, idx) => {
        const config = ENDO_TEST_CONFIG[type];
        const Icon = TEST_ICONS[type];
        const currentResult = getTestResult(type);

        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted border border-border">
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">{config.label}</span>
              {currentResult && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    ENDO_RESULT_CONFIG[currentResult].bg,
                    ENDO_RESULT_CONFIG[currentResult].color
                  )}
                >
                  {ENDO_RESULT_CONFIG[currentResult].label}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {RESULT_ORDER.map((result) => {
                const resultConfig = ENDO_RESULT_CONFIG[result];
                const isActive = currentResult === result;

                return (
                  <button
                    key={result}
                    onClick={() => setTestResult(type, result)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                      isActive
                        ? cn(resultConfig.bg, resultConfig.color, "border-current shadow-sm ring-1", resultConfig.ring)
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {resultConfig.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
