"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";
import Drops from "./drops";
import ResultModal from "./ResultModal";

import rawBossData from "@/app/data/boss_skills_collection_map.json";
const bossData: Record<string, string[]> = rawBossData;

import tradableAbilities from "@/app/data/tradable_abilities.json";
const tradableSet = new Set(tradableAbilities as string[]);
import { canUseAbility } from "@/utils/genderCheck";

interface ExtendedGroup extends GroupResult {
  index: number;
  status?: "not_started" | "started" | "finished";
  kills?: any[];
}

interface Props {
  scheduleId: string;
  group: ExtendedGroup;
  weeklyMap: Record<number, string>;
  onRefresh?: () => void;
}

const highlightAbilities = [
  "水遁水流闪","蛮熊碎颅击","花钱消灾","斗转金移","特制金创药","万花金创药",
  "一闪天诛","初景白雨","漾剑式","定波式","黑煞落贪狼","毓秀灵药","霞月长针",
  "剑心通明","飞云回转刀","阴阳术退散","尸鬼封烬","兔死狐悲","血龙甩尾","七荒黑牙",
  "三个铜钱","乾坤一掷","厄毒爆发","坠龙惊鸿","引燃","火焰之种","阴雷之种",
  "短歌万劫","泉映幻歌",
];

export default function BossMap({ scheduleId, group, weeklyMap, onRefresh }: Props) {
  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

  const [selected, setSelected] = useState<{
    floor: number;
    boss: string;
    dropList: string[];
    dropLevel: 9 | 10;
  } | null>(null);

  const [showResult, setShowResult] = useState(false);

  // ✅ API helpers (always use NEXT_PUBLIC_API_URL)
  const updateGroupStatus = async (status: "not_started" | "started" | "finished") => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${group.index}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    onRefresh?.();
  };

  const updateGroupKill = async (floor: number, boss: string, selection: any) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${group.index}/kills/${floor}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boss, selection }),
      }
    );
    onRefresh?.();
  };

  const renderBossCard = (floor: number) => {
    const boss = weeklyMap[floor];
    const kill = group.kills?.find((k) => k.floor === floor);

    if (!boss) {
      return (
        <div key={floor} className={styles.card}>
          <div className={styles.floorLabel}>{floor}</div>
          <div className={styles.noNeed}>未选择</div>
        </div>
      );
    }

    const dropList: string[] = bossData[boss] || [];
    const dropLevel = floor >= 81 && floor <= 90 ? 9 : 10;

    // ✅ Needs list
    let needs = dropList
      .filter((ability) => !tradableSet.has(ability))
      .map((ability) => {
        const needCount = group.characters.filter((c) => {
          const lvl = c.abilities?.[ability] ?? 0;
          const usable = canUseAbility(c as any, ability);
          return usable && lvl < dropLevel;
        }).length;

        if (needCount > 0) {
          const isHighlight = highlightAbilities.includes(ability);
          return { ability, needCount, isHighlight };
        }
        return null;
      })
      .filter(Boolean) as { ability: string; needCount: number; isHighlight: boolean }[];

    needs.sort((a, b) => {
      if (a.isHighlight && !b.isHighlight) return -1;
      if (!a.isHighlight && b.isHighlight) return 1;
      return 0;
    });

    const content =
      needs.length > 0 ? (
        <ul className={styles.needList}>
          {needs.map((n) => (
            <li
              key={n.ability}
              className={n.isHighlight ? styles.coreHighlight : ""}
            >
              {n.ability}（{n.needCount}）
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noNeed}>无需求</p>
      );

    return (
      <div
        key={floor}
        className={`${styles.card} ${kill?.completed ? styles.cardDone : ""}`}
        onClick={() => {
          setSelected({ floor, boss, dropList, dropLevel: dropLevel as 9 | 10 });
        }}
      >
        <div className={styles.floorLabel}>
          {floor} {boss}
        </div>
        {kill?.completed && <div className={styles.checkmark}>✔</div>}
        {content}
      </div>
    );
  };

  const renderRow = (floors: number[]) => (
    <div className={styles.row}>{floors.map((f) => renderBossCard(f))}</div>
  );

  return (
    <>
      <h3>本周地图</h3>

      {/* 🔘 Finish button always visible */}
      <button
        className={styles.actionBtn}
        onClick={() => setShowResult(true)}
      >
        结束
      </button>

      {renderRow(row1)}
      {renderRow(row2)}

      {selected && (
        <Drops
          floor={selected.floor}
          boss={selected.boss}
          dropList={selected.dropList}
          dropLevel={selected.dropLevel}
          group={group}
          onClose={() => setSelected(null)}
          onSave={async (floor, data) => {
            await updateGroupKill(floor, selected.boss, data);
            setSelected(null);
          }}
        />
      )}

      {showResult && (
        <ResultModal
          group={group}
          onClose={() => setShowResult(false)}
          onConfirm={async () => {
            await updateGroupStatus("finished");
            setShowResult(false);
          }}
        />
      )}
    </>
  );
}
