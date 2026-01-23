"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import skillData from "@/app/data/skill_data.json";
import {
  parseSkill,
  ParsedSkill,
  ResourceTag,
  DamageTag,
} from "./parselogic";
import styles from "./styles.module.css";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

type UsageFilter = "ALL" | ResourceTag;
type DamageFilter = "ALL" | DamageTag;
type CooldownFilter = "ALL" | "10秒" | "30秒" | "1分钟";
type BreakColorFilter =
  | "ALL"
  | "蓝"
  | "红"
  | "黄"
  | "紫"
  | "绿"
  | "黑"
  | "无颜色";

/* ===============================
   Helpers
=============================== */
function getSkillIcon(name: string) {
  return `/icons/${name}.png`;
}

function normalizeCooldown(cd?: string): CooldownFilter {
  if (!cd) return "ALL";
  if (cd.includes("10")) return "10秒";
  if (cd.includes("30")) return "30秒";
  if (cd.includes("60") || cd.includes("1分钟")) return "1分钟";
  return "ALL";
}

function normalizeBreakColor(c?: string): BreakColorFilter {
  if (!c) return "无颜色";
  if (c.includes("蓝")) return "蓝";
  if (c.includes("红")) return "红";
  if (c.includes("黄")) return "黄";
  if (c.includes("紫")) return "紫";
  if (c.includes("绿")) return "绿";
  if (c.includes("黑")) return "黑";
  return "无颜色";
}

export default function AbilityAnalyzePage() {
  const [level, setLevel] = useState(10);
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("ALL");
  const [damageFilter, setDamageFilter] = useState<DamageFilter>("ALL");
  const [cooldownFilter, setCooldownFilter] =
    useState<CooldownFilter>("ALL");
  const [breakColorFilter, setBreakColorFilter] =
    useState<BreakColorFilter>("ALL");

  const [query, setQuery] = useState("");
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  const parsed = useMemo(() => {
    return skillData.map((s: any) => ({
      ...parseSkill(s, level),
      cooldownTag: normalizeCooldown(s.cooldown),
      breakColorTag: normalizeBreakColor(s.breakColor),
    }));
  }, [level]);

  useEffect(() => {
    createPinyinMap(parsed.map((s) => s.name)).then(setPinyinMap);
  }, [parsed]);

  const filtered = useMemo(() => {
    let list = parsed;

    if (query.trim()) {
      const matched = pinyinFilter(
        list.map((s) => s.name),
        pinyinMap,
        query
      );
      list = list.filter((s) => matched.includes(s.name));
    }

    return list.filter((s) => {
      if (usageFilter !== "ALL" && !s.resourceTags.includes(usageFilter))
        return false;
      if (damageFilter !== "ALL" && !s.damageTags.includes(damageFilter))
        return false;
      if (
        cooldownFilter !== "ALL" &&
        s.cooldownTag !== cooldownFilter
      )
        return false;
      if (
        breakColorFilter !== "ALL" &&
        s.breakColorTag !== breakColorFilter
      )
        return false;
      return true;
    });
  }, [
    parsed,
    usageFilter,
    damageFilter,
    cooldownFilter,
    breakColorFilter,
    query,
    pinyinMap,
  ]);

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
        {/* 等级 */}
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

        {/* 消耗 */}
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

        {/* 打击 */}
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

        {/* 冷却 */}
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

        {/* 破招颜色（✅ FIXED） */}
        <div className={styles.filterGroup}>
          {(
            ["ALL", "蓝", "红", "黄", "紫", "绿", "黑", "无颜色"] as BreakColorFilter[]
          ).map((c) => (
            <button
              key={c}
              data-break={c}
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
                />
              </div>

              <span className={styles.skillName}>{s.name}</span>

              {s.cooldownTag !== "ALL" && (
                <span className={styles.cooldownTag}>
                  {s.cooldownTag}
                </span>
              )}

              <span
                className={`${styles.breakTag} ${
                  styles[`break_${s.breakColorTag}`]
                }`}
              >
                {s.breakColorTag}
              </span>
            </div>

            <div
              className={styles.desc}
              dangerouslySetInnerHTML={{
                __html: s.baseHtml.replace(/\n/g, "<br />"),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
