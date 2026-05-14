import path from "path";

const testDbPath = path.join(process.cwd(), "test-clinic.db");
process.env.TURSO_DATABASE_URL = `file:${testDbPath}`;
