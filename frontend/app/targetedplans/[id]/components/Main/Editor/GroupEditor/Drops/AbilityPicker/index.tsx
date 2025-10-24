"use client";

import React, { useState, useMemo } from "react";
import pinyin from "pinyin";
import styles from "./styles.module.css";
import type { AbilityCheck } from "@/utils/solver";

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function AbilityPicker({
  checkedAbilities,
  onSelect,
  onClose,
}: {
  checkedAbilities: AbilityCheck[];
  onSelect: (ability: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const allAbilities = useMemo(() => {
    if (!Array.isArray(checkedAbilities)) return [];
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

  return (
    <div className={styles.container}>
      <h3>选择技能</h3>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索技能..."
        className={styles.search}
      />
      <div className={styles.list}>
        {filtered.map((a) => (
          <div
            key={a}
            className={styles.item}
            onClick={() => onSelect(a)}
            title={a}
          >
            <img
              src={getAbilityIcon(a)}
              alt={a}
              className={styles.icon}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span>{a}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} className={styles.closeBtn}>
        关闭
      </button>
    </div>
  );
}
