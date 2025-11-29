"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import EditCharacter from "./EditCharacter";
import EditAbility from "./EditAbility";
import { MAIN_CHARACTERS, abilityAliases } from "../../config";
import type { Character } from "@/utils/solver";

interface Props {
  character: Character;
  groupIndex: number;
  editing: boolean;
  abilityColorMap: Record<string, string>;
  targetedBoss?: string;

  onRemoveCharacter: (groupIdx: number, charId: string) => void;
  onReplaceCharacter?: (
    groupIdx: number,
    oldCharId: string,
    newCharacter: Character
  ) => void;
  onAbilityChange?: (
    groupIdx: number,
    charId: string,
    slot: number,
    abilityName: string
  ) => void;

  /** Passed down from parent */
  allCharacters: Character[];
  usedMap: Record<string, number>;
}

export default function CharacterRow({
  character,
  groupIndex,
  editing,
  abilityColorMap,
  targetedBoss,
  onRemoveCharacter,
  onReplaceCharacter,
  onAbilityChange,
  allCharacters,
  usedMap,
}: Props) {
  const c = character;

  /** Modal state */
  const [activeWindow, setActiveWindow] = useState<
    null | { type: "character" } | { type: "ability"; slot: number }
  >(null);

  const openCharacterModal = () =>
    editing && setActiveWindow({ type: "character" });

  const openAbilityModal = (slot: number) =>
    editing && setActiveWindow({ type: "ability", slot });

  const closeModal = () => setActiveWindow(null);

  /** Always ensure 3 slots */
  const selectedAbilities = c.selectedAbilities || [
    { name: "", level: 0 },
    { name: "", level: 0 },
    { name: "", level: 0 },
  ];

  const getAlias = (n: string) => abilityAliases[n] || n;

  return (
    <div className={styles.memberRow}>
      {/* Character pill */}
      <div
        className={`${styles.memberItem} ${
          c.role === "Tank"
            ? styles.tank
            : c.role === "Healer"
            ? styles.healer
            : styles.dps
        }`}
        onClick={openCharacterModal}
      >
        {MAIN_CHARACTERS.has(c.name) ? "★ " : ""}
        {c.name || "（空位）"}

        {editing && c._id && (
          <button
            className={styles.deleteCircle}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCharacter(groupIndex, c._id);
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Ability slots */}
      <div className={styles.abilityGroup}>
        {[0, 1, 2].map((i) => {
          const slot = selectedAbilities[i];
          const fullName = slot?.name || "";
          const alias = getAlias(fullName);
          const level = slot?.level || 0;
          const color = abilityColorMap[fullName] || "#ccc";

          return (
            <div key={i} className={styles.abilitySlot}>
              {!editing ? (
                fullName ? (
                  <div
                    className={styles.abilityPill}
                    style={{
                      backgroundColor: color + "33",
                      borderLeft: `5px solid ${color}`,
                    }}
                  >
                    <div className={styles.abilityContent}>
                      <Image
                        src={`/icons/${fullName}.png`}
                        alt={fullName}
                        width={20}
                        height={20}
                        className={styles.abilityIcon}
                      />
                      <span>{alias}</span>
                    </div>
                    <span className={styles.abilityLevel}>
                      {level || "—"}
                    </span>
                  </div>
                ) : (
                  <div className={styles.emptyAbility}>—</div>
                )
              ) : (
                <div
                  className={styles.customDropdown}
                  style={{
                    borderLeft: `5px solid ${fullName ? color : "#ccc"}`,
                    backgroundColor: fullName ? color + "25" : undefined,
                  }}
                  onClick={() => openAbilityModal(i)}
                >
                  {fullName ? (
                    <div className={styles.abilityContent}>
                      <Image
                        src={`/icons/${fullName}.png`}
                        alt={fullName}
                        width={20}
                        height={20}
                        className={styles.abilityIcon}
                      />
                      <span>{alias}</span>
                      <span className={styles.abilityLevel}>
                        {level || "—"}
                      </span>
                    </div>
                  ) : (
                    <span className={styles.placeholder}>（选择技能）</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {activeWindow?.type === "character" && (
        <EditCharacter
          allCharacters={allCharacters}
          usedMap={usedMap}
          currentGroup={groupIndex}
          excludeId={c._id}
          onSelect={(picked) => {
            onReplaceCharacter?.(groupIndex, c._id, picked);
            closeModal();
          }}
          onClose={closeModal}
        />
      )}

      {activeWindow?.type === "ability" && (
        <EditAbility
          abilityColorMap={abilityColorMap}
          character={c}
          targetedBoss={targetedBoss}
          onSelect={(ability) => {
            onAbilityChange?.(groupIndex, c._id, activeWindow.slot, ability);
            closeModal();
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
