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
const compression_1 = __importDefault(require("compression"));
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
        // allow requests with no origin (like mobile apps, curl, Postman)
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
app.use(express_1.default.json());
// ✅ Connect DB
(0, db_1.connectDB)();
app.use((0, compression_1.default)());
// ✅ Routes
app.use("/api/characters", characterRoutes_1.default);
app.use("/api/weekly-map", mapRoutes_1.default);
app.use("/api/standard-schedules", standardScheduleRoutes_1.default); // ✅ updated
app.use("/api/boss-plans", bossPlanRoutes_1.default);
exports.default = app;
