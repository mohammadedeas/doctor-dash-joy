import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";
import { handleError, parsePagination } from "../lib/http.js";
import { validateBody, paymentCreateSchema, paymentUpdateSchema } from "../lib/schemas.js";

const router = Router();

// ── List all payments ───────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    let sql = "SELECT * FROM payments ORDER BY date DESC";
    const args: number[] = [];
    if (limit !== undefined) {
      sql += " LIMIT ? OFFSET ?";
      args.push(limit, offset);
    }
    const rs = await db.execute({ sql, args });
    const payments = rs.rows.map(mapRow);
    res.json(payments);
  } catch (err) {
    handleError(res, err, "payments");
  }
});

// ── Get single payment ──────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM payments WHERE id = ?",
      args: [req.params.id as string],
    });
    const row = rs.rows[0];
    if (!row) return res.status(404).json({ error: "Payment not found" });
    res.json(mapRow(row));
  } catch (err) {
    handleError(res, err, "payments");
  }
});

// ── Create payment ──────────────────────────────────────────────────
router.post("/", validateBody(paymentCreateSchema), async (req: Request, res: Response) => {
  const { patientId, visitId, date, amount, method, notes, procedureNames } = req.body;

  const id = randomUUID().slice(0, 12);
  const procNamesStr = Array.isArray(procedureNames)
    ? procedureNames.join(", ")
    : procedureNames || "";

  try {
    await db.execute({
      sql: `
        INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes, procedure_names)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        patientId,
        visitId || null,
        date,
        amount || 0,
        method || "Cash",
        notes || "",
        procNamesStr,
      ],
    });

    const rs = await db.execute({ sql: "SELECT * FROM payments WHERE id = ?", args: [id] });
    res.status(201).json(mapRow(rs.rows[0]));
  } catch (err) {
    handleError(res, err, "payments");
  }
});

// ── Update payment ──────────────────────────────────────────────────
router.put("/:id", validateBody(paymentUpdateSchema), async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({
      sql: "SELECT * FROM payments WHERE id = ?",
      args: [req.params.id as string],
    });
    const existing = rsEx.rows[0];
    if (!existing) return res.status(404).json({ error: "Payment not found" });

    const { patientId, visitId, date, amount, method, notes, procedureNames } = req.body;
    const procNamesStr = Array.isArray(procedureNames)
      ? procedureNames.join(", ")
      : (procedureNames ?? existing.procedure_names);

    await db.execute({
      sql: `
        UPDATE payments SET patient_id = ?, visit_id = ?, date = ?, amount = ?, method = ?, notes = ?, procedure_names = ?
        WHERE id = ?
      `,
      args: [
        patientId ?? existing.patient_id,
        visitId ?? existing.visit_id,
        date ?? existing.date,
        amount ?? existing.amount,
        method ?? existing.method,
        notes ?? existing.notes,
        procNamesStr,
        req.params.id as string,
      ],
    });

    const rs = await db.execute({
      sql: "SELECT * FROM payments WHERE id = ?",
      args: [req.params.id as string],
    });
    res.json(mapRow(rs.rows[0]));
  } catch (err) {
    handleError(res, err, "payments");
  }
});

// ── Delete payment ──────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({
      sql: "SELECT * FROM payments WHERE id = ?",
      args: [req.params.id as string],
    });
    if (!rsEx.rows[0]) return res.status(404).json({ error: "Payment not found" });

    await db.execute({ sql: "DELETE FROM payments WHERE id = ?", args: [req.params.id as string] });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, "payments");
  }
});

// ── Helper ──────────────────────────────────────────────────────────
function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitId: row.visit_id || null,
    date: row.date,
    amount: row.amount,
    method: row.method || undefined,
    notes: row.notes || undefined,
    procedureNames: row.procedure_names
      ? String(row.procedure_names).split(", ").filter(Boolean)
      : undefined,
  };
}

export default router;
