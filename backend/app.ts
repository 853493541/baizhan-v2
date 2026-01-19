import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { connectDB } from "./db";
import cron from "node-cron";
import fetch from "node-fetch";

import TargetedPlan from "./models/TargetedPlan";
import SystemJob from "./models/SystemJob";

// 🔐 AUTH
import authRoutes from "./routes/authRoutes";
import { requireAuth } from "./middleware/requireAuth";

// 🧩 Route imports
import characterRoutes from "./routes/characterRoutes";
import mapRoutes from "./routes/mapRoutes";
import standardScheduleRoutes from "./routes/standardScheduleRoutes";
import targetedPlanRoutes from "./routes/targetedPlanRoutes";

const app = express();

/* =====================================================
   🌐 CORS (same domain, safe defaults)
===================================================== */

const allowedOrigins = [
  "http://localhost:3000",
  "https://baizhan.renstoolbox.com",
  "https://www.baizhan.renstoolbox.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

/* =====================================================
   🔧 Core middleware
===================================================== */

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(compression());

/* =====================================================
   🗄️ Database
===================================================== */

connectDB();

/* =====================================================
   🔓 PUBLIC ROUTES (NO LOGIN REQUIRED)
===================================================== */

// Health check (keep public)
app.get("/", (_, res) => {
  res.send("✅ API is running (auth enabled)");
});

// Auth routes
app.use("/api/auth", authRoutes);

/* =====================================================
   🔒 HARD GATE — EVERYTHING BELOW REQUIRES LOGIN
===================================================== */

app.use("/api", requireAuth);

/* =====================================================
   🧩 PROTECTED API ROUTES
===================================================== */

app.use("/api/characters", characterRoutes);
app.use("/api/weekly-map", mapRoutes);
app.use("/api/standard-schedules", standardScheduleRoutes);
app.use("/api/targeted-plans", targetedPlanRoutes);

/* =====================================================
   ⏰ CRON JOB — Weekly auto-reset
   (runs internally, NOT via HTTP)
===================================================== */

// 7 AM Monday China (UTC+8)
// → 23:00 UTC Sunday
const API_BASE = process.env.API_BASE_URL || "https://renstoolbox.com/api";

cron.schedule("0 23 * * 0", async () => {
  const now = new Date();
  const jobName = "weekly-targeted-reset";

  try {
    console.log("⏰ [Cron] Weekly auto-reset triggered:", now.toISOString());

    // Prevent duplicate runs
    const existing = await SystemJob.findOne({ jobName });
    if (existing?.lastRunAt) {
      const diffDays =
        (now.getTime() - existing.lastRunAt.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diffDays < 6) {
        console.log("⏩ [Cron] Skipping reset — already ran on", existing.lastRunAt);
        return;
      }
    }

    const plans = await TargetedPlan.find({}, "planId name").lean();
    if (!plans.length) {
      console.log("⚠️ [Cron] No targeted plans found.");
      return;
    }

    for (const plan of plans) {
      try {
        const res = await fetch(
          `${API_BASE}/targeted-plans/${plan.planId}/reset`,
          {
            method: "POST",
            headers: {
              // 🔑 INTERNAL AUTH BYPASS TOKEN (OPTIONAL, SAFE)
              "x-internal-cron": process.env.CRON_SECRET || "",
            },
          }
        );

        const data: any = await res.json().catch(() => ({}));

        if (res.ok) {
          console.log(
            `✅ [Cron] ${plan.name || plan.planId} reset at ${
              data?.lastResetAt || now.toISOString()
            }`
          );
        } else {
          console.warn(
            `⚠️ [Cron] Reset failed for ${plan.name || plan.planId}: ${res.status}`
          );
        }
      } catch (err) {
        console.error(
          `❌ [Cron] Error resetting ${plan.name || plan.planId}:`,
          err
        );
      }
    }

    await SystemJob.findOneAndUpdate(
      { jobName },
      { lastRunAt: now },
      { upsert: true, new: true }
    );

    console.log("✅ [Cron] Weekly auto-reset completed");
  } catch (err) {
    console.error("❌ [Cron] Weekly auto-reset failed:", err);
  }
});

/* =====================================================
   🧪 MANUAL SYSTEM ROUTES (PROTECTED)
===================================================== */

app.post("/api/system/run-reset-now", async (_, res) => {
  const now = new Date();
  console.log("🧪 [Manual] Running reset now:", now.toISOString());

  try {
    const plans = await TargetedPlan.find({}, "planId name").lean();
    if (!plans.length) {
      return res.json({ success: false, message: "No plans to reset" });
    }

    for (const plan of plans) {
      await fetch(`${API_BASE}/targeted-plans/${plan.planId}/reset`, {
        method: "POST",
      });
    }

    await SystemJob.findOneAndUpdate(
      { jobName: "weekly-targeted-reset" },
      { lastRunAt: now },
      { upsert: true, new: true }
    );

    res.json({ success: true, lastRunAt: now });
  } catch (err) {
    console.error("❌ [Manual] Reset failed:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/system/last-reset", async (_, res) => {
  try {
    const job = await SystemJob.findOne({
      jobName: "weekly-targeted-reset",
    }).lean();

    res.json({ lastRunAt: job?.lastRunAt || null });
  } catch {
    res.status(500).json({ error: "Failed to fetch last reset time" });
  }
});

export default app;
