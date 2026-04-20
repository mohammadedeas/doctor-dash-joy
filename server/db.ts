import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "clinic.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT DEFAULT '',
    email       TEXT DEFAULT '',
    dob         TEXT DEFAULT '',
    gender      TEXT DEFAULT '',
    address     TEXT DEFAULT '',
    medical_notes TEXT DEFAULT '',
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visits (
    id          TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL,
    date        TEXT NOT NULL,
    total_cost  REAL DEFAULT 0,
    notes       TEXT DEFAULT '',
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS visit_procedures (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id TEXT NOT NULL,
    name     TEXT NOT NULL,
    cost     REAL DEFAULT 0,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id          TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL,
    visit_id    TEXT DEFAULT NULL,
    date        TEXT NOT NULL,
    amount      REAL DEFAULT 0,
    method      TEXT DEFAULT 'Cash',
    notes       TEXT DEFAULT '',
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default settings if empty
const settingsCount = db.prepare("SELECT COUNT(*) as cnt FROM settings").get() as { cnt: number };
if (settingsCount.cnt === 0) {
  const insert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  insert.run("clinicName", "My Dental Clinic");
  insert.run("currency", "ILS");
  insert.run(
    "commonProcedures",
    JSON.stringify([
      { name: "Consultation", cost: 100 },
      { name: "Cleaning", cost: 200 },
      { name: "Filling", cost: 300 },
      { name: "Root Canal", cost: 1500 },
      { name: "Extraction", cost: 400 },
      { name: "Crown", cost: 2000 },
      { name: "X-Ray", cost: 80 },
      { name: "Whitening", cost: 800 },
    ])
  );
}

export default db;
