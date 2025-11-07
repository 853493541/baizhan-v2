"use client";

import { useState, useEffect } from "react";
import abilities from "@/lib/seedAbilities";
import styles from "./styles.module.css";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

interface Props {
  onConfirm: (ability: string) => void;
  onClose: () => void;
}

export default function AbilityFilterModal({ onConfirm, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  /* ===============================
     🈶 Build Pinyin Map once
     =============================== */
  useEffect(() => {
    (async () => {
      const map = await createPinyinMap(abilities);
      setPinyinMap(map);
    })();
  }, []);

  /* ===============================
     🔍 Filter abilities by Hanzi or Pinyin
     =============================== */
  const filtered =
    search.trim() === ""
      ? abilities
      : pinyinFilter(abilities, pinyinMap, search);

  const handleSelect = (ability: string) => {
    setSelected(ability);
    onConfirm(ability);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>选择技能</h3>

        <input
          type="text"
          placeholder="搜索技能（支持拼音）..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />

        <div className={styles.list}>
          {filtered.map((a) => (
            <div
              key={a}
              className={`${styles.item} ${
                selected === a ? styles.active : ""
              }`}
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
              <span>{a}</span>
              {selected === a && <span className={styles.checkmark}>✔</span>}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className={styles.noResult}>没有匹配的技能</div>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancel}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
