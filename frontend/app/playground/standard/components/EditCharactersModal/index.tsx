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
  onLocalUpdate: (ids: Set<string>) => void;   // ⭐ NEW
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
  onLocalUpdate,         // ⭐ NEW
}: Props) {
  const [allCharacters, setAllCharacters] = useState<BasicChar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set((schedule.characters || []).map((c) => c._id))
  );

  // First-open animation flag
  const [entered, setEntered] = useState(false);
  useEffect(() => setEntered(true), []);

  /* ----------------------------------------------------
     LOAD BASIC CHARACTERS (FAST)
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
     AUTO-SAVE ON TOGGLE + LIVE UPDATE
  ---------------------------------------------------- */
  const toggleChar = async (charId: string) => {
    const currentlySelected = selectedIds.has(charId);
    const next = new Set(selectedIds);

    if (currentlySelected) next.delete(charId);
    else next.add(charId);

    // 1️⃣ Optimistic UI update
    setSelectedIds(next);

    // 2️⃣ Live update parent UI (角色数量)
    onLocalUpdate(next);  // ⭐ NEW

    // 3️⃣ Backend auto-save
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
     GROUPING BY ACCOUNT — NO SORTING
  ---------------------------------------------------- */
  const { multiAccounts, singleAccounts } = useMemo(() => {
    if (!allCharacters.length)
      return { multiAccounts: [], singleAccounts: [] };

    const groups: Record<string, BasicChar[]> = {};

    // Preserve server load order
    for (const c of allCharacters) {
      const acc = c.account || "未分配账号";
      if (!groups[acc]) groups[acc] = [];
      groups[acc].push(c);
    }

    const multi: [string, BasicChar[]][] = [];
    const single: [string, BasicChar[]][] = [];

    for (const [acc, chars] of Object.entries(groups)) {
      if (chars.length === 1) single.push([acc, chars]);
      else multi.push([acc, chars]);
    }

    return { multiAccounts: multi, singleAccounts: single };
  }, [allCharacters, selectedIds]);

  /* ----------------------------------------------------
     RENDER CHARACTER ENTRY
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

        <input
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          onChange={() => toggleChar(c._id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  /* ----------------------------------------------------
     MODAL OUTPUT
  ---------------------------------------------------- */
  if (loading) {
    return (
      <div className={styles.portalBackdrop} onMouseDown={onClose}>
        <div
          className={`${styles.characterModal} ${
            !entered ? styles.animated : ""
          }`}
        >
          <div className={styles.header}>
            <h2 className={styles.centerTitle}>编辑参与角色</h2>
          </div>
          <p>加载中…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.portalBackdrop} onMouseDown={onClose} />

      <div
        className={`${styles.characterModal} ${
          !entered ? styles.animated : ""
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.centerTitle}>编辑参与角色</h2>
          <button
            className={styles.closeBtn}
            onClick={() => {
              onUpdated();  // Refresh backend data
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.splitLayout}>
          {/* Multi-character Accounts */}
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

          {/* Single-character Accounts */}
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

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.countText}>
            已选 {selectedIds.size} 人 / 共 {allCharacters.length} 人
          </span>
        </div>
      </div>
    </>
  );
}
