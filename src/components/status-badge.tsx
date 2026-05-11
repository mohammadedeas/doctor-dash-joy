import { cn } from "@/lib/utils";

type Variant = "paid" | "partial" | "unpaid" | "info";

const styles: Record<Variant, string> = {
  paid: "bg-primary-soft text-primary",
  partial: "bg-warn-soft text-warn",
  unpaid: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
};

export function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
