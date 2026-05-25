import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Droplets, Move } from "lucide-react";
import type { PerioSurfaceData, Surface, ToothType } from "./types";
import { getPocketDepthColor, getPocketDepthBg, getPocketDepthSolidBg } from "./constants";
import { PERIO_SURFACE_LABELS } from "./types";
import { cn } from "@/lib/utils";

interface PerioPanelProps {
  data: PerioSurfaceData[];
  toothType: ToothType;
  onChange: (data: PerioSurfaceData[]) => void;
}

const SURFACES: Surface[] = [
  "mesioBuccal",
  "buccal",
  "distoBuccal",
  "mesioPalatal",
  "palatal",
  "distoPalatal",
];

function getDefaultSurfaceData(surface: Surface): PerioSurfaceData {
  return {
    surface,
    measurements: {
      pocketDepth: undefined,
      recession: undefined,
      bleedingOnProbing: false,
      plaque: false,
      furcation: null,
      mobility: null,
    },
  };
}

export function PerioPanel({ data, toothType, onChange }: PerioPanelProps) {
  const [activeSurface, setActiveSurface] = useState<Surface>("buccal");

  const surfaceMap = useMemo(() => {
    const map: Record<string, PerioSurfaceData> = {};
    for (const s of SURFACES) {
      const existing = data.find((d) => d.surface === s);
      map[s] = existing || getDefaultSurfaceData(s);
    }
    return map;
  }, [data]);

  const updateSurface = useCallback(
    (surface: Surface, patch: Partial<PerioSurfaceData["measurements"]>) => {
      const current = surfaceMap[surface];
      const next: PerioSurfaceData = {
        ...current,
        measurements: { ...current.measurements, ...patch },
      };
      const filtered = data.filter((d) => d.surface !== surface);
      onChange([...filtered, next]);
    },
    [data, surfaceMap, onChange]
  );

  const activeData = surfaceMap[activeSurface];
  const depth = activeData.measurements.pocketDepth;

  // Calculate visualization dimensions
  const maxDepth = Math.max(3, depth || 0, 10);
  const healthyLineY = 30 + (3 / maxDepth) * 80;
  const pocketY = depth ? 30 + (depth / maxDepth) * 80 : 30;

  return (
    <div className="space-y-4">
      {/* Visual Perio Graph */}
      <div className="bg-muted/50 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Pocket Depth Visualization
          </h5>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getPocketDepthBg(depth))}>
            {depth !== undefined ? `${depth} mm` : "— mm"}
          </span>
        </div>

        <svg viewBox="0 0 200 140" className="w-full h-32">
          {/* Background zones */}
          <rect x="0" y="30" width="200" height={healthyLineY - 30} className="fill-emerald-500/10 dark:fill-emerald-400/15" />
          <rect x="0" y={healthyLineY} width="200" height={30 + (5 / maxDepth) * 80 - healthyLineY} className="fill-amber-500/10 dark:fill-amber-400/15" />
          <rect x="0" y={30 + (5 / maxDepth) * 80} width="200" height="100" className="fill-red-500/10 dark:fill-red-400/15" />

          {/* Tooth silhouette */}
          <path
            d="M 85,20 Q 100,10 115,20 L 110,30 L 115,35 L 110,50 L 112,70 L 108,90 L 110,110 L 100,125 L 90,110 L 92,90 L 88,70 L 90,50 L 85,35 L 90,30 Z"
            className="fill-muted stroke-border"
            strokeWidth="1"
          />

          {/* Root lines */}
          <line x1="95" y1="110" x2="95" y2="130" className="stroke-border" strokeWidth="1" />
          <line x1="105" y1="110" x2="105" y2="130" className="stroke-border" strokeWidth="1" />

          {/* Gingival margin */}
          <motion.line
            x1="60"
            y1="30"
            x2="140"
            y2="30"
            className="stroke-muted-foreground"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ y1: 30, y2: 30 }}
          />

          {/* Pocket depth line */}
          {depth !== undefined && (
            <motion.line
              x1="70"
              y1={pocketY}
              x2="130"
              y2={pocketY}
              stroke={getPocketDepthColor(depth)}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Pocket fill area */}
          {depth !== undefined && depth > 0 && (
            <motion.rect
              x="70"
              y="30"
              width="60"
              height={pocketY - 30}
              fill={getPocketDepthColor(depth)}
              opacity="0.15"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              style={{ transformOrigin: "top" }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Bleeding indicator */}
          {activeData.measurements.bleedingOnProbing && (
            <motion.circle
              cx="100"
              cy={pocketY}
              r="4"
              fill="#ef4444"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}

          {/* Measurement labels */}
          <text x="10" y="25" className="text-[8px] fill-slate-400 dark:fill-slate-300">Gingival margin</text>
          {depth !== undefined && (
            <text x="145" y={pocketY + 3} className="text-[8px] fill-slate-500 dark:fill-slate-300 font-medium">
              {depth}mm
            </text>
          )}

          {/* Depth scale */}
          {[0, 3, 6, 9].map((mm) => {
            const y = 30 + (mm / maxDepth) * 80;
            return (
              <g key={mm}>
                <line x1="0" y1={y} x2="200" y2={y} className="stroke-border" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x="5" y={y + 3} className="text-[7px] fill-slate-400 dark:fill-slate-300">{mm}mm</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Surface Selector */}
      <div>
        <h5 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
          Probing Surfaces
        </h5>
        <div className="grid grid-cols-3 gap-1.5">
          {SURFACES.map((surface) => {
            const sData = surfaceMap[surface];
            const hasData = sData.measurements.pocketDepth !== undefined;
            const isActive = activeSurface === surface;

            return (
              <button
                key={surface}
                onClick={() => setActiveSurface(surface)}
                className={cn(
                  "relative px-2 py-2 rounded-lg text-[10px] font-medium border transition-all text-left",
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted",
                  hasData && !isActive && "ring-1 ring-emerald-500/20 dark:ring-emerald-400/20"
                )}
              >
                <span className="block truncate">{PERIO_SURFACE_LABELS[surface]}</span>
                {hasData && (
                  <span
                    className={cn(
                      "inline-block mt-0.5 text-[9px] px-1 py-0 rounded",
                      getPocketDepthBg(sData.measurements.pocketDepth)
                    )}
                  >
                    {sData.measurements.pocketDepth}mm
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Measurements for active surface */}
      <motion.div
        key={activeSurface}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 bg-card rounded-xl border border-border p-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            {PERIO_SURFACE_LABELS[activeSurface]}
          </span>
        </div>

        {/* Pocket Depth */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground flex items-center gap-1">
            Pocket Depth (mm)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="15"
              step="1"
              value={activeData.measurements.pocketDepth ?? ""}
              onChange={(e) =>
                updateSurface(activeSurface, {
                  pocketDepth: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-20 px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground"
              placeholder="0"
            />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                <button
                  key={v}
                  onClick={() => updateSurface(activeSurface, { pocketDepth: v })}
                  className={cn(
                    "w-6 h-6 rounded text-[10px] font-medium transition-all",
                    activeData.measurements.pocketDepth === v
                      ? cn("text-white", getPocketDepthSolidBg(v))
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recession */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground">Gingival Recession (mm)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value={activeData.measurements.recession ?? ""}
            onChange={(e) =>
              updateSurface(activeSurface, {
                recession: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="w-20 px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="0"
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-2">
          <ToggleButton
            active={!!activeData.measurements.bleedingOnProbing}
            onClick={() =>
              updateSurface(activeSurface, {
                bleedingOnProbing: !activeData.measurements.bleedingOnProbing,
              })
            }
            icon={<Droplets className="h-3 w-3" />}
            label="BOP"
            activeColor="text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-400/10 border-red-200 dark:border-red-400/30"
          />
          <ToggleButton
            active={!!activeData.measurements.plaque}
            onClick={() =>
              updateSurface(activeSurface, { plaque: !activeData.measurements.plaque })
            }
            icon={<Move className="h-3 w-3" />}
            label="Plaque"
            activeColor="text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/30"
          />
        </div>
      </motion.div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium border transition-all",
        active
          ? cn("shadow-sm", activeColor)
          : "bg-card border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
