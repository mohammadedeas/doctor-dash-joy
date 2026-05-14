import bcrypt from "bcryptjs";
import db, { initDB } from "../server/db.js";

function generateId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

async function createUser() {
  const args = process.argv.slice(2);

  const username = args[0];
  const password = args[1];
  const name = args[2];
  const role = args[3] || "user";

  if (!username || !password || !name) {
    console.error("Usage: npx tsx scripts/create-user.ts <username> <password> <name> [role]");
    console.error("  role defaults to 'user'. Use 'admin' for administrator access.");
    process.exit(1);
  }

  await initDB();

  const existing = await db.execute({
    sql: "SELECT 1 FROM users WHERE username = ?",
    args: [username],
  });

  if (existing.rows.length > 0) {
    console.error(`Error: User "${username}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.execute({
    sql: "INSERT INTO users (id, username, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [generateId(), username, passwordHash, name, role, new Date().toISOString()],
  });

  console.log(`✅ User "${username}" created successfully.`);
  process.exit(0);
}

createUser().catch((err) => {
  console.error("Failed to create user:", err);
  process.exit(1);
});
