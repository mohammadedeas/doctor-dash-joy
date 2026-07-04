import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  uid,
  todayISO,
  formatLocalDate,
  initials,
  fmtMoney,
  fmtDate,
  calcAge,
  patientStats,
  visitPaymentStatus,
} from "./clinic-utils";
import type { ClinicState, Visit, Payment } from "./clinic-types";

describe("uid", () => {
  it("returns a non-empty string", () => {
    const id = uid();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, uid));
    expect(ids.size).toBe(100);
  });
});

describe("formatLocalDate", () => {
  it("formats a date correctly in local time", () => {
    const d = new Date(2026, 8, 15); // Sep 15 2026
    expect(formatLocalDate(d)).toBe("2026-09-15");
  });

  it("pads single-digit months and days", () => {
    const d = new Date(2026, 0, 5); // Jan 5 2026
    expect(formatLocalDate(d)).toBe("2026-01-05");
  });
});

describe("todayISO", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns today's date in YYYY-MM-DD format", () => {
    vi.setSystemTime(new Date(2026, 8, 15, 12, 0, 0));
    expect(todayISO()).toBe("2026-09-15");
  });

  it("does not shift to previous day at early hours", () => {
    vi.setSystemTime(new Date(2026, 8, 15, 1, 0, 0));
    expect(todayISO()).toBe("2026-09-15");
  });
});

describe("initials", () => {
  it("returns first letters of each word", () => {
    expect(initials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(initials("Alice")).toBe("A");
  });

  it("returns ? for empty/undefined", () => {
    expect(initials("")).toBe("?");
    expect(initials(undefined)).toBe("?");
  });

  it("limits to 2 characters", () => {
    expect(initials("John Jacob Jingleheimer")).toBe("JJ");
  });
});

describe("fmtMoney", () => {
  it("formats with 2 decimal places", () => {
    expect(fmtMoney(1234.5, "ILS")).toBe("ILS 1,234.50");
  });

  it("handles undefined", () => {
    expect(fmtMoney(undefined, "USD")).toBe("USD 0.00");
  });

  it("handles zero", () => {
    expect(fmtMoney(0, "EUR")).toBe("EUR 0.00");
  });
});

describe("fmtDate", () => {
  it("formats an ISO date string", () => {
    const result = fmtDate("2026-09-15");
    expect(result).toContain("Sep");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("returns — for empty/undefined", () => {
    expect(fmtDate("")).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
  });
});

describe("calcAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 14)); // May 14 2026
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates age correctly", () => {
    expect(calcAge("2000-05-14")).toBe(26);
  });

  it("subtracts 1 if birthday hasn't occurred yet", () => {
    expect(calcAge("2000-06-01")).toBe(25);
  });

  it("returns null for invalid date", () => {
    expect(calcAge("not-a-date")).toBeNull();
  });
});

describe("patientStats", () => {
  it("calculates totals correctly", () => {
    const state: ClinicState = {
      patients: [],
      visits: [
        { id: "v1", patientId: "p1", date: "2026-01-01", procedures: [], totalCost: 500 },
        { id: "v2", patientId: "p1", date: "2026-02-01", procedures: [], totalCost: 300 },
      ],
      payments: [
        { id: "pay1", patientId: "p1", visitId: null, date: "2026-01-01", amount: 200, method: "Cash" },
        { id: "pay2", patientId: "p1", visitId: null, date: "2026-02-01", amount: 150, method: "Cash" },
      ],
      appointments: [],
      toothTreatments: [],
      settings: { clinicName: "Test", currency: "ILS", commonProcedures: [] },
    };
    const stats = patientStats(state, "p1");
    expect(stats.totalBilled).toBe(800);
    expect(stats.totalPaid).toBe(350);
    expect(stats.balance).toBe(450);
    expect(stats.visitCount).toBe(2);
  });

  it("handles patient with no visits or payments", () => {
    const state: ClinicState = {
      patients: [],
      visits: [],
      payments: [],
      appointments: [],
      toothTreatments: [],
      settings: { clinicName: "Test", currency: "ILS", commonProcedures: [] },
    };
    const stats = patientStats(state, "p1");
    expect(stats.totalBilled).toBe(0);
    expect(stats.totalPaid).toBe(0);
    expect(stats.balance).toBe(0);
    expect(stats.visitCount).toBe(0);
  });
});

describe("visitPaymentStatus", () => {
  it("returns Paid when fully paid", () => {
    const state: ClinicState = {
      patients: [],
      visits: [],
      payments: [
        { id: "p1", patientId: "pt1", visitId: "v1", date: "2026-01-01", amount: 500, method: "Cash" },
      ],
      appointments: [],
      toothTreatments: [],
      settings: { clinicName: "Test", currency: "ILS", commonProcedures: [] },
    };
    const visit: Visit = { id: "v1", patientId: "pt1", date: "2026-01-01", procedures: [], totalCost: 500 };
    const status = visitPaymentStatus(state, visit);
    expect(status.label).toBe("Paid");
    expect(status.tone).toBe("success");
  });

  it("returns Partial when partially paid", () => {
    const state: ClinicState = {
      patients: [],
      visits: [],
      payments: [
        { id: "p1", patientId: "pt1", visitId: "v1", date: "2026-01-01", amount: 200, method: "Cash" },
      ],
      appointments: [],
      toothTreatments: [],
      settings: { clinicName: "Test", currency: "ILS", commonProcedures: [] },
    };
    const visit: Visit = { id: "v1", patientId: "pt1", date: "2026-01-01", procedures: [], totalCost: 500 };
    const status = visitPaymentStatus(state, visit);
    expect(status.label).toBe("Partial");
    expect(status.tone).toBe("warn");
  });

  it("returns Unpaid when nothing paid", () => {
    const state: ClinicState = {
      patients: [],
      visits: [],
      payments: [],
      appointments: [],
      toothTreatments: [],
      settings: { clinicName: "Test", currency: "ILS", commonProcedures: [] },
    };
    const visit: Visit = { id: "v1", patientId: "pt1", date: "2026-01-01", procedures: [], totalCost: 500 };
    const status = visitPaymentStatus(state, visit);
    expect(status.label).toBe("Unpaid");
    expect(status.tone).toBe("destructive");
  });

  it("returns Unpaid when totalCost is 0", () => {
    const state: ClinicState = {
      patients: [],
      visits: [],
      payments: [],
      appointments: [],
      toothTreatments: [],
      settings: { clinicName: "Test", currency: "ILS", commonProcedures: [] },
    };
    const visit: Visit = { id: "v1", patientId: "pt1", date: "2026-01-01", procedures: [], totalCost: 0 };
    const status = visitPaymentStatus(state, visit);
    expect(status.label).toBe("Unpaid");
    expect(status.tone).toBe("destructive");
  });
});
