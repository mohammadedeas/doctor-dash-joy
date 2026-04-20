import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultClinicState,
  type ClinicSettings,
  type ClinicState,
  type Patient,
  type Payment,
  type Procedure,
  type Visit,
} from "./clinic-types";
import { uid } from "./clinic-utils";
import * as api from "./api-client";

type Ctx = {
  state: ClinicState;
  loading: boolean;
  // patients
  upsertPatient: (data: Omit<Patient, "id" | "createdAt"> & { id?: string }) => Patient;
  deletePatient: (id: string) => void;
  // visits
  upsertVisit: (data: Omit<Visit, "id"> & { id?: string }) => Visit;
  deleteVisit: (id: string) => void;
  // payments
  upsertPayment: (data: Omit<Payment, "id"> & { id?: string }) => Payment;
  deletePayment: (id: string) => void;
  // settings
  updateSettings: (patch: Partial<ClinicSettings>) => void;
  setProcedures: (procs: Procedure[]) => void;
  // bulk
  replaceAll: (next: ClinicState) => void;
};

const ClinicContext = createContext<Ctx | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(() => structuredClone(defaultClinicState));
  const [loading, setLoading] = useState(true);

  // Fetch full state from backend on mount
  useEffect(() => {
    api
      .fetchState()
      .then((data) => {
        setState(data);
      })
      .catch((err) => {
        console.error("Failed to load state from backend:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Patients ────────────────────────────────────────────────────
  const upsertPatient: Ctx["upsertPatient"] = useCallback((data) => {
    let result!: Patient;
    if (data.id) {
      // Update existing — optimistic update
      setState((s) => {
        const i = s.patients.findIndex((p) => p.id === data.id);
        if (i === -1) return s;
        const updated = { ...s.patients[i], ...data, id: data.id } as Patient;
        result = updated;
        const next = s.patients.slice();
        next[i] = updated;
        return { ...s, patients: next };
      });
      // Persist to backend
      api.updatePatient(data.id, data).catch((err) => console.error("Update patient failed:", err));
    } else {
      // Create new — optimistic with temp id
      result = {
        id: uid(),
        createdAt: new Date().toISOString(),
        ...data,
      } as Patient;
      const tempId = result.id;
      setState((s) => ({ ...s, patients: [...s.patients, result] }));
      // Persist to backend — replace temp id with server id
      api
        .createPatient(data)
        .then((serverPatient) => {
          setState((s) => ({
            ...s,
            patients: s.patients.map((p) => (p.id === tempId ? serverPatient : p)),
          }));
          result = serverPatient;
        })
        .catch((err) => console.error("Create patient failed:", err));
    }
    return result;
  }, []);

  const deletePatient: Ctx["deletePatient"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      patients: s.patients.filter((p) => p.id !== id),
      visits: s.visits.filter((v) => v.patientId !== id),
      payments: s.payments.filter((p) => p.patientId !== id),
    }));
    api.deletePatient(id).catch((err) => console.error("Delete patient failed:", err));
  }, []);

  // ── Visits ──────────────────────────────────────────────────────
  const upsertVisit: Ctx["upsertVisit"] = useCallback((data) => {
    let result!: Visit;
    if (data.id) {
      setState((s) => {
        const i = s.visits.findIndex((v) => v.id === data.id);
        if (i === -1) return s;
        const updated = { ...s.visits[i], ...data, id: data.id } as Visit;
        result = updated;
        const next = s.visits.slice();
        next[i] = updated;
        return { ...s, visits: next };
      });
      api.updateVisit(data.id, data).catch((err) => console.error("Update visit failed:", err));
    } else {
      result = { id: uid(), ...data } as Visit;
      const tempId = result.id;
      setState((s) => ({ ...s, visits: [...s.visits, result] }));
      api
        .createVisit(data)
        .then((serverVisit) => {
          setState((s) => ({
            ...s,
            visits: s.visits.map((v) => (v.id === tempId ? serverVisit : v)),
          }));
          result = serverVisit;
        })
        .catch((err) => console.error("Create visit failed:", err));
    }
    return result;
  }, []);

  const deleteVisit: Ctx["deleteVisit"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      visits: s.visits.filter((v) => v.id !== id),
      payments: s.payments.filter((p) => p.visitId !== id),
    }));
    api.deleteVisit(id).catch((err) => console.error("Delete visit failed:", err));
  }, []);

  // ── Payments ────────────────────────────────────────────────────
  const upsertPayment: Ctx["upsertPayment"] = useCallback((data) => {
    let result!: Payment;
    if (data.id) {
      setState((s) => {
        const i = s.payments.findIndex((p) => p.id === data.id);
        if (i === -1) return s;
        const updated = { ...s.payments[i], ...data, id: data.id } as Payment;
        result = updated;
        const next = s.payments.slice();
        next[i] = updated;
        return { ...s, payments: next };
      });
      api.updatePayment(data.id, data).catch((err) => console.error("Update payment failed:", err));
    } else {
      result = { id: uid(), ...data } as Payment;
      const tempId = result.id;
      setState((s) => ({ ...s, payments: [...s.payments, result] }));
      api
        .createPayment(data)
        .then((serverPayment) => {
          setState((s) => ({
            ...s,
            payments: s.payments.map((p) => (p.id === tempId ? serverPayment : p)),
          }));
          result = serverPayment;
        })
        .catch((err) => console.error("Create payment failed:", err));
    }
    return result;
  }, []);

  const deletePayment: Ctx["deletePayment"] = useCallback((id) => {
    setState((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) }));
    api.deletePaymentApi(id).catch((err) => console.error("Delete payment failed:", err));
  }, []);

  // ── Settings ────────────────────────────────────────────────────
  const updateSettings: Ctx["updateSettings"] = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    api.updateSettingsApi(patch).catch((err) => console.error("Update settings failed:", err));
  }, []);

  const setProcedures: Ctx["setProcedures"] = useCallback((procs) => {
    setState((s) => ({ ...s, settings: { ...s.settings, commonProcedures: procs } }));
    api
      .updateSettingsApi({ commonProcedures: procs })
      .catch((err) => console.error("Update procedures failed:", err));
  }, []);

  // ── Bulk ────────────────────────────────────────────────────────
  const replaceAll: Ctx["replaceAll"] = useCallback((next) => {
    setState(next);
    api.replaceState(next).catch((err) => console.error("Replace state failed:", err));
  }, []);



  const value = useMemo<Ctx>(
    () => ({
      state,
      loading,
      upsertPatient,
      deletePatient,
      upsertVisit,
      deleteVisit,
      upsertPayment,
      deletePayment,
      updateSettings,
      setProcedures,
      replaceAll,
    }),
    [
      state,
      loading,
      upsertPatient,
      deletePatient,
      upsertVisit,
      deleteVisit,
      upsertPayment,
      deletePayment,
      updateSettings,
      setProcedures,
      replaceAll,
    ]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used within ClinicProvider");
  return ctx;
}

export function useCurrency() {
  return useClinic().state.settings.currency;
}
