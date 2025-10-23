import { Request, Response } from "express";
import TargetedPlan from "../../models/TargetedPlan";

/* ============================================================================
   🟢 CREATE — Create a new targeted plan
   ✅ Stores ability name + level
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
              abilities: (ch.abilities || []).map((a: any) =>
                typeof a === "string" ? { name: a, level: 0 } : a
              ),
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
   🟡 SUMMARY — Get minimal info for list display
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
   ✅ Converts old string-based abilities to { name, level }
============================================================================ */
/* ============================================================================
   🔍 DETAIL — Get full info for one plan (with merged abilities)
============================================================================ */
export const getTargetedPlanDetail = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await TargetedPlan.findOne({ planId })
      .populate("characters")
      .populate("groups.characters.characterId")
      .lean();

    if (!plan) {
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    // ✅ Merge populated character data + stored ability levels
    const mergedGroups = plan.groups.map((g: any) => ({
      ...g,
      characters: g.characters.map((ch: any) => {
        const populated = ch.characterId || {};
        const savedAbilities = Array.isArray(ch.abilities) ? ch.abilities : [];

        // 🧠 Combine everything into one unified object for frontend
        return {
          _id: populated._id?.toString() || ch.characterId?.toString(),
          name: populated.name || "未知角色",
          account: populated.account || "",
          role: populated.role || "",
          server: populated.server || plan.server || "",
          abilities: populated.abilities || {}, // full level map
          selectedAbilities: savedAbilities.map((a: any) => ({
            name: a.name,
            level: a.level ?? 0,
          })),
        };
      }),
    }));

    const result = { ...plan, groups: mergedGroups };

    console.log(`📤 [Backend] Returned merged targeted plan for ${planId}`);
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching targeted plan detail:", err);
    res.status(500).json({ error: "Failed to fetch targeted plan detail" });
  }
};

/* ============================================================================
   ✏️ UPDATE — Update existing plan with new group data
============================================================================ */
export const updateTargetedPlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const update = req.body;

    const plan = await TargetedPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    if (update.name) plan.name = update.name;
    if (update.server) plan.server = update.server;
    if (update.targetedBoss) plan.targetedBoss = update.targetedBoss;
    if (update.characterCount !== undefined)
      plan.characterCount = update.characterCount;
    if (Array.isArray(update.characters)) plan.characters = update.characters;

    if (Array.isArray(update.groups)) {
      plan.groups = update.groups.map((g: any) => ({
        index: g.index,
        characters:
          g.characters?.map((ch: any) => ({
            characterId: ch.characterId,
            abilities: (ch.abilities || []).map((a: any) =>
              typeof a === "string" ? { name: a, level: 0 } : a
            ),
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
