"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import styles from "./styles.module.css";
import bossData from "@/app/data/boss_drop.json";

interface Props {
  API_URL: string;
  characterId: string;
  onClose: () => void;
  onAdded: () => void;
}

const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
  "火焰之种",
  "阴雷之种",
  "飞云回转刀",
  "三个铜钱",
  "乾坤一掷",
  "尸鬼封烬",
  "厄毒爆发",
];

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

// ✅ Lazy-load pinyin module
let pinyinModule: any;
async function getPinyin() {
  if (!pinyinModule) {
    const mod = await import("pinyin");
    pinyinModule = mod.default || mod;
  }
  return pinyinModule;
}

const ALL_ABILITIES: string[] = Array.from(
  new Set(Object.values(bossData).flat() as string[])
);

export default function AddBackpackModal({
  API_URL,
  characterId,
  onClose,
  onAdded,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [level, setLevel] = useState<9 | 10>(10);
  const [loading, setLoading] = useState(false);
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  // ✅ Build pinyin map lazily after mount
  useEffect(() => {
    async function buildMap() {
      const pinyin = await getPinyin();
      const map: Record<string, { full: string; short: string }> = {};
      for (const ability of ALL_ABILITIES) {
        const pyArr = pinyin(ability, { style: pinyin.STYLE_NORMAL }).flat();
        const full = pyArr.join("");
        const short = pyArr.map((p) => p[0]).join("");
        map[ability] = { full, short };
      }
      setPinyinMap(map);
    }
    buildMap();
  }, []);

  // ✅ Filter list with memoized pinyin map
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ALL_ABILITIES;
    return ALL_ABILITIES.filter((name) => {
      const py = pinyinMap[name];
      return (
        name.includes(term) ||
        py?.full?.includes(term) ||
        py?.short?.includes(term)
      );
    });
  }, [search, pinyinMap]);

  // ✅ Auto close after success
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
      onAdded();
      onClose();
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

        {/* === Quick Access (core skills) === */}
        <div className={styles.quickAccess}>
          {CORE_ABILITIES.map((a) => (
            <div
              key={a}
              className={`${styles.quickIconWrapper} ${
                selected === a ? styles.selected : ""
              }`}
              title={a}
              onClick={() => setSelected(a)}
            >
              <img
                src={getAbilityIcon(a)}
                alt={a}
                className={styles.quickIcon}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ))}
        </div>

        {/* === Search === */}
        <input
          type="text"
          placeholder="搜索技能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        {/* === Skill List === */}
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
