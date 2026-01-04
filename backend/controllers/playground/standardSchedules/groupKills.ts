import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

/**
 * ✅ Update or insert a single PRIMARY kill record inside a group
 * ✅ FIXED: preserves existing secondary drop
 */
export const updateGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;
    const { boss, selection } = req.body;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    console.log(
      `⚡ Primary drop update: group ${groupIndex}, floor ${floorNum} in ${id}`
    );

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find(
      (g: any) => g.index === groupIndex
    );
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // 🔍 Find existing kill (if any)
    let kill = group.kills.find((k: any) => k.floor === floorNum);

    if (!kill) {
      // 🆕 Create new kill (no secondary yet)
      kill = {
        floor: floorNum,
        boss,
        selection,
        completed: !!(selection?.ability || selection?.noDrop),
        recordedAt: new Date(),
      };

      group.kills.push(kill);
    } else {
      // ♻️ Update PRIMARY only
      kill.boss = boss;
      kill.selection = selection;
      kill.completed = true;
      kill.recordedAt = new Date();

      // ❗ IMPORTANT: DO NOT TOUCH selectionSecondary
    }

    await schedule.save();

    console.log("✅ Primary drop saved:", {
      groupIndex,
      floorNum,
      hasSecondary: !!kill.selectionSecondary,
    });

    res.json({ success: true, kill });
  } catch (err) {
    console.error("❌ updateGroupKill error:", err);
    res.status(500).json({ error: "Failed to update group kill" });
  }
};

/**
 * ✅ Insert or replace SECONDARY drop for a kill
 * ✅ FIXED: always overwrites secondary safely
 */
export const updateSecondaryDrop = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;
    const { selection } = req.body;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    console.log(
      `➕ Secondary drop update: group ${groupIndex}, floor ${floorNum}`
    );

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find(
      (g: any) => g.index === groupIndex
    );
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const kill = group.kills.find((k: any) => k.floor === floorNum);
    if (!kill) {
      return res.status(404).json({
        error: "Primary drop must exist before assigning secondary",
      });
    }

    // ♻️ Always overwrite secondary
    kill.selectionSecondary = selection;
    kill.completed = true;
    kill.recordedAt = new Date();

    await schedule.save();

    console.log("✅ Secondary drop saved:", {
      groupIndex,
      floorNum,
    });

    res.json({ success: true, kill });
  } catch (err) {
    console.error("❌ updateSecondaryDrop error:", err);
    res.status(500).json({ error: "Failed to update secondary drop" });
  }
};

/**
 * ✅ Delete a single kill record by floor
 * (explicit reset — wipes primary + secondary)
 */
export const deleteGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    console.log(
      `🗑️ Deleting kill floor ${floorNum} of group ${groupIndex} in schedule ${id}`
    );

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find(
      (g: any) => g.index === groupIndex
    );
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const before = group.kills.length;
    group.kills = group.kills.filter(
      (k: any) => k.floor !== floorNum
    );

    if (before === group.kills.length) {
      return res.status(404).json({
        error: "Kill record not found for this floor",
      });
    }

    await schedule.save();

    console.log("✅ Kill deleted:", {
      groupIndex,
      floorNum,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteGroupKill error:", err);
    res.status(500).json({ error: "Failed to delete group kill" });
  }
};

/**
 * ✅ Get only one group's kills (and status)
 * (unchanged, correct here)
 */
export const getGroupKills = async (req: Request, res: Response) => {
  try {
    const { id, index } = req.params;
    const groupIndex = parseInt(index, 10);

    const schedule = await StandardSchedule.findById(id, {
      groups: 1,
    }).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups?.find(
      (g: any) => g.index === groupIndex
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json({
      index: group.index,
      status: group.status,
      kills: group.kills || [],
      startTime: group.startTime || null,
      endTime: group.endTime || null,
    });
  } catch (err) {
    console.error("❌ getGroupKills error:", err);
    res.status(500).json({ error: "Failed to fetch group kills" });
  }
};
