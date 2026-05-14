import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── List all appointments (with optional filters) ───────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, dentist, date, search } = req.query;
    let sql = "SELECT * FROM appointments WHERE 1=1";
    const args: any[] = [];

    if (status) {
      sql += " AND status = ?";
      args.push(status);
    }
    if (dentist) {
      sql += " AND dentist_name = ?";
      args.push(dentist);
    }
    if (date) {
      sql += " AND date = ?";
      args.push(date);
    }
    if (search) {
      sql += " AND (patient_name LIKE ? OR phone LIKE ? OR visit_type LIKE ?)";
      const term = `%${search}%`;
      args.push(term, term, term);
    }

    sql += " ORDER BY date ASC, start_time ASC";
    const rs = await db.execute({ sql, args });
    res.json(rs.rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Today's appointments ────────────────────────────────────────────
router.get("/today", async (_req: Request, res: Response) => {
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM appointments WHERE date = ? ORDER BY start_time ASC",
      args: [todayISO()],
    });
    res.json(rs.rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Upcoming appointments (next 7 days) ─────────────────────────────
router.get("/upcoming", async (_req: Request, res: Response) => {
  try {
    const today = todayISO();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;

    const rs = await db.execute({
      sql: "SELECT * FROM appointments WHERE date >= ? AND date <= ? ORDER BY date ASC, start_time ASC",
      args: [today, futureStr],
    });
    res.json(rs.rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Get single appointment ──────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM appointments WHERE id = ?",
      args: [String(req.params.id)],
    });
    if (!rs.rows.length) return res.status(404).json({ error: "Appointment not found" });
    res.json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Create appointment ──────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const { patientId, patientName, phone, visitType, dentistName, date, startTime, endTime, notes, status, paymentStatus } = req.body;
    if (!patientId || !patientName || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const conflict = await findConflict(date, startTime, endTime, dentistName, null);
    if (conflict) {
      return res.status(409).json({ error: "Time slot conflict", conflict });
    }

    const id = randomUUID().slice(0, 12);
    await db.execute({
      sql: `INSERT INTO appointments (id, patient_id, patient_name, phone, visit_type, dentist_name, date, start_time, end_time, notes, status, payment_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, patientId, patientName, phone || "", visitType || "", dentistName || "", date, startTime, endTime, notes || "", status || "pending", paymentStatus || "unpaid", new Date().toISOString()],
    });

    const rs = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });
    res.status(201).json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Update appointment ──────────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { patientId, patientName, phone, visitType, dentistName, date, startTime, endTime, notes, status, paymentStatus } = req.body;
    const existing = await db.execute({ sql: "SELECT 1 FROM appointments WHERE id = ?", args: [String(req.params.id)] });
    if (!existing.rows.length) return res.status(404).json({ error: "Appointment not found" });

    const conflict = await findConflict(date, startTime, endTime, dentistName, req.params.id);
    if (conflict) {
      return res.status(409).json({ error: "Time slot conflict", conflict });
    }

    await db.execute({
      sql: `UPDATE appointments SET
              patient_id = ?, patient_name = ?, phone = ?, visit_type = ?, dentist_name = ?,
              date = ?, start_time = ?, end_time = ?, notes = ?, status = ?, payment_status = ?
            WHERE id = ?`,
      args: [
        patientId, patientName, phone || "", visitType || "", dentistName || "",
        date, startTime, endTime, notes || "", status || "pending", paymentStatus || "unpaid",
        req.params.id,
      ],
    });

    const rs = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [req.params.id] });
    res.json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Delete appointment ──────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await db.execute({ sql: "DELETE FROM appointments WHERE id = ?", args: [String(req.params.id)] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Helpers ─────────────────────────────────────────────────────────
function mapRow(r: any) {
  return {
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
  };
}

async function findConflict(date: string, startTime: string, endTime: string, dentistName: string, excludeId: string | null) {
  if (!date || !startTime || !endTime || !dentistName) return null;
  const sql = `
    SELECT * FROM appointments
    WHERE date = ? AND dentist_name = ?
      AND start_time < ? AND end_time > ?
      ${excludeId ? "AND id != ?" : ""}
    LIMIT 1
  `;
  const args: any[] = [date, dentistName, endTime, startTime];
  if (excludeId) args.push(excludeId);
  const rs = await db.execute({ sql, args });
  return rs.rows.length ? mapRow(rs.rows[0]) : null;
}

export default router;
