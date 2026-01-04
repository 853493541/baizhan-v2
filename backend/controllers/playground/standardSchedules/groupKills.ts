import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

/**
 * ✅ Update or insert a kill record inside a group
 * ✅ FIXED: supports BOTH primary & secondary updates
 * ✅ FIXED: preserves existing data
 * ✅ FIXED: always normalizes status
 */
export const updateGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;
    const { boss, selection, selectionSecondary } = req.body;

    const groupIndex = parseInt(index, 10);
    const floorNum = parseInt(floor, 10);

    console.log(
      `⚡ Kill update: group ${groupIndex}, floor ${floorNum} in ${id}`
    );

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
      // 🆕 Create new kill
      kill = {
        floor: floorNum,
        boss,
        completed: true,
        recordedAt: new Date(),
      };

      if (selection) {
        kill.selection = {
          ...selection,
          status: selection?.status ?? "assigned",
        };
      }

      if (selectionSecondary) {
        kill.selectionSecondary = {
          ...selectionSecondary,
          status: selectionSecondary?.status ?? "assigned",
        };
      }

      group.kills.push(kill);
    } else {
      // ♻️ Update PRIMARY (if provided)
      if (selection) {
        kill.selection = {
          ...kill.selection,
          ...selection,
          status:
            selection?.status ??
            kill.selection?.status ??
            "assigned",
        };
      }

      // ♻️ Update SECONDARY (THIS WAS MISSING ❗)
      if (selectionSecondary) {
        kill.selectionSecondary = {
          ...kill.selectionSecondary,
          ...selectionSecondary,
          status:
            selectionSecondary?.status ??
            kill.selectionSecondary?.status ??
            "assigned",
        };
      }

      kill.boss = boss ?? kill.boss;
      kill.completed = true;
      kill.recordedAt = new Date();
    }

    await schedule.save();

    console.log("✅ Kill saved:", {
      groupIndex,
      floorNum,
      primaryStatus: kill.selection?.status,
      secondaryStatus: kill.selectionSecondary?.status,
    });

    res.json({ success: true, kill });
  } catch (err) {
    console.error("❌ updateGroupKill error:", err);
    res.status(500).json({ error: "Failed to update group kill" });
  }
};

/**
 * ✅ Insert or replace SECONDARY drop (standalone endpoint)
 * (Still valid, but no longer required by frontend)
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

    console.log("✅ Secondary drop saved:", {
      groupIndex,
      floorNum,
      status: kill.selectionSecondary.status,
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

    const group = schedule.groups.find((g: any) => g.index === groupIndex);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const before = group.kills.length;
    group.kills = group.kills.filter((k: any) => k.floor !== floorNum);

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
 * ✅ Get only one group's kills (unchanged)
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
