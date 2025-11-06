"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

interface EditCharacterProps {
  allCharacters?: Character[];
  usedMap?: Record<string, number>;
  currentGroup?: number;
  excludeId?: string; // ✅ ID of the character being replaced
  onSelect: (c: Character) => void;
  onClose: () => void;
}

export default function EditCharacter({
  allCharacters = [],
  usedMap = {},
  currentGroup,
  excludeId,
  onSelect,
  onClose,
}: EditCharacterProps) {
  const [search, setSearch] = useState("");

  /* ---------- Filter by search ---------- */
  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(allCharacters) ? allCharacters : [];
    if (!q) return list;
    return list.filter((c) => c.name?.toLowerCase().includes(q));
  }, [allCharacters, search]);

  /* ---------- Group by Account ---------- */
  const groupedByAccount = useMemo(() => {
    const groups: Record<string, Character[]> = {};
    const list = Array.isArray(filteredCharacters) ? filteredCharacters : [];

    list.forEach((c) => {
      if (!c) return;
      const account = c.account || "未分配账号";
      if (!groups[account]) groups[account] = [];
      groups[account].push(c);
    });

    return groups;
  }, [filteredCharacters]);

  /* ---------- Guard: nothing to render ---------- */
  if (!Array.isArray(allCharacters) || allCharacters.length === 0) {
    return null;
  }

  /* ---------- Render ---------- */
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />

      <div
        className={styles.characterModal}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* === Header === */}
        <div className={styles.header}>
          <h2 className={styles.centerTitle}>选择角色</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* === Search Bar === */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="搜索角色名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* === Account Grid === */}
        <div className={styles.accountGrid}>
          {Object.entries(groupedByAccount).map(([account, list]) => {
            const hasSelectedInCurrent =
              typeof currentGroup === "number" &&
              list.some((c) => usedMap[c._id] === currentGroup);

            return (
              <div key={account} className={styles.accountColumn}>
                <div className={styles.accountHeader}>
                  {account}
                  {hasSelectedInCurrent && (
                    <span className={styles.usedNotice}>(已有角色)</span>
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

                    // ✅ Skip gray-out if this is the one being replaced
                    const shouldGray =
                      (isUsedElsewhere || isCurrent) && c._id !== excludeId;

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
                          if (shouldGray) return; // prevent selecting invalid ones
                          onSelect(c);
                        }}
                      >
                        <span className={styles.charName}>{c.name}</span>
                        <span className={styles.groupTag}>
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
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
