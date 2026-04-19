export type Procedure = { name: string; cost: number };

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
  settings: ClinicSettings;
};

export const defaultClinicState: ClinicState = {
  patients: [],
  visits: [],
  payments: [],
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
