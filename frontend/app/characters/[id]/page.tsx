"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CharacterAbilities from "./sections/CharacterAbilities";
import CollectionStatus from "./sections/CollectionStatus";
import CharacterBasics, { CharacterEditData } from "./sections/CharacterBasics";
import AbilityHighlights from "./sections/AbilityHighlights";
import CharacterOCRSection from "./sections/OCRSection";
import AbilityEditor from "../../components/characters/AbilityEditor";
import Backpack from "./sections/Backpack";
import styles from "./styles.module.css";

interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  abilities: Record<string, number>;
  storage?: any[];
}

export default function CharacterDetailPage() {
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : (id as string);
  const router = useRouter();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ============================
  // Load character
  // ============================
  useEffect(() => {
    if (!characterId) return;
    fetch(`${API_URL}/api/characters/${characterId}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacter(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load character");
        setLoading(false);
      });
  }, [characterId, API_URL]);

  // ============================
  // Save edits
  // ============================
  const handleSaveEdit = async (data: CharacterEditData) => {
    if (!characterId) return;
    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setCharacter(updated);
      alert("角色信息已更新");
    } catch (err) {
      console.error(err);
      alert("更新失败");
    }
  };

  // ============================
  // Delete character
  // ============================
  const handleDelete = async () => {
    if (!characterId) return;
    if (!confirm("确定要删除这个角色吗？")) return;
    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("角色已删除");
      router.push("/characters");
    } catch (err) {
      console.error(err);
      alert("删除失败");
    }
  };

  // ============================
  // Refresh character
  // ============================
  const refreshCharacter = async (): Promise<void> => {
    if (!characterId) return;
    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`);
      if (!res.ok) throw new Error("刷新失败");
      const updated = await res.json();
      setCharacter(updated);
    } catch (err) {
      console.error("❌ refreshCharacter error:", err);
      alert("刷新角色失败，请稍后再试");
    }
  };

  // ============================
  // Render
  // ============================
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!character) return <p>No character found</p>;

  return (
    <div className={styles.page}>
      {/* === Header === */}
      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← 返回
        </button>
        <h1 className={styles.pageTitle}>角色详情</h1>
      </div>

      {/* === Top Section === */}
      <div className={styles.topGrid}>
        <div className={styles.topLeft}>
          <CharacterBasics
            character={character}
            onSave={handleSaveEdit}
            onDelete={handleDelete}
          />
        </div>

        <div className={styles.topRight}>
          <div className={styles.card}>
            <CharacterAbilities abilities={character.abilities} />
            <div className={styles.ocrWrapper}>
              <CharacterOCRSection
                characterId={character._id}
                currentAbilities={character.abilities}
                onAbilitiesUpdated={(updatedAbilities) => {
                  setCharacter((prev) =>
                    prev
                      ? {
                          ...prev,
                          abilities: {
                            ...prev.abilities,
                            ...updatedAbilities,
                          },
                        }
                      : prev
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* === Middle Section === */}
      <div className={styles.midGrid}>
        <div className={styles.leftStack}>
          <div className={styles.card}>
            <AbilityHighlights
              characterId={character._id}
              abilities={character.abilities}
              characterGender={character.gender === "男" ? "male" : "female"} // ✅ gender mapping
              characterClass={character.class} // ✅ pass class
              onAbilityUpdate={(ability, newLevel) => {
                setCharacter((prev) =>
                  prev
                    ? {
                        ...prev,
                        abilities: { ...prev.abilities, [ability]: newLevel },
                      }
                    : prev
                );
              }}
            />
          </div>
        </div>

        {/* RIGHT → Editor (half height) + Backpack */}
        <div className={styles.rightStack}>
          {/* Ability Editor */}
          <div className={styles.halfCard}>
            <AbilityEditor
              characterId={character._id}
              abilities={character.abilities}
              onAbilityUpdate={(ability, newLevel) => {
                setCharacter((prev) =>
                  prev
                    ? {
                        ...prev,
                        abilities: { ...prev.abilities, [ability]: newLevel },
                      }
                    : prev
                );
              }}
            />
          </div>

          {/* ✅ Backpack Section */}
          <Backpack
            character={character}
            API_URL={API_URL}
            refreshCharacter={refreshCharacter}
          />
        </div>
      </div>

      {/* === Collection + Storage === */}
      <div className={styles.card}>
        <CollectionStatus character={character} />
      </div>
    </div>
  );
}
