"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import GroupEditor from "./GroupEditor";
import CharacterDropdown from "./CharacterDropdown";
import AbilityDropdown from "./AbilityDropdown";
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

  // dropdown states
  const [charDrop, setCharDrop] = useState<{
    type: "replace" | "add" | null;
    groupIdx: number | null;
    charId?: string;
    pos: { x: number; y: number } | null;
  }>({ type: null, groupIdx: null, pos: null });

  const [abilityOpenId, setAbilityOpenId] = useState<string | null>(null);
  const [abilityPos, setAbilityPos] = useState<{ top: number; left: number } | null>(null);
  const [abilityCtx, setAbilityCtx] = useState<{ groupIdx: number; charId: string; slot: number } | null>(null);

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

  /* Initialize if no groups yet */
  useEffect(() => {
    if (!groups?.length && allCharacters?.length) {
      const newGroups = Array.from(
        { length: Math.ceil(allCharacters.length / 3) },
        () => ({ characters: [], missingAbilities: [], violations: [] })
      );
      setLocalGroups(newGroups);
      setGroups(newGroups);
    } else {
      setLocalGroups(groups);
    }
  }, [groups, allCharacters, setGroups]);

  /* Auto-save (debounced) */
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

  /* Toggle edit mode */
  const toggleEditing = () => {
    if (editing) {
      console.log("🚪 Exiting edit mode (auto-saved)");
      setEditing(false);
    } else {
      console.log("✏️ Entering edit mode");
      setEditing(true);
    }
  };

  /* 🔄 Reset plan: set all groups to not_started and clear drops/kills (keep characters/abilities) */
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

    // ✅ Update UI in place (optional)
    setLocalGroups((prev) =>
      prev.map((g: any) => ({
        ...g,
        status: "not_started",
        drops: Array.isArray((g as any).drops) ? [] : (g as any).drops,
        kills: Array.isArray((g as any).kills) ? [] : (g as any).kills,
      }))
    );
    setGroups(
      localGroups.map((g: any) => ({
        ...g,
        status: "not_started",
        drops: Array.isArray((g as any).drops) ? [] : (g as any).drops,
        kills: Array.isArray((g as any).kills) ? [] : (g as any).kills,
      }))
    );

    window.location.reload(); // ✅ Force full page refresh
  };

  /* Dropdown helpers */
  const openCharacterDropdown = (
    type: "replace" | "add",
    groupIdx: number,
    charId: string | undefined,
    e: React.MouseEvent
  ) => {
    (window as any).__ALL_CHARACTERS__ = allCharacters;

    const usedMap: Record<string, number> = {};
    localGroups.forEach((g, i) => {
      g.characters.forEach((c: any) => {
        const id = c._id || c.characterId?._id || c.characterId;
        if (id) usedMap[id] = i;
      });
    });
    (window as any).__USED_CHARACTER_MAP__ = usedMap;
    (window as any).__CURRENT_GROUP_INDEX__ = groupIdx;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2 - 100 + window.scrollX;
    const y = rect.bottom + 6 + window.scrollY;
    setCharDrop({ type, groupIdx, charId, pos: { x, y } });
  };

  const openAbilityDropdown = (
    groupIdx: number,
    charId: string,
    slot: number,
    dropdownId: string,
    e: React.MouseEvent
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = rect.left + rect.width / 2 - 140 + window.scrollX;
    const top = rect.bottom + 6 + window.scrollY;
    setAbilityOpenId(dropdownId);
    setAbilityPos({ top, left });
    setAbilityCtx({ groupIdx, charId, slot });
  };

  const closeCharDropdown = () => setCharDrop({ type: null, groupIdx: null, pos: null });
  const closeAbilityDropdown = () => {
    setAbilityOpenId(null);
    setAbilityPos(null);
    setAbilityCtx(null);
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
        <GroupEditor
          key={gi}
          group={group}
          groupIndex={gi}
          editing={editing}
          allCharacters={allCharacters}
          abilityColorMap={abilityColorMap}
          checkedAbilities={checkedAbilities}
          onRemoveGroup={(i) => handleRemoveGroup(setLocalGroups, i)}
          onRemoveCharacter={(gi, cid) => handleRemoveCharacter(setLocalGroups, gi, cid)}
          onOpenCharacterDropdown={openCharacterDropdown}
          onOpenAbilityDropdown={openAbilityDropdown}
          API_URL={process.env.NEXT_PUBLIC_API_URL || ""}
          planId={scheduleId}
          refreshPlan={() => saveChanges(scheduleId, localGroups, setGroups, () => {})}
        />
      ))}

      {/* Add Group */}
      {editing && (
        <div className={styles.addGroupWrapper}>
          <button onClick={() => handleAddGroup(setLocalGroups)} className={styles.addGroupBtn}>
            <span className={styles.addGroupIcon}>+</span> 新增小组
          </button>
        </div>
      )}

      {/* Character Dropdown */}
      {charDrop.type && charDrop.pos && (
        <CharacterDropdown
          x={charDrop.pos.x}
          y={charDrop.pos.y}
          excludeId={charDrop.charId}
          onClose={closeCharDropdown}
          onSelect={(char) => {
            const full = allCharacters.find((c) => c._id === char._id) || char;
            if (charDrop.type === "replace") {
              handleReplaceCharacter(
                setLocalGroups,
                charDrop.groupIdx!,
                charDrop.charId!,
                full,
                allCharacters
              );
            } else {
              handleAddCharacter(setLocalGroups, charDrop.groupIdx!, full, allCharacters);
            }
          }}
        />
      )}

      {/* Ability Dropdown */}
      {abilityOpenId && abilityPos && abilityCtx && (
        <AbilityDropdown
          x={abilityPos.left}
          y={abilityPos.top}
          abilities={abilities}
          abilityColorMap={abilityColorMap}
          /** 🧩 FIXED: use localGroups first (so selectedAbilities stay up to date) */
          character={
            localGroups[abilityCtx.groupIdx]?.characters.find(
              (c: any) =>
                (c._id || c.characterId?._id || c.characterId) === abilityCtx.charId
            ) ||
            allCharacters.find((c) => c._id === abilityCtx.charId)
          }
          targetedBoss={targetedBoss}
          onClose={closeAbilityDropdown}
          onSelect={(a) =>
            handleAbilityChange(
              setLocalGroups,
              setAbilityOpenId,
              setAbilityPos,
              setAbilityCtx,
              abilityCtx.groupIdx,
              abilityCtx.charId,
              abilityCtx.slot,
              a
            )
          }
        />
      )}
    </div>
  );
}
