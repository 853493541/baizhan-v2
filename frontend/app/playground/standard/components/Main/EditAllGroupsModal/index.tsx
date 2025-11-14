"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "./styles.module.css";
import type { Character, GroupResult } from "@/utils/solver";

interface Props {
  groups: GroupResult[];
  onSave: (updatedGroups: GroupResult[]) => void;
  onClose: () => void;
  scheduleId: string;            // ⭐ REQUIRED for backend call
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
]);

export default function EditAllGroupsModal({
  groups,
  onSave,
  onClose,
  scheduleId,
}: Props) {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(
    groups.length ? 0 : null
  );

  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Set<string>[]>([]);

  /* -----------------------------------------
     LOAD ALL CHARACTERS
  ----------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/characters/basic`);
        const data = await res.json();
        setAllCharacters(data);
      } catch (err) {
        console.error("❌ Character fetch failed:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  /* -----------------------------------------
     INITIAL SELECTIONS
  ----------------------------------------- */
  const initialSelections = useMemo(() => {
    return groups.map((g) => {
      const s = new Set<string>();
      const ids = new Set(g.characters.map((c) => c._id));
      for (const c of allCharacters) if (ids.has(c._id)) s.add(c._id);
      return s;
    });
  }, [groups, allCharacters]);

  useEffect(() => {
    if (!loading && allCharacters.length > 0) {
      setSelections(initialSelections);
    }
  }, [loading, initialSelections, allCharacters.length]);

  /* -----------------------------------------
     CHAR → GROUP DISPLAY MAP
  ----------------------------------------- */
  const charGroupMap = useMemo(() => {
    const map: Record<string, number> = {};
    groups.forEach((g, idx) => {
      g.characters.forEach((c) => (map[c._id] = idx + 1));
    });
    return map;
  }, [groups]);

  /* -----------------------------------------
     ACCOUNT GROUPING
  ----------------------------------------- */
  const { multiAccounts, singleAccounts } = useMemo(() => {
    const map: Record<string, Character[]> = {};
    for (const c of allCharacters) {
      const acc = c.account || "未分配账号";
      (map[acc] ||= []).push(c);
    }

    const multi: [string, Character[]][] = [];
    const single: [string, Character[]][] = [];

    for (const [acc, chars] of Object.entries(map)) {
      const mains = chars.filter((c) => MAIN_CHARACTERS.has(c.name));
      const rest = chars.filter((c) => !MAIN_CHARACTERS.has(c.name));
      const merged = [...mains, ...rest];
      merged.length === 1 ? single.push([acc, merged]) : multi.push([acc, merged]);
    }

    return { multiAccounts: multi, singleAccounts: single };
  }, [allCharacters, selections]);

  /* -----------------------------------------
     ADD NEW GROUP
  ----------------------------------------- */
  const addNewGroup = () => {
    const newGroup: GroupResult = {
      index: groups.length + 1,
      characters: [],
      kills: [],
      status: "not_started",
    };

    const newGroups = [...groups, newGroup];
    const newSelections = [...selections, new Set<string>()];

    setSelections(newSelections);
    setSelectedGroup(newGroups.length - 1);

    onSave(newGroups);
  };

  /* -----------------------------------------
     TOGGLE CHARACTER — SAFE MERGE
  ----------------------------------------- */
  const toggleChar = (id: string) => {
    if (selectedGroup === null) return;

    const clones = selections.map((s) => new Set(s));
    const currentSet = clones[selectedGroup];

    if (currentSet.has(id)) {
      currentSet.delete(id);
    } else {
      if (currentSet.size >= 3) return; // FULL → DO NOTHING

      // remove from other groups
      clones.forEach((s, idx) => {
        if (idx !== selectedGroup && s.has(id)) s.delete(id);
      });

      currentSet.add(id);
    }

    setSelections(clones);

    // ⭐ SAFE MERGE: KEEP kills + status
    const updated = groups.map((g, i) => {
      const ids = clones[i];
      const chars = allCharacters.filter((c) => ids.has(c._id));
      return { ...g, characters: chars };
    });

    onSave(updated);
  };

  /* -----------------------------------------
     CALL BACKEND /manual-groups
  ----------------------------------------- */
  const persistToBackend = async (finalGroups: GroupResult[]) => {
    try {
      const payload = finalGroups.map((g) => ({
        index: g.index,
        characters: g.characters.map((c) => c._id),
      }));

      await fetch(
        `${API_BASE}/api/standard-schedules/${scheduleId}/manual-groups`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups: payload }),
        }
      );
    } catch (err) {
      console.error("❌ Manual edit backend update failed:", err);
    }
  };

  /* -----------------------------------------
     CLEANUP, REORDER, SAVE
  ----------------------------------------- */
  const handleClose = async () => {
    // remove ONLY truly empty + unused groups
    const safeGroups = groups.filter(
      (g) =>
        !(
          g.characters.length === 0 &&
          (g.kills?.length ?? 0) === 0 &&
          g.status === "not_started"
        )
    );

    const base = safeGroups.length ? safeGroups : groups;

    // main groups first
    const mainGroups = base.filter((g) =>
      g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
    );
    const normalGroups = base.filter(
      (g) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
    );

    // reindex
    const reordered = [...mainGroups, ...normalGroups].map((g, idx) => ({
      ...g,
      index: idx + 1,
    }));

    // save locally
    onSave(reordered);

    // persist
    await persistToBackend(reordered);

    onClose();
  };

  /* -----------------------------------------
     RENDER CHARACTER
  ----------------------------------------- */
  const current = selectedGroup !== null ? selections[selectedGroup] : null;

  const renderChar = (c: Character) => {
    const selected = current?.has(c._id) ?? false;
    const isMain = MAIN_CHARACTERS.has(c.name);
    const groupIndex = charGroupMap[c._id];

    return (
      <div
        key={c._id}
        onClick={() => toggleChar(c._id)}
        className={`${styles.characterPill} ${
          selected
            ? c.role === "Tank"
              ? styles.tank
              : c.role === "Healer"
              ? styles.healer
              : styles.dps
            : styles.inactive
        }`}
      >
        <span className={styles.charName}>
          {isMain && <span className={styles.starMark}>★</span>}
          {c.name}
        </span>
        {groupIndex && <span className={styles.groupText}>组{groupIndex}</span>}
      </div>
    );
  };

  /* -----------------------------------------
     UI
  ----------------------------------------- */
  if (loading) {
    return (
      <>
        <div className={styles.portalBackdrop} onClick={onClose} />
        <div className={styles.characterModal}>
          <h2 className={styles.title}>加载角色列表中…</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.portalBackdrop} onClick={handleClose} />

      <div className={styles.characterModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>编辑组员</h2>
          <button className={styles.closeTextBtn} onClick={handleClose}>
            关闭
          </button>
        </div>

        <div className={styles.groupNumberRow}>
          {groups.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.groupNumberBtn} ${
                selectedGroup === idx ? styles.groupNumberActive : ""
              }`}
              onClick={() => setSelectedGroup(idx)}
            >
              {idx + 1}
            </button>
          ))}
          <button className={styles.groupNumberBtn} onClick={addNewGroup}>
            +
          </button>
        </div>

        <div className={styles.splitLayout}>
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

          <div className={styles.rightPane}>
            <div className={styles.singleColumn}>
              <div className={styles.singleHeader}>单角色账号</div>
              <div className={styles.characterList}>
                {singleAccounts.map(([acc, chars]) => renderChar(chars[0]))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
