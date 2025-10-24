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
  checkedAbilities, // ✅ new prop
}: {
  scheduleId: string;
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  allCharacters: Character[];
  checkedAbilities: AbilityCheck[]; // ✅ added type
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

  /* ---------- 🧠 Merge full abilities (level maps) from allCharacters + restore from DB ---------- */
  useEffect(() => {
    if (!groups?.length || !allCharacters?.length) return;

    console.groupCollapsed(
      "%c[trace][Editor] Merge localGroups from server groups + full characters",
      "color:#4fa3ff;font-weight:bold;"
    );

    const merged = groups.map((g, gi) => {
      const mappedChars = g.characters.map((c: any, ci) => {
        const realId = (c._id || c.characterId?._id || c.characterId) as string | undefined;
        const full = realId ? allCharacters.find((ac) => ac._id === realId) : undefined;

        let mergedChar: any = {
          ...full,
          ...c,
          _id: realId ?? c._id,
        };

        if (!Array.isArray(mergedChar.selectedAbilities)) {
          mergedChar.selectedAbilities = [
            { name: "", level: 0 },
            { name: "", level: 0 },
            { name: "", level: 0 },
          ];
        }

        console.groupCollapsed(`[trace][Editor] Group ${gi + 1}, Character ${ci + 1}`);
        console.log("mergedChar:", mergedChar);
        console.groupEnd();

        return mergedChar;
      });

      return { ...g, characters: mappedChars };
    });

    console.log("✅ merged localGroups:", merged);
    console.groupEnd();
    setLocalGroups(merged);
  }, [groups, allCharacters]);

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
      g.characters.forEach((c: any) => {
        const realId = c._id || c.characterId?._id || c.characterId;
        if (realId) usedMap[realId] = gi;
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

  /* ---------- Cancel / Save ---------- */
  const cancelEditing = () => {
    setLocalGroups(groups);
    setEditing(false);
  };

  const manualSave = async (close = true) => {
    console.log("💾 [Editor] Saving groups to backend...");
    await saveChanges(scheduleId, localGroups, setGroups, close ? setEditing : (() => {}));
    if (close) setEditing(false);
  };

  /* ---------- Auto-save while editing ---------- */
  useEffect(() => {
    if (!editing || !localGroups.length) return;
    const timer = setTimeout(() => {
      console.log("💾 Auto-saving changes...");
      manualSave(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [localGroups, editing]);

  /* ---------- Render ---------- */
  return (
    <div className={styles.groupsGrid}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {!editing ? (
          <button onClick={() => setEditing(true)} className={styles.editBtn}>
            ✏️ 编辑
          </button>
        ) : (
          <div className={styles.editingButtons}>
            <button onClick={() => manualSave(true)} className={styles.saveBtn}>
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
          checkedAbilities={checkedAbilities} // ✅ pass schedule-level abilities
          onRemoveGroup={(i) => {
            console.log("🗑 Removing group", i);
            handleRemoveGroup(setLocalGroups, i);
            setTimeout(() => manualSave(false), 300);
          }}
          onRemoveCharacter={(gi, cid) => {
            handleRemoveCharacter(setLocalGroups, gi, cid);
            setTimeout(() => manualSave(false), 300);
          }}
          onOpenCharacterDropdown={openCharacterDropdown}
          onOpenAbilityDropdown={openAbilityDropdown}
          API_URL={process.env.NEXT_PUBLIC_API_URL || ""}
          planId={scheduleId}
          refreshPlan={() => manualSave(false)}
        />
      ))}

      {/* Add Group Button */}
      {editing && (
        <div className={styles.addGroupWrapper}>
          <button
            onClick={() => {
              handleAddGroup(setLocalGroups);
              setTimeout(() => manualSave(false), 300);
            }}
            className={styles.addGroupBtn}
          >
            <span className={styles.addGroupIcon}>+</span> 新增小组
          </button>
        </div>
      )}

      {/* Character Dropdown */}
      {charDrop.type && charDrop.pos && (() => {
        const selectedCharacter =
          (charDrop.groupIdx != null && charDrop.charId)
            ? localGroups[charDrop.groupIdx]?.characters.find(
                (c: any) => (c._id || c.characterId?._id || c.characterId) === charDrop.charId
              )
            : undefined;

        return (
          <CharacterDropdown
            x={charDrop.pos.x}
            y={charDrop.pos.y}
            character={selectedCharacter}
            excludeId={charDrop.charId}
            onClose={closeCharDropdown}
            onSelect={(char) => {
              const fullChar = allCharacters.find((c) => c._id === char._id) || char;
              if (charDrop.type === "replace") {
                handleReplaceCharacter(setLocalGroups, charDrop.groupIdx!, charDrop.charId!, fullChar, allCharacters);
              } else {
                handleAddCharacter(setLocalGroups, charDrop.groupIdx!, fullChar, allCharacters);
              }
              setTimeout(() => manualSave(false), 300);
            }}
          />
        );
      })()}

      {/* Ability Dropdown */}
      {abilityOpenId && abilityPos && abilityCtx && (() => {
        const groupChar =
          localGroups[abilityCtx.groupIdx]?.characters.find(
            (c: any) => (c._id || c.characterId?._id || c.characterId) === abilityCtx.charId
          );
        const fullChar =
          allCharacters.find((c) => c._id === abilityCtx.charId) || groupChar;
        const selectedCharacter = { ...groupChar, ...fullChar };

        return (
          <AbilityDropdown
            x={abilityPos.left}
            y={abilityPos.top}
            abilities={abilities}
            abilityColorMap={abilityColorMap}
            character={selectedCharacter}
            onClose={closeAbilityDropdown}
            onSelect={(a) => {
              handleAbilityChange(
                setLocalGroups,
                setAbilityOpenId,
                setAbilityPos,
                setAbilityCtx,
                abilityCtx.groupIdx,
                abilityCtx.charId,
                abilityCtx.slot,
                a,
                selectedCharacter
              );
              setTimeout(() => manualSave(false), 300);
            }}
          />
        );
      })()}
    </div>
  );
}
