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
  showCoreOnly: boolean; // ✅ passed from parent
  onGlobalRefresh?: () => Promise<void>; // ✅ new optional callback
}

export default function CharacterCard({
  char,
  API_URL,
  showCoreOnly,
  onGlobalRefresh,
}: Props) {
  const [currentChar, setCurrentChar] = useState<Character>(char);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  /** 🔄 Refresh full character info from backend */
  const refreshCharacter = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("刷新失败");
      const updated = await res.json();
      setCurrentChar(updated);
    } catch (err) {
      console.error("❌ refreshCharacter error:", err);
      alert("刷新角色失败，请稍后再试");
    } finally {
      setLoading(false);
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

        <button
          onClick={() => setShowModal(true)}
          className={styles.addBtn}
          title="添加新技能"
        >
          +
        </button>
      </div>

      {/* === Backpack Section === */}
      {loading ? (
        <p className={styles.loading}>刷新中...</p>
      ) : (
        <BackpackWindow
          char={currentChar}
          API_URL={API_URL}
          onRefresh={refreshCharacter}
          showCoreOnly={showCoreOnly}
        />
      )}

      {/* === Add Storage Modal === */}
      {showModal && (
        <AddStorageModal
          API_URL={API_URL}
          characterId={currentChar._id}
          onClose={() => setShowModal(false)}
          onAdded={async () => {
            // 🪄 Local refresh first
            await refreshCharacter();

            // 🪄 Then notify parent (to refresh full character list)
            if (onGlobalRefresh) {
              await onGlobalRefresh();
            }

            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
