import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinic } from "@/lib/clinic-store";
import type { PaymentMethod, Procedure } from "@/lib/clinic-types";
import { fmtMoney, todayISO } from "@/lib/clinic-utils";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { Trash2, Plus } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId?: string | null;
  defaultPatientId?: string | null;
};

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "Insurance", "Other"];

export function VisitDialog({ open, onOpenChange, visitId, defaultPatientId }: Props) {
  const { state, upsertVisit, deleteVisit, upsertPayment } = useClinic();
  const currency = state.settings.currency;
  const existing = visitId ? state.visits.find((v) => v.id === visitId) ?? null : null;

  const sortedPatients = useMemo(
    () => [...state.patients].sort((a, b) => a.name.localeCompare(b.name)),
    [state.patients]
  );

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [procs, setProcs] = useState<Procedure[]>([]);
  const [quickProc, setQuickProc] = useState<string>("");
  const [markPaid, setMarkPaid] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("Cash");
  const [payDate, setPayDate] = useState(todayISO());
  const [payAmountTouched, setPayAmountTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setPatientId(existing.patientId);
      setDate(existing.date);
      setNotes(existing.notes || "");
      setProcs(existing.procedures.map((p) => ({ ...p })));
    } else {
      setPatientId(defaultPatientId || "");
      setDate(todayISO());
      setNotes("");
      setProcs([]);
    }
    setMarkPaid(false);
    setPayAmount("");
    setPayMethod("Cash");
    setPayDate(todayISO());
    setPayAmountTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visitId, defaultPatientId]);

  const total = procs.reduce((s, p) => s + (Number(p.cost) || 0), 0);

  useEffect(() => {
    if (markPaid && !payAmountTouched) setPayAmount(String(total));
  }, [markPaid, total, payAmountTouched]);

  function addQuickProc() {
    if (quickProc === "") return;
    const p = state.settings.commonProcedures[Number(quickProc)];
    if (!p) return;
    setProcs([...procs, { name: p.name, cost: p.cost }]);
    setQuickProc("");
  }
  function addCustomProc() {
    setProcs([...procs, { name: "", cost: 0 }]);
  }
  function updateProc(i: number, patch: Partial<Procedure>) {
    setProcs(procs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function removeProc(i: number) {
    setProcs(procs.filter((_, idx) => idx !== i));
  }

  function save() {
    if (!patientId) return toast.error("Please select a patient");
    if (!date) return toast.error("Please pick a date");
    const procedures = procs.filter((p) => p.name.trim());
    const totalCost = procedures.reduce((s, p) => s + (Number(p.cost) || 0), 0);

    const saved = upsertVisit({
      id: existing?.id,
      patientId,
      date,
      procedures,
      totalCost,
      notes: notes.trim(),
    });

    if (!existing && markPaid) {
      const amt = parseFloat(payAmount) || 0;
      if (amt > 0) {
        upsertPayment({
          patientId,
          visitId: saved.id,
          date: payDate || todayISO(),
          amount: amt,
          method: payMethod,
          notes: "",
        });
      }
    }
    toast.success(existing ? "Visit updated" : "Visit added");
    onOpenChange(false);
  }

  async function onDelete() {
    if (!existing) return;
    const linked = state.payments.filter((p) => p.visitId === existing.id).length;
    const ok = await confirmDialog({
      title: "Delete this visit?",
      description: `${linked > 0 ? `${linked} linked payment(s) will also be removed. ` : ""}This cannot be undone.`,
      destructive: true,
      confirmLabel: "Delete visit",
    });
    if (!ok) return;
    deleteVisit(existing.id);
    toast.success("Visit deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Visit" : "New Visit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select
                value={patientId}
                onValueChange={setPatientId}
                disabled={!!existing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="— Select patient —" />
                </SelectTrigger>
                <SelectContent>
                  {sortedPatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Visit date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Procedures</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={quickProc} onValueChange={setQuickProc}>
                <SelectTrigger className="w-auto min-w-[220px]">
                  <SelectValue placeholder="+ Add common procedure..." />
                </SelectTrigger>
                <SelectContent>
                  {state.settings.commonProcedures.map((p, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {p.name} — {fmtMoney(p.cost, currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={addQuickProc}>
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomProc}
              >
                <Plus className="size-3.5" /> Custom
              </Button>
            </div>
            <div className="space-y-1.5">
              {procs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No procedures added yet.
                </p>
              ) : (
                procs.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Procedure name"
                      value={p.name}
                      onChange={(e) => updateProc(i, { name: e.target.value })}
                      className="flex-[2]"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={p.cost}
                      onChange={(e) =>
                        updateProc(i, { cost: parseFloat(e.target.value) || 0 })
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProc(i)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
            <span className="font-medium">Total cost</span>
            <span className="text-lg font-semibold text-primary">
              {fmtMoney(total, currency)}
            </span>
          </div>

          {!existing && (
            <div className="border-t pt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={markPaid}
                  onCheckedChange={(v) => setMarkPaid(!!v)}
                />
                Add a payment for this visit now
              </label>
              {markPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => {
                        setPayAmount(e.target.value);
                        setPayAmountTouched(true);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Select
                      value={payMethod}
                      onValueChange={(v) => setPayMethod(v as PaymentMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {existing && (
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{existing ? "Save" : "Add Visit"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
