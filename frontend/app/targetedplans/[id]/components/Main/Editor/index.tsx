"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import GroupEditor from "./GroupEditor";
import CharacterDropdown from "./CharacterDropdown";
import AbilityDropdown from "./AbilityDropdown";
import { abilities, abilityColorMap } from "./config";
import type { GroupResult, Character } from "@/utils/solver";

export default function Editor({
  scheduleId,
  groups,
  setGroups,
  allCharacters,
}: {
  scheduleId: string;
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  allCharacters: Character[];
}) {
  const [editing, setEditing] = useState(false);
  const [localGroups, setLocalGroups] = useState<GroupResult[]>(groups);

  // floating character dropdown
  const [charDrop, setCharDrop] = useState<{
    type: "replace" | "add" | null;
    groupIdx: number | null;
    charId?: string;
    pos: { x: number; y: number } | null;
  }>({ type: null, groupIdx: null, pos: null });

  // floating ability dropdown
  const [abilityOpenId, setAbilityOpenId] = useState<string | null>(null);
  const [abilityPos, setAbilityPos] = useState<{ top: number; left: number } | null>(null);
  const [abilityCtx, setAbilityCtx] = useState<{ groupIdx: number; charId: string; slot: number } | null>(null);

  useEffect(() => {
    // 🧠 If no groups exist, auto-generate based on character count
    if (!groups?.length && allCharacters?.length) {
      const groupCount = Math.ceil(allCharacters.length / 3);
      const newGroups = Array.from({ length: groupCount }, () => ({
        characters: [],
        missingAbilities: [],
        violations: [],
      }));
      setLocalGroups(newGroups);
      setGroups(newGroups);
    } else {
      setLocalGroups(groups);
    }
  }, [groups, allCharacters, setGroups]);

  /* ---------- Group ops ---------- */
  const handleAddGroup = () => {
    setLocalGroups((prev) => [...prev, { characters: [], missingAbilities: [], violations: [] }]);
  };

  const handleRemoveGroup = (idx: number) =>
    setLocalGroups((prev) => prev.filter((_, i) => i !== idx));

  const handleAddCharacter = (groupIdx: number, char: Character) => {
    setLocalGroups((prev) => {
      const updated = prev.map((g) => ({
        ...g,
        characters: g.characters.filter((c) => c._id !== char._id), // unique across groups
      }));
      if (updated[groupIdx].characters.length >= 3) return prev;
      updated[groupIdx].characters.push({ ...char, abilities: ["", "", ""] });
      return updated;
    });
  };

  const handleReplaceCharacter = (groupIdx: number, oldCharId: string, newChar: Character) => {
    setLocalGroups((prev) => {
      const updated = prev.map((g) => ({
        ...g,
        characters: g.characters.filter((c) => c._id !== newChar._id),
      }));
      const group = updated[groupIdx];
      const i = group.characters.findIndex((c) => c._id === oldCharId);
      if (i !== -1) group.characters[i] = { ...newChar, abilities: ["", "", ""] };
      return updated;
    });
  };

  const handleRemoveCharacter = (groupIdx: number, charId: string) => {
    setLocalGroups((prev) => {
      const updated = [...prev];
      updated[groupIdx].characters = updated[groupIdx].characters.filter((c) => c._id !== charId);
      return updated;
    });
  };

  /* ---------- Ability ops ---------- */
  const handleAbilityChange = (groupIdx: number, charId: string, slot: number, ability: string) => {
    setLocalGroups((prev) => {
      const updated = [...prev];
      updated[groupIdx].characters = updated[groupIdx].characters.map((c) => {
        if (c._id === charId) {
          const arr = [...(c.abilities || ["", "", ""])];
          const dup = arr.findIndex((a, i) => a === ability && i !== slot);
          if (dup !== -1) arr[dup] = "";
          arr[slot] = ability;
          return { ...c, abilities: arr };
        }
        return c;
      });
      return updated;
    });
    setAbilityOpenId(null);
    setAbilityPos(null);
    setAbilityCtx(null);
  };

  /* ---------- Save ---------- */
  const saveChanges = async () => {
    setGroups(localGroups);
    const payload = localGroups.map((g, idx) => ({
      index: idx + 1,
      characters: g.characters.map((c) => ({
        characterId: c._id || c.characterId || null,
        abilities: Array.isArray(c.abilities) ? c.abilities : ["", "", ""],
      })),
      status: g.status || "not_started",
      kills: g.kills || [],
    }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: payload }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      alert("✅ 已保存修改！");
    } catch (err) {
      console.error("❌ Save failed:", err);
      alert("保存失败，请查看控制台日志。");
    }
    setEditing(false);
  };

  /* ---------- Popup Logic ---------- */
  const openCharacterDropdown = (
    type: "replace" | "add",
    groupIdx: number,
    charId: string | undefined,
    e: React.MouseEvent
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownWidth = 200; // match CSS
    const spacing = 6;

    // ✅ Center dropdown below trigger
    let left = rect.left + rect.width / 2 - dropdownWidth / 2 + window.scrollX;
    const top = rect.bottom + window.scrollY + spacing;

    // ✅ Clamp horizontally
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + window.innerWidth - dropdownWidth - 8;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    setCharDrop({
      type,
      groupIdx,
      charId,
      pos: { x: left, y: top },
    });
  };

  const openAbilityDropdown = (
    groupIdx: number,
    charId: string,
    slot: number,
    dropdownId: string,
    e: React.MouseEvent
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = 280; // 🟢 smaller dropdown
    let left = rect.left + rect.width / 2 - width / 2 + window.scrollX;
    const top = rect.bottom + window.scrollY + 6;

    // ✅ Clamp to viewport
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + window.innerWidth - width - 8;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

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

  return (
    <div className={styles.groupsGrid}>
      <div className={styles.editorHeader}>
        <h3 className={styles.sectionSubtitle}>🛠 手动编辑排表</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className={styles.editBtn}>
            ✏️ 开始编辑
          </button>
        ) : (
          <button onClick={saveChanges} className={styles.saveBtn}>
            💾 保存修改
          </button>
        )}
      </div>

      {localGroups.map((group, gi) => (
        <GroupEditor
          key={gi}
          group={group}
          groupIndex={gi}
          editing={editing}
          abilityColorMap={abilityColorMap}
          onRemoveGroup={handleRemoveGroup}
          onRemoveCharacter={handleRemoveCharacter}
          onOpenCharacterDropdown={openCharacterDropdown}
          onOpenAbilityDropdown={openAbilityDropdown}
        />
      ))}

      {editing && (
        <button onClick={handleAddGroup} className={styles.addGroupBtn}>
          ➕ 新增小组
        </button>
      )}

      {/* Character dropdown (add/replace) */}
      {charDrop.type && charDrop.pos && (
        <CharacterDropdown
          x={charDrop.pos.x}
          y={charDrop.pos.y}
          excludeId={charDrop.charId}
          allCharacters={allCharacters}
          onClose={closeCharDropdown}
          onSelect={(char) =>
            charDrop.type === "replace"
              ? handleReplaceCharacter(charDrop.groupIdx!, charDrop.charId!, char)
              : handleAddCharacter(charDrop.groupIdx!, char)
          }
        />
      )}

      {/* Ability dropdown */}
      {abilityOpenId && abilityPos && abilityCtx && (
        <AbilityDropdown
          x={abilityPos.left}
          y={abilityPos.top}
          abilities={abilities}
          abilityColorMap={abilityColorMap}
          onClose={closeAbilityDropdown}
          onSelect={(a) =>
            handleAbilityChange(abilityCtx.groupIdx, abilityCtx.charId, abilityCtx.slot, a)
          }
        />
      )}
    </div>
  );
}
