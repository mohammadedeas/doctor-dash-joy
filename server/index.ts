import { app, initDB } from "./app.js";

const PORT = process.env.PORT || 3001;

// Initialize DB and export app for Vercel
const initPromise = initDB().catch((err) => {
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
    });
  });
}

export default app;
