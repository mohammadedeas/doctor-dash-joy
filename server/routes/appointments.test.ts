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

describe("Appointments Routes", () => {
  let token: string;
  let agent: ReturnType<typeof request>;
  let patientId: string;

  beforeAll(async () => {
    await setupTestDb();
    agent = request(app);
    const user = await createTestUser("apptadmin", "pass123", "Admin");
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

  describe("POST /api/appointments", () => {
    it("creates an appointment", async () => {
      const res = await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test Patient",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
          visitType: "Cleaning",
          dentistName: "Dr. Smith",
          status: "confirmed",
        });
      expect(res.status).toBe(201);
      expect(res.body.patientName).toBe("Test Patient");
      expect(res.body.date).toBe("2026-09-15");
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({ patientId, patientName: "Test" });
      expect(res.status).toBe(400);
    });

    it("detects time slot conflicts for same dentist", async () => {
      await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test Patient",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
          dentistName: "Dr. Smith",
        });
      const res = await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test Patient 2",
          date: "2026-09-15",
          startTime: "09:30",
          endTime: "10:30",
          dentistName: "Dr. Smith",
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("conflict");
    });

    it("allows same time for different dentists", async () => {
      await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test Patient",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
          dentistName: "Dr. Smith",
        });
      const res = await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test Patient 2",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
          dentistName: "Dr. Jones",
        });
      expect(res.status).toBe(201);
    });
  });

  describe("GET /api/appointments", () => {
    it("lists appointments with filters", async () => {
      await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
          status: "confirmed",
        });
      const res = await agent
        .get("/api/appointments?status=confirmed&date=2026-09-15")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe("PUT /api/appointments/:id", () => {
    it("updates an appointment", async () => {
      const created = await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
        });
      const res = await agent
        .put(`/api/appointments/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test",
          date: "2026-09-16",
          startTime: "10:00",
          endTime: "11:00",
        });
      expect(res.status).toBe(200);
      expect(res.body.date).toBe("2026-09-16");
    });
  });

  describe("DELETE /api/appointments/:id", () => {
    it("deletes an appointment", async () => {
      const created = await agent
        .post("/api/appointments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patientId,
          patientName: "Test",
          date: "2026-09-15",
          startTime: "09:00",
          endTime: "10:00",
        });
      const res = await agent
        .delete(`/api/appointments/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
