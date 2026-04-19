import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useClinic } from "@/lib/clinic-store";
import { fmtDate, fmtMoney, todayISO, visitPaymentStatus } from "@/lib/clinic-utils";
import { PatientDialog } from "@/components/patient-dialog";
import { VisitDialog } from "@/components/visit-dialog";
import { Plus, UserPlus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { state } = useClinic();
  const navigate = useNavigate();
  const currency = state.settings.currency;
  const [patientOpen, setPatientOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  const totalPatients = state.patients.length;
  const totalVisits = state.visits.length;
  const totalRevenue = state.payments.reduce((s, p) => s + p.amount, 0);
  const totalBilled = state.visits.reduce((s, v) => s + (v.totalCost || 0), 0);
  const outstanding = totalBilled - totalRevenue;

  const today = todayISO();
  const monthStart = today.slice(0, 7);
  const todayVisits = state.visits.filter((v) => v.date === today).length;
  const monthRevenue = state.payments
    .filter((p) => p.date?.startsWith(monthStart))
    .reduce((s, p) => s + p.amount, 0);

  const recentVisits = [...state.visits]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);
  const recentPayments = [...state.payments]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your clinic activity"
        actions={
          <>
            <Button variant="outline" onClick={() => setPatientOpen(true)}>
              <UserPlus className="size-4" /> New Patient
            </Button>
            <Button onClick={() => setVisitOpen(true)}>
              <Plus className="size-4" /> New Visit
            </Button>
          </>
        }
      />

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Patients"
          value={totalPatients.toString()}
          hint={`${todayVisits} visit${todayVisits !== 1 ? "s" : ""} today`}
        />
        <StatCard label="Total Visits" value={totalVisits.toString()} hint="All-time" />
        <StatCard
          label="Revenue (Month)"
          value={fmtMoney(monthRevenue, currency)}
          valueClass="text-primary"
          hint={`Total collected: ${fmtMoney(totalRevenue, currency)}`}
        />
        <StatCard
          label="Outstanding"
          value={fmtMoney(outstanding, currency)}
          valueClass={outstanding > 0 ? "text-destructive" : ""}
          hint={`Billed: ${fmtMoney(totalBilled, currency)}`}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[15px]">Recent Visits</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/visits">View all</Link>
            </Button>
          </div>
          {recentVisits.length === 0 ? (
            <Empty title="No visits yet" desc="Record your first visit to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th>Cost</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisits.map((v) => {
                    const p = state.patients.find((x) => x.id === v.patientId);
                    const status = visitPaymentStatus(state, v);
                    return (
                      <tr
                        key={v.id}
                        className="border-t cursor-pointer hover:bg-muted/40"
                        onClick={() =>
                          navigate({ to: "/patients/$patientId", params: { patientId: v.patientId } })
                        }
                      >
                        <Td>{fmtDate(v.date)}</Td>
                        <Td>{p?.name || "—"}</Td>
                        <Td>{fmtMoney(v.totalCost, currency)}</Td>
                        <Td>
                          <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[15px]">Recent Payments</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/payments">View all</Link>
            </Button>
          </div>
          {recentPayments.length === 0 ? (
            <Empty title="No payments yet" desc="Payments will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th>Method</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => {
                    const pt = state.patients.find((x) => x.id === p.patientId);
                    return (
                      <tr key={p.id} className="border-t">
                        <Td>{fmtDate(p.date)}</Td>
                        <Td>{pt?.name || "—"}</Td>
                        <Td>{p.method}</Td>
                        <Td className="text-right font-semibold">
                          {fmtMoney(p.amount, currency)}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <PatientDialog open={patientOpen} onOpenChange={setPatientOpen} />
      <VisitDialog open={visitOpen} onOpenChange={setVisitOpen} />
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  valueClass = "",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold font-display ${valueClass}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
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

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left font-medium ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
