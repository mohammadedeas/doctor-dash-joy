import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warn" | "destructive" | "info" | "purple" | "neutral";

export const TONE_STYLES: Record<BadgeTone, { bg: string; text: string; border: string; dot: string }> = {
  success: { bg: "bg-success-soft", text: "text-success", border: "border-success/20", dot: "bg-success" },
  warn: { bg: "bg-warn-soft", text: "text-warn", border: "border-warn/20", dot: "bg-warn" },
  destructive: { bg: "bg-destructive-soft", text: "text-destructive", border: "border-destructive/20", dot: "bg-destructive" },
  info: { bg: "bg-info-soft", text: "text-info", border: "border-info/20", dot: "bg-info" },
  purple: { bg: "bg-purple-soft", text: "text-purple", border: "border-purple/20", dot: "bg-purple" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" },
};

export function toneTextClass(tone: BadgeTone): string {
  return TONE_STYLES[tone].text;
}

export function toneDotClass(tone: BadgeTone): string {
  return TONE_STYLES[tone].dot;
}

const TONE_CSS_VAR: Record<BadgeTone, string> = {
  success: "var(--success)",
  warn: "var(--warn)",
  destructive: "var(--destructive)",
  info: "var(--info)",
  purple: "var(--purple)",
  neutral: "var(--muted-foreground)",
};

/** A literal CSS color value for a tone, for contexts that need a raw color (e.g. inline SVG/style props). */
export function toneCssVar(tone: BadgeTone): string {
  return TONE_CSS_VAR[tone];
}

interface StatusBadgeProps {
  tone: BadgeTone;
  /** Show a leading colored dot + border, for chips that represent a state within a list (e.g. treatment status). */
  dot?: boolean;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ tone, dot = false, size = "md", children, className }: StatusBadgeProps) {
  const t = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "gap-1 px-1.5 py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-0.5 text-[11px]",
        t.bg,
        t.text,
        dot && cn("border", t.border),
        className
      )}
    >
      {dot && <span className={cn("rounded-full shrink-0", size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5", t.dot)} />}
      {children}
    </span>
  );
}
