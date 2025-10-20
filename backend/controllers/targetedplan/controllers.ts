import { Request, Response } from "express";
import TargetedPlan from "../../models/TargetedPlan";

/* ============================================================================
   🟢 CREATE — Create a new targeted plan
   ✅ Includes duplicate protection and per-character abilities support
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
      groups:
        groups?.map((g: any) => ({
          index: g.index,
          characters:
            g.characters?.map((ch: any) => ({
              characterId: ch.characterId,
              abilities: ch.abilities || [],
            })) || [],
          status: g.status || "not_started",
          kills: g.kills || [],
        })) || [],
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
   🟡 SUMMARY — Get minimal info for list display (no populate)
============================================================================ */
export const getTargetedPlansSummary = async (_: Request, res: Response) => {
  try {
    const plans = await TargetedPlan.find(
      {},
      "planId name server targetedBoss characterCount createdAt"
    )
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📤 Returned ${plans.length} targeted plans (summary only)`);
    res.json(plans);
  } catch (err) {
    console.error("❌ Error fetching targeted plans summary:", err);
    res.status(500).json({ error: "Failed to fetch targeted plans summary" });
  }
};

/* ============================================================================
   🔍 DETAIL — Get full info for one plan (with characters populated)
============================================================================ */
export const getTargetedPlanDetail = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await TargetedPlan.findOne({ planId })
      .populate("characters")
      .populate("groups.characters.characterId"); // ✅ populate nested characterId

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
   ✏️ UPDATE — Update plan (including groups + per-character abilities)
============================================================================ */
export const updateTargetedPlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const update = req.body;

    const plan = await TargetedPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    // ✅ Merge high-level fields
    if (update.name) plan.name = update.name;
    if (update.server) plan.server = update.server;
    if (update.targetedBoss) plan.targetedBoss = update.targetedBoss;
    if (update.characterCount !== undefined)
      plan.characterCount = update.characterCount;
    if (Array.isArray(update.characters)) plan.characters = update.characters;

    // ✅ Replace group data safely
    if (Array.isArray(update.groups)) {
      plan.groups = update.groups.map((g: any) => ({
        index: g.index,
        characters:
          g.characters?.map((ch: any) => ({
            characterId: ch.characterId,
            abilities: ch.abilities || [],
          })) || [],
        status: g.status || "not_started",
        kills: g.kills || [],
      }));
    }

    await plan.save();

    const populated = await TargetedPlan.findOne({ planId })
      .populate("characters")
      .populate("groups.characters.characterId");

    console.log("✏️ Updated targeted plan:", planId);
    res.json(populated);
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
