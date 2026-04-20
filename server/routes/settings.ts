import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── Get settings ────────────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  res.json(getSettings());
});

// ── Update settings ─────────────────────────────────────────────────
router.put("/", (req: Request, res: Response) => {
  const { clinicName, currency, commonProcedures } = req.body;
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  const tx = db.transaction(() => {
    if (clinicName !== undefined) upsert.run("clinicName", clinicName);
    if (currency !== undefined) upsert.run("currency", currency);
    if (commonProcedures !== undefined) upsert.run("commonProcedures", JSON.stringify(commonProcedures));
  });
  tx();

  res.json(getSettings());
});

// ── Get full state (patients + visits + payments + settings) ────────
router.get("/state", (_req: Request, res: Response) => {
  res.json(getFullState());
});

// ── Replace all state (import) ──────────────────────────────────────
router.put("/state", (req: Request, res: Response) => {
  const { patients, visits, payments, settings } = req.body;

  const tx = db.transaction(() => {
    // Clear everything
    db.prepare("DELETE FROM visit_procedures").run();
    db.prepare("DELETE FROM payments").run();
    db.prepare("DELETE FROM visits").run();
    db.prepare("DELETE FROM patients").run();

    // Insert patients
    const insertPatient = db.prepare(`
      INSERT INTO patients (id, name, phone, email, dob, gender, address, medical_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of patients || []) {
      insertPatient.run(
        p.id, p.name, p.phone || "", p.email || "", p.dob || "",
        p.gender || "", p.address || "", p.medicalNotes || "", p.createdAt || new Date().toISOString()
      );
    }

    // Insert visits + procedures
    const insertVisit = db.prepare(`
      INSERT INTO visits (id, patient_id, date, total_cost, notes) VALUES (?, ?, ?, ?, ?)
    `);
    const insertProc = db.prepare(`
      INSERT INTO visit_procedures (visit_id, name, cost) VALUES (?, ?, ?)
    `);
    for (const v of visits || []) {
      insertVisit.run(v.id, v.patientId, v.date, v.totalCost || 0, v.notes || "");
      if (Array.isArray(v.procedures)) {
        for (const proc of v.procedures) {
          insertProc.run(v.id, proc.name, proc.cost || 0);
        }
      }
    }

    // Insert payments
    const insertPayment = db.prepare(`
      INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of payments || []) {
      insertPayment.run(
        p.id, p.patientId, p.visitId || null, p.date,
        p.amount || 0, p.method || "Cash", p.notes || ""
      );
    }

    // Update settings
    if (settings) {
      const upsert = db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      );
      if (settings.clinicName) upsert.run("clinicName", settings.clinicName);
      if (settings.currency) upsert.run("currency", settings.currency);
      if (settings.commonProcedures) upsert.run("commonProcedures", JSON.stringify(settings.commonProcedures));
    }
  });
  tx();

  res.json(getFullState());
});

// ── Clear all data ──────────────────────────────────────────────────
router.delete("/state", (_req: Request, res: Response) => {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM visit_procedures").run();
    db.prepare("DELETE FROM payments").run();
    db.prepare("DELETE FROM visits").run();
    db.prepare("DELETE FROM patients").run();
    // Reset settings to defaults
    const upsert = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    );
    upsert.run("clinicName", "My Dental Clinic");
    upsert.run("currency", "ILS");
    upsert.run(
      "commonProcedures",
      JSON.stringify([
        { name: "Consultation", cost: 100 },
        { name: "Cleaning", cost: 200 },
        { name: "Filling", cost: 300 },
        { name: "Root Canal", cost: 1500 },
        { name: "Extraction", cost: 400 },
        { name: "Crown", cost: 2000 },
        { name: "X-Ray", cost: 80 },
        { name: "Whitening", cost: 800 },
      ])
    );
  });
  tx();

  res.json(getFullState());
});

// ── Helpers ─────────────────────────────────────────────────────────
function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    clinicName: map.clinicName || "My Dental Clinic",
    currency: map.currency || "ILS",
    commonProcedures: map.commonProcedures ? JSON.parse(map.commonProcedures) : [],
  };
}

function getFullState() {
  // Patients
  const patientRows = db.prepare("SELECT * FROM patients ORDER BY name ASC").all() as any[];
  const patients = patientRows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone || undefined,
    email: r.email || undefined,
    dob: r.dob || undefined,
    gender: r.gender || undefined,
    address: r.address || undefined,
    medicalNotes: r.medical_notes || undefined,
    createdAt: r.created_at,
  }));

  // Visits
  const visitRows = db.prepare("SELECT * FROM visits ORDER BY date DESC").all() as any[];
  const visits = visitRows.map((r) => {
    const procs = db
      .prepare("SELECT name, cost FROM visit_procedures WHERE visit_id = ?")
      .all(r.id) as { name: string; cost: number }[];
    return {
      id: r.id,
      patientId: r.patient_id,
      date: r.date,
      procedures: procs,
      totalCost: r.total_cost,
      notes: r.notes || undefined,
    };
  });

  // Payments
  const paymentRows = db.prepare("SELECT * FROM payments ORDER BY date DESC").all() as any[];
  const payments = paymentRows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    visitId: r.visit_id || null,
    date: r.date,
    amount: r.amount,
    method: r.method,
    notes: r.notes || undefined,
  }));

  return {
    patients,
    visits,
    payments,
    settings: getSettings(),
  };
}

export default router;
