import { describe, it, expect, beforeAll, afterAll } from "vitest";
import "../set-test-db.js";
import request from "supertest";
import { app, initDB } from "../app.js";
import { setupTestDb, cleanTestDb, createTestUser } from "../test-helper.js";

describe("Auth Routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(() => {
    cleanTestDb();
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 when username or password is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("required");
    });

    it("returns 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "nobody", password: "wrong" });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Invalid credentials");
    });

    it("returns token for valid credentials", async () => {
      await createTestUser("validuser", "mypassword", "Valid User");
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "validuser", password: "mypassword" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe("validuser");
    });

    it("returns 401 for wrong password", async () => {
      await createTestUser("wrongpass", "correct", "Wrong Pass");
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "wrongpass", password: "incorrect" });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Invalid credentials");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken");
      expect(res.status).toBe(401);
    });

    it("returns user data with valid token", async () => {
      const user = await createTestUser("meuser", "pass123", "Me User");
      const login = await request(app)
        .post("/api/auth/login")
        .send({ username: "meuser", password: "pass123" });
      const token = login.body.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe("meuser");
      expect(res.body.user.name).toBe("Me User");
    });
  });
});
