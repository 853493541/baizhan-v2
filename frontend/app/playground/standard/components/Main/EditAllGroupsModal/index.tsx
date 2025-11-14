"use client";

import { useMemo, useState } from "react";
import styles from "./styles.module.css";
import type { Character, GroupResult } from "@/utils/solver";

interface Props {
  groups: GroupResult[];
  allCharacters: Character[];
  onSave: (updatedGroups: GroupResult[]) => void;
  onClose: () => void;
}

const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
]);

export default function EditAllGroupsModal({
  groups,
  allCharacters,
  onSave,
  onClose,
}: Props) {
  const [selectedGroup, setSelectedGroup] = useState(0);

  const initialSelections = useMemo(
    () => groups.map((g) => new Set(g.characters.map((c) => c._id))),
    [groups]
  );

  const [selections, setSelections] = useState<Set<string>[]>(initialSelections);

  const current = selections[selectedGroup];

  // LIVE UPDATE
  const toggleChar = (id: string) => {
    const clones = selections.map((s) => new Set(s));
    const set = clones[selectedGroup];

    if (set.has(id)) set.delete(id);
    else if (set.size < 3) set.add(id);

    setSelections(clones);

    const updated = groups.map((g, i) => {
      const ids = clones[i];
      const chars = allCharacters.filter((c) => ids.has(c._id));
      return { ...g, characters: chars };
    });

    onSave(updated); // live update but modal stays open
  };

  // GROUP BY ACCOUNT
  const { multiAccounts, singleAccounts } = useMemo(() => {
    if (!allCharacters.length)
      return { multiAccounts: [], singleAccounts: [] };

    const accGroups: Record<string, Character[]> = {};

    for (const c of allCharacters) {
      const acc = c.account || "未分配账号";
      if (!accGroups[acc]) accGroups[acc] = [];
      accGroups[acc].push(c);
    }

    const multi: [string, Character[]][] = [];
    const single: [string, Character[]][] = [];

    for (const [acc, list] of Object.entries(accGroups)) {
      const mains = list.filter((c) => MAIN_CHARACTERS.has(c.name));
      const rest = list.filter((c) => !MAIN_CHARACTERS.has(c.name));
      const merged = [...mains, ...rest];

      if (merged.length === 1) single.push([acc, merged]);
      else multi.push([acc, merged]);
    }

    const hasMain = (list: Character[]) =>
      list.some((c) => MAIN_CHARACTERS.has(c.name));

    multi.sort((a, b) => Number(hasMain(b[1])) - Number(hasMain(a[1])));
    single.sort((a, b) => Number(hasMain(b[1])) - Number(hasMain(a[1])));

    return { multiAccounts: multi, singleAccounts: single };
  }, [allCharacters, selections]);

  const renderChar = (c: Character) => {
    const selected = current.has(c._id);
    const isMain = MAIN_CHARACTERS.has(c.name);

    return (
      <div
        key={c._id}
        className={`${styles.characterPill} ${
          selected
            ? c.role === "Tank"
              ? styles.tank
              : c.role === "Healer"
              ? styles.healer
              : styles.dps
            : styles.inactive
        }`}
        onClick={() => toggleChar(c._id)}
      >
        <span className={styles.charName}>
          {isMain && <span className={styles.starMark}>★</span>}
          {c.name}
        </span>
      </div>
    );
  };

  const warn = current.size !== 3;

  return (
    <>
      <div className={styles.portalBackdrop} onClick={onClose} />

      <div
        className={styles.characterModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.headerRow}>
          <h2 className={styles.title}>
            编辑排表角色
            <span className={`${styles.countInline} ${warn ? styles.warn : ""}`}>
              （第 {selectedGroup + 1} 组 — {current.size} 人）
            </span>
          </h2>

          <button className={styles.closeTextBtn} onClick={onClose}>
            关闭
          </button>
        </div>

        {/* GROUP SWITCHER */}
        <div className={styles.serverFilterRow}>
          {groups.map((_, i) => (
            <button
              key={i}
              className={`${styles.serverFilterBtn} ${
                selectedGroup === i ? styles.activeFilter : ""
              }`}
              onClick={() => setSelectedGroup(i)}
            >
              第 {i + 1} 组
            </button>
          ))}
        </div>

        {/* SPLIT LAYOUT */}
        <div className={styles.splitLayout}>
          {/* LEFT MULTI-ACCOUNT */}
          <div className={styles.leftPane}>
            <div className={styles.accountGrid}>
              {multiAccounts.map(([acc, chars]) => (
                <div key={acc} className={styles.accountColumn}>
                  <div className={styles.accountHeader}>{acc}</div>
                  <div className={styles.characterList}>
                    {chars.map(renderChar)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SINGLE ACCOUNT */}
          <div className={styles.rightPane}>
            <div className={styles.singleColumn}>
              <div className={styles.singleHeader}>单角色账号</div>
              <div className={styles.characterList}>
                {singleAccounts.map(([acc, chars]) => renderChar(chars[0]))}
              </div>
            </div>
          </div>
        </div>

        {/* ❌ Save button removed */}
      </div>
    </>
  );
}
