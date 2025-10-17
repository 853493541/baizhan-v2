import express from "express";
import cors from "cors";
import { connectDB } from "./db";
import characterRoutes from "./routes/characterRoutes";
import mapRoutes from "./routes/mapRoutes";
import standardScheduleRoutes from "./routes/standardScheduleRoutes"; // ✅ renamed
import compression from "compression";


const app = express();

// ✅ Allowed origins (dev + prod)
const allowedOrigins = [
  "http://localhost:3000",         // local dev
  "https://renstoolbox.com",       // production
  "https://www.renstoolbox.com",   // production (www)
];

// ✅ Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// ✅ Connect DB
connectDB();
app.use(compression());
// ✅ Routes
app.use("/api/characters", characterRoutes);
app.use("/api/weekly-map", mapRoutes);
app.use("/api/standard-schedules", standardScheduleRoutes); // ✅ updated

export default app;
