import React from "react";
import styles from "./styles.module.css";
import tradableAbilities from "@/app/data/tradable_abilities.json";

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;
const tradableSet = new Set<string>(tradableAbilities);

/* ======================================================
   PRIMARY DROP (UNCHANGED)
====================================================== */
export function renderPrimaryDrop({ kill, group }: any) {
  if (!kill?.selection) return null;

  const sel = kill.selection;

  if (sel.noDrop || (!sel.ability && !sel.characterId)) {
    return {
      className: styles.cardHealer,
      node: (
        <div className={`${styles.dropResult} ${styles.noDrop}`}>
          <img
            src="/icons/no_drop.svg"
            className={`${styles.iconLarge} ${styles.iconNoDrop}`}
          />
          <div>无掉落</div>
        </div>
      ),
    };
  }

  if (sel.ability && tradableSet.has(sel.ability)) {
    return {
      className: styles.cardPurple,
      node: (
        <div className={`${styles.dropResult} ${styles.purple}`}>
          <img src={getAbilityIcon(sel.ability)} className={styles.iconLarge} />
          <div>{sel.ability}</div>
          <div>{sel.level}重</div>
          <div>(无)</div>
        </div>
      ),
    };
  }

  if (sel.ability && !sel.characterId) {
    return {
      className: styles.cardHealer,
      node: (
        <div className={`${styles.dropResult} ${styles.wasted}`}>
          <img
            src={getAbilityIcon(sel.ability)}
            className={`${styles.iconLarge} ${styles.iconWasted}`}
          />
          <div>{sel.ability}</div>
          <div>{sel.level}重</div>
          <div>(无)</div>
        </div>
      ),
    };
  }

  const char = group.characters.find((c: any) => c._id === sel.characterId);
  const assignedName = char ? char.name : sel.characterId;

  return {
    className: styles.cardNormal,
    node: (
      <div className={`${styles.dropResult} ${styles.normal}`}>
        <img src={getAbilityIcon(sel.ability)} className={styles.iconLarge} />
        <div>{sel.ability}</div>
        <div>{sel.level}重</div>
        {assignedName && <div>{assignedName}</div>}
      </div>
    ),
  };
}

/* ======================================================
   SECONDARY DROP (FIXED)
====================================================== */
export function renderSecondaryDrop({ kill, group }: any) {
  if (!kill?.selectionSecondary) return null;

  const sel = kill.selectionSecondary;

  const wrap = (children: React.ReactNode, cls: string) => (
    <div className={`${styles.dropResult} ${cls} ${styles.secondaryDrop}`}>
      {children}
    </div>
  );

  /**
   * ✅ Only show "无掉落" if user explicitly selected it
   */
  if (sel.noDrop === true) {
    return wrap(
      <>
        <img
          src="/icons/no_drop.svg"
          className={`${styles.iconLarge} ${styles.iconNoDrop}`}
        />
        <div>无掉落</div>
      </>,
      styles.noDrop
    );
  }

  /**
   * ✅ Empty secondary slot → render NOTHING
   * BossCard will show "click to add second drop"
   */
  if (!sel.ability && !sel.characterId) {
    return null;
  }

  if (sel.ability && tradableSet.has(sel.ability)) {
    return wrap(
      <>
        <img src={getAbilityIcon(sel.ability)} className={styles.iconLarge} />
        <div>{sel.ability}</div>
        <div>{sel.level}重</div>
        <div>(无)</div>
      </>,
      styles.purple
    );
  }

  if (sel.ability && !sel.characterId) {
    return wrap(
      <>
        <img
          src={getAbilityIcon(sel.ability)}
          className={`${styles.iconLarge} ${styles.iconWasted}`}
        />
        <div>{sel.ability}</div>
        <div>{sel.level}重</div>
        <div>(无)</div>
      </>,
      styles.wasted
    );
  }

  const char = group.characters.find((c: any) => c._id === sel.characterId);
  const assignedName = char ? char.name : sel.characterId;

  return wrap(
    <>
      <img src={getAbilityIcon(sel.ability)} className={styles.iconLarge} />
      <div>{sel.ability}</div>
      <div>{sel.level}重</div>
      {assignedName && <div>{assignedName}</div>}
    </>,
    styles.normal
  );
}
