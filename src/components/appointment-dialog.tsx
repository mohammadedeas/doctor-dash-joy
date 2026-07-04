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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/lib/clinic-store";
import type { Appointment, AppointmentStatus, AppointmentPaymentStatus } from "@/lib/clinic-types";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId?: string | null;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
};

const STATUSES: AppointmentStatus[] = ["confirmed", "pending", "cancelled", "completed"];
const PAYMENT_STATUSES: AppointmentPaymentStatus[] = ["paid", "partial", "unpaid"];

export function AppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: Props) {
  const { state, upsertAppointment, deleteAppointment } = useClinic();
  const existing = appointmentId
    ? state.appointments.find((a) => a.id === appointmentId) ?? null
    : null;

  const sortedPatients = useMemo(
    () => [...state.patients].sort((a, b) => a.name.localeCompare(b.name)),
    [state.patients]
  );

  const dentists = useMemo(() => {
    const set = new Set(state.appointments.map((a) => a.dentistName).filter(Boolean));
    return Array.from(set);
  }, [state.appointments]);

  const [patientId, setPatientId] = useState("");
  const [phone, setPhone] = useState("");
  const [visitType, setVisitType] = useState("");
  const [dentistName, setDentistName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<AppointmentPaymentStatus>("unpaid");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setPatientId(existing.patientId);
      setPhone(existing.phone || "");
      setVisitType(existing.visitType);
      setDentistName(existing.dentistName);
      setDate(existing.date);
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setStatus(existing.status);
      setPaymentStatus(existing.paymentStatus);
      setNotes(existing.notes || "");
    } else {
      setPatientId("");
      setPhone("");
      setVisitType("");
      setDentistName("");
      setDate(defaultDate || "");
      setStartTime(defaultStartTime || "09:00");
      setEndTime(defaultEndTime || "10:00");
      setStatus("pending");
      setPaymentStatus("unpaid");
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  useEffect(() => {
    if (!patientId) return;
    const p = state.patients.find((x) => x.id === patientId);
    if (p) setPhone(p.phone || "");
  }, [patientId, state.patients]);

  function save() {
    if (!patientId) return toast.error("Please select a patient");
    if (!date) return toast.error("Please pick a date");
    if (!startTime || !endTime) return toast.error("Please set start and end times");
    if (startTime >= endTime) return toast.error("End time must be after start time");

    const patient = state.patients.find((p) => p.id === patientId);
    if (!patient) return toast.error("Patient not found");

    upsertAppointment({
      id: existing?.id,
      patientId,
      patientName: patient.name,
      phone: phone.trim(),
      visitType: visitType.trim(),
      dentistName: dentistName.trim(),
      date,
      startTime,
      endTime,
      notes: notes.trim(),
      status,
      paymentStatus,
    });

    toast.success(existing ? "Appointment updated" : "Appointment added");
    onOpenChange(false);
  }

  async function onDelete() {
    if (!existing) return;
    const ok = await confirmDialog({
      title: "Delete appointment?",
      description: `Remove appointment for ${existing.patientName} on ${existing.date} at ${existing.startTime}. This cannot be undone.`,
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    deleteAppointment(existing.id);
    toast.success("Appointment deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="scheduling" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="details">Details &amp; Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduling" className="space-y-4 mt-4">
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
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Visit type</Label>
                <Input
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  placeholder="e.g. Cleaning, Root Canal"
                  list="visit-types"
                />
                <datalist id="visit-types">
                  {state.settings.commonProcedures.map((p) => (
                    <option key={p.name} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Dentist</Label>
                <Input
                  value={dentistName}
                  onChange={(e) => setDentistName(e.target.value)}
                  placeholder="Dr. Name"
                  list="dentists"
                />
                <datalist id="dentists">
                  {dentists.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Start *</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End *</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="capitalize">{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as AppointmentPaymentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="capitalize">{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

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
            <Button onClick={save}>{existing ? "Save" : "Add Appointment"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
