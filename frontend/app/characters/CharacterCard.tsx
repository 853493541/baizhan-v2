"use client";

import { useState } from "react";
import {
  getMissingForNextTier,
  getNextTier,
} from "@/utils/collectionUtils";
import bossData from "@/app/data/boss_skills_collection_reward.json";
import tradableAbilities from "@/app/data/tradable_abilities.json";
import { Character } from "@/types/Character"; // ✅ shared type

interface CharacterCardProps {
  character: Character;
  onUpdated?: () => void; // parent refresh callback
}

export default function CharacterCard({ character, onUpdated }: CharacterCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [buyableList, setBuyableList] = useState<
    { ability: string; requiredLevel: number }[]
  >([]);

  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    character.abilities ? { ...character.abilities } : {}
  );

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // 🔍 Find all tradable missing abilities
  const tradables: { ability: string; requiredLevel: number }[] = [];
  for (const [_, abilities] of Object.entries(bossData)) {
    const nextTier = getNextTier(
      abilities,
      character.abilities || {},
      character.gender
    );
    const missing = getMissingForNextTier(
      abilities,
      character.abilities || {},
      character.gender
    );
    if (missing.length === 1 && tradableAbilities.includes(missing[0])) {
      tradables.push({ ability: missing[0], requiredLevel: nextTier });
    }
  }

  // ✅ Backend call with optimistic update
  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;

    setLocalAbilities((prev) => ({
      ...prev,
      [ability]: newLevel,
    }));

    try {
      const res = await fetch(
        `${API_URL}/api/characters/${character._id}/abilities`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ abilities: { [ability]: newLevel } }),
        }
      );

      if (!res.ok) {
        console.error("❌ Failed to update ability", await res.text());
        return;
      }

      const updatedChar = await res.json();
      if (updatedChar.abilities) {
        setLocalAbilities({ ...updatedChar.abilities });
      }
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  const handleCopy = (ability: string) => {
    navigator.clipboard.writeText(ability);
    alert(`已复制: ${ability}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    onUpdated?.(); // 🔥 refresh parent only once, on close
  };

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
      <p>账号昵称: {character.account}</p>
      <p>服务器: {character.server}</p>
      <p>性别: {character.gender}</p>
      <p>职业: {character.class}</p>
      <p>定位: {character.role}</p>
      <p>参与排表: {character.active ? "是" : "否"}</p>

      {/* ⚡ Show button if at least one tradable ability exists */}
      {tradables.length > 0 && (
        <>
          <button
            style={{
              marginTop: "8px",
              padding: "4px 6px",
              backgroundColor: "#fff3cd",
              color: "#856404",
              border: "1px solid #ffeeba",
              borderRadius: "6px",
              fontSize: "0.85rem",
              width: "100%",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setBuyableList(tradables);
              setShowModal(true);
            }}
          >
            ⚡ 有紫书可补
          </button>

          {/* 🪟 Modal */}
          {showModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
              onClick={handleCloseModal}
            >
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "8px",
                  minWidth: "360px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ marginBottom: "12px" }}>交易行技能</h3>
                <p>可购买用于提升精耐：</p>

                {buyableList.map(({ ability, requiredLevel }) => (
                  <div
                    key={ability}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <img
                      src={`/icons/${ability}.png`}
                      alt={ability}
                      style={{ width: "40px", height: "40px" }}
                      onError={(e) =>
                        (e.currentTarget as HTMLImageElement).src =
                          "/icons/default.png"
                      }
                    />
                    <span style={{ flex: 1 }}>
                      {ability} · {requiredLevel}重
                    </span>

                    {/* Minus button */}
                    <button
                      onClick={() =>
                        updateAbility(
                          ability,
                          Math.max((localAbilities?.[ability] ?? 0) - 1, 0)
                        )
                      }
                      disabled={(localAbilities?.[ability] ?? 0) <= 0}
                      style={{
                        background:
                          (localAbilities?.[ability] ?? 0) <= 0
                            ? "#e9ecef"
                            : "#f8d7da",
                        color:
                          (localAbilities?.[ability] ?? 0) <= 0
                            ? "#6c757d"
                            : "#721c24",
                        border: "none",
                        borderRadius: "4px",
                        width: "32px",
                        height: "32px",
                        cursor:
                          (localAbilities?.[ability] ?? 0) <= 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      -
                    </button>

                    <span>{localAbilities?.[ability] ?? 0}</span>

                    {/* Plus button */}
                    <button
                      onClick={() =>
                        updateAbility(
                          ability,
                          (localAbilities?.[ability] ?? 0) + 1
                        )
                      }
                      style={{
                        background: "#d4edda",
                        color: "#155724",
                        border: "none",
                        borderRadius: "4px",
                        width: "32px",
                        height: "32px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => handleCopy(ability)}
                      style={{
                        marginLeft: "8px",
                        padding: "4px 8px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      复制名称
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: "16px", textAlign: "right" }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#6c757d",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
