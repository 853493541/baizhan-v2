"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import BackpackWindow from "../../components/Backpack/Index";
import ActionModal from "../../components/characters/ActionModal";
import { getTradables } from "@/utils/tradables";
import { getReadableFromStorage } from "@/utils/readables";
import { updateCharacterAbilities } from "@/lib/characterService";
import Manager from "../../components/Backpack/Manager";
import AddBackpackModal from "../../components/Backpack/AddBackpackModal";

interface Character {
  _id: string;
  name: string;
  role: string;
  class: string;
  server: string;
  abilities?: Record<string, number>;
  storage?: any[];
}

const getClassIcon = (cls: string) => `/icons/class_icons/${cls}.png`;

interface Props {
  char: Character;
  API_URL: string;
  onCharacterUpdate?: (updated: Character) => void;
}

export default function CharacterCard({
  char,
  API_URL,
  onCharacterUpdate,
}: Props) {
  const [currentChar, setCurrentChar] = useState<Character>(char);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    char.abilities ? { ...char.abilities } : {}
  );

  const refreshCharacter = async (): Promise<Character | null> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("刷新失败");
      const updated = await res.json();
      setCurrentChar(updated);
      setLocalAbilities(updated.abilities || {});
      onCharacterUpdate?.(updated);
      return updated;
    } catch (err) {
      console.error("❌ refreshCharacter error:", err);
      alert("刷新角色失败，请稍后再试");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const tradables = getTradables(currentChar);
  const readables = getReadableFromStorage(currentChar);
  const hasActions = tradables.length > 0 || readables.length > 0;

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLocalAbilities((prev) => ({ ...prev, [ability]: newLevel }));
    try {
      const updatedChar = await updateCharacterAbilities(currentChar._id, {
        [ability]: newLevel,
      });
      if (updatedChar.abilities) {
        setLocalAbilities({ ...updatedChar.abilities });
        setCurrentChar(updatedChar);
        onCharacterUpdate?.(updatedChar);
      }
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    refreshCharacter();
  };

  return (
    <div className={`${styles.card} ${styles[currentChar.role?.toLowerCase()]}`}>
      {/* === Header === */}
      <div className={styles.headerRow}>
        <div className={styles.nameBlock}>
          <div className={styles.name}>
            <img
              src={getClassIcon(currentChar.class)}
              alt={currentChar.class}
              className={styles.classIcon}
            />
            {currentChar.name}
          </div>
        </div>

        {/* === Add / Manager Buttons === */}
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
            {currentChar.storage && currentChar.storage.length > 3 && (
              <span className={styles.badge}>{currentChar.storage.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* === Backpack Section (always visible, no flicker) === */}
      <div className={styles.backpackWrapper}>
        <BackpackWindow char={currentChar} API_URL={API_URL} />
        {loading && <div className={styles.invisibleLoading}></div>}
      </div>

      {/* === Orange Action Button (Always at Bottom) === */}
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

        {showModal && (
          <ActionModal
            tradables={tradables}
            readables={readables}
            localAbilities={localAbilities}
            updateAbility={updateAbility}
            API_URL={API_URL}
            charId={currentChar._id}
            onRefresh={refreshCharacter}
            onClose={handleCloseModal}
          />
        )}
      </div>

      {/* === Modals === */}
      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={currentChar._id}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshCharacter}
        />
      )}

      {showManager && (
        <Manager
          char={currentChar}
          API_URL={API_URL}
          onClose={() => setShowManager(false)}
          onUpdated={setCurrentChar}
        />
      )}
    </div>
  );
}
