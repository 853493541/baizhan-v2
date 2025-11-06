"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import CharacterRow from "./CharacterRow";
import GroupDrops from "./Drops";
import AssignedDrops from "./Assigned";
import EditCharacter from "./CharacterRow/EditCharacter";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

/**
 * 🧩 GroupCard
 * Represents a single group block within a targeted plan.
 * Displays header (title, status, +掉落), member list, and optional editing buttons.
 *
 * ✅ “Add Character” modal is handled here (GroupCard).
 * ✅ “Replace Character” and “Edit Ability” modals are handled in CharacterRow.
 */
export default function GroupCard({
  group,
  groupIndex,
  editing,
  abilityColorMap,
  checkedAbilities,
  allCharacters,
  onRemoveGroup,
  onRemoveCharacter,
  onAddCharacter,
  onReplaceCharacter,
  onAbilityChange,
  onAddGroup,
  API_URL,
  planId,
  refreshPlan,
  targetedBoss,
}: {
  group: GroupResult;
  groupIndex: number;
  editing: boolean;
  abilityColorMap: Record<string, string>;
  checkedAbilities: AbilityCheck[];
  allCharacters: Character[];
  onRemoveGroup: (idx: number) => void;
  onRemoveCharacter: (groupIdx: number, charId: string) => void;

  onAddCharacter?: (groupIdx: number, character: Character) => void;
  onReplaceCharacter?: (
    groupIdx: number,
    oldCharId: string,
    newCharacter: Character
  ) => void;
  onAbilityChange?: (
    groupIdx: number,
    charId: string,
    slot: number,
    abilityName: string
  ) => void;

  onAddGroup?: () => void;
  API_URL: string;
  planId: string;
  refreshPlan: () => void;
  targetedBoss?: string;
}) {
  const [showDropModal, setShowDropModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const hasCharacters = group.characters?.length > 0;

  // 🟢 Status mapping
  const status = (group.status ?? "not_started") as
    | "not_started"
    | "started"
    | "finished";

  const statusLabel = {
    not_started: "未开始",
    started: "进行中",
    finished: "已完成",
  };

  const statusCircleClass = {
    not_started: styles.statusIdleDot,
    started: styles.statusBusyDot,
    finished: styles.statusDoneDot,
  };

  /** 🧩 Build usedMap (which group each character belongs to) */
  const usedMap: Record<string, number> = {};
  allCharacters.forEach((ac) => {
    group.characters.forEach((gc) => {
      const id = gc._id || (gc.characterId as string);
      if (id === ac._id) {
        usedMap[id] = groupIndex;
      }
    });
  });

  return (
    <div className={styles.groupCard}>
      {/* === Header === */}
      <div className={styles.groupHeader}>
        {/* === Left: Title / Delete / Status === */}
        <div className={styles.groupHeaderLeft}>
          {editing ? (
            <button
              onClick={() => onRemoveGroup(groupIndex)}
              className={styles.deleteHeaderBtn}
              title="删除整个小组"
            >
              <span className={styles.deleteHeaderX}></span>
              删除组 {groupIndex + 1}
            </button>
          ) : (
            <div className={styles.groupTitleWrap}>
              <h4 className={`${styles.groupTitle} ${styles.groupTitleBold}`}>
                组{groupIndex + 1}
              </h4>

              {hasCharacters && (
                <div
                  className={styles.statusWrap}
                  title={`当前状态：${statusLabel[status]}`}
                >
                  <span
                    className={`${styles.statusDot} ${statusCircleClass[status]}`}
                  />
                  <span className={styles.statusText}>
                    {statusLabel[status]}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* === Right: Assigned Drops + Add Button === */}
        {hasCharacters && (
          <div className={styles.groupHeaderRight}>
            {!editing && (
              <>
                <div className={styles.assignedInlineRight}>
                  <AssignedDrops
                    API_URL={API_URL}
                    planId={planId}
                    groupIndex={groupIndex}
                    groupCharacters={group.characters}
                    refreshSignal={refreshSignal}
                  />
                </div>
                <button
                  onClick={() => setShowDropModal(true)}
                  className={styles.addDropBtn}
                  title="为此组添加掉落"
                >
                  ＋ 掉落
                </button>
              </>
            )}
          </div>
        )}
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
              Array.isArray(c.selectedAbilities) &&
              c.selectedAbilities.length === 3
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
  targetedBoss={targetedBoss}
  onRemoveCharacter={onRemoveCharacter}
  onReplaceCharacter={onReplaceCharacter}
  onAbilityChange={onAbilityChange}
  allCharacters={allCharacters}      // ✅ add
  usedMap={usedMap}                  // ✅ add
/>

          );
        })}

        {/* === Inline Add Character Button === */}
        {editing && group.characters.length < 3 && (
          <div className={styles.addRow}>
            <button
              className={styles.addCharacterBtn}
              onClick={() => setShowCharacterModal(true)}
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
          onSaved={() => {
            refreshPlan();
            setRefreshSignal((v) => v + 1);
          }}
          allCharacters={allCharacters}
        />
      )}

      {/* === Add Character Modal (Group-level) === */}
      {showCharacterModal && (
        <EditCharacter
          allCharacters={allCharacters}            // ✅ now properly passed
          usedMap={usedMap}                        // ✅ mark which chars are used
          currentGroup={groupIndex}                // ✅ context for gray-out logic
          excludeId={undefined}
          onSelect={(picked) => {
            onAddCharacter?.(groupIndex, picked);
            setShowCharacterModal(false);
          }}
          onClose={() => setShowCharacterModal(false)}
        />
      )}
    </div>
  );
}
