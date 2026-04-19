import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/lib/clinic-store";
import { fmtDate, fmtMoney } from "@/lib/clinic-utils";
import { PaymentDialog } from "@/components/payment-dialog";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { state } = useClinic();
  const navigate = useNavigate();
  const currency = state.settings.currency;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const payments = useMemo(() => {
    const query = q.toLowerCase();
    return [...state.payments]
      .filter((p) => {
        if (!query) return true;
        const pt = state.patients.find((x) => x.id === p.patientId);
        return (pt?.name || "").toLowerCase().includes(query);
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [state.payments, state.patients, q]);

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle={`${state.payments.length} payment${state.payments.length !== 1 ? "s" : ""} recorded · ${fmtMoney(total, currency)} shown`}
        actions={
          <Button
            onClick={() => {
              setEditId(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New Payment
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
        {payments.length === 0 ? (
          <Empty title="No payments yet" desc="Record your first payment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Date</Th>
                  <Th>Patient</Th>
                  <Th>Method</Th>
                  <Th>Notes</Th>
                  <Th className="text-right">Amount</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const pt = state.patients.find((x) => x.id === p.patientId);
                  return (
                    <tr key={p.id} className="border-t">
                      <Td className="font-medium">{fmtDate(p.date)}</Td>
                      <Td>
                        <button
                          className="text-left hover:underline"
                          onClick={() =>
                            navigate({
                              to: "/patients/$patientId",
                              params: { patientId: p.patientId },
                            })
                          }
                        >
                          {pt?.name || "—"}
                        </button>
                      </Td>
                      <Td>{p.method}</Td>
                      <Td className="text-muted-foreground max-w-[240px] truncate">
                        {p.notes || ""}
                      </Td>
                      <Td className="text-right font-semibold">
                        {fmtMoney(p.amount, currency)}
                      </Td>
                      <Td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
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

      <PaymentDialog open={open} onOpenChange={setOpen} paymentId={editId} />
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
