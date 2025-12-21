"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

interface Props {
  group: GroupResult;
}

const getAbilityIcon = (fullName: string) => `/icons/${fullName}.png`;

export default function GroupDetail({ group }: Props) {
  // 🔧 SAMPLE owned abilities (icon uses full name, text uses short name)
  const ownedAbilities = [
    { fullName: "黑煞落贪狼", shortName: "黑煞", count: 3 },
    { fullName: "花钱消灾", shortName: "花钱", count: 3 },
    { fullName: "引燃", shortName: "引燃", count: 3 },
    { fullName: "一闪天诛", shortName: "天诛", count: 3 },
    { fullName: "斗转金移", shortName: "斗转", count: 3 },
    { fullName: "飞云回转刀", shortName: "飞刀", count: 3 },
  ];

  // 🔧 placeholder for wasted abilities
  const wastedAbilities: typeof ownedAbilities = [];

  return (
    <div className={styles.box}>
      <div className={styles.title}>分组信息</div>

      {/* 🔼 TOP INFO */}
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.label}>服务器</span>
          <span className={styles.value}>
            {group.server ?? "未知"}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>完成状态</span>
          <span className={styles.value}>
            {group.status ?? "进行中"}
          </span>
        </div>
      </div>

      {/* ➖ DIVIDER */}
      <div className={styles.divider} />

      {/* 🔽 OWNED ABILITIES */}
      <div className={styles.sectionTitle}>已有技能</div>
      <div className={styles.abilityGrid}>
        {ownedAbilities.map((ab) => (
          <div key={ab.fullName} className={styles.abilityItem}>
            <img
              src={getAbilityIcon(ab.fullName)}
              alt={ab.fullName}
              className={styles.abilityIcon}
            />
            <span className={styles.abilityText}>
              {ab.shortName} x{ab.count}
            </span>
          </div>
        ))}
      </div>

      {/* ➖ DIVIDER */}
      <div className={styles.divider} />

      {/* 🔽 WASTED ABILITIES */}
      <div className={styles.sectionTitle}>浪费技能</div>
      {wastedAbilities.length === 0 ? (
        <div className={styles.emptyBox}>暂无浪费技能</div>
      ) : (
        <div className={styles.abilityGrid}>
          {wastedAbilities.map((ab) => (
            <div key={ab.fullName} className={styles.abilityItem}>
              <img
                src={getAbilityIcon(ab.fullName)}
                alt={ab.fullName}
                className={styles.abilityIcon}
              />
              <span className={styles.abilityText}>
                {ab.shortName} x{ab.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
