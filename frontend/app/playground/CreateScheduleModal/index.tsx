"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import specialBosses from "../../data/special_boss.json";
import { getDefaultModeChecklist } from "@/utils/playgroundHelpers";

type Mode = "default" | "boss";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Props {
  onClose: () => void;
  onConfirm: (data: any, mode: Mode) => void;
}

const DEFAULT_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "兔死狐悲",
];

export default function CreateScheduleModal({ onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>("default");

  // --- Default (常规排表)
  const [conflictLevel, setConflictLevel] = useState<number>(10);
  const [server, setServer] = useState<string>("乾坤一掷");
  const [defaultChecklist, setDefaultChecklist] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Boss (对单排表)
  const [groupSize, setGroupSize] = useState<2 | 3>(3);
  const [boss, setBoss] = useState<string>("");

  // Fetch checklist for default mode
  useEffect(() => {
    if (mode !== "default") return;
    setLoading(true);
    getDefaultModeChecklist()
      .then((list) => {
        const resolved = DEFAULT_ABILITIES.map((skill) => {
          const match = list.find(
            (a) => a.name === skill && a.level === conflictLevel
          );
          return match
            ? { ...match, available: true }
            : { name: skill, level: conflictLevel, available: false };
        });
        setDefaultChecklist(resolved);
      })
      .finally(() => setLoading(false));
  }, [mode, conflictLevel]);

  // Boss: create via backend
  const createBossPlan = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, groupSize, boss }),
      }
    );
    if (!res.ok) throw new Error("❌ Failed to create boss plan");
    return res.json();
  };

  const handleSubmit = async () => {
    if (mode === "default") {
      // ✅ Send full payload for backend
      onConfirm(
        {
          server,
          mode: "default",
          conflictLevel,
          checkedAbilities: defaultChecklist,
          characterCount: 0,
          characters: [],
          groups: [],
        },
        "default"
      );
      onClose();
    } else {
      try {
        const created = await createBossPlan();
        onConfirm(created, "boss");
        onClose();
      } catch (err) {
        console.error("❌ Failed to create boss plan:", err);
      }
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>新建排表</h2>

        {/* Mode selector */}
        <label className={styles.label}>
          模式
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className={styles.select}
          >
            <option value="default">常规排表</option>
            <option value="boss">对单排表</option>
          </select>
        </label>

        {/* --- Default (常规排表) --- */}
        {mode === "default" && (
          <>
            <label className={styles.label}>
              冲突等级
              <select
                value={conflictLevel}
                onChange={(e) => setConflictLevel(Number(e.target.value))}
                className={styles.select}
              >
                <option value={9}>9</option>
                <option value={10}>10</option>
              </select>
            </label>

            <label className={styles.label}>
              服务器
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className={styles.input}
              />
            </label>

            <div className={styles.previewBox}>
              <h4>默认模式检查技能</h4>
              {loading ? (
                <p>加载中...</p>
              ) : (
                <ul>
                  {defaultChecklist.map((a, idx) => (
                    <li
                      key={idx}
                      style={{ color: a.available ? "black" : "gray" }}
                    >
                      {a.name} (Lv{a.level}) {!a.available && "❌ 未掉落"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* --- Boss (对单排表) --- */}
        {mode === "boss" && (
          <>
            <label className={styles.label}>
              服务器
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className={styles.input}
              />
            </label>

            <label className={styles.label}>
              分组人数
              <select
                value={groupSize}
                onChange={(e) =>
                  setGroupSize(parseInt(e.target.value) as 2 | 3)
                }
                className={styles.select}
              >
                <option value={2}>2 人</option>
                <option value={3}>3 人</option>
              </select>
            </label>

            <label className={styles.label}>
              Boss
              <select
                value={boss}
                onChange={(e) => setBoss(e.target.value)}
                className={styles.select}
              >
                <option value="">请选择 Boss</option>
                {Object.keys(specialBosses).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            取消
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={mode === "boss" && !boss}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
