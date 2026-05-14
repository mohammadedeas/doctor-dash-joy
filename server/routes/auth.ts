import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import db from "../db.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as {
      userId: string;
      username: string;
    };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await db.execute({
      sql: "SELECT id, username, password_hash, name, role FROM users WHERE username = ?",
      args: [username],
    });

    const user = result.rows[0] as unknown as
      | { id: string; username: string; password_hash: string; name: string; role: string }
      | undefined;

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[auth] Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const result = await db.execute({
      sql: "SELECT id, username, name, role FROM users WHERE id = ?",
      args: [userId],
    });

    const user = result.rows[0] as unknown as
      | { id: string; username: string; name: string; role: string }
      | undefined;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("[auth] Me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
