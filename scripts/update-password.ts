import bcrypt from "bcryptjs";
import db from "../server/db.js";

async function updatePassword() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error("Usage: npx tsx scripts/update-password.ts <username> <password>");
    process.exit(1);
  }

  const existing = await db.execute({
    sql: "SELECT 1 FROM users WHERE username = ?",
    args: [username],
  });

  if (existing.rows.length === 0) {
    console.error(`Error: User "${username}" does not exist.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE username = ?",
    args: [passwordHash, username],
  });

  console.log(`✅ Password updated for "${username}".`);
  process.exit(0);
}

updatePassword().catch((err) => {
  console.error("Failed to update password:", err);
  process.exit(1);
});
