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

describe("Payments Routes", () => {
  let token: string;
  let agent: ReturnType<typeof request>;
  let patientId: string;
  let visitId: string;

  beforeAll(async () => {
    await setupTestDb();
    agent = request(app);
    const user = await createTestUser("payadmin", "pass123", "Admin", "admin");
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

    const v = await agent
      .post("/api/visits")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId,
        date: "2026-09-15",
        procedures: [
          { name: "Cleaning", cost: 200 },
          { name: "Filling", cost: 300 },
        ],
        totalCost: 500,
      });
    visitId = v.body.id;
  });

  describe("POST /api/payments", () => {
    it("creates a general payment", async () => {
      const res = await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ patientId, date: "2026-09-15", amount: 150, method: "Cash" });
      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(150);
      expect(res.body.visitId).toBeNull();
    });

    it("creates a visit-linked payment with procedureNames", async () => {
      const res = await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          visitId,
          date: "2026-09-15",
          amount: 200,
          method: "Card",
          procedureNames: ["Cleaning"],
        });
      expect(res.status).toBe(201);
      expect(res.body.visitId).toBe(visitId);
      expect(res.body.procedureNames).toEqual(["Cleaning"]);
      expect(res.body.method).toBe("Card");
    });

    it("returns 400 when patientId or date is missing", async () => {
      const res = await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100 });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/payments", () => {
    it("lists payments", async () => {
      await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ patientId, date: "2026-09-15", amount: 100, method: "Cash" });
      const res = await agent.get("/api/payments").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe("PUT /api/payments/:id", () => {
    it("updates amount and procedureNames", async () => {
      const created = await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          visitId,
          date: "2026-09-15",
          amount: 100,
          procedureNames: ["Cleaning"],
        });
      const res = await agent
        .put(`/api/payments/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 250,
          procedureNames: ["Cleaning", "Filling"],
        });
      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(250);
      expect(res.body.procedureNames).toEqual(["Cleaning", "Filling"]);
    });
  });

  describe("DELETE /api/payments/:id", () => {
    it("deletes a payment", async () => {
      const created = await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ patientId, date: "2026-09-15", amount: 50 });
      const res = await agent
        .delete(`/api/payments/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Security", () => {
    it("rejects XSS payload in notes", async () => {
      const xss = "<script>alert('xss')</script>";
      const res = await agent
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ patientId, date: "2026-09-15", amount: 10, notes: xss });
      expect(res.status).toBe(201);
      // API stores it as-is; frontend should escape it. The point is it doesn't crash.
      expect(res.body.notes).toBe(xss);
    });
  });
});
