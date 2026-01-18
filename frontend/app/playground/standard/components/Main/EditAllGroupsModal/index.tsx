"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import type { Character, GroupResult } from "@/utils/solver";

interface Props {
  groups: GroupResult[];
  onSave: (updatedGroups: GroupResult[]) => void;
  onClose: () => void;
  scheduleId: string;
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
}: Props) {
  /* =========================
     Selection / draft state
  ========================= */
  const [selectedGroup, setSelectedGroup] = useState<number | null>(
    groups.length ? 0 : null
  );

  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  // Draft-only state
  const [localGroups, setLocalGroups] = useState<GroupResult[]>(groups);
  const [selections, setSelections] = useState<Set<string>[]>([]);

  /* =====================================================
     🔐 FULL CHARACTER CACHE (SAFE)
  ===================================================== */
  const fullCharCache = useRef<Map<string, Character>>(new Map());

  // Seed cache from initial groups (mount only)
  useEffect(() => {
    for (const g of groups) {
      for (const c of g.characters) {
        if (c?._id && (c as any).abilities) {
          fullCharCache.current.set(c._id, c);
        }
      }
    }
  }, []); // ✅ mount only

  /* =====================================================
     🔒 Prevent parent → modal overwrite
  ===================================================== */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      setLocalGroups(groups);
      initializedRef.current = true;
    }
  }, [groups]);

  /* -----------------------------------------
     LOAD BASIC CHARACTERS (UI ONLY)
  ----------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/characters/basic`);
        const data = await res.json();
        setAllCharacters(data);
      } catch (err) {
        console.error("❌ Character fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* -----------------------------------------
     INITIAL SELECTIONS (from localGroups)
  ----------------------------------------- */
  const initialSelections = useMemo(() => {
    return localGroups.map((g) => {
      const s = new Set<string>();
      g.characters.forEach((c) => s.add(c._id));
      return s;
    });
  }, [localGroups]);

  useEffect(() => {
    if (!loading) setSelections(initialSelections);
  }, [loading, initialSelections]);

  /* -----------------------------------------
     CHAR → GROUP DISPLAY MAP
  ----------------------------------------- */
  const charGroupMap = useMemo(() => {
    const map: Record<string, number> = {};
    localGroups.forEach((g, idx) => {
      g.characters.forEach((c) => {
        map[c._id] = idx + 1;
      });
    });
    return map;
  }, [localGroups]);

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

    const hasMain = (chars: Character[]) =>
      chars.some((c) => MAIN_CHARACTERS.has(c.name));

    multi.sort((a, b) => Number(hasMain(b[1])) - Number(hasMain(a[1])));
    single.sort((a, b) => Number(hasMain(b[1])) - Number(hasMain(a[1])));

    return { multiAccounts: multi, singleAccounts: single };
  }, [allCharacters]);

  /* -----------------------------------------
     LAZY FULL FETCH
  ----------------------------------------- */
  const fetchFullCharacter = async (id: string): Promise<Character> => {
    const cached = fullCharCache.current.get(id);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/api/characters/${id}`);
    if (!res.ok) throw new Error("Failed to fetch character");

    const full = await res.json();
    fullCharCache.current.set(id, full);
    return full;
  };

  const resolveGroupCharacters = async (ids: Set<string>) => {
    const out: Character[] = [];
    for (const id of ids) {
      out.push(await fetchFullCharacter(id));
    }
    return out;
  };

  /* -----------------------------------------
     TOGGLE CHARACTER (DRAFT ONLY)
  ----------------------------------------- */
  const toggleChar = async (id: string) => {
    if (selectedGroup === null) return;

    const clones = selections.map((s) => new Set(s));
    const currentSet = clones[selectedGroup];

    if (currentSet.has(id)) {
      currentSet.delete(id);
    } else {
      if (currentSet.size >= 3) return;
      clones.forEach((s, idx) => {
        if (idx !== selectedGroup) s.delete(id);
      });
      currentSet.add(id);
    }

    setSelections(clones);

    const updated: GroupResult[] = [];
    for (let i = 0; i < localGroups.length; i++) {
      const chars = await resolveGroupCharacters(clones[i]);
      updated.push({ ...localGroups[i], characters: chars });
    }

    setLocalGroups(updated);
    // ❌ NO onSave here — draft only
  };

  /* -----------------------------------------
     CLOSE + COMMIT (SINGLE SOURCE OF TRUTH)
  ----------------------------------------- */
  const handleClose = () => {
    onSave(localGroups); // ✅ single authoritative save
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
          {localGroups.map((_, idx) => (
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
                {singleAccounts.map(([_, chars]) => renderChar(chars[0]))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
