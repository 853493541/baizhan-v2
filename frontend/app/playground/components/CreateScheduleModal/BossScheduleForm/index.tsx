"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import specialBosses from "@/app/data/special_boss.json";

interface Props {
  onClose: () => void;
  onConfirm: (data: any, mode: "boss") => void;
}

const SERVERS = ["乾坤一掷", "唯我独尊", "梦江南"];

export default function BossScheduleForm({ onClose, onConfirm }: Props) {
  const [server, setServer] = useState(SERVERS[0]);
  const [groupSize, setGroupSize] = useState<2 | 3>(3);
  const [boss, setBoss] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ server, groupSize, boss }),
        }
      );
      if (!res.ok) throw new Error("❌ Failed to create boss plan");
      const created = await res.json();
      onConfirm(created, "boss");
      onClose();
    } catch (err) {
      console.error("❌ Error creating boss plan:", err);
    }
  };

  return (
    <>
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

      <label className={styles.label}>
        分组人数
        <select
          value={groupSize}
          onChange={(e) => setGroupSize(parseInt(e.target.value) as 2 | 3)}
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

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onClose}>
          取消
        </button>
        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={!boss}
        >
          确认
        </button>
      </div>
    </>
  );
}
