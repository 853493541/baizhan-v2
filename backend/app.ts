import express from "express";
import cors from "cors";
import compression from "compression";
import { connectDB } from "./db";
import cron from "node-cron";
import fetch from "node-fetch";
import TargetedPlan from "./models/TargetedPlan";
import SystemJob from "./models/SystemJob"; // ✅ Track last cron execution

// 🧩 Route imports
import characterRoutes from "./routes/characterRoutes";
import mapRoutes from "./routes/mapRoutes";
import standardScheduleRoutes from "./routes/standardScheduleRoutes";
import targetedPlanRoutes from "./routes/targetedPlanRoutes";

const app = express();

// ✅ Allowed origins (dev + prod)
const allowedOrigins = [
  "http://localhost:3000",       // local dev
  "https://renstoolbox.com",     // production
  "https://www.renstoolbox.com", // production (www)
];

// ✅ Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ Middleware
app.use(express.json());
app.use(compression());

// ✅ Connect to MongoDB
connectDB();

// ✅ API Routes
app.use("/api/characters", characterRoutes);
app.use("/api/weekly-map", mapRoutes);
app.use("/api/standard-schedules", standardScheduleRoutes);
app.use("/api/targeted-plans", targetedPlanRoutes);

// ✅ Health check route
app.get("/", (_, res) => {
  res.send("✅ API is running (TargetedPlans integrated)");
});

// ====================================================================
// ⏰ CRON JOB — Weekly auto-reset (Monday 7 AM China / Sunday 4 PM California)
// ====================================================================
// 7 AM Monday China (UTC+8) → 23:00 UTC Sunday → cron "0 23 * * 0"
const API_BASE = process.env.API_BASE_URL || "https://renstoolbox.com/api";

cron.schedule("0 23 * * 0", async () => {
  const now = new Date();
  const jobName = "weekly-targeted-reset";

  try {
    console.log("⏰ [Cron] Weekly auto-reset triggered:", now.toISOString());

    // === Step 1: Prevent duplicate runs if backend restarts ===
    const existing = await SystemJob.findOne({ jobName });
    if (existing && existing.lastRunAt) {
      const diffDays = (now.getTime() - existing.lastRunAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 6) {
        console.log("⏩ [Cron] Skipping reset — already ran recently on", existing.lastRunAt);
        return;
      }
    }

    // === Step 2: Get all plan IDs ===
    const plans = await TargetedPlan.find({}, "planId name").lean();
    if (!plans.length) {
      console.log("⚠️ [Cron] No targeted plans found, skipping reset.");
      return;
    }

    // === Step 3: Call each plan’s /reset endpoint ===
    for (const plan of plans) {
      try {
        const res = await fetch(`${API_BASE}/targeted-plans/${plan.planId}/reset`, { method: "POST" });
        const data: any = await res.json().catch(() => ({})); // 👈 type-safe

        if (res.ok) {
          console.log(`✅ [Cron] ${plan.name || plan.planId} reset at ${data?.lastResetAt || now.toISOString()}`);
        } else {
          console.warn(`⚠️ [Cron] Reset failed for ${plan.name || plan.planId}: ${res.status} ${data?.error || ""}`);
        }
      } catch (err) {
        console.error(`❌ [Cron] Error resetting ${plan.name || plan.planId}:`, err);
      }
    }

    // === Step 4: Record cron run time ===
    await SystemJob.findOneAndUpdate(
      { jobName },
      { lastRunAt: now },
      { upsert: true, new: true }
    );

    console.log("✅ [Cron] Weekly auto-reset completed at", now.toISOString());
  } catch (err) {
    console.error("❌ [Cron] Weekly auto-reset failed:", err);
  }
});

// ====================================================================
// 🧪 Manual trigger — run reset immediately (for testing)
// ====================================================================
app.post("/api/system/run-reset-now", async (_, res) => {
  const now = new Date();
  console.log("🧪 [Manual] Running reset now:", now.toISOString());

  try {
    const plans = await TargetedPlan.find({}, "planId name").lean();
    if (!plans.length) {
      console.log("⚠️ [Manual] No targeted plans found.");
      return res.json({ success: false, message: "No plans to reset" });
    }

    for (const plan of plans) {
      try {
        const resp = await fetch(`${API_BASE}/targeted-plans/${plan.planId}/reset`, { method: "POST" });
        const data: any = await resp.json().catch(() => ({}));

        if (resp.ok) {
          console.log(`✅ [Manual] ${plan.name || plan.planId} reset at ${data?.lastResetAt || now.toISOString()}`);
        } else {
          console.warn(`⚠️ [Manual] Reset failed for ${plan.name || plan.planId}: ${resp.status}`);
        }
      } catch (err) {
        console.error(`❌ [Manual] Error resetting ${plan.name || plan.planId}:`, err);
      }
    }

    await SystemJob.findOneAndUpdate(
      { jobName: "weekly-targeted-reset" },
      { lastRunAt: now },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Manual reset completed", lastRunAt: now });
  } catch (err) {
    console.error("❌ [Manual] Reset failed:", err);
    res.status(500).json({ success: false, error: "Manual reset failed" });
  }
});

// ✅ Optional: check last cron run time
app.get("/api/system/last-reset", async (_, res) => {
  try {
    const job = await SystemJob.findOne({ jobName: "weekly-targeted-reset" }).lean();
    res.json({ lastRunAt: job?.lastRunAt || null });
  } catch {
    res.status(500).json({ error: "Failed to fetch last reset time" });
  }
});

export default app;
