"use client";

import { useState } from "react";

interface CharacterAbilitiesProps {
  abilities: Record<string, number>;
}

const levelOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function CharacterAbilities({ abilities }: CharacterAbilitiesProps) {
  const [open, setOpen] = useState(false);

  // Group abilities by level
  const grouped: Record<number, string[]> = {};
  for (const [name, value] of Object.entries(abilities)) {
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(name);
  }

  // Sort alphabetically inside each level
  for (const lvl of Object.keys(grouped)) {
    grouped[Number(lvl)].sort();
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {/* 上传技能总览 row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <button
          onClick={() => alert("上传技能总览 clicked")}
          style={{
            padding: "6px 14px",
            background: "#1a1a1a",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          上传技能总览
        </button>
        <span style={{ fontSize: "14px", color: "#888" }}>未上传</span>
      </div>

      {/* Dropdown 全部技能 */}
      <details style={{ background: "#f5f5f5", borderRadius: "6px", padding: "8px" }} open={false}>
        <summary
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          全部技能
        </summary>

        <div style={{ display: "grid", gap: "20px" }}>
          {levelOrder.map((lvl) => {
            if (!grouped[lvl] || grouped[lvl].length === 0) return null;

            return (
              <div key={lvl}>
                <h3 style={{ color: "#d4af37", marginBottom: "8px" }}>{lvl}重</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)", // force 3 per row
                    gap: "6px 12px",
                  }}
                >
                  {grouped[lvl].map((name) => (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "3px 6px",
                        background: "#1a1a1a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <img
                        src={`/icons/${name}.png`}
                        alt={name}
                        width={24}
                        height={24}
                        style={{ borderRadius: 4 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                        }}
                      />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
