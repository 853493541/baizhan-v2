import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

export const markGroupStarted = async (req: Request, res: Response) => {
  try {
    const { id, index } = req.params;
    const groupIndex = parseInt(index);

    console.log(
      `▶️ [GroupLifecycle] Mark start: schedule=${id}, group=${groupIndex}`
    );

    const updated = await StandardSchedule.findOneAndUpdate(
      {
        _id: id,
        "groups.index": groupIndex,
        $or: [
          { "groups.startTime": { $exists: false } },
          { "groups.startTime": null },
        ],
      },
      {
        $set: {
          "groups.$.startTime": new Date(),
          "groups.$.status": "started",
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.json({
        success: true,
        alreadyStarted: true,
      });
    }

    const group = updated.groups?.find(
      (g: any) => g.index === groupIndex
    );

    console.log(
      `⏱ [GroupLifecycle] startTime written: ${group?.startTime}`
    );

    res.json({
      success: true,
      startTime: group?.startTime,
    });
  } catch (err) {
    console.error("❌ [GroupLifecycle] markGroupStarted error:", err);
    res.status(500).json({ error: "Failed to mark group started" });
  }
};
export const markGroupFinished = async (req: Request, res: Response) => {
  try {
    const { id, index } = req.params;
    const groupIndex = parseInt(index);

    console.log(
      `⏹️ [GroupLifecycle] Mark end: schedule=${id}, group=${groupIndex}`
    );

    const updated = await StandardSchedule.findOneAndUpdate(
      {
        _id: id,
        "groups.index": groupIndex,
        $or: [
          { "groups.endTime": { $exists: false } },
          { "groups.endTime": null },
        ],
      },
      {
        $set: {
          "groups.$.endTime": new Date(),
          "groups.$.status": "finished",
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.json({
        success: true,
        alreadyFinished: true,
      });
    }

    const group = updated.groups?.find(
      (g: any) => g.index === groupIndex
    );

    console.log(
      `⏱ [GroupLifecycle] endTime written: ${group?.endTime}`
    );

    res.json({
      success: true,
      endTime: group?.endTime,
    });
  } catch (err) {
    console.error("❌ [GroupLifecycle] markGroupFinished error:", err);
    res.status(500).json({ error: "Failed to mark group finished" });
  }
};
