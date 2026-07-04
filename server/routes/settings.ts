import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";
import { requireAdmin } from "./auth.js";
import { handleError } from "../lib/http.js";
import { validateBody, settingsUpdateSchema } from "../lib/schemas.js";

const router = Router();

// ── Get settings ────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await getSettings());
  } catch (err) {
    handleError(res, err, "settings");
  }
});

// ── Update settings ─────────────────────────────────────────────────
router.put("/", validateBody(settingsUpdateSchema), async (req: Request, res: Response) => {
  try {
    const { clinicName, currency, commonProcedures } = req.body;
    const tx = await db.transaction("write");

    try {
      if (clinicName !== undefined) {
        await tx.execute({
          sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          args: ["clinicName", clinicName]
        });
      }
      if (currency !== undefined) {
        await tx.execute({
          sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          args: ["currency", currency]
        });
      }
      if (commonProcedures !== undefined) {
        await tx.execute({
          sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          args: ["commonProcedures", JSON.stringify(commonProcedures)]
        });
      }
      await tx.commit();
      res.json(await getSettings());
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    handleError(res, err, "settings");
  }
});

// ── Get full state (patients + visits + payments + appointments + settings) ────────
router.get("/state", async (_req: Request, res: Response) => {
  try {
    res.json(await getFullState());
  } catch (err) {
    handleError(res, err, "settings");
  }
});

// ── Replace all state (import) ──────────────────────────────────────
router.put("/state", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { patients, visits, payments, appointments, settings } = req.body;
    const tx = await db.transaction("write");

    try {
      // Clear everything
      await tx.execute("DELETE FROM tooth_treatments");
      await tx.execute("DELETE FROM visit_procedures");
      await tx.execute("DELETE FROM payments");
      await tx.execute("DELETE FROM visits");
      await tx.execute("DELETE FROM appointments");
      await tx.execute("DELETE FROM patients");

      // Insert patients
      for (const p of patients || []) {
        await tx.execute({
          sql: `
            INSERT INTO patients (id, name, phone, email, dob, gender, address, medical_notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            p.id, p.name, p.phone || "", p.email || "", p.dob || "",
            p.gender || "", p.address || "", p.medicalNotes || "", p.createdAt || new Date().toISOString()
          ]
        });
      }

      // Insert tooth treatments
      for (const t of (req.body.toothTreatments || [])) {
        await tx.execute({
          sql: `
            INSERT INTO tooth_treatments (id, patient_id, visit_id, tooth_number, procedure, status, notes, cost, created_at, doctor_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            t.id, t.patientId, t.visitId, t.toothNumber, t.procedure,
            t.status || "Planned", t.notes || "", t.cost || 0,
            t.createdAt || new Date().toISOString(), t.doctorName || ""
          ]
        });
      }

      // Insert visits + procedures
      for (const v of visits || []) {
        await tx.execute({
          sql: "INSERT INTO visits (id, patient_id, date, total_cost, notes) VALUES (?, ?, ?, ?, ?)",
          args: [v.id, v.patientId, v.date, v.totalCost || 0, v.notes || ""]
        });
        if (Array.isArray(v.procedures)) {
          for (const proc of v.procedures) {
            await tx.execute({
              sql: "INSERT INTO visit_procedures (visit_id, name, cost) VALUES (?, ?, ?)",
              args: [v.id, proc.name, proc.cost || 0]
            });
          }
        }
      }

      // Insert payments
      for (const p of payments || []) {
        const procNamesStr = Array.isArray(p.procedureNames) ? p.procedureNames.join(", ") : "";
        await tx.execute({
          sql: `
            INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes, procedure_names)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            p.id, p.patientId, p.visitId || null, p.date,
            p.amount || 0, p.method || "Cash", p.notes || "", procNamesStr
          ]
        });
      }

      // Insert appointments
      for (const a of appointments || []) {
        await tx.execute({
          sql: `
            INSERT INTO appointments (id, patient_id, patient_name, phone, visit_type, dentist_name, date, start_time, end_time, notes, status, payment_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            a.id, a.patientId, a.patientName, a.phone || "", a.visitType || "", a.dentistName || "",
            a.date, a.startTime, a.endTime, a.notes || "", a.status || "pending", a.paymentStatus || "unpaid",
            a.createdAt || new Date().toISOString()
          ]
        });
      }

      // Update settings
      if (settings) {
        if (settings.clinicName) {
          await tx.execute({
            sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            args: ["clinicName", settings.clinicName]
          });
        }
        if (settings.currency) {
          await tx.execute({
            sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            args: ["currency", settings.currency]
          });
        }
        if (settings.commonProcedures) {
          await tx.execute({
            sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            args: ["commonProcedures", JSON.stringify(settings.commonProcedures)]
          });
        }
      }
      
      await tx.commit();
      res.json(await getFullState());
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    handleError(res, err, "settings");
  }
});

