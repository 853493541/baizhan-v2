import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { User } from "../models/User";

const router = Router();

/**
 * GET /api/admin/users/activity
 * Read-only user presence info
 *
 * Returns:
 * {
 *   users: [
 *     {
 *       username: string
 *       lastSeenAt: string | null
 *       lastSeenIp: string | null
 *     }
 *   ]
 * }
 */
router.get("/users/activity", requireAuth, async (_req, res) => {
  try {
    const users = await User.find(
      {},
      {
        username: 1,
        lastSeenAt: 1,
        lastSeenIp: 1, // ✅ include IP
      }
    )
      .sort({ username: 1 })
      .lean();

    return res.json({
      users: users.map((u) => ({
        username: u.username,
        lastSeenAt: u.lastSeenAt ?? null,
        lastSeenIp: u.lastSeenIp ?? null,
      })),
    });
  } catch (err) {
    console.error("[admin/users/activity] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
