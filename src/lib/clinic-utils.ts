import type { ClinicState, Visit } from "./clinic-types";

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const fmtMoney = (n: number | undefined, currency: string) =>
  `${currency} ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const fmtDate = (d?: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function patientStats(state: ClinicState, patientId: string) {
  const visits = state.visits.filter((v) => v.patientId === patientId);
  const payments = state.payments.filter((p) => p.patientId === patientId);
  const totalBilled = visits.reduce((s, v) => s + (v.totalCost || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  return {
    totalBilled,
    totalPaid,
    balance: totalBilled - totalPaid,
    visitCount: visits.length,
  };
}

export type VisitStatus = {
  label: "Paid" | "Partial" | "Unpaid";
  variant: "paid" | "partial" | "unpaid";
  paid: number;
};

export function visitPaymentStatus(state: ClinicState, visit: Visit): VisitStatus {
  const paid = state.payments
    .filter((p) => p.visitId === visit.id)
    .reduce((s, p) => s + p.amount, 0);
  const total = visit.totalCost || 0;
  if (paid >= total && total > 0) return { label: "Paid", variant: "paid", paid };
  if (paid > 0) return { label: "Partial", variant: "partial", paid };
  return { label: "Unpaid", variant: "unpaid", paid };
}
