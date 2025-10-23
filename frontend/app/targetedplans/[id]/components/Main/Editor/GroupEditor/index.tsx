"use client";

import styles from "./styles.module.css";
import CharacterRow from "../CharacterRow";
import type { GroupResult, Character } from "@/utils/solver";

export default function GroupEditor({
  group,
  groupIndex,
  editing,
  abilityColorMap,
  onRemoveGroup,
  onRemoveCharacter,
  onOpenCharacterDropdown,
  onOpenAbilityDropdown,
}: {
  group: GroupResult;
  groupIndex: number;
  editing: boolean;
  abilityColorMap: Record<string, string>;
  onRemoveGroup: (idx: number) => void;
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
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <h4 className={styles.groupTitle}>第 {groupIndex + 1} 组</h4>
        {editing && (
          <button onClick={() => onRemoveGroup(groupIndex)} className={styles.removeBtn}>
            ❌ 删除组
          </button>
        )}
      </div>

      <div className={styles.memberList}>
        {group.characters.map((c, ci) => (
          <CharacterRow
            key={c._id || ci}
            character={c as Character}
            groupIndex={groupIndex}
            editing={editing}
            abilityColorMap={abilityColorMap}
            onRemoveCharacter={onRemoveCharacter}
            onOpenCharacterDropdown={onOpenCharacterDropdown}
            onOpenAbilityDropdown={onOpenAbilityDropdown}
          />
        ))}

        {/* Inline Add Character Button (white, aligned) */}
        {editing && group.characters.length < 3 && (
          <div className={styles.addRow}>
            <button
              className={styles.addCharacterBtn}
              onClick={(e) => onOpenCharacterDropdown("add", groupIndex, undefined, e)}
            >
              ＋ 添加角色
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
