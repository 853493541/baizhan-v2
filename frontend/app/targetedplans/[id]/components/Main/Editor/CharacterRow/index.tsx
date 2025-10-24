"use client";

import Image from "next/image";
import styles from "./styles.module.css";
import { MAIN_CHARACTERS } from "../config";
import type { Character } from "@/utils/solver";

/* ============================================================
   🧱 CharacterRow — renders one character row with abilities
============================================================ */
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

  // 🟢 Always ensure 3 ability slots
  const selectedAbilities = c.selectedAbilities || [
    { name: "", level: 0 },
    { name: "", level: 0 },
    { name: "", level: 0 },
  ];

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
          const dropdownId = `${c._id}-${ai}`;
          const slot = selectedAbilities[ai];
          const current = slot?.name || "";
          const level = slot?.level || 0;
          const currentColor = abilityColorMap[current] || "#ccc";

          return (
            <div key={ai} className={styles.abilitySlot}>
              {!editing ? (
                current ? (
                  <div
                    className={styles.abilityPill}
                    style={{
                      backgroundColor: currentColor + "33",
                      borderLeft: `4px solid ${currentColor}`,
                    }}
                  >
                    <Image
                      src={`/icons/${current}.png`}
                      alt={current}
                      width={20}
                      height={20}
                      className={styles.abilityIcon}
                    />
                    <span className={styles.abilityName}>
                      {current}
                      {level > 0 ? (
                        <span className={styles.abilityLevel}> {level}</span>
                      ) : (
                        <span className={styles.abilityLevelEmpty}> —</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className={styles.emptyAbility}>—</div>
                )
              ) : (
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
                    <div className={styles.selectedOption}>
                      <Image
                        src={`/icons/${current}.png`}
                        alt={current}
                        width={20}
                        height={20}
                        className={styles.abilityIcon}
                      />
                      <span className={styles.abilityName}>
                        {current}
                        {level > 0 ? (
                          <span className={styles.abilityLevel}> {level}</span>
                        ) : (
                          <span className={styles.abilityLevelEmpty}> —</span>
                        )}
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

      {/* === Remove Button === */}
      {editing && (
        <div className={styles.actionGroup}>
          <button
            onClick={() => onRemoveCharacter(groupIndex, c._id)}
            className={styles.smallBtn}
            title="移除此角色"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
