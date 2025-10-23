"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./styles.module.css";

export default function AbilityDropdown({
  x, y, abilities, abilityColorMap, onSelect, onClose,
}: {
  x: number;
  y: number;
  abilities: string[];
  abilityColorMap: Record<string, string>;
  onSelect: (ability: string) => void;
  onClose: () => void;
}) {
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />
      <div
        className={styles.abilityDropdownGrid}
        style={{ top: y, left: x }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {abilities.map((a) => (
          <div
            key={a}
            className={styles.abilityOptionCard}
            style={
              {
                "--ability-bg": abilityColorMap[a] + "33",
                "--ability-hover": abilityColorMap[a] + "55",
                "--ability-color": abilityColorMap[a],
              } as React.CSSProperties
            }
            onClick={(e) => { e.stopPropagation(); onSelect(a); }}
          >
            <Image
              src={`/icons/${a}.png`}
              alt={a}
              width={28}
              height={28}
              className={styles.abilityIconLarge}
            />
            <span>{a}</span>
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}
