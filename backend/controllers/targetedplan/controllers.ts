import { Request, Response } from "express";
import TargetedPlan from "../../models/TargetedPlan";

/* ============================================================================
   🟢 CREATE — Create a new targeted plan
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
          drops: g.drops || [], // ✅ each group has its own drops
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
   🔍 DETAIL — Get full info for one plan (with merged character abilities)
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
        return {
          _id: populated._id?.toString() || ch.characterId?.toString(),
          name: populated.name || "未知角色",
          account: populated.account || "",
          role: populated.role || "",
          server: populated.server || plan.server || "",
          abilities: populated.abilities || {},
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
   ✏️ UPDATE — Update existing plan (general fields + groups)
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

    // ✅ merge logic with safe typing
    if (Array.isArray(update.groups)) {
      plan.groups = update.groups.map((g: any) => {
        const existing: any =
          plan.groups.find((x: any) => x.index === g.index) || {};

        return {
          index: g.index,
          characters:
            g.characters?.map((ch: any) => ({
              characterId: ch.characterId,
              abilities: (ch.abilities || []).map((a: any) =>
                typeof a === "string" ? { name: a, level: 0 } : a
              ),
            })) || [],
          status:
            g.status !== undefined
              ? g.status
              : existing.status !== undefined
              ? existing.status
              : "not_started",

          // ✅ preserve existing kills/drops if not included
          kills:
            Array.isArray(g.kills) && g.kills.length > 0
              ? g.kills
              : existing.kills || [],
          drops:
            Array.isArray(g.drops) && g.drops.length > 0
              ? g.drops
              : existing.drops || [],
        };
      });
    }

    plan.markModified("groups");
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

/* ============================================================================
   ⚔️ ADD DROP RECORD — append to group.drops[]
============================================================================ */
/* ============================================================================
   ⚔️ ADD DROP RECORD — append new drop(s) into the correct group
============================================================================ */
/* ============================================================================
   ⚔️ ADD DROP RECORD — append new drop(s) into the correct group (direct DB write)
============================================================================ */
/* ============================================================================
   ⚔️ ADD DROP RECORD — append new drop(s) into the correct group
============================================================================ */
/* ============================================================================
   ⚔️ ADD DROP RECORD — append new drop(s) and persist to Mongo
============================================================================ */
export const addDropRecord = async (req: Request, res: Response) => {
  try {
    const { planId, index } = req.params;
    const { characterId, ability, level } = req.body;

    console.log("📩 [Drops] Incoming addDropRecord:", {
      planId,
      index,
      characterId,
      ability,
      level,
    });

    if (!characterId || !ability || !level) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const plan = await TargetedPlan.findOne({ planId });
    if (!plan) {
      console.warn("❌ Plan not found:", planId);
      return res.status(404).json({ error: "Targeted plan not found" });
    }

    const groupIndex = parseInt(index);
    const group = plan.groups.find((g: any) => g.index === groupIndex);
    if (!group) {
      console.warn("❌ Group not found in plan:", groupIndex);
      return res.status(404).json({ error: "Group not found" });
    }

    // ✅ Ensure array exists
    if (!Array.isArray(group.drops)) group.drops = [];

    // ✅ Append new drop record
    const newDrop = {
      characterId,
      ability,
      level,
      timestamp: new Date(),
    };
    group.drops.push(newDrop);

    // ✅ Force Mongoose to recognize the nested change
    plan.markModified("groups");

    const result = await plan.save();

    console.log(
      `✅ [Drops] Added ${ability} (${level}) for ${characterId} in group ${groupIndex} of plan ${planId}`
    );
    console.log(
      "🧾 [Drops] Current drops in group:",
      result.groups.find((g: any) => g.index === groupIndex)?.drops
    );

    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Error adding drop record:", err);
    res.status(500).json({ error: "Failed to add drop record" });
  }
};



/* ============================================================================
   🔍 GET GROUP DROPS — fetch drops + kills for a given group
============================================================================ */
export const getGroupDrops = async (req: Request, res: Response) => {
  try {
    const { planId, index } = req.params;
    const plan = await TargetedPlan.findOne({ planId }, { groups: 1 });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const group = plan.groups.find((g: any) => g.index === parseInt(index));
    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json({
      index: group.index,
      status: group.status,
      drops: group.drops || [],
      kills: group.kills || [],
    });
  } catch (err) {
    console.error("❌ Error fetching group drops:", err);
    res.status(500).json({ error: "Failed to fetch group drops" });
  }
};

/* ============================================================================
   🗑️ DELETE DROP RECORD — remove a specific drop from group.drops[]
============================================================================ */
export const deleteGroupDrop = async (req: Request, res: Response) => {
  try {
    const { planId, index } = req.params;
    const { ability, characterId } = req.body;

    const plan = await TargetedPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const group = plan.groups.find((g: any) => g.index === parseInt(index));
    if (!group) return res.status(404).json({ error: "Group not found" });

    const before = group.drops.length;
    group.drops = group.drops.filter(
      (d: any) =>
        !(
          d.ability === ability &&
          d.characterId?.toString() === characterId?.toString()
        )
    );

    if (group.drops.length === before) {
      return res.status(404).json({ error: "Drop record not found" });
    }

    await plan.save();
    console.log(`🗑️ Deleted drop ${ability} from group ${index} of ${planId}`);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting drop record:", err);
    res.status(500).json({ error: "Failed to delete drop record" });
  }
};

/* ============================================================================
   🔁 UPDATE GROUP STATUS
============================================================================ */
export const updateGroupStatus = async (req: Request, res: Response) => {
  try {
    const { planId, index } = req.params;
    const { status } = req.body;

    const updated = await TargetedPlan.findOneAndUpdate(
      { planId, "groups.index": parseInt(index) },
      { $set: { "groups.$.status": status } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ error: "Group not found in plan" });

    console.log(`✅ Updated status of group ${index} in ${planId} to ${status}`);
    res.json({ success: true, status });
  } catch (err) {
    console.error("❌ Error updating group status:", err);
    res.status(500).json({ error: "Failed to update group status" });
  }
};
/* ============================================================================
   🔄 RESET PLAN — Set all groups to not_started and clear drops/kills
============================================================================ */
/* ============================================================================
   🔄 RESET PLAN — Set all groups to not_started and clear drops/kills
============================================================================ */
export const resetTargetedPlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await TargetedPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const now = new Date();

    // ✅ Reset groups (keep characters/abilities) and track time
    plan.groups = plan.groups.map((g: any) => ({
      ...g,
      status: "not_started",
      kills: [],
      drops: [],
      lastResetAt: now, // new field added per group
    }));

    plan.lastResetAt = now; // ✅ new global timestamp for this plan
    plan.markModified("groups");

    await plan.save();

    console.log(`🔄 [Reset] Cleared drops and reset statuses for ${planId} at ${now.toISOString()}`);
    res.json({
      success: true,
      message: "Plan reset successfully",
      lastResetAt: now,
    });
  } catch (err) {
    console.error("❌ Error resetting targeted plan:", err);
    res.status(500).json({ error: "Failed to reset targeted plan" });
  }
};
