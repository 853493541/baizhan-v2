"use client";
import React from "react";

import { Plus, X } from "lucide-react";
import styles from "./styles.module.css";
import AddBackpackModal from "../AddBackpackModal";
import ConfirmModal from "@/app/components/ConfirmModal";

import { useManagerLogic } from "./useManagerLogic";
import { numToChinese } from "./abilityUtils";

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
  char: Character;
  API_URL: string;
  onClose: () => void;
  onUpdated: (c: Character) => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function Manager({
  char,
  API_URL,
  onClose,
  onUpdated,
}: Props) {
  const {
    /* Section A */
    search,
    setSearch,
    filteredItems,

    /* Section B */
    insertSearch,
    setInsertSearch,
    insertResults,
    addLevel10Book,

    /* Shared */
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
  } = useManagerLogic(char, API_URL, onUpdated);

  /* ===============================
     modal visibility
  =============================== */
  const [showAddModal, setShowAddModal] = React.useState(false);

  /* ===============================
     LOCAL insert level (UI only)
  =============================== */
  const [insertLevels, setInsertLevels] = React.useState<
    Record<string, number>
  >({});

  const getInsertLevel = (ability: string) =>
    insertLevels[ability] ?? 10;

  const incLevel = (ability: string) =>
    setInsertLevels((p) => ({ ...p, [ability]: 10 }));

  const decLevel = (ability: string) =>
    setInsertLevels((p) => ({ ...p, [ability]: 9 }));

  return (
    <>
      <div
        className={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className={styles.modal}>
          {/* ===============================
             Header
          =============================== */}
          <div className={styles.header}>
            <h2>
              全部技能 {loading && <span>加载中...</span>}
            </h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* =====================================================
             🆕 TOP INSERT SECTION
          ===================================================== */}
          <div className={styles.insertSection}>
            <input
              className={styles.search}
              placeholder="搜索技能以置入书籍..."
              value={insertSearch}
              onChange={(e) => setInsertSearch(e.target.value)}
            />

            {insertResults.map((ability) => (
              <div key={ability} className={styles.abilityRow}>
                <div className={styles.itemLeft}>
                  <img
                    src={getAbilityIcon(ability)}
                    alt={ability}
                    className={styles.abilityIcon}
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).style.display =
                        "none")
                    }
                  />
                  <span className={styles.abilityName}>{ability}</span>
                </div>

                <div className={styles.buttons}>
                  {/* ❗ class names FIXED */}
                  <button
                    className={`${styles.btn} ${styles.minus}`}
                    disabled={getInsertLevel(ability) === 9}
                    onClick={() => decLevel(ability)}
                  >
                    −
                  </button>

                  {/* ❗ class name FIXED */}
                  <span className={styles.level}>
                    {getInsertLevel(ability)}
                  </span>

                  <button
                    className={`${styles.btn} ${styles.plus}`}
                    disabled={getInsertLevel(ability) === 10}
                    onClick={() => incLevel(ability)}
                  >
                    +
                  </button>

                  <button
                    className={styles.insertBtn}
                    onClick={() =>
                      addLevel10Book(
                        ability,
                        getInsertLevel(ability)
                      )
                    }
                  >
                    置入一本十重
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ===============================
             ORIGINAL STORAGE SECTION
          =============================== */}
          <div className={styles.topBar}>
            <input
              className={styles.search}
              placeholder="搜索技能..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              className={styles.addBtn}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} /> 添加书籍
            </button>
          </div>

          {!filteredItems.length && (
            <p className={styles.empty}>没有找到相关技能</p>
          )}

          <ul className={styles.itemList}>
            {filteredItems.map((item, idx) => {
              const currentLevel =
                localChar.abilities?.[item.ability] ?? 0;
              const state = getUseButtonState(item, currentLevel);

              return (
                <li
                  key={`${item.ability}-${idx}`}
                  className={styles.itemRow}
                >
                  <div className={styles.itemLeft}>
                    <img
                      src={getAbilityIcon(item.ability)}
                      alt={item.ability}
                      className={styles.abilityIcon}
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />

                    <span className={styles.abilityName}>
                      {numToChinese(item.level)}重 · {item.ability}
                    </span>
                  </div>

                  <div className={styles.buttons}>
                    <button
                      disabled={state.disabled}
                      className={`${styles.btn} ${styles[state.className]}`}
                      onClick={() =>
                        !state.disabled && requestUse(item)
                      }
                    >
                      {state.text}
                    </button>

                    <button
                      className={`${styles.btn} ${styles.deleteBtn}`}
                      onClick={() => requestDelete(item)}
                    >
                      删除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className={styles.footer}>
            <button onClick={onClose} className={styles.cancelBtn}>
              关闭
            </button>
          </div>
        </div>
      </div>

      {/* ===============================
         Add Backpack Modal
      =============================== */}
      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={char._id}
          onClose={() => setShowAddModal(false)}
          onAdded={() => setShowAddModal(false)}
        />
      )}

      {/* ===============================
         Confirm Modal
      =============================== */}
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
