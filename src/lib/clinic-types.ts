export type Procedure = { name: string; cost: number };

export type TreatmentStatus = "Planned" | "In Progress" | "Completed" | "Cancelled" | "Referred" | "Failed";

export interface ToothTreatment {
  id: string;
  patientId: string;
  visitId: string;
  toothNumber: number;
  procedure: string;
  status: TreatmentStatus;
  notes?: string;
  cost?: number;
  createdAt: string;
  doctorName?: string;
}

export type Patient = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | "";
  address?: string;
  medicalNotes?: string;
  createdAt: string;
};

export type Visit = {
  id: string;
  patientId: string;
  date: string;
  procedures: Procedure[];
  totalCost: number;
  notes?: string;
};

export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Insurance" | "Other";

export type Payment = {
  id: string;
  patientId: string;
  visitId: string | null;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  procedureNames?: string[];
};

export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";
export type AppointmentPaymentStatus = "paid" | "partial" | "unpaid";

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  phone?: string;
  visitType: string;
  dentistName: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
  createdAt: string;
};

export type ClinicSettings = {
  clinicName: string;
  currency: string;
  commonProcedures: Procedure[];
};

export type ClinicState = {
  patients: Patient[];
  visits: Visit[];
  payments: Payment[];
  appointments: Appointment[];
  toothTreatments: ToothTreatment[];
  settings: ClinicSettings;
};

export const defaultClinicState: ClinicState = {
  patients: [],
  visits: [],
  payments: [],
  appointments: [],
  toothTreatments: [],
  settings: {
    clinicName: "My Dental Clinic",
    currency: "ILS",
    commonProcedures: [
      { name: "Consultation", cost: 100 },
      { name: "Cleaning", cost: 200 },
      { name: "Filling", cost: 300 },
      { name: "Root Canal", cost: 1500 },
      { name: "Extraction", cost: 400 },
      { name: "Crown", cost: 2000 },
      { name: "X-Ray", cost: 80 },
      { name: "Whitening", cost: 800 },
    ],
  },
};

/** Validate and normalize potentially corrupted localStorage state */
export function normalizeClinicState(raw: unknown): ClinicState {
  if (!raw || typeof raw !== "object") return structuredClone(defaultClinicState);
  const data = raw as Partial<ClinicState>;
  return {
    patients: Array.isArray(data.patients) ? data.patients : [],
    visits: Array.isArray(data.visits) ? data.visits : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
    toothTreatments: Array.isArray(data.toothTreatments) ? data.toothTreatments : [],
    settings: {
      clinicName: data.settings?.clinicName || defaultClinicState.settings.clinicName,
      currency: data.settings?.currency || defaultClinicState.settings.currency,
      commonProcedures: Array.isArray(data.settings?.commonProcedures)
        ? data.settings.commonProcedures
        : defaultClinicState.settings.commonProcedures,
    },
  };
}
