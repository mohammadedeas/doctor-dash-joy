import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
};

let openFn: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!openFn) return Promise.resolve(window.confirm(opts.title));
  return openFn(opts);
}

export function ConfirmDialogHost() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  openFn = (o) =>
    new Promise<boolean>((resolve) => {
      setOpts(o);
      setResolver(() => resolve);
    });

  const close = (v: boolean) => {
    resolver?.(v);
    setResolver(null);
    setOpts(null);
  };

  return (
    <Dialog open={!!opts} onOpenChange={(o) => !o && close(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{opts?.title}</DialogTitle>
        </DialogHeader>
        {opts?.description && (
          <div className="text-sm text-muted-foreground">{opts.description}</div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={opts?.destructive ? "destructive" : "default"}
            onClick={() => close(true)}
          >
            {opts?.confirmLabel || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
