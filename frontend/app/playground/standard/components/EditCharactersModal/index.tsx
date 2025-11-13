"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";

interface BasicChar {
  _id: string;
  name: string;
  account: string;
  role: "Tank" | "DPS" | "Healer";
}

interface Props {
  schedule: {
    _id: string;
    characters: { _id: string }[];
  };
  onClose: () => void;
  onUpdated: () => void;
  onLocalUpdate: (ids: Set<string>) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
]);

export default function EditScheduleCharactersModal({
  schedule,
  onClose,
  onUpdated,
  onLocalUpdate,
}: Props) {
  const [allCharacters, setAllCharacters] = useState<BasicChar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set((schedule.characters || []).map((c) => c._id))
  );

  const [entered, setEntered] = useState(false);
  useEffect(() => setEntered(true), []);

  /* ----------------------------------------------------
     LOAD BASIC CHARACTERS
  ---------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/characters/basic`);
        const data: BasicChar[] = await res.json();
        setAllCharacters(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ----------------------------------------------------
     TOGGLE CHAR
  ---------------------------------------------------- */
  const toggleChar = async (charId: string) => {
    const currentlySelected = selectedIds.has(charId);
    const next = new Set(selectedIds);

    if (currentlySelected) next.delete(charId);
    else next.add(charId);

    setSelectedIds(next);
    onLocalUpdate(next);

    try {
      await fetch(
        `${API_BASE}/api/standard-schedules/${schedule._id}/toggle-character`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId: charId,
            add: !currentlySelected,
          }),
        }
      );
    } catch (err) {
      console.error("toggle save error:", err);
    }
  };

  /* ----------------------------------------------------
     GROUPING — MAIN CHARACTER PRIORITY
  ---------------------------------------------------- */
  const { multiAccounts, singleAccounts } = useMemo(() => {
    if (!allCharacters.length)
      return { multiAccounts: [], singleAccounts: [] };

    const groups: Record<string, BasicChar[]> = {};
    for (const c of allCharacters) {
      const acc = c.account || "未分配账号";
      if (!groups[acc]) groups[acc] = [];
      groups[acc].push(c);
    }

    const multi: [string, BasicChar[]][] = [];
    const single: [string, BasicChar[]][] = [];

    for (const [acc, chars] of Object.entries(groups)) {
      const mainChars = chars.filter((c) => MAIN_CHARACTERS.has(c.name));
      const normalChars = chars.filter((c) => !MAIN_CHARACTERS.has(c.name));
      const merged = [...mainChars, ...normalChars];

      if (merged.length === 1) single.push([acc, merged]);
      else multi.push([acc, merged]);
    }

    // sort accounts containing main characters first
    const hasMain = (chars: BasicChar[]) =>
      chars.some((c) => MAIN_CHARACTERS.has(c.name));

    multi.sort((a, b) => Number(hasMain(b[1])) - Number(hasMain(a[1])));
    single.sort((a, b) => Number(hasMain(b[1])) - Number(hasMain(a[1])));

    return { multiAccounts: multi, singleAccounts: single };
  }, [allCharacters, selectedIds]);

  /* ----------------------------------------------------
     RENDER CHARACTER PILL
  ---------------------------------------------------- */
  const renderChar = (c: BasicChar) => {
    const checked = selectedIds.has(c._id);
    const isMain = MAIN_CHARACTERS.has(c.name);

    return (
      <div
        key={c._id}
        className={`${styles.characterPill} ${
          checked
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

  /* ----------------------------------------------------
     LOADING
  ---------------------------------------------------- */
  if (loading) {
    return (
      <div
        className={styles.portalBackdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onUpdated();
            onClose();
          }
        }}
      >
        <div className={styles.characterModal}>
          <div className={styles.headerRow}>
            <h2 className={styles.title}>编辑排表角色</h2>
          </div>
          <p>加载中…</p>
        </div>
      </div>
    );
  }

  const count = selectedIds.size;
  const warn = count % 3 !== 0;

  /* ----------------------------------------------------
     MAIN MODAL
  ---------------------------------------------------- */
  return (
    <>
      <div
        className={styles.portalBackdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onUpdated();
            onClose();
          }
        }}
      />

      <div
        className={styles.characterModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER ROW */}
        <div className={styles.headerRow}>
          <h2 className={styles.title}>
            编辑排表角色
            <span
              className={`${styles.countInline} ${
                warn ? styles.warn : ""
              }`}
            >
              （{count} 人）
            </span>
          </h2>

          <button
            className={styles.closeTextBtn}
            onClick={() => {
              onUpdated();
              onClose();
            }}
          >
            关闭
          </button>
        </div>

        {/* CONTENT */}
        <div className={styles.splitLayout}>
          {/* MULTI-ACCOUNT */}
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

          {/* SINGLE-ACCOUNT */}
          <div className={styles.rightPane}>
            <div className={styles.singleColumn}>
              <div className={styles.singleHeader}>单角色账号</div>
              <div className={styles.characterList}>
                {singleAccounts.map(([acc, [c]]) =>
                  renderChar({ ...c, account: acc })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
