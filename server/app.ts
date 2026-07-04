import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import patientsRouter from "./routes/patients.js";
import visitsRouter from "./routes/visits.js";
import paymentsRouter from "./routes/payments.js";
import settingsRouter from "./routes/settings.js";
import authRouter, { authMiddleware } from "./routes/auth.js";
import appointmentsRouter from "./routes/appointments.js";
import toothTreatmentsRouter from "./routes/tooth-treatments.js";
import dentalChartRouter from "./routes/dental-chart.js";
import { initDB } from "./db.js";

const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename_esm);
const app = express();

// Vercel (and most PaaS hosts) sit exactly one reverse proxy in front of the
// app and set X-Forwarded-For correctly, so trust that one hop — needed for
// express-rate-limit and req.ip to see the real client address instead of
// throwing/misidentifying everyone as the proxy.
app.set("trust proxy", 1);

// Middleware
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.CLIENT_URL) {
  console.warn("[app] CLIENT_URL is not set in production — CORS will reject cross-origin requests.");
}
app.use(cors({ origin: process.env.CLIENT_URL || (isProduction ? false : true) }));
app.use(express.json({ limit: "10mb" }));

// Public API Routes
app.use("/api/auth", authRouter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth middleware for protected routes
app.use(authMiddleware);

// Protected API Routes
app.use("/api/patients", patientsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/tooth-treatments", toothTreatmentsRouter);
app.use("/api/dental-chart", dentalChartRouter);
app.use("/api/settings", settingsRouter);

// ── Serve frontend static files in production ────────────────────────
import fs from "fs";
const staticDir = process.env.STATIC_DIR || path.join(process.cwd(), "dist", "client");

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, "_shell.html"));
  });
}

export { app, initDB };
