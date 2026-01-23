"use client";

import Image from "next/image";
import styles from "./styles.module.css";
import Dropdown from "@/app/components/layout/dropdown";
import {
  useAbilityAnalyze,
  CooldownFilter,
  BreakColorFilter,
} from "./useAbilityAnalyze";

/* ===============================
   UI Helpers
=============================== */
function getSkillIcon(name: string) {
  return `/icons/${name}.png`;
}

export default function AbilityAnalyzePage() {
  const {
    filtered,
    level,
    query,
    usageFilter,
    damageFilter,
    cooldownFilter,
    breakColorFilter,

    setLevel,
    setQuery,
    setUsageFilter,
    setDamageFilter,
    setCooldownFilter,
    setBreakColorFilter,
  } = useAbilityAnalyze();

  const resetFilters = () => {
    setLevel(10);
    setUsageFilter("ALL");
    setDamageFilter("ALL");
    setCooldownFilter("ALL");
    setBreakColorFilter("ALL");
    setQuery("");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>技能解析</h1>

      <input
        className={styles.search}
        placeholder="搜索技能名 / 拼音 / 首字母"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.controls}>
        {/* Level */}
        <Dropdown
          label="重数"
          value={`${level} 重`}
          options={["8 重", "9 重", "10 重"]}
          onChange={(v) => setLevel(Number(v.replace(" 重", "")))}
        />

        {/* Usage */}
        <Dropdown
          label="消耗类型"
          value={usageFilter === "ALL" ? "全部消耗" : usageFilter}
          options={["全部消耗", "消耗精神", "消耗耐力"]}
          onChange={(v) =>
            setUsageFilter(v === "全部消耗" ? "ALL" : v)
          }
        />

        {/* Damage */}
        <Dropdown
          label="打击类型"
          value={damageFilter === "ALL" ? "全部打击" : damageFilter}
          options={["全部打击", "耐力打击", "精神打击"]}
          onChange={(v) =>
            setDamageFilter(v === "全部打击" ? "ALL" : v)
          }
        />

        {/* Cooldown */}
        <Dropdown
          label="冷却时间"
          value={cooldownFilter === "ALL" ? "全部CD" : cooldownFilter}
          options={["全部CD", "10秒", "30秒", "1分钟"]}
          onChange={(v) =>
            setCooldownFilter(
              v === "全部CD" ? "ALL" : (v as CooldownFilter)
            )
          }
        />

        {/* Break Color */}
        <Dropdown
          label="破绽颜色"
          value={breakColorFilter === "ALL" ? "全部颜色" : breakColorFilter}
          options={["全部颜色", "蓝", "红", "黄", "紫", "绿", "黑", "无颜色"]}
          onChange={(v) =>
            setBreakColorFilter(
              v === "全部颜色" ? "ALL" : (v as BreakColorFilter)
            )
          }
        />

        {/* Reset */}
        <button className={styles.filterBtn} onClick={resetFilters}>
          重置筛选
        </button>
      </div>

      <div className={styles.list}>
        {filtered.map((s) => (
          <div key={s.name} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrap}>
                <Image
                  src={getSkillIcon(s.name)}
                  alt={s.name}
                  width={36}
                  height={36}
                  className={styles.icon}
                  unoptimized
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/icons/no_drop.svg";
                  }}
                />
              </div>

              <span className={styles.skillName}>{s.name}</span>

              {s.cooldownTag && (
                <span className={styles.cooldownTag}>{s.cooldownTag}</span>
              )}

              <span
                className={`${styles.breakTag} ${
                  styles[`break_${s.breakColorTag}`]
                }`}
              >
                {s.breakColorTag}
              </span>

              {s.resourceTags.map((t) => (
                <span
                  key={t}
                  className={`${styles.tag} ${
                    t === "消耗精神"
                      ? styles.useSpirit
                      : styles.useStamina
                  }`}
                >
                  {t}
                </span>
              ))}

              {s.damageTags.map((t) => (
                <span
                  key={t}
                  className={`${styles.tag} ${
                    t === "耐力打击"
                      ? styles.hitStamina
                      : styles.hitSpirit
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>

            <div
              className={styles.desc}
              dangerouslySetInnerHTML={{
                __html: s.baseHtml.replace(/\n/g, "<br />"),
              }}
            />

            {s.specialBlocks.length > 0 && (
              <>
                <div className={styles.divider} />
                <div className={styles.specialTitle}>特殊条件效果</div>
                <ul className={styles.specialList}>
                  {s.specialBlocks.map((line, i) => (
                    <li
                      key={i}
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
