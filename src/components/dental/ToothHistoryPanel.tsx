import { motion } from "framer-motion";
import { Calendar, User, Stethoscope, Image as ImageIcon, FileText } from "lucide-react";
import type { ToothHistoryEntry } from "./types";
import { cn } from "@/lib/utils";

interface ToothHistoryPanelProps {
  history: ToothHistoryEntry[];
  className?: string;
}

const TYPE_CONFIG: Record<
  ToothHistoryEntry["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  visit: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  xray: { icon: ImageIcon, color: "text-purple-600", bg: "bg-purple-50" },
  procedure: { icon: Stethoscope, color: "text-emerald-600", bg: "bg-emerald-50" },
  note: { icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
};

export function ToothHistoryPanel({ history, className }: ToothHistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-xs text-muted-foreground">No history entries for this tooth</p>
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((entry, idx) => {
        const config = TYPE_CONFIG[entry.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                config.bg
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground truncate">{entry.title}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
              {entry.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {entry.description}
                </p>
              )}
              {entry.performedBy && (
                <div className="flex items-center gap-1 mt-1">
                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{entry.performedBy}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
