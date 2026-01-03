"use client";

import { useState } from "react";
import { Character } from "@/types/Character";
import { updateCharacterAbilities } from "@/lib/characterService";
import { FaCog } from "react-icons/fa";

import EditBasicInfoModal from "@/app/components/characters/EditBasicInfoModal";
import ConfirmModal from "@/app/components/ConfirmModal";

import styles from "./styles.module.css";

interface Props {
  characters: Character[];
  onUpdated: () => void;
}

export default function Cards({ characters, onUpdated }: Props) {
  return (
    <div className={styles.cardGrid}>
      {characters.map((char) => (
        <SingleCard
          key={char._id}
          character={char}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

interface SingleCardProps {
  character: Character;
  onUpdated?: () => void;
}

function SingleCard({ character, onUpdated }: SingleCardProps) {
  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    character.abilities ? { ...character.abilities } : {}
  );

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* ============================
     Ability update
  ============================ */
  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;

    setLocalAbilities((prev) => ({ ...prev, [ability]: newLevel }));

    try {
      const updatedChar = await updateCharacterAbilities(character._id, {
        [ability]: newLevel,
      });

      if (updatedChar.abilities) {
        setLocalAbilities({ ...updatedChar.abilities });
      }

      onUpdated?.();
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  /* ============================
     Delete flow (BossMap-style)
  ============================ */
  const requestDelete = () => {
    setEditOpen(false);   // close edit modal first
    setConfirmOpen(true); // then open confirm modal
  };

  const confirmDelete = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/${character._id}`,
        { method: "DELETE" }
      );

      setConfirmOpen(false);
      onUpdated?.();
    } catch (err) {
      console.error("❌ Delete failed", err);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
  };

  /* ============================
     Role color
  ============================ */
  let roleClass = "";
  if (!character.active) roleClass = styles.inactive;
  else if (character.role === "Tank") roleClass = styles.tank;
  else if (character.role === "Healer") roleClass = styles.healer;
  else roleClass = styles.dps;

  const classIcon = `/icons/class_icons/${character.class}.png`;

  return (
    <>
      {/* ================= CARD ================= */}
      <div
        className={`${styles.card} ${roleClass}`}
        onClick={() =>
          (window.location.href = `/characters/${character._id}`)
        }
      >
        {/* ⚙️ Settings */}
        <button
          className={styles.iconButton}
          onClick={(e) => {
            e.stopPropagation();
            setEditOpen(true);
          }}
          aria-label="编辑基础信息"
        >
          <FaCog />
        </button>

        <div className={styles.content}>
          <div className={styles.headerRow}>
            <img
              src={classIcon}
              alt={character.class}
              className={styles.classIcon}
            />

            <div className={styles.nameBlock}>
              <h3 className={styles.name}>
                {character.name}
                <span
                  className={`${styles.gender} ${
                    character.gender === "男"
                      ? styles.male
                      : styles.female
                  }`}
                >
                  {character.gender === "男" ? "♂" : "♀"}
                </span>
              </h3>
              <p className={styles.server}>{character.server}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && (
        <EditBasicInfoModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={onUpdated ?? (() => {})}
          onDelete={requestDelete}   // ✅ IMPORTANT FIX
          characterId={character._id}
          initialData={{
            server: character.server,
            role: character.role,
            active: character.active,
          }}
        />
      )}

      {/* ================= CONFIRM DELETE ================= */}
      {confirmOpen && (
        <ConfirmModal
          title="删除角色"
          message={`确认删除角色「${character.name}」？`}
          intent="danger"
          confirmText="删除"
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
