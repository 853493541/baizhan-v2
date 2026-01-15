"use client";

import { useState } from "react";
import { FaCog } from "react-icons/fa";
import EditBasicInfoModal from "@/app/characters/components/EditBasicInfoModal";
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

interface Props {
  character: Character;
  onSave: (data: CharacterEditData) => void;
  onDelete: () => void; // ✅ REQUIRED
}

export default function CharacterBasics({
  character,
  onSave,
  onDelete,
}: Props) {
  const [isModalOpen, setModalOpen] = useState(false);

  const roleClass =
    character.role === "Tank"
      ? styles.tank
      : character.role === "Healer"
      ? styles.healer
      : styles.dps;

  return (
    <>
      <div className={`${styles.card} ${roleClass}`}>
        <button
          className={styles.iconButton}
          onClick={() => setModalOpen(true)}
          aria-label="编辑角色"
        >
          <FaCog />
        </button>

        <div className={styles.info}>
          <h2 className={styles.name}>{character.name}</h2>
          <p>区服: {character.server}</p>
          <p>性别: {character.gender}</p>
          <p>门派: {character.class}</p>
        </div>
      </div>

      {isModalOpen && (
        <EditBasicInfoModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={() => onSave({
            server: character.server,
            role: character.role,
            active: character.active,
          })}
          onDelete={onDelete}   // ✅ THIS WAS MISSING AT RUNTIME
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
