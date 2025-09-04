"use client";

import {
  getMissingForNextTier,
} from "@/utils/collectionUtils";
import bossData from "@/app/data/boss_skills_collection_reward.json";
import tradableAbilities from "@/app/data/tradable_abilities.json";

interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: "男" | "女";
  class: string;
  role: string;
  active: boolean;
  abilities?: Record<string, number>; // needed for preview
}

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  // check across all bosses if exactly 1 tradable missing ability exists
  let tradableReady = false;

  for (const [_, abilities] of Object.entries(bossData)) {
    const missing = getMissingForNextTier(
      abilities,
      character.abilities || {},
      character.gender as "男" | "女"
    );

    if (
      missing.length === 1 &&
      tradableAbilities.includes(missing[0])
    ) {
      tradableReady = true;
      break;
    }
  }

  return (
    <div
      key={character._id}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        width: "220px",
        cursor: "pointer",
        position: "relative",
      }}
      onClick={() => (window.location.href = `/characters/${character._id}`)}
    >
      <h3>{character.name}</h3>
      <p>Account: {character.account}</p>
      <p>Server: {character.server}</p>
      <p>Gender: {character.gender}</p>
      <p>Class: {character.class}</p>
      <p>Role: {character.role}</p>
      <p>Active: {character.active ? "是" : "否"}</p>

      {/* ✅ Only show if exactly one tradable ability is missing */}
      {tradableReady && (
        <div
          style={{
            marginTop: "8px",
            padding: "4px 6px",
            backgroundColor: "#fff3cd",
            color: "#856404",
            borderRadius: "6px",
            fontSize: "0.85rem",
            textAlign: "center",
          }}
        >
          ⚡ 可交易补齐
        </div>
      )}
    </div>
  );
}
