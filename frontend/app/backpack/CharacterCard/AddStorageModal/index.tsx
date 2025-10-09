"use client";

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import styles from "./styles.module.css";
import pinyin from "pinyin";
import bossData from "@/app/data/boss_drop.json";

interface Props {
  API_URL: string;
  characterId: string;
  onClose: () => void;
  onAdded: () => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

// ✅ Flatten all boss abilities into one list
const ALL_ABILITIES: string[] = Array.from(
  new Set(Object.values(bossData).flat() as string[])
);

// ✅ Build a lookup table with pinyin and initials
const PINYIN_MAP: Record<string, { full: string; short: string }> = {};
for (const ability of ALL_ABILITIES) {
  const pyArr = pinyin(ability, { style: pinyin.STYLE_NORMAL }).flat();
  const full = pyArr.join("");
  const short = pyArr.map((p) => p[0]).join("");
  PINYIN_MAP[ability] = { full, short };
}

export default function AddStorageModal({
  API_URL,
  characterId,
  onClose,
  onAdded,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [level, setLevel] = useState<9 | 10>(9);
  const [loading, setLoading] = useState(false);

  // ✅ Smart search: Chinese / full pinyin / initials
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ALL_ABILITIES;

    return ALL_ABILITIES.filter((name) => {
      const py = PINYIN_MAP[name];
      return (
        name.includes(term) ||
        py.full.includes(term) ||
        py.short.includes(term)
      );
    });
  }, [search]);

  const handleConfirm = async () => {
    if (!selected) return alert("请选择技能");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/characters/${characterId}/storage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: selected, level }),
        }
      );
      if (!res.ok) throw new Error("添加失败");
      alert(`✅ 已添加 ${selected}${level}重`);
      onAdded();
    } catch (e) {
      alert("❌ 添加失败");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>添加技能到背包</h3>

        <input
          type="text"
          placeholder="搜索技能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        <div className={styles.list}>
          {filtered.map((a) => (
            <div
              key={a}
              className={`${styles.item} ${
                selected === a ? styles.selected : ""
              }`}
              onClick={() => setSelected(a)}
            >
              <div className={styles.left}>
                <div className={styles.iconWrapper}>
                  <img
                    src={getAbilityIcon(a)}
                    alt={a}
                    className={styles.icon}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
                <span className={styles.name}>{a}</span>
              </div>

              {/* ✅ Always visible, clean Add button */}
              <button
                className={styles.addBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(a);
                }}
                title="选择此技能"
              >
                <Plus size={16} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>

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

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancel}>
            取消
          </button>
          <button
            onClick={handleConfirm}
            className={styles.confirm}
            disabled={loading}
          >
            {loading ? "处理中..." : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}
