"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

import tradableAbilities from "@/app/data/tradable_abilities.json";
import { getBossProgress } from "@/utils/collectionUtils";

const tradableSet = new Set(tradableAbilities as string[]);

// 🧩 Main characters always recommended first
const MAIN_CHARACTERS = new Set(["剑心猫猫糕", "东海甜妹", "五溪", "唐宵风"]);

interface Selection {
  ability?: string;
  level?: 9 | 10;
  characterId?: string;
  noDrop?: boolean;
}

interface Props {
  scheduleId: string;
  floor: number;
  boss: string;
  dropList: string[];
  dropLevel: 9 | 10;
  group: GroupResult & { kills?: any[] };
  onClose: () => void;
  onSave: (floor: number, selection: Selection) => void;
  groupStatus?: "not_started" | "started" | "finished";
  onMarkStarted?: () => void;
  onAfterReset?: (updated: any) => void;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function Drops({
  scheduleId,
  floor,
  boss,
  dropList,
  dropLevel,
  group,
  onClose,
  onSave,
  groupStatus,
  onMarkStarted,
  onAfterReset,
}: Props) {
  const [chosenDrop, setChosenDrop] = useState<
    { ability: string; level: 9 | 10 } | "noDrop" | null
  >(null);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const hasKillRecord = group.kills?.some((k: any) => k.floor === floor);

  const markStartedIfNeeded = () => {
    if (groupStatus === "not_started" && onMarkStarted) onMarkStarted();
  };

  const buildOptions = () => {
    const untradables = dropList.filter((d) => !tradableSet.has(d));
    if (floor >= 81 && floor <= 90)
      return untradables.map((d) => ({ ability: d, level: 9 as 9 }));
    if (floor >= 91 && floor <= 100)
      return untradables.flatMap((d) => [
        { ability: d, level: 9 as 9 },
        { ability: d, level: 10 as 10 },
      ]);
    return [];
  };

  const options = buildOptions();

  const handleAssign = (charId: string) => {
    if (chosenDrop === "noDrop") {
      markStartedIfNeeded();
      onSave(floor, { noDrop: true });
      onClose();
      return;
    }
    if (chosenDrop) {
      markStartedIfNeeded();
      onSave(floor, {
        ability: chosenDrop.ability,
        level: chosenDrop.level,
        characterId: charId,
        noDrop: false,
      });
    }
  };

  const allHaveAbility = (ability: string, level: 9 | 10) =>
    (group as any).characters.every((c: any) => {
      const current = c.abilities?.[ability] ?? 0;
      return current >= level;
    });

  const allHave9Options = options.filter(
    (opt) => opt.level === 9 && allHaveAbility(opt.ability, 9)
  );
  const allHave10Options = options.filter(
    (opt) => opt.level === 10 && allHaveAbility(opt.ability, 10)
  );

  const doReset = async () => {
    try {
      setErrMsg(null);
      setResetting(true);
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      const idx = (group as any).index;
      const delUrl = `${base}/api/standard-schedules/${scheduleId}/groups/${idx}/floor/${floor}`;
      const delRes = await fetch(delUrl, { method: "DELETE" });
      if (!delRes.ok) {
        const errTxt = await delRes.text().catch(() => "");
        throw new Error(errTxt || `Delete failed with ${delRes.status}`);
      }
      onAfterReset?.(null);
      onClose();
    } catch (e: any) {
      console.error("[Drops] reset error:", e);
      setErrMsg(e?.message || "重置失败，请稍后再试。");
    } finally {
      setResetting(false);
      setShowConfirm(false);
    }
  };

  const getBossProgressText = (character: any) =>
    getBossProgress(dropList, character.abilities, character.gender || "男");

  const getProgressColor = (progress: string) => {
    if (progress.includes("十重") || progress.includes("全收集"))
      return styles.progressGreen;
    if (progress.includes("九重")) return styles.progressYellow;
    return styles.progressPink;
  };

  // 🟩 Smart recommendation coloring logic
  const getLevelColor = (character: any, disabled: boolean) => {
    if (!chosenDrop || chosenDrop === "noDrop") return "";

    const ability = chosenDrop.ability;
    const levelThreshold = chosenDrop.level;

    // 1️⃣ Find assignable (non-gray) characters
    const assignable = (group as any).characters.filter((c: any) => {
      const lv = c.abilities?.[ability] ?? 0;
      return lv < levelThreshold;
    });

    if (assignable.length === 0) return "";

    // 2️⃣ Rule 1: Main characters (if assignable) are always green
    const mainAssignable = assignable.filter((c: any) =>
      MAIN_CHARACTERS.has(c.name)
    );
    if (mainAssignable.length > 0) {
      if (disabled) return ""; // gray stays gray
      if (MAIN_CHARACTERS.has(character.name)) return styles.levelGreen;
      return styles.levelYellow;
    }

    // 3️⃣ Rule 2: Normal level comparison among assignable
    const allLevels = assignable.map((c: any) => c.abilities?.[ability] ?? 0);
    const maxLevel = Math.max(...allLevels);
    const allSame = allLevels.every((l) => l === maxLevel);
    const curLevel = character.abilities?.[ability] ?? 0;

    if (disabled) return "";
    if (allSame) return styles.levelYellow;
    if (curLevel === maxLevel) return styles.levelGreen;
    return styles.levelYellow;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>
          {floor}层 - {boss}
        </h3>

        <div className={styles.columns}>
          {/* Left column: abilities */}
          <div className={styles.leftColumn}>
            <div className={styles.dropList}>
              <div className={styles.sectionDivider}>九重</div>
              {options
                .filter(
                  (opt) => opt.level === 9 && !allHaveAbility(opt.ability, 9)
                )
                .map((opt, i) => (
                  <button
                    key={`9-${i}`}
                    className={`${styles.dropBtn} ${
                      chosenDrop !== "noDrop" &&
                      (chosenDrop as any)?.ability === opt.ability &&
                      (chosenDrop as any)?.level === opt.level
                        ? styles.activeBtn
                        : ""
                    }`}
                    onClick={() => setChosenDrop(opt)}
                  >
                    <img
                      src={getAbilityIcon(opt.ability)}
                      alt={opt.ability}
                      className={styles.iconSmall}
                    />
                    <span className={styles.dropText}>九重 · {opt.ability}</span>
                  </button>
                ))}

              <div className={styles.sectionDivider}>十重</div>
              {options
                .filter(
                  (opt) => opt.level === 10 && !allHaveAbility(opt.ability, 10)
                )
                .map((opt, i) => (
                  <button
                    key={`10-${i}`}
                    className={`${styles.dropBtn} ${
                      chosenDrop !== "noDrop" &&
                      (chosenDrop as any)?.ability === opt.ability &&
                      (chosenDrop as any)?.level === opt.level
                        ? styles.activeBtn
                        : ""
                    }`}
                    onClick={() => setChosenDrop(opt)}
                  >
                    <img
                      src={getAbilityIcon(opt.ability)}
                      alt={opt.ability}
                      className={styles.iconSmall}
                    />
                    <span className={styles.dropText}>十重 · {opt.ability}</span>
                  </button>
                ))}

              {(allHave9Options.length > 0 || allHave10Options.length > 0) && (
                <div className={styles.sectionDivider}>已有</div>
              )}

              {allHave9Options.map((opt, i) => (
                <button
                  key={`allhave9-${i}`}
                  className={`${styles.dropBtn} ${styles.allHaveBtn}`}
                  onClick={() => {
                    markStartedIfNeeded();
                    onSave(floor, { ability: opt.ability, level: opt.level });
                    onClose();
                  }}
                >
                  <img
                    src={getAbilityIcon(opt.ability)}
                    alt={opt.ability}
                    className={styles.iconSmall}
                  />
                  <span className={styles.dropText}>
                    九重 · {opt.ability} (全有)
                  </span>
                </button>
              ))}

              {allHave10Options.map((opt, i) => (
                <button
                  key={`allhave10-${i}`}
                  className={`${styles.dropBtn} ${styles.allHaveBtn}`}
                  onClick={() => {
                    markStartedIfNeeded();
                    onSave(floor, { ability: opt.ability, level: opt.level });
                    onClose();
                  }}
                >
                  <img
                    src={getAbilityIcon(opt.ability)}
                    alt={opt.ability}
                    className={styles.iconSmall}
                  />
                  <span className={styles.dropText}>
                    十重 · {opt.ability} (全有)
                  </span>
                </button>
              ))}

              <div className={styles.sectionDivider}>无掉落</div>
              <button
                className={styles.noDropBtn}
                onClick={() => {
                  markStartedIfNeeded();
                  onSave(floor, { noDrop: true });
                  onClose();
                }}
              >
                无掉落/紫书
              </button>
            </div>
          </div>

          {/* Right column: characters */}
          <div className={styles.rightColumn}>
            <div className={styles.sectionDivider}>角色</div>
            <div className={styles.memberGrid}>
              {(group as any).characters.map((c: any) => {
                let levelDisplay: string | null = null;
                let disabled = !chosenDrop;

                if (chosenDrop && chosenDrop !== "noDrop") {
                  const currentLevel = c.abilities?.[chosenDrop.ability] ?? 0;
                  levelDisplay = `${currentLevel}重`;
                  if (currentLevel >= (chosenDrop as any).level) disabled = true;
                }

                const progressText = getBossProgressText(c);
                const progressColor = getProgressColor(progressText);
                const levelColor = getLevelColor(c, disabled);

                return (
                  <button
                    key={c._id || c.id}
                    className={`${styles.memberBtn} ${levelColor} ${
                      disabled ? styles.memberDisabled : ""
                    }`}
                    onClick={() => {
                      if (!disabled) {
                        markStartedIfNeeded();
                        handleAssign(c._id || c.id);
                      }
                    }}
                    disabled={disabled}
                  >
                    <div className={styles.nameRow}>
                      {c.name || c._id}
                      {levelDisplay && <span> ({levelDisplay})</span>}
                    </div>
                    <div className={`${styles.collectionStatus} ${progressColor}`}>
                      {progressText}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {errMsg && <div className={styles.errorBox}>{errMsg}</div>}

        <div className={styles.footer}>
          {hasKillRecord && (
            <button
              onClick={() => setShowConfirm(true)}
              className={styles.deleteBtn}
              disabled={resetting}
            >
              重置本层
            </button>
          )}
          <button onClick={onClose} className={styles.closeBtn}>
            关闭
          </button>
        </div>

        {showConfirm && (
          <div
            className={styles.confirmOverlay}
            onClick={() => !resetting && setShowConfirm(false)}
          >
            <div
              className={styles.confirmModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmTitle}>确认删除</div>
              <div className={styles.confirmText}>
                确定要删除 <b>{floor}层 - {boss}</b> 的掉落记录吗？
              </div>
              <div className={styles.confirmActions}>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={resetting}
                  className={styles.closeBtn}
                >
                  取消
                </button>
                <button
                  onClick={doReset}
                  disabled={resetting}
                  className={styles.deleteBtn}
                >
                  {resetting ? "删除中…" : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
