"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from "react-icons/fa";

import styles from "./styles.module.css";
import ActionModal from "../ActionModal";
import EditBasicInfoModal from "@/app/characters/components/EditBasicInfoModal";
import ConfirmModal from "@/app/components/ConfirmModal";
import Manager from "../Manager";
import { toastError } from "@/app/components/toast/toast";

interface TradableAbility {
  ability: string;
  requiredLevel: number;
  currentLevel: number;
}

interface Character {
  _id: string;
  name: string;
  role: string;
  class: string;
  server: string;
  gender?: "男" | "女";
  active?: boolean;
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
  const router = useRouter();

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0);

  const [currentChar, setCurrentChar] = useState<Character>(char);
useEffect(() => {
  setCurrentChar(char);
}, [char]);

  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* =========================
     Backend-driven tradables
  ========================= */
  const [tradables, setTradables] = useState<TradableAbility[]>([]);
  const hasActions = tradables.length > 0;

  /* =========================
     Fetch Tradables (AUTO)
  ========================= */
  useEffect(() => {
    const loadTradables = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/characters/${currentChar._id}/tradables`
        );
        if (!res.ok) return;

        const data = await res.json();
        setTradables(data.tradables || []);
      } catch (err) {
        console.error("❌ loadTradables failed:", err);
      }
    };

    loadTradables();
  }, [API_URL, currentChar._id]);

  /* =========================
     Refresh Character
  ========================= */
  const refreshCharacter = async (): Promise<Character | null> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("刷新失败");

      const updated = await res.json();
      setCurrentChar(updated);
      onCharacterUpdate?.(updated);
      return updated;
    } catch (err) {
      console.error("❌ refreshCharacter error:", err);
      toastError("刷新角色失败，请稍后再试");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Delete flow
  ========================= */
  const requestDelete = () => {
    setEditOpen(false);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await fetch(`${API_URL}/api/characters/${currentChar._id}`, {
        method: "DELETE",
      });
      setConfirmOpen(false);
      onCharacterUpdate?.(currentChar);
    } catch (err) {
      console.error("❌ Delete failed", err);
    }
  };

  /* =========================
     Role / inactive styling
  ========================= */
  const roleKey = (currentChar.role || "").toLowerCase();
  const roleClass =
    currentChar.active === false
      ? styles.inactive
      : (styles as any)[roleKey] || "";

  return (
    <>
      <div
        className={`${styles.card} ${roleClass}`}
        onClick={() => router.push(`/characters/${currentChar._id}`)}
        onContextMenu={(e) => {
          if (!isTouchDevice) {
            e.preventDefault();
            setEditOpen(true);
          }
        }}
      >
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

            {!isTouchDevice && (
              <div className={styles.editHint}>右键编辑基础信息</div>
            )}
          </div>

          {/* === Header Actions === */}
          <div className={styles.headerActions}>
            <button
              className={`${styles.iconBtn} ${styles.managerBtn}`}
              title="查看全部技能"
              onClick={async (e) => {
                e.stopPropagation();
                await refreshCharacter();
                setShowManager(true);
              }}
              onContextMenu={(e) => e.stopPropagation()}
            >
              📂
              {currentChar.storage && currentChar.storage.length > 3 && (
                <span className={styles.badge}>
                  {currentChar.storage.length}
                </span>
              )}
            </button>

            {isTouchDevice && (
              <button
                className={styles.iconBtn}
                title="编辑角色"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
              >
                <FaCog />
              </button>
            )}
          </div>
        </div>

        {/* === Bottom Action Button === */}
        <div className={styles.tradeableWrapper}>
          {hasActions ? (
            <button
              className={styles.tradableButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              onContextMenu={(e) => e.stopPropagation()}
            >
              ⚡ 有书籍可读
            </button>
          ) : (
            <div className={styles.tradeablePlaceholder} />
          )}
        </div>
      </div>

      {/* === Action Modal === */}
      {showModal && (
        <ActionModal
          tradables={tradables}
          API_URL={API_URL}
          charId={currentChar._id}
          onRefresh={async () => {
            await refreshCharacter();

            // re-fetch tradables after use
            const res = await fetch(
              `${API_URL}/api/characters/${currentChar._id}/tradables`
            );
            const data = await res.json();
            setTradables(data.tradables || []);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* === Manager === */}
      {showManager && (
<Manager
  characterId={currentChar._id}
  API_URL={API_URL}
  onClose={() => setShowManager(false)}
  onUpdated={(updated) => {
    setCurrentChar(updated);
    onCharacterUpdate?.(updated);
  }}
/>

      )}

      {/* === Edit Basic Info === */}
      {editOpen && (
        <EditBasicInfoModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={refreshCharacter}
          onDelete={requestDelete}
          characterId={currentChar._id}
          initialData={{
            server: currentChar.server,
            role: currentChar.role,
            active: currentChar.active,
          }}
        />
      )}

      {/* === Confirm Delete === */}
      {confirmOpen && (
        <ConfirmModal
          title="删除角色"
          message={`确认删除角色「${currentChar.name}」？`}
          intent="danger"
          confirmText="删除"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
