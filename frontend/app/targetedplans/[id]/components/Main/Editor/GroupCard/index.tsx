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
      warnings.push(`${ab.name}|${requiredLv === 9 ? "九重" : "十重"}`);
    }
  }

  // ② Duplicate accounts
  const accounts = group.characters.map((c) => c.account || c.owner || "");
  const duplicates = accounts.filter((acc, i) => acc && accounts.indexOf(acc) !== i);
  if (duplicates.length > 0) warnings.push(`⚠️ 同账号角色: ${Array.from(new Set(duplicates)).join("、")}`);

  // ③ Healer check
  if (!group.characters.some((c) => c.role?.toLowerCase() === "healer"))
    warnings.push("⚠️ 无治疗角色");

  if (warnings.length === 0) warnings.push("✅ 无浪费");

  return warnings;
}

/* ----------------------------------------------------------------------
   🧩 GroupCard Component — FINAL FIXED VERSION
---------------------------------------------------------------------- */
export default function GroupCard({
  group,
  groupIndex,
  editing,
  abilityColorMap,
  checkedAbilities,
  allCharacters,

  usedMap,               // ⭐ GLOBAL usedMap (correct)
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
  usedMap: Record<string, number>;
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

  /* ---------------------------------------------------
     🟢 HEIGHT SYNC (left and right panels)
  --------------------------------------------------- */
  const leftRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (leftRef.current) setLeftHeight(leftRef.current.offsetHeight);
  }, [group]);

  return (
    <div className={styles.groupRow}>
      {/* === LEFT PANEL === */}
      <div ref={leftRef} className={styles.groupCard}>
        {/* ===== Header ===== */}
        <div className={styles.groupHeader}>
          {editing ? (
            <div className={styles.groupHeaderLeft}>
              <button
                onClick={() => onRemoveGroup(groupIndex)}
                className={styles.deleteHeaderBtn}
              >
                <span className={styles.deleteHeaderX}></span>
                删除组 {groupIndex + 1}
              </button>
            </div>
          ) : (
            hasCharacters && (
              <div className={styles.groupHeaderFull}>
                <button
                  onClick={() => setShowDropModal(true)}
                  className={styles.addDropBtn}
                >
                  ＋ 掉落
                </button>

                <div className={styles.assignedInlineRight}>
                  <AssignedDrops
                    API_URL={API_URL}
                    planId={planId}
                    groupIndex={groupIndex}
                    groupCharacters={group.characters}
                    refreshSignal={refreshSignal}
                  />
                </div>

                <div
                  className={`${styles.statusWrap} ${
                    status === "finished" ? styles.finished : ""
                  }`}
                >
                  <span className={`${styles.statusDot} ${statusCircleClass[status]}`} />
                  <span className={styles.statusText}>{statusLabel[status]}</span>
                </div>
              </div>
            )
          )}
        </div>

        {/* ===== CHARACTER LIST ===== */}
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
                usedMap={usedMap}     // ⭐ pass GLOBAL MAP
              />
            );
          })}

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

        {/* ===== Drop Modal ===== */}
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

        {/* ===== Add Character Modal ===== */}
        {showCharacterModal && (
          <EditCharacter
            allCharacters={allCharacters}
            usedMap={usedMap}           // ⭐ correct global usedMap
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

      {/* === RIGHT PANEL — ability checking === */}
      {hasCharacters && (
        <div
          className={styles.analysisContainer}
          style={{
            height: leftHeight ? `${leftHeight}px` : "auto",
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
