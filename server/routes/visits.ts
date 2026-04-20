import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── List all visits ─────────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM visits ORDER BY date DESC").all() as any[];
  const visits = rows.map((row) => enrichVisit(row));
  res.json(visits);
});

// ── Get single visit ────────────────────────────────────────────────
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: "Visit not found" });
  res.json(enrichVisit(row));
});

// ── Create visit ────────────────────────────────────────────────────
router.post("/", (req: Request, res: Response) => {
  const { patientId, date, procedures, totalCost, notes } = req.body;
  if (!patientId || !date) return res.status(400).json({ error: "patientId and date are required" });

  const id = randomUUID().slice(0, 12);

  const insertVisit = db.prepare(`
    INSERT INTO visits (id, patient_id, date, total_cost, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertProc = db.prepare(`
    INSERT INTO visit_procedures (visit_id, name, cost) VALUES (?, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertVisit.run(id, patientId, date, totalCost || 0, notes || "");
    if (Array.isArray(procedures)) {
      for (const proc of procedures) {
        insertProc.run(id, proc.name, proc.cost || 0);
      }
    }
  });
  tx();

  const row = db.prepare("SELECT * FROM visits WHERE id = ?").get(id) as any;
  res.status(201).json(enrichVisit(row));
});

// ── Update visit ────────────────────────────────────────────────────
router.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Visit not found" });

  const { patientId, date, procedures, totalCost, notes } = req.body;

  const updateVisit = db.prepare(`
    UPDATE visits SET patient_id = ?, date = ?, total_cost = ?, notes = ? WHERE id = ?
  `);
  const deleteProcs = db.prepare("DELETE FROM visit_procedures WHERE visit_id = ?");
  const insertProc = db.prepare(`
    INSERT INTO visit_procedures (visit_id, name, cost) VALUES (?, ?, ?)
  `);

  const tx = db.transaction(() => {
    updateVisit.run(
      patientId ?? existing.patient_id,
      date ?? existing.date,
      totalCost ?? existing.total_cost,
      notes ?? existing.notes,
      req.params.id
    );
    // Replace procedures
    if (Array.isArray(procedures)) {
      deleteProcs.run(req.params.id);
      for (const proc of procedures) {
        insertProc.run(req.params.id, proc.name, proc.cost || 0);
      }
    }
  });
  tx();

  const row = db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id) as any;
  res.json(enrichVisit(row));
});

// ── Delete visit (+ cascade payments for this visit) ────────────────
router.delete("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Visit not found" });

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM payments WHERE visit_id = ?").run(req.params.id);
    db.prepare("DELETE FROM visits WHERE id = ?").run(req.params.id);
  });
  tx();

  res.json({ success: true });
});

// ── Helper: enrich visit with procedures array ──────────────────────
function enrichVisit(row: any) {
  const procs = db
    .prepare("SELECT name, cost FROM visit_procedures WHERE visit_id = ?")
    .all(row.id) as { name: string; cost: number }[];

  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    procedures: procs,
    totalCost: row.total_cost,
    notes: row.notes || undefined,
  };
}

export default router;
