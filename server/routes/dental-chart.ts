import { Router, Request, Response } from "express";
import db from "../db.js";
import { handleError } from "../lib/http.js";

const router = Router();

// ── Get a patient's clinical tooth chart ─────────────────────────────
router.get("/:patientId", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({
      sql: "SELECT teeth, updated_at FROM dental_chart_data WHERE patient_id = ?",
      args: [String(req.params.patientId)],
    });
    const row = rs.rows[0];
    res.json({
      patientId: req.params.patientId,
      teeth: row ? JSON.parse(row.teeth as string) : {},
      updatedAt: row?.updated_at || null,
    });
  } catch (err) {
    handleError(res, err, "dental-chart");
  }
});

// ── Upsert a patient's clinical tooth chart ──────────────────────────
router.put("/:patientId", async (req: Request, res: Response) => {
  try {
    const patientId = String(req.params.patientId);
    const { teeth } = req.body;
    if (typeof teeth !== "object" || teeth === null) {
      return res.status(400).json({ error: "teeth must be an object" });
    }

    const patientExists = await db.execute({
      sql: "SELECT 1 FROM patients WHERE id = ?",
      args: [patientId],
    });
    if (!patientExists.rows.length) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const updatedAt = new Date().toISOString();
    await db.execute({
      sql: `
        INSERT INTO dental_chart_data (patient_id, teeth, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(patient_id) DO UPDATE SET teeth = excluded.teeth, updated_at = excluded.updated_at
      `,
      args: [patientId, JSON.stringify(teeth), updatedAt],
    });

    res.json({ patientId, teeth, updatedAt });
  } catch (err) {
    handleError(res, err, "dental-chart");
  }
});

export default router;
