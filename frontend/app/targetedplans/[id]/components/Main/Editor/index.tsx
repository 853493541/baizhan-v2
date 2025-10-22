"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import type { GroupResult, Character } from "@/utils/solver";

interface Props {
  scheduleId: string;
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  allCharacters: Character[];
  // 🟢 Optional: full character list to enrich missing role info
  characterDetails?: Character[];
}

export default function Editor({
  scheduleId,
  groups,
  setGroups,
  allCharacters,
  characterDetails,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [localGroups, setLocalGroups] = useState<GroupResult[]>([]);

  // 🧩 Hydrate missing role/account fields from `characterDetails` or `allCharacters`
  const hydrateGroups = (srcGroups: GroupResult[]): GroupResult[] => {
    const reference = characterDetails?.length ? characterDetails : allCharacters;
    return srcGroups.map((g) => ({
      ...g,
      characters: g.characters.map((c) => {
        const full = reference.find((x) => x._id === (c._id || c.characterId));
        return full ? { ...full, ...c } : c;
      }),
    }));
  };

  useEffect(() => {
    if (groups?.length > 0) {
      setLocalGroups(hydrateGroups(groups));
    } else {
      setLocalGroups([]);
    }
  }, [groups, allCharacters, characterDetails]);

  // 🟢 Add a new empty group
  const handleAddGroup = () => {
    const newGroup: GroupResult = { characters: [], missingAbilities: [], violations: [] };
    setLocalGroups([...localGroups, newGroup]);
  };

  // 🔴 Remove group by index
  const handleRemoveGroup = (idx: number) => {
    const updated = localGroups.filter((_, i) => i !== idx);
    setLocalGroups(updated);
  };

  // 🟡 Add character to group
  const handleAddCharacter = (groupIdx: number, char: Character) => {
    const updated = [...localGroups];
    if (!updated[groupIdx].characters.some((c) => c._id === char._id)) {
      updated[groupIdx].characters.push(char);
      setLocalGroups(updated);
    }
  };

  // 🔵 Remove character from group
  const handleRemoveCharacter = (groupIdx: number, charId: string) => {
    const updated = [...localGroups];
    updated[groupIdx].characters = updated[groupIdx].characters.filter((c) => c._id !== charId);
    setLocalGroups(updated);
  };

  // 💾 Save changes to backend
  const saveChanges = async () => {
    setGroups(localGroups);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: localGroups }),
      });
      alert("✅ Groups updated successfully!");
    } catch (err) {
      console.error("❌ Failed to save:", err);
      alert("Save failed");
    }
    setEditing(false);
  };

  return (
    <div className={styles.editorSection}>
      <h3 className={styles.title}>🛠 手动编辑排表</h3>

      {!editing ? (
        <button onClick={() => setEditing(true)} className={styles.editBtn}>
          ✏️ 开始编辑
        </button>
      ) : (
        <button onClick={saveChanges} className={styles.saveBtn}>
          💾 保存修改
        </button>
      )}

      <div className={styles.groupsContainer}>
        {localGroups.map((g, i) => (
          <div key={i} className={styles.groupBox}>
            <div className={styles.groupHeader}>
              <strong>第 {i + 1} 组</strong>
              <button
                onClick={() => handleRemoveGroup(i)}
                disabled={!editing}
                className={styles.removeBtn}
              >
                ❌ 删除组
              </button>
            </div>

            <div className={styles.memberList}>
              {g.characters.map((c, idx) => {
                const role = c.role ? c.role.toLowerCase() : "dps";
                const safeKey = `${c._id || c.name || "unknown"}-${idx}`;
                if (!styles[role]) console.warn("⚠️ Unknown role for", c);

                return (
                  <div
                    key={safeKey}
                    className={`${styles.characterCard} ${styles[role] || ""}`}
                  >
                    {c.name}{" "}
                    <span className={styles.small}>({c.role || "未定义角色"})</span>
                    {editing && (
                      <button
                        onClick={() => handleRemoveCharacter(i, c._id)}
                        className={styles.smallBtn}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

              {editing && (
                <select
                  onChange={(e) => {
                    const char = allCharacters.find((c) => c._id === e.target.value);
                    if (char) handleAddCharacter(i, char);
                  }}
                >
                  <option value="">➕ 添加角色</option>
                  {allCharacters.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.role || "未定义"})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}

        {editing && (
          <button onClick={handleAddGroup} className={styles.addGroupBtn}>
            ➕ 新增小组
          </button>
        )}
      </div>
    </div>
  );
}
