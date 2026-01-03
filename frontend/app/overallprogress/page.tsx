"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";

// ✅ import 紫书列表
import tradableAbilities from "@/app/data/tradable_abilities.json";

interface Character {
  _id: string;
  name: string;
  role?: "Tank" | "DPS" | "Healer";
  active?: boolean;
  abilities?: Record<string, number>;
}

interface AbilityProgress {
  ability: string;
  total: number;
  reached: number;
  missing: Character[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const CORE_ABILITIES = new Set([
  "斗转金移",
  "引燃",
  "黑煞落贪狼",
  "一闪天诛",
  "花钱消灾",
  "漾剑式",
  "兔死狐悲",
]);

// ===============================
// 紫书 + 防御技（来自项目 grep 结果）
// ===============================
const DEFENSIVE_ABILITIES = new Set([
  "夜叉浮乐",
  "海龙御劲",
  "麒麟遁甲",
  "一瞬柄撞",
  "铁猬",
  "俯阵熊突",
  "逆波式",
]);

const TRADABLE_SET = new Set(tradableAbilities as string[]);

// ✅ 合并排除集合
const EXCLUDED_ABILITIES = new Set<string>([
  ...TRADABLE_SET,
  ...DEFENSIVE_ABILITIES,
]);

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

function getProgressClass(percent: number) {
  if (percent === 100) return styles.green;
  if (percent < 30) return styles.red;
  if (percent < 80) return styles.yellow;
  if (percent < 99) return styles.blue;
  return styles.blue;
}

function getRoleClass(role?: string) {
  if (role === "Tank") return styles.tank;
  if (role === "Healer") return styles.healer;
  return styles.dps;
}

export default function OverallProgressPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  // defaults
  const [tierTab, setTierTab] = useState<9 | 10>(10);
  const [catalogTab, setCatalogTab] = useState<"all" | "core">("core");
  const [onlyActive, setOnlyActive] = useState(true);

  // ✅ 不显示紫书和防御技（默认 ON）
  const [hideExcluded, setHideExcluded] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/api/characters`);
        const data = await res.json();
        setCharacters(data || []);
      } catch (err) {
        console.error("Failed to load character data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredCharacters = useMemo(() => {
    if (!onlyActive) return characters;
    return characters.filter((c) => c.active);
  }, [characters, onlyActive]);

  const abilityStats = useMemo<AbilityProgress[]>(() => {
    const map: Record<string, AbilityProgress> = {};
    const total = filteredCharacters.length;

    // 第一轮：建立能力列表
    for (const char of filteredCharacters) {
      if (!char.abilities) continue;

      for (const ability of Object.keys(char.abilities)) {
        // 核心过滤
        if (catalogTab === "core" && !CORE_ABILITIES.has(ability)) continue;

        // 紫书 + 防御技过滤
        if (hideExcluded && EXCLUDED_ABILITIES.has(ability)) continue;

        if (!map[ability]) {
          map[ability] = {
            ability,
            total,
            reached: 0,
            missing: [],
          };
        }
      }
    }

    // 第二轮：统计 reached / missing
    for (const ability of Object.keys(map)) {
      for (const char of filteredCharacters) {
        const level = char.abilities?.[ability] ?? 0;
        if (level >= tierTab) {
          map[ability].reached += 1;
        } else {
          map[ability].missing.push(char);
        }
      }
    }

    return Object.values(map)
      .filter((a) => a.reached > 0)
      .sort((a, b) => b.reached - a.reached);
  }, [filteredCharacters, tierTab, catalogTab, hideExcluded]);

  if (loading) {
    return <div className={styles.loading}>加载中…</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>技能整体进度</h1>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tierTab === 9 ? styles.activeTab : ""}`}
            onClick={() => setTierTab(9)}
          >
            9阶
          </button>
          <button
            className={`${styles.tab} ${tierTab === 10 ? styles.activeTab : ""}`}
            onClick={() => setTierTab(10)}
          >
            10阶
          </button>
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", gap: "14px" }}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            <span className={styles.slider} />
            <span className={styles.toggleLabel}>仅看已激活角色</span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={hideExcluded}
              onChange={(e) => setHideExcluded(e.target.checked)}
            />
            <span className={styles.slider} />
            <span className={styles.toggleLabel}>
              不显示紫书和防御技
            </span>
          </label>
        </div>
      </div>

      {/* Catalog */}
      <div className={styles.catalogTabs}>
        <button
          className={`${styles.catalogTab} ${
            catalogTab === "all" ? styles.activeCatalogTab : ""
          }`}
          onClick={() => setCatalogTab("all")}
        >
          全部
        </button>
        <button
          className={`${styles.catalogTab} ${
            catalogTab === "core" ? styles.activeCatalogTab : ""
          }`}
          onClick={() => setCatalogTab("core")}
        >
          核心
        </button>
      </div>

      {/* List */}
      <div className={styles.list}>
        {abilityStats.map((item) => {
          const percent =
            item.total === 0
              ? 0
              : Math.round((item.reached / item.total) * 100);

          const showMissing = percent > 80 && item.missing.length > 0;

          return (
            <div key={item.ability} className={styles.card}>
              <div className={styles.header}>
                <div className={styles.abilityInfo}>
                  <img
                    src={getAbilityIcon(item.ability)}
                    className={styles.icon}
                    alt={item.ability}
                  />
                  <span className={styles.ability}>{item.ability}</span>
                </div>
                <span className={styles.count}>
                  {item.reached}/{item.total}
                </span>
              </div>

              <div className={styles.row}>
                <div className={styles.bar}>
                  <div
                    className={`${styles.fill} ${getProgressClass(percent)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className={styles.percent}>{percent}%</span>
              </div>

              {showMissing && (
                <div className={styles.missingRow}>
                  <span className={styles.missingLabel}>缺失：</span>
                  <div className={styles.pillsRow}>
                    {item.missing.map((c) => (
                      <span
                        key={c._id}
                        className={`${styles.pill} ${getRoleClass(c.role)}`}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
