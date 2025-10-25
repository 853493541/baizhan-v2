"use client";

import { useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./styles.module.css";

type Role = "Tank" | "DPS" | "Healer";

// --- Canonical centers for robust color binning (RGB)
const CANONICAL: Record<string, [number, number, number]> = {
  purple: [0xa6, 0x78, 0xff],  // #a678ff
  yellow: [0xff, 0xe0, 0x66],  // #ffe066
  red:    [0xff, 0x6b, 0x6b],  // #ff6b6b
  green:  [0x9e, 0xfc, 0x6a],  // #9efc6a
  healer: [0xf8, 0xd7, 0xda],  // #f8d7da  (pink-ish for healer)
  blue:   [0x5c, 0xb7, 0xff],  // #5cb7ff
};

const COLOR_ORDER_MAP: Record<string, string[]> = {
  // boss-specific orders
  "拓跋思南": ["yellow", "green", "purple", "red", "healer", "blue"],
  "青年谢云流": ["purple", "yellow", "red", "green", "healer", "blue"],
  "公孙二娘": ["blue", "purple", "red", "yellow", "green", "healer"],
};
const DEFAULT_ORDER = ["purple", "yellow", "red", "green", "healer", "blue"];

// --- Helpers
function hexToRgb(hex?: string): [number, number, number] | null {
  if (!hex) return null;
  let s = hex.trim().toLowerCase();
  if (s.startsWith("var(")) return null; // CSS var not supported here
  if (s.startsWith("#")) s = s.slice(1);
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length !== 6) return null;
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

function rgbDist2(a: [number, number, number], b: [number, number, number]) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function categorize(hex?: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "other";
  let best = "other";
  let bestD = Infinity;
  for (const [name, center] of Object.entries(CANONICAL)) {
    const d = rgbDist2(rgb, center);
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

export default function AbilityDropdown({
  x,
  y,
  abilities,
  abilityColorMap,
  character,
  targetedBoss,       // <-- make sure this is passed in
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
    abilities?: Record<string, number> | { name: string; level: number }[];
    selectedAbilities?: { name: string; level: number }[];
  };
  targetedBoss: string;
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

  const colorOrder = useMemo(
    () => COLOR_ORDER_MAP[targetedBoss] || DEFAULT_ORDER,
    [targetedBoss]
  );

  // Selected ability names (for pin-to-top + gray out)
  const selectedNames = useMemo(
    () => new Set((character?.selectedAbilities || []).map((a) => a.name)),
    [character]
  );

  const getAbilityLevel = (a: string) => {
    if (!character?.abilities) return 0;
    if (typeof character.abilities === "object" && !Array.isArray(character.abilities)) {
      return (character.abilities as Record<string, number>)[a] ?? 0;
    }
    if (Array.isArray(character.abilities)) {
      const found = (character.abilities as any[]).find(
        (x) => x.name === a && typeof x.level === "number"
      );
      return found ? found.level : 0;
    }
    return 0;
  };

  // Precompute categories to avoid recomputing in sort
  const abilityMeta = useMemo(() => {
    const map = new Map<string, { cat: string; lvl: number; selected: boolean }>();
    for (const a of abilities) {
      const hex = abilityColorMap[a];
      const cat = categorize(hex);
      const lvl = getAbilityLevel(a);
      const selected = selectedNames.has(a);
      map.set(a, { cat, lvl, selected });
    }
    return map;
  }, [abilities, abilityColorMap, selectedNames, character]);

  const sortedAbilities = useMemo(() => {
    return [...abilities].sort((a, b) => {
      const A = abilityMeta.get(a)!;
      const B = abilityMeta.get(b)!;

      // 1) selected first
      if (A.selected && !B.selected) return -1;
      if (!A.selected && B.selected) return 1;

      // 2) by boss-specific color order
      const ia = colorOrder.indexOf(A.cat);
      const ib = colorOrder.indexOf(B.cat);
      if (ia !== ib) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);

      // 3) by level desc
      if (A.lvl !== B.lvl) return B.lvl - A.lvl;

      // 4) fallback by name
      return a.localeCompare(b, "zh-Hans");
    });
  }, [abilities, abilityMeta, colorOrder]);

  // Trace (no boss header in UI)
  useEffect(() => {
    console.groupCollapsed(
      `%c[trace][AbilityDropdown] order for boss: ${targetedBoss}`,
      "color:#4fa3ff;font-weight:bold;"
    );
    console.log("colorOrder:", colorOrder.join(" → "));
    console.table(
      sortedAbilities.map((a) => {
        const m = abilityMeta.get(a)!;
        return { name: a, category: m.cat, level: m.lvl, selected: m.selected };
      })
    );
    console.groupEnd();
  }, [sortedAbilities, colorOrder, targetedBoss, abilityMeta]);

  return createPortal(
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />
      <div
        className={styles.abilityDropdownGrid}
        style={{ top: adjustedTop, left: adjustedLeft, position: "absolute" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {sortedAbilities.map((a) => {
          const meta = abilityMeta.get(a)!;
          const isSelected = meta.selected;

          return (
            <div
              key={a}
              className={`${styles.abilityOptionCard} ${isSelected ? styles.grayedOut : ""}`}
              style={
                {
                  "--ability-bg": (abilityColorMap[a] ?? "#eee") + "33",
                  "--ability-hover": (abilityColorMap[a] ?? "#eee") + "55",
                  "--ability-color": abilityColorMap[a] ?? "#aaa",
                } as React.CSSProperties
              }
              onClick={(e) => {
                if (isSelected) return;
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
                style={isSelected ? { filter: "grayscale(100%)", opacity: 0.6 } : {}}
              />
              <div className={styles.abilityText}>
                <span className={styles.abilityName} style={isSelected ? { color: "#999" } : {}}>
                  {a}
                </span>
                <span className={styles.abilityLevel}>{meta.lvl > 0 ? meta.lvl : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>,
    document.body
  );
}
