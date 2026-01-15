"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from "react-icons/fa";

import styles from "./styles.module.css";
import ActionModal from "../ActionModal";
import EditBasicInfoModal from "@/app/characters/components/EditBasicInfoModal";
import ConfirmModal from "@/app/components/ConfirmModal";

import { getTradables } from "@/utils/tradables";
import { getReadableFromStorage } from "@/utils/readables";
import { updateCharacterAbilities } from "@/lib/characterService";
import Manager from "../Manager";
import AddBackpackModal from "../AddBackpackModal";
import { toastError } from "@/app/components/toast/toast";

interface Character {
  _id: string;
  name: string;
  role: string;
  class: string;
  server: string;
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

  const [currentChar, setCurrentChar] = useState<Character>(char);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [localAbilities, setLocalAbilities] = useState<Record<string, number>>(
    char.abilities ? { ...char.abilities } : {}
  );

  /* =========================
     Refresh
  ========================= */
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
      await fetch(`${API_URL}/api/characters/${char._id}`, {
        method: "DELETE",
      });
      setConfirmOpen(false);
      onCharacterUpdate?.(currentChar);
    } catch (err) {
      console.error("❌ Delete failed", err);
    }
  };

  /* =========================
     Action logic
  ========================= */
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
        setLocalAbilities(updatedChar.abilities);
        setCurrentChar(updatedChar);
        onCharacterUpdate?.(updatedChar);
      }
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    }
  };

  /* =========================
     ✅ Inactive override logic
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

              {/* ⚙️ Edit button */}
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
            </div>
          </div>

          {/* === Add / Manager Buttons === */}
          <div className={styles.headerActions}>
            <button
              className={`${styles.iconBtn} ${styles.addBtn}`}
              title="添加技能"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddModal(true);
              }}
            >
              +
            </button>

            <button
              className={`${styles.iconBtn} ${styles.managerBtn}`}
              title="查看全部技能"
              onClick={async (e) => {
                e.stopPropagation();
                await refreshCharacter();
                setShowManager(true);
              }}
            >
              📂
              {currentChar.storage && currentChar.storage.length > 3 && (
                <span className={styles.badge}>
                  {currentChar.storage.length}
                </span>
              )}
            </button>
          </div>
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
        </div>
      </div>

      {/* === Action Modal === */}
      {showModal && (
        <ActionModal
          tradables={tradables}
          readables={readables}
          localAbilities={localAbilities}
          updateAbility={updateAbility}
          API_URL={API_URL}
          charId={currentChar._id}
          onRefresh={refreshCharacter}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* === Add Backpack === */}
      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={currentChar._id}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshCharacter}
        />
      )}

      {/* === Manager === */}
      {showManager && (
        <Manager
          char={currentChar}
          API_URL={API_URL}
          onClose={() => setShowManager(false)}
          onUpdated={(updated) => {
            setCurrentChar(updated);
            setLocalAbilities(updated.abilities || {});
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
