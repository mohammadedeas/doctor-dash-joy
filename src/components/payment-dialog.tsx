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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinic } from "@/lib/clinic-store";
import type { PaymentMethod } from "@/lib/clinic-types";
import { fmtDate, fmtMoney, patientStats, todayISO, visitPaymentStatus } from "@/lib/clinic-utils";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId?: string | null;
  defaultPatientId?: string | null;
};

const NONE_VISIT = "__none__";
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "Insurance", "Other"];

export function PaymentDialog({ open, onOpenChange, paymentId, defaultPatientId }: Props) {
  const { state, upsertPayment, deletePayment } = useClinic();
  const currency = state.settings.currency;
  const existing = paymentId
    ? state.payments.find((p) => p.id === paymentId) ?? null
    : null;

  const sortedPatients = useMemo(
    () => [...state.patients].sort((a, b) => a.name.localeCompare(b.name)),
    [state.patients]
  );

  const [patientId, setPatientId] = useState("");
  const [visitId, setVisitId] = useState<string>(NONE_VISIT);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setPatientId(existing.patientId);
      setVisitId(existing.visitId || NONE_VISIT);
      setAmount(String(existing.amount));
      setMethod(existing.method);
      setDate(existing.date);
      setNotes(existing.notes || "");
    } else {
      setPatientId(defaultPatientId || "");
      setVisitId(NONE_VISIT);
      setAmount("");
      setMethod("Cash");
      setDate(todayISO());
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentId, defaultPatientId]);

  const patientVisits = useMemo(
    () =>
      state.visits
        .filter((v) => v.patientId === patientId)
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [state.visits, patientId]
  );

  function save() {
    if (!patientId) return toast.error("Please select a patient");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Amount must be greater than 0");
    if (!date) return toast.error("Please pick a date");

    upsertPayment({
      id: existing?.id,
      patientId,
      visitId: visitId === NONE_VISIT ? null : visitId,
      date,
      amount: amt,
      method,
      notes: notes.trim(),
    });
    toast.success(existing ? "Payment updated" : "Payment added");
    onOpenChange(false);
  }

  async function onDelete() {
    if (!existing) return;
    const ok = await confirmDialog({
      title: "Delete this payment?",
      description: "This cannot be undone.",
      destructive: true,
      confirmLabel: "Delete payment",
    });
    if (!ok) return;
    deletePayment(existing.id);
    toast.success("Payment deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Payment" : "New Payment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select value={patientId} onValueChange={(v) => { setPatientId(v); setVisitId(NONE_VISIT); }}>
              <SelectTrigger>
                <SelectValue placeholder="— Select patient —" />
              </SelectTrigger>
              <SelectContent>
                {sortedPatients.map((p) => {
                  const bal = patientStats(state, p.id).balance;
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {bal > 0 ? ` — Balance: ${fmtMoney(bal, currency)}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Link to visit (optional)</Label>
            <Select value={visitId} onValueChange={setVisitId} disabled={!patientId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VISIT}>
                  — General payment —
                </SelectItem>
                {patientVisits.map((v) => {
                  const status = visitPaymentStatus(state, v);
                  const remaining = (v.totalCost || 0) - status.paid;
                  return (
                    <SelectItem key={v.id} value={v.id}>
                      {fmtDate(v.date)} — {fmtMoney(v.totalCost, currency)} ({status.label}
                      {remaining > 0 ? `, ${fmtMoney(remaining, currency)} due` : ""})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
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
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
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
            <Button onClick={save}>{existing ? "Save" : "Add Payment"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
