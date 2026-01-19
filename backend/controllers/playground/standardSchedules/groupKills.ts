import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

/* ======================================================
   PRIMARY DROP UPDATE (AUTHORITATIVE)
   - Enforces mutually exclusive states
   - noDrop wipes ability + character
   - ability forces noDrop = false
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

    // ===============================
    // CREATE
    // ===============================
    if (!kill) {
      let normalizedSelection: any = undefined;

      if (selection) {
        // 🟢 NO DROP MODE
        if (selection.noDrop === true) {
          normalizedSelection = {
            noDrop: true,
            status: selection.status ?? "assigned",
          };
        }
        // 🟢 ABILITY MODE
        else if (selection.ability) {
          normalizedSelection = {
            ability: selection.ability,
            level: selection.level,
            characterId: selection.characterId,
            noDrop: false,
            status: selection.status ?? "assigned",
          };
        }
      }

      kill = {
        floor: floorNum,
        boss,
        selection: normalizedSelection,
        completed: !!(
          normalizedSelection?.noDrop ||
          normalizedSelection?.ability
        ),
        recordedAt: new Date(),
      };

      group.kills.push(kill);

      console.log(
        "🟢 [PRIMARY][CREATE]",
        `floor=${floorNum}`,
        normalizedSelection
      );
    }

    // ===============================
    // UPDATE
    // ===============================
    else {
      kill.boss = boss;

      if (selection) {
        // 🔒 NO DROP IS AUTHORITATIVE
        if (selection.noDrop === true) {
          kill.selection = {
            noDrop: true,
            status:
              selection.status ??
              kill.selection?.status ??
              "assigned",
          };

          console.log(
            "🔴 [PRIMARY][MODE]",
            `floor=${floorNum}`,
            "→ NO DROP"
          );
        }

        // 🔒 ABILITY MODE (forces noDrop false)
        else if (selection.ability) {
          kill.selection = {
            ability: selection.ability,
            level: selection.level,
            characterId: selection.characterId,
            noDrop: false,
            status:
              selection.status ??
              kill.selection?.status ??
              "assigned",
          };

          console.log(
            "🟢 [PRIMARY][MODE]",
            `floor=${floorNum}`,
            "→ ABILITY",
            selection.ability
          );
        }
      }

      // ✅ derive completion (never force blindly)
      kill.completed = !!(
        kill.selection?.noDrop ||
        kill.selection?.ability ||
        kill.selectionSecondary
      );

      kill.recordedAt = new Date();

      // 🔒 Explicitly preserve secondary
      if (kill.selectionSecondary) {
        console.log(
          "🔒 [SECONDARY][PRESERVED]",
          `floor=${floorNum}`,
          kill.selectionSecondary.status
        );
      }
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

    if (!selection) {
      return res.status(400).json({ error: "Selection required" });
    }

    // ===============================
    // AUTHORITATIVE MODE NORMALIZATION
    // ===============================
    if (selection.noDrop === true) {
      kill.selectionSecondary = {
        noDrop: true,
        status:
          selection.status ??
          kill.selectionSecondary?.status ??
          "assigned",
      };

      console.log(
        "🟣 [SECONDARY][MODE]",
        `floor=${floorNum}`,
        "→ NO DROP"
      );
    } else if (selection.ability) {
      kill.selectionSecondary = {
        ability: selection.ability,
        level: selection.level,
        characterId: selection.characterId,
        noDrop: false,
        status:
          selection.status ??
          kill.selectionSecondary?.status ??
          "assigned",
      };

      console.log(
        "🟣 [SECONDARY][MODE]",
        `floor=${floorNum}`,
        "→ ABILITY",
        selection.ability
      );
    }

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
   RESET (AUTHORITATIVE)
   - Deletes ENTIRE kill record
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

    group.kills = group.kills.filter(
      (k: any) => k.floor !== floorNum
    );

    console.log(
      "🗑️ [KILL][RESET]",
      `floor=${floorNum}`,
      "deleted"
    );

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
