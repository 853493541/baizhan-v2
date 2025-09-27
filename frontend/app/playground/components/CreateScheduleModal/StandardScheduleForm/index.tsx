"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import WeeklyChecklist from "./WeeklyChecklist";
import { getDefaultModeChecklist } from "@/utils/playgroundHelpers";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Props {
  onClose: () => void;
  onConfirm: (data: any) => void; // ✅ no need for mode argument
}

const SERVERS = ["乾坤一掷", "唯我独尊", "梦江南"];
const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
];

export default function StandardScheduleForm({ onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [conflictLevel, setConflictLevel] = useState(10);
  const [server, setServer] = useState(SERVERS[0]);
  const [checklist, setChecklist] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(false);

  // Load checklist
  useEffect(() => {
    setLoading(true);
    getDefaultModeChecklist()
      .then((list) => {
        console.log("📝 [StandardScheduleForm] Raw checklist from helper:", list);

        // Extra check: ability counts by level
        const levelCounts = list.reduce<Record<number, number>>((acc, a) => {
          acc[a.level] = (acc[a.level] || 0) + 1;
          return acc;
        }, {});
        console.log("📊 [StandardScheduleForm] Ability counts by level:", levelCounts);

        // Build resolved checklist
        const resolved = CORE_ABILITIES.map((skill) => {
          const match = list.find(
            (a) => a.name === skill && a.level === conflictLevel
          );
          console.log("🔍 [StandardScheduleForm] Checking skill:", skill, "→ match:", match);

          return match
            ? { ...match, available: true }
            : { name: skill, level: conflictLevel, available: false };
        });

        console.log("✅ [StandardScheduleForm] Final resolved checklist:", resolved);
        setChecklist(resolved);
      })
      .finally(() => setLoading(false));
  }, [conflictLevel]);

  const handleSubmit = async () => {
    try {
      // fetch characters for server
      const charRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters?server=${server}`
      );
      if (!charRes.ok) throw new Error("Failed to fetch characters");
      const characters = await charRes.json();

      // ✅ filter only active characters
      const activeCharacters = characters.filter((c: any) => c.active);

      if (activeCharacters.length === 0) {
        alert("该服务器没有启用的角色，无法创建排表。");
        return;
      }

      const payload = {
        name: name || "未命名排表",
        server,
        conflictLevel,
        checkedAbilities: checklist,
        characterCount: activeCharacters.length,
        characters: activeCharacters.map((c: any) => c._id),
        groups: [],
      };

      console.log("🚀 [StandardScheduleForm] Submitting new schedule payload:", payload);

      onConfirm(payload);
      onClose();
    } catch (err) {
      console.error("❌ [StandardScheduleForm] Error creating schedule:", err);
    }
  };

  return (
    <>
      <label className={styles.label}>
        排表名称
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入排表名称"
          className={styles.input}
        />
      </label>

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
        <select
          value={server}
          onChange={(e) => setServer(e.target.value)}
          className={styles.select}
        >
          {SERVERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <WeeklyChecklist
        checklist={checklist}
        loading={loading}
        conflictLevel={conflictLevel}
      />

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onClose}>
          取消
        </button>
        <button className={styles.btnPrimary} onClick={handleSubmit}>
          确认
        </button>
      </div>
    </>
  );
}
