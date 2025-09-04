"use client";

import React, { useState } from "react";
import "./AbilityHighlights.css"; // reuse the same CSS

interface SingleAbilityUpdateProps {
  characterId: string;
  abilities: Record<string, number>;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}

export default function SingleAbilityUpdate({
  characterId,
  abilities,
  onAbilityUpdate,
}: SingleAbilityUpdateProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loadingAbility, setLoadingAbility] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLoadingAbility(ability);

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}/abilities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abilities: { [ability]: newLevel } }),
      });

      if (!res.ok) {
        console.error("❌ Failed to update ability", await res.text());
        return;
      }

      onAbilityUpdate?.(ability, newLevel);
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    } finally {
      setLoadingAbility(null);
    }
  };

  const allAbilities = Object.keys(abilities);
  const results = allAbilities.filter((name) => name.includes(query.trim()));

  return (
    <div style={{ marginTop: "20px" }}>
      {/* Button to open */}
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "8px 12px",
          background: "#2563eb",
          color: "white",
          borderRadius: "6px",
          fontWeight: "bold",
        }}
      >
        单个技能更新
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "500px",
              maxHeight: "80vh",
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
              搜索技能
            </h3>

            {/* Search input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入技能名..."
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "16px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />

            {/* Results */}
            <div className="ability-grid">
              {results.map((name) => {
                const level = abilities[name] || 0;
                const iconPath = `/icons/${name}.png`;

                return (
                  <div key={name} className="ability-card">
                    <img
                      src={iconPath}
                      alt={name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                      }}
                    />
                    <span className="ability-name">{name}</span>
                    <div className="ability-controls">
                      <button
                        className="minus"
                        disabled={loadingAbility === name}
                        onClick={() => updateAbility(name, level - 1)}
                      >
                        -
                      </button>
                      <span className="ability-level">{level}</span>
                      <button
                        className="plus"
                        disabled={loadingAbility === name}
                        onClick={() => updateAbility(name, level + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: "16px",
                padding: "6px 12px",
                background: "#aaa",
                color: "white",
                borderRadius: "6px",
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
