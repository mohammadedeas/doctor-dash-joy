import { describe, it, expect, beforeAll, afterAll } from "vitest";
import "../set-test-db.js";
import request from "supertest";
import { app, initDB } from "../app.js";
import {
  setupTestDb,
  cleanTestDb,
  createTestUser,
  getAuthToken,
} from "../test-helper.js";

describe("Settings Routes", () => {
  let token: string;
  let agent: ReturnType<typeof request>;

  beforeAll(async () => {
    await setupTestDb();
    agent = request(app);
    const user = await createTestUser("settingsadmin", "pass123", "Admin");
    token = await getAuthToken(agent, user.username, user.password);
  });
  afterAll(() => {
    cleanTestDb();
  });

  describe("GET /api/settings", () => {
    it("returns default settings", async () => {
      const res = await agent.get("/api/settings").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.clinicName).toBe("My Dental Clinic");
      expect(res.body.currency).toBe("ILS");
      expect(Array.isArray(res.body.commonProcedures)).toBe(true);
    });
  });

  describe("PUT /api/settings", () => {
    it("updates settings", async () => {
      const res = await agent
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          clinicName: "New Clinic",
          currency: "USD",
          commonProcedures: [{ name: "Test", cost: 50 }],
        });
      expect(res.status).toBe(200);
      expect(res.body.clinicName).toBe("New Clinic");
      expect(res.body.currency).toBe("USD");
    });
  });

  describe("GET /api/settings/state", () => {
    it("returns full state with empty arrays initially", async () => {
      const res = await agent.get("/api/settings/state").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.patients)).toBe(true);
      expect(Array.isArray(res.body.visits)).toBe(true);
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(Array.isArray(res.body.appointments)).toBe(true);
      expect(res.body.settings).toBeDefined();
    });
  });

  describe("PUT /api/settings/state", () => {
    it("replaces all state", async () => {
      const state = {
        patients: [
          {
            id: "p1",
            name: "Alice",
            phone: "555-0000",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        visits: [
          {
            id: "v1",
            patientId: "p1",
            date: "2026-09-15",
            procedures: [{ name: "Cleaning", cost: 200 }],
            totalCost: 200,
          },
        ],
        payments: [
          {
            id: "pay1",
            patientId: "p1",
            visitId: "v1",
            date: "2026-09-15",
            amount: 200,
            method: "Cash",
            procedureNames: ["Cleaning"],
          },
        ],
        appointments: [],
        settings: { clinicName: "Test Clinic", currency: "EUR", commonProcedures: [] },
      };
      const res = await agent
        .put("/api/settings/state")
        .set("Authorization", `Bearer ${token}`)
        .send(state);
      expect(res.status).toBe(200);
      expect(res.body.patients).toHaveLength(1);
      expect(res.body.visits).toHaveLength(1);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.payments[0].procedureNames).toEqual(["Cleaning"]);
      expect(res.body.settings.clinicName).toBe("Test Clinic");
    });
  });

  describe("DELETE /api/settings/state", () => {
    it("clears all data and resets settings", async () => {
      await agent
        .put("/api/settings/state")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patients: [{ id: "p1", name: "Alice", createdAt: "2026-01-01T00:00:00.000Z" }],
          visits: [],
          payments: [],
          appointments: [],
          settings: { clinicName: "Temp", currency: "USD", commonProcedures: [] },
        });
      const res = await agent
        .delete("/api/settings/state")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.patients).toHaveLength(0);
      expect(res.body.settings.clinicName).toBe("My Dental Clinic");
    });
  });
});
