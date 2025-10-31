"use client";
import React from "react";
import styles from "./styles.module.css";
import { getAbilityIcon } from "../drophelpers";

export default function AbilityList({
  options,
  allHave9Options,
  allHave10Options,
  chosenDrop,
  setChosenDrop,
  floor,
  markStartedIfNeeded,
  onSave,
  onClose,
}: any) {
  // 🔎 global debug
  console.log(
    "[AbilityList][DEBUG] got allHave9Options =",
    allHave9Options.map((x: any) => x.ability)
  );
  console.log(
    "[AbilityList][DEBUG] got allHave10Options =",
    allHave10Options.map((x: any) => x.ability)
  );

  return (
    <div className={styles.leftColumn}>
      <div className={styles.dropList}>
        <div className={styles.sectionDivider}>九重</div>
        {options
          .filter((opt: any) => opt.level === 9)
          .map((opt: any, i: number) => {
            const inAll = allHave9Options.some(
              (a: any) => a.ability === opt.ability
            );

            console.log(
              "[AbilityList][CHECK] 9重 ability=",
              opt.ability,
              "inAll=",
              inAll,
              "allHave9Options=",
              allHave9Options.map((x: any) => x.ability)
            );

            if (inAll) return null;

            return (
              <button
                key={`9-${i}`}
                className={`${styles.dropBtn} ${
                  chosenDrop !== "noDrop" &&
                  chosenDrop?.ability === opt.ability &&
                  chosenDrop?.level === opt.level
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
            );
          })}

        <div className={styles.sectionDivider}>十重</div>
        {options
          .filter((opt: any) => opt.level === 10)
          .map((opt: any, i: number) => {
            const inAll = allHave10Options.some(
              (a: any) => a.ability === opt.ability
            );

            console.log(
              "[AbilityList][CHECK] 10重 ability=",
              opt.ability,
              "inAll=",
              inAll,
              "allHave10Options=",
              allHave10Options.map((x: any) => x.ability)
            );

            if (inAll) return null;

            return (
              <button
                key={`10-${i}`}
                className={`${styles.dropBtn} ${
                  chosenDrop !== "noDrop" &&
                  chosenDrop?.ability === opt.ability &&
                  chosenDrop?.level === opt.level
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
            );
          })}

        {(allHave9Options.length > 0 || allHave10Options.length > 0) && (
          <div className={styles.sectionDivider}>已有</div>
        )}

        {allHave9Options.map((opt: any, i: number) => (
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

        {allHave10Options.map((opt: any, i: number) => (
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
  );
}
