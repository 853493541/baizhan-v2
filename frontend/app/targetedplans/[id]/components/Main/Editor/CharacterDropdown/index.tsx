"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

interface CharacterDropdownProps {
  excludeId?: string;
  onSelect: (c: Character) => void;
  onClose: () => void;
}

/**
 * 🔹 Modal-style character selector (catalog by account)
 *  - Groups characters by account
 *  - Colored pills by role
 *  - Shows 已选 for current group, 组X for others
 */
export default function CharacterDropdown({
  excludeId,
  onSelect,
  onClose,
}: CharacterDropdownProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [usedMap, setUsedMap] = useState<Record<string, number>>({});
  const [currentGroup, setCurrentGroup] = useState<number | null>(null);

  /* ---------- Load global data ---------- */
  useEffect(() => {
    const fromWindow = (window as any).__ALL_CHARACTERS__ as Character[] | undefined;
    if (Array.isArray(fromWindow)) setCharacters(fromWindow);

    const map = (window as any).__USED_CHARACTER_MAP__ as Record<string, number> | undefined;
    if (map) setUsedMap(map);

    const cur = (window as any).__CURRENT_GROUP_INDEX__ as number | undefined;
    if (typeof cur === "number") setCurrentGroup(cur);
  }, []);

  /* ---------- Group by Account ---------- */
  const groupedByAccount = useMemo(() => {
    const groups: Record<string, Character[]> = {};
    characters.forEach((c) => {
      if (c._id === excludeId) return;
      const account = c.account || "未分配账号";
      if (!groups[account]) groups[account] = [];
      groups[account].push(c);
    });
    return groups;
  }, [characters, excludeId]);

  /* ---------- Render ---------- */
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />
      <div className={styles.characterModal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.centerTitle}>选择角色</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.accountGrid}>
          {Object.entries(groupedByAccount).map(([account, list]) => (
            <div key={account} className={styles.accountColumn}>
              <div className={styles.accountHeader}>{account}</div>

              <div className={styles.characterList}>
                {list.map((c) => {
                  const groupNum = usedMap[c._id];
                  const isCurrent = groupNum === currentGroup;
                  const isUsedElsewhere =
                    groupNum !== undefined && groupNum !== currentGroup;

                  return (
                    <div
                      key={c._id}
                      className={`${styles.characterPill} ${
                        c.role === "Tank"
                          ? styles.tank
                          : c.role === "Healer"
                          ? styles.healer
                          : styles.dps
                      } ${isCurrent ? styles.usedInCurrent : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) return;
                        onSelect(c);
                        onClose();
                      }}
                    >
                      <span className={styles.charName}>{c.name}</span>

                      <span className={styles.groupTag}>
                        {isCurrent
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
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
