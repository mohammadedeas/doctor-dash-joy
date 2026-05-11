import { Router, Request, Response } from "express";
import db from "../db.js";
import { randomUUID } from "crypto";

const router = Router();

// ── List all patients ───────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM patients ORDER BY name ASC").all() as any[];
  const patients = rows.map(mapRow);
  res.json(patients);
});

// ── Get single patient ──────────────────────────────────────────────
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: "Patient not found" });
  res.json(mapRow(row));
});

// ── Create patient ──────────────────────────────────────────────────
router.post("/", (req: Request, res: Response) => {
  const { name, phone, email, dob, gender, address, medicalNotes } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const id = randomUUID().slice(0, 12);
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO patients (id, name, phone, email, dob, gender, address, medical_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, phone || "", email || "", dob || "", gender || "", address || "", medicalNotes || "", createdAt);

  const row = db.prepare("SELECT * FROM patients WHERE id = ?").get(id) as any;
  res.status(201).json(mapRow(row));
});

// ── Update patient ──────────────────────────────────────────────────
router.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Patient not found" });

  const { name, phone, email, dob, gender, address, medicalNotes } = req.body;

  db.prepare(`
    UPDATE patients SET name = ?, phone = ?, email = ?, dob = ?, gender = ?, address = ?, medical_notes = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    phone ?? existing.phone,
    email ?? existing.email,
    dob ?? existing.dob,
    gender ?? existing.gender,
    address ?? existing.address,
    medicalNotes ?? existing.medical_notes,
    req.params.id
  );

  const row = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id) as any;
  res.json(mapRow(row));
});

// ── Delete patient (cascades visits & payments) ─────────────────────
router.delete("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Patient not found" });

  db.prepare("DELETE FROM patients WHERE id = ?").run(req.params.id);
  res.json({ success: true });
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
