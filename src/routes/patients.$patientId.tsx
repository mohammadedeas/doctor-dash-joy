import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/patient-avatar";
import { useClinic } from "@/lib/clinic-store";
import { fmtDate, fmtMoney, patientStats, visitPaymentStatus, calcAge } from "@/lib/clinic-utils";
import { PatientDialog } from "@/components/patient-dialog";
import { VisitDialog } from "@/components/visit-dialog";
import { PaymentDialog } from "@/components/payment-dialog";
import {
  ArrowLeft,
  Pencil,
  Plus,
  CreditCard,
  Stethoscope,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DentalChart } from "@/components/dental";
import type { ToothClinicalData } from "@/components/dental/types";
import { TREATMENT_STATUS_CONFIG } from "@/components/dental/treatment-constants";
import { fetchDentalChart, saveDentalChart } from "@/lib/api-client";
import { EmptyState } from "@/components/empty-state";
import { Th, Td } from "@/components/data-table";
import { MetricStat } from "@/components/metric-stat";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/$patientId")({
  component: PatientDetail,
});

function PatientDetail() {
  const { patientId } = Route.useParams();
  const { state } = useClinic();
  const navigate = useNavigate();
  const currency = state.settings.currency;
  const p = state.patients.find((x) => x.id === patientId);

  const [editPatient, setEditPatient] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [editVisitId, setEditVisitId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [editPayId, setEditPayId] = useState<string | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [chartData, setChartData] = useState<Record<number, ToothClinicalData>>({});
  const [chartLoaded, setChartLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChartLoaded(false);
    fetchDentalChart(patientId)
      .then((res) => {
        if (!cancelled) setChartData(res.teeth as Record<number, ToothClinicalData>);
      })
      .catch(() => {
        // No saved chart yet — DentalChart falls back to defaults
      })
      .finally(() => {
        if (!cancelled) setChartLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const handleChartChange = (next: Record<number, ToothClinicalData>) => {
    setChartData(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDentalChart(patientId, next).catch(() => {
        // Best-effort autosave; the chart stays editable even if this fails
      });
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!p) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold">Patient not found</h2>
        <Button className="mt-4" asChild>
          <Link to="/patients">Back to patients</Link>
        </Button>
      </div>
    );
  }

  const st = patientStats(state, p.id);
  const visits = state.visits
    .filter((v) => v.patientId === p.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const payments = state.payments
    .filter((py) => py.patientId === p.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const toothTreatments = state.toothTreatments
    .filter((t) => t.patientId === p.id)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const lastPaymentDate = payments[0]?.date;

  return (
    <>
      {/* Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Button variant="outline" onClick={() => navigate({ to: "/patients" })}>
          <ArrowLeft className="size-4" /> Back to patients
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditPatient(true)}>
            <Pencil className="size-4" /> Edit patient
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditVisitId(null);
              setVisitOpen(true);
            }}
          >
            <Plus className="size-4" /> New visit
          </Button>
          <Button
            onClick={() => {
              setEditPayId(null);
              setPayOpen(true);
            }}
          >
            <CreditCard className="size-4" /> New payment
          </Button>
        </div>
      </div>

      {/* ── Section 1: Patient Information ── */}
      <Card className="overflow-hidden p-0 mb-6">
        <div className="flex items-center gap-4 p-5 border-b">
          <Avatar name={p.name} size={56} />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold font-display truncate">{p.name}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {p.phone || ""}
              {p.phone && p.email ? " · " : ""}
              {p.email || ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b text-sm">
          <MetricStat valueClassName="text-sm mt-1" label="Age" value={calcAge(p.dob) ?? "—"} />
          <MetricStat valueClassName="text-sm mt-1" label="Gender" value={p.gender || "—"} />
          <MetricStat valueClassName="text-sm mt-1" label="Address" value={p.address || "—"} />
          <MetricStat valueClassName="text-sm mt-1" label="Patient since" value={fmtDate(p.createdAt)} />
        </div>

        {p.medicalNotes && (
          <div className="p-5">
            <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1">
              Medical notes
            </div>
            <p className="text-sm whitespace-pre-wrap">{p.medicalNotes}</p>
          </div>
        )}
      </Card>

      {/* ── Tabs: Dental Chart / Treatments / Visits / Financial ── */}
      <Tabs defaultValue="chart" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid sm:grid-cols-4">
          <TabsTrigger value="chart">Dental Chart</TabsTrigger>
          <TabsTrigger value="treatments">
            Treatments{toothTreatments.length > 0 ? ` (${toothTreatments.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="visits">
            Visits{visits.length > 0 ? ` (${visits.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="financial">
            Financial{payments.length > 0 ? ` (${payments.length})` : ""}
          </TabsTrigger>
        </TabsList>

        {/* ── Dental Chart ── */}
        <TabsContent value="chart" className="mt-4">
          {chartLoaded ? (
            <DentalChart
              key={patientId}
              patientId={patientId}
              initialData={chartData}
              toothTreatments={toothTreatments}
              className="min-h-[500px]"
              onDataChange={handleChartChange}
            />
          ) : (
            <div className="min-h-[500px] rounded-2xl border border-border bg-card animate-pulse" />
          )}
        </TabsContent>

        {/* ── Treatment Plan & History ── */}
        <TabsContent value="treatments" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Stethoscope className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Treatment Plan & History</h3>
                <p className="text-[11px] text-muted-foreground">
                  {toothTreatments.length} tooth treatment{toothTreatments.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
            </div>

            {toothTreatments.length === 0 ? (
              <EmptyState
                size="sm"
                title="No treatments recorded"
                desc="Add treatments during a visit to build the patient's dental history."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <Th>Tooth</Th>
                      <Th>Procedure</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                      <Th>Notes</Th>
                      <Th className="text-right">Cost</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {toothTreatments.map((t) => {
                      const cfg = TREATMENT_STATUS_CONFIG[t.status];
                      const visit = state.visits.find((v) => v.id === t.visitId);
                      return (
                        <tr key={t.id} className="border-t">
                          <Td className="font-medium">{t.toothNumber}</Td>
                          <Td>{t.procedure}</Td>
                          <Td>
                            <StatusBadge tone={cfg.tone} dot>{cfg.label}</StatusBadge>
                          </Td>
                          <Td className="text-muted-foreground">
                            {fmtDate(visit?.date || t.createdAt.slice(0, 10))}
                          </Td>
                          <Td className="text-muted-foreground max-w-[200px] truncate">{t.notes || "—"}</Td>
                          <Td className="text-right">{fmtMoney(t.cost || 0, currency)}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Visits Summary ── */}
        <TabsContent value="visits" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <div className="size-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Calendar className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Visits Summary</h3>
                <p className="text-[11px] text-muted-foreground">
                  {visits.length} visit{visits.length !== 1 ? "s" : ""} on record
                </p>
              </div>
            </div>

            {visits.length === 0 ? (
              <EmptyState size="sm" title="No visits recorded" desc="Add the first visit for this patient." />
            ) : (
              <div className="divide-y divide-border">
                {visits.map((v) => {
                  const status = visitPaymentStatus(state, v);
                  const balance = (v.totalCost || 0) - status.paid;
                  const visitTreatments = state.toothTreatments.filter((t) => t.visitId === v.id);
                  const isExpanded = expandedVisit === v.id;
                  return (
                    <div key={v.id} className="group">
                      <div
                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedVisit(isExpanded ? null : v.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button className="shrink-0 text-muted-foreground hover:text-foreground">
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{fmtDate(v.date)}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {v.notes ? v.notes : "Treatment Visit"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm shrink-0 ml-4">
                          <span className="text-muted-foreground">
                            {visitTreatments.length} treatment{visitTreatments.length !== 1 ? "s" : ""}
                          </span>
                          <span className="font-medium">{fmtMoney(v.totalCost, currency)}</span>
                          <span className="text-muted-foreground">Paid {fmtMoney(status.paid, currency)}</span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              balance > 0 ? "text-destructive" : "text-emerald-600"
                            )}
                          >
                            {balance > 0 ? `Bal ${fmtMoney(balance, currency)}` : status.paid > 0 ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-4 bg-muted/20">
                          {visitTreatments.length > 0 && (
                            <div className="mb-3">
                              <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                                Treatments in this visit
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {visitTreatments.map((t) => {
                                  const cfg = TREATMENT_STATUS_CONFIG[t.status];
                                  return (
                                    <StatusBadge key={t.id} tone={cfg.tone} dot>
                                      Tooth {t.toothNumber}: {t.procedure}
                                    </StatusBadge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditVisitId(v.id);
                                setVisitOpen(true);
                              }}
                            >
                              Edit Visit
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Financial Summary ── */}
        <TabsContent value="financial" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Wallet className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Financial Summary</h3>
                <p className="text-[11px] text-muted-foreground">
                  {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b text-sm bg-muted/30">
              <MetricStat valueClassName="text-sm mt-1" label="Total Cost" value={<strong>{fmtMoney(st.totalBilled, currency)}</strong>} />
              <MetricStat valueClassName="text-sm mt-1" label="Total Paid" value={<strong className="text-primary">{fmtMoney(st.totalPaid, currency)}</strong>} />
              <MetricStat
                valueClassName="text-sm mt-1"
                label="Balance"
                value={
                  <strong className={st.balance > 0 ? "text-destructive" : "text-emerald-600"}>
                    {fmtMoney(st.balance, currency)}
                  </strong>
                }
              />
              <MetricStat valueClassName="text-sm mt-1" label="Last Payment" value={lastPaymentDate ? fmtDate(lastPaymentDate) : "—"} />
            </div>

            {/* Payment history */}
            {payments.length === 0 ? (
              <EmptyState size="sm" title="No payments recorded" desc="Record a payment for this patient." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <Th>Date</Th>
                      <Th>Method</Th>
                      <Th>For Visit</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((py) => {
                      const v = state.visits.find((x) => x.id === py.visitId);
                      return (
                        <tr key={py.id} className="border-t">
                          <Td className="font-medium">{fmtDate(py.date)}</Td>
                          <Td>{py.method}</Td>
                          <Td className="text-muted-foreground">{v ? fmtDate(v.date) : "General"}</Td>
                          <Td className="text-right font-semibold text-emerald-600">
                            {fmtMoney(py.amount, currency)}
                          </Td>
                          <Td className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditPayId(py.id);
                                setPayOpen(true);
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
        </TabsContent>
      </Tabs>

      <PatientDialog open={editPatient} onOpenChange={setEditPatient} patientId={p.id} />
      <VisitDialog open={visitOpen} onOpenChange={setVisitOpen} visitId={editVisitId} defaultPatientId={p.id} />
      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} paymentId={editPayId} defaultPatientId={p.id} />
    </>
  );
}
