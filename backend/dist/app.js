"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const db_1 = require("./db");
const node_cron_1 = __importDefault(require("node-cron"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const TargetedPlan_1 = __importDefault(require("./models/TargetedPlan"));
const SystemJob_1 = __importDefault(require("./models/SystemJob")); // ✅ Track last cron execution
// 🧩 Route imports
const characterRoutes_1 = __importDefault(require("./routes/characterRoutes"));
const mapRoutes_1 = __importDefault(require("./routes/mapRoutes"));
const standardScheduleRoutes_1 = __importDefault(require("./routes/standardScheduleRoutes"));
const targetedPlanRoutes_1 = __importDefault(require("./routes/targetedPlanRoutes"));
const app = (0, express_1.default)();
// ✅ Allowed origins (dev + prod)
const allowedOrigins = [
    "http://localhost:3000", // local dev
    "https://renstoolbox.com", // production
    "https://www.renstoolbox.com", // production (www)
];
// ✅ Enable CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("CORS blocked: " + origin));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
// ✅ Middleware
app.use(express_1.default.json());
app.use((0, compression_1.default)());
// ✅ Connect to MongoDB
(0, db_1.connectDB)();
// ✅ API Routes
app.use("/api/characters", characterRoutes_1.default);
app.use("/api/weekly-map", mapRoutes_1.default);
app.use("/api/standard-schedules", standardScheduleRoutes_1.default);
app.use("/api/targeted-plans", targetedPlanRoutes_1.default);
// ✅ Health check route
app.get("/", (_, res) => {
    res.send("✅ API is running (TargetedPlans integrated)");
});
// ====================================================================
// ⏰ CRON JOB — Weekly auto-reset (Monday 7 AM China / Sunday 4 PM California)
// ====================================================================
// 7 AM Monday China (UTC+8) → 23:00 UTC Sunday → cron "0 23 * * 0"
const API_BASE = process.env.API_BASE_URL || "https://renstoolbox.com/api";
node_cron_1.default.schedule("0 23 * * 0", async () => {
    const now = new Date();
    const jobName = "weekly-targeted-reset";
    try {
        console.log("⏰ [Cron] Weekly auto-reset triggered:", now.toISOString());
        // === Step 1: Prevent duplicate runs if backend restarts ===
        const existing = await SystemJob_1.default.findOne({ jobName });
        if (existing && existing.lastRunAt) {
            const diffDays = (now.getTime() - existing.lastRunAt.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < 6) {
                console.log("⏩ [Cron] Skipping reset — already ran recently on", existing.lastRunAt);
                return;
            }
        }
        // === Step 2: Get all plan IDs ===
        const plans = await TargetedPlan_1.default.find({}, "planId name").lean();
        if (!plans.length) {
            console.log("⚠️ [Cron] No targeted plans found, skipping reset.");
            return;
        }
        // === Step 3: Call each plan’s /reset endpoint ===
        for (const plan of plans) {
            try {
                const res = await (0, node_fetch_1.default)(`${API_BASE}/targeted-plans/${plan.planId}/reset`, { method: "POST" });
                const data = await res.json().catch(() => ({})); // 👈 type-safe
                if (res.ok) {
                    console.log(`✅ [Cron] ${plan.name || plan.planId} reset at ${data?.lastResetAt || now.toISOString()}`);
                }
                else {
                    console.warn(`⚠️ [Cron] Reset failed for ${plan.name || plan.planId}: ${res.status} ${data?.error || ""}`);
                }
            }
            catch (err) {
                console.error(`❌ [Cron] Error resetting ${plan.name || plan.planId}:`, err);
            }
        }
        // === Step 4: Record cron run time ===
        await SystemJob_1.default.findOneAndUpdate({ jobName }, { lastRunAt: now }, { upsert: true, new: true });
        console.log("✅ [Cron] Weekly auto-reset completed at", now.toISOString());
    }
    catch (err) {
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
        const plans = await TargetedPlan_1.default.find({}, "planId name").lean();
        if (!plans.length) {
            console.log("⚠️ [Manual] No targeted plans found.");
            return res.json({ success: false, message: "No plans to reset" });
        }
        for (const plan of plans) {
            try {
                const resp = await (0, node_fetch_1.default)(`${API_BASE}/targeted-plans/${plan.planId}/reset`, { method: "POST" });
                const data = await resp.json().catch(() => ({}));
                if (resp.ok) {
                    console.log(`✅ [Manual] ${plan.name || plan.planId} reset at ${data?.lastResetAt || now.toISOString()}`);
                }
                else {
                    console.warn(`⚠️ [Manual] Reset failed for ${plan.name || plan.planId}: ${resp.status}`);
                }
            }
            catch (err) {
                console.error(`❌ [Manual] Error resetting ${plan.name || plan.planId}:`, err);
            }
        }
        await SystemJob_1.default.findOneAndUpdate({ jobName: "weekly-targeted-reset" }, { lastRunAt: now }, { upsert: true, new: true });
        res.json({ success: true, message: "Manual reset completed", lastRunAt: now });
    }
    catch (err) {
        console.error("❌ [Manual] Reset failed:", err);
        res.status(500).json({ success: false, error: "Manual reset failed" });
    }
});
// ✅ Optional: check last cron run time
app.get("/api/system/last-reset", async (_, res) => {
    try {
        const job = await SystemJob_1.default.findOne({ jobName: "weekly-targeted-reset" }).lean();
        res.json({ lastRunAt: job?.lastRunAt || null });
    }
    catch {
        res.status(500).json({ error: "Failed to fetch last reset time" });
    }
});
exports.default = app;
