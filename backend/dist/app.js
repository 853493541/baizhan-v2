"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const characterRoutes_1 = __importDefault(require("./routes/characterRoutes"));
const mapRoutes_1 = __importDefault(require("./routes/mapRoutes"));
const standardScheduleRoutes_1 = __importDefault(require("./routes/standardScheduleRoutes")); // ✅ renamed
const bossPlanRoutes_1 = __importDefault(require("./routes/bossPlanRoutes"));
const app = (0, express_1.default)();
// ✅ Enable CORS
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // allow frontend
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express_1.default.json());
// ✅ Connect DB
(0, db_1.connectDB)();
// ✅ Routes
app.use("/api/characters", characterRoutes_1.default);
app.use("/api/weekly-map", mapRoutes_1.default);
app.use("/api/standard-schedules", standardScheduleRoutes_1.default); // ✅ updated
app.use("/api/boss-plans", bossPlanRoutes_1.default);
exports.default = app;
