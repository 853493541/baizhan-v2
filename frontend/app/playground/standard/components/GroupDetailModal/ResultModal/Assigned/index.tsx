"use client";
import React from "react";
import styles from "./styles.module.css";
import type { AssignedDrop } from "../index";
import type { GroupResult } from "@/utils/solver";

import { toastSuccess, toastError } from "@/app/components/toast/toast";
import ConfirmModal from "@/app/components/ConfirmModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

interface Character {
  _id: string;
  name: string;
  abilities?: Record<string, number>;
  storage?: { ability: string; level: number }[];
}

interface Props {
  drops: AssignedDrop[];
  group: GroupResult;
  onUse: (drop: AssignedDrop) => Promise<void>;
  onStore: (drop: AssignedDrop) => void;
  loading?: string | null;
}

export default function Assigned({
  drops,
  group,
  onUse,
  onStore,
  loading,
}: Props) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmConfig, setConfirmConfig] = React.useState<{
    title: string;
    message: string;
    intent: "danger" | "warning" | "neutral";
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (
    title: string,
    message: string,
    intent: "danger" | "warning" | "neutral" | "success",
    onConfirm: () => void
  ) => {
    setConfirmConfig({ title, message, intent, onConfirm });
    setConfirmOpen(true);
  };

  const getRoleColorClass = (role?: string) => {
    switch (role) {
      case "Tank":
        return styles.tank;
      case "DPS":
        return styles.dps;
      case "Healer":
        return styles.healer;
      default:
        return "";
    }
  };

  const getLevelFromCharacter = (drop: AssignedDrop): number | null => {
    const char = drop.character as Character | undefined;
    if (!char?.abilities) return null;
    const raw = char.abilities[drop.ability];
    const parsed = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasLevel10InStorage = (drop: AssignedDrop): boolean => {
    const char = drop.character as Character | undefined;
    if (!char?.storage) return false;
    return char.storage.some(
      (i) => i.ability === drop.ability && i.level === 10
    );
  };

  const proceedUse = async (drop: AssignedDrop, useStorageAfter: boolean) => {
    try {
      await onUse(drop);
    } catch {
      toastError("使用失败，请稍后再试");
      return;
    }

    if (useStorageAfter) {
      const char = drop.character as Character | undefined;
      if (!char?._id) {
        toastError("无法找到角色 ID");
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/characters/${char._id}/storage/use`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ability: drop.ability,
              level: 10,
            }),
          }
        );

        if (!res.ok) throw new Error();
        toastSuccess(`已使用 ${drop.ability} (10重)`);
      } catch {
        toastError("使用背包技能失败，请稍后再试");
      }
    }
  };

  const handleUseClick = (drop: AssignedDrop) => {
    const currentLevel = getLevelFromCharacter(drop);

    if (drop.level === 9 && hasLevel10InStorage(drop)) {
      requestConfirm(
        "确认使用",
        "包里找到十重，是否一起使用？",
        "warning",
        () => {
          setConfirmOpen(false);
          proceedUse(drop, true);
        }
      );
      return;
    }

    if (drop.level === 10 && (currentLevel ?? 0) < 9) {
      requestConfirm(
        "确认修改",
        "该技能没有达到九重，是否直接修改该技能到十重？",
        "danger",
        () => {
          setConfirmOpen(false);
          proceedUse(drop, false);
        }
      );
      return;
    }

    if (drop.level === 9 && (currentLevel ?? 0) < 8) {
      requestConfirm(
        "确认升级",
        "是否消耗通本和这本书升级？",
        "neutral",
        () => {
          setConfirmOpen(false);
          proceedUse(drop, false);
        }
      );
      return;
    }

    proceedUse(drop, false);
  };

  if (!drops?.length) {
    return (
      <div className={styles.box}>
        <h3 className={styles.title}>已分配</h3>
        <div className={styles.emptyBox}>暂无分配</div>
      </div>
    );
  }

  const grouped = Object.entries(
    drops.reduce((acc: Record<string, AssignedDrop[]>, d) => {
      if (!acc[d.char]) acc[d.char] = [];
      acc[d.char].push(d);
      return acc;
    }, {})
  );

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已分配</h3>

      <div className={styles.rowsGrid}>
        {grouped.map(([charName, list], idx) => {
          const charRole = list[0]?.role;
          const isLastChar = idx === grouped.length - 1;

          return (
            <div
              key={charName}
              className={styles.charRow}
              data-last={isLastChar ? "true" : "false"}
            >
              <div className={styles.charCol}>
                <span
                  className={`${styles.charBubble} ${getRoleColorClass(
                    charRole
                  )}`}
                  title={charName}
                >
                  {charName.slice(0, 4)}
                </span>
              </div>

              <ul
                className={`${styles.assignmentList} ${
                  isLastChar ? styles.lastChar : ""
                }`}
              >
                {list.map((a) => {
                  const currentLevel = getLevelFromCharacter(a);
                  const has10 = a.level === 9 && hasLevel10InStorage(a);

                  let btnText = "使用";
                  let btnStyle = styles.useBtn;

                  if (a.level === 9 && (currentLevel ?? 0) < 8) {
                    btnText = "未八";
                    btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                  } else if (a.level === 10 && (currentLevel ?? 0) < 9) {
                    btnText = "未九";
                    btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                  } else if (has10) {
                    btnText = "有十";
                    btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                  }

                  // ✅ slot-aware identity
                  const loadingKey = `${a.ability}|${a.floor}|${a.slot}`;
                  const isLoading =
                    loading === loadingKey || loading === a.ability;

                  return (
                    <li
                      key={`${a.floor}-${a.slot}-${a.ability}`}
                      className={styles.assignmentItem}
                    >
                      <div className={styles.leftContent}>
                        <img
                          src={getAbilityIcon(a.ability)}
                          className={styles.assignmentIcon}
                          alt={a.ability}
                        />
                        <span className={styles.assignmentText}>
                          {a.level === 9 ? "九重" : "十重"} · {a.ability}
                        </span>
                      </div>

                      <div className={styles.rightContent}>
                        <button
                          disabled={isLoading}
                          onClick={() => handleUseClick(a)}
                          className={btnStyle}
                        >
                          {btnText}
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => onStore(a)}
                          className={styles.storeBtn}
                        >
                          存入
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {confirmOpen && confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          intent={confirmConfig.intent}
          onCancel={() => {
            setConfirmOpen(false);
            setConfirmConfig(null);
          }}
          onConfirm={() => {
            confirmConfig.onConfirm();
            setConfirmConfig(null);
          }}
        />
      )}
    </div>
  );
}
