import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinic } from "@/lib/clinic-store";
import { defaultClinicState } from "@/lib/clinic-types";
import { todayISO } from "@/lib/clinic-utils";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { Download, Upload, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateSettings, setProcedures, replaceAll, clearAll } = useClinic();
  const [name, setName] = useState(state.settings.clinicName);
  const [currency, setCurrency] = useState(state.settings.currency);
  const fileRef = useRef<HTMLInputElement>(null);

  function saveSettings() {
    updateSettings({
      clinicName: name.trim() || "My Dental Clinic",
      currency: currency.trim() || "ILS",
    });
    toast.success("Settings saved");
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dental-clinic-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  async function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.patients)) throw new Error("Invalid format");
      const ok = await confirmDialog({
        title: "Import backup?",
        description: `This will REPLACE current data with ${data.patients.length} patient(s), ${data.visits?.length || 0} visit(s), ${data.payments?.length || 0} payment(s).`,
        destructive: true,
        confirmLabel: "Replace data",
      });
      if (!ok) return;
      replaceAll({
        patients: data.patients,
        visits: data.visits || [],
        payments: data.payments || [],
        settings: { ...defaultClinicState.settings, ...(data.settings || {}) },
      });
      setName(data.settings?.clinicName ?? defaultClinicState.settings.clinicName);
      setCurrency(data.settings?.currency ?? defaultClinicState.settings.currency);
      toast.success("Data imported");
    } catch {
      toast.error("Import failed: invalid file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onClearAll() {
    const a = await confirmDialog({
      title: "Delete ALL data?",
      description: "This permanently removes all patients, visits and payments.",
      destructive: true,
      confirmLabel: "Yes, delete",
    });
    if (!a) return;
    const b = await confirmDialog({
      title: "Are you absolutely sure?",
      description: "This cannot be undone.",
      destructive: true,
      confirmLabel: "Delete everything",
    });
    if (!b) return;
    clearAll();
    setName(defaultClinicState.settings.clinicName);
    setCurrency(defaultClinicState.settings.currency);
    toast.success("All data cleared");
  }

  function updateProc(i: number, patch: { name?: string; cost?: number }) {
    const next = state.settings.commonProcedures.map((p, idx) =>
      idx === i ? { ...p, ...patch } : p
    );
    setProcedures(next);
  }
  function addProc() {
    setProcedures([...state.settings.commonProcedures, { name: "New procedure", cost: 0 }]);
  }
  function removeProc(i: number) {
    setProcedures(state.settings.commonProcedures.filter((_, idx) => idx !== i));
  }

  const storageKb = (JSON.stringify(state).length / 1024).toFixed(1);

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure clinic details and manage data" />

      <Card className="p-5 mb-5">
        <h3 className="font-semibold text-[15px] mb-4">Clinic details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="space-y-1.5">
            <Label>Clinic name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency code</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={5}
            />
          </div>
        </div>
        <Button onClick={saveSettings}>Save settings</Button>
      </Card>

      <Card className="overflow-hidden p-0 mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-[15px]">Common procedures</h3>
          <Button variant="outline" size="sm" onClick={addProc}>
            <Plus className="size-3.5" /> Add procedure
          </Button>
        </div>
        <div className="p-5 space-y-2">
          {state.settings.commonProcedures.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProc(i)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          {state.settings.commonProcedures.length === 0 && (
            <p className="text-sm text-muted-foreground">No procedures yet.</p>
          )}
        </div>
      </Card>

      <Card className="p-5 mb-5">
        <h3 className="font-semibold text-[15px] mb-2">Data management</h3>
        <p className="text-sm text-muted-foreground mb-4">
          All data is stored locally in your browser. Back up your data regularly.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJSON}>
            <Download className="size-4" /> Export backup (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={importJSON}
          />
          <Button variant="destructive" onClick={onClearAll}>
            <Trash2 className="size-4" /> Clear all data
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-[15px] mb-4">Storage stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Stat label="Patients" value={state.patients.length} />
          <Stat label="Visits" value={state.visits.length} />
          <Stat label="Payments" value={state.payments.length} />
          <Stat label="Storage used" value={`${storageKb} KB`} />
        </div>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
        {label}
      </div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
