"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, X } from "lucide-react";
import styles from "./styles.module.css";
import AddBackpackModal from "../AddBackpackModal";
import ConfirmModal from "@/app/components/ConfirmModal";
import { createPinyinMap, pinyinFilter } from "../../../../utils/pinyinSearch";
import { toastError } from "@/app/components/toast/toast";

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
  onUpdated: (newChar: Character) => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

// 🈶 Convert number → Chinese numerals
const numToChinese = (num: number): string => {
  const map = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (num <= 10) return map[num];
  if (num < 20) return "十" + map[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${map[tens]}十${ones ? map[ones] : ""}`;
};

export default function Manager({ char, API_URL, onClose, onUpdated }: Props) {
  const [localChar, setLocalChar] = useState<Character>(char);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ===============================
     Confirm modal state
  =============================== */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] =
    useState<(() => void) | null>(null);

  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  /* ===============================
     🔍 Build Pinyin map
  =============================== */
  useEffect(() => {
    async function buildMap() {
      const names = (localChar.storage || []).map((s) => s.ability);
      const map = await createPinyinMap(names);
      setPinyinMap(map);
    }
    if (localChar.storage?.length) buildMap();
  }, [localChar]);

  /* ===============================
     🔍 Filter
  =============================== */
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = localChar.storage || [];
    if (!q) return list;

    const abilityNames = list.map((it) => it.ability);
    const filteredNames = pinyinFilter(abilityNames, pinyinMap, q);
    return list.filter((it) => filteredNames.includes(it.ability));
  }, [search, localChar, pinyinMap]);

  /* ===============================
     🔄 Refresh
  =============================== */
  const refreshCharacter = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("加载角色失败");
      const data = await res.json();
      setLocalChar(data);
      onUpdated(data);
    } catch (e) {
      toastError("刷新失败，请稍后再试");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runWithRefresh = async (action: () => Promise<void>) => {
    try {
      await action();
      await refreshCharacter();
    } catch (err) {
      console.error("❌ action failed:", err);
      toastError("操作失败，请稍后再试");
    }
  };

  /* ===============================
     🔘 Button label/state (UI ONLY)
  =============================== */
  const getUseButtonState = (
    item: StorageItem,
    currentLevel: number
  ): { text: string; className: string; disabled?: boolean } => {
    const currentText = `(${numToChinese(currentLevel)}重)`;

    /* ✅ NEW LOGIC — already level 10 */
    if (currentLevel >= 10) {
      return {
        text: "已十",
        className: styles.deleteBtn,
        disabled: true,
      };
    }

    if (item.level === 9 && currentLevel < 8) {
      return { text: "未八", className: styles.yellowBtn };
    }

    if (item.level === 10 && currentLevel < 9) {
      return { text: "未九", className: styles.yellowBtn };
    }

    if (
      item.level === 9 &&
      localChar.storage?.some(
        (s) => s.ability === item.ability && s.level === 10
      )
    ) {
      return { text: `有十 ${currentText}`, className: styles.yellowBtn };
    }

    return { text: `使用 `, className: styles.useBtn };
  };

  /* ===============================
     ⚔️ Use / Delete (UNCHANGED)
  =============================== */
  const requestUse = (item: StorageItem) => {
    if (item.level === 9) {
      const hasLv10 = localChar.storage?.some(
        (s) => s.ability === item.ability && s.level === 10
      );

      if (hasLv10) {
        setConfirmTitle("检测到更高等级书籍");
        setConfirmMessage(`背里有对应十重, \n是否一起使用？`);
        setOnConfirmAction(() => async () => {
          setConfirmOpen(false);
          await runWithRefresh(async () => {
            await fetch(`${API_URL}/api/characters/${char._id}/storage/use`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ability: item.ability, level: 9 }),
            });
            await fetch(`${API_URL}/api/characters/${char._id}/storage/use`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ability: item.ability, level: 10 }),
            });
          });
        });
        setConfirmOpen(true);
        return;
      }
    }

    requestFinalUse(item);
  };

  const requestFinalUse = (item: StorageItem) => {
    setConfirmTitle("确认使用");
    setConfirmMessage(
      `确定要使用 ${item.ability} · ${numToChinese(item.level)}重 吗？`
    );
    setOnConfirmAction(() => async () => {
      setConfirmOpen(false);
      await runWithRefresh(async () => {
        await fetch(`${API_URL}/api/characters/${char._id}/storage/use`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        });
      });
    });
    setConfirmOpen(true);
  };

  const requestDelete = (item: StorageItem) => {
    setConfirmTitle("确认删除");
    setConfirmMessage(
      `确定要删除 ${item.ability} · ${numToChinese(item.level)}重 吗？`
    );
    setOnConfirmAction(() => async () => {
      setConfirmOpen(false);
      await runWithRefresh(async () => {
        await fetch(`${API_URL}/api/characters/${char._id}/storage/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        });
      });
    });
    setConfirmOpen(true);
  };

  /* ===============================
     🖼️ Render
  =============================== */
  return (
    <>
      <div
        className={styles.overlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2>
              全部技能 {loading && <span>加载中...</span>}
            </h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

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
              const currentLevel = localChar.abilities?.[item.ability] ?? 0;
              const state = getUseButtonState(item, currentLevel);

              return (
                <li key={`${item.ability}-${idx}`} className={styles.itemRow}>
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
                    <div className={styles.abilityText}>
                      <span className={styles.abilityName}>
                        {numToChinese(item.level)}重 • {item.ability}
                      </span>
                    </div>
                  </div>

                  <div className={styles.buttons}>
                    <button
                      disabled={state.disabled}
                      onClick={() => !state.disabled && requestUse(item)}
                      className={`${styles.btn} ${state.className}`}
                    >
                      {state.text}
                    </button>
                    <button
                      onClick={() => requestDelete(item)}
                      className={`${styles.btn} ${styles.deleteBtn}`}
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

      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={char._id}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshCharacter}
        />
      )}

      {confirmOpen && onConfirmAction && (
        <ConfirmModal
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
