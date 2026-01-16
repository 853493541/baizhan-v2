"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "./styles.module.css";

import AddBackpackModal from "../AddBackpackModal";
import ConfirmModal from "@/app/components/ConfirmModal";

import ModifySection from "./components/ModifySection";
import BackpackDisplay from "./components/BackpackDisplay";

import { useManagerLogic } from "./useManagerLogic";
import { toastError } from "@/app/components/toast/toast";

/* ===============================
   Types
=============================== */
interface StorageItem {
  ability: string;
  level: number;
}

interface Character {
  _id: string;
  name?: string;
  abilities?: Record<string, number>;
  storage?: StorageItem[];
}

interface Props {
  characterId: string;
  API_URL: string;
  onClose: () => void;
  onUpdated?: (c: Character) => void;
}

export default function Manager({
  characterId,
  API_URL,
  onClose,
  onUpdated,
}: Props) {
  const [char, setChar] = useState<Character | null>(null);
  const [loadingChar, setLoadingChar] = useState(true);

  /* ===============================
     Fetch character (AUTHORITATIVE)
  =============================== */
  const fetchCharacter = async () => {
    try {
      setLoadingChar(true);
      const res = await fetch(`${API_URL}/api/characters/${characterId}`);
      if (!res.ok) throw new Error("Failed to load character");

      const data = await res.json();
      setChar(data);
      onUpdated?.(data);
    } catch (err) {
      console.error("❌ Failed to load character", err);
      toastError("加载角色失败");
    } finally {
      setLoadingChar(false);
    }
  };

  useEffect(() => {
    fetchCharacter();
  }, [characterId]);

  /* ===============================
     Manager logic (after char loaded)
  =============================== */
  const {
    search,
    setSearch,
    filteredItems,

    insertSearch,
    setInsertSearch,
    insertResults,
    addLevel10Book,

    localChar,
    loading,
    confirmOpen,
    confirmTitle,
    confirmMessage,
    onConfirmAction,
    setConfirmOpen,
    getUseButtonState,
    requestUse,
    requestDelete,
  } = useManagerLogic(char, API_URL, (updated) => {
    setChar(updated);
    onUpdated?.(updated);
  });

  /* ===============================
     Insert levels (EDITOR STATE)
  =============================== */
  const [insertLevels, setInsertLevels] = useState<Record<string, number>>({});

  const getInsertLevel = (ability: string) =>
    insertLevels[ability] ??
    char?.abilities?.[ability] ??
    0;

  if (loadingChar || !char) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2>加载角色中…</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.header}>
            <h2>全部技能</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Modify */}
          <ModifySection
            characterId={char._id}
            insertSearch={insertSearch}
            setInsertSearch={setInsertSearch}
            insertResults={insertResults}
            insertLevels={insertLevels}
            setInsertLevels={setInsertLevels}
            getInsertLevel={getInsertLevel}
            addLevel10Book={addLevel10Book}
          />

          {/* Backpack */}
          <BackpackDisplay
            search={search}
            setSearch={setSearch}
            filteredItems={filteredItems}
            localChar={localChar}
            getUseButtonState={getUseButtonState}
            requestUse={requestUse}
            requestDelete={requestDelete}
            onAddClick={() => {}}
          />

          <div className={styles.footer}>
            <button onClick={onClose} className={styles.cancelBtn}>
              关闭
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && onConfirmAction && (
        <ConfirmModal
          intent="neutral"
          title={confirmTitle}
          message={confirmMessage}
          confirmText="确认"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={onConfirmAction}
        />
      )}
    </>
  );
}
