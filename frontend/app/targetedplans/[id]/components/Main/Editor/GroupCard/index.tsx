"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import CharacterRow from "./CharacterRow";
import GroupDrops from "./Drops";
import AssignedDrops from "./Assigned";
import EditCharacter from "./CharacterRow/EditCharacter";
import AbilityChecking from "./AbilityChecking";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

/* ----------------------------------------------------------------------
   🧠 Hook: Ability overlap + duplicate accounts + healer check
---------------------------------------------------------------------- */
function useGroupAnalysis(
  group: GroupResult,
  checkedAbilities: AbilityCheck[],
  checkLevel: 9 | 10
): string[] {
  if (!group.characters || group.characters.length < 2) return [];

  const relevant = checkedAbilities.filter((a) => (a.level ?? 10) === checkLevel);
  const warnings: string[] = [];

  // ① Ability overlap
  for (const ab of relevant) {
    const requiredLv = ab.level ?? checkLevel;
    const allHave =
      group.characters.length > 0 &&
      group.characters.every(
        (c) =>
          typeof c.abilities === "object" &&
          !Array.isArray(c.abilities) &&
          (c.abilities?.[ab.name] ?? 0) >= requiredLv
      );
    if (allHave) {
      const levelLabel = requiredLv === 9 ? "九重" : "十重";
      warnings.push(`${ab.name}|${levelLabel}`);
    }
  }

  // ② Duplicate account check
  const accounts = group.characters.map((c) => c.account || c.owner || "");
  const duplicates = accounts.filter((acc, i) => acc && accounts.indexOf(acc) !== i);
  if (duplicates.length > 0) {
    const unique = Array.from(new Set(duplicates));
    warnings.push(`⚠️ 同账号角色: ${unique.join("、")}`);
  }

  // ③ Healer presence check
  const hasHealer = group.characters.some(
    (c) => c.role?.toLowerCase?.() === "healer"
  );
  if (!hasHealer) warnings.push("⚠️ 无治疗角色");

  // ④ No issues
  if (warnings.length === 0) warnings.push("✅ 无浪费");

  return warnings;
}

/* ----------------------------------------------------------------------
   🧩 GroupCard Component
---------------------------------------------------------------------- */
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
      if (id === ac._id) usedMap[id] = groupIndex;
    });
  });

  /** 🧩 Sync right card height with left card height */
  const leftRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (leftRef.current) {
      setLeftHeight(leftRef.current.offsetHeight);
    }
  }, [group]); // recalc whenever left card content changes

  return (
    <div className={styles.groupRow}>
      {/* === Left: Group Info Card === */}
      <div ref={leftRef} className={styles.groupCard}>
        {/* === Header === */}
        <div className={styles.groupHeader}>
          {/* Editing mode: show delete button */}
          {editing && (
            <div className={styles.groupHeaderLeft}>
              <button
                onClick={() => onRemoveGroup(groupIndex)}
                className={styles.deleteHeaderBtn}
                title="删除整个小组"
              >
                <span className={styles.deleteHeaderX}></span>
                删除组 {groupIndex + 1}
              </button>
            </div>
          )}

          {/* Non-editing mode: full functional header */}
          {!editing && hasCharacters && (
            <div className={styles.groupHeaderFull}>
              {/* Leftest: Add button */}
              <button
                onClick={() => setShowDropModal(true)}
                className={styles.addDropBtn}
                title="为此组添加掉落"
              >
                ＋ 掉落
              </button>

              {/* Middle: AssignedDrops */}
              <div className={styles.assignedInlineRight}>
                <AssignedDrops
                  API_URL={API_URL}
                  planId={planId}
                  groupIndex={groupIndex}
                  groupCharacters={group.characters}
                  refreshSignal={refreshSignal}
                />
              </div>

              {/* Rightmost: Status */}
              <div
                className={`${styles.statusWrap} ${
                  status === "finished" ? styles.finished : ""
                }`}
                title={`当前状态：${statusLabel[status]}`}
              >
                <span
                  className={`${styles.statusDot} ${statusCircleClass[status]}`}
                />
                <span className={styles.statusText}>{statusLabel[status]}</span>
              </div>
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
                allCharacters={allCharacters}
                usedMap={usedMap}
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

        {/* === Add Character Modal === */}
        {showCharacterModal && (
          <EditCharacter
            allCharacters={allCharacters}
            usedMap={usedMap}
            currentGroup={groupIndex}
            excludeId={undefined}
            onSelect={(picked) => {
              onAddCharacter?.(groupIndex, picked);
              setShowCharacterModal(false);
            }}
            onClose={() => setShowCharacterModal(false)}
          />
        )}
      </div>

      {/* === Right: Ability Checking Sidebar === */}
      {hasCharacters && (
        <div
          className={styles.analysisContainer}
          style={{
            height: leftHeight ? `${leftHeight}px` : "auto", // 🟢 match height exactly
          }}
        >
          <AbilityChecking
            groups={[group]}
            characters={allCharacters}
            checkedAbilities={checkedAbilities}
          />
        </div>
      )}
    </div>
  );
}
