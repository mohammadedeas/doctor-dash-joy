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
import { Plus, UserPlus, Calendar } from "lucide-react";

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

  // Appointment stats
  const todayAppts = state.appointments.filter((a) => a.date === today);
  const upcomingAppts = state.appointments.filter(
    (a) => a.date > today && a.status !== "cancelled" && a.status !== "completed"
  );
  const missedAppts = state.appointments.filter(
    (a) => a.date < today && a.status === "pending"
  );
  const nextAppointments = [...state.appointments]
    .filter((a) => a.date >= today && a.status !== "cancelled")
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
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

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 mb-6">
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
        <StatCard
          label="Appointments"
          value={String(todayAppts.length)}
          valueClass="text-primary"
          hint={`${upcomingAppts.length} upcoming`}
          icon={<Calendar className="size-4 text-primary" />}
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

      {/* Appointment Summary */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3 mt-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[15px]">Today's Appointments</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar">Calendar</Link>
            </Button>
          </div>
          {todayAppts.length === 0 ? (
            <Empty title="No appointments today" desc="Your schedule is clear." />
          ) : (
            <div className="space-y-2">
              {todayAppts.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{a.patientName}</div>
                    <div className="text-[11px] text-muted-foreground">{a.startTime} — {a.visitType}</div>
                  </div>
                  <StatusBadge variant={a.status as any}>{a.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[15px]">Upcoming</h3>
          </div>
          {nextAppointments.length === 0 ? (
            <Empty title="No upcoming appointments" desc="Schedule your next appointment." />
          ) : (
            <div className="space-y-2">
              {nextAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{a.patientName}</div>
                    <div className="text-[11px] text-muted-foreground">{a.date} • {a.startTime}</div>
                  </div>
                  <StatusBadge variant={a.status as any}>{a.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[15px]">Appointment Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-3 text-center">
              <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{todayAppts.filter(a => a.status === 'confirmed').length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Confirmed</div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-3 text-center">
              <div className="text-xl font-semibold text-amber-600 dark:text-amber-400">{state.appointments.filter(a => a.status === 'pending').length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Pending</div>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-3 text-center">
              <div className="text-xl font-semibold text-red-600 dark:text-red-400">{missedAppts.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Missed</div>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-3 text-center">
              <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">{state.appointments.filter(a => a.status === 'completed').length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Completed</div>
            </div>
          </div>
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
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
          {label}
        </div>
        {icon}
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
