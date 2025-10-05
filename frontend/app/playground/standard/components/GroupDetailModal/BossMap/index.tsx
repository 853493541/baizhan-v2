"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";
import Drops from "./drops";
import BossCard from "./BossCard";

import rawBossData from "@/app/data/boss_drop.json";
const bossData: Record<string, string[]> = rawBossData;

import tradableAbilities from "@/app/data/tradable_abilities.json";
const tradableSet = new Set(tradableAbilities as string[]);

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

  // ✅ local copy only for visual refresh (kept synced by onRefresh)
  const [localGroup, setLocalGroup] = useState(group);
  const [selected, setSelected] = useState<{
    floor: number;
    boss: string;
    dropList: string[];
    dropLevel: 9 | 10;
  } | null>(null);

  // ---- Status helpers ----
  const status = (localGroup.status ?? "not_started") as
    | "not_started"
    | "started"
    | "finished";
  const statusLabel: Record<typeof status, string> = {
    not_started: "未开始",
    started: "进行中",
    finished: "已完成",
  };
  const statusCircleClass: Record<typeof status, string> = {
    not_started: styles.statusIdleDot,
    started: styles.statusBusyDot,
    finished: styles.statusDoneDot,
  };

  // ✅ API helpers
  const updateGroupStatus = async (next: "not_started" | "started" | "finished") => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      setLocalGroup((prev) => ({ ...prev, status: next }));
      onRefresh?.();
    } catch (err) {
      console.error("❌ updateGroupStatus error:", err);
    }
  };

  const updateGroupKill = async (floor: number, boss: string, selection: any) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/kills/${floor}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boss, selection }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();

      // ✅ update kills locally for instant sync
      setLocalGroup((prev) => ({
        ...prev,
        kills: updated.updatedGroup?.kills || prev.kills,
      }));

      onRefresh?.(); // this triggers your full parent refresh
    } catch (err) {
      console.error("❌ updateGroupKill error:", err);
    }
  };

  // 🔘 Finish handler
  const handleFinish = async () => {
    const ok = window.confirm("确认要结束吗？");
    if (!ok) return;
    await updateGroupStatus("finished");
  };

  return (
    <>
      {/* Header */}
      <div className={styles.headerRow}>
        <h3 className={styles.title}>本周地图</h3>

        <div className={styles.rightControls}>
          <div className={styles.statusWrap} title={`当前状态：${statusLabel[status]}`}>
            <span className={`${styles.statusDot} ${statusCircleClass[status]}`} />
            <span className={styles.statusText}>{statusLabel[status]}</span>
          </div>

          {status !== "finished" && (
            <button
              className={styles.actionBtn}
              onClick={handleFinish}
              aria-label="结束并提交"
            >
              结束
            </button>
          )}
        </div>
      </div>

      {/* Row 1 */}
      <div className={styles.row}>
        {row1.map((f) => (
          <BossCard
            key={f}
            floor={f}
            boss={weeklyMap[f]}
            group={localGroup}
            bossData={bossData}
            highlightAbilities={highlightAbilities}
            tradableSet={tradableSet}
            kill={localGroup.kills?.find((k) => k.floor === f)}
            onSelect={(floor, boss, dropList, dropLevel) =>
              setSelected({ floor, boss, dropList, dropLevel })
            }
          />
        ))}
      </div>

      {/* Row 2 */}
      <div className={styles.row}>
        {row2.map((f) => (
          <BossCard
            key={f}
            floor={f}
            boss={weeklyMap[f]}
            group={localGroup}
            bossData={bossData}
            highlightAbilities={highlightAbilities}
            tradableSet={tradableSet}
            kill={localGroup.kills?.find((k) => k.floor === f)}
            onSelect={(floor, boss, dropList, dropLevel) =>
              setSelected({ floor, boss, dropList, dropLevel })
            }
          />
        ))}
      </div>

      {/* Drops modal */}
      {selected && (
        <Drops
          scheduleId={scheduleId}
          floor={selected.floor}
          boss={selected.boss}
          dropList={selected.dropList}
          dropLevel={selected.dropLevel}
          group={localGroup}
          onClose={() => setSelected(null)}
          onSave={async (floor, data) => {
            await updateGroupKill(floor, selected.boss, data);
            setSelected(null);

            if (status === "not_started") {
              await updateGroupStatus("started");
            }
          }}
          groupStatus={status}
          onMarkStarted={() => updateGroupStatus("started")}
          // ✅ local visual refresh for reset only
          onAfterReset={() => {
            // remove visually so the boss icon updates
            setLocalGroup((prev) => ({
              ...prev,
              kills: prev.kills?.filter((k) => k.floor !== selected?.floor) || [],
            }));

            // now run your normal refresh logic (to re-fetch proper data)
            onRefresh?.();
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
