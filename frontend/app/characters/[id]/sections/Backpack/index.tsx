"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import BackpackWindow from "../../../../components/Backpack/Index";
import ActionModal from "../../../components/ActionModal";
import { getTradables } from "@/utils/tradables";
import { getReadableFromStorage } from "@/utils/readables";
import { updateCharacterAbilities } from "@/lib/characterService";
import Manager from "../../../components/Manager";
import AddBackpackModal from "../../../components/AddBackpackModal";

import { toastError } from "@/app/components/toast/toast"; // ✅ added

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
  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    character?.abilities || {}
  );

  useEffect(() => {
    setCurrentChar(character);
    setLocalAbilities(character?.abilities || {});
  }, [character]);

  const refreshCharacterLocal = async (): Promise<any | null> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${currentChar._id}`);
      if (!res.ok) throw new Error("刷新失败");
      const updated = await res.json();
      // force fresh reference so child updates
      setCurrentChar({ ...updated });
      setLocalAbilities({ ...(updated.abilities || {}) });
      await refreshCharacter()?.catch(() => {});
      return updated;
    } catch (err) {
      console.error("❌ refreshCharacterLocal error:", err);
      toastError("刷新角色失败，请稍后再试"); // ✅ replaced alert
      return null;
    } finally {
      setLoading(false);
    }
  };

  const tradables = currentChar ? getTradables(currentChar) : [];
  const readables = currentChar ? getReadableFromStorage(currentChar) : [];
  const hasActions = tradables.length > 0 || readables.length > 0;

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLocalAbilities((prev) => ({ ...prev, [ability]: newLevel }));
    try {
      const updatedChar = await updateCharacterAbilities(currentChar._id, {
        [ability]: newLevel,
      });
      if (updatedChar?.abilities) {
        setLocalAbilities({ ...updatedChar.abilities });
        setCurrentChar((prev: any) => ({ ...prev, ...updatedChar }));
      }
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
            {currentChar?.storage && currentChar.storage.length > 3 && (
              <span className={styles.badge}>{currentChar.storage.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* === Backpack Window (always mounted + stable) === */}
      <div className={styles.backpackWrapper}>
        <BackpackWindow
          char={currentChar}
          API_URL={API_URL}
          onChanged={refreshCharacterLocal} // 🔥 new line
        />
        {loading && <div className={styles.invisibleLoading}></div>}
      </div>

      {/* === Orange Action Button === */}
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
            onRefresh={refreshCharacterLocal}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>

      {/* === Modals === */}
      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={currentChar._id}
          onClose={() => setShowAddModal(false)}
          onAdded={async () => {
            await refreshCharacterLocal();
            setShowAddModal(false);
          }}
        />
      )}

      {showManager && (
        <Manager
          char={currentChar}
          API_URL={API_URL}
          onClose={() => setShowManager(false)}
          onUpdated={(updated: any) => {
            setCurrentChar({ ...updated });
            setLocalAbilities({ ...(updated?.abilities || {}) });
          }}
        />
      )}
    </div>
  );
}
