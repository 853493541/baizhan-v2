"use client";

import React, { useState, useMemo, useEffect } from "react";
import styles from "./styles.module.css";
import AbilityList from "./AbilityList";
import MemberList from "./MemberList";
import ActionPanel from "./ActionPanel";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";
import type { AbilityCheck, Character, GroupResult } from "@/utils/solver";

export default function GroupDrops({
  API_URL,
  planId,
  group,
  checkedAbilities,
  onClose,
  onSaved,
  allCharacters,
}: {
  API_URL: string;
  planId: string;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  onClose: () => void;
  onSaved: () => void;
  allCharacters: Character[];
}) {
  /* -----------------------------------------------
     🧠 Local states
  ----------------------------------------------- */
  const [abilitiesAdded, setAbilitiesAdded] = useState<
    { name: string; level: 9 | 10 }[]
  >([]);

  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<9 | 10 | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  /* -----------------------------------------------
     🔍 All available abilities
  ----------------------------------------------- */
  const allAbilities = useMemo(() => {
    const names = checkedAbilities.map((a) => a.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [checkedAbilities]);

  /* -----------------------------------------------
     🔠 Build pinyin map once
  ----------------------------------------------- */
  useEffect(() => {
    async function buildMap() {
      const map = await createPinyinMap(allAbilities);
      setPinyinMap(map);
    }
    buildMap();
  }, [allAbilities]);

  /* -----------------------------------------------
     🔎 Filter abilities by name/pinyin
  ----------------------------------------------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allAbilities;
    return pinyinFilter(allAbilities, pinyinMap, term);
  }, [search, pinyinMap, allAbilities]);

  /* -----------------------------------------------
     ➕ Add new ability (from modal)
  ----------------------------------------------- */
  const handleAddAbility = (name: string, level: 9 | 10) => {
    setAbilitiesAdded((prev) => {
      if (prev.some((a) => a.name === name && a.level === level)) return prev;
      return [...prev, { name, level }];
    });
    setSelectedAbility(name);
    setSelectedLevel(level);
  };

  /* -----------------------------------------------
     🟢 Handle ability select from list
  ----------------------------------------------- */
  const handleAbilitySelect = (name: string, level: 9 | 10) => {
    setSelectedAbility(name);
    setSelectedLevel(level);
  };

  /* -----------------------------------------------
     🚫 Mark this group as "no drop"
  ----------------------------------------------- */
  const markNoDrop = async () => {
    const endpoint = `${API_URL}/api/targeted-plans/${planId}/groups/${group?.index}/status`;
    try {
      setLoading(true);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finished" }),
      });
      if (!res.ok) throw new Error(await res.text());
      group.status = "finished";
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ [markNoDrop] Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------
     🧱 Render modal structure
  ----------------------------------------------- */
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.columns}>
          {/* 🟩 Step 1: Ability selection */}
          <AbilityList
            abilities={filtered}
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel}
            onAbilitySelect={handleAbilitySelect}
            onAddOption={handleAddAbility}
          />

          {/* 🔵 Step 2: Character selection */}
          <MemberList
            group={group}
            allCharacters={allCharacters}
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
          />

          {/* 🟣 Step 3: Confirm / Save */}
          <ActionPanel
            API_URL={API_URL}
            planId={planId}
            group={group}
            allCharacters={allCharacters}
            selectedCharacter={selectedCharacter}
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel}
            loading={loading}
            setLoading={setLoading}
            onClose={onClose}
            onSaved={onSaved}
          />
        </div>

        {/* === Footer buttons === */}
        <div className={styles.footer}>
          <button
            onClick={markNoDrop}
            className={styles.noDropBtn}
            disabled={loading}
          >
            无掉落
          </button>
          <button onClick={onClose} className={styles.closeBtn}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
