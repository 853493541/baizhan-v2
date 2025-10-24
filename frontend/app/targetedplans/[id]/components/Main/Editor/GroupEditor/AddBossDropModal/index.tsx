"use client";

import React, { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import styles from "./styles.module.css";
import pinyin from "pinyin";
import type { Character, AbilityCheck } from "@/utils/solver";

interface Props {
  API_URL: string;
  planId: string;
  groupCharacters: Character[]; // ✅ up to 3 characters
  checkedAbilities?: AbilityCheck[];
  onClose: () => void;
  onAdded: () => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function AddBossDropModal({
  API_URL,
  planId,
  groupCharacters,
  checkedAbilities,
  onClose,
  onAdded,
}: Props) {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAbility, setSelectedAbility] = useState("");
  const [level, setLevel] = useState<9 | 10>(10);
  const [loading, setLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  /* --------------------------------------------------------------
     🔍 Build ability list dynamically from checkedAbilities
  -------------------------------------------------------------- */
  const ALL_ABILITIES = useMemo(() => {
    if (!Array.isArray(checkedAbilities) || checkedAbilities.length === 0)
      return [];
    const names = checkedAbilities.filter((a) => a?.name).map((a) => a.name);
    return Array.from(new Set(names));
  }, [checkedAbilities]);

  /* --------------------------------------------------------------
     🔤 Build Pinyin map for search
  -------------------------------------------------------------- */
  const PINYIN_MAP = useMemo(() => {
    const map: Record<string, { full: string; short: string }> = {};
    for (const ability of ALL_ABILITIES) {
      const pyArr = pinyin(ability, { style: pinyin.STYLE_NORMAL }).flat();
      const full = pyArr.join("");
      const short = pyArr.map((p) => p[0]).join("");
      map[ability] = { full, short };
    }
    return map;
  }, [ALL_ABILITIES]);

  /* --------------------------------------------------------------
     🔍 Search filtering
  -------------------------------------------------------------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ALL_ABILITIES;
    return ALL_ABILITIES.filter((name) => {
      const py = PINYIN_MAP[name];
      return (
        name.includes(term) ||
        py?.full?.includes(term) ||
        py?.short?.includes(term)
      );
    });
  }, [search, ALL_ABILITIES, PINYIN_MAP]);

  /* --------------------------------------------------------------
     💾 Save to backpack
  -------------------------------------------------------------- */
  const saveToBackpack = async () => {
    if (!selectedAbility || !selectedChar) return alert("请选择技能和角色");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/characters/${selectedChar._id}/storage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: selectedAbility, level }),
        }
      );
      if (!res.ok) throw new Error("添加失败");
      alert("✅ 已保存到背包！");
      onAdded();
      onClose();
    } catch (err) {
      console.error("❌ 保存失败:", err);
      alert("❌ 保存失败");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------
     ⚔️ Use immediately
  -------------------------------------------------------------- */
  const useImmediately = async () => {
    if (!selectedAbility || !selectedChar) return alert("请选择技能和角色");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/characters/${selectedChar._id}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: selectedAbility, level }),
        }
      );

      if (!res.ok) {
        const fallback = await fetch(
          `${API_URL}/api/targetedplans/${planId}/use-drop`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              characterId: selectedChar._id,
              ability: selectedAbility,
              level,
            }),
          }
        );
        if (!fallback.ok) throw new Error("使用失败");
      }

      alert(`✅ ${selectedChar.name} 已成功使用 ${selectedAbility}！`);
      onAdded();
      onClose();
    } catch (err) {
      console.error("❌ 使用失败:", err);
      alert("❌ 使用失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------
     🧩 Step 1 — Character selection
  -------------------------------------------------------------- */
  if (!selectedChar) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h3>请选择角色</h3>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.characterSelect}>
            {groupCharacters.map((char) => (
              <button
                key={char._id}
                className={styles.characterCard}
                onClick={() => setSelectedChar(char)}
              >
                <div className={styles.characterName}>{char.name}</div>
                <div className={styles.characterRole}>{char.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------
     🧩 Step 2 — Ability selection
  -------------------------------------------------------------- */
  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${
          showConfirmPopup ? styles.blurred : ""
        }`}
      >
        <div className={styles.header}>
          <h3>为 {selectedChar.name} 添加掉落</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* === Search === */}
        <input
          type="text"
          placeholder="搜索技能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        {/* === Ability List === */}
        <div className={styles.list}>
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <div
                key={a}
                className={`${styles.item} ${
                  selectedAbility === a ? styles.selected : ""
                }`}
                onClick={() => setSelectedAbility(a)}
              >
                <div className={styles.left}>
                  <div className={styles.iconWrapper}>
                    <img
                      src={getAbilityIcon(a)}
                      alt={a}
                      className={styles.icon}
                      onError={(e) =>
                        (e.currentTarget.style.display = "none")
                      }
                    />
                  </div>
                  <span className={styles.name}>{a}</span>
                </div>

                <button
                  className={styles.addBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAbility(a);
                  }}
                  title="选择此技能"
                >
                  <Plus size={16} strokeWidth={2.2} />
                </button>
              </div>
            ))
          ) : (
            <div className={styles.emptyMsg}>暂无可用技能</div>
          )}
        </div>

        {/* === Level Select === */}
        <div className={styles.levelRow}>
          {[9, 10].map((l) => (
            <button
              key={l}
              className={`${styles.levelBtn} ${
                level === l ? styles.active : ""
              }`}
              onClick={() => setLevel(l as 9 | 10)}
            >
              {l}重
            </button>
          ))}
        </div>

        {/* === Footer === */}
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancel}>
            取消
          </button>
          <button
            onClick={() =>
              selectedAbility
                ? setShowConfirmPopup(true)
                : alert("请选择技能")
            }
            className={styles.confirm}
            disabled={!selectedAbility}
          >
            下一步
          </button>
        </div>
      </div>

      {/* === Final Confirm Modal === */}
      {showConfirmPopup && (
        <div className={styles.finalOverlay}>
          <div className={styles.finalBox}>
            <button
              className={styles.closeBtn}
              onClick={() => setShowConfirmPopup(false)}
            >
              <X size={18} />
            </button>

            <div className={styles.finalLine}>
              <span className={styles.levelTag}>{level}重 ·</span>
              <img
                src={getAbilityIcon(selectedAbility)}
                alt={selectedAbility}
                className={styles.finalIcon}
              />
              <span className={styles.abilityName}>{selectedAbility}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.characterName}>
                {selectedChar.name}
              </span>
            </div>

            <div className={styles.finalActions}>
              <button
                onClick={useImmediately}
                disabled={loading}
                className={styles.useBtn}
              >
                立即使用
              </button>
              <button
                onClick={saveToBackpack}
                disabled={loading}
                className={styles.saveBtn}
              >
                保存到背包
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
