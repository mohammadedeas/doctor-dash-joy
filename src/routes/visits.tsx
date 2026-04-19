import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useClinic } from "@/lib/clinic-store";
import { fmtDate, fmtMoney, visitPaymentStatus } from "@/lib/clinic-utils";
import { VisitDialog } from "@/components/visit-dialog";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const { state } = useClinic();
  const navigate = useNavigate();
  const currency = state.settings.currency;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const visits = useMemo(() => {
    const query = q.toLowerCase();
    return [...state.visits]
      .filter((v) => {
        if (!query) return true;
        const p = state.patients.find((pt) => pt.id === v.patientId);
        return (p?.name || "").toLowerCase().includes(query);
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [state.visits, state.patients, q]);

  return (
    <>
      <PageHeader
        title="Visits"
        subtitle={`${state.visits.length} total visit${state.visits.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            onClick={() => {
              setEditId(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New Visit
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Filter by patient name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {visits.length === 0 ? (
          <Empty title="No visits yet" desc='Click "New Visit" to record the first one.' />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Date</Th>
                  <Th>Patient</Th>
                  <Th>Procedures</Th>
                  <Th>Cost</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => {
                  const p = state.patients.find((pt) => pt.id === v.patientId);
                  const status = visitPaymentStatus(state, v);
                  const procs = v.procedures.map((pr) => pr.name).join(", ");
                  return (
                    <tr key={v.id} className="border-t">
                      <Td className="font-medium">{fmtDate(v.date)}</Td>
                      <Td>
                        <button
                          className="text-left hover:underline"
                          onClick={() =>
                            navigate({
                              to: "/patients/$patientId",
                              params: { patientId: v.patientId },
                            })
                          }
                        >
                          {p?.name || "—"}
                        </button>
                      </Td>
                      <Td>{procs || "—"}</Td>
                      <Td>{fmtMoney(v.totalCost, currency)}</Td>
                      <Td>
                        <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
                      </Td>
                      <Td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditId(v.id);
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

      <VisitDialog open={open} onOpenChange={setOpen} visitId={editId} />
    </>
  );
}

function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-12 px-4 text-muted-foreground">
      <h4 className="text-foreground font-medium text-sm">{title}</h4>
      <p className="text-xs mt-1">{desc}</p>
    </div>
  );
}
function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
