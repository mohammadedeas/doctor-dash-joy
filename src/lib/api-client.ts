import type { ClinicState, ClinicSettings, Patient, Visit, Payment, Procedure, Appointment } from "./clinic-types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("clinic_auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
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

// ── Appointments ────────────────────────────────────────────────────
export const fetchAppointments = () => request<Appointment[]>("/appointments");
export const fetchAppointmentsToday = () => request<Appointment[]>("/appointments/today");
export const fetchAppointmentsUpcoming = () => request<Appointment[]>("/appointments/upcoming");

export const createAppointment = (data: Omit<Appointment, "id" | "createdAt">) =>
  request<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAppointment = (id: string, data: Partial<Appointment>) =>
  request<Appointment>(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAppointmentApi = (id: string) =>
  request<{ success: boolean }>(`/appointments/${id}`, { method: "DELETE" });
