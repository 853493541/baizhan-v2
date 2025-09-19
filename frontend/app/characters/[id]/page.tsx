"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CharacterAbilities from "./sections/CharacterAbilities";
import CollectionStatus from "./sections/CollectionStatus";
import CharacterBasics, { CharacterEditData } from "./sections/CharacterBasics";
import AbilityHighlights from "./sections/AbilityHighlights";
import SingleAbilityUpdate from "./sections/SingleAbilityUpdate";
import CharacterOCRSection from "./sections/OCRSection";
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
}

export default function CharacterDetailPage() {
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : (id as string);
  const router = useRouter();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ use environment variable
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
  // Render
  // ============================
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!character) return <p>No character found</p>;

  return (
    <div className={styles.page}>
      <h1>角色详情</h1>

      {/* === Top section: Basics left + SingleAbilityUpdate right === */}
      <div className={styles.topSection}>
        <div className={styles.leftColumn}>
          <CharacterBasics
            character={character}
            onSave={handleSaveEdit}
            onDelete={handleDelete}
          />

          <CharacterOCRSection
            characterId={character._id}
            currentAbilities={character.abilities}
            onAbilitiesUpdated={(updatedAbilities) => {
              setCharacter((prev) =>
                prev
                  ? {
                      ...prev,
                      abilities: { ...prev.abilities, ...updatedAbilities },
                    }
                  : prev
              );
            }}
          />
        </div>

        <div className={styles.rightColumn}>
          <SingleAbilityUpdate
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
      </div>

      <AbilityHighlights
        characterId={character._id}
        abilities={character.abilities}
        onAbilityUpdate={(ability, newLevel) => {
          setCharacter((prev) =>
            prev
              ? { ...prev, abilities: { ...prev.abilities, [ability]: newLevel } }
              : prev
          );
        }}
      />

      <h3 style={{ marginTop: 24 }}>技能</h3>
      <CharacterAbilities abilities={character.abilities} />

      <CollectionStatus character={character} />
    </div>
  );
}
