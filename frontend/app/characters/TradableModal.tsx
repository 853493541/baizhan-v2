"use client";

import styles from "./CharacterCard.module.css";

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
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>交易行技能</h3>
        <p>可购买用于提升精耐：</p>

        {tradables.map(({ ability, requiredLevel }) => (
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
              onClick={() =>
                updateAbility(ability, Math.max((localAbilities?.[ability] ?? 0) - 1, 0))
              }
              disabled={(localAbilities?.[ability] ?? 0) <= 0}
              className={
                (localAbilities?.[ability] ?? 0) <= 0
                  ? styles.minusDisabled
                  : styles.minus
              }
            >
              -
            </button>

            <span>{localAbilities?.[ability] ?? 0}</span>

            <button
              onClick={() => updateAbility(ability, (localAbilities?.[ability] ?? 0) + 1)}
              className={styles.plus}
            >
              +
            </button>

            <button onClick={() => onCopy(ability)} className={styles.copyButton}>
              复制名称
            </button>
          </div>
        ))}

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeButton}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
