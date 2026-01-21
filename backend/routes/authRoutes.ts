import { Router } from "express";
import { User } from "../models/User";
import {
  getCookieOptions,
  hashPassword,
  signToken,
  verifyPassword,
} from "../utils/auth";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/**
 * POST /api/auth/login
 * body: { username, password }
 * sets httpOnly cookie auth_token (1 year)
 */
router.post("/login", async (req, res) => {
  try {
    const usernameRaw = String(req.body?.username || "");
    const passwordRaw = String(req.body?.password || "");

    const username = usernameRaw.trim().toLowerCase();
    const password = passwordRaw;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🔑 INCLUDE tokenVersion in JWT
    const token = signToken({
      uid: String(user._id),
      username: user.username,
      tokenVersion: user.tokenVersion,
    });

    res.cookie("auth_token", token, getCookieOptions(req));
    return res.json({
      ok: true,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("[auth/login] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/auth/logout
 * clears cookie (current session only)
 */
router.post("/logout", async (_req, res) => {
  try {
    res.clearCookie("auth_token", { path: "/" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth/logout] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

);

/**
 * GET /api/auth/me
 * returns current user if logged in
 */
router.get("/me", requireAuth, async (req, res) => {
  return res.json({
    ok: true,
    user: {
      uid: req.auth!.uid,
      username: req.auth!.username,
    },
  });
});

/**
 * OPTIONAL (backend-only bootstrap):
 * POST /api/auth/bootstrap
 * Allows creating the FIRST user only IF no users exist.
 */
router.post("/bootstrap", async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res
        .status(403)
        .json({ error: "Bootstrap disabled (users already exist)" });
    }

    const usernameRaw = String(req.body?.username || "");
    const passwordRaw = String(req.body?.password || "");

    const username = usernameRaw.trim().toLowerCase();
    const password = passwordRaw;

    if (!username || !password) {
      return res.status(400).json({ error: "Need username + password" });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username,
      passwordHash,
      tokenVersion: 0, // explicit for clarity
    });

    return res.json({
      ok: true,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("[auth/bootstrap] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/auth/change-password
 * body: { currentPassword, newPassword }
 *
 * IMPORTANT:
 * - increments tokenVersion
 * - invalidates ALL existing sessions
 */
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing passwords" });
    }

    const user = await User.findById(req.auth!.uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // 🔐 Update password
    user.passwordHash = await hashPassword(newPassword);

    // 🔥 GLOBAL LOGOUT: bump tokenVersion
    user.tokenVersion += 1;

    await user.save();

    // Invalidate current browser session
    res.clearCookie("auth_token", { path: "/" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth/change-password] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
