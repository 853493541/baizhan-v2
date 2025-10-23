"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import abilityGroups from "../../../../../data/TargetedPlanUseAbilities.json";
import type { GroupResult, Character } from "@/utils/solver";

const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

// Ability Category Colors
const CATEGORY_COLORS: Record<string, string> = {
  purple: "#a678ff",
  yellow: "#ffe066",
  red: "#ff6b6b",
  blue: "#5cb7ff",
  green: "#74d39a",
  healer: "#ff9dd6",
};

// Flatten ability groups and build color map
const abilityColorMap: Record<string, string> = {};
const abilities: string[] = [];
Object.entries(abilityGroups).forEach(([group, list]) => {
  const color = CATEGORY_COLORS[group] || "#ddd";
  list.forEach((name) => {
    abilityColorMap[name] = color;
    abilities.push(name);
  });
});

interface Props {
  scheduleId: string;
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  allCharacters: Character[];
}

export default function Editor({ scheduleId, groups, setGroups, allCharacters }: Props) {
  const [editing, setEditing] = useState(false);
  const [localGroups, setLocalGroups] = useState<GroupResult[]>(groups);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [elevatedGroup, setElevatedGroup] = useState<number | null>(null);
  const [openReplace, setOpenReplace] = useState<string | null>(null);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const replaceAreaRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => setLocalGroups(groups), [groups]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideAbility = slotRefs.current.some((ref) => ref && ref.contains(target));
      const insideReplace = Object.values(replaceAreaRefs.current).some(
        (ref) => ref && ref.contains(target)
      );
      if (!insideAbility && !insideReplace) {
        setOpenDropdown(null);
        setOpenReplace(null);
        setElevatedGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddGroup = () => {
    const newGroup: GroupResult = { characters: [], missingAbilities: [], violations: [] };
    setLocalGroups((prev) => [...prev, newGroup]);
  };

  const handleRemoveGroup = (idx: number) => {
    setLocalGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddCharacter = (groupIdx: number, char: Character) => {
    setLocalGroups((prev) => {
      const updated = [...prev];
      const group = updated[groupIdx];
      if (group.characters.length >= 3) return prev;

      const existsIdx = group.characters.findIndex((c) => c._id === char._id);
      if (existsIdx !== -1) {
        const [existing] = group.characters.splice(existsIdx, 1);
        group.characters.push(existing);
      } else {
        group.characters.push({ ...char, abilities: ["", "", ""] });
      }

      updated.forEach((g, gi) => {
        if (gi !== groupIdx) g.characters = g.characters.filter((c) => c._id !== char._id);
      });

      return updated;
    });
  };

  // ✅ Always replace — remove old char wherever it was
  const handleReplaceCharacter = (groupIdx: number, oldCharId: string, newChar: Character) => {
    setLocalGroups((prev) => {
      const updated = prev.map((g) => ({
        ...g,
        characters: g.characters.filter((c) => c._id !== newChar._id), // remove newChar from all groups first
      }));

      const group = updated[groupIdx];
      const replaceIndex = group.characters.findIndex((c) => c._id === oldCharId);
      if (replaceIndex !== -1) {
        group.characters[replaceIndex] = { ...newChar, abilities: ["", "", ""] };
      }

      return updated;
    });
  };

  const handleRemoveCharacter = (groupIdx: number, charId: string) => {
    setLocalGroups((prev) => {
      const updated = [...prev];
      updated[groupIdx].characters = updated[groupIdx].characters.filter((c) => c._id !== charId);
      return updated;
    });
  };

  const handleAbilityChange = (groupIdx: number, charId: string, slot: number, ability: string) => {
    setLocalGroups((prev) => {
      const updated = [...prev];
      updated[groupIdx].characters = updated[groupIdx].characters.map((c) => {
        if (c._id === charId) {
          const arr = [...(c.abilities || ["", "", ""])];
          const dup = arr.findIndex((a, i) => a === ability && i !== slot);
          if (dup !== -1) arr[dup] = "";
          arr[slot] = ability;
          return { ...c, abilities: arr };
        }
        return c;
      });
      return updated;
    });
    setOpenDropdown(null);
    setElevatedGroup(null);
  };

  const saveChanges = async () => {
    setGroups(localGroups);
    const payload = localGroups.map((g, idx) => ({
      index: idx + 1,
      characters: g.characters.map((c) => ({
        characterId: c._id || c.characterId || null,
        abilities: Array.isArray(c.abilities) ? c.abilities : ["", "", ""],
      })),
      status: g.status || "not_started",
      kills: g.kills || [],
    }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Save failed (${res.status}): ${text}`);
      }
      alert("✅ 已保存修改！");
    } catch (err) {
      console.error("❌ Save failed:", err);
      alert("保存失败，请查看控制台日志。");
    }
    setEditing(false);
  };

  return (
    <div className={styles.groupsGrid}>
      <div className={styles.editorHeader}>
        <h3 className={styles.sectionSubtitle}>🛠 手动编辑排表</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className={styles.editBtn}>
            ✏️ 开始编辑
          </button>
        ) : (
          <button onClick={saveChanges} className={styles.saveBtn}>
            💾 保存修改
          </button>
        )}
      </div>

      {localGroups.map((g, gi) => (
        <div key={gi} className={`${styles.groupCard} ${elevatedGroup === gi ? styles.cardElevated : ""}`}>
          <div className={styles.groupHeader}>
            <h4 className={styles.groupTitle}>第 {gi + 1} 组</h4>
            {editing && (
              <button onClick={() => handleRemoveGroup(gi)} className={styles.removeBtn}>
                ❌ 删除组
              </button>
            )}
          </div>

          <div className={styles.memberList}>
            {g.characters.map((c, ci) => (
              <div
                key={c._id || ci}
                className={styles.memberRow}
                style={{ position: "relative" }}
                ref={(el) => (replaceAreaRefs.current[`${c._id}-area`] = el)}
              >
                <div
                  className={`${styles.memberItem} ${
                    c.role === "Tank" ? styles.tank : c.role === "Healer" ? styles.healer : styles.dps
                  }`}
                  onClick={() => {
                    if (!editing) return;
                    const id = `${c._id}-replace`;
                    setOpenReplace(openReplace === id ? null : id);
                  }}
                >
                  {MAIN_CHARACTERS.has(c.name) ? "★ " : ""}
                  {c.name}
                </div>

                {openReplace === `${c._id}-replace` && (
                  <div className={styles.characterDropdownWindow} onMouseDown={(e) => e.stopPropagation()}>
                    {allCharacters
                      .filter((cc) => cc._id !== c._id)
                      .sort((a, b) => {
                        const order = { DPS: 1, Tank: 2, Healer: 3 };
                        return (order[a.role] || 4) - (order[b.role] || 4);
                      })
                      .map((cc) => (
                        <div
                          key={cc._id}
                          className={`${styles.characterOption} ${
                            cc.role === "Tank"
                              ? styles.tankOption
                              : cc.role === "Healer"
                              ? styles.healerOption
                              : styles.dpsOption
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceCharacter(gi, c._id, cc);
                            setOpenReplace(null);
                          }}
                        >
                          {cc.name}
                        </div>
                      ))}
                  </div>
                )}

                <div className={styles.abilityGroup}>
                  {["一号位", "二号位", "三号位"].map((_, ai) => {
                    const dropdownId = `${c._id}-${ai}`;
                    const current = c.abilities?.[ai] || "";
                    const currentColor = abilityColorMap[current] || "#ccc";
                    const refIndex = gi * 100 + ci * 10 + ai;

                    if (!editing) {
                      return (
                        <div key={ai} className={styles.abilitySlot}>
                          {current ? (
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
                              <span>{current}</span>
                            </div>
                          ) : (
                            <div className={styles.emptyAbility}>—</div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={ai} className={styles.abilitySlot} ref={(el) => (slotRefs.current[refIndex] = el)}>
                        <div
                          className={`${styles.customDropdown} ${
                            openDropdown === dropdownId ? styles.open : ""
                          }`}
                          style={{
                            borderLeft: `5px solid ${current ? currentColor : "#ccc"}`,
                            backgroundColor: current ? currentColor + "25" : undefined,
                          }}
                          onClick={() => {
                            const willOpen = openDropdown !== dropdownId;
                            setOpenDropdown(willOpen ? dropdownId : null);
                            setElevatedGroup(willOpen ? gi : null);
                          }}
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
                              <span>{current}</span>
                            </div>
                          ) : (
                            <span className={styles.placeholder}>（选择技能）</span>
                          )}
                          {openDropdown === dropdownId && (
                            <div className={styles.abilityDropdownGrid}>
                              {abilities.map((a) => (
                                <div
                                  key={a}
                                  className={styles.abilityOptionCard}
                                  style={
                                    {
                                      "--ability-bg": abilityColorMap[a] + "33",
                                      "--ability-hover": abilityColorMap[a] + "55",
                                      "--ability-color": abilityColorMap[a],
                                    } as React.CSSProperties
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAbilityChange(gi, c._id, ai, a);
                                  }}
                                >
                                  <Image
                                    src={`/icons/${a}.png`}
                                    alt={a}
                                    width={24}
                                    height={24}
                                    className={styles.abilityIconLarge}
                                  />
                                  <span>{a}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {editing && (
                  <button onClick={() => handleRemoveCharacter(gi, c._id)} className={styles.smallBtn}>
                    ×
                  </button>
                )}
              </div>
            ))}

            {editing && g.characters.length < 3 && (
              <select
                key={`add-${gi}-${g.characters.length}-${Date.now()}`}
                className={styles.addCharacterSelect}
                value=""
                onChange={(e) => {
                  const char = allCharacters.find((c) => c._id === e.target.value);
                  if (char) {
                    handleAddCharacter(gi, char);
                    setLocalGroups((prev) => [...prev]);
                  }
                }}
              >
                <option value="">➕ 添加角色</option>
                {allCharacters
                  .sort((a, b) => {
                    const order = { DPS: 1, Tank: 2, Healer: 3 };
                    return (order[a.role] || 4) - (order[b.role] || 4);
                  })
                  .map((c) => (
                    <option
                      key={c._id}
                      value={c._id}
                      className={
                        c.role === "Tank"
                          ? styles.tankOption
                          : c.role === "Healer"
                          ? styles.healerOption
                          : styles.dpsOption
                      }
                    >
                      {c.name}
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
  );
}
