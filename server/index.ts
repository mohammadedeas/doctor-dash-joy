import express from "express";
import cors from "cors";
import patientsRouter from "./routes/patients.js";
import visitsRouter from "./routes/visits.js";
import paymentsRouter from "./routes/payments.js";
import settingsRouter from "./routes/settings.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/patients", patientsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/settings", settingsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  🏥 Clinic API server running at http://localhost:${PORT}`);
  console.log(`  📋 Endpoints:`);
  console.log(`     GET    /api/settings/state   — Full state`);
  console.log(`     CRUD   /api/patients`);
  console.log(`     CRUD   /api/visits`);
  console.log(`     CRUD   /api/payments`);
  console.log(`     GET/PUT /api/settings\n`);
});
