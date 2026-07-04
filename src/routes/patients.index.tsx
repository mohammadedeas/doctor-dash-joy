import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/patient-avatar";
import { useClinic } from "@/lib/clinic-store";
import { fmtMoney, patientStats } from "@/lib/clinic-utils";
import { PatientDialog } from "@/components/patient-dialog";
import { EmptyState } from "@/components/empty-state";
import { Th, Td } from "@/components/data-table";
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

  useEffect(() => {
    const openNew = () => {
      setEditId(null);
      setOpen(true);
    };
    window.addEventListener("new-patient", openNew);
    return () => window.removeEventListener("new-patient", openNew);
  }, []);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return state.patients
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          (p.phone || "").includes(query)
      )
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
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
          <EmptyState
            size="lg"
            icon={<Users className="size-5" />}
            title={state.patients.length === 0 ? "No patients yet" : "No patients match your search"}
            desc={
              state.patients.length === 0
                ? "Add your first patient to get started."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Visits</Th>
                  <Th>Total Billed</Th>
                  <Th>Balance</Th>
                  <Th />
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
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.name} size={32} />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </Td>
                      <Td>{p.phone || "—"}</Td>
                      <Td>{st.visitCount}</Td>
                      <Td>{fmtMoney(st.totalBilled, currency)}</Td>
                      <Td>
                        <span
                          className={`font-semibold ${st.balance > 0 ? "text-destructive" : ""}`}
                        >
                          {fmtMoney(st.balance, currency)}
                        </span>
                      </Td>
                      <Td className="text-right">
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
                      </Td>
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
