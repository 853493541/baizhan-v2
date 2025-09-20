"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mapController_1 = require("../controllers/map/mapController");
const router = express_1.default.Router();
router.post("/", mapController_1.saveWeeklyMap);
router.get("/", mapController_1.getWeeklyMap);
exports.default = router;
