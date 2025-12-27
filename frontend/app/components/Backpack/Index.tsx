"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";
import {
  toastError,
  toastSuccess,
} from "@/app/components/toast/toast";

interface StorageItem {
  ability: string;
  level: number;
  used?: boolean;
}

interface Character {
  _id: string;
  name?: string;
  abilities?: Record<string, number>;
  storage?: StorageItem[];
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

const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
  "火焰之种",
  "阴雷之种",
  "飞云回转刀",
  "三个铜钱",
  "乾坤一掷",
  "尸鬼封烬",
  "厄毒爆发",
];

interface Props {
  char: Character;
  API_URL: string;
  onChanged?: () => void;
}

export default function BackpackWindow({
  char: initialChar,
  API_URL,
  onChanged,
}: Props) {
  const [char, setChar] = useState<Character>(initialChar);
  const [loading, setLoading] = useState(false);

  /* ===============================
     Confirm state
  =============================== */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "use"; item: StorageItem }
    | { type: "delete"; item: StorageItem }
    | null
  >(null);

  useEffect(() => {
    setChar(initialChar);
  }, [initialChar]);

  const refreshCharacter = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("加载角色失败");
      const data = await res.json();
      setChar(data);
      onChanged?.();
    } catch (e) {
      console.error(e);
      toastError("刷新失败，请稍后再试");

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
     Step 1: request confirm
  =============================== */
  const requestUse = (item: StorageItem) => {
    setPendingAction({ type: "use", item });
    setConfirmOpen(true);
  };

  const requestDelete = (item: StorageItem) => {
    setPendingAction({ type: "delete", item });
    setConfirmOpen(true);
  };

  /* ===============================
     Step 2: confirmed
  =============================== */
  const confirmAction = async () => {
    if (!pendingAction) return;

    const { type, item } = pendingAction;
    setConfirmOpen(false);
    setPendingAction(null);

    if (type === "use") {
      await runWithRefresh(async () => {
        const res = await fetch(
          `${API_URL}/api/characters/${char._id}/storage/use`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ability: item.ability,
              level: item.level,
            }),
          }
        );
        if (!res.ok) throw new Error("使用失败");
      });
    }

    if (type === "delete") {
      await runWithRefresh(async () => {
        const res = await fetch(
          `${API_URL}/api/characters/${char._id}/storage/delete`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ability: item.ability,
              level: item.level,
            }),
          }
        );
        if (!res.ok) throw new Error("删除失败");
      });
    }
  };

  /* ===============================
     Render
  =============================== */
  const allItems = char.storage || [];
  const sortedItems = [...allItems].sort((a, b) => {
    const aCore = CORE_ABILITIES.includes(a.ability);
    const bCore = CORE_ABILITIES.includes(b.ability);
    return aCore === bCore ? 0 : aCore ? -1 : 1;
  });

  const limitedItems = sortedItems.slice(0, 3);

  return (
    <>
      <div className={styles.wrapper}>
        {!limitedItems.length && (
          <p className={styles.empty}>暂无背包记录</p>
        )}

        <ul className={styles.itemList}>
          {limitedItems.map((item, idx) => {
            const currentLevel = char.abilities?.[item.ability] ?? 0;
            const shortName = item.ability.slice(0, 4);

            return (
              <li
                key={`${item.ability}-${idx}`}
                className={`${styles.itemRow} ${
                  item.used ? styles.itemUsed : ""
                }`}
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
                  <div className={styles.abilityText}>
                    <span className={styles.abilityName}>
                      {numToChinese(item.level)}重 • {shortName}
                    </span>
                    <span className={styles.currentLevelRight}>
                      当前：{numToChinese(currentLevel)}重
                    </span>
                  </div>
                </div>

                <div className={styles.buttons}>
                  {!item.used && (
                    <button
                      onClick={() => requestUse(item)}
                      className={`${styles.btn} ${styles.useBtn}`}
                    >
                      使用
                    </button>
                  )}
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
      </div>

      {/* ================= Confirm Modal ================= */}
      {confirmOpen && pendingAction && (
        <ConfirmModal
          title={
            pendingAction.type === "use" ? "确认使用" : "确认删除"
          }
          message={
            pendingAction.type === "use"
              ? `确定要使用 ${pendingAction.item.ability} ${numToChinese(
                  pendingAction.item.level
                )}重 吗？`
              : `确定要删除 ${pendingAction.item.ability} ${numToChinese(
                  pendingAction.item.level
                )}重 吗？`
          }
          intent="danger"
          confirmText={
            pendingAction.type === "use" ? "使用" : "删除"
          }
          onCancel={() => {
            setConfirmOpen(false);
            setPendingAction(null);
          }}
          onConfirm={confirmAction}
        />
      )}
    </>
  );
}
