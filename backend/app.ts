import express from "express";
import cors from "cors";
import { connectDB } from "./db";
import characterRoutes from "./routes/characterRoutes";
import mapRoutes from "./routes/mapRoutes";
import standardScheduleRoutes from "./routes/standardScheduleRoutes"; // ✅ renamed
import bossPlanRoutes from "./routes/bossPlanRoutes";
import catalogRoutes from "./routes/catalogRoutes";



const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: "http://localhost:3000", // allow frontend
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// ✅ Connect DB
connectDB();

// ✅ Routes
app.use("/api/characters", characterRoutes);
app.use("/api/weekly-map", mapRoutes);
app.use("/api/standard-schedules", standardScheduleRoutes); // ✅ updated
app.use("/api/boss-plans", bossPlanRoutes);
app.use("/api/catalogs", catalogRoutes);


export default app;
