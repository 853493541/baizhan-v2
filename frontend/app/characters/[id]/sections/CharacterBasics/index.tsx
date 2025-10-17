"use client";

import { useState } from "react";
import { FaCog } from "react-icons/fa"; // ⚙️ gear icon
import EditBasicInfoModal from "@/app/components/characters/EditBasicInfoModal"; // ✅ use shared modal
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
}

export interface CharacterEditData {
  server: string;
  role: string;
  active: boolean;
}

interface CharacterBasicsProps {
  character: Character;
  onSave: () => void; // ✅ we’ll just trigger parent refresh
  onDelete: () => void;
}

export default function CharacterBasics({
  character,
  onSave,
  onDelete,
}: CharacterBasicsProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const genderLabel = character.gender === "男" ? "男 ♂" : "女 ♀";

  // === Role color class ===
  const roleClass =
    character.role === "Tank"
      ? styles.tank
      : character.role === "Healer"
      ? styles.healer
      : styles.dps;

  return (
    <>
      <div className={`${styles.card} ${roleClass}`}>
        {/* ⚙️ Edit button at top-right */}
        <button
          onClick={() => setModalOpen(true)}
          className={styles.iconButton}
          aria-label="编辑角色"
        >
          <FaCog />
        </button>

        <div className={styles.info}>
          <h2 className={styles.name}>{character.name}</h2>
          <p>区服: {character.server}</p>
          <p>性别: {genderLabel}</p>
          <p>门派: {character.class}</p>
        </div>
      </div>

      {/* ✅ Shared modal for editing basic info */}
      {isModalOpen && (
        <EditBasicInfoModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={onSave} // refresh parent after save
          onDelete={onDelete}
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
