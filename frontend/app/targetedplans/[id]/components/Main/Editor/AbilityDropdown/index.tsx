"use client";

import { useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./styles.module.css";

type Role = "Tank" | "DPS" | "Healer";

export default function AbilityDropdown({
  x,
  y,
  abilities,
  abilityColorMap,
  character,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  abilities: string[];
  abilityColorMap: Record<string, string>;
  character?: {
    name: string;
    role: Role;
    abilities?: Record<string, number> | { name: string; level: number }[]; // full map or array
    selectedAbilities?: { name: string; level: number }[]; // 3 slots
  };
  onSelect: (ability: string) => void;
  onClose: () => void;
}) {
  const dropdownWidth = 240;
  const dropdownHeight = 320;
  const padding = 8;

  let adjustedLeft = x;
  let adjustedTop = y;

  if (typeof window !== "undefined") {
    const winBottom = window.scrollY + window.innerHeight;
    const minLeft = window.scrollX + padding;
    const maxLeft = window.scrollX + window.innerWidth - dropdownWidth - padding;
    if (adjustedLeft < minLeft) adjustedLeft = minLeft;
    if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;
    const hasSpaceBelow = adjustedTop + dropdownHeight + 10 < winBottom;
    adjustedTop = hasSpaceBelow ? adjustedTop + 2 : adjustedTop - dropdownHeight - 10;
  }

  // Pull levels and selected names
  const selectedNames = useMemo(
    () => new Set((character?.selectedAbilities || []).map((a) => a.name)),
    [character]
  );

  // --- 🔍 Handle both map and array structures for abilities
  const getAbilityLevel = (a: string) => {
    if (!character?.abilities) return 0;

    // case 1: ability map { "斗转金移": 10 }
    if (
      typeof character.abilities === "object" &&
      !Array.isArray(character.abilities)
    ) {
      return (character.abilities as Record<string, number>)[a] ?? 0;
    }

    // case 2: array [{ name, level }]
    if (Array.isArray(character.abilities)) {
      const found = (character.abilities as any[]).find(
        (x) => x.name === a && typeof x.level === "number"
      );
      return found ? found.level : 0;
    }

    return 0;
  };

  // --- 🧠 [trace] Log what dropdown actually receives
  useEffect(() => {
    console.groupCollapsed(
      `%c[trace][AbilityDropdown] Received character for dropdown`,
      "color:#4fa3ff;font-weight:bold;"
    );
    console.log("Character name:", character?.name);
    console.log("Character role:", character?.role);
    console.log("Full abilities:", character?.abilities);
    console.log("Selected abilities:", character?.selectedAbilities);
    if (abilities?.length) {
      console.log(
        "Mapped levels:",
        abilities.map((a) => ({
          name: a,
          level: getAbilityLevel(a),
        }))
      );
    }
    console.groupEnd();
  }, [character, abilities]);

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
        {abilities.map((a) => {
          const level = getAbilityLevel(a);
          const isSelected = selectedNames.has(a);

          return (
            <div
              key={a}
              className={`${styles.abilityOptionCard} ${
                isSelected ? styles.selectedAbility : ""
              }`}
              style={
                {
                  "--ability-bg": (abilityColorMap[a] ?? "#eee") + "33",
                  "--ability-hover": (abilityColorMap[a] ?? "#eee") + "55",
                  "--ability-color": abilityColorMap[a] ?? "#aaa",
                } as React.CSSProperties
              }
              onClick={(e) => {
                e.stopPropagation();
                console.log(
                  `[trace][AbilityDropdown] Clicked ability "${a}" (level ${level}) for character "${character?.name}"`
                );
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
              <div className={styles.abilityText}>
                <span className={styles.abilityName}>{a}</span>
                <span className={styles.abilityLevel}>
                  {level > 0 ? level : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>,
    document.body
  );
}
