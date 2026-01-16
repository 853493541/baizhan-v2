"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import BackpackWindow from "./Preview/Index";
import ActionModal from "../../../components/ActionModal";
import Manager from "../../../components/Manager";
import AddBackpackModal from "../../../components/AddBackpackModal";
import { toastError } from "@/app/components/toast/toast";

interface TradableAbility {
  ability: string;
  requiredLevel: number;
  currentLevel: number;
}

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
  const [currentChar, setCurrentChar] = useState<any>(character);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  /* =========================
     Backend-driven tradables
  ========================= */
  const [tradables, setTradables] = useState<TradableAbility[]>([]);
  const hasActions = tradables.length > 0;

  /* =========================
     Sync character prop
  ========================= */
  useEffect(() => {
    setCurrentChar(character);
  }, [character]);

  /* =========================
     Fetch tradables (backend)
  ========================= */
  const fetchTradables = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/characters/${currentChar._id}/tradables`
      );
      if (!res.ok) return;

      const data = await res.json();
      setTradables(data.tradables || []);
    } catch (err) {
      console.error("❌ fetchTradables failed:", err);
    }
  };

  useEffect(() => {
    if (currentChar?._id) {
      fetchTradables();
    }
  }, [currentChar?._id]);

  /* =========================
     Refresh Character (local)
  ========================= */
  const refreshCharacterLocal = async (): Promise<any | null> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${currentChar._id}`);
      if (!res.ok) throw new Error("刷新失败");

      const updated = await res.json();
      setCurrentChar({ ...updated });

      await refreshCharacter()?.catch(() => {});
      await fetchTradables();

      return updated;
    } catch (err) {
      console.error("❌ refreshCharacterLocal error:", err);
      toastError("刷新角色失败，请稍后再试");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      {/* === Header === */}
      <div className={styles.headerRow}>
        <h3 className={styles.title}>背包</h3>

        <div className={styles.headerActions}>


          <button
            className={`${styles.iconBtn} ${styles.managerBtn}`}
            title="查看全部技能"
            onClick={() => setShowManager(true)}
          >
            📂
            {currentChar?.storage && currentChar.storage.length > 3 && (
              <span className={styles.badge}>
                {currentChar.storage.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* === Backpack Window === */}
      <div className={styles.backpackWrapper}>
        <BackpackWindow
          char={currentChar}
          API_URL={API_URL}
          onChanged={refreshCharacterLocal}
        />
        {loading && <div className={styles.invisibleLoading} />}
      </div>

      {/* === Action Button === */}
      <div className={styles.tradeableWrapper}>
        {hasActions ? (
          <button
            className={styles.tradableButton}
            onClick={() => setShowModal(true)}
          >
            ⚡ 有书籍可读
          </button>
        ) : (
          <div className={styles.tradeablePlaceholder} />
        )}
      </div>

      {/* === Action Modal === */}
      {showModal && (
        <ActionModal
          tradables={tradables}
          API_URL={API_URL}
          charId={currentChar._id}
          onRefresh={refreshCharacterLocal}
          onClose={() => setShowModal(false)}
        />
      )}



      {/* === Manager === */}
{showManager && (
  <Manager
    char={currentChar}
    characterId={currentChar._id}   // ✅ explicit
    API_URL={API_URL}
    onClose={() => setShowManager(false)}
    onUpdated={(updated: any) => {
      setCurrentChar({ ...updated });
    }}
  />
)}
    </div>
  );
}
