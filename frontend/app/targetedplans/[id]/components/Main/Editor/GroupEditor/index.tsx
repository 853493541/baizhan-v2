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
  allCharacters: Character[];
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
  const [refreshSignal, setRefreshSignal] = useState(0);

  const hasCharacters = group.characters && group.characters.length > 0;

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

  return (
    <div className={styles.groupCard}>
      {/* === Header === */}
      <div className={styles.groupHeader}>
        {/* === Left side: Title / Delete / Status === */}
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

              {/* ✅ only show status when group has characters */}
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

        {/* === Right side: Assigned Drops + Add Button === */}
        {/* ✅ hide entire right side if group has no characters */}
        {hasCharacters && (
          <div className={styles.groupHeaderRight}>
            {!editing && (
              <div className={styles.assignedInlineRight}>
                <AssignedDrops
                  API_URL={API_URL}
                  planId={planId}
                  groupIndex={groupIndex}
                  groupCharacters={group.characters}
                  refreshSignal={refreshSignal}
                />
              </div>
            )}

            {!editing && (
              <button
                onClick={() => setShowDropModal(true)}
                className={styles.addDropBtn}
                title="为此组添加掉落"
              >
                ＋ 掉落
              </button>
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
          onSaved={() => {
            refreshPlan();
            setRefreshSignal((v) => v + 1);
          }}
          allCharacters={allCharacters}
        />
      )}
    </div>
  );
}
