"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./styles.module.css";
import abilityGroups from "../../../../../../data/TargetedPlanUseAbilities.json";

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

/* === Display Order & Labels === */
const COLOR_ORDER = ["yellow", "purple", "blue", "red", "green", "healer"];
const COLOR_LABELS: Record<string, string> = {
  yellow: "黄",
  purple: "紫",
  red: "红",
  healer: "治疗",
  blue: "蓝",
  green: "绿",
  other: "其他",
};

/* === Parse aliases from JSON === */
const ALIAS_MAP: Record<string, Record<string, string>> = {};
Object.entries(
  abilityGroups as Record<
    string,
    { abilities: string[]; aliases?: Record<string, string> }
  >
).forEach(([color, group]) => {
  if (group.aliases) ALIAS_MAP[color] = group.aliases;
});

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

/* === Component === */
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

  /* --- Group by color --- */
  const grouped: Record<string, string[]> = {};
  for (const color of COLOR_ORDER) grouped[color] = [];
  grouped["other"] = [];
  for (const a of abilities) {
    const cat = categorize(abilityColorMap[a]);
    if (ALIAS_MAP[cat] && ALIAS_MAP[cat][a]) {
      (grouped[cat] || grouped["other"]).push(a);
    }
  }

  /* --- Render --- */
  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />
      <div
        className={styles.abilityDropdownGrid}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.centerTitle}>选择技能</h2>
          <button className={styles.closeBtn} onClick={onClose} title="关闭">
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
                className={`${styles.catalogColumn} ${styles[color]}`}
              >
                <div className={styles.catalogHeader}>{COLOR_LABELS[color]}</div>

                {list.map((a) => {
                  const level = getAbilityLevel(a);
                  const isValid = [8, 9, 10].includes(level);
                  if (!isValid) return null;

                  const isSelected = selectedNames.has(a);
                  const alias = ALIAS_MAP[color]?.[a] || a;
                  const isLow = level <= 9 && level > 0;

                  return (
                    <div
                      key={a}
                      className={`${styles.abilityOptionCard} ${
                        isSelected ? styles.grayedOut : ""
                      }`}
                      onClick={(e) => {
                        if (isSelected) return;
                        e.stopPropagation();
                        onSelect(a);
                        onClose();
                      }}
                    >
                      {isSelected && (
                        <div className={styles.checkMark}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="white"
                            width="12"
                            height="12"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414L8.5 11.086l6.793-6.793a1 1 0 0 1 1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}

                      <Image
                        src={`/icons/${a}.png`}
                        alt={a}
                        width={26}
                        height={26}
                        className={styles.abilityIconLarge}
                      />

                      <div className={styles.abilityText}>
                        <span className={styles.abilityName}>
                          {alias}
                          {level > 0 && (
                            <span
                              className={
                                isLow ? styles.lowLevel : styles.highLevel
                              }
                            >
                              （{level}）
                            </span>
                          )}
                        </span>
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
