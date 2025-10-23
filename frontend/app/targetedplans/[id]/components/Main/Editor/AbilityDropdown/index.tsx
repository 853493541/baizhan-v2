"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./styles.module.css";

export default function AbilityDropdown({
  x,
  y,
  abilities,
  abilityColorMap,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  abilities: string[];
  abilityColorMap: Record<string, string>;
  onSelect: (ability: string) => void;
  onClose: () => void;
}) {
  const dropdownWidth = 240; // narrower than before for compact layout
  const dropdownHeight = 320; // estimated height for flip logic
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

    // ✅ Check if there’s enough space below to open downward
    const hasSpaceBelow = adjustedTop + dropdownHeight + 10 < winBottom;

    // ✅ Flip above if not enough space below
    adjustedTop = hasSpaceBelow ? adjustedTop + 2 : adjustedTop - dropdownHeight - 10;

    console.log("📊 [AbilityDropdown] Position:", {
      incoming: { x, y },
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
        className={styles.abilityDropdownGrid}
        style={{
          top: adjustedTop,
          left: adjustedLeft,
          position: "absolute",
        }}
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
            onClick={(e) => {
              console.log("🧩 Selected ability:", a);
              e.stopPropagation();
              onSelect(a);
              onClose();
            }}
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
