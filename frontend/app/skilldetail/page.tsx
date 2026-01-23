"use client";

import Image from "next/image";
import styles from "./styles.module.css";
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
        <div className={styles.levelGroup}>
          {[8, 9, 10].map((lv) => (
            <button
              key={lv}
              className={`${styles.levelBtn} ${
                level === lv ? styles.active : ""
              }`}
              onClick={() => setLevel(lv)}
            >
              {lv} 重
            </button>
          ))}
        </div>

        {/* Usage */}
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${
              usageFilter === "ALL" ? styles.filterActive : ""
            }`}
            onClick={() => setUsageFilter("ALL")}
          >
            全部消耗
          </button>
          <button
            className={`${styles.filterBtn} ${styles.useSpirit} ${
              usageFilter === "消耗精神" ? styles.filterActive : ""
            }`}
            onClick={() => setUsageFilter("消耗精神")}
          >
            消耗精神
          </button>
          <button
            className={`${styles.filterBtn} ${styles.useStamina} ${
              usageFilter === "消耗耐力" ? styles.filterActive : ""
            }`}
            onClick={() => setUsageFilter("消耗耐力")}
          >
            消耗耐力
          </button>
        </div>

        {/* Damage */}
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${
              damageFilter === "ALL" ? styles.filterActive : ""
            }`}
            onClick={() => setDamageFilter("ALL")}
          >
            全部打击
          </button>
          <button
            className={`${styles.filterBtn} ${styles.hitStamina} ${
              damageFilter === "耐力打击" ? styles.filterActive : ""
            }`}
            onClick={() => setDamageFilter("耐力打击")}
          >
            耐力打击
          </button>
          <button
            className={`${styles.filterBtn} ${styles.hitSpirit} ${
              damageFilter === "精神打击" ? styles.filterActive : ""
            }`}
            onClick={() => setDamageFilter("精神打击")}
          >
            精神打击
          </button>
        </div>

        {/* Cooldown */}
        <div className={styles.filterGroup}>
          {(["ALL", "10秒", "30秒", "1分钟"] as CooldownFilter[]).map(
            (cd) => (
              <button
                key={cd}
                className={`${styles.filterBtn} ${
                  cooldownFilter === cd ? styles.filterActive : ""
                }`}
                onClick={() => setCooldownFilter(cd)}
              >
                {cd === "ALL" ? "全部CD" : cd}
              </button>
            )
          )}
        </div>

        {/* Break Color */}
        <div className={styles.filterGroup}>
          {(
            ["ALL", "蓝", "红", "黄", "紫", "绿", "黑", "无颜色"] as BreakColorFilter[]
          ).map((c) => (
            <button
              key={c}
              className={`${styles.filterBtn} ${
                breakColorFilter === c ? styles.filterActive : ""
              }`}
              onClick={() => setBreakColorFilter(c)}
            >
              {c === "ALL" ? "全部破招" : c}
            </button>
          ))}
        </div>
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

            {/* baseHtml already contains ONLY the <span class="num"> from parseSkill */}
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
