"use client";

import { useState } from "react";
import Image from "next/image";

interface CharacterAbilitiesProps {
  abilities: Record<string, number>;
}

const levelOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function CharacterAbilities({ abilities }: CharacterAbilitiesProps) {
  const [showAbilities, setShowAbilities] = useState(false);

  // Group abilities by level
  const grouped: Record<number, string[]> = {};
  for (const [name, value] of Object.entries(abilities)) {
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(name);
  }

  for (const lvl of Object.keys(grouped)) {
    grouped[Number(lvl)].sort();
  }

  if (!showAbilities) {
    return (
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setShowAbilities(true)}
          style={{
            background: "#222",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          显示全部技能
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px", marginTop: 16 }}>
      {levelOrder.map((lvl) => {
        if (!grouped[lvl] || grouped[lvl].length === 0) return null;
        return (
          <div key={lvl}>
            <h3 style={{ color: "#d4af37", marginBottom: "8px" }}>{lvl}重</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "8px 16px",
              }}
            >
              {grouped[lvl].map((name) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px",
                  }}
                >
                  <Image
                    src={`/icons/${name}.png`}
                    alt={name}
                    width={24}
                    height={24}
                    style={{ borderRadius: 4 }}
                  />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
