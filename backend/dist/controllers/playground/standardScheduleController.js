"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupKills = exports.updateScheduleName = exports.deleteGroupKill = exports.updateGroupKill = exports.updateGroupStatus = exports.updateStandardSchedule = exports.deleteStandardSchedule = exports.getStandardScheduleById = exports.getStandardSchedules = exports.createStandardSchedule = void 0;
const StandardSchedule_1 = __importDefault(require("../../models/StandardSchedule"));
// ✅ Create new standard schedule
const createStandardSchedule = async (req, res) => {
    try {
        const { name, server, conflictLevel, checkedAbilities, characterCount, characters, groups, } = req.body;
        // 🔍 Debug: what backend actually received
        console.log("📥 [Backend] Received payload:", {
            name,
            server,
            conflictLevel,
            characterCount,
            charactersCount: characters?.length,
            groupsCount: groups?.length,
            checkedAbilitiesPreview: Array.isArray(checkedAbilities)
                ? checkedAbilities.slice(0, 5)
                : checkedAbilities,
        });
        const schedule = new StandardSchedule_1.default({
            name: name || "未命名排表",
            server,
            conflictLevel,
            checkedAbilities,
            characterCount,
            characters,
            groups,
        });
        // 🔍 Debug: what Mongoose doc looks like before save
        console.log("📋 [Backend] Schedule doc before save:", {
            name: schedule.name,
            server: schedule.server,
            conflictLevel: schedule.conflictLevel,
            checkedAbilitiesPreview: schedule.checkedAbilities?.slice(0, 5),
            characterCount: schedule.characterCount,
            charactersCount: schedule.characters?.length,
            groupsCount: schedule.groups?.length,
        });
        await schedule.save();
        // 🔍 Debug: reload from DB to confirm what was actually persisted
        const saved = await StandardSchedule_1.default.findById(schedule._id).lean();
        console.log("💾 [Backend] Saved doc in DB (preview):", {
            id: saved?._id,
            checkedAbilitiesCount: saved?.checkedAbilities?.length,
            checkedAbilitiesPreview: saved?.checkedAbilities?.slice(0, 5),
        });
        console.log("✅ [Backend] Saved standard schedule with ID:", schedule._id);
        res.status(201).json(schedule);
    }
    catch (err) {
        console.error("❌ [Backend] Error creating standard schedule:", err);
        res.status(500).json({ error: "Failed to create standard schedule" });
    }
};
exports.createStandardSchedule = createStandardSchedule;
// ✅ Get all standard schedules
const getStandardSchedules = async (req, res) => {
    try {
        const schedules = await StandardSchedule_1.default.find()
            .sort({ createdAt: -1 })
            .populate("characters")
            .populate("groups.characters");
        console.log("📤 Returning", schedules.length, "standard schedules");
        res.json(schedules);
    }
    catch (err) {
        console.error("❌ Error fetching standard schedules:", err);
        res.status(500).json({ error: "Failed to fetch standard schedules" });
    }
};
exports.getStandardSchedules = getStandardSchedules;
// ✅ Get one standard schedule by ID
const getStandardScheduleById = async (req, res) => {
    try {
        const schedule = await StandardSchedule_1.default.findById(req.params.id)
            .populate("characters")
            .populate("groups.characters");
        if (!schedule) {
            return res.status(404).json({ error: "Standard schedule not found" });
        }
        res.json(schedule);
    }
    catch (err) {
        console.error("❌ Error fetching standard schedule:", err);
        res.status(500).json({ error: "Failed to fetch standard schedule" });
    }
};
exports.getStandardScheduleById = getStandardScheduleById;
// ✅ Delete standard schedule by ID
const deleteStandardSchedule = async (req, res) => {
    try {
        const deleted = await StandardSchedule_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Standard schedule not found" });
        }
        res.json({ message: "Standard schedule deleted successfully" });
    }
    catch (err) {
        console.error("❌ Error deleting standard schedule:", err);
        res.status(500).json({ error: "Failed to delete standard schedule" });
    }
};
exports.deleteStandardSchedule = deleteStandardSchedule;
// ✅ Update standard schedule groups (only groups, without wiping abilities/etc)
const updateStandardSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { groups } = req.body;
        console.log("📥 Updating groups for schedule:", id, "with groups:", groups);
        const updated = await StandardSchedule_1.default.findByIdAndUpdate(id, { $set: { groups } }, { new: true })
            .populate("characters")
            .populate("groups.characters");
        if (!updated) {
            return res.status(404).json({ error: "Standard schedule not found" });
        }
        console.log("✅ Updated groups for schedule:", updated._id);
        res.json(updated);
    }
    catch (err) {
        console.error("❌ Error updating standard schedule:", err);
        res.status(500).json({ error: "Failed to update standard schedule" });
    }
};
exports.updateStandardSchedule = updateStandardSchedule;
// ✅ Update a single group's status
const updateGroupStatus = async (req, res) => {
    try {
        const { id, index } = req.params;
        const { status } = req.body;
        console.log(`📥 Updating status of group ${index} in schedule ${id} to ${status}`);
        const updated = await StandardSchedule_1.default.findOneAndUpdate({ _id: id, "groups.index": parseInt(index) }, { $set: { "groups.$.status": status } }, { new: true })
            .populate("characters")
            .populate("groups.characters");
        if (!updated) {
            return res.status(404).json({ error: "Schedule or group not found" });
        }
        console.log("✅ Updated group status:", updated._id);
        res.json(updated);
    }
    catch (err) {
        console.error("❌ Error updating group status:", err);
        res.status(500).json({ error: "Failed to update group status" });
    }
};
exports.updateGroupStatus = updateGroupStatus;
// ✅ Update or insert a single kill record inside a group
const updateGroupKill = async (req, res) => {
    try {
        const { id, index, floor } = req.params;
        const { boss, selection } = req.body;
        const groupIndex = parseInt(index);
        const floorNum = parseInt(floor);
        console.log(`⚡ Fast update (final): group ${groupIndex}, floor ${floorNum} in ${id}`);
        // Build new kill record
        const newKill = {
            floor: floorNum,
            boss,
            completed: !!(selection?.ability || selection?.noDrop),
            selection,
            recordedAt: new Date(),
        };
        // 🧩 Step 1: remove existing kill (if any)
        await StandardSchedule_1.default.updateOne({ _id: id, "groups.index": groupIndex }, { $pull: { "groups.$.kills": { floor: floorNum } } });
        // 🧩 Step 2: push new kill
        const updated = await StandardSchedule_1.default.findOneAndUpdate({ _id: id, "groups.index": groupIndex }, { $push: { "groups.$.kills": newKill } }, { new: true }).lean();
        if (!updated) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        // 🧩 Step 3: extract just the updated group
        const updatedGroup = updated.groups?.find((g) => g.index === groupIndex);
        if (!updatedGroup) {
            return res.status(404).json({ error: "Group not found" });
        }
        console.log("✅ Updated group kill (fast final):", {
            groupIndex,
            floorNum,
            kills: updatedGroup.kills.length,
        });
        res.json({ success: true, updatedGroup });
    }
    catch (err) {
        console.error("❌ updateGroupKill error:", err);
        res.status(500).json({ error: "Failed to update group kill" });
    }
};
exports.updateGroupKill = updateGroupKill;
// ✅ Delete a single kill record by floor
const deleteGroupKill = async (req, res) => {
    try {
        const { id, index, floor } = req.params;
        console.log(`🗑️ Deleting kill floor ${floor} of group ${index} in schedule ${id}`);
        const schedule = await StandardSchedule_1.default.findById(id);
        if (!schedule)
            return res.status(404).json({ error: "Schedule not found" });
        const group = schedule.groups.find((g) => g.index === parseInt(index));
        if (!group)
            return res.status(404).json({ error: "Group not found" });
        const before = group.kills.length;
        group.kills = group.kills.filter((k) => k.floor !== parseInt(floor));
        const after = group.kills.length;
        if (before === after) {
            return res.status(404).json({ error: "Kill record not found for this floor" });
        }
        await schedule.save();
        console.log("✅ Deleted group kill:", { groupIndex: index, floor });
        const populated = await StandardSchedule_1.default.findById(id)
            .populate("characters")
            .populate("groups.characters");
        res.json(populated);
    }
    catch (err) {
        console.error("❌ Error deleting group kill:", err);
        res.status(500).json({ error: "Failed to delete group kill" });
    }
};
exports.deleteGroupKill = deleteGroupKill;
// ✅ Update schedule name
const updateScheduleName = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Name is required" });
        }
        const updated = await StandardSchedule_1.default.findByIdAndUpdate(id, { $set: { name: name.trim() } }, { new: true });
        if (!updated) {
            return res.status(404).json({ error: "Standard schedule not found" });
        }
        console.log("✏️ Updated schedule name:", updated._id, "->", updated.name);
        res.json(updated);
    }
    catch (err) {
        console.error("❌ Error updating schedule name:", err);
        res.status(500).json({ error: "Failed to update schedule name" });
    }
};
exports.updateScheduleName = updateScheduleName;
// ✅ Get only one group's kills (and status)
const getGroupKills = async (req, res) => {
    try {
        const { id, index } = req.params;
        const schedule = await StandardSchedule_1.default.findById(id, { groups: 1 }); // only pull groups
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        const group = schedule.groups.find((g) => g.index === parseInt(index));
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        // ✅ Return only minimal fields
        res.json({
            index: group.index,
            status: group.status,
            kills: group.kills || [],
        });
    }
    catch (err) {
        console.error("❌ Error fetching group kills:", err);
        res.status(500).json({ error: "Failed to fetch group kills" });
    }
};
exports.getGroupKills = getGroupKills;
