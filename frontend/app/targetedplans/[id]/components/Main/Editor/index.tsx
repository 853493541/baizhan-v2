"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import GroupEditor from "./GroupEditor";
import CharacterDropdown from "./CharacterDropdown";
import AbilityDropdown from "./AbilityDropdown";
import { abilities, abilityColorMap } from "./config";
import type { GroupResult, Character } from "@/utils/solver";
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
}: {
  scheduleId: string;
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  allCharacters: Character[];
}) {
  const [editing, setEditing] = useState(false);
  const [localGroups, setLocalGroups] = useState<GroupResult[]>(groups);

  // floating dropdowns
  const [charDrop, setCharDrop] = useState<{
    type: "replace" | "add" | null;
    groupIdx: number | null;
    charId?: string;
    pos: { x: number; y: number } | null;
  }>({ type: null, groupIdx: null, pos: null });

  const [abilityOpenId, setAbilityOpenId] = useState<string | null>(null);
  const [abilityPos, setAbilityPos] = useState<{ top: number; left: number } | null>(null);
  const [abilityCtx, setAbilityCtx] = useState<{ groupIdx: number; charId: string; slot: number } | null>(null);

  /* ---------- Initial Load ---------- */
  useEffect(() => {
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

  /* ---------- Expose global state for dropdown ---------- */
  useEffect(() => {
    (window as any).__ALL_CHARACTERS__ = allCharacters;
    const usedMap: Record<string, number> = {};
    localGroups.forEach((g, gi) => {
      g.characters.forEach((c) => {
        usedMap[c._id] = gi;
      });
    });
    (window as any).__USED_CHARACTER_MAP__ = usedMap;
  }, [allCharacters, localGroups]);

  /* ---------- Popup logic ---------- */
  const openCharacterDropdown = (
    type: "replace" | "add",
    groupIdx: number,
    charId: string | undefined,
    e: React.MouseEvent
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownWidth = 200;
    const spacing = 6;

    let left = rect.left + rect.width / 2 - dropdownWidth / 2 + window.scrollX;
    const top = rect.bottom + window.scrollY + spacing;

    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + window.innerWidth - dropdownWidth - 8;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    (window as any).__CURRENT_GROUP_INDEX__ = groupIdx;

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
    const width = 280;
    let left = rect.left + rect.width / 2 - width / 2 + window.scrollX;
    const top = rect.bottom + window.scrollY + 6;

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

  /* ---------- Cancel changes ---------- */
  const cancelEditing = () => {
    setLocalGroups(groups); // revert to last saved
    setEditing(false);
  };

  /* ---------- Save ---------- */
  const silentSave = async () => {
    await saveChanges(scheduleId, localGroups, setGroups, setEditing);
    setEditing(false);
  };

  /* ---------- Render ---------- */
  return (
    <div className={styles.groupsGrid}>
      {/* Top Controls */}
      <div className={styles.toolbar}>
        {!editing ? (
          <button onClick={() => setEditing(true)} className={styles.editBtn}>
            ✏️ 编辑
          </button>
        ) : (
          <div className={styles.editingButtons}>
            <button onClick={silentSave} className={styles.saveBtn}>
              💾 保存
            </button>
            <button onClick={cancelEditing} className={styles.cancelBtn}>
              取消
            </button>
          </div>
        )}
      </div>

      {/* Groups */}
      {localGroups.map((group, gi) => (
        <GroupEditor
          key={gi}
          group={group}
          groupIndex={gi}
          editing={editing}
          abilityColorMap={abilityColorMap}
          onRemoveGroup={(i) => handleRemoveGroup(setLocalGroups, i)}
          onRemoveCharacter={(gi, cid) => handleRemoveCharacter(setLocalGroups, gi, cid)}
          onOpenCharacterDropdown={openCharacterDropdown}
          onOpenAbilityDropdown={openAbilityDropdown}
        />
      ))}

      {/* Add new group button */}
{editing && (
  <div className={styles.addGroupWrapper}>
    <button onClick={() => handleAddGroup(setLocalGroups)} className={styles.addGroupBtn}>
      <span className={styles.addGroupIcon}>+</span> 新增小组
    </button>
  </div>
)}

      {/* Character dropdown */}
      {charDrop.type && charDrop.pos && (
        <CharacterDropdown
          x={charDrop.pos.x}
          y={charDrop.pos.y}
          excludeId={charDrop.charId}
          onClose={closeCharDropdown}
          onSelect={(char) =>
            charDrop.type === "replace"
              ? handleReplaceCharacter(setLocalGroups, charDrop.groupIdx!, charDrop.charId!, char)
              : handleAddCharacter(setLocalGroups, charDrop.groupIdx!, char)
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
