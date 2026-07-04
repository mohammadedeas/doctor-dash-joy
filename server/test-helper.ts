import fs from "fs";
import path from "path";
import db, { initDB } from "./db.js";

const testDbPath = path.join(process.cwd(), "test-clinic.db");

export async function setupTestDb() {
  cleanTestDb();
  await initDB();
}

export function cleanTestDb() {
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    ["-shm", "-wal"].forEach((ext) => {
      const f = testDbPath + ext;
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  } catch {
    // ignore
  }
}

export async function createTestUser(
  username = "testuser",
  password = "testpass123",
  name = "Test User",
  role: "user" | "admin" = "user"
) {
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.default.hash(password, 12);
  const id = `usr_${Date.now()}`;
  await db.execute({
    sql: "INSERT INTO users (id, username, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, username, hash, name, role, new Date().toISOString()],
  });
  return { id, username, password, name, role };
}

export async function getAuthToken(
  agent: import("supertest").SuperTest<import("supertest").Test>,
  username: string,
  password: string
) {
  const res = await agent.post("/api/auth/login").send({ username, password });
  return res.body.token as string;
}
