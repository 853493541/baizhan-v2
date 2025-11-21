"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

interface EditCharacterProps {
  allCharacters?: Character[];
  usedMap?: Record<string, number>;
  currentGroup?: number;
  excludeId?: string;
  onSelect: (c: Character) => void;
  onClose: () => void;
}

/* === Role ordering priority === */
const ROLE_ORDER: Record<string, number> = {
  DPS: 1,
  Tank: 2,
  Healer: 3,
};

/* === Main Characters === */
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
]);

export default function EditCharacter({
  allCharacters = [],
  usedMap = {},
  currentGroup,
  excludeId,
  onSelect,
  onClose,
}: EditCharacterProps) {
  /* ---------- Group by Account ---------- */
  const groupedByAccount = useMemo(() => {
    const groups: Record<string, Character[]> = {};
    const list = Array.isArray(allCharacters) ? allCharacters : [];

    list.forEach((c) => {
      if (!c) return;
      const account = c.account || "未分配账号";
      if (!groups[account]) groups[account] = [];
      groups[account].push(c);
    });

    return groups;
  }, [allCharacters]);

  /* ---------- Split ---------- */
  const singleAccounts: [string, Character[]][] = [];
  const multiAccounts: [string, Character[]][] = [];

  Object.entries(groupedByAccount).forEach(([acc, chars]) => {
    if (chars.length === 1) singleAccounts.push([acc, chars]);
    else multiAccounts.push([acc, chars]);
  });

  /* ---------- Sorting Rules ---------- */
  // ① Sort multi-account groups by number of chars (descending)
  multiAccounts.sort((a, b) => b[1].length - a[1].length);

  // ② Sort characters inside each account (main first → DPS → Tank → Healer)
  const sortCharacters = (chars: Character[]) => {
    chars.sort((a, b) => {
      const aMain = MAIN_CHARACTERS.has(a.name);
      const bMain = MAIN_CHARACTERS.has(b.name);
      if (aMain && !bMain) return -1;
      if (!aMain && bMain) return 1;
      return (ROLE_ORDER[a.role] || 99) - (ROLE_ORDER[b.role] || 99);
    });
  };

  multiAccounts.forEach(([_, chars]) => sortCharacters(chars));
  singleAccounts.forEach(([_, chars]) => sortCharacters(chars));

  // ③ Sort single accounts themselves — main-character accounts first
  singleAccounts.sort(([_, [aChar]], [__, [bChar]]) => {
    const aMain = MAIN_CHARACTERS.has(aChar.name);
    const bMain = MAIN_CHARACTERS.has(bChar.name);
    if (aMain && !bMain) return -1;
    if (!aMain && bMain) return 1;
    return 0;
  });

  /* ---------- Guard ---------- */
  if (!Array.isArray(allCharacters) || allCharacters.length === 0) return null;

  /* ----------------------------------------------------------------------
     ⭐ CLICK HANDLER WITH AUTO-MOVE
  ---------------------------------------------------------------------- */
  const handleSelect = (
    c: Character,
    isUsedElsewhere: boolean,
    isCurrent: boolean
  ) => {
    // AUTO-MOVE BEHAVIOR
    if (isUsedElsewhere) {
      onSelect(c);
      return;
    }

    // Prevent clicking the "当前" item
    if (isCurrent) return;

    // Normal select
    onSelect(c);
  };

  /* ---------- Render one account card ---------- */
  const renderAccount = (account: string, list: Character[]) => {
    const hasSelectedInCurrent =
      typeof currentGroup === "number" &&
      list.some((c) => usedMap[c._id] === currentGroup);

    return (
      <div key={account} className={styles.accountColumn}>
        <div
          className={`${styles.accountHeader} ${
            hasSelectedInCurrent ? styles.accountHeaderUsed : ""
          }`}
        >
          {account}
          {hasSelectedInCurrent && (
            <span className={styles.usedNotice}>（已有角色）</span>
          )}
        </div>

        <div className={styles.characterList}>
          {list.map((c) => {
            const groupNum = usedMap[c._id];
            const isCurrent = groupNum === currentGroup;
            const isUsedElsewhere =
              groupNum !== undefined &&
              groupNum !== currentGroup &&
              c._id !== excludeId;
            const shouldGray =
              (isUsedElsewhere || isCurrent) && c._id !== excludeId;
            const isMain = MAIN_CHARACTERS.has(c.name);

            return (
              <div
                key={c._id}
                className={`${styles.characterPill} ${
                  c.role === "Tank"
                    ? styles.tank
                    : c.role === "Healer"
                    ? styles.healer
                    : styles.dps
                } ${shouldGray ? styles.grayOut : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(c, isUsedElsewhere, isCurrent);
                }}
              >
                <span className={styles.charName}>
                  {isMain && <span className={styles.starMark}>★</span>}
                  {c.name}
                </span>
                <span
                  className={`${styles.groupTag} ${
                    c._id === excludeId ? styles.currentTag : ""
                  }`}
                >
                  {c._id === excludeId
                    ? "当前"
                    : isCurrent
                    ? "已选"
                    : isUsedElsewhere
                    ? `组${groupNum + 1}`
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------- Render combined single-account column ---------- */
  const renderCombinedSingles = () => {
    if (singleAccounts.length === 0) return null;

    return (
      <div className={styles.singleColumn}>
        <div className={styles.singleHeader}>单角色账号</div>
        <div className={styles.characterList}>
          {singleAccounts.map(([acc, [c]]) => {
            const groupNum = usedMap[c._id];
            const isCurrent = groupNum === currentGroup;
            const isUsedElsewhere =
              groupNum !== undefined &&
              groupNum !== currentGroup &&
              c._id !== excludeId;
            const shouldGray =
              (isUsedElsewhere || isCurrent) && c._id !== excludeId;
            const isMain = MAIN_CHARACTERS.has(c.name);

            let statusLabel: string | null = null;
            if (c._id === excludeId) statusLabel = "当前";
            else if (isCurrent) statusLabel = "已选";
            else if (isUsedElsewhere) statusLabel = `组${groupNum + 1}`;
            else statusLabel = acc;

            return (
              <div
                key={c._id}
                className={`${styles.characterPill} ${
                  c.role === "Tank"
                    ? styles.tank
                    : c.role === "Healer"
                    ? styles.healer
                    : styles.dps
                } ${shouldGray ? styles.grayOut : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(c, isUsedElsewhere, isCurrent);
                }}
              >
                <span className={styles.charName}>
                  {isMain && <span className={styles.starMark}>★</span>}
                  {c.name}
                </span>
                <span
                  className={`${styles.groupTag} ${
                    statusLabel === "当前" ? styles.currentTag : ""
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------- Render ---------- */
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />

      <div
        className={styles.characterModal}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.centerTitle}>选择角色</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Split Layout */}
        <div className={styles.splitLayout}>
          <div className={styles.leftPane}>
            <div className={styles.accountGrid}>
              {multiAccounts.map(([acc, chars]) => renderAccount(acc, chars))}
            </div>
          </div>

          <div className={styles.rightPane}>{renderCombinedSingles()}</div>
        </div>
      </div>
    </>,
    document.body
  );
}
