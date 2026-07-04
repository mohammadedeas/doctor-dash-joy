import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricStat } from "@/components/metric-stat";
import { EmptyState } from "@/components/empty-state";
import { Th, Td } from "@/components/data-table";
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
        {state.settings.commonProcedures.length === 0 ? (
          <EmptyState
            size="sm"
            title="No procedures yet"
            desc="Add your clinic's common procedures and their default prices."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>Procedure</Th>
                <Th className="w-40">Default cost</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.settings.commonProcedures.map((p, i) => (
                <tr key={i}>
                  <Td>
                    <Input
                      value={p.name}
                      onChange={(e) => updateProc(i, { name: e.target.value })}
                      className="border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-input focus-visible:bg-card"
                    />
                  </Td>
                  <Td>
                    <Input
                      type="number"
                      step="0.01"
                      value={p.cost}
                      onChange={(e) => updateProc(i, { cost: parseFloat(e.target.value) || 0 })}
                      className="border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-input focus-visible:bg-card"
                    />
                  </Td>
                  <Td className="text-right">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProc(i)}>
                      <X className="size-4 text-destructive" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>



      <Card className="p-5">
        <h3 className="font-semibold text-[15px] mb-4">Database stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <MetricStat label="Patients" value={state.patients.length} />
          <MetricStat label="Visits" value={state.visits.length} />
          <MetricStat label="Payments" value={state.payments.length} />
        </div>
      </Card>
    </>
  );
}
