import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useClinic } from "@/lib/clinic-store";
import { useAuth } from "@/lib/auth-context";
import { useCountUp } from "@/hooks/use-count-up";
import { fmtDate, fmtMoney, todayISO, visitPaymentStatus } from "@/lib/clinic-utils";
import { PatientDialog } from "@/components/patient-dialog";
import { VisitDialog } from "@/components/visit-dialog";
import {
  Plus,
  UserPlus,
  Calendar,
  Users,
  Stethoscope,
  TrendingUp,
  Wallet,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function Dashboard() {
  const { state } = useClinic();
  const { user } = useAuth();
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-sky-400 p-6 lg:p-8 mb-8 text-primary-foreground shadow-lg"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
            <Sparkles className="size-4" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">
            {greeting()}, {user?.name?.split(" ")[0] || "Doctor"}
          </h1>
          <p className="text-primary-foreground/80 mt-1.5 text-sm max-w-md leading-relaxed">
            Here&apos;s what&apos;s happening at {state.settings.clinicName} today.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="absolute -bottom-10 -right-5 size-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute top-1/2 -left-10 size-28 rounded-full bg-sky-300/15 blur-xl" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard
          label="Total Patients"
          value={totalPatients}
          hint={`${todayVisits} visit${todayVisits !== 1 ? "s" : ""} today`}
          icon={<Users className="size-5" />}
          variant="blue"
        />
        <StatCard
          label="Total Visits"
          value={totalVisits}
          hint="All-time recorded"
          icon={<Stethoscope className="size-5" />}
          variant="sky"
        />
        <StatCard
          label="Monthly Revenue"
          value={monthRevenue}
          prefix={currency}
          hint={`Total: ${fmtMoney(totalRevenue, currency)}`}
          icon={<TrendingUp className="size-5" />}
          variant="emerald"
        />
        <StatCard
          label="Outstanding"
          value={outstanding}
          prefix={currency}
          hint={`Billed: ${fmtMoney(totalBilled, currency)}`}
          icon={<Wallet className="size-5" />}
          variant={outstanding > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Quick Actions + Appointments Row */}
      <motion.div variants={itemVariants} className="grid gap-6 grid-cols-1 xl:grid-cols-3 mb-8">
        {/* Quick Actions */}
        <Card className="xl:col-span-1 p-5 border border-border bg-card shadow-card">
          <h3 className="font-semibold text-[15px] mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            <QuickAction
              icon={<UserPlus className="size-4" />}
              label="New Patient"
              desc="Register a new patient record"
              onClick={() => setPatientOpen(true)}
            />
            <QuickAction
              icon={<Stethoscope className="size-4" />}
              label="New Visit"
              desc="Record a patient visit"
              onClick={() => setVisitOpen(true)}
            />
            <QuickAction
              icon={<Calendar className="size-4" />}
              label="New Appointment"
              desc="Schedule an appointment"
              onClick={() => navigate({ to: "/calendar" })}
            />
            <QuickAction
              icon={<Wallet className="size-4" />}
              label="Record Payment"
              desc="Add a new payment"
              onClick={() => navigate({ to: "/payments" })}
            />
          </div>
        </Card>

        {/* Today's Appointments */}
        <Card className="xl:col-span-2 p-0 border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Today&apos;s Schedule</h3>
                <p className="text-[11px] text-muted-foreground">
                  {todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""} ·{" "}
                  {upcomingAppts.length} upcoming
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar">View all</Link>
            </Button>
          </div>

          {nextAppointments.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                <Clock className="size-5" />
              </div>
              <h4 className="font-medium text-sm text-foreground">No appointments scheduled</h4>
              <p className="text-xs text-muted-foreground mt-1">Your calendar is clear for now.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {nextAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate({ to: "/calendar" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {a.patientName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{a.patientName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {a.date === today ? "Today" : fmtDate(a.date)} · {a.startTime} · {a.visitType}
                      </div>
                    </div>
                  </div>
                  <StatusBadge variant={a.status as any}>{a.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}

          {missedAppts.length > 0 && (
            <div className="px-5 py-3 bg-warn-soft/50 border-t border-warn/10 flex items-center gap-2">
              <AlertCircle className="size-4 text-warn shrink-0" />
              <span className="text-xs text-warn font-medium">
                {missedAppts.length} missed appointment{missedAppts.length !== 1 ? "s" : ""} pending follow-up
              </span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recent Activity Row */}
      <motion.div variants={itemVariants} className="grid gap-6 grid-cols-1 xl:grid-cols-2 mb-6">
        {/* Recent Visits */}
        <Card className="p-0 border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-[15px]">Recent Visits</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/visits">View all</Link>
            </Button>
          </div>
          {recentVisits.length === 0 ? (
            <EmptyState title="No visits yet" desc="Record your first visit to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th className="text-right">Cost</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentVisits.map((v) => {
                    const p = state.patients.find((x) => x.id === v.patientId);
                    const status = visitPaymentStatus(state, v);
                    return (
                      <tr
                        key={v.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() =>
                          navigate({ to: "/patients/$patientId", params: { patientId: v.patientId } })
                        }
                      >
                        <Td>{fmtDate(v.date)}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-md bg-primary-soft text-primary flex items-center justify-center text-[10px] font-bold">
                              {p?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="font-medium">{p?.name || "—"}</span>
                          </div>
                        </Td>
                        <Td className="text-right font-semibold">{fmtMoney(v.totalCost, currency)}</Td>
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

        {/* Recent Payments */}
        <Card className="p-0 border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-[15px]">Recent Payments</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/payments">View all</Link>
            </Button>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState title="No payments yet" desc="Payments will appear here once recorded." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentPayments.map((p) => {
                    const pt = state.patients.find((x) => x.id === p.patientId);
                    return (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                        <Td>{fmtDate(p.date)}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-md bg-success-soft text-success flex items-center justify-center text-[10px] font-bold">
                              {pt?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="font-medium">{pt?.name || "—"}</span>
                          </div>
                        </Td>
                        <Td className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
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
      </motion.div>

      <PatientDialog open={patientOpen} onOpenChange={setPatientOpen} />
      <VisitDialog open={visitOpen} onOpenChange={setVisitOpen} />
    </motion.div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  prefix,
  hint,
  icon,
  variant = "blue",
}: {
  label: string;
  value: number;
  prefix?: string;
  hint?: string;
  icon: React.ReactNode;
  variant?: "blue" | "sky" | "emerald" | "amber" | "rose";
}) {
  const variants = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
  };

  const animatedValue = useCountUp(value, 1400);
  const displayValue = prefix
    ? `${prefix}${Number(animatedValue.replace(/,/g, "")).toLocaleString(undefined, {
        minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })}`
    : animatedValue;

  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4 lg:p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`size-9 rounded-lg flex items-center justify-center ${variants[variant]}`}>
          {icon}
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
      <div className="text-2xl font-bold font-display tracking-tight text-foreground tabular-nums">
        {displayValue}
      </div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
        {label}
      </div>
      {hint && <div className="text-xs text-muted-foreground/70 mt-2">{hint}</div>}
    </motion.div>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/70 transition-colors text-left group"
    >
      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
        <AlertCircle className="size-5" />
      </div>
      <h4 className="font-medium text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
