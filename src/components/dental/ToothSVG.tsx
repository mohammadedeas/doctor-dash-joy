import { motion } from "framer-motion";
import type { ToothCondition } from "./types";
import type { ToothMeta } from "./constants";
import { TOOTH_PATHS, ROOT_PATHS, OCCLUSAL_DETAIL, TOOTH_VIEWBOX } from "./tooth-paths";
import { cn } from "@/lib/utils";

interface ToothSVGProps {
  tooth: ToothMeta;
  selected?: boolean;
  conditions?: ToothCondition[];
  onClick?: (tooth: ToothMeta) => void;
  onHover?: (tooth: ToothMeta | null) => void;
  className?: string;
  size?: number;
}

export function ToothSVG({
  tooth,
  selected = false,
  conditions = [],
  onClick,
  onHover,
  className,
  size = 48,
}: ToothSVGProps) {
  const path = TOOTH_PATHS[tooth.type] || TOOTH_PATHS.incisor;
  const rootPath = ROOT_PATHS[tooth.type] || ROOT_PATHS.incisor;
  const occlusalPath = OCCLUSAL_DETAIL[tooth.type];

  const isMissing = conditions.includes("missing");
  const isImplant = conditions.includes("implant");
  const hasRootCanal = conditions.includes("rootCanal");
  const hasCaries = conditions.includes("caries");
  const hasCrown = conditions.includes("crown");
  const hasBridge = conditions.includes("bridge");
  const hasVeneer = conditions.includes("veneer");
  const hasFracture = conditions.includes("fracture");
  const extractionPlanned = conditions.includes("extractionPlanned");

  // Base fill color based on conditions
  let baseFill = "#e2e8f0";
  let baseStroke = "#475569";
  let opacity = 1;

  if (isMissing) {
    opacity = 0.35;
    baseFill = "#cbd5e1";
    baseStroke = "#94a3b8";
  } else if (isImplant) {
    baseFill = "#cbd5e1";
    baseStroke = "#475569";
  }

  return (
    <motion.button
      type="button"
      className={cn(
        "relative flex flex-col items-center justify-center outline-none focus:outline-none rounded-lg",
        className
      )}
      style={{ width: size, height: size * 1.7 }}
      onClick={() => onClick?.(tooth)}
      onMouseEnter={() => onHover?.(tooth)}
      onMouseLeave={() => onHover?.(null)}
      whileHover={{ scale: isMissing ? 1 : 1.08 }}
      whileTap={{ scale: isMissing ? 1 : 0.95 }}
      animate={{
        filter: selected
          ? "drop-shadow(0 0 8px rgba(59,130,246,0.6))"
          : "drop-shadow(0 0 0px rgba(0,0,0,0))",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {/* Subtle background for visibility */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-colors",
          selected
            ? "bg-blue-50/80 ring-2 ring-blue-300"
            : "bg-muted/60 hover:bg-muted/80"
        )}
      />

      {/* ISO Number Label */}
      <span
        className={cn(
          "relative z-10 text-[9px] font-bold leading-none select-none",
          selected ? "text-primary" : "text-muted-foreground",
          isMissing && "text-muted-foreground/30"
        )}
      >
        {tooth.iso}
      </span>

      {/* Tooth SVG */}
      <svg
        width={size * 0.85}
        height={size * 1.2}
        viewBox={TOOTH_VIEWBOX}
        className="relative z-10 mt-0.5"
        style={{ opacity }}
      >
        <defs>
          <linearGradient id={`crown-${tooth.number}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={`veneer-${tooth.number}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ccfbf1" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
          <linearGradient id={`implant-${tooth.number}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <radialGradient id={`caries-${tooth.number}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Root structure */}
        {(hasRootCanal || isImplant) && !isMissing && (
          <g>
            <path
              d={rootPath}
              fill="none"
              stroke={hasRootCanal ? "#2563eb" : "#64748b"}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {hasRootCanal && (
              <circle cx="14" cy="44" r="2" fill="#2563eb" opacity="0.6" />
            )}
          </g>
        )}

        {/* Main tooth body */}
        <path
          d={path}
          fill={
            isImplant
              ? `url(#implant-${tooth.number})`
              : hasCrown
              ? `url(#crown-${tooth.number})`
              : hasVeneer
              ? `url(#veneer-${tooth.number})`
              : baseFill
          }
          stroke={baseStroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* Occlusal detail for posterior teeth */}
        {occlusalPath && !isMissing && (
          <path
            d={occlusalPath}
            fill="none"
            stroke={baseStroke}
            strokeWidth="0.9"
            opacity="0.6"
          />
        )}

        {/* Caries overlay */}
        {hasCaries && !isMissing && (
          <>
            <circle cx="14" cy="18" r="5" fill={`url(#caries-${tooth.number})`} />
            <circle cx="14" cy="18" r="3" fill="#dc2626" opacity="0.5" />
          </>
        )}

        {/* Fracture line */}
        {hasFracture && !isMissing && (
          <path
            d="M 8,12 L 12,20 L 10,28 L 16,34"
            fill="none"
            stroke="#be123c"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 2"
          />
        )}

        {/* Bridge connector lines */}
        {hasBridge && !isMissing && (
          <>
            <line x1="0" y1="14" x2="6" y2="14" stroke="#d97706" strokeWidth="2.5" />
            <line x1="22" y1="14" x2="28" y2="14" stroke="#d97706" strokeWidth="2.5" />
          </>
        )}

        {/* Extraction planned X mark */}
        {extractionPlanned && !isMissing && (
          <g opacity="0.7">
            <line x1="6" y1="10" x2="22" y2="38" stroke="#c2410c" strokeWidth="1.5" />
            <line x1="22" y1="10" x2="6" y2="38" stroke="#c2410c" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* Selected indicator */}
      {selected && (
        <motion.div
          layoutId="tooth-selection"
          className="absolute -bottom-0.5 w-6 h-1 rounded-full bg-blue-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
}
