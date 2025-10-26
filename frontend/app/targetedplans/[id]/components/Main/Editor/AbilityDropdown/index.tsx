"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./styles.module.css";

type Role = "Tank" | "DPS" | "Healer";

/* === Canonical color centers === */
const CANONICAL: Record<string, [number, number, number]> = {
  purple: [0xa6, 0x78, 0xff],
  yellow: [0xff, 0xe0, 0x66],
  red: [0xff, 0x6b, 0x6b],
  green: [0x9e, 0xfc, 0x6a],
  healer: [0xf8, 0xd7, 0xda],
  blue: [0x5c, 0xb7, 0xff],
};

/* === Chinese catalog labels === */
const COLOR_ORDER = ["yellow", "purple", "blue", "healer", "red", "green"];
const COLOR_LABELS: Record<string, string> = {
  yellow: "黄",
  purple: "紫",
  red: "红",
  healer: "治疗",
  blue: "蓝",
  green: "绿",
  other: "其他",
};

/* === Helpers === */
function hexToRgb(hex?: string): [number, number, number] | null {
  if (!hex) return null;
  let s = hex.trim().toLowerCase();
  if (s.startsWith("#")) s = s.slice(1);
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length !== 6) return null;
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}
function rgbDist2(a: [number, number, number], b: [number, number, number]) {
  const dr = a[0] - b[0],
    dg = a[1] - b[1],
    db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}
function categorize(hex?: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "other";
  let best = "other",
    bestD = Infinity;
  for (const [name, center] of Object.entries(CANONICAL)) {
    const d = rgbDist2(rgb, center);
    if (d < bestD) (bestD = d), (best = name);
  }
  return best;
}

/* === Main Component === */
export default function AbilityDropdown({
  abilities,
  abilityColorMap,
  character,
  targetedBoss,
  onSelect,
  onClose,
}: {
  abilities: string[];
  abilityColorMap: Record<string, string>;
  character?: {
    name: string;
    role: Role;
    abilities?: Record<string, number> | { name: string; level: number }[];
    selectedAbilities?: { name: string; level: number }[];
  };
  targetedBoss: string;
  onSelect: (ability: string) => void;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;

  const getAbilityLevel = (a: string) => {
    if (!character?.abilities) return 0;
    if (
      typeof character.abilities === "object" &&
      !Array.isArray(character.abilities)
    )
      return (character.abilities as Record<string, number>)[a] ?? 0;
    if (Array.isArray(character.abilities)) {
      const found = (character.abilities as any[]).find(
        (x) => x.name === a && typeof x.level === "number"
      );
      return found ? found.level : 0;
    }
    return 0;
  };

  const selectedNames = new Set(
    (character?.selectedAbilities || []).map((a) => a.name)
  );

  /* --- Group by color category --- */
  const grouped: Record<string, string[]> = {};
  for (const color of COLOR_ORDER) grouped[color] = [];
  grouped["other"] = [];
  for (const a of abilities) {
    const cat = categorize(abilityColorMap[a]);
    (grouped[cat] || grouped["other"]).push(a);
  }

  const colorBackground: Record<string, string> = {
    purple: "#f3e8ff",
    yellow: "#fff7d1",
    red: "#ffe6e6",
    green: "#e8ffde",
    healer: "#ffe8f0",
    blue: "#e2f2ff",
  };

  /* --- Debug trace --- */
  useEffect(() => {
    console.groupCollapsed(
      "%c[trace][AbilityDropdown] Modal render",
      "color:#4fa3ff;font-weight:bold;"
    );
    console.log("Character:", character?.name);
    console.log("selectedAbilities:", character?.selectedAbilities);
    console.table(
      abilities.map((a) => ({
        name: a,
        level: getAbilityLevel(a),
        selected: selectedNames.has(a),
        category: categorize(abilityColorMap[a]),
      }))
    );
    console.groupEnd();
  }, [character, abilities, abilityColorMap]);

  /* --- Render --- */
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />
      <div className={styles.abilityDropdownGrid} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>
            {"选择技能"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.catalogRow}>
          {COLOR_ORDER.map((color) => {
            const list = grouped[color];
            if (!list?.length) return null;

            return (
              <div
                key={color}
                className={styles.catalogColumn}
                style={{ background: colorBackground[color] }}
              >
                <div className={styles.catalogHeader}>
                  {COLOR_LABELS[color] || color}
                </div>

                {list.map((a) => {
                  const level = getAbilityLevel(a);
                  const isValid = [8, 9, 10].includes(level);
                  const isSelected = selectedNames.has(a);
                  const isLow = level <= 9 && level > 0;

                  return (
                    <div
                      key={a}
                      className={`${styles.abilityOptionCard} ${
                        !isValid ? styles.invalidLevel : ""
                      } ${isSelected ? styles.grayedOut : ""}`}
                      onClick={(e) => {
                        if (isSelected || !isValid) return;
                        e.stopPropagation();
                        onSelect(a);
                        onClose();
                      }}
                    >
                      {isSelected && (
                        <div className={styles.checkMark}>✓</div>
                      )}

                      <div className={styles.iconCenter}>
                        <Image
                          src={`/icons/${a}.png`}
                          alt={a}
                          width={22}
                          height={22}
                          className={styles.abilityIconLarge}
                        />
                        <span
                          className={`${styles.levelNumber} ${
                            isLow ? styles.lowLevel : styles.highLevel
                          }`}
                        >
                          {level > 0 ? level : ""}
                        </span>
                      </div>

                      <div className={styles.abilityText}>
                        <span className={styles.abilityName}>{a}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
