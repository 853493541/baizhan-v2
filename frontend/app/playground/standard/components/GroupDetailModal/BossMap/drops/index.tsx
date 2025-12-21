"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { buildOptions } from "./drophelpers";
import AbilityList from "./AbilityList";
import MemberList from "./MemberList";

export default function Drops(props: any) {
  const {
    scheduleId,
    floor,
    boss,
    dropList,          // 🟢 normal abilities
    tradableList = [], // 🟣 紫书 abilities (new)
    dropLevel,
    group,
    onClose,
    onSave,
    groupStatus,
    onMarkStarted,
    onAfterReset,
  } = props;

  const [chosenDrop, setChosenDrop] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const hasKillRecord = group.kills?.some((k: any) => k.floor === floor);
  const modalRef = useRef<HTMLDivElement>(null);

  /** 🧠 Debug: check incoming data from BossCard */
  useEffect(() => {
    console.log(
      `[purple] Drops opened → floor ${floor} boss ${boss}`,
      {
        dropList,
        tradableList,
        dropCount: dropList?.length || 0,
        tradableCount: tradableList?.length || 0,
      }
    );
  }, [floor, boss, dropList, tradableList]);

  /** 🧭 Click outside main modal → close */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modalEl = modalRef.current;
      if (modalEl && !modalEl.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const markStartedIfNeeded = () => {
if (groupStatus === "not_started" && onMarkStarted) onMarkStarted(floor);

  };

  /** 🧩 Build full drop options for this floor */
  const options = buildOptions(dropList, floor);

  /**
   * ⚔️ Ability relationships
   */
  const TRANSFER_MAP: Record<string, string> = {
    "蛮熊碎颅击": "水遁水流闪",
  };
  const MIRROR_PAIRS: Record<string, string> = {
    "剑心通明": "巨猿劈山",
    "巨猿劈山": "剑心通明",
  };

  const getTransferSource = (dest: string) =>
    Object.entries(TRANSFER_MAP).find(([src, target]) => target === dest)?.[0] || null;
  const getTransferDest = (src: string) => TRANSFER_MAP[src] || null;
  const getMirror = (name: string) => MIRROR_PAIRS[name] || null;

  /** 🧠 Compute effective level including transfer/mirror rules */
  const getEffectiveLevel = (char: any, ability: string) => {
    const baseLevel = char.abilities?.[ability] ?? 0;
    const gender = char.gender;

    if (gender === "女") {
      const source = getTransferSource(ability);
      if (source) {
        const srcLevel = char.abilities?.[source] ?? 0;
        return Math.max(baseLevel, srcLevel);
      }
      const dest = getTransferDest(ability);
      if (dest) {
        const destLevel = char.abilities?.[dest] ?? 0;
        return Math.max(baseLevel, destLevel);
      }
    }

    const mirror = getMirror(ability);
    if (mirror) {
      const mirrorLv = char.abilities?.[mirror] ?? 0;
      return Math.max(baseLevel, mirrorLv);
    }

    return baseLevel;
  };

  /** 🧠 Check if all members already have a specific ability */
  const allHaveAbility = (ability: string, level: 9 | 10) =>
    group.characters.every((c: any) => getEffectiveLevel(c, ability) >= level);

  /** 🩵 Build “all have” lists */
  let allHave9Options = options.filter(
    (opt: any) => opt.level === 9 && allHaveAbility(opt.ability, 9)
  );
  let allHave10Options = options.filter(
    (opt: any) => opt.level === 10 && allHaveAbility(opt.ability, 10)
  );

  /** 🔄 Reset logic */
  const doReset = async () => {
    try {
      setErrMsg(null);
      setResetting(true);
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      const idx = group.index;
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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        {/* === Header Row === */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <span className={styles.dropLevel}>
              {dropLevel === 10 ? "十阶" : "九阶"}
            </span>
            <span className={styles.separator}>·</span>
            <span className={styles.bossName}>{boss}</span>
          </div>
          <div className={styles.headerRight}>{floor}层</div>
        </div>

        {/* === Two Columns Layout === */}
        <div className={styles.columns}>
          <AbilityList
            options={options}
            tradableList={tradableList}
            allHave9Options={allHave9Options}
            allHave10Options={allHave10Options}
            chosenDrop={chosenDrop}
            setChosenDrop={setChosenDrop}
            floor={floor}
            markStartedIfNeeded={markStartedIfNeeded}
            onSave={onSave}
            onClose={onClose}
            boss={boss}
          />

          <MemberList
            group={group}
            chosenDrop={chosenDrop}
            floor={floor}
            dropList={dropList}
            onSave={onSave}
            onClose={onClose}
            groupStatus={groupStatus}
            onMarkStarted={onMarkStarted}
          />
        </div>

        {errMsg && <div className={styles.errorBox}>{errMsg}</div>}

        {/* === Footer Buttons === */}
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

        {/* === Confirm Modal === */}
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
                确定要删除{" "}
                <b>
                  {floor}层 - {boss}
                </b>{" "}
                的掉落记录吗？
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
