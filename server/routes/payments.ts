import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── List all payments ───────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM payments ORDER BY date DESC").all() as any[];
  const payments = rows.map(mapRow);
  res.json(payments);
});

// ── Get single payment ──────────────────────────────────────────────
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: "Payment not found" });
  res.json(mapRow(row));
});

// ── Create payment ──────────────────────────────────────────────────
router.post("/", (req: Request, res: Response) => {
  const { patientId, visitId, date, amount, method, notes } = req.body;
  if (!patientId || !date) return res.status(400).json({ error: "patientId and date are required" });

  const id = randomUUID().slice(0, 12);

  db.prepare(`
    INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, patientId, visitId || null, date, amount || 0, method || "Cash", notes || "");

  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as any;
  res.status(201).json(mapRow(row));
});

// ── Update payment ──────────────────────────────────────────────────
router.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Payment not found" });

  const { patientId, visitId, date, amount, method, notes } = req.body;

  db.prepare(`
    UPDATE payments SET patient_id = ?, visit_id = ?, date = ?, amount = ?, method = ?, notes = ?
    WHERE id = ?
  `).run(
    patientId ?? existing.patient_id,
    visitId !== undefined ? (visitId || null) : existing.visit_id,
    date ?? existing.date,
    amount ?? existing.amount,
    method ?? existing.method,
    notes ?? existing.notes,
    req.params.id
  );

  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id) as any;
  res.json(mapRow(row));
});

// ── Delete payment ──────────────────────────────────────────────────
router.delete("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Payment not found" });

  db.prepare("DELETE FROM payments WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ── Helper ──────────────────────────────────────────────────────────
function mapRow(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitId: row.visit_id || null,
    date: row.date,
    amount: row.amount,
    method: row.method,
    notes: row.notes || undefined,
  };
}

export default router;
