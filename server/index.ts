import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import patientsRouter from "./routes/patients.js";
import visitsRouter from "./routes/visits.js";
import paymentsRouter from "./routes/payments.js";
import settingsRouter from "./routes/settings.js";
import { initDB } from "./db.js";

// __dirname is available natively in CJS; this shim keeps it working in ESM dev mode too
const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename_esm);
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API Routes
app.use("/api/patients", patientsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/settings", settingsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Serve frontend static files in production ────────────────────────
// In Electron, STATIC_DIR is injected. In web hosting, we fallback to
// the standard Vite build output directory.
import fs from "fs";
const staticDir = process.env.STATIC_DIR || path.join(process.cwd(), "dist", "client");

if (fs.existsSync(staticDir)) {
  console.log(`[server] Serving static files from: ${staticDir}`);
  app.use(express.static(staticDir));

  // SPA catch-all: any route that isn't /api/* gets _shell.html
  // so that client-side routing (TanStack Router) works.
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, "_shell.html"));
  });
} else {
  console.log(`[server] No static files found at ${staticDir}. Run 'npm run build' first if in production.`);
}

// Initialize DB and export app for Vercel
const initPromise = initDB().catch(err => {
  console.error("[server] Failed to initialize database:", err);
});

// Start server only if not in a serverless environment (e.g. local dev, Electron)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  initPromise.then(() => {
    app.listen(PORT, () => {
      console.log(`\n  🏥 Clinic API server running at http://localhost:${PORT}`);
      console.log(`  📋 Endpoints:`);
      console.log(`     GET    /api/settings/state   — Full state`);
      console.log(`     CRUD   /api/patients`);
      console.log(`     CRUD   /api/visits`);
      console.log(`     CRUD   /api/payments`);
      console.log(`     GET/PUT /api/settings\n`);
      if (staticDir) {
        console.log(`  🌐 Frontend served from: ${staticDir}\n`);
      }
    });
  });
}

export default app;
