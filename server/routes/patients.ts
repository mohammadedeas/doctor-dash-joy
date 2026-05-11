import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── List all patients ───────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rs = await db.execute("SELECT * FROM patients ORDER BY name ASC");
    const patients = rs.rows.map(mapRow);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Get single patient ──────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rs = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [req.params.id as string] });
    const row = rs.rows[0];
    if (!row) return res.status(404).json({ error: "Patient not found" });
    res.json(mapRow(row));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Create patient ──────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const { name, phone, email, dob, gender, address, medicalNotes } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const id = randomUUID().slice(0, 12);
  const createdAt = new Date().toISOString();

  try {
    await db.execute({
      sql: `
        INSERT INTO patients (id, name, phone, email, dob, gender, address, medical_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, name, phone || "", email || "", dob || "", gender || "", address || "", medicalNotes || "", createdAt]
    });

    const rs = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [id] });
    res.status(201).json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Update patient ──────────────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [req.params.id as string] });
    const existing = rsEx.rows[0];
    if (!existing) return res.status(404).json({ error: "Patient not found" });

    const { name, phone, email, dob, gender, address, medicalNotes } = req.body;

    await db.execute({
      sql: `
        UPDATE patients SET name = ?, phone = ?, email = ?, dob = ?, gender = ?, address = ?, medical_notes = ?
        WHERE id = ?
      `,
      args: [
        name ?? existing.name,
        phone ?? existing.phone,
        email ?? existing.email,
        dob ?? existing.dob,
        gender ?? existing.gender,
        address ?? existing.address,
        medicalNotes ?? existing.medical_notes,
        req.params.id as string
      ]
    });

    const rs = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [req.params.id as string] });
    res.json(mapRow(rs.rows[0]));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Delete patient (cascades visits & payments) ─────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const rsEx = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [req.params.id as string] });
    if (!rsEx.rows[0]) return res.status(404).json({ error: "Patient not found" });

    await db.execute({ sql: "DELETE FROM patients WHERE id = ?", args: [req.params.id as string] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Helper ──────────────────────────────────────────────────────────
function mapRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    email: row.email || undefined,
    dob: row.dob || undefined,
    gender: row.gender || undefined,
    address: row.address || undefined,
    medicalNotes: row.medical_notes || undefined,
    createdAt: row.created_at,
  };
}

export default router;
