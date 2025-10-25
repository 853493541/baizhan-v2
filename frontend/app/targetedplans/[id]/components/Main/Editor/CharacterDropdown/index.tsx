"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

interface CharacterDropdownProps {
  x: number;
  y: number;
  excludeId?: string;
  onSelect: (c: Character) => void;
  onClose: () => void;
}

/**
 * 🔹 Self-contained dropdown that:
 *  - Loads all characters from global store (set by Editor)
 *  - Detects which group they are in
 *  - Marks current group's members as 已选 (shown first, grayed out)
 */
export default function CharacterDropdown({
  x,
  y,
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

  /* ---------- Positioning ---------- */
  const dropdownWidth = 200;
  const dropdownHeight = 260;
  const padding = 8;

  let adjustedLeft = x;
  let adjustedTop = y;

  if (typeof window !== "undefined") {
    const winLeft = window.scrollX;
    const winRight = window.scrollX + window.innerWidth;
    const winBottom = window.scrollY + window.innerHeight;
    const minLeft = winLeft + padding;
    const maxLeft = winRight - dropdownWidth - padding;

    if (adjustedLeft < minLeft) adjustedLeft = minLeft;
    if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;

    const hasSpaceBelow = adjustedTop + dropdownHeight + 10 < winBottom;
    adjustedTop = hasSpaceBelow ? adjustedTop + 2 : adjustedTop - dropdownHeight - 10;
  }

  /* ---------- Sorting ---------- */
  const sortedChars = useMemo(() => {
    const list = characters.filter((c) => c && c._id !== excludeId);
    return list.sort((a, b) => {
      const aGroup = usedMap[a._id];
      const bGroup = usedMap[b._id];

      // ✅ sort: current group first, then unassigned, then others
      const aPriority =
        aGroup === currentGroup
          ? 0
          : aGroup === undefined
          ? 1
          : 2;
      const bPriority =
        bGroup === currentGroup
          ? 0
          : bGroup === undefined
          ? 1
          : 2;
      if (aPriority !== bPriority) return aPriority - bPriority;

      const order = { DPS: 1, Tank: 2, Healer: 3 } as Record<string, number>;
      return (order[a.role] || 4) - (order[b.role] || 4);
    });
  }, [characters, usedMap, currentGroup, excludeId]);

  /* ---------- Render ---------- */
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />

      <div
        className={styles.characterDropdownWindow}
        style={{
          position: "absolute",
          top: adjustedTop,
          left: adjustedLeft,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {sortedChars.length === 0 ? (
          <div className={styles.emptyMessage}>暂无角色数据</div>
        ) : (
          sortedChars.map((c) => {
            const groupNum = usedMap[c._id];
            const isCurrent = groupNum === currentGroup;

            return (
              <div
                key={c._id}
                className={`${styles.characterOption} ${
                  c.role === "Tank"
                    ? styles.tankOption
                    : c.role === "Healer"
                    ? styles.healerOption
                    : styles.dpsOption
                } ${isCurrent ? styles.usedInCurrent : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCurrent) return; // disable clicking 已选
                  onSelect(c);
                  onClose();
                }}
              >
                <span className={styles.charName}>{c.name}</span>
                <span className={styles.groupTagRight}>
                  {isCurrent
                    ? "已选"
                    : groupNum !== undefined
                    ? `组${groupNum + 1}`
                    : ""}
                </span>
              </div>
            );
          })
        )}
      </div>
    </>,
    document.body
  );
}
