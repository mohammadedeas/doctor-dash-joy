import path from "path";
import { randomUUID } from "crypto";

const dbPath = path.join(process.cwd(), `test-${randomUUID()}.db`);
process.env.TURSO_DATABASE_URL = `file:${dbPath}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-do-not-use-in-production";
