import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";
import { handleError, parsePagination } from "../lib/http.js";
import { validateBody, toothTreatmentCreateSchema, toothTreatmentUpdateSchema } from "../lib/schemas.js";

const router = Router();

// ── List treatments (by patient or visit) ───────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { patientId, visitId } = req.query;
    let sql = "SELECT * FROM tooth_treatments WHERE 1=1";
    const args: (string | number)[] = [];

    if (patientId) {
      sql += " AND patient_id = ?";
      args.push(patientId as string);
    }
    if (visitId) {
      sql += " AND visit_id = ?";
      args.push(visitId as string);
    }
    sql += " ORDER BY created_at DESC";

    const { limit, offset } = parsePagination(req.query);
    if (limit !== undefined) {
      sql += " LIMIT ? OFFSET ?";
      args.push(limit, offset);
    }

    const rs = await db.execute({ sql, args });
    const treatments = rs.rows.map(mapRow);
    res.json(treatments);
  } catch (err) {
    handleError(res, err, "tooth-treatments");
  }
});

// ── Get single treatment ────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM tooth_treatments WHERE id = ?",
      args: [req.params.id as string],
    });
    const row = rs.rows[0];
    if (!row) return res.status(404).json({ error: "Treatment not found" });
    res.json(mapRow(row));
  } catch (err) {
    handleError(res, err, "tooth-treatments");
  }
});

// ── Create treatment ────────────────────────────────────────────────
router.post("/", validateBody(toothTreatmentCreateSchema), async (req: Request, res: Response) => {
  const { patientId, visitId, toothNumber, procedure, status, notes, cost, doctorName } = req.body;

  const id = randomUUID().slice(0, 12);
  const createdAt = new Date().toISOString();

  try {
    await db.execute({
      sql: `
        INSERT INTO tooth_treatments (id, patient_id, visit_id, tooth_number, procedure, status, notes, cost, created_at, doctor_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        patientId,
        visitId,
        toothNumber,
        procedure,
        status || "Planned",
        notes || "",
        cost || 0,
        createdAt,
        doctorName || "",
      ],
    });

    const rs = await db.execute({
      sql: "SELECT * FROM tooth_treatments WHERE id = ?",
      args: [id],
    });
    res.status(201).json(mapRow(rs.rows[0]));
  } catch (err) {
    handleError(res, err, "tooth-treatments");
  }
});

// ── Update treatment ────────────────────────────────────────────────
router.put("/:id", validateBody(toothTreatmentUpdateSchema), async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({
      sql: "SELECT * FROM tooth_treatments WHERE id = ?",
      args: [req.params.id as string],
    });
    const existing = rsEx.rows[0];
    if (!existing) return res.status(404).json({ error: "Treatment not found" });

    const { patientId, visitId, toothNumber, procedure, status, notes, cost, doctorName } = req.body;

    await db.execute({
      sql: `
        UPDATE tooth_treatments
        SET patient_id = ?, visit_id = ?, tooth_number = ?, procedure = ?, status = ?, notes = ?, cost = ?, doctor_name = ?
        WHERE id = ?
      `,
      args: [
        patientId ?? existing.patient_id,
        visitId ?? existing.visit_id,
        toothNumber ?? existing.tooth_number,
        procedure ?? existing.procedure,
        status ?? existing.status,
        notes ?? existing.notes,
        cost ?? existing.cost,
        doctorName ?? existing.doctor_name,
        req.params.id as string,
      ],
    });

    const rs = await db.execute({
      sql: "SELECT * FROM tooth_treatments WHERE id = ?",
      args: [req.params.id as string],
    });
    res.json(mapRow(rs.rows[0]));
  } catch (err) {
    handleError(res, err, "tooth-treatments");
  }
});

// ── Delete treatment ────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({
      sql: "SELECT * FROM tooth_treatments WHERE id = ?",
      args: [req.params.id as string],
    });
    if (!rsEx.rows[0]) return res.status(404).json({ error: "Treatment not found" });

    await db.execute({
      sql: "DELETE FROM tooth_treatments WHERE id = ?",
      args: [req.params.id as string],
    });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, "tooth-treatments");
  }
});

// ── Helper ──────────────────────────────────────────────────────────
function mapRow(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitId: row.visit_id,
    toothNumber: row.tooth_number,
    procedure: row.procedure,
    status: row.status,
    notes: row.notes || undefined,
    cost: row.cost || 0,
    createdAt: row.created_at,
    doctorName: row.doctor_name || undefined,
  };
}

export default router;
