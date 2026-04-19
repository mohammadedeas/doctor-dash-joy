import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/patient-avatar";
import { StatusBadge } from "@/components/status-badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useClinic } from "@/lib/clinic-store";
import {
  fmtDate,
  fmtMoney,
  patientStats,
  visitPaymentStatus,
} from "@/lib/clinic-utils";
import { PatientDialog } from "@/components/patient-dialog";
import { VisitDialog } from "@/components/visit-dialog";
import { PaymentDialog } from "@/components/payment-dialog";
import { ArrowLeft, Pencil, Plus, CreditCard } from "lucide-react";

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

  return (
    <>
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

      <Card className="overflow-hidden p-0">
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
          <Info label="Date of birth" value={p.dob ? fmtDate(p.dob) : "—"} />
          <Info label="Gender" value={p.gender || "—"} />
          <Info label="Address" value={p.address || "—"} />
          <Info label="Patient since" value={fmtDate(p.createdAt)} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b text-sm bg-muted/40">
          <Info label="Visits" value={<strong>{st.visitCount}</strong>} />
          <Info label="Total billed" value={<strong>{fmtMoney(st.totalBilled, currency)}</strong>} />
          <Info
            label="Total paid"
            value={<strong className="text-primary">{fmtMoney(st.totalPaid, currency)}</strong>}
          />
          <Info
            label="Balance"
            value={
              <strong className={st.balance > 0 ? "text-destructive" : "text-primary"}>
                {fmtMoney(st.balance, currency)}
              </strong>
            }
          />
        </div>

        {p.medicalNotes && (
          <div className="p-5 border-b">
            <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1">
              Medical notes
            </div>
            <p className="text-sm whitespace-pre-wrap">{p.medicalNotes}</p>
          </div>
        )}

        <Tabs defaultValue="visits" className="p-0">
          <div className="px-5 pt-3 border-b">
            <TabsList>
              <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="visits" className="p-0">
            {visits.length === 0 ? (
              <Empty title="No visits recorded" desc="Add the first visit for this patient." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <Th>Date</Th>
                      <Th>Procedures</Th>
                      <Th>Cost</Th>
                      <Th>Paid for visit</Th>
                      <Th>Status</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v) => {
                      const status = visitPaymentStatus(state, v);
                      const procs = v.procedures.map((pr) => pr.name).join(", ");
                      return (
                        <tr key={v.id} className="border-t">
                          <Td className="font-medium">{fmtDate(v.date)}</Td>
                          <Td>{procs || "—"}</Td>
                          <Td>{fmtMoney(v.totalCost, currency)}</Td>
                          <Td>{fmtMoney(status.paid, currency)}</Td>
                          <Td>
                            <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
                          </Td>
                          <Td className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditVisitId(v.id);
                                setVisitOpen(true);
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
          </TabsContent>

          <TabsContent value="payments" className="p-0">
            {payments.length === 0 ? (
              <Empty title="No payments recorded" desc="Record a payment for this patient." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <Th>Date</Th>
                      <Th>Method</Th>
                      <Th>For visit</Th>
                      <Th className="text-right">Amount</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((py) => {
                      const v = state.visits.find((x) => x.id === py.visitId);
                      return (
                        <tr key={py.id} className="border-t">
                          <Td className="font-medium">{fmtDate(py.date)}</Td>
                          <Td>{py.method}</Td>
                          <Td>
                            {v ? fmtDate(v.date) : <span className="text-muted-foreground">General</span>}
                          </Td>
                          <Td className="text-right font-semibold">
                            {fmtMoney(py.amount, currency)}
                          </Td>
                          <Td className="text-right">
                            <Button
                              variant="outline"
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
          </TabsContent>
        </Tabs>
      </Card>

      <PatientDialog
        open={editPatient}
        onOpenChange={setEditPatient}
        patientId={p.id}
      />
      <VisitDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        visitId={editVisitId}
        defaultPatientId={p.id}
      />
      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        paymentId={editPayId}
        defaultPatientId={p.id}
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
        {label}
      </div>
      <div className="text-sm mt-1">{value}</div>
    </div>
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
