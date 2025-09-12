import { Request, Response } from "express";
import BossPlan from "../../models/BossPlan";

// Create a new boss plan
export const createBossPlan = async (req: Request, res: Response) => {
  try {
    const plan = new BossPlan(req.body);
    const saved = await plan.save();
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Get all boss plans
export const getBossPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await BossPlan.find(); // ✅ no populate
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get single boss plan by ID
export const getBossPlanById = async (req: Request, res: Response) => {
  try {
    const plan = await BossPlan.findById(req.params.id); // ✅ no populate
    if (!plan) return res.status(404).json({ error: "Boss plan not found" });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Update boss plan
export const updateBossPlan = async (req: Request, res: Response) => {
  try {
    const updated = await BossPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }); // ✅ no populate
    if (!updated) return res.status(404).json({ error: "Boss plan not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Delete boss plan
export const deleteBossPlan = async (req: Request, res: Response) => {
  try {
    const deleted = await BossPlan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Boss plan not found" });
    res.json({ message: "Boss plan deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
