"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGroupKill = exports.updateGroupKill = exports.updateGroupStatus = exports.updateStandardSchedule = exports.deleteStandardSchedule = exports.getStandardScheduleById = exports.getStandardSchedules = exports.createStandardSchedule = void 0;
const StandardSchedule_1 = __importDefault(require("../../models/StandardSchedule"));
// ✅ Create new standard schedule
const createStandardSchedule = async (req, res) => {
    try {
        const { name, server, conflictLevel, checkedAbilities, characterCount, characters, groups, } = req.body;
        console.log("📥 Creating standard schedule with data:", {
            name,
            server,
            conflictLevel,
            checkedAbilities,
            characterCount,
            characters,
            groups,
        });
        const schedule = new StandardSchedule_1.default({
            name: name || "未命名排表", // ✅ fallback if no name
            server,
            conflictLevel,
            checkedAbilities,
            characterCount,
            characters,
            groups,
        });
        await schedule.save();
        console.log("✅ Saved standard schedule with ID:", schedule._id);
        res.status(201).json(schedule);
    }
    catch (err) {
        console.error("❌ Error creating standard schedule:", err);
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
            return res
                .status(404)
                .json({ error: "Standard schedule not found" });
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
        const updated = await StandardSchedule_1.default.findByIdAndUpdate(id, { $set: { groups } }, // ✅ only update groups field
        { new: true })
            .populate("characters")
            .populate("groups.characters");
        if (!updated) {
            return res
                .status(404)
                .json({ error: "Standard schedule not found" });
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
// ✅ Update a single group's status (not_started → started → finished)
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
        console.log(`📥 Updating kill floor ${floor} of group ${index} in schedule ${id}`, {
            boss,
            selection,
        });
        // Load schedule
        const schedule = await StandardSchedule_1.default.findById(id);
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        const group = schedule.groups.find((g) => g.index === parseInt(index));
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        // Find kill entry
        let kill = group.kills.find((k) => k.floor === parseInt(floor));
        if (kill) {
            // Update existing kill
            kill.boss = boss || kill.boss;
            kill.selection = selection;
            kill.completed = !!(selection?.ability || selection?.noDrop);
            kill.recordedAt = new Date();
        }
        else {
            // Insert new kill
            group.kills.push({
                floor: parseInt(floor),
                boss,
                completed: !!(selection?.ability || selection?.noDrop),
                selection,
                recordedAt: new Date(),
            });
        }
        await schedule.save();
        console.log("✅ Updated group kill:", { groupIndex: index, floor });
        const populated = await StandardSchedule_1.default.findById(id)
            .populate("characters")
            .populate("groups.characters");
        res.json(populated);
    }
    catch (err) {
        console.error("❌ Error updating group kill:", err);
        res.status(500).json({ error: "Failed to update group kill" });
    }
};
exports.updateGroupKill = updateGroupKill;
// ✅ Delete (reset) a single kill record inside a group by floor
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
