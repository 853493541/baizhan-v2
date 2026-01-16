"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CollectionStatus from "./sections/CollectionStatus";
import CharacterBasics from "./sections/CharacterBasics";
import AbilityHighlights from "./sections/AbilityHighlights";
import CharacterOCRSection from "./sections/OCRSection";
import AbilityEditor from "./sections/AbilityEditor";
import Backpack from "./sections/Backpack";

import ConfirmModal from "@/app/components/ConfirmModal";
import styles from "./styles.module.css";

import {
  toastSuccess,
  toastError,
} from "@/app/components/toast/toast";

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

  /* ============================
     Confirm state
  ============================ */
  const [confirmOpen, setConfirmOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* ============================
     Load character
  ============================ */
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

  /* ============================
     Refresh after edit
  ============================ */
  const refreshAfterEdit = async () => {
    if (!characterId) return;

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`);
      if (!res.ok) throw new Error("Refresh failed");

      const updated = await res.json();
      setCharacter(updated);
    } catch (err) {
      console.error("❌ refreshAfterEdit error:", err);
    }
  };

  /* ============================
     Delete character (step 1)
  ============================ */
  const handleDelete = () => {
    setConfirmOpen(true);
  };

  /* ============================
     Delete character (step 2)
  ============================ */
  const confirmDelete = async () => {
    if (!characterId) return;

    setConfirmOpen(false);

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toastSuccess("角色已删除");
      router.push("/characters");
    } catch (err) {
      console.error(err);
      toastError("删除失败");
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
  };

  /* ============================
     Refresh character (Backpack)
  ============================ */
  const refreshCharacter = async (): Promise<void> => {
    if (!characterId) return;

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`);
      if (!res.ok) throw new Error("刷新失败");

      const updated = await res.json();
      setCharacter(updated);
    } catch (err) {
      console.error("❌ refreshCharacter error:", err);
      toastError("刷新角色失败，请稍后再试");
    }
  };

  /* ============================
     Render
  ============================ */
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!character) return <p>No character found</p>;

  return (
    <>
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
              onSave={refreshAfterEdit}
              onDelete={handleDelete}
            />
          </div>

          <div className={styles.topRight}>
            <div className={styles.card}>
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

        {/* === Middle Section === */}
        <div className={styles.midGrid}>
          <div className={styles.leftStack}>
            <div className={styles.card}>
              <AbilityHighlights
                characterId={character._id}
                abilities={character.abilities}
                characterGender={character.gender === "男" ? "male" : "female"}
                characterClass={character.class}
                onAbilityUpdate={(ability, newLevel) => {
                  setCharacter((prev) =>
                    prev
                      ? {
                          ...prev,
                          abilities: {
                            ...prev.abilities,
                            [ability]: newLevel,
                          },
                        }
                      : prev
                  );
                }}
              />
            </div>
          </div>

          {/* RIGHT → Editor + Backpack */}
          <div className={styles.rightStack}>

                       <div className={styles.backpackSection}>
              <Backpack
                character={character}
                API_URL={API_URL}
                refreshCharacter={refreshCharacter}
              />
            </div>
            
            <div className={styles.halfCard}>
              <AbilityEditor
                characterId={character._id}
                abilities={character.abilities}
                onAbilityUpdate={(ability, newLevel) => {
                  setCharacter((prev) =>
                    prev
                      ? {
                          ...prev,
                          abilities: {
                            ...prev.abilities,
                            [ability]: newLevel,
                          },
                        }
                      : prev
                  );
                }}
              />
            </div>

 
          </div>
        </div>

        {/* === Collection === */}
        <div className={styles.card}>
          <CollectionStatus character={character} />
        </div>
      </div>

      {/* ================= CONFIRM DELETE ================= */}
      {confirmOpen && (
        <ConfirmModal
          title="删除角色"
          message="确认删除角色？"
          intent="danger"
          confirmText="删除"
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
