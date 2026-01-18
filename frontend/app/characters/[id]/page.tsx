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

import { toastSuccess, toastError } from "@/app/components/toast/toast";

interface Character {
  _id: string;
  name: string;
  account: string;
  owner: string;
  server: string;
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  energy: number;
  durability: number;
  abilities: Record<string, number>;
  storage?: any[];
}

export default function CharacterDetailPage() {
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : (id as string);
  const router = useRouter();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* =========================
     Load character
  ========================= */
  useEffect(() => {
    if (!characterId) return;

    fetch(`${API_URL}/api/characters/${characterId}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacter(data);
        setLoading(false);
      })
      .catch(() => {
        toastError("角色加载失败");
        setLoading(false);
      });
  }, [characterId, API_URL]);

  /* =========================
     Refresh helpers
  ========================= */
  const refreshCharacter = async () => {
    if (!characterId) return;

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`);
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCharacter(updated);
    } catch {
      toastError("刷新角色失败");
    }
  };

  /* =========================
     Delete flow
  ========================= */
  const confirmDelete = async () => {
    if (!characterId) return;
    setConfirmOpen(false);

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      toastSuccess("角色已删除");
      router.push("/characters");
    } catch {
      toastError("删除失败");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!character) return <p>No character found</p>;

  return (
    <>
      <div className={styles.page}>
        {/* ================= Header ================= */}
        <div className={styles.headerRow}>
          <button className={styles.backButton} onClick={() => router.back()}>
            ← 返回
          </button>
          <h1 className={styles.pageTitle}>角色详情</h1>
        </div>

        {/* ================= TOP SECTION ================= */}
        <div className={styles.topGrid}>
          {/* Character Basics */}
          <div className={styles.topCol}>
            <CharacterBasics
              character={character}
              onSave={refreshCharacter}
              onDelete={() => setConfirmOpen(true)}
            />
          </div>

          {/* Backpack */}
          <div className={styles.topCol}>
            <Backpack
              character={character}
              API_URL={API_URL}
              refreshCharacter={refreshCharacter}
            />
          </div>

          {/* OCR */}
          <div className={styles.topCol}>
            <div className={styles.card}>
              <CharacterOCRSection
                characterId={character._id}
                currentAbilities={character.abilities}
                onAbilitiesUpdated={(updated) => {
                  setCharacter((prev) =>
                    prev
                      ? {
                          ...prev,
                          abilities: {
                            ...prev.abilities,
                            ...updated,
                          },
                        }
                      : prev
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= MIDDLE SECTION ================= */}
        <div className={styles.midGrid}>
          {/* Ability highlights */}
          <div className={styles.leftStack}>
            <div className={styles.card}>
              <AbilityHighlights
                characterId={character._id}
                abilities={character.abilities}
                characterGender={character.gender === "男" ? "male" : "female"}
                characterClass={character.class}
                onAbilityUpdate={(ability, level) => {
                  setCharacter((prev) =>
                    prev
                      ? {
                          ...prev,
                          abilities: {
                            ...prev.abilities,
                            [ability]: level,
                          },
                        }
                      : prev
                  );
                }}
              />
            </div>
          </div>

          {/* Ability editor */}
          <div className={styles.rightStack}>
            <div className={styles.halfCard}>
              <AbilityEditor
                characterId={character._id}
                abilities={character.abilities}
                onAbilityUpdate={(ability, level) => {
                  setCharacter((prev) =>
                    prev
                      ? {
                          ...prev,
                          abilities: {
                            ...prev.abilities,
                            [ability]: level,
                          },
                        }
                      : prev
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= COLLECTION ================= */}
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
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
