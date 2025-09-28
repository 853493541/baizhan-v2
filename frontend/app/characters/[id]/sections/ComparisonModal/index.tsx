"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { updateCharacterAbilities } from "@/lib/characterService";

interface UpdateItem {
  name: string;
  old: number;
  new: number;
}

interface ComparisonModalProps {
  characterId: string;
  toUpdate: UpdateItem[];
  ocrOnly?: string[];
  dbOnly?: string[];
  previewImage?: string | null;
  currentAbilities?: Record<string, number>;
  onAbilitiesUpdated: (updates: Record<string, number>) => void;
  onClose: () => void;
}

export default function ComparisonModal({
  characterId,
  toUpdate,
  ocrOnly = [],
  dbOnly = [],
  previewImage,
  currentAbilities = {},
  onAbilitiesUpdated,
  onClose,
}: ComparisonModalProps) {
  const coreAbilities = ["斗转金移", "花钱消灾", "黑煞落贪狼", "兔死狐悲", "引燃", "一闪天诛"];
  const supportingAbilities = ["漾剑式", "火焰之种", "阴雷之种", "阴阳术退散", "剑心通明", "尸鬼封烬", "水遁水流闪"];

  const coreUpdates = toUpdate.filter((u) => coreAbilities.includes(u.name));
  const supportingUpdates = toUpdate.filter((u) => supportingAbilities.includes(u.name));
  const otherUpdates = toUpdate.filter(
    (u) => !coreAbilities.includes(u.name) && !supportingAbilities.includes(u.name)
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [dbOnlyValues, setDbOnlyValues] = useState<Record<string, number>>({});
  const [showImageModal, setShowImageModal] = useState(false);

  // Prefill dbOnly values
  useEffect(() => {
    const prefill: Record<string, number> = {};
    dbOnly.forEach((name) => {
      prefill[name] = currentAbilities[name] ?? 0;
    });
    setDbOnlyValues(prefill);
  }, [dbOnly, currentAbilities]);

  // 🔹 Step 1 submit (OCR matched updates)
  const handleStep1Confirm = async () => {
    const updates: Record<string, number> = {};
    toUpdate.forEach((u) => {
      updates[u.name] = u.new;
    });

    if (Object.keys(updates).length === 0) {
      console.log("⚪ Step 1: no matched updates, moving to Step 2...");
      if (dbOnly.length > 0) {
        setStep(2);
      } else {
        onClose();
      }
      return;
    }

    console.log("🟢 Submitting Step 1 updates:", updates);
    try {
      await updateCharacterAbilities(characterId, updates); // ✅ send raw updates
      console.log("✅ Step 1 updates submitted successfully");
      onAbilitiesUpdated(updates);

      if (dbOnly.length > 0) {
        setStep(2);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("❌ Step 1 submission failed:", err);
    }
  };

  // 🔹 Step 2 submit (manual DB-only updates)
  const handleStep2Confirm = async () => {
    if (Object.keys(dbOnlyValues).length === 0) {
      console.log("⚪ Step 2: no manual updates to submit.");
      onClose();
      return;
    }

    console.log("🟦 Submitting Step 2 manual updates:", dbOnlyValues);
    try {
      await updateCharacterAbilities(characterId, dbOnlyValues); // ✅ send raw updates
      console.log("✅ Step 2 manual updates submitted successfully");
      onAbilitiesUpdated(dbOnlyValues);
      onClose();
    } catch (err) {
      console.error("❌ Step 2 submission failed:", err);
    }
  };

  const renderAbilityList = (updates: UpdateItem[]) => (
    <ul className={styles.changeGrid}>
      {updates.map((u, idx) => {
        const iconPath = `/icons/${u.name}.png`;
        const isDowngrade = u.new < u.old;
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
            <span className={isDowngrade ? styles.downgradeText : styles.normalText}>
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
                setDbOnlyValues((prev) => ({
                  ...prev,
                  [name]: parseInt(e.target.value, 10),
                }))
              }
              className={styles.abilitySelect}
            >
              {Array.from({ length: 11 })
                .map((_, i) => 10 - i)
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
            <div className={styles.headerRow}>
              <h2 className={styles.modalTitle}>扫描结果</h2>
              <div className={styles.headerButtons}>
                <button onClick={onClose} className={styles.cancelBtn}>取消</button>
                <button onClick={handleStep1Confirm} className={styles.confirmBtn}>确认</button>
              </div>
            </div>

            <div className={styles.section}>
              <h3>核心技能</h3>
              {coreUpdates.length > 0 ? renderAbilityList(coreUpdates) : <p style={{ color: "#777" }}>无变化</p>}
            </div>

            <div className={styles.section}>
              <h3>辅助技能</h3>
              {supportingUpdates.length > 0 ? renderAbilityList(supportingUpdates) : <p style={{ color: "#777" }}>无变化</p>}
            </div>

            <div className={styles.section}>
              <h3>其他技能</h3>
              {otherUpdates.length > 0 ? renderAbilityList(otherUpdates) : <p style={{ color: "#777" }}>无变化</p>}
            </div>
          </>
        ) : (
          <>
            <div className={styles.headerRow}>
              <h2 className={styles.modalTitle}>未扫描到技能（手动输入）</h2>
              <div className={styles.headerButtons}>
                <button onClick={() => setStep(1)} className={styles.cancelBtn}>⬅ 上一步</button>
                <button onClick={handleStep2Confirm} className={styles.confirmBtn}>✅ 确认</button>
              </div>
            </div>

            <div className={styles.stepTwoLayout}>
              <div className={styles.section} style={{ flex: 1 }}>
                {dbOnly.length > 0 ? renderDbOnlyList() : <p style={{ color: "#777" }}>无变化</p>}
              </div>

              {previewImage && (
                <div className={styles.previewImageBox}>
                  <img src={previewImage} alt="参考图片" onClick={() => setShowImageModal(true)} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showImageModal && previewImage && (
        <div className={styles.previewImageOverlay} onClick={() => setShowImageModal(false)}>
          <img src={previewImage} alt="参考图片放大" className={styles.previewImageLarge} />
        </div>
      )}
    </div>
  );
}
