"use client";

import { useState } from "react";
import { Character } from "@/types/Character";
import { updateCharacterAbilities } from "@/lib/characterService";
import styles from "./styles.module.css";

interface CharacterCardProps {
  character: Character;
  onUpdated?: () => void;
}

export default function CharacterCard({ character, onUpdated }: CharacterCardProps) {
  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    character.abilities ? { ...character.abilities } : {}
  );

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLocalAbilities((prev) => ({ ...prev, [ability]: newLevel }));

    try {
      const updatedChar = await updateCharacterAbilities(character._id, {
        [ability]: newLevel,
      });
      if (updatedChar.abilities) setLocalAbilities({ ...updatedChar.abilities });
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  let roleClass = "";
  if (!character.active) {
    roleClass = styles.inactive;
  } else if (character.role === "Tank") {
    roleClass = styles.tank;
  } else if (character.role === "Healer") {
    roleClass = styles.healer;
  } else {
    roleClass = styles.dps;
  }

  const classIcon = `/icons/class_icons/${character.class}.png`;

  return (
    <div
      key={character._id}
      className={`${styles.card} ${roleClass}`}
      onClick={() => (window.location.href = `/characters/${character._id}`)}
    >
      {/* === Top Content === */}
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <img src={classIcon} alt={character.class} className={styles.classIcon} />
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
          <span className={styles.account}>{character.account}</span>
        </div>
      </div>
    </div>
  );
}
