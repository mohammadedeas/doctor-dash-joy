import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── Get settings ────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await getSettings());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Update settings ─────────────────────────────────────────────────
router.put("/", async (req: Request, res: Response) => {
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
    res.status(500).json({ error: String(err) });
  }
});

// ── Get full state (patients + visits + payments + settings) ────────
router.get("/state", async (_req: Request, res: Response) => {
  try {
    res.json(await getFullState());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Replace all state (import) ──────────────────────────────────────
router.put("/state", async (req: Request, res: Response) => {
  try {
    const { patients, visits, payments, settings } = req.body;
    const tx = await db.transaction("write");

    try {
      // Clear everything
      await tx.execute("DELETE FROM visit_procedures");
      await tx.execute("DELETE FROM payments");
      await tx.execute("DELETE FROM visits");
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
        await tx.execute({
          sql: `
            INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            p.id, p.patientId, p.visitId || null, p.date,
            p.amount || 0, p.method || "Cash", p.notes || ""
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
    res.status(500).json({ error: String(err) });
  }
});

// ── Clear all data ──────────────────────────────────────────────────
router.delete("/state", async (_req: Request, res: Response) => {
  try {
    const tx = await db.transaction("write");
    try {
      await tx.execute("DELETE FROM visit_procedures");
      await tx.execute("DELETE FROM payments");
      await tx.execute("DELETE FROM visits");
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
    res.status(500).json({ error: String(err) });
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
  const visits = await Promise.all(visitRs.rows.map(async (r) => {
    const procsRs = await db.execute({
      sql: "SELECT name, cost FROM visit_procedures WHERE visit_id = ?",
      args: [r.id]
    });
    return {
      id: r.id,
      patientId: r.patient_id,
      date: r.date,
      procedures: procsRs.rows,
      totalCost: r.total_cost,
      notes: r.notes || undefined,
    };
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
  }));

  return {
    patients,
    visits,
    payments,
    settings: await getSettings(),
  };
}

export default router;
