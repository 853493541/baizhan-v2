"use client";

import { useState, useMemo } from "react";
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
  onAddCharacter?: (groupIdx: number, character: Character) => void;
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

  /** ✅ New props to pass context for modal */
  allCharacters?: Character[];
  usedMap?: Record<string, number>;
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
  allCharacters = [],
  usedMap = {},
}: Props) {
  const c = character;

  /** 🪟 Local modal control */
  const [activeWindow, setActiveWindow] = useState<
    | null
    | { type: "character" }
    | { type: "ability"; slot: number }
  >(null);

  /** Always ensure 3 ability slots */
  const selectedAbilities = c.selectedAbilities || [
    { name: "", level: 0 },
    { name: "", level: 0 },
    { name: "", level: 0 },
  ];

  /** Handlers */
  const openCharacterModal = () => editing && setActiveWindow({ type: "character" });
  const openAbilityModal = (slot: number) =>
    editing && setActiveWindow({ type: "ability", slot });
  const closeModal = () => setActiveWindow(null);

  /** Derived alias lookup */
  const getAlias = (name: string) => abilityAliases[name] || name;

  return (
    <div className={styles.memberRow}>
      {/* === Character Pill === */}
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
            title="移除此角色"
          >
            ×
          </button>
        )}
      </div>

      {/* === Ability Slots === */}
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
                      <span className={styles.abilityName}>{alias}</span>
                    </div>
                    <span className={styles.abilityLevel}>
                      {level > 0 ? level : "—"}
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
                      <span className={styles.abilityName}>{alias}</span>
                      <span className={styles.abilityLevel}>
                        {level > 0 ? level : "—"}
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

      {/* === 🪟 Modals === */}
      {activeWindow?.type === "character" && (
        <EditCharacter
          allCharacters={allCharacters}   // ✅ pass full context
          usedMap={usedMap}               // ✅ mark where each char belongs
          currentGroup={groupIndex}       // ✅ show “已选 / 当前”
          excludeId={c._id}               // ✅ current char = being replaced
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
          onSelect={(abilityName) => {
            onAbilityChange?.(groupIndex, c._id, activeWindow.slot, abilityName);
            closeModal();
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
