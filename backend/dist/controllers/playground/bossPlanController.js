"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBossPlan = exports.updateBossPlan = exports.getBossPlanById = exports.getBossPlans = exports.createBossPlan = void 0;
const BossPlan_1 = __importDefault(require("../../models/BossPlan"));
// Create a new boss plan
const createBossPlan = async (req, res) => {
    try {
        const plan = new BossPlan_1.default(req.body);
        const saved = await plan.save();
        res.status(201).json(saved);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createBossPlan = createBossPlan;
// Get all boss plans
const getBossPlans = async (_req, res) => {
    try {
        const plans = await BossPlan_1.default.find(); // ✅ no populate
        res.json(plans);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getBossPlans = getBossPlans;
// Get single boss plan by ID
const getBossPlanById = async (req, res) => {
    try {
        const plan = await BossPlan_1.default.findById(req.params.id); // ✅ no populate
        if (!plan)
            return res.status(404).json({ error: "Boss plan not found" });
        res.json(plan);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getBossPlanById = getBossPlanById;
// Update boss plan
const updateBossPlan = async (req, res) => {
    try {
        const updated = await BossPlan_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        }); // ✅ no populate
        if (!updated)
            return res.status(404).json({ error: "Boss plan not found" });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.updateBossPlan = updateBossPlan;
// Delete boss plan
const deleteBossPlan = async (req, res) => {
    try {
        const deleted = await BossPlan_1.default.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ error: "Boss plan not found" });
        res.json({ message: "Boss plan deleted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteBossPlan = deleteBossPlan;
