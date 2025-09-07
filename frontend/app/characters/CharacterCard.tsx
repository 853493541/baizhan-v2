"use client";

import { useState } from "react";
import { Character } from "@/types/Character";
import { getTradables } from "@/utils/tradables";
import { updateCharacterAbilities } from "@/lib/characterService"; // ✅ central helper
import styles from "./CharacterCard.module.css";
import TradableModal from "./TradableModal";

interface CharacterCardProps {
  character: Character;
  onUpdated?: () => void; // parent refresh callback
}

export default function CharacterCard({ character, onUpdated }: CharacterCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    character.abilities ? { ...character.abilities } : {}
  );

  const tradables = getTradables(character);

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;

    // Optimistic update
    setLocalAbilities((prev) => ({
      ...prev,
      [ability]: newLevel,
    }));

    try {
      const updatedChar = await updateCharacterAbilities(character._id, {
        [ability]: newLevel,
      });

      if (updatedChar.abilities) {
        setLocalAbilities({ ...updatedChar.abilities });
      }
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  const handleCopy = (ability: string) => {
    navigator.clipboard.writeText(ability);
    alert(`已复制: ${ability}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    onUpdated?.(); // refresh parent only once
  };

  return (
    <div
      key={character._id}
      className={styles.card}
      onClick={() => (window.location.href = `/characters/${character._id}`)}
    >
      <h3>{character.name}</h3>
      <p>账号昵称: {character.account}</p>
      <p>服务器: {character.server}</p>
      <p>性别: {character.gender}</p>
      <p>职业: {character.class}</p>
      <p>定位: {character.role}</p>
      <p>参与排表: {character.active ? "是" : "否"}</p>
      <p>拥有者: {character.owner || "Unknown"}</p>

      {tradables.length > 0 && (
        <>
          <button
            className={styles.tradableButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
          >
            ⚡ 有紫书可补
          </button>

          {showModal && (
            <TradableModal
              tradables={tradables}
              localAbilities={localAbilities}
              updateAbility={updateAbility}
              onCopy={handleCopy}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}
    </div>
  );
}
