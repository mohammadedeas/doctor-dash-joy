import type { ClinicState, Visit } from "./clinic-types";
import type { BadgeTone } from "@/components/status-badge";

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const todayISO = () => formatLocalDate(new Date());

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

export const calcAge = (dob?: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export function clinicFinancialSummary(state: ClinicState) {
  const totalBilled = state.visits.reduce((s, v) => s + (v.totalCost || 0), 0);
  const totalPaid = state.payments.reduce((s, p) => s + (p.amount || 0), 0);
  return { totalBilled, totalPaid, outstanding: totalBilled - totalPaid };
}

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
  tone: BadgeTone;
  paid: number;
};

export function visitPaymentStatus(state: ClinicState, visit: Visit): VisitStatus {
  const paid = state.payments
    .filter((p) => p.visitId === visit.id)
    .reduce((s, p) => s + p.amount, 0);
  const total = visit.totalCost || 0;
  if (paid >= total && total > 0) return { label: "Paid", tone: "success", paid };
  if (paid > 0) return { label: "Partial", tone: "warn", paid };
  return { label: "Unpaid", tone: "destructive", paid };
}

const APPOINTMENT_STATUS_TONE: Record<string, BadgeTone> = {
  confirmed: "info",
  pending: "warn",
  completed: "success",
  cancelled: "destructive",
};

export function appointmentStatusTone(status: string): BadgeTone {
  return APPOINTMENT_STATUS_TONE[status] ?? "neutral";
}
