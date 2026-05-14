import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import "../set-test-db.js";
import request from "supertest";
import { app, initDB } from "../app.js";
import {
  setupTestDb,
  cleanTestDb,
  createTestUser,
  getAuthToken,
} from "../test-helper.js";

describe("Visits Routes", () => {
  let token: string;
  let agent: ReturnType<typeof request>;
  let patientId: string;

  beforeAll(async () => {
    await setupTestDb();
    agent = request(app);
    const user = await createTestUser("visitadmin", "pass123", "Admin");
    token = await getAuthToken(agent, user.username, user.password);
  });
  afterAll(() => {
    cleanTestDb();
  });
  beforeEach(async () => {
    await agent.delete("/api/settings/state").set("Authorization", `Bearer ${token}`);
    const p = await agent
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Patient" });
    patientId = p.body.id;
  });

  describe("POST /api/visits", () => {
    it("creates a visit with procedures", async () => {
      const res = await agent
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          date: "2026-09-15",
          procedures: [
            { name: "Cleaning", cost: 200 },
            { name: "X-Ray", cost: 80 },
          ],
          totalCost: 280,
          notes: "Routine checkup",
        });
      expect(res.status).toBe(201);
      expect(res.body.procedures).toHaveLength(2);
      expect(res.body.totalCost).toBe(280);
    });

    it("returns 400 when patientId or date is missing", async () => {
      const res = await agent
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ patientId });
      expect(res.status).toBe(400);
    });

    it("rejects SQL injection in procedure names", async () => {
      const malicious = "'; DROP TABLE visits; --";
      const res = await agent
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          date: "2026-09-15",
          procedures: [{ name: malicious, cost: 0 }],
          totalCost: 0,
        });
      expect(res.status).toBe(201);
      // Verify table still exists
      const list = await agent.get("/api/visits").set("Authorization", `Bearer ${token}`);
      expect(list.status).toBe(200);
    });
  });

  describe("GET /api/visits", () => {
    it("lists visits enriched with procedures", async () => {
      await agent
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          date: "2026-09-15",
          procedures: [{ name: "Filling", cost: 300 }],
          totalCost: 300,
        });
      const res = await agent.get("/api/visits").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].procedures[0].name).toBe("Filling");
    });
  });

  describe("PUT /api/visits/:id", () => {
    it("updates procedures (full replace)", async () => {
      const created = await agent
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          date: "2026-09-15",
          procedures: [{ name: "Old", cost: 100 }],
          totalCost: 100,
        });
      const res = await agent
        .put(`/api/visits/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          date: "2026-09-16",
          procedures: [{ name: "New", cost: 200 }],
          totalCost: 200,
        });
      expect(res.status).toBe(200);
      expect(res.body.procedures).toHaveLength(1);
      expect(res.body.procedures[0].name).toBe("New");
      expect(res.body.date).toBe("2026-09-16");
    });
  });

  describe("DELETE /api/visits/:id", () => {
    it("deletes visit and cascades linked payments", async () => {
      const visit = await agent
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          date: "2026-09-15",
          procedures: [],
          totalCost: 0,
        });
      const visitId = visit.body.id;

      await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          visitId,
          date: "2026-09-15",
          amount: 100,
          method: "Cash",
        });

      const res = await agent
        .delete(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);

      const payments = await agent.get("/api/payments").set("Authorization", `Bearer ${token}`);
      expect(payments.body).toHaveLength(0);
    });
  });
});
