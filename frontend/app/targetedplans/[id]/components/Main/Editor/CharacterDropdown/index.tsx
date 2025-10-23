"use client";

import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

export default function CharacterDropdown({
  x, y, excludeId, onSelect, onClose, allCharacters,
}: {
  x: number;
  y: number;
  excludeId?: string;
  onSelect: (c: Character) => void;
  onClose: () => void;
  allCharacters: Character[];
}) {
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />
      <div
        className={styles.characterDropdownWindow}
        style={{ top: y, left: x }}
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
              onClick={(e) => { e.stopPropagation(); onSelect(c); onClose(); }}
            >
              {c.name}
            </div>
          ))}
      </div>
    </>,
    document.body
  );
}
