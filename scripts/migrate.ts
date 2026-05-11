import { createClient } from "@libsql/client";
import "dotenv/config";
import fs from "fs";

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoUrl.startsWith("libsql://")) {
    console.error("❌ TURSO_DATABASE_URL is not set or not a valid libsql URL.");
    console.error("Make sure you have a .env file with TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  if (!fs.existsSync("clinic.db")) {
    console.error("❌ Local clinic.db not found. Cannot migrate.");
    process.exit(1);
  }

  console.log("Connecting to Local Database...");
  const localDb = createClient({ url: "file:clinic.db" });

  console.log("Connecting to Turso Cloud Database...");
  const cloudDb = createClient({ url: tursoUrl, authToken: tursoToken });

  try {
    // 1. Initialize schema on cloud
    console.log("Initializing Schema on Cloud...");
    await cloudDb.executeMultiple(`
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

    // Clear cloud DB before migrating
    console.log("Clearing existing cloud data...");
    await cloudDb.execute("DELETE FROM visit_procedures");
    await cloudDb.execute("DELETE FROM payments");
    await cloudDb.execute("DELETE FROM visits");
    await cloudDb.execute("DELETE FROM patients");
    await cloudDb.execute("DELETE FROM settings");

    // 2. Migrate Settings
    console.log("Migrating Settings...");
    const settings = await localDb.execute("SELECT * FROM settings");
    for (const r of settings.rows) {
      await cloudDb.execute({
        sql: "INSERT INTO settings (key, value) VALUES (?, ?)",
        args: [r.key as string, r.value as string]
      });
    }

    // 3. Migrate Patients
    console.log("Migrating Patients...");
    const patients = await localDb.execute("SELECT * FROM patients");
    for (const p of patients.rows) {
      await cloudDb.execute({
        sql: "INSERT INTO patients (id, name, phone, email, dob, gender, address, medical_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [p.id, p.name, p.phone, p.email, p.dob, p.gender, p.address, p.medical_notes, p.created_at] as any[]
      });
    }

    // 4. Migrate Visits
    console.log("Migrating Visits...");
    const visits = await localDb.execute("SELECT * FROM visits");
    for (const v of visits.rows) {
      await cloudDb.execute({
        sql: "INSERT INTO visits (id, patient_id, date, total_cost, notes) VALUES (?, ?, ?, ?, ?)",
        args: [v.id, v.patient_id, v.date, v.total_cost, v.notes] as any[]
      });
    }

    // 5. Migrate Visit Procedures
    console.log("Migrating Procedures...");
    const procs = await localDb.execute("SELECT * FROM visit_procedures");
    for (const p of procs.rows) {
      await cloudDb.execute({
        sql: "INSERT INTO visit_procedures (id, visit_id, name, cost) VALUES (?, ?, ?, ?)",
        args: [p.id, p.visit_id, p.name, p.cost] as any[]
      });
    }

    // 6. Migrate Payments
    console.log("Migrating Payments...");
    const payments = await localDb.execute("SELECT * FROM payments");
    for (const p of payments.rows) {
      await cloudDb.execute({
        sql: "INSERT INTO payments (id, patient_id, visit_id, date, amount, method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [p.id, p.patient_id, p.visit_id, p.date, p.amount, p.method, p.notes] as any[]
      });
    }

    console.log("✅ Migration completed successfully!");
    console.log(`Total Migrated: ${patients.rows.length} Patients, ${visits.rows.length} Visits, ${payments.rows.length} Payments.`);

  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

main();
