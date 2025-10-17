"use client";

import styles from "./styles.module.css";

interface TradableModalProps {
  tradables: { ability: string; requiredLevel: number }[];
  localAbilities: Record<string, number>;
  updateAbility: (ability: string, newLevel: number) => void;
  onCopy?: (formatted: string) => void;
  onClose: () => void;
}

// 🔢 helper: convert number to Chinese numerals
function numberToChinese(num: number): string {
  const numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (num <= 10) {
    return num === 10 ? "十" : numerals[num];
  }
  if (num < 20) {
    return "十" + numerals[num - 10];
  }
  if (num % 10 === 0) {
    return numerals[Math.floor(num / 10)] + "十";
  }
  return numerals[Math.floor(num / 10)] + "十" + numerals[num % 10];
}

export default function TradableModal({
  tradables,
  localAbilities,
  updateAbility,
  onCopy,
  onClose,
}: TradableModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.modalTitle}>交易行技能</h3>
        <p>可购买用于提升精耐：</p>

        {tradables.map(({ ability, requiredLevel }) => {
          const current = localAbilities?.[ability] ?? 0;
          return (
            <div key={ability} className={styles.abilityRow}>
              <img
                src={`/icons/${ability}.png`}
                alt={ability}
                className={styles.abilityIcon}
                onError={(e) =>
                  (e.currentTarget as HTMLImageElement).src = "/icons/default.png"
                }
              />

              <span className={styles.abilityLabel}>
                {ability} · {requiredLevel}重
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateAbility(ability, Math.max(current - 1, 0));
                }}
                disabled={current <= 0}
                className={current <= 0 ? styles.minusDisabled : styles.minus}
              >
                -
              </button>

              <span>{current}</span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateAbility(ability, current + 1);
                }}
                className={styles.plus}
              >
                +
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const chineseLevel = numberToChinese(requiredLevel);
                  const formatted = `《${ability}》招式要诀·${chineseLevel}重`;
                  console.log("📋 Copying to clipboard:", formatted);
                  navigator.clipboard.writeText(formatted).catch((err) => {
                    console.error("❌ Failed to copy:", err);
                  });
                  if (onCopy) onCopy(formatted);
                }}
                className={styles.copyButton}
              >
                复制名称
              </button>
            </div>
          );
        })}

        <div className={styles.modalFooter}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={styles.closeButton}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
