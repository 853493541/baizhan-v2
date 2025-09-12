"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import specialBosses from "../../data/special_boss.json";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateBossPlanModal({ onClose, onCreated }: Props) {
  const [server, setServer] = useState("乾坤一掷"); // ✅ default
  const [groupSize, setGroupSize] = useState<2 | 3>(3); // default 3
  const [boss, setBoss] = useState("");

  // Inline function to create Boss Plan
  const createBossPlan = async (data: any) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error("Failed to create boss plan");
    return res.json();
  };

  const handleSubmit = async () => {
    try {
      await createBossPlan({
        server,
        groupSize,
        boss,
      });
      onCreated();
    } catch (err) {
      console.error("❌ Failed to create Boss Plan:", err);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>新建 Boss Plan</h2>

        {/* Server (default 乾坤一掷) */}
        <label className={styles.label}>
          服务器:
          <input
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className={styles.input}
          />
        </label>

        {/* Group size (2 or 3) */}
        <label className={styles.label}>
          分组人数:
          <select
            value={groupSize}
            onChange={(e) => setGroupSize(parseInt(e.target.value) as 2 | 3)}
            className={styles.input}
          >
            <option value={2}>2 人</option>
            <option value={3}>3 人</option>
          </select>
        </label>

        {/* Boss list from JSON */}
        <label className={styles.label}>
          Boss:
          <select
            value={boss}
            onChange={(e) => setBoss(e.target.value)}
            className={styles.input}
          >
            <option value="">请选择 Boss</option>
            {Object.keys(specialBosses).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.modalButtons}>
          <button onClick={handleSubmit} className={styles.confirmBtn}>
            确认
          </button>
          <button onClick={onClose} className={styles.cancelBtn}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
