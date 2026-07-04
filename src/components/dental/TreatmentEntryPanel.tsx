import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Save, Trash2, Plus, Pencil } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ToothTreatment, TreatmentStatus } from "@/lib/clinic-types";
import type { ToothMeta } from "./constants";
import {
  TREATMENT_PROCEDURES,
  TREATMENT_STATUS_LIST,
  TREATMENT_STATUS_CONFIG,
} from "./treatment-constants";
import { TONE_STYLES } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface TreatmentEntryPanelProps {
  tooth: ToothMeta;
  existingTreatments: ToothTreatment[];
  onSave: (treatment: Omit<ToothTreatment, "id" | "createdAt">) => void;
  onUpdate: (id: string, treatment: Partial<ToothTreatment>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  defaultDoctorName?: string;
}

export function TreatmentEntryPanel({
  tooth,
  existingTreatments,
  onSave,
  onUpdate,
  onDelete,
  onClose,
  defaultDoctorName = "",
}: TreatmentEntryPanelProps) {
  const [procedure, setProcedure] = useState<string>("");
  const [status, setStatus] = useState<TreatmentStatus>("Planned");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setProcedure("");
    setStatus("Planned");
    setNotes("");
    setCost("");
    setEditingId(null);
  }, []);

  const handleSave = () => {
    if (!procedure.trim()) return;
    onSave({
      patientId: "",
      visitId: "",
      toothNumber: tooth.number,
      procedure: procedure.trim(),
      status,
      notes: notes.trim(),
      cost: parseFloat(cost) || 0,
      doctorName: defaultDoctorName,
    });
    resetForm();
  };

  const startEdit = (t: ToothTreatment) => {
    setProcedure(t.procedure);
    setStatus(t.status);
    setNotes(t.notes || "");
    setCost(t.cost ? String(t.cost) : "");
    setEditingId(t.id);
  };

  const handleUpdate = () => {
    if (!editingId || !procedure.trim()) return;
    onUpdate(editingId, {
      procedure: procedure.trim(),
      status,
      notes: notes.trim(),
      cost: parseFloat(cost) || 0,
    });
    resetForm();
  };

  const toothTreatments = existingTreatments.filter(
    (t) => t.toothNumber === tooth.number
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20">
            {tooth.iso}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-card-foreground">{tooth.name}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {tooth.type} · {tooth.jaw} {tooth.side}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Existing treatments for this tooth */}
          {toothTreatments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Existing treatments on this tooth
              </Label>
              <div className="space-y-2">
                {toothTreatments.map((t) => {
                  const cfg = TREATMENT_STATUS_CONFIG[t.status];
                  const tone = TONE_STYLES[cfg.tone];
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-start justify-between p-3 rounded-xl border text-sm",
                        tone.bg,
                        tone.border
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", tone.dot)} />
                          <span className="font-medium text-foreground truncate">{t.procedure}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[11px] font-medium", tone.text)}>{cfg.label}</span>
                          {t.cost ? <span className="text-[11px] text-muted-foreground">· {t.cost}</span> : null}
                        </div>
                        {t.notes && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEdit(t)}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => onDelete(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {editingId ? "Edit Treatment" : "Add New Treatment"}
            </Label>

            <div className="space-y-1.5">
              <Label className="text-xs">Procedure *</Label>
              <Select value={procedure} onValueChange={setProcedure}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select procedure..." />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TreatmentStatus)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_STATUS_LIST.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", TONE_STYLES[TREATMENT_STATUS_CONFIG[s].tone].dot)} />
                          {s}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-1.5">
              <Label className="text-xs">Clinical Notes</Label>
              <Textarea
                rows={3}
                placeholder="Enter clinical observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleUpdate}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Update
                  </Button>
                </>
              ) : (
                <Button size="sm" className="w-full" onClick={handleSave}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Treatment
                </Button>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
      </div>
    </motion.div>
  );
}
