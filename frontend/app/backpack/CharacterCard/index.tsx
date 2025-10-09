"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import BackpackWindow from "./BackpackWindow/Index";
import AddStorageModal from "./AddStorageModal";

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
}

export default function CharacterCard({ char, API_URL }: Props) {
  const [currentChar, setCurrentChar] = useState<Character>(char);
  const [showModal, setShowModal] = useState(false);

  /** 🔄 Refresh full character info from backend */
  const refreshCharacter = async () => {
    try {
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("刷新失败");
      const updated = await res.json();
      setCurrentChar(updated);
    } catch (err) {
      console.error("❌ refreshCharacter error:", err);
      alert("刷新角色失败");
    }
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

        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          + 
        </button>
      </div>

      {/* === Backpack Section === */}
      <BackpackWindow
        char={currentChar}
        API_URL={API_URL}
        onRefresh={refreshCharacter} // ✅ pass refresh callback
      />

      {/* === Modal === */}
      {showModal && (
        <AddStorageModal
          API_URL={API_URL}
          characterId={currentChar._id}
          onClose={() => setShowModal(false)}
          onAdded={async () => {
            await refreshCharacter();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