// ── Clear all data ──────────────────────────────────────────────────
router.delete("/state", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const tx = await db.transaction("write");
    try {
      await tx.execute("DELETE FROM visit_procedures");
      await tx.execute("DELETE FROM payments");
      await tx.execute("DELETE FROM visits");
      await tx.execute("DELETE FROM appointments");
      await tx.execute("DELETE FROM patients");
      
      // Reset settings to defaults
      await tx.execute({ sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: ["clinicName", "My Dental Clinic"] });
      await tx.execute({ sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: ["currency", "ILS"] });
      await tx.execute({
        sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        args: [
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
        ]
      });
      await tx.commit();
      res.json(await getFullState());
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    handleError(res, err, "settings");
  }
});

// ── Helpers ─────────────────────────────────────────────────────────
async function getSettings() {
  const rs = await db.execute("SELECT key, value FROM settings");
  const map: Record<string, string> = {};
  for (const r of rs.rows) map[r.key as string] = r.value as string;

  return {
    clinicName: map.clinicName || "My Dental Clinic",
    currency: map.currency || "ILS",
    commonProcedures: map.commonProcedures ? JSON.parse(map.commonProcedures) : [],
  };
}

async function getFullState() {
  // Patients
  const patientRs = await db.execute("SELECT * FROM patients ORDER BY name ASC");
  const patients = patientRs.rows.map((r) => ({
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
  const visitRs = await db.execute("SELECT * FROM visits ORDER BY date DESC");
  const visitIds = visitRs.rows.map((r) => r.id as string);
  const procsByVisit = new Map<string, { name: string; cost: number }[]>();
  if (visitIds.length > 0) {
    const placeholders = visitIds.map(() => "?").join(",");
    const procsRs = await db.execute({
      sql: `SELECT visit_id, name, cost FROM visit_procedures WHERE visit_id IN (${placeholders})`,
      args: visitIds,
    });
    for (const p of procsRs.rows) {
      const list = procsByVisit.get(p.visit_id as string) || [];
      list.push({ name: p.name as string, cost: p.cost as number });
      procsByVisit.set(p.visit_id as string, list);
    }
  }
  const visits = visitRs.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    date: r.date,
    procedures: procsByVisit.get(r.id as string) || [],
    totalCost: r.total_cost,
    notes: r.notes || undefined,
  }));

  // Payments
  const paymentRs = await db.execute("SELECT * FROM payments ORDER BY date DESC");
  const payments = paymentRs.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    visitId: r.visit_id || undefined,
    date: r.date,
    amount: r.amount,
    method: r.method,
    notes: r.notes || undefined,
    procedureNames: r.procedure_names
      ? String(r.procedure_names).split(", ").filter(Boolean)
      : undefined,
  }));

  // Appointments
  const apptRs = await db.execute("SELECT * FROM appointments ORDER BY date ASC, start_time ASC");
  const appointments = apptRs.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    phone: r.phone || undefined,
    visitType: r.visit_type,
    dentistName: r.dentist_name,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    notes: r.notes || undefined,
    status: r.status,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  }));

  // Tooth Treatments
  const ttRs = await db.execute("SELECT * FROM tooth_treatments ORDER BY created_at DESC");
  const toothTreatments = ttRs.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    visitId: r.visit_id,
    toothNumber: r.tooth_number,
    procedure: r.procedure,
    status: r.status,
    notes: r.notes || undefined,
    cost: r.cost || 0,
    createdAt: r.created_at,
    doctorName: r.doctor_name || undefined,
  }));

  return {
    patients,
    visits,
    payments,
    appointments,
    toothTreatments,
    settings: await getSettings(),
  };
}

export default router;
