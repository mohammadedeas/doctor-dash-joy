import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";
import { handleError, parsePagination } from "../lib/http.js";
import { validateBody, visitCreateSchema, visitUpdateSchema } from "../lib/schemas.js";

const router = Router();

// ── List all visits ─────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    let sql = "SELECT * FROM visits ORDER BY date DESC";
    const args: number[] = [];
    if (limit !== undefined) {
      sql += " LIMIT ? OFFSET ?";
      args.push(limit, offset);
    }
    const rs = await db.execute({ sql, args });
    const visits = await enrichVisits(rs.rows);
    res.json(visits);
  } catch (err) {
    handleError(res, err, "visits");
  }
});

// ── Get single visit ────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({ sql: "SELECT * FROM visits WHERE id = ?", args: [req.params.id as string] });
    const row = rs.rows[0];
    if (!row) return res.status(404).json({ error: "Visit not found" });
    res.json(await enrichVisit(row));
  } catch (err) {
    handleError(res, err, "visits");
  }
});

// ── Create visit ────────────────────────────────────────────────────
router.post("/", validateBody(visitCreateSchema), async (req: Request, res: Response) => {
  const { patientId, date, procedures, totalCost, notes } = req.body;

  const id = randomUUID().slice(0, 12);
  const tx = await db.transaction("write");

  try {
    await tx.execute({
      sql: "INSERT INTO visits (id, patient_id, date, total_cost, notes) VALUES (?, ?, ?, ?, ?)",
      args: [id, patientId, date, totalCost || 0, notes || ""]
    });

    if (Array.isArray(procedures)) {
      for (const proc of procedures) {
        await tx.execute({
          sql: "INSERT INTO visit_procedures (visit_id, name, cost) VALUES (?, ?, ?)",
          args: [id, proc.name, proc.cost || 0]
        });
      }
    }
    await tx.commit();

    const rs = await db.execute({ sql: "SELECT * FROM visits WHERE id = ?", args: [id] });
    res.status(201).json(await enrichVisit(rs.rows[0]));
  } catch (err) {
    await tx.rollback();
    handleError(res, err, "visits");
  }
});

// ── Update visit ────────────────────────────────────────────────────
router.put("/:id", validateBody(visitUpdateSchema), async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({ sql: "SELECT * FROM visits WHERE id = ?", args: [req.params.id as string] });
    const existing = rsEx.rows[0];
    if (!existing) return res.status(404).json({ error: "Visit not found" });

    const { patientId, date, procedures, totalCost, notes } = req.body;
    const tx = await db.transaction("write");

    try {
      await tx.execute({
        sql: "UPDATE visits SET patient_id = ?, date = ?, total_cost = ?, notes = ? WHERE id = ?",
        args: [
          patientId ?? existing.patient_id,
          date ?? existing.date,
          totalCost ?? existing.total_cost,
          notes ?? existing.notes,
          req.params.id as string
        ]
      });

      if (Array.isArray(procedures)) {
        await tx.execute({ sql: "DELETE FROM visit_procedures WHERE visit_id = ?", args: [req.params.id as string] });
        for (const proc of procedures) {
          await tx.execute({
            sql: "INSERT INTO visit_procedures (visit_id, name, cost) VALUES (?, ?, ?)",
            args: [req.params.id, proc.name, proc.cost || 0]
          });
        }
      }
      await tx.commit();

      const rs = await db.execute({ sql: "SELECT * FROM visits WHERE id = ?", args: [req.params.id as string] });
      res.json(await enrichVisit(rs.rows[0]));
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    handleError(res, err, "visits");
  }
});

// ── Delete visit (+ cascade payments for this visit) ────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({ sql: "SELECT * FROM visits WHERE id = ?", args: [req.params.id as string] });
    if (!rsEx.rows[0]) return res.status(404).json({ error: "Visit not found" });

    const tx = await db.transaction("write");
    try {
      await tx.execute({ sql: "DELETE FROM payments WHERE visit_id = ?", args: [req.params.id as string] });
      await tx.execute({ sql: "DELETE FROM visits WHERE id = ?", args: [req.params.id as string] });
      await tx.commit();
      res.json({ success: true });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    handleError(res, err, "visits");
  }
});

// ── Helper: enrich a batch of visit rows with their procedures in one query ──
async function enrichVisits(rows: any[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const rs = await db.execute({
    sql: `SELECT visit_id, name, cost FROM visit_procedures WHERE visit_id IN (${placeholders})`,
    args: ids,
  });
  const byVisit = new Map<string, { name: string; cost: number }[]>();
  for (const r of rs.rows) {
    const list = byVisit.get(r.visit_id as string) || [];
    list.push({ name: r.name as string, cost: r.cost as number });
    byVisit.set(r.visit_id as string, list);
  }
  return rows.map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    procedures: byVisit.get(row.id) || [],
    totalCost: row.total_cost,
    notes: row.notes || undefined,
  }));
}

// ── Helper: enrich a single visit with its procedures ────────────────
async function enrichVisit(row: any) {
  const rs = await db.execute({
    sql: "SELECT name, cost FROM visit_procedures WHERE visit_id = ?",
    args: [row.id]
  });

  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    procedures: rs.rows,
    totalCost: row.total_cost,
    notes: row.notes || undefined,
  };
}

export default router;
