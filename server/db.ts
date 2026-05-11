import { createClient } from "@libsql/client";
import "dotenv/config";
import path from "path";

// In development or local testing, it defaults to the local SQLite file.
// In production on Vercel, it uses the Turso URL.
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), "clinic.db")}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log(`[db] Connecting to database at: ${dbUrl.startsWith('libsql://') ? 'Turso Cloud' : dbUrl}`);

const db = createClient({
  url: dbUrl,
  authToken: authToken,
});

// ── Schema Initialization ───────────────────────────────────────────
export async function initDB() {
  await db.executeMultiple(`
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
  const settingsCount = await db.execute("SELECT COUNT(*) as cnt FROM settings");
  const cnt = (settingsCount.rows[0]?.cnt as number) || 0;
  
  if (cnt === 0) {
    const tx = await db.transaction("write");
    try {
      await tx.execute({ sql: "INSERT INTO settings (key, value) VALUES (?, ?)", args: ["clinicName", "My Dental Clinic"] });
      await tx.execute({ sql: "INSERT INTO settings (key, value) VALUES (?, ?)", args: ["currency", "ILS"] });
      await tx.execute({
        sql: "INSERT INTO settings (key, value) VALUES (?, ?)",
        args: [
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
        ]
      });
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }
}

export default db;
