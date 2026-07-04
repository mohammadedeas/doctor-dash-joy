import { useEffect, useMemo, useState, useCallback } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/lib/clinic-store";
import type { PaymentMethod, Procedure, ToothTreatment } from "@/lib/clinic-types";
import { fmtMoney, todayISO } from "@/lib/clinic-utils";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { TreatmentDentalChart } from "@/components/dental/TreatmentDentalChart";
import { TREATMENT_STATUS_CONFIG, TREATMENT_PROCEDURES, TREATMENT_STATUS_LIST } from "@/components/dental/treatment-constants";
import { StatusBadge, toneDotClass } from "@/components/status-badge";
import { Trash2, Plus, Stethoscope, FileText, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api-client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId?: string | null;
  defaultPatientId?: string | null;
};

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "Insurance", "Other"];

const TOOTH_GROUPS = [
  { label: "Upper Right", teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  { label: "Upper Left", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { label: "Lower Left", teeth: [38, 37, 36, 35, 34, 33, 32, 31] },
  { label: "Lower Right", teeth: [41, 42, 43, 44, 45, 46, 47, 48] },
];

const VALID_TEETH = TOOTH_GROUPS.flatMap((g) => g.teeth);

export function VisitDialog({ open, onOpenChange, visitId, defaultPatientId }: Props) {
  const { state, deleteVisit, refreshState } = useClinic();
  const currency = state.settings.currency;
  const existing = visitId ? state.visits.find((v) => v.id === visitId) ?? null : null;
  const existingTreatments = visitId
    ? state.toothTreatments.filter((t) => t.visitId === visitId)
    : [];

  const sortedPatients = useMemo(
    () => [...state.patients].sort((a, b) => a.name.localeCompare(b.name)),
    [state.patients]
  );

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [procs, setProcs] = useState<Procedure[]>([]);
  const [toothTreatments, setToothTreatments] = useState<ToothTreatment[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [adding, setAdding] = useState(false);

  // Inline form state
  const [toothNumber, setToothNumber] = useState<string>("");
  const [procedure, setProcedure] = useState<string>("");
  const [status, setStatus] = useState<string>("Planned");
  const [treatNotes, setTreatNotes] = useState("");
  const [cost, setCost] = useState<string>("");

  const [quickProc, setQuickProc] = useState<string>("");
  const [markPaid, setMarkPaid] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("Cash");
  const [payDate, setPayDate] = useState(todayISO());
  const [payAmountTouched, setPayAmountTouched] = useState(false);
  const [activeTab, setActiveTab] = useState("treatments");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setPatientId(existing.patientId);
      setDate(existing.date);
      setNotes(existing.notes || "");
      setProcs(existing.procedures.map((p) => ({ ...p })));
      setToothTreatments(existingTreatments.map((t) => ({ ...t })));
    } else {
      setPatientId(defaultPatientId || "");
      setDate(todayISO());
      setNotes("");
      setProcs([]);
      setToothTreatments([]);
    }
    setShowChart(false);
    setAdding(false);
    resetForm();
    setMarkPaid(false);
    setPayAmount("");
    setPayMethod("Cash");
    setPayDate(todayISO());
    setPayAmountTouched(false);
    setActiveTab("treatments");
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visitId, defaultPatientId]);

  const toothTotal = toothTreatments.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  const procTotal = procs.reduce((s, p) => s + (Number(p.cost) || 0), 0);
  const total = toothTotal + procTotal;

  useEffect(() => {
    if (markPaid && !payAmountTouched) setPayAmount(String(total));
  }, [markPaid, total, payAmountTouched]);

  function resetForm() {
    setToothNumber("");
    setProcedure("");
    setStatus("Planned");
    setTreatNotes("");
    setCost("");
  }

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

  const handleAddToothTreatment = useCallback(
    (treatment: Omit<ToothTreatment, "id" | "createdAt">) => {
      const newTreatment: ToothTreatment = {
        ...treatment,
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      };
      setToothTreatments((prev) => [...prev, newTreatment]);
    },
    []
  );

  const handleDeleteToothTreatment = useCallback((id: string) => {
    setToothTreatments((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUpdateToothTreatment = useCallback(
    (id: string, patch: Partial<ToothTreatment>) => {
      setToothTreatments((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    []
  );

  function submitInlineTreatment() {
    const num = parseInt(toothNumber, 10);
    if (!num || !VALID_TEETH.includes(num)) {
      toast.error("Please select a valid tooth number (11-18, 21-28, 31-38, 41-48)");
      return;
    }
    if (!procedure) {
      toast.error("Please select a procedure");
      return;
    }
    handleAddToothTreatment({
      patientId: patientId || "",
      visitId: existing?.id || "",
      toothNumber: num,
      procedure,
      status: status as any,
      notes: treatNotes.trim(),
      cost: parseFloat(cost) || 0,
      doctorName: "",
    });
    resetForm();
    setAdding(false);
  }

  async function save() {
    if (!patientId) return toast.error("Please select a patient");
    if (!date) return toast.error("Please pick a date");
    const procedures = procs.filter((p) => p.name.trim());
    const totalCost = total;

    setSaving(true);
    try {
      let savedVisit = existing;

      if (existing) {
        await api.updateVisit(existing.id, {
          patientId,
          date,
          procedures,
          totalCost,
          notes: notes.trim(),
        });
        savedVisit = existing;

        // Diff-sync tooth treatments instead of delete-all-recreate
        const existingIds = new Set(existingTreatments.map((t) => t.id));
        const newIds = new Set(toothTreatments.map((t) => t.id));

        // Delete removed treatments
        for (const t of existingTreatments) {
          if (!newIds.has(t.id)) {
            await api.deleteToothTreatment(t.id);
          }
        }

        // Create new or update existing
        for (const t of toothTreatments) {
          if (t.id.startsWith("temp-")) {
            await api.createToothTreatment({
              patientId,
              visitId: existing.id,
              toothNumber: t.toothNumber,
              procedure: t.procedure,
              status: t.status,
              notes: t.notes,
              cost: t.cost,
              doctorName: t.doctorName,
            });
          } else if (existingIds.has(t.id)) {
            await api.updateToothTreatment(t.id, {
              toothNumber: t.toothNumber,
              procedure: t.procedure,
              status: t.status,
              notes: t.notes,
              cost: t.cost,
              doctorName: t.doctorName,
            });
          }
        }
      } else {
        savedVisit = await api.createVisit({
          patientId,
          date,
          procedures,
          totalCost,
          notes: notes.trim(),
        });

        if (savedVisit) {
          for (const t of toothTreatments) {
            await api.createToothTreatment({
              patientId,
              visitId: savedVisit.id,
              toothNumber: t.toothNumber,
              procedure: t.procedure,
              status: t.status,
              notes: t.notes,
              cost: t.cost,
              doctorName: t.doctorName,
            });
          }
        }
      }

      if (!existing && markPaid) {
        const amt = parseFloat(payAmount) || 0;
        if (amt > 0 && savedVisit) {
          await api.createPayment({
            patientId,
            visitId: savedVisit.id,
            date: payDate || todayISO(),
            amount: amt,
            method: payMethod,
            notes: "",
          });
        }
      }

      await refreshState();
      toast.success(existing ? "Visit updated" : "Visit added");
      onOpenChange(false);
    } catch (err) {
      console.error("Save visit failed:", err);
      toast.error("Failed to save visit");
    } finally {
      setSaving(false);
    }
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
    // cascade delete via backend
    await api.deleteVisit(existing.id);
    await refreshState();
    toast.success("Visit deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[95vh] overflow-y-auto transition-[max-width] duration-200",
          showChart ? "max-w-5xl" : "max-w-3xl"
        )}
      >
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Visit" : "New Visit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId} disabled={!!existing}>
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
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="treatments">
                <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                Tooth Treatments
                {toothTreatments.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {toothTreatments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="procedures">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                General Procedures
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* ── Tooth Treatments Tab ── */}
            <TabsContent value="treatments" className="mt-3 space-y-4">
              {!patientId && (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-sm">Select a patient to add treatments</p>
                </div>
              )}

              {patientId && (
                <>
                  {/* Optional dental chart toggle */}
                  {!showChart && (
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => setShowChart(true)}
                      >
                        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                        Open Dental Chart
                      </Button>
                    </div>
                  )}

                  {showChart && (
                    <div className="relative">
                      <div className="flex items-center justify-end mb-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => setShowChart(false)}
                        >
                          Close Dental Chart
                        </Button>
                      </div>
                      <TreatmentDentalChart
                        patientId={patientId}
                        visitId={existing?.id}
                        treatments={toothTreatments}
                        onAddTreatment={handleAddToothTreatment}
                        onUpdateTreatment={handleUpdateToothTreatment}
                        onDeleteTreatment={handleDeleteToothTreatment}
                      />
                    </div>
                  )}

                  {/* Treatment table */}
                  {toothTreatments.length > 0 && (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <Th>Tooth</Th>
                            <Th>Procedure</Th>
                            <Th>Status</Th>
                            <Th>Notes</Th>
                            <Th className="text-right">Cost</Th>
                            <Th className="w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {toothTreatments.map((t) => {
                            const cfg = TREATMENT_STATUS_CONFIG[t.status];
                            return (
                              <tr key={t.id}>
                                <Td className="font-medium">{t.toothNumber}</Td>
                                <Td>{t.procedure}</Td>
                                <Td>
                                  <StatusBadge tone={cfg.tone} dot>{cfg.label}</StatusBadge>
                                </Td>
                                <Td className="text-muted-foreground max-w-[140px] truncate">{t.notes || "—"}</Td>
                                <Td className="text-right">{fmtMoney(t.cost || 0, currency)}</Td>
                                <Td className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleDeleteToothTreatment(t.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </Td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Inline add form */}
                  {adding && (
                    <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tooth *</Label>
                          <Select value={toothNumber} onValueChange={setToothNumber}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {TOOTH_GROUPS.map((group) => (
                                <SelectGroup key={group.label}>
                                  <SelectLabel className="text-[11px]">{group.label}</SelectLabel>
                                  {group.teeth.map((t) => (
                                    <SelectItem key={t} value={String(t)}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-xs">Procedure *</Label>
                          <Select value={procedure} onValueChange={setProcedure}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {TREATMENT_PROCEDURES.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TREATMENT_STATUS_LIST.map((s) => {
                                const cfg = TREATMENT_STATUS_CONFIG[s];
                                return (
                                  <SelectItem key={s} value={s}>
                                    <span className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", toneDotClass(cfg.tone))} />
                                      {s}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Clinical Notes</Label>
                          <Textarea
                            rows={2}
                            placeholder="Notes..."
                            value={treatNotes}
                            onChange={(e) => setTreatNotes(e.target.value)}
                            className="text-sm resize-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Cost</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setAdding(false); resetForm(); }}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" className="flex-1" onClick={submitInlineTreatment}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Treatment
                        </Button>
                      </div>
                    </div>
                  )}

                  {!adding && (
                    <Button type="button" variant="outline" className="w-full" onClick={() => setAdding(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      {toothTreatments.length === 0 ? "Add Treatment" : "Add Another Tooth"}
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── General Procedures Tab ── */}
            <TabsContent value="procedures" className="mt-3 space-y-4">
              <div className="space-y-2">
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
                  <Button type="button" variant="outline" size="sm" onClick={addCustomProc}>
                    <Plus className="size-3.5" /> Custom
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {procs.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No general procedures added yet.</p>
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
                          onChange={(e) => updateProc(i, { cost: parseFloat(e.target.value) || 0 })}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProc(i)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Notes Tab ── */}
            <TabsContent value="notes" className="mt-3">
              <Textarea rows={4} placeholder="Enter visit notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </TabsContent>
          </Tabs>

          {/* Total */}
          <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Total cost</span>
              {toothTotal > 0 && procTotal > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({fmtMoney(toothTotal, currency)} treatments + {fmtMoney(procTotal, currency)} procedures)
                </span>
              )}
            </div>
            <span className="text-lg font-semibold text-primary">{fmtMoney(total, currency)}</span>
          </div>

          {/* Payment */}
          {!existing && (
            <div className="border-t pt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={markPaid} onCheckedChange={(v) => setMarkPaid(!!v)} />
                Add a payment for this visit now
              </label>
              {markPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" value={payAmount} onChange={(e) => { setPayAmount(e.target.value); setPayAmountTouched(true); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {existing && (
              <Button variant="destructive" onClick={onDelete} disabled={saving}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !patientId || !date}>
              {saving ? "Saving..." : existing ? "Save" : "Add Visit"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-medium text-xs ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-sm ${className}`}>{children}</td>;
}
