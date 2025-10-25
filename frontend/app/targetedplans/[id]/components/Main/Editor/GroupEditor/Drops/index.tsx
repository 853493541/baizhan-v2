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

  const allAbilities = useMemo(() => {
    const names = checkedAbilities.map((a) => a.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [checkedAbilities]);

  const pinyinMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of allAbilities) {
      map[a] = pinyin(a, { style: pinyin.STYLE_NORMAL }).flat().join("");
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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>🎯 掉落分配</h3>

        <div className={styles.columns}>
          <AbilityList
            abilities={filtered}
            selectedAbility={selectedAbility}
            setSelectedAbility={setSelectedAbility}
            search={search}
            setSearch={setSearch}
          />
          <LevelPicker
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
          />
          <MemberList
            group={group}
            allCharacters={allCharacters}
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
          />
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

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeBtn}>关闭</button>
        </div>
      </div>
    </div>
  );
}
