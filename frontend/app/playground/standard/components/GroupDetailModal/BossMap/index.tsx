"use client";

import React, { useState, useEffect, useRef } from "react";
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
  countdown?: number;                    // ✅ now we accept the number
  onRefresh?: () => void;
  onGroupUpdate?: (g: ExtendedGroup) => void;
}

const highlightAbilities = [
  "水遁水流闪","蛮熊碎颅击","花钱消灾","斗转金移","特制金创药","万花金创药",
  "一闪天诛","初景白雨","漾剑式","定波式","黑煞落贪狼","毓秀灵药","霞月长针",
  "剑心通明","飞云回转刀","阴阳术退散","尸鬼封烬","兔死狐悲","血龙甩尾","七荒黑牙",
  "三个铜钱","乾坤一掷","厄毒爆发","坠龙惊鸿","引燃","火焰之种","阴雷之种",
  "短歌万劫","泉映幻歌",
];

export default function BossMap({
  scheduleId,
  group,
  weeklyMap,
  countdown,
  onRefresh,
  onGroupUpdate,
}: Props) {
  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

  const [localGroup, setLocalGroup] = useState(group);
  const lastLocalUpdate = useRef<number>(Date.now());

  // ✅ keep local in sync but don't overwrite fresher local
  useEffect(() => {
    const parentKillCount = group.kills?.length || 0;
    const localKillCount = localGroup.kills?.length || 0;

    if (
      parentKillCount >= localKillCount ||
      Date.now() - lastLocalUpdate.current > 3000
    ) {
      setLocalGroup(group);
    }
  }, [group, localGroup.kills]);

  const [selected, setSelected] = useState<{
    floor: number;
    boss: string;
    dropList: string[];
    dropLevel: 9 | 10;
  } | null>(null);

  const [activeMembers, setActiveMembers] = useState<number[]>([0, 1, 2]);
  const toggleMember = (i: number) =>
    setActiveMembers((p) =>
      p.includes(i) ? p.filter((x) => x !== i) : [...p, i]
    );

  const status = (localGroup.status ?? "not_started") as
    | "not_started"
    | "started"
    | "finished";
  const statusLabel = {
    not_started: "未开始",
    started: "进行中",
    finished: "已完成",
  };
  const statusCircleClass = {
    not_started: styles.statusIdleDot,
    started: styles.statusBusyDot,
    finished: styles.statusDoneDot,
  };

  const getRoleClass = (role: string) => {
    if (!role) return "";
    switch (role.toLowerCase()) {
      case "tank":
        return styles.tankBtn;
      case "dps":
        return styles.dpsBtn;
      case "healer":
        return styles.healerBtn;
      default:
        return "";
    }
  };

  const updateGroupStatus = async (
    next: "not_started" | "started" | "finished"
  ) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      setLocalGroup((p) => ({ ...p, status: next }));
      onRefresh?.();
      onGroupUpdate?.({ ...localGroup, status: next });
    } catch (err) {
      console.error("❌ updateGroupStatus error:", err);
    }
  };

  const updateGroupKill = async (
    floor: number,
    boss: string,
    selection: any
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${floor}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boss, selection }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();

      const newGroup = {
        ...localGroup,
        kills: updated.updatedGroup?.kills || localGroup.kills,
      };
      setLocalGroup(newGroup);
      lastLocalUpdate.current = Date.now();
      onRefresh?.();
      onGroupUpdate?.(newGroup);
    } catch (err) {
      console.error("❌ updateGroupKill error:", err);
    }
  };

  // ✅ instant fetch on open
  useEffect(() => {
    const instantFetch = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/kills`
        );
        if (!res.ok) return;
        const data = await res.json();
        const newGroup = {
          ...localGroup,
          kills: data.kills || localGroup.kills,
          status: data.status || localGroup.status,
        };
        setLocalGroup(newGroup);
        lastLocalUpdate.current = Date.now();
        onGroupUpdate?.(newGroup);
      } catch (err) {
        console.error("❌ Instant fetch failed:", err);
      }
    };
    instantFetch();
  }, [scheduleId, localGroup.index]);

  const handleFinish = async () => {
    if (window.confirm("确认要结束吗？")) {
      await updateGroupStatus("finished");
    }
  };

  return (
    <>
      <div className={styles.headerRow}>
        <div className={styles.leftSection}>
          <h3 className={styles.title}>本周地图</h3>

          <div className={styles.memberButtons}>
            {localGroup.characters?.map((c: any, i: number) => {
              const isActive = activeMembers.includes(i);
              const roleClass = getRoleClass(c.role);
              return (
                <button
                  key={i}
                  onClick={() => toggleMember(i)}
                  className={`${styles.actionBtn} ${roleClass} ${
                    !isActive ? styles.inactiveBtn : ""
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.rightControls}>
          {/* ✅ countdown sits left of status */}
          {typeof countdown === "number" && (
            <span className={styles.countdownText}>
              （{countdown}秒后刷新）
            </span>
          )}

          <div
            className={styles.statusWrap}
            title={`当前状态：${statusLabel[status]}`}
          >
            <span
              className={`${styles.statusDot} ${statusCircleClass[status]}`}
            />
            <span className={styles.statusText}>{statusLabel[status]}</span>
          </div>

          {status !== "finished" && (
            <button className={styles.actionBtn} onClick={handleFinish}>
              结束
            </button>
          )}
        </div>
      </div>

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
            activeMembers={activeMembers}
            onSelect={(floor, boss, dropList, dropLevel) =>
              setSelected({ floor, boss, dropList, dropLevel })
            }
          />
        ))}
      </div>

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
            activeMembers={activeMembers}
            onSelect={(floor, boss, dropList, dropLevel) =>
              setSelected({ floor, boss, dropList, dropLevel })
            }
          />
        ))}
      </div>

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
            if (status === "not_started") await updateGroupStatus("started");
          }}
          groupStatus={status}
          onMarkStarted={() => updateGroupStatus("started")}
          onAfterReset={() => {
            const newGroup = {
              ...localGroup,
              kills:
                localGroup.kills?.filter(
                  (k: any) => k.floor !== selected?.floor
                ) || [],
            };
            setLocalGroup(newGroup);
            onRefresh?.();
            onGroupUpdate?.(newGroup);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
