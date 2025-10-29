"use client";
import React, { useState, useMemo } from "react";
import pinyin from "pinyin";
import styles from "./styles.module.css";
import AbilityList from "./AbilityList";
import LevelPicker from "./LevelPicker";
import MemberList from "./MemberList";
import ActionPanel from "./ActionPanel";
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
  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<9 | 10 | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // 🧠 Debug group info
  console.log("🧩 [GroupDrops] Mounted with group =", group);
  console.log("🧩 [GroupDrops] group.index =", group?.index);
  console.log("🧩 [GroupDrops] Plan ID =", planId);

  // 🧩 All unique ability names
  const allAbilities = useMemo(() => {
    const names = checkedAbilities.map((a) => a.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [checkedAbilities]);

  // 🈶 Pinyin map for search matching
  const pinyinMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of allAbilities) {
      map[a] = pinyin(a, { style: pinyin.STYLE_NORMAL }).flat().join("");
    }
    return map;
  }, [allAbilities]);

  // 🔍 Filter abilities by search or pinyin
  const filtered = allAbilities.filter(
    (a) =>
      a.includes(search) ||
      pinyinMap[a]?.includes(search.toLowerCase()) ||
      pinyinMap[a]?.startsWith(search.toLowerCase())
  );

  // 🚫 Mark this group as "no drop" and finished
  const markNoDrop = async () => {
    const endpoint = `${API_URL}/api/targeted-plans/${planId}/groups/${group?.index}/status`;
    console.log("📡 [markNoDrop] PUT", endpoint);

    try {
      setLoading(true);
      const body = { status: "finished" };
      console.log("📦 [markNoDrop] Sending body:", body);

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("📥 [markNoDrop] Response:", res.status);
      if (!res.ok) {
        const text = await res.text();
        console.warn("❌ [markNoDrop] Error response:", text);
        throw new Error(`HTTP ${res.status}`);
      }

      // ✅ Immediately update local state to prevent autosave overwrite
      group.status = "finished";

      console.log(`✅ [markNoDrop] Group ${group?.index} marked as finished (no drop).`);
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ [markNoDrop] Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.columns}>
          {/* 🟢 Step 1: Ability selection */}
          <AbilityList
            abilities={filtered}
            selectedAbility={selectedAbility}
            setSelectedAbility={setSelectedAbility}
            search={search}
            setSearch={setSearch}
          />

          {/* 🟡 Step 2: Level selection */}
          <LevelPicker
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            disabled={!selectedAbility}
          />

          {/* 🔵 Step 3: Character selection */}
          <MemberList
            group={group}
            allCharacters={allCharacters}
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
          />

          {/* 🟣 Step 4: Actions */}
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
