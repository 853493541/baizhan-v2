import { Request, Response } from "express";
import TargetedPlan from "../../models/TargetedPlan";

/* ============================================================================
   🟢 CREATE — Create a new targeted plan
   ✅ Added duplicate planId protection for React Strict Mode / race conditions
============================================================================ */
export const createTargetedPlan = async (req: Request, res: Response) => {
  try {
    const {
      planId,
      type = "targeted",
      name,
      server,
      targetedBoss,
      characterCount,
      characters,
      groups,
    } = req.body;

    if (!server || !targetedBoss) {
      return res
        .status(400)
        .json({ error: "Missing required fields: server or targetedBoss" });
    }

    // ✅ Prevent duplicate plan creation if same UUID is submitted twice
    const existing = await TargetedPlan.findOne({ planId });
    if (existing) {
      console.warn("⚠️ Duplicate planId detected, returning existing:", planId);
      return res.status(200).json(existing);
    }

    console.log("📥 [Backend] Creating targeted plan:", {
      planId,
      type,
      name,
      server,
      targetedBoss,
      characterCount,
      charactersCount: characters?.length,
      groupsCount: groups?.length,
    });

    const plan = new TargetedPlan({
      planId,
      type,
      name: name || `${server}-${targetedBoss}-计划`,
      server,
      targetedBoss,
      characterCount: characterCount || 0,
      characters: characters || [],
      groups: groups || [],
    });

    await plan.save();

    console.log("✅ [Backend] Created targeted plan:", plan.planId);
    res.status(201).json(plan);
  } catch (err) {
    console.error("❌ [Backend] Error creating targeted plan:", err);
    res.status(500).json({ error: "Failed to create targeted plan" });
  }
};

/* ============================================================================
   🟡 SUMMARY — Get only minimal info for list display (NO populate)
============================================================================ */
export const getTargetedPlansSummary = async (_: Request, res: Response) => {
  try {
    const plans = await TargetedPlan.find(
      {},
      "planId name server targetedBoss characterCount createdAt"
    )
      .sort({ createdAt: -1 })
      .lean(); // 🚀 No populate, lightweight query

    console.log(`📤 Returned ${plans.length} targeted plans (summary only)`);
    res.json(plans);
  } catch (err) {
    console.error("❌ Error fetching targeted plans summary:", err);
    res.status(500).json({ error: "Failed to fetch targeted plans summary" });
  }
};

/* ============================================================================
   🔍 DETAIL — Get full info for one plan (includes groups + characters)
============================================================================ */
export const getTargetedPlanDetail = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await TargetedPlan.findOne({ planId })
      .populate("characters")
      .populate("groups.characters"); // ✅ only populate for detail view

    if (!plan) {
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    console.log(`📤 Returned detailed targeted plan for ${planId}`);
    res.json(plan);
  } catch (err) {
    console.error("❌ Error fetching targeted plan detail:", err);
    res.status(500).json({ error: "Failed to fetch targeted plan detail" });
  }
};

/* ============================================================================
   ✏️ UPDATE — Update plan (including groups)
============================================================================ */
export const updateTargetedPlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const update = req.body;

    const updated = await TargetedPlan.findOneAndUpdate({ planId }, update, {
      new: true,
    })
      .populate("characters")
      .populate("groups.characters");

    if (!updated) {
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    console.log("✏️ Updated targeted plan:", updated.planId);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating targeted plan:", err);
    res.status(500).json({ error: "Failed to update targeted plan" });
  }
};

/* ============================================================================
   🗑️ DELETE — Remove a targeted plan
============================================================================ */
export const deleteTargetedPlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const deleted = await TargetedPlan.findOneAndDelete({ planId });

    if (!deleted) {
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    console.log("🗑️ Deleted targeted plan:", planId);
    res.json({ message: "Targeted plan deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting targeted plan:", err);
    res.status(500).json({ error: "Failed to delete targeted plan" });
  }
};
