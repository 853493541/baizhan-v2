"use client";
import React from "react";
import styles from "./styles.module.css";
import { numToChinese } from "../../abilityUtils";

interface StorageItem {
  ability: string;
  level: number;
}

interface Character {
  abilities?: Record<string, number>;
}

interface Props {
  search: string;
  setSearch: (v: string) => void;
  filteredItems: StorageItem[];
  localChar: Character;
  getUseButtonState: (item: StorageItem, current: number) => {
    disabled: boolean;
    className: string;
    text: string;
  };
  requestUse: (item: StorageItem) => void;
  requestDelete: (item: StorageItem) => void;
  onAddClick: () => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function BackpackDisplay({
  search,
  setSearch,
  filteredItems,
  localChar,
  getUseButtonState,
  requestUse,
  requestDelete,
  onAddClick,
}: Props) {
  return (
    <>

 <h3 className={styles.title}>当前背包</h3>

      <ul className={styles.itemList}>
        {filteredItems.map((item, idx) => {
          const currentLevel =
            localChar.abilities?.[item.ability] ?? 0;
          const state = getUseButtonState(item, currentLevel);

          return (
            <li
              key={`${item.ability}-${idx}`}
              className={styles.itemRow}
            >
              <div className={styles.itemLeft}>
                <img
                  src={getAbilityIcon(item.ability)}
                  alt={item.ability}
                  className={styles.abilityIcon}
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display =
                      "none")
                  }
                />
<div className={styles.nameGroup}>
  <span className={styles.abilityName}>
    {item.ability}
  </span>
  <span className={styles.abilityLevel}>
    {numToChinese(item.level)}重
  </span>
</div>

              </div>

              <div className={styles.buttons}>
                <button
                  disabled={state.disabled}
                  className={`${styles.btn} ${styles[state.className]}`}
                  onClick={() =>
                    !state.disabled && requestUse(item)
                  }
                >
                  {state.text}
                </button>

                <button
                  className={`${styles.btn} ${styles.deleteBtn}`}
                  onClick={() => requestDelete(item)}
                >
                  删除
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
