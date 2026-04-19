import { useEffect, useState } from "react";
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
import type { Patient } from "@/lib/clinic-types";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string | null;
  onSaved?: (id: string) => void;
};

const empty = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  gender: "" as Patient["gender"],
  address: "",
  medicalNotes: "",
};

export function PatientDialog({ open, onOpenChange, patientId, onSaved }: Props) {
  const { state, upsertPatient, deletePatient } = useClinic();
  const existing = patientId
    ? state.patients.find((p) => p.id === patientId) ?? null
    : null;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      existing
        ? {
            name: existing.name,
            phone: existing.phone || "",
            email: existing.email || "",
            dob: existing.dob || "",
            gender: existing.gender || "",
            address: existing.address || "",
            medicalNotes: existing.medicalNotes || "",
          }
        : empty
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId]);

  function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const saved = upsertPatient({
      id: existing?.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dob: form.dob,
      gender: form.gender,
      address: form.address.trim(),
      medicalNotes: form.medicalNotes.trim(),
    });
    toast.success(existing ? "Patient updated" : "Patient added");
    onOpenChange(false);
    onSaved?.(saved.id);
  }

  async function onDelete() {
    if (!existing) return;
    const visits = state.visits.filter((v) => v.patientId === existing.id).length;
    const payments = state.payments.filter((p) => p.patientId === existing.id).length;
    const ok = await confirmDialog({
      title: `Delete ${existing.name}?`,
      description: `This will also remove ${visits} visit(s) and ${payments} payment(s). This cannot be undone.`,
      destructive: true,
      confirmLabel: "Delete patient",
    });
    if (!ok) return;
    deletePatient(existing.id);
    toast.success("Patient deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Patient" : "New Patient"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name *</Label>
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={form.gender || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, gender: v === "none" ? "" : (v as Patient["gender"]) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Medical notes / Allergies</Label>
            <Textarea
              rows={3}
              value={form.medicalNotes}
              onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
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
            <Button onClick={save}>{existing ? "Save" : "Add Patient"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
