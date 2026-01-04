import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

/* ======================================================
   PRIMARY DROP UPDATE
   - Updates or inserts primary
   - NEVER touches secondary
====================================================== */
export const updateGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;
    const { boss, selection } = req.body;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find((g: any) => g.index === groupIndex);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    let kill = group.kills.find((k: any) => k.floor === floorNum);

    if (!kill) {
      kill = {
        floor: floorNum,
        boss,
        selection: {
          ...selection,
          status: selection?.status ?? "assigned",
        },
        completed: !!(selection?.ability || selection?.noDrop),
        recordedAt: new Date(),
      };
      group.kills.push(kill);
    } else {
      kill.boss = boss;
      kill.selection = {
        ...kill.selection,
        ...selection,
        status:
          selection?.status ??
          kill.selection?.status ??
          "assigned",
      };
      kill.completed = true;
      kill.recordedAt = new Date();
    }

    await schedule.save();
    res.json({ success: true, kill });
  } catch (err) {
    console.error("❌ updateGroupKill error:", err);
    res.status(500).json({ error: "Failed to update group kill" });
  }
};

/* ======================================================
   SECONDARY DROP UPDATE
   - Requires primary to exist
   - NEVER modifies primary
====================================================== */
export const updateSecondaryDrop = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;
    const { selection } = req.body;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find((g: any) => g.index === groupIndex);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const kill = group.kills.find((k: any) => k.floor === floorNum);
    if (!kill) {
      return res.status(404).json({
        error: "Primary drop must exist before assigning secondary",
      });
    }

    kill.selectionSecondary = {
      ...kill.selectionSecondary,
      ...selection,
      status:
        selection?.status ??
        kill.selectionSecondary?.status ??
        "assigned",
    };

    kill.completed = true;
    kill.recordedAt = new Date();

    await schedule.save();
    res.json({ success: true, kill });
  } catch (err) {
    console.error("❌ updateSecondaryDrop error:", err);
    res.status(500).json({ error: "Failed to update secondary drop" });
  }
};

/* ======================================================
   ✅ FIXED RESET (AUTHORITATIVE)
   - Deletes the ENTIRE kill record
   - Wipes primary + secondary together
   - Prevents orphaned secondary state
====================================================== */
export const deleteGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find((g: any) => g.index === groupIndex);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const before = group.kills.length;

    // 🔥 HARD DELETE — no partial reset allowed
    group.kills = group.kills.filter((k: any) => k.floor !== floorNum);

    if (before === group.kills.length) {
      return res.status(404).json({
        error: "Kill record not found for this floor",
      });
    }

    await schedule.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteGroupKill error:", err);
    res.status(500).json({ error: "Failed to delete group kill" });
  }
};

/* ======================================================
   GET GROUP KILLS (READ-ONLY)
====================================================== */
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

    const group = schedule.groups?.find((g: any) => g.index === groupIndex);
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
