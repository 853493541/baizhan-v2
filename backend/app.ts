// backend/app.ts
import express from "express";
import { connectDB } from "./db";
import characterRoutes from "./routes/characterRoutes";

const app = express();
app.use(express.json());

// connect DB
connectDB();

// mount character routes
app.use("/api/characters", characterRoutes);

export default app;
