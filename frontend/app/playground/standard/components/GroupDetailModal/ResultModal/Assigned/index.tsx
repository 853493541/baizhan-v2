"use client";
import React from "react";
import styles from "./styles.module.css";
import type { AssignedDrop } from "../index";
import type { GroupResult } from "@/utils/solver";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

interface Character {
  _id: string;
  name: string;
  abilities?: Record<string, number>;
  storage?: { ability: string; level: number; used?: boolean }[];
}

interface Props {
  drops: AssignedDrop[];
  group: GroupResult;
  onUse: (drop: AssignedDrop) => void;
  onStore: (drop: AssignedDrop) => void;
  loading?: string | null;
}

export default function Assigned({
  drops,
  group,
  onUse,
  onStore,
  loading,
}: Props) {
  const getRoleColorClass = (role?: string) => {
    switch (role) {
      case "Tank":
        return styles.tank;
      case "DPS":
        return styles.dps;
      case "Healer":
        return styles.healer;
      default:
        return "";
    }
  };

  const getLevelFromCharacter = (drop: AssignedDrop): number | null => {
    const char = drop.character as Character | undefined;
    if (!char?.abilities) return null;
    const raw = char.abilities[drop.ability];
    if (raw === undefined || raw === null) return null;
    const parsed = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasLevel10InStorage = (drop: AssignedDrop): boolean => {
    const char = drop.character as Character | undefined;
    if (!char?.storage) return false;
    return char.storage.some(
      (item) =>
        item.ability === drop.ability &&
        item.level === 10 &&
        item.used === false
    );
  };

  // ✅ Read stored 10重 & mark both 9重 and 10重 assignments as used
  const useStoredAbility = async (drop: AssignedDrop) => {
    const char = drop.character as Character | undefined;
    if (!char?._id) return alert("❌ 无法找到角色 ID。");

    try {
      // 1️⃣ Use the stored 10重
      const res = await fetch(`${API_BASE}/api/characters/${char._id}/storage/use`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ability: drop.ability,
          level: 10,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      alert(`✅ 已读取并使用 ${drop.ability} 10重`);
      console.log(`[Assigned] ${char.name} used stored ${drop.ability} 10重`);

      // 2️⃣ Mark current (9重) assignment as used in backend
      const boss = group.kills?.find((k: any) => k.floor === drop.floor)?.boss ?? undefined;
      const scheduleId = (group as any).scheduleId || group._id || "";
      const schedUrl = `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/floor/${drop.floor}`;
      await fetch(schedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boss,
          selection: {
            ability: drop.ability,
            level: 10,
            characterId: drop.characterId,
            status: "used",
          },
        }),
      });

      // 3️⃣ Find the matching level 10 assignment in this group and mark it used too
      const tenDrop = drops.find(
        (d) =>
          d.ability === drop.ability &&
          d.level === 10 &&
          d.characterId === drop.characterId
      );

      if (tenDrop) {
        try {
          const boss10 =
            group.kills?.find((k: any) => k.floor === tenDrop.floor)?.boss ?? undefined;
          const schedUrl10 = `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/floor/${tenDrop.floor}`;

          console.log(
            `🔍 Found matching level 10 to mark used:`,
            {
              character: char.name,
              ability: tenDrop.ability,
              level: tenDrop.level,
              floor: tenDrop.floor,
              boss: boss10,
            }
          );

          await fetch(schedUrl10, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              boss: boss10,
              selection: {
                ability: tenDrop.ability,
                level: 10,
                characterId: tenDrop.characterId,
                status: "used",
              },
            }),
          });

          console.log(
            `✅ ${char.name} 的 ${drop.ability} 十重 assignment 已标记为 used (floor: ${tenDrop.floor})`
          );
        } catch (markErr) {
          console.warn("⚠️ Failed to mark 10重 assignment as used:", markErr);
        }
      } else {
        console.log(
          `ℹ️ 未找到 ${char.name} 的 ${drop.ability} 十重 assignment，未执行标记。`
        );
      }

      // 4️⃣ Update UI for current drop only
      onUse({ ...drop, level: 10, status: "used" });
    } catch (err) {
      console.error("❌ useStoredAbility failed:", err);
      alert("使用存储技能失败，请稍后再试。");
    }
  };

  const handleUseClick = async (drop: AssignedDrop) => {
    const currentLevel = getLevelFromCharacter(drop);

    // 🟢 If has stored 10重
    if (drop.level === 9 && hasLevel10InStorage(drop)) {
      const useStored = window.confirm("包里找到10重，是否现在阅读？");
      if (useStored) {
        await useStoredAbility(drop);
        return; // ✅ stop — no 9重 after
      }
    }

    // 🟡 10重 but <9
    if (drop.level === 10 && (currentLevel ?? 0) < 9) {
      const confirmDirect = window.confirm(
        "数据显示该技能没有达到9重，是否直接修改该技能到10重？"
      );
      if (confirmDirect) onUse(drop);
      return;
    }

    // 🟠 9重 but <8
    if (drop.level === 9 && (currentLevel ?? 0) < 8) {
      const confirmUpgrade = window.confirm("是否消耗通本和这本书升级？");
      if (!confirmUpgrade) return;
    }

    onUse(drop);
  };

  if (!drops?.length) {
    return (
      <div className={styles.box}>
        <h3 className={styles.title}>已分配</h3>
        <div className={styles.emptyBox}>暂无分配</div>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已分配</h3>
      {Object.entries(
        drops.reduce((acc: Record<string, AssignedDrop[]>, d: AssignedDrop) => {
          if (!acc[d.char]) acc[d.char] = [];
          acc[d.char].push(d);
          return acc;
        }, {})
      ).map(([charName, list]) => {
        const charRole = list[0]?.role;
        const sortedList = [...list].sort((a, b) => {
          const order = { 9: 1, 10: 2 };
          return (order[a.level] || 99) - (order[b.level] || 99);
        });

        return (
          <div key={charName} className={styles.charSection}>
            <span className={`${styles.charBubble} ${getRoleColorClass(charRole)}`}>
              {charName}
            </span>
            <ul className={styles.assignmentList}>
              {sortedList.map((a, i) => {
                const currentLevel = getLevelFromCharacter(a);
                const has10Storage = a.level === 9 && hasLevel10InStorage(a);

                let warningText = "";
                let btnStyle = styles.useBtn;
                const warnNot8 = a.level === 9 && (currentLevel ?? 0) < 8;
                const warnNot9 = a.level === 10 && (currentLevel ?? 0) < 9;

                if (warnNot8) {
                  warningText = "未到8重";
                  btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                } else if (warnNot9) {
                  warningText = "未到9重";
                  btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                } else if (has10Storage) {
                  warningText = "拥有10重";
                  btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                }

                return (
                  <li key={i} className={styles.assignmentItem}>
                    <div className={styles.leftContent}>
                      <img
                        src={getAbilityIcon(a.ability)}
                        alt={a.ability}
                        className={styles.assignmentIcon}
                      />
                      <span className={styles.assignmentText}>
                        {a.level === 9 ? "九重" : a.level === 10 ? "十重" : ""} · {a.ability}
                      </span>
                    </div>
                    <div className={styles.rightContent}>
                      {warningText && <span className={styles.warning}>{warningText}</span>}
                      <button
                        disabled={loading === a.ability}
                        onClick={() => handleUseClick(a)}
                        className={btnStyle}
                      >
                        使用
                      </button>
                      <button
                        disabled={loading === a.ability}
                        onClick={() => onStore(a)}
                        className={styles.storeBtn}
                      >
                        存入仓库
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
