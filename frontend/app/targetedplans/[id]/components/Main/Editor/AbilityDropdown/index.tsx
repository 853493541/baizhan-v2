"use client";

import { useEffect, useMemo, useState } from "react";
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
  debug = true,
}: {
  x: number;
  y: number;
  abilities: string[];
  abilityColorMap: Record<string, string>;
  character?: {
    name: string;
    role: Role;
    abilities?: Record<string, number>; // full map
    selectedAbilities?: { name: string; level: number }[]; // 3 slots
  };
  onSelect: (ability: string) => void;
  onClose: () => void;
  debug?: boolean;
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

  // 🧮 Pull levels and selected names
  const abilityLevels = character?.abilities ?? {};
  const selectedNames = useMemo(
    () => new Set((character?.selectedAbilities || []).map((a) => a.name)),
    [character]
  );

  const getAbilityLevel = (a: string) => abilityLevels[a] ?? 0;

  // Small summary for debug logging
  const sampleLevels = useMemo(() => {
    const entries = abilities.slice(0, 8).map((a) => [a, getAbilityLevel(a)]);
    return Object.fromEntries(entries);
  }, [abilities, character]);

  // Console debug info
  useEffect(() => {
    if (!debug) return;
    console.group("[AbilityDropdown] props");
    console.log("x,y:", { x, y });
    console.log("adjusted:", { left: adjustedLeft, top: adjustedTop });
    console.log("abilities count:", abilities.length);
    console.log("character:", character ?? "(none)");
    console.log("sample levels:", sampleLevels);
    console.groupEnd();
  }, [x, y, adjustedLeft, adjustedTop, abilities, abilityColorMap, character, sampleLevels, debug]);

  const [showDebug, setShowDebug] = useState<boolean>(debug);

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
        {/* Debug toggle chip */}
        {debug && (
          <button
            type="button"
            onClick={() => setShowDebug((v) => !v)}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 6,
              border: "1px solid #bbb",
              background: showDebug ? "#fff3cd" : "#f1f3f5",
              cursor: "pointer",
              zIndex: 2,
            }}
          >
            DBG
          </button>
        )}

        {/* Ability list */}
        {abilities.map((a) => {
          const level = getAbilityLevel(a);
          const levelLabel =
            level >= 10 ? "★10" : level >= 9 ? "☆9" : level > 0 ? `Lv${level}` : "未学";
          const levelClass =
            level >= 10
              ? styles.level10
              : level >= 9
              ? styles.level9
              : level > 0
              ? styles.levelLearned
              : styles.levelMissing;
          const isSelected = selectedNames.has(a);

          return (
            <div
              key={a}
              className={`${styles.abilityOptionCard} ${levelClass} ${
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
                <span className={styles.abilityLevel}>{levelLabel}</span>
              </div>
            </div>
          );
        })}

        {/* Debug info */}
        {debug && showDebug && (
          <div
            style={{
              marginTop: 8,
              borderTop: "1px dashed #ccc",
              paddingTop: 8,
              background: "#fff",
              borderRadius: 6,
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 6, color: "#555" }}>
              <strong>Debug</strong>
            </div>
            <div style={{ display: "grid", gap: 4, fontSize: 12, color: "#444" }}>
              <div>
                <b>Pos:</b> ({x}, {y}) → <b>Adjusted:</b> (
                {Math.round(adjustedLeft)}, {Math.round(adjustedTop)})
              </div>
              <div>
                <b>Abilities:</b> {abilities.length}
              </div>
              <div>
                <b>Char:</b>{" "}
                {character
                  ? `${character.name} (${character.role})`
                  : "— (not provided)"}
              </div>
              <div>
                <b>Selected:</b>{" "}
                {[...(selectedNames || [])].join(", ") || "—"}
              </div>
              <div>
                <b>Sample levels:</b>{" "}
                {Object.entries(sampleLevels).map(([k, v]) => (
                  <span key={k} style={{ marginRight: 6 }}>
                    {k}:{v}
                  </span>
                ))}
              </div>
              <details>
                <summary>Full props</summary>
                <pre
                  style={{
                    maxHeight: 180,
                    overflow: "auto",
                    background: "#f8f9fa",
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
{JSON.stringify(
  {
    x,
    y,
    adjustedLeft,
    adjustedTop,
    abilities,
    selectedAbilities: character?.selectedAbilities,
    abilityColorMapKeys: Object.keys(abilityColorMap),
    character,
  },
  null,
  2
)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
