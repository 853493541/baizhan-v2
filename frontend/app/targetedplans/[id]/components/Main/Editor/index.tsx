"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import GroupCard from "./GroupCard";
import { abilities, abilityColorMap } from "./config";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";
import {
  handleAddGroup,
  handleRemoveGroup,
  handleAddCharacter,
  handleReplaceCharacter,
  handleRemoveCharacter,
  handleAbilityChange,
  saveChanges,
} from "./editorHandlers";

/**
 * 🧩 Editor
 * Root manager for all groups within a targeted plan.
 * Handles global edit toggles, reset, and auto-save.
 * Each GroupCard handles its own modals (EditCharacter / EditAbility).
 */
export default function Editor({
  scheduleId,
  groups,
  setGroups,
  allCharacters,
  checkedAbilities,
  targetedBoss,
}: {
  scheduleId: string;
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  allCharacters: Character[];
  checkedAbilities: AbilityCheck[];
  targetedBoss?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [localGroups, setLocalGroups] = useState<GroupResult[]>(groups);

  /* 🧠 Merge characters with DB data */
  useEffect(() => {
    if (!groups?.length || !allCharacters?.length) return;
    const merged = groups.map((g) => ({
      ...g,
      characters: g.characters.map((c: any) => {
        const realId = (c._id || c.characterId?._id || c.characterId) as string | undefined;
        const full = realId ? allCharacters.find((ac) => ac._id === realId) : undefined;
        return {
          ...full,
          ...c,
          _id: realId ?? c._id,
          selectedAbilities: Array.isArray(c.selectedAbilities)
            ? c.selectedAbilities
            : [
                { name: "", level: 0 },
                { name: "", level: 0 },
                { name: "", level: 0 },
              ],
        };
      }),
    }));
    setLocalGroups(merged);
  }, [groups, allCharacters]);

  // ✅ Mirror groups to local state whenever props change
  useEffect(() => {
    setLocalGroups(groups || []);
  }, [groups]);

  /* 💾 Auto-save (debounced) */
  useEffect(() => {
    if (!editing || !localGroups.length) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      console.log("💾 Auto-saving groups...");
      await saveChanges(scheduleId, localGroups, setGroups, () => {});
      console.log("✅ Auto-save finished");
      setSaving(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [localGroups, editing]);

  /* ✏️ Toggle edit mode */
  const toggleEditing = () => {
    setEditing((prev) => !prev);
  };

  /* 🔄 Reset all groups (clears kills/drops but keeps characters + skills) */
  const handleResetPlan = async () => {
    if (!confirm("重置所有掉落记录和完成状态？")) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    const candidates = [
      `${API_BASE}/api/targeted-plans/${scheduleId}/reset`,
      `${API_BASE}/targeted-plans/${scheduleId}/reset`,
      `${API_BASE}/api/targeted-plans/reset/${scheduleId}`,
    ];

    setResetting(true);
    let ok = false;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: "POST" });
        if (res.ok) {
          ok = true;
          break;
        }
      } catch {
        // try next candidate
      }
    }
    setResetting(false);

    if (!ok) {
      alert("重置失败！");
      return;
    }

    // ✅ Update UI immediately
    const resetGroups = localGroups.map((g: any) => ({
      ...g,
      status: "not_started",
      drops: [],
      kills: [],
    }));

    setLocalGroups(resetGroups);
    setGroups(resetGroups);

    window.location.reload(); // optional refresh
  };

  /* ---------- Render ---------- */
  return (
    <div className={styles.groupsGrid}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          onClick={toggleEditing}
          disabled={saving}
          className={`${styles.editToggleBtn} ${
            saving ? styles.saving : editing ? styles.exit : styles.enter
          }`}
        >
          {saving ? "保存中..." : editing ? "退出编辑" : "编辑全表"}
        </button>

        {/* 🧹 Reset Button */}
        <button
          onClick={handleResetPlan}
          disabled={resetting}
          className={styles.resetBtn ?? styles.editToggleBtn}
          style={{ marginLeft: 8 }}
          title="重置所有小组状态并清空掉落（保留角色与技能）"
        >
          {resetting ? "重置中..." : "重置"}
        </button>
      </div>

      {/* Groups */}
      {localGroups.map((group, gi) => (
        <GroupCard
          key={gi}
          group={group}
          groupIndex={gi}
          editing={editing}
          allCharacters={allCharacters}
          abilityColorMap={abilityColorMap}
          checkedAbilities={checkedAbilities}
          targetedBoss={targetedBoss}
          onRemoveGroup={(i) => handleRemoveGroup(setLocalGroups, i)}
          onRemoveCharacter={(gi, cid) => handleRemoveCharacter(setLocalGroups, gi, cid)}
          onAddCharacter={(gi, c) => handleAddCharacter(setLocalGroups, gi, c, allCharacters)}
          onReplaceCharacter={(gi, oldId, c) =>
            handleReplaceCharacter(setLocalGroups, gi, oldId, c, allCharacters)
          }
          onAbilityChange={(gi, charId, slot, ability) =>
            handleAbilityChange(
              setLocalGroups,
              () => {},
              () => {},
              () => {},
              gi,
              charId,
              slot,
              ability
            )
          }
          onAddGroup={() => handleAddGroup(setLocalGroups)}
          API_URL={process.env.NEXT_PUBLIC_API_URL || ""}
          planId={scheduleId}
          refreshPlan={() => saveChanges(scheduleId, localGroups, setGroups, () => {})}
        />
      ))}

      {/* Add Group Button */}
      {editing && (
        <div className={styles.addGroupWrapper}>
          <button onClick={() => handleAddGroup(setLocalGroups)} className={styles.addGroupBtn}>
            <span className={styles.addGroupIcon}>+</span> 新增小组
          </button>
        </div>
      )}
    </div>
  );
}
