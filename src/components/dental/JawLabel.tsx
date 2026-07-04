export function JawLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="h-px flex-1 max-w-[80px] bg-border" />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="h-px flex-1 max-w-[80px] bg-border" />
    </div>
  );
}
