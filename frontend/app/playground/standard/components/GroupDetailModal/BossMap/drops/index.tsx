"use client";
import React, { useState } from "react";
import styles from "./styles.module.css";
import { buildOptions } from "./drophelpers";
import AbilityList from "./AbilityList";
import MemberList from "./MemberList";

export default function Drops(props: any) {
  const {
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
  } = props;

  const [chosenDrop, setChosenDrop] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const hasKillRecord = group.kills?.some((k: any) => k.floor === floor);

  const markStartedIfNeeded = () => {
    if (groupStatus === "not_started" && onMarkStarted) onMarkStarted();
  };

  const options = buildOptions(dropList, floor);

  const allHaveAbility = (ability: string, level: 9 | 10) =>
    group.characters.every((c: any) => (c.abilities?.[ability] ?? 0) >= level);

  const allHave9Options = options.filter(
    (opt: any) => opt.level === 9 && allHaveAbility(opt.ability, 9)
  );
  const allHave10Options = options.filter(
    (opt: any) => opt.level === 10 && allHaveAbility(opt.ability, 10)
  );

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
      <div className={styles.modal}>
        <h3>
          {floor}层 - {boss}
        </h3>

        <div className={styles.columns}>
          <AbilityList
            options={options}
            allHave9Options={allHave9Options}
            allHave10Options={allHave10Options}
            chosenDrop={chosenDrop}
            setChosenDrop={setChosenDrop}
            floor={floor}
            markStartedIfNeeded={markStartedIfNeeded}
            onSave={onSave}
            onClose={onClose}
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
