import { execSync } from "child_process";

export default function globalSetup() {
  try {
    execSync('npx tsx scripts/create-user.ts e2euser e2epass123 "E2E User"', {
      stdio: "ignore",
    });
  } catch {
    // User may already exist; that's fine
  }
}
