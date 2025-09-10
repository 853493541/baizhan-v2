import express from "express";
import cors from "cors";
import { connectDB } from "./db";
import characterRoutes from "./routes/characterRoutes";
import mapRoutes from "./routes/mapRoutes";

const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: "http://localhost:3000", // allow frontend
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api/characters", characterRoutes);
app.use("/api/weekly-map", mapRoutes);

export default app;
