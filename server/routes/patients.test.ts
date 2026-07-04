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

describe("Patients Routes", () => {
  let token: string;
  let agent: ReturnType<typeof request>;

  beforeAll(async () => {
    await setupTestDb();
    agent = request(app);
    const user = await createTestUser("patadmin", "pass123", "Admin", "admin");
    token = await getAuthToken(agent, user.username, user.password);
  });
  afterAll(() => {
    cleanTestDb();
  });
  beforeEach(async () => {
    // Clear patients before each test via settings/state DELETE
    await agent.delete("/api/settings/state").set("Authorization", `Bearer ${token}`);
  });

  describe("Auth", () => {
    it("returns 401 without token", async () => {
      const res = await agent.get("/api/patients");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/patients", () => {
    it("returns empty array initially", async () => {
      const res = await agent.get("/api/patients").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/patients", () => {
    it("creates a patient", async () => {
      const res = await agent
        .post("/api/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Alice Smith", phone: "555-1234", dob: "1990-05-15" });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Alice Smith");
      expect(res.body.phone).toBe("555-1234");
      expect(res.body.id).toBeDefined();
    });

    it("returns 400 when name is missing", async () => {
      const res = await agent
        .post("/api/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ phone: "555-0000" });
      expect(res.status).toBe(400);
    });

    it("rejects SQL injection in name field", async () => {
      const malicious = "'; DROP TABLE patients; --";
      const res = await agent
        .post("/api/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: malicious });
      expect(res.status).toBe(201);
      // Verify table still exists by listing patients
      const list = await agent.get("/api/patients").set("Authorization", `Bearer ${token}`);
      expect(list.status).toBe(200);
      expect(list.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/patients/:id", () => {
    it("returns 404 for non-existent patient", async () => {
      const res = await agent
        .get("/api/patients/nonexistent")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("returns a patient by id", async () => {
      const created = await agent
        .post("/api/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Bob Jones" });
      const res = await agent
        .get(`/api/patients/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Bob Jones");
    });
  });

  describe("PUT /api/patients/:id", () => {
    it("updates a patient", async () => {
      const created = await agent
        .post("/api/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Charlie" });
      const res = await agent
        .put(`/api/patients/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Charles", phone: "999-8888" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Charles");
      expect(res.body.phone).toBe("999-8888");
    });
  });

  describe("DELETE /api/patients/:id", () => {
    it("deletes a patient", async () => {
      const created = await agent
        .post("/api/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Delete Me" });
      const res = await agent
        .delete(`/api/patients/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const get = await agent
        .get(`/api/patients/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(get.status).toBe(404);
    });
  });
});
