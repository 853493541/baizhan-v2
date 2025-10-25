"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import CharacterRow from "./CharacterRow";
import GroupDrops from "./Drops";
import AssignedDrops from "./Assigned";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

export default function GroupEditor({
  group,
  groupIndex,
  editing,
  abilityColorMap,
  checkedAbilities,
  allCharacters,
  onRemoveGroup,
  onRemoveCharacter,
  onOpenCharacterDropdown,
  onOpenAbilityDropdown,
  onAddGroup,
  API_URL,
  planId,
  refreshPlan,
}: {
  group: GroupResult;
  groupIndex: number;
  editing: boolean;
  abilityColorMap: Record<string, string>;
  checkedAbilities: AbilityCheck[];
  onRemoveGroup: (idx: number) => void;
  onRemoveCharacter: (groupIdx: number, charId: string) => void;
  onOpenCharacterDropdown: (
    type: "replace" | "add",
    groupIdx: number,
    charId: string | undefined,
    e: React.MouseEvent
  ) => void;
  onOpenAbilityDropdown: (
    groupIdx: number,
    charId: string,
    slot: number,
    dropdownId: string,
    e: React.MouseEvent
  ) => void;
  onAddGroup?: () => void;
  API_URL: string;
  planId: string;
  refreshPlan: () => void;
}) {
  const [showDropModal, setShowDropModal] = useState(false);

  return (
    <div className={styles.groupCard}>
      {/* === Header === */}
      <div className={styles.groupHeader}>
        {/* === Left side: Title + Add Drop button === */}
        <div className={styles.groupHeaderLeft}>
          {editing ? (
            <button
              onClick={() => onRemoveGroup(groupIndex)}
              className={styles.deleteHeaderBtn}
              title="删除整个小组"
            >
              ✖ 删除组 {groupIndex + 1}
            </button>
          ) : (
            <>
              <h4 className={styles.groupTitle}>组{groupIndex + 1}</h4>
              <button
                onClick={() => setShowDropModal(true)}
                className={styles.addDropBtn}
                title="为此组添加掉落"
              >
                ＋ 添加掉落
              </button>
            </>
          )}
        </div>

        {/* === Right side: Assigned Drops === */}
        <div className={styles.assignedInlineRight}>
          <AssignedDrops
            API_URL={API_URL}
            planId={planId}
            groupIndex={groupIndex}
            groupCharacters={group.characters}
          />
        </div>
      </div>

      {/* === Character Rows === */}
      <div className={styles.memberList}>
        {group.characters.map((c, ci) => {
          const fixedChar: Character = {
            ...c,
            abilities:
              typeof c.abilities === "object" && !Array.isArray(c.abilities)
                ? c.abilities
                : {},
            selectedAbilities:
              c.selectedAbilities?.length === 3
                ? c.selectedAbilities
                : [
                    { name: "", level: 0 },
                    { name: "", level: 0 },
                    { name: "", level: 0 },
                  ],
          };

          return (
            <CharacterRow
              key={c._id || ci}
              character={fixedChar}
              groupIndex={groupIndex}
              editing={editing}
              abilityColorMap={abilityColorMap}
              onRemoveCharacter={onRemoveCharacter}
              onOpenCharacterDropdown={onOpenCharacterDropdown}
              onOpenAbilityDropdown={onOpenAbilityDropdown}
            />
          );
        })}

        {/* === Inline Add Character Button === */}
        {editing && group.characters.length < 3 && (
          <div className={styles.addRow}>
            <button
              className={styles.addCharacterBtn}
              onClick={(e) =>
                onOpenCharacterDropdown("add", groupIndex, undefined, e)
              }
            >
              ＋ 添加角色
            </button>
          </div>
        )}
      </div>

      {/* === Add Group Button === */}
      {editing && onAddGroup && (
        <div className={styles.addGroupWrapper}>
          <button onClick={onAddGroup} className={styles.addGroupBtn}>
            <span className={styles.addGroupIcon}>➕</span> 添加小组
          </button>
        </div>
      )}

      {/* === GroupDrops Modal === */}
      {showDropModal && (
        <GroupDrops
          API_URL={API_URL}
          planId={planId}
          group={group}
          checkedAbilities={checkedAbilities}
          onClose={() => setShowDropModal(false)}
          onSaved={refreshPlan}
          allCharacters={allCharacters}
        />
      )}
    </div>
  );
}
