import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinic } from "@/lib/clinic-store";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateSettings, setProcedures } = useClinic();
  const [name, setName] = useState(state.settings.clinicName);
  const [currency, setCurrency] = useState(state.settings.currency);

  function saveSettings() {
    updateSettings({
      clinicName: name.trim() || "My Dental Clinic",
      currency: currency.trim() || "ILS",
    });
    toast.success("Settings saved");
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
                <X className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          {state.settings.commonProcedures.length === 0 && (
            <p className="text-sm text-muted-foreground">No procedures yet.</p>
          )}
        </div>
      </Card>



      <Card className="p-5">
        <h3 className="font-semibold text-[15px] mb-4">Database stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <Stat label="Patients" value={state.patients.length} />
          <Stat label="Visits" value={state.visits.length} />
          <Stat label="Payments" value={state.payments.length} />
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
