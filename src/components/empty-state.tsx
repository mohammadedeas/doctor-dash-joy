import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  desc: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const PADDING = { sm: "py-10", md: "py-12", lg: "py-16" };

export function EmptyState({ title, desc, icon, size = "md" }: EmptyStateProps) {
  return (
    <div className={`text-center px-4 ${PADDING[size]}`}>
      {icon && (
        <div
          className={`mx-auto ${size === "lg" ? "size-12" : "size-10"} rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground`}
        >
          {icon}
        </div>
      )}
      <h4 className="font-medium text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}
