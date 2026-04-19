import { cn } from "@/lib/utils";
import { initials } from "@/lib/clinic-utils";

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-full bg-primary-soft text-primary font-semibold flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size / 3) }}
    >
      {initials(name)}
    </div>
  );
}
