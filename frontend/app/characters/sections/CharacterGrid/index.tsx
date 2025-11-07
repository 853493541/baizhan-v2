"use client";

import { useState } from "react";
import { Character } from "@/types/Character";
import { updateCharacterAbilities } from "@/lib/characterService";
import { FaCog } from "react-icons/fa";
import EditBasicInfoModal from "@/app/components/characters/EditBasicInfoModal";
import styles from "./styles.module.css";

interface Props {
  characters: Character[];
  onUpdated: () => void;
}

export default function Cards({ characters, onUpdated }: Props) {
  return (
    <div className={styles.cardGrid}>
      {characters.map((char) => (
        <SingleCard key={char._id} character={char} onUpdated={onUpdated} />
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
  const [isModalOpen, setModalOpen] = useState(false);

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLocalAbilities((prev) => ({ ...prev, [ability]: newLevel }));

    try {
      const updatedChar = await updateCharacterAbilities(character._id, {
        [ability]: newLevel,
      });
      if (updatedChar.abilities)
        setLocalAbilities({ ...updatedChar.abilities });
      onUpdated?.();
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  // === Role color classes ===
  let roleClass = "";
  if (!character.active) roleClass = styles.inactive;
  else if (character.role === "Tank") roleClass = styles.tank;
  else if (character.role === "Healer") roleClass = styles.healer;
  else roleClass = styles.dps;

  const classIcon = `/icons/class_icons/${character.class}.png`;

  return (
    <>
      <div
        className={`${styles.card} ${roleClass}`}
        onClick={() => (window.location.href = `/characters/${character._id}`)}
      >
        {/* ⚙️ Floating Settings Button */}
        <button
          className={styles.iconButton}
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
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
                    character.gender === "男" ? styles.male : styles.female
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

      {/* 🧩 Modal */}
      {isModalOpen && (
        <EditBasicInfoModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={onUpdated}
          characterId={character._id}
          initialData={{
            server: character.server,
            role: character.role,
            active: character.active,
          }}
        />
      )}
    </>
  );
}
