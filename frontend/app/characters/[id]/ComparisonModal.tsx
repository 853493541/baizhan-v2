"use client";

import React, { useState, useEffect } from "react";
import styles from "./ComparisonModal.module.css";

interface UpdateItem {
  name: string;
  old: number;
  new: number;
}

interface ComparisonModalProps {
  toUpdate: UpdateItem[];
  ocrOnly?: string[];
  dbOnly?: string[];
  previewImage?: string | null; // reference image passed from parent
  currentAbilities?: Record<string, number>; // ✅ added to prefill dropdowns
  onConfirm: (dbOnlyUpdates: Record<string, number>) => void;
  onClose: () => void;
}

export default function ComparisonModal({
  toUpdate,
  ocrOnly = [],
  dbOnly = [],
  previewImage,
  currentAbilities = {}, // ✅ default empty
  onConfirm,
  onClose,
}: ComparisonModalProps) {
  const coreAbilities = [
    "斗转金移",
    "花钱消灾",
    "黑煞落贪狼",
    "兔死狐悲",
    "引燃",
    "一闪天诛",
  ];

  const supportingAbilities = [
    "漾剑式",
    "火焰之种",
    "阴雷之种",
    "阴阳术退散",
    "剑心通明",
    "尸鬼封烬",
    "水遁水流闪",
  ];

  const coreUpdates = toUpdate.filter((u) => coreAbilities.includes(u.name));
  const supportingUpdates = toUpdate.filter((u) =>
    supportingAbilities.includes(u.name)
  );
  const otherUpdates = toUpdate.filter(
    (u) => !coreAbilities.includes(u.name) && !supportingAbilities.includes(u.name)
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [dbOnlyValues, setDbOnlyValues] = useState<Record<string, number>>({});
  const [showImageModal, setShowImageModal] = useState(false);

  // ✅ Prefill dbOnlyValues from currentAbilities (only when dbOnly changes)
  useEffect(() => {
    const prefill: Record<string, number> = {};
    dbOnly.forEach((name) => {
      prefill[name] = currentAbilities[name] ?? 0;
    });
    setDbOnlyValues(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbOnly]);

  if (ocrOnly.length > 0) {
    console.log("🟢 OCR-only abilities (debug):", ocrOnly);
  }

  const renderAbilityList = (updates: UpdateItem[]) => (
    <ul className={styles.changeGrid}>
      {updates.map((u, idx) => {
        const iconPath = `/icons/${u.name}.png`;
        const isDowngrade = u.new < u.old; // ✅ detect downgrade
        return (
          <li key={idx} className={styles.changeItem}>
            <img
              src={iconPath}
              alt={u.name}
              className={styles.abilityIcon}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
              }}
            />
            <span>{u.name}</span>
            <span
              className={isDowngrade ? styles.downgradeText : styles.normalText}
            >
              {u.old} → {u.new}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const renderDbOnlyList = () => (
    <ul className={styles.changeGrid}>
      {dbOnly.map((name, idx) => {
        const iconPath = `/icons/${name}.png`;
        const value = dbOnlyValues[name] ?? 0;
        return (
          <li key={idx} className={styles.changeItem}>
            <img
              src={iconPath}
              alt={name}
              className={styles.abilityIcon}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
              }}
            />
            <span>{name}</span>
            <select
              value={value}
              onChange={(e) =>
                setDbOnlyValues({
                  ...dbOnlyValues,
                  [name]: parseInt(e.target.value, 10),
                })
              }
              className={styles.abilitySelect}
            >
              {Array.from({ length: 11 })
                .map((_, i) => 10 - i) // 10 → 0
                .map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
            </select>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {step === 1 ? (
          <>
            <h2>扫描结果</h2>

            <div className={styles.section}>
              <h3>核心技能</h3>
              {coreUpdates.length > 0
                ? renderAbilityList(coreUpdates)
                : <p style={{ color: "#777" }}>无变化</p>}
            </div>

            <div className={styles.section}>
              <h3>辅助技能</h3>
              {supportingUpdates.length > 0
                ? renderAbilityList(supportingUpdates)
                : <p style={{ color: "#777" }}>无变化</p>}
            </div>

            <div className={styles.section}>
              <h3>其他技能</h3>
              {otherUpdates.length > 0
                ? renderAbilityList(otherUpdates)
                : <p style={{ color: "#777" }}>无变化</p>}
            </div>

            <div className={styles.buttons}>
              <button onClick={onClose} className={styles.cancelBtn}>
                取消
              </button>
              {dbOnly.length > 0
                ? <button onClick={() => setStep(2)} className={styles.confirmBtn}>下一步</button>
                : <button onClick={() => onConfirm({})} className={styles.confirmBtn}>✅ Confirm Update</button>}
            </div>
          </>
        ) : (
          <>
            <h2>未扫描到技能（手动输入）</h2>

            <div className={styles.stepTwoLayout}>
              <div className={styles.section} style={{ flex: 1 }}>
                {dbOnly.length > 0
                  ? renderDbOnlyList()
                  : <p style={{ color: "#777" }}>无变化</p>}
              </div>

              {previewImage && (
                <div className={styles.previewImageBox}>
                 
                  <img
                    src={previewImage}
                    alt="参考图片"
                    onClick={() => setShowImageModal(true)}
                  />
                </div>
              )}
            </div>

            <div className={styles.buttons}>
              <button onClick={() => setStep(1)} className={styles.cancelBtn}>
                ⬅ 上一步
              </button>
              <button onClick={() => onConfirm(dbOnlyValues)} className={styles.confirmBtn}>
                ✅ 确认
              </button>
            </div>
          </>
        )}
      </div>

      {/* Enlarged image modal */}
      {showImageModal && previewImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={previewImage}
            alt="参考图片放大"
            style={{
              maxWidth: "80%",
              maxHeight: "80%",
              border: "2px solid #fff",
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </div>
  );
}
