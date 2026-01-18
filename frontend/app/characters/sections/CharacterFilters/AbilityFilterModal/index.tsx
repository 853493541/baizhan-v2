"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./styles.module.css";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

// ✅ data source
import bossDrop from "@/app/data/boss_drop.json";

interface Props {
  onConfirm: (ability: string) => void;
  onClose: () => void;
}

const INITIAL_LOAD = 10;
const LOAD_STEP = 10;

export default function AbilityFilterModal({ onConfirm, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);

  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  /* ===============================
     📦 Flatten boss → abilities
     =============================== */
  const abilities = useMemo<string[]>(() => {
    const set = new Set<string>();
    Object.values(bossDrop).forEach((list) =>
      list.forEach((a) => set.add(a))
    );
    return Array.from(set).sort();
  }, []);

  /* ===============================
     🈶 Build pinyin map
     =============================== */
  useEffect(() => {
    (async () => {
      const map = await createPinyinMap(abilities);
      setPinyinMap(map);
    })();
  }, [abilities]);

  /* ===============================
     🔍 Filter
     =============================== */
  const filtered =
    search.trim() === ""
      ? abilities
      : pinyinFilter(abilities, pinyinMap, search);

  /* ===============================
     ♻ Reset visible count on search
     =============================== */
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [search]);

  const visibleAbilities = filtered.slice(0, visibleCount);

  const handleSelect = (ability: string) => {
    onConfirm(ability);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== Header ===== */}
        <div className={styles.header}>
          <h3 className={styles.title}>添加筛选技能</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ===== Search ===== */}
        <input
          className={styles.input}
          placeholder="搜索技能"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* ===== List ===== */}
        <div className={styles.list}>
          {visibleAbilities.map((a) => (
            <div
              key={a}
              className={styles.item}
              onClick={() => handleSelect(a)}
            >
              <img
                src={`/icons/${a}.png`}
                alt={a}
                className={styles.icon}
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />

              <span className={styles.name}>{a}</span>

              <button
                className={styles.addBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(a);
                }}
                title="添加"
              >
                +
              </button>
            </div>
          ))}

          {visibleCount < filtered.length && (
            <div className={styles.loadMore}>
              <button
                onClick={() =>
                  setVisibleCount((v) => v + LOAD_STEP)
                }
              >
                加载更多…
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className={styles.noResult}>没有匹配的技能</div>
          )}
        </div>
      </div>
    </div>
  );
}
