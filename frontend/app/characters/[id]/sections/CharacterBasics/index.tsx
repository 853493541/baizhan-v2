"use client";

import { useState } from "react";
import { FaCog } from "react-icons/fa";
import EditBasicInfoModal from "@/app/characters/components/EditBasicInfoModal";
import styles from "./styles.module.css";

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
}

/* 固定上限 */
const ENERGY_MAX = 503_100;
const DURABILITY_MAX = 486_900;

export interface CharacterEditData {
  server: string;
  role: string;
  active: boolean;
}

interface Props {
  character: Character;
  onSave: (data: CharacterEditData) => void;
  onDelete: () => void;
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

  const energyPct = Math.min(
    100,
    (character.energy / ENERGY_MAX) * 100
  );
  const durabilityPct = Math.min(
    100,
    (character.durability / DURABILITY_MAX) * 100
  );

  return (
    <>
      <div className={`${styles.card} ${roleClass}`}>
        {/* ⚙️ SAME ICON STYLE AS CharacterCard */}
        <button
          className={styles.iconBtn}
          onClick={() => setModalOpen(true)}
          aria-label="编辑角色"
        >
          <FaCog />
        </button>

        {/* ===== Name ===== */}
        <h2 className={styles.name}>{character.name}</h2>

        {/* ===== Class / Gender / Role ===== */}
        <div className={styles.lineMuted}>
          {character.class} · {character.gender} · {character.role}
        </div>

        {/* ===== Server / Owner / Active ===== */}
        <div className={styles.lineMuted}>
          {character.server} · {character.owner} ·{" "}
          {character.active ? "激活" : "未激活"}
        </div>

        {/* ===== Stats ===== */}
        <div className={styles.statsBlock}>
          {/* Energy */}
          <div className={styles.statLine}>
            <span className={styles.statLabel}>精神</span>

            <span className={styles.statNumber}>
              {character.energy} / {ENERGY_MAX}
            </span>

            <div className={styles.barBg}>
              <div
                className={styles.energyBar}
                style={{ width: `${energyPct}%` }}
              />
            </div>
          </div>

          {/* Durability */}
          <div className={styles.statLine}>
            <span className={styles.statLabel}>耐力</span>

            <span className={styles.statNumber}>
              {character.durability} / {DURABILITY_MAX}
            </span>

            <div className={styles.barBg}>
              <div
                className={styles.durabilityBar}
                style={{ width: `${durabilityPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EditBasicInfoModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={() =>
            onSave({
              server: character.server,
              role: character.role,
              active: character.active,
            })
          }
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
