"use client";

import { useEffect, useMemo, useState } from "react";
import skillData from "@/app/data/skill_data.json";
import {
  parseSkill,
  ResourceTag,
  DamageTag,
} from "./parselogic";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

/* ===============================
   Types
=============================== */
export type UsageFilter = "ALL" | ResourceTag;
export type DamageFilter = "ALL" | DamageTag;
export type CooldownFilter = "ALL" | "10秒" | "30秒" | "1分钟";
export type BreakColorFilter =
  | "ALL"
  | "蓝"
  | "红"
  | "黄"
  | "紫"
  | "绿"
  | "黑"
  | "无颜色";

/* ===============================
   Helpers (logic-only)
=============================== */
function normalizeCooldown(cd?: string): "10秒" | "30秒" | "1分钟" | null {
  if (!cd) return null;
  if (cd.includes("10")) return "10秒";
  if (cd.includes("30")) return "30秒";
  if (cd.includes("60") || cd.includes("1分钟")) return "1分钟";
  return null;
}

function normalizeBreakColor(
  c?: string
): "蓝" | "红" | "黄" | "紫" | "绿" | "黑" | "无颜色" {
  if (!c) return "无颜色";
  if (c.includes("蓝")) return "蓝";
  if (c.includes("红")) return "红";
  if (c.includes("黄")) return "黄";
  if (c.includes("紫")) return "紫";
  if (c.includes("绿")) return "绿";
  if (c.includes("黑")) return "黑";
  return "无颜色";
}

/* ===============================
   Hook
=============================== */
export function useAbilityAnalyze() {
  const [level, setLevel] = useState<number>(10);
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

  /* ---------- Parse ---------- */
  const parsed = useMemo(() => {
    return skillData.map((s: any) => ({
      ...parseSkill(s, level),
      cooldownTag: normalizeCooldown(s.cooldown),
      breakColorTag: normalizeBreakColor(s.breakColor),
    }));
  }, [level]);

  /* ---------- Pinyin ---------- */
  useEffect(() => {
    const names = parsed.map((s) => s.name);
    createPinyinMap(names).then(setPinyinMap);
  }, [parsed]);

  /* ---------- Filter ---------- */
  const filtered = useMemo(() => {
    let list = parsed;

    if (query.trim()) {
      const matchedNames = pinyinFilter(
        list.map((s) => s.name),
        pinyinMap,
        query
      );
      list = list.filter((s) => matchedNames.includes(s.name));
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

  return {
    /* data */
    filtered,
    level,
    query,

    /* filters */
    usageFilter,
    damageFilter,
    cooldownFilter,
    breakColorFilter,

    /* setters */
    setLevel,
    setQuery,
    setUsageFilter,
    setDamageFilter,
    setCooldownFilter,
    setBreakColorFilter,
  };
}
