import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── List all payments ───────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rs = await db.execute("SELECT * FROM payments ORDER BY date DESC");
    const payments = rs.rows.map(mapRow);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Get single payment ──────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({ sql: "SELECT * FROM payments WHERE id = ?", args: [req.params.id] });
    const row = rs.rows[0];
    if (!row) return res.status(404).json({ error: "Payment not found" });
    res.json(mapRow(row));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Create payment ──────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const { patientId, visitId, date, amount, method, notes } = req.body;
  if (!patientId || !date) return res.status(400).json({ error: "patientId and date are required" });

  const id = randomUUID().slice(0, 12);

  try {
    await db.execute({
      sql: `
        INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, patientId, visitId || null, date, amount || 0, method || "Cash", notes || ""]
    });

    const rs = await db.execute({ sql: "SELECT * FROM payments WHERE id = ?", args: [id] });
    res.status(201).json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Update payment ──────────────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({ sql: "SELECT * FROM payments WHERE id = ?", args: [req.params.id] });
    const existing = rsEx.rows[0];
    if (!existing) return res.status(404).json({ error: "Payment not found" });

    const { patientId, visitId, date, amount, method, notes } = req.body;

    await db.execute({
      sql: `
        UPDATE payments SET patient_id = ?, visit_id = ?, date = ?, amount = ?, method = ?, notes = ?
        WHERE id = ?
      `,
      args: [
        patientId ?? existing.patient_id,
        visitId ?? existing.visit_id,
        date ?? existing.date,
        amount ?? existing.amount,
        method ?? existing.method,
        notes ?? existing.notes,
        req.params.id
      ]
    });

    const rs = await db.execute({ sql: "SELECT * FROM payments WHERE id = ?", args: [req.params.id] });
    res.json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Delete payment ──────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({ sql: "SELECT * FROM payments WHERE id = ?", args: [req.params.id] });
    if (!rsEx.rows[0]) return res.status(404).json({ error: "Payment not found" });

    await db.execute({ sql: "DELETE FROM payments WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Helper ──────────────────────────────────────────────────────────
function mapRow(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitId: row.visit_id || undefined,
    date: row.date,
    amount: row.amount,
    method: row.method || undefined,
    notes: row.notes || undefined,
  };
}

export default router;
