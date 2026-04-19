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

const STORAGE_KEY = "dentalClinic.v1";

function load(): ClinicState {
  if (typeof window === "undefined") return structuredClone(defaultClinicState);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultClinicState);
    const parsed = JSON.parse(raw) as Partial<ClinicState>;
    return {
      patients: parsed.patients || [],
      visits: parsed.visits || [],
      payments: parsed.payments || [],
      settings: { ...defaultClinicState.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(defaultClinicState);
  }
}

type Ctx = {
  state: ClinicState;
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
  clearAll: () => void;
};

const ClinicContext = createContext<Ctx | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(() => load());
  const [hydrated, setHydrated] = useState(false);

  // Re-hydrate from localStorage on mount (in case SSR returned defaults)
  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state, hydrated]);

  const upsertPatient: Ctx["upsertPatient"] = useCallback((data) => {
    let result!: Patient;
    setState((s) => {
      if (data.id) {
        const i = s.patients.findIndex((p) => p.id === data.id);
        if (i === -1) return s;
        const updated = { ...s.patients[i], ...data, id: data.id } as Patient;
        result = updated;
        const next = s.patients.slice();
        next[i] = updated;
        return { ...s, patients: next };
      }
      result = {
        id: uid(),
        createdAt: new Date().toISOString(),
        ...data,
      } as Patient;
      return { ...s, patients: [...s.patients, result] };
    });
    return result;
  }, []);

  const deletePatient: Ctx["deletePatient"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      patients: s.patients.filter((p) => p.id !== id),
      visits: s.visits.filter((v) => v.patientId !== id),
      payments: s.payments.filter((p) => p.patientId !== id),
    }));
  }, []);

  const upsertVisit: Ctx["upsertVisit"] = useCallback((data) => {
    let result!: Visit;
    setState((s) => {
      if (data.id) {
        const i = s.visits.findIndex((v) => v.id === data.id);
        if (i === -1) return s;
        const updated = { ...s.visits[i], ...data, id: data.id } as Visit;
        result = updated;
        const next = s.visits.slice();
        next[i] = updated;
        return { ...s, visits: next };
      }
      result = { id: uid(), ...data } as Visit;
      return { ...s, visits: [...s.visits, result] };
    });
    return result;
  }, []);

  const deleteVisit: Ctx["deleteVisit"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      visits: s.visits.filter((v) => v.id !== id),
      payments: s.payments.filter((p) => p.visitId !== id),
    }));
  }, []);

  const upsertPayment: Ctx["upsertPayment"] = useCallback((data) => {
    let result!: Payment;
    setState((s) => {
      if (data.id) {
        const i = s.payments.findIndex((p) => p.id === data.id);
        if (i === -1) return s;
        const updated = { ...s.payments[i], ...data, id: data.id } as Payment;
        result = updated;
        const next = s.payments.slice();
        next[i] = updated;
        return { ...s, payments: next };
      }
      result = { id: uid(), ...data } as Payment;
      return { ...s, payments: [...s.payments, result] };
    });
    return result;
  }, []);

  const deletePayment: Ctx["deletePayment"] = useCallback((id) => {
    setState((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) }));
  }, []);

  const updateSettings: Ctx["updateSettings"] = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const setProcedures: Ctx["setProcedures"] = useCallback((procs) => {
    setState((s) => ({ ...s, settings: { ...s.settings, commonProcedures: procs } }));
  }, []);

  const replaceAll: Ctx["replaceAll"] = useCallback((next) => setState(next), []);
  const clearAll: Ctx["clearAll"] = useCallback(
    () => setState(structuredClone(defaultClinicState)),
    []
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      upsertPatient,
      deletePatient,
      upsertVisit,
      deleteVisit,
      upsertPayment,
      deletePayment,
      updateSettings,
      setProcedures,
      replaceAll,
      clearAll,
    }),
    [
      state,
      upsertPatient,
      deletePatient,
      upsertVisit,
      deleteVisit,
      upsertPayment,
      deletePayment,
      updateSettings,
      setProcedures,
      replaceAll,
      clearAll,
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
