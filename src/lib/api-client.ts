import type { ClinicState, ClinicSettings, Patient, Visit, Payment, Procedure, Appointment, ToothTreatment } from "./clinic-types";

export const AUTH_TOKEN_KEY = "clinic_auth_token";

const BASE = "/api";

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
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

// ── Tooth Treatments ────────────────────────────────────────────────
export const fetchToothTreatments = (params?: { patientId?: string; visitId?: string }) => {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return request<ToothTreatment[]>(`/tooth-treatments${qs}`);
};

export const createToothTreatment = (data: Omit<ToothTreatment, "id" | "createdAt">) =>
  request<ToothTreatment>("/tooth-treatments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateToothTreatment = (id: string, data: Partial<ToothTreatment>) =>
  request<ToothTreatment>(`/tooth-treatments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteToothTreatment = (id: string) =>
  request<{ success: boolean }>(`/tooth-treatments/${id}`, { method: "DELETE" });

// ── Dental Chart (clinical findings) ───────────────────────────────
export const fetchDentalChart = (patientId: string) =>
  request<{ patientId: string; teeth: Record<number, unknown>; updatedAt: string | null }>(
    `/dental-chart/${patientId}`
  );

export const saveDentalChart = (patientId: string, teeth: Record<number, unknown>) =>
  request<{ patientId: string; teeth: Record<number, unknown>; updatedAt: string }>(
    `/dental-chart/${patientId}`,
    { method: "PUT", body: JSON.stringify({ teeth }) }
  );
