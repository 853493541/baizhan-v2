"use client";

import Image from "next/image";
import styles from "./styles.module.css";
import { MAIN_CHARACTERS, abilityAliases } from "../../config"; // 🟢 add alias map import
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
        {editing && (
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
        {[0, 1, 2].map((ai) => {
          const slot = selectedAbilities[ai];
          const fullName = slot?.name || "";
          const alias = abilityAliases[fullName] || fullName; // 🟢 show alias instead
          const level = slot?.level || 0;
          const currentColor = abilityColorMap[fullName] || "#ccc";
          const dropdownId = `${c._id}-${ai}`;

          return (
            <div key={ai} className={styles.abilitySlot}>
              {!editing ? (
                fullName ? (
                  <div
                    className={styles.abilityPill}
                    style={{
                      backgroundColor: currentColor + "33",
                      borderLeft: `5px solid ${currentColor}`,
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
                    borderLeft: `5px solid ${
                      fullName ? currentColor : "#ccc"
                    }`,
                    backgroundColor: fullName
                      ? currentColor + "25"
                      : undefined,
                  }}
                  onClick={(e) =>
                    onOpenAbilityDropdown(
                      groupIndex,
                      c._id,
                      ai,
                      dropdownId,
                      e
                    )
                  }
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
    </div>
  );
}
