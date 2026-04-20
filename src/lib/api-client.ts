import type { ClinicState, ClinicSettings, Patient, Visit, Payment, Procedure } from "./clinic-types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Full state ──────────────────────────────────────────────────────
export const fetchState = () => request<ClinicState>("/settings/state");

export const replaceState = (state: ClinicState) =>
  request<ClinicState>("/settings/state", {
    method: "PUT",
    body: JSON.stringify(state),
  });


// ── Patients ────────────────────────────────────────────────────────
export const createPatient = (data: Omit<Patient, "id" | "createdAt">) =>
  request<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (id: string, data: Partial<Patient>) =>
  request<Patient>(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (id: string) =>
  request<{ success: boolean }>(`/patients/${id}`, { method: "DELETE" });

// ── Visits ──────────────────────────────────────────────────────────
export const createVisit = (data: Omit<Visit, "id">) =>
  request<Visit>("/visits", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateVisit = (id: string, data: Partial<Visit>) =>
  request<Visit>(`/visits/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteVisit = (id: string) =>
  request<{ success: boolean }>(`/visits/${id}`, { method: "DELETE" });

// ── Payments ────────────────────────────────────────────────────────
export const createPayment = (data: Omit<Payment, "id">) =>
  request<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePayment = (id: string, data: Partial<Payment>) =>
  request<Payment>(`/payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePaymentApi = (id: string) =>
  request<{ success: boolean }>(`/payments/${id}`, { method: "DELETE" });

// ── Settings ────────────────────────────────────────────────────────
export const updateSettingsApi = (data: Partial<ClinicSettings>) =>
  request<ClinicSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
