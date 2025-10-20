import express from "express";
import cors from "cors";
import compression from "compression";
import { connectDB } from "./db";

// 🧩 Route imports
import characterRoutes from "./routes/characterRoutes";
import mapRoutes from "./routes/mapRoutes";
import standardScheduleRoutes from "./routes/standardScheduleRoutes";
import targetedPlanRoutes from "./routes/targetedPlanRoutes"; // 🆕 new route

const app = express();

// ✅ Allowed origins (dev + prod)
const allowedOrigins = [
  "http://localhost:3000",        // local dev
  "https://renstoolbox.com",      // production
  "https://www.renstoolbox.com",  // production (www)
];

// ✅ Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. curl, Postman, mobile apps)
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
app.use("/api/targeted-plans", targetedPlanRoutes); // 🆕 added new route

// ✅ Health check route (optional)
app.get("/", (_, res) => {
  res.send("✅ API is running (TargetedPlans integrated)");
});

export default app;
