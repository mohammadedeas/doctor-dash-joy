import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClinic } from "@/lib/clinic-store";
import { fmtMoney, patientStats, todayISO } from "@/lib/clinic-utils";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { state } = useClinic();
  const navigate = useNavigate();
  const currency = state.settings.currency;

  // Last 12 months
  const now = new Date();
  const months = [] as { key: string; label: string; revenue: number; billed: number; visitCount: number }[];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    const revenue = state.payments
      .filter((p) => p.date?.startsWith(key))
      .reduce((s, p) => s + p.amount, 0);
    const billed = state.visits
      .filter((v) => v.date?.startsWith(key))
      .reduce((s, v) => s + (v.totalCost || 0), 0);
    const visitCount = state.visits.filter((v) => v.date?.startsWith(key)).length;
    months.push({ key, label, revenue, billed, visitCount });
  }
  const maxBar = Math.max(1, ...months.map((m) => Math.max(m.revenue, m.billed)));

  // Outstanding
  const outstanding = state.patients
    .map((p) => ({ patient: p, ...patientStats(state, p.id) }))
    .filter((x) => x.balance > 0.01)
    .sort((a, b) => b.balance - a.balance);
  const totalOutstanding = outstanding.reduce((s, x) => s + x.balance, 0);

  // Method totals
  const methodTotals: Record<string, number> = {};
  for (const p of state.payments) {
    const m = p.method || "Other";
    methodTotals[m] = (methodTotals[m] || 0) + p.amount;
  }
  const methodList = Object.entries(methodTotals).sort((a, b) => b[1] - a[1]);
  const methodTotal = methodList.reduce((s, [, v]) => s + v, 0);

  function exportCSV() {
    const csv = (rows: (string | number | undefined | null)[][]) =>
      rows
        .map((r) =>
          r
            .map((c) => {
              const s = String(c ?? "");
              return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(",")
        )
        .join("\n");

    const patientsCsv = csv([
      ["id", "name", "phone", "email", "dob", "gender", "address", "medicalNotes", "createdAt"],
      ...state.patients.map((p) => [
        p.id,
        p.name,
        p.phone,
        p.email,
        p.dob,
        p.gender,
        p.address,
        p.medicalNotes,
        p.createdAt,
      ]),
    ]);
    const visitsCsv = csv([
      ["id", "patientId", "patientName", "date", "procedures", "totalCost", "notes"],
      ...state.visits.map((v) => {
        const p = state.patients.find((x) => x.id === v.patientId);
        return [
          v.id,
          v.patientId,
          p?.name || "",
          v.date,
          v.procedures.map((pr) => `${pr.name}:${pr.cost}`).join("; "),
          v.totalCost,
          v.notes,
        ];
      }),
    ]);
    const paymentsCsv = csv([
      ["id", "patientId", "patientName", "visitId", "date", "amount", "method", "notes"],
      ...state.payments.map((p) => {
        const pt = state.patients.find((x) => x.id === p.patientId);
        return [p.id, p.patientId, pt?.name || "", p.visitId || "", p.date, p.amount, p.method, p.notes];
      }),
    ]);

    const dl = (name: string, content: string) => {
      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    };
    dl(`patients-${todayISO()}.csv`, patientsCsv);
    dl(`visits-${todayISO()}.csv`, visitsCsv);
    dl(`payments-${todayISO()}.csv`, paymentsCsv);
    toast.success("3 CSV files downloaded");
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Financial overview and outstanding balances"
        actions={
          <Button variant="outline" onClick={exportCSV}>
            <Download className="size-4" /> Export all (CSV)
          </Button>
        }
      />

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[15px]">Last 12 months</h3>
          <span className="text-xs text-muted-foreground">Monthly revenue collected</span>
        </div>
        <div className="grid grid-cols-12 gap-2 items-end h-48 mb-2">
          {months.map((m) => {
            const h = (m.revenue / maxBar) * 100;
            return (
              <div key={m.key} className="flex flex-col items-center justify-end h-full">
                <div className="text-[10px] text-muted-foreground mb-1">
                  {m.revenue > 0
                    ? Math.round(m.revenue).toLocaleString()
                    : ""}
                </div>
                <div
                  title={`${m.label}: ${fmtMoney(m.revenue, currency)}`}
                  className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                  style={{
                    height: `${h}%`,
                    minHeight: m.revenue > 0 ? 2 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-12 gap-2">
          {months.map((m) => (
            <div key={m.key} className="text-[10px] text-muted-foreground text-center">
              {m.label.slice(0, 3)}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[15px]">Outstanding balances</h3>
            <strong className="text-destructive">
              {fmtMoney(totalOutstanding, currency)}
            </strong>
          </div>
          {outstanding.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <h4 className="text-foreground font-medium text-sm">All paid up!</h4>
              <p className="text-xs mt-1">No outstanding balances.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Patient</th>
                    <th className="px-4 py-2.5 text-left font-medium">Billed</th>
                    <th className="px-4 py-2.5 text-left font-medium">Paid</th>
                    <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((x) => (
                    <tr
                      key={x.patient.id}
                      className="border-t cursor-pointer hover:bg-muted/40"
                      onClick={() =>
                        navigate({
                          to: "/patients/$patientId",
                          params: { patientId: x.patient.id },
                        })
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{x.patient.name}</div>
                        <div className="text-xs text-muted-foreground">{x.patient.phone}</div>
                      </td>
                      <td className="px-4 py-3">{fmtMoney(x.totalBilled, currency)}</td>
                      <td className="px-4 py-3">{fmtMoney(x.totalPaid, currency)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-destructive">
                        {fmtMoney(x.balance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-[15px] mb-4">Payments by method</h3>
          {methodList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3.5">
              {methodList.map(([m, v]) => {
                const pct = methodTotal > 0 ? (v / methodTotal) * 100 : 0;
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium">{m}</span>
                      <span>
                        {fmtMoney(v, currency)}{" "}
                        <span className="text-muted-foreground">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
