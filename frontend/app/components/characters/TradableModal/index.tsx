"use client";

import styles from "./styles.module.css";

interface TradableModalProps {
  tradables: { ability: string; requiredLevel: number }[];
  localAbilities: Record<string, number>;
  updateAbility: (ability: string, newLevel: number) => void;
  onCopy: (ability: string) => void;
  onClose: () => void;
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
        onClick={(e) => e.stopPropagation()} // ✅ prevent bubbling into card
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
                  onCopy(ability);
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
