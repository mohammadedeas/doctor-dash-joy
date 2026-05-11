import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/patient-avatar";
import { useClinic } from "@/lib/clinic-store";
import { fmtMoney, patientStats } from "@/lib/clinic-utils";
import { PatientDialog } from "@/components/patient-dialog";
import { Plus, Search, Users } from "lucide-react";

export const Route = createFileRoute("/patients/")({
  component: PatientsPage,
});

function PatientsPage() {
  const { state } = useClinic();
  const navigate = useNavigate();
  const currency = state.settings.currency;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return state.patients
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          (p.phone || "").includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.patients, q]);

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={`${state.patients.length} patient${state.patients.length !== 1 ? "s" : ""} in your records`}
        actions={
          <Button
            onClick={() => {
              setEditId(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New Patient
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
              <Users className="size-5" />
            </div>
            <h3 className="font-medium text-sm">
              {state.patients.length === 0 ? "No patients yet" : "No patients match your search"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {state.patients.length === 0
                ? "Add your first patient to get started."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Phone</th>
                  <th className="px-4 py-2.5 text-left font-medium">Visits</th>
                  <th className="px-4 py-2.5 text-left font-medium">Total Billed</th>
                  <th className="px-4 py-2.5 text-left font-medium">Balance</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = patientStats(state, p.id);
                  return (
                    <tr
                      key={p.id}
                      className="border-t cursor-pointer hover:bg-muted/40"
                      onClick={() =>
                        navigate({ to: "/patients/$patientId", params: { patientId: p.id } })
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.name} size={32} />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.phone || "—"}</td>
                      <td className="px-4 py-3">{st.visitCount}</td>
                      <td className="px-4 py-3">{fmtMoney(st.totalBilled, currency)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${st.balance > 0 ? "text-destructive" : ""}`}
                        >
                          {fmtMoney(st.balance, currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditId(p.id);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PatientDialog open={open} onOpenChange={setOpen} patientId={editId} />
    </>
  );
}
