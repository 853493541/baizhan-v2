"use client";

import Image from "next/image";
import styles from "./styles.module.css";
import { MAIN_CHARACTERS } from "../../config";
import type { Character } from "@/utils/solver";

export default function CharacterRow({
  character,
  groupIndex,
  editing,
  abilityColorMap,
  onRemoveCharacter,
  onOpenCharacterDropdown,
  onOpenAbilityDropdown,
}: {
  character: Character;
  groupIndex: number;
  editing: boolean;
  abilityColorMap: Record<string, string>;
  onRemoveCharacter: (groupIdx: number, charId: string) => void;
  onOpenCharacterDropdown: (
    type: "replace" | "add",
    groupIdx: number,
    charId: string | undefined,
    e: React.MouseEvent
  ) => void;
  onOpenAbilityDropdown: (
    groupIdx: number,
    charId: string,
    slot: number,
    dropdownId: string,
    e: React.MouseEvent
  ) => void;
}) {
  const c = character;

  // Always ensure 3 ability slots
  const selectedAbilities = c.selectedAbilities || [
    { name: "", level: 0 },
    { name: "", level: 0 },
    { name: "", level: 0 },
  ];

  return (
    <div className={styles.memberRow}>
      {/* === Delete Button (Left Side, Always Exists) === */}
      <div className={styles.actionGroup}>
        {editing ? (
          <button
            onClick={() => onRemoveCharacter(groupIndex, c._id)}
            className={styles.smallBtn}
            title="移除此角色"
          >
            x
          </button>
        ) : (
          <div className={styles.placeholderBtn}></div>
        )}
      </div>

      {/* === Character Pill === */}
      <div
        className={`${styles.memberItem} ${
          c.role === "Tank"
            ? styles.tank
            : c.role === "Healer"
            ? styles.healer
            : styles.dps
        }`}
        onClick={(e) =>
          editing && onOpenCharacterDropdown("replace", groupIndex, c._id, e)
        }
      >
        {MAIN_CHARACTERS.has(c.name) ? "★ " : ""}
        {c.name}
      </div>

      {/* === Ability Slots === */}
      <div className={styles.abilityGroup}>
        {[0, 1, 2].map((ai) => {
          const slot = selectedAbilities[ai];
          const current = slot?.name || "";
          const level = slot?.level || 0;
          const currentColor = abilityColorMap[current] || "#ccc";
          const dropdownId = `${c._id}-${ai}`;

          return (
            <div key={ai} className={styles.abilitySlot}>
              {/* --- Non-editing mode --- */}
              {!editing ? (
                current ? (
                  <div
                    className={styles.abilityPill}
                    style={{
                      backgroundColor: currentColor + "33",
                      borderLeft: `5px solid ${currentColor}`,
                    }}
                  >
                    <div className={styles.abilityContent}>
                      <Image
                        src={`/icons/${current}.png`}
                        alt={current}
                        width={20}
                        height={20}
                        className={styles.abilityIcon}
                      />
                      <span className={styles.abilityName}>{current}</span>
                    </div>
                    <span className={styles.abilityLevel}>
                      {level > 0 ? level : "—"}
                    </span>
                  </div>
                ) : (
                  <div className={styles.emptyAbility}>—</div>
                )
              ) : (
                /* --- Editing mode --- */
                <div
                  className={styles.customDropdown}
                  style={{
                    borderLeft: `5px solid ${
                      current ? currentColor : "#ccc"
                    }`,
                    backgroundColor: current
                      ? currentColor + "25"
                      : undefined,
                  }}
                  onClick={(e) =>
                    onOpenAbilityDropdown(groupIndex, c._id, ai, dropdownId, e)
                  }
                >
                  {current ? (
                    <div className={styles.abilityContent}>
                      <Image
                        src={`/icons/${current}.png`}
                        alt={current}
                        width={20}
                        height={20}
                        className={styles.abilityIcon}
                      />
                      <span className={styles.abilityName}>{current}</span>
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
    </div>
  );
}
