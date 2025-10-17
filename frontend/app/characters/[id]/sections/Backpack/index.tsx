"use client";

import { useState } from "react";
import BackpackWindow from "../../../../components/Backpack/Index";
import Manager from "../../../../components/Backpack/Manager";
import AddBackpackModal from "../../../../components/Backpack/AddBackpackModal";
import ActionModal from "../../../../components/characters/ActionModal";
import { getTradables } from "@/utils/tradables";
import { getReadableFromStorage } from "@/utils/readables";
import { updateCharacterAbilities } from "@/lib/characterService";
import styles from "./styles.module.css";

interface BackpackProps {
  character: any;
  API_URL: string;
  refreshCharacter: () => Promise<void>;
}

export default function Backpack({
  character,
  API_URL,
  refreshCharacter,
}: BackpackProps) {
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    character?.abilities || {}
  );

  const tradables = character ? getTradables(character) : [];
  const readables = character ? getReadableFromStorage(character) : [];
  const hasActions = tradables.length > 0 || readables.length > 0;

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLocalAbilities((prev) => ({ ...prev, [ability]: newLevel }));
    try {
      const updatedChar = await updateCharacterAbilities(character._id, {
        [ability]: newLevel,
      });
      if (updatedChar.abilities) setLocalAbilities(updatedChar.abilities);
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  return (
    <div className={styles.card}>
      {/* === Header === */}
      <div className={styles.headerRow}>
        <h3 className={styles.title}>背包</h3>
        <div className={styles.headerActions}>
          <button
            className={`${styles.iconBtn} ${styles.addBtn}`}
            title="添加技能"
            onClick={() => setShowAddModal(true)}
          >
            +
          </button>
          <button
            className={`${styles.iconBtn} ${styles.managerBtn}`}
            title="查看全部技能"
            onClick={() => setShowManager(true)}
          >
            📂
            {character.storage && character.storage.length > 3 && (
              <span className={styles.badge}>{character.storage.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* === Backpack Window === */}
      <BackpackWindow char={character} API_URL={API_URL} />

      {/* === Tradable / Readable Action === */}
      <div className={styles.tradeableWrapper}>
        {hasActions ? (
          <button
            className={styles.tradableButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
          >
            ⚡ 有书籍可读
          </button>
        ) : (
          <div className={styles.tradeablePlaceholder}></div>
        )}
      </div>

      {/* === Modals === */}
      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={character._id}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshCharacter}
        />
      )}

      {showManager && (
        <Manager
          char={character}
          API_URL={API_URL}
          onClose={() => setShowManager(false)}
          onUpdated={refreshCharacter}
        />
      )}

      {showModal && (
        <ActionModal
          tradables={tradables}
          readables={readables}
          localAbilities={localAbilities}
          updateAbility={updateAbility}
          API_URL={API_URL}
          charId={character._id}
          onRefresh={refreshCharacter}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
