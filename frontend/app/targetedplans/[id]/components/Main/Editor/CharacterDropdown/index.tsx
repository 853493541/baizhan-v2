"use client";

import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

export default function CharacterDropdown({
  x,
  y,
  excludeId,
  onSelect,
  onClose,
  allCharacters,
}: {
  x: number;
  y: number;
  excludeId?: string;
  onSelect: (c: Character) => void;
  onClose: () => void;
  allCharacters: Character[];
}) {
  const dropdownWidth = 200; // match CSS
  const dropdownHeight = 260; // approximate height for flipping logic
  const padding = 8;

  let adjustedLeft = x;
  let adjustedTop = y;

  if (typeof window !== "undefined") {
    const winLeft = window.scrollX;
    const winRight = window.scrollX + window.innerWidth;
    const winTop = window.scrollY;
    const winBottom = window.scrollY + window.innerHeight;

    const minLeft = winLeft + padding;
    const maxLeft = winRight - dropdownWidth - padding;

    // Clamp horizontally
    if (adjustedLeft < minLeft) adjustedLeft = minLeft;
    if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;

    // ✅ Check if there's enough space below
    const hasSpaceBelow = adjustedTop + dropdownHeight + 10 < winBottom;

    // ✅ Place dropdown slightly closer and flip if needed
    adjustedTop = hasSpaceBelow ? adjustedTop + 2 : adjustedTop - dropdownHeight - 10;

    console.log("📍 Dropdown position:", {
      x,
      y,
      adjustedLeft,
      adjustedTop,
      hasSpaceBelow,
      viewport: { winTop, winBottom },
    });
  }

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
        {allCharacters
          .filter((c) => c._id !== excludeId)
          .sort((a, b) => {
            const order = { DPS: 1, Tank: 2, Healer: 3 } as Record<string, number>;
            return (order[a.role] || 4) - (order[b.role] || 4);
          })
          .map((c) => (
            <div
              key={c._id}
              className={`${styles.characterOption} ${
                c.role === "Tank"
                  ? styles.tankOption
                  : c.role === "Healer"
                  ? styles.healerOption
                  : styles.dpsOption
              }`}
              onClick={(e) => {
                console.log("🖱 Selected:", c.name, c.role);
                e.stopPropagation();
                onSelect(c);
                onClose();
              }}
            >
              {c.name}
            </div>
          ))}
      </div>
    </>,
    document.body
  );
}
