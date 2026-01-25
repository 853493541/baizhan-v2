"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from "react-icons/fa";

import styles from "./styles.module.css";
import ActionModal from "../ActionModal";
import EditBasicInfoModal from "@/app/characters/components/EditBasicInfoModal";
import ConfirmModal from "@/app/components/ConfirmModal";
import Manager from "../Manager";

/* =========================
   Types
========================= */
interface Character {
  _id: string;
  name: string;
  role: string;
  class: string;
  server: string;
  active?: boolean;

  // ✅ derived from backend
  hasActions?: boolean;
}

const getClassIcon = (cls: string) => `/icons/class_icons/${cls}.png`;

interface Props {
  char: Character;
  API_URL: string;

  // 🔑 page-level refresh
  onUpdated: () => Promise<void>;
}

export default function CharacterCard({
  char,
  API_URL,
  onUpdated,
}: Props) {
  const router = useRouter();

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0);

  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* =========================
     Optimistic hasActions
  ========================= */
  const [hasActionsLocal, setHasActionsLocal] = useState(
    !!char.hasActions
  );

  // keep in sync with backend refreshes
  useEffect(() => {
    setHasActionsLocal(!!char.hasActions);
  }, [char.hasActions]);

  /* =========================
     Defensive page refresh
  ========================= */
  const refreshPage = async () => {
    if (typeof onUpdated === "function") {
      await onUpdated();
    }
  };

  /* =========================
     Role / inactive styling
  ========================= */
  const roleKey = (char.role || "").toLowerCase();
  const roleClass =
    char.active === false
      ? styles.inactive
      : (styles as any)[roleKey] || "";

  return (
    <>
      <div
        className={`${styles.card} ${roleClass}`}
        onClick={() => router.push(`/characters/${char._id}`)}
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
                src={getClassIcon(char.class)}
                alt={char.class}
                className={styles.classIcon}
              />
              {char.name}
            </div>

            {!isTouchDevice && (
              <div className={styles.editHint}>右键编辑基础信息</div>
            )}
          </div>

          {/* === Header Actions === */}
          <div className={styles.headerActions}>
            <button
              className={`${styles.iconBtn} ${styles.managerBtn}`}
              title="打开管理器"
              onClick={(e) => {
                e.stopPropagation();
                setShowManager(true);
              }}
              onContextMenu={(e) => e.stopPropagation()}
            >
              📂
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
          {hasActionsLocal ? (
            <button
              className={styles.tradableButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              ⚡ 紫书可读
            </button>
          ) : (
            <div className={styles.tradeablePlaceholder} />
          )}
        </div>
      </div>

      {/* === Action Modal === */}
{showModal && (
  <ActionModal
    API_URL={API_URL}
    charId={char._id}
    onRefreshPage={refreshPage}
    onClose={(reason) => {
      setShowModal(false);

      // ✅ ONLY hide when modal tells us it's empty
      if (reason === "empty") {
        setHasActionsLocal(false);
      }
    }}
  />
)}

      {/* === Manager === */}
      {showManager && (
        <Manager
          characterId={char._id}
          API_URL={API_URL}
          onClose={() => setShowManager(false)}
          onUpdated={refreshPage}
        />
      )}

      {/* === Edit Basic Info === */}
      {editOpen && (
        <EditBasicInfoModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={refreshPage}
          onDelete={() => setConfirmOpen(true)}
          characterId={char._id}
          initialData={{
            server: char.server,
            role: char.role,
            active: char.active,
          }}
        />
      )}

      {/* === Confirm Delete === */}
      {confirmOpen && (
        <ConfirmModal
          title="删除角色"
          message={`确认删除角色「${char.name}」？`}
          intent="danger"
          confirmText="删除"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            await fetch(`${API_URL}/api/characters/${char._id}`, {
              method: "DELETE",
            });
            setConfirmOpen(false);
            await refreshPage();
          }}
        />
      )}
    </>
  );
}
