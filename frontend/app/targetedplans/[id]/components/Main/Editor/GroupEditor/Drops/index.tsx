"use client";

import React, { useState, useMemo } from "react";
import pinyin from "pinyin";
import Image from "next/image";
import styles from "./styles.module.css";
import type { AbilityCheck, Character, GroupResult } from "@/utils/solver";

interface Props {
  API_URL: string;
  planId: string;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  onClose: () => void;
  onSaved: () => void;
  allCharacters: Character[];
}

export default function GroupDrops({
  API_URL,
  planId,
  group,
  checkedAbilities,
  onClose,
  onSaved,
  allCharacters,
}: Props) {
  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<9 | 10 | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /* ===============================================================
     🧩 Build filtered ability list
  =============================================================== */
  const allAbilities = useMemo(() => {
    const names = checkedAbilities.map((a) => a.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [checkedAbilities]);

  const pinyinMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of allAbilities) {
      const py = pinyin(a, { style: pinyin.STYLE_NORMAL }).flat().join("");
      map[a] = py;
    }
    return map;
  }, [allAbilities]);

  const filtered = allAbilities.filter(
    (a) =>
      a.includes(search) ||
      pinyinMap[a]?.includes(search.toLowerCase()) ||
      pinyinMap[a]?.startsWith(search.toLowerCase())
  );

  /* ===============================================================
     💾 Record drop
  =============================================================== */
  const recordDrop = async (char: Character, ability: string, level: 9 | 10) => {
    const groupIndex = Number(group.index ?? 0);
    const endpoint = `${API_URL}/api/targeted-plans/${planId}/groups/${groupIndex}/drops`;
    const payload = { characterId: char._id, ability, level };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(String(res.status));
      return true;
    } catch (err) {
      console.warn("⚠️ 记录掉落失败（继续执行）:", err);
      return false;
    }
  };

  /* ===============================================================
     💾 Actions
  =============================================================== */
  const saveToBackpack = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedLevel) return;
    setLoading(true);
    try {
      await recordDrop(selectedCharacter, selectedAbility, selectedLevel);
      const res = await fetch(
        `${API_URL}/api/characters/${selectedCharacter._id}/storage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ability: selectedAbility,
            level: selectedLevel,
          }),
        }
      );
      if (!res.ok) throw new Error("添加失败");
      alert("✅ 已保存到背包，并已记录掉落！");
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ 保存失败:", err);
      alert("❌ 保存失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const useImmediately = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedLevel) return;
    setLoading(true);
    try {
      // 1) 正常流程：先按所选层级使用（例如 9 重）
      const useLevel = selectedLevel;

      await recordDrop(selectedCharacter, selectedAbility, useLevel);

      const res = await fetch(
        `${API_URL}/api/characters/${selectedCharacter._id}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ability: selectedAbility,
            level: useLevel,
          }),
        }
      );

      if (!res.ok) {
        // 对于掉落“立即使用”的后备方案（仅针对当前掉落）
        const fallback = await fetch(
          `${API_URL}/api/targeted-plans/${planId}/use-drop`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              characterId: selectedCharacter._id,
              ability: selectedAbility,
              level: useLevel,
            }),
          }
        );
        if (!fallback.ok) throw new Error("使用失败");
      }

      // 2) 成功后：如果这次是使用 9 重，且背包里还有未使用的 10 重，则提示是否“顺便再用 10 重”
      let alsoUsedLv10 = false;
      if (useLevel === 9) {
        const fullChar = allCharacters.find((fc) => fc._id === selectedCharacter._id);
        const hasLv10 = fullChar?.storage?.some(
          (s) =>
            s.ability === selectedAbility &&
            s.level === 10 &&
            s.used === false
        );
        if (hasLv10) {
          const confirmLv10 = confirm(
            `已成功使用 ${selectedAbility}（9重）。\n检测到背包中还有 10 重书籍，是否现在顺便使用 10 重？`
          );
          if (confirmLv10) {
            const res10 = await fetch(
              `${API_URL}/api/characters/${selectedCharacter._id}/storage/use`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ability: selectedAbility,
                  level: 10,
                }),
              }
            );
            if (!res10.ok) {
              throw new Error("10重使用失败");
            }
            alsoUsedLv10 = true;
          }
        }
      }

      alert(
        alsoUsedLv10
          ? `✅ ${selectedCharacter.name} 已成功使用 ${selectedAbility}（9重），并额外使用 10 重！`
          : `✅ ${selectedCharacter.name} 已成功使用 ${selectedAbility}（${useLevel}重），并已记录掉落！`
      );
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ 使用失败:", err);
      alert("❌ 使用失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================================================
     🧩 Check if all members already have this ability (learned level only)
  =============================================================== */
  const allHave = useMemo(() => {
    if (!selectedAbility || !selectedLevel) return false;
    return group.characters.every((c) => {
      const learned = c.abilities?.[selectedAbility] ?? 0;
      return learned >= selectedLevel;
    });
  }, [selectedAbility, selectedLevel, group.characters]);

  /* ===============================================================
     🟩 全有 Button Handler
  =============================================================== */
  const handleAllHave = () => {
    onClose();
  };

  /* ===============================================================
     🖼️ Render
  =============================================================== */
  return (
    <div className={styles.overlay}>
      <div className={styles.horizontalModal}>
        <header className={styles.header}>
          <h3>🎯 掉落分配</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            关闭
          </button>
        </header>

        <div className={styles.columns}>
          {/* --- 1️⃣ Ability Picker --- */}
          <div className={styles.column}>
            <h4>技能</h4>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索技能..."
              className={styles.search}
            />
            <div className={styles.scrollBox}>
              {filtered.map((a) => (
                <div
                  key={a}
                  className={`${styles.abilityItem} ${
                    selectedAbility === a ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedAbility(a)}
                  title={a}
                >
                  <Image
                    src={`/icons/${a}.png`}
                    alt={a}
                    width={22}
                    height={22}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                  <span>{a.slice(0, 2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* --- 2️⃣ Level Picker --- */}
          <div className={styles.column}>
            <h4>层级</h4>
            <div className={styles.levelCol}>
              {[9, 10].map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l as 9 | 10)}
                  className={`${styles.levelBtn} ${
                    selectedLevel === l ? styles.selected : ""
                  }`}
                >
                  {l}重
                </button>
              ))}
            </div>
          </div>

          {/* --- 3️⃣ Character Picker --- */}
          <div className={styles.column}>
            <h4>角色</h4>
            <div className={styles.scrollBox}>
              {group.characters.map((c) => {
                const fullChar = allCharacters.find((fc) => fc._id === c._id);
                const storage = Array.isArray(fullChar?.storage)
                  ? fullChar!.storage
                  : [];
                const learnedLevel = c.abilities?.[selectedAbility] ?? 0;
                const hasBookLv10 = storage.some(
                  (item) =>
                    item?.ability === selectedAbility &&
                    Number(item?.level) === 10 &&
                    item?.used === false
                );

                const disabled =
                  selectedLevel ? learnedLevel >= selectedLevel : false;

                return (
                  <button
                    key={c._id}
                    disabled={disabled}
                    className={`${styles.memberBtn} ${
                      selectedCharacter?._id === c._id ? styles.selected : ""
                    } ${disabled ? styles.disabled : ""}`}
                    onClick={() => setSelectedCharacter(c)}
                  >
                    <span className={styles.name}>{c.name}</span>
                    <span className={styles.level}>
                      {learnedLevel > 0
                        ? `当前：${learnedLevel}重`
                        : "未习得"}
                      {hasBookLv10 && (
                        <span className={styles.hasLv10}>（背包有10重书）</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 🟩 全有 Button */}
            {allHave && (
              <button
                onClick={handleAllHave}
                disabled={loading}
                className={styles.allHaveBtn}
              >
                ✅ 全员已具备该技能
              </button>
            )}
          </div>

          {/* --- 4️⃣ Actions --- */}
          <div className={styles.column}>
            <h4>操作</h4>
            <div className={styles.actionCol}>
              <button
                onClick={useImmediately}
                disabled={
                  !selectedCharacter ||
                  !selectedAbility ||
                  !selectedLevel ||
                  loading
                }
                className={styles.useBtn}
              >
                立即使用
              </button>
              <button
                onClick={saveToBackpack}
                disabled={
                  !selectedCharacter ||
                  !selectedAbility ||
                  !selectedLevel ||
                  loading
                }
                className={styles.saveBtn}
              >
                保存到背包
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
