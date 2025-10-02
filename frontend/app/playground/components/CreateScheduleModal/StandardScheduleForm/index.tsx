"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import { getDefaultAbilityPool } from "@/utils/playgroundHelpers";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Props {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const SERVERS = ["乾坤一掷", "唯我独尊", "梦江南"];

export default function StandardScheduleForm({ onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [server, setServer] = useState(SERVERS[0]);

  const handleSubmit = async () => {
    try {
      // Step 1. Fetch characters
      const charRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters?server=${server}`
      );
      if (!charRes.ok) throw new Error("Failed to fetch characters");
      const characters = await charRes.json();

      const activeCharacters = characters.filter((c: any) => c.active);
      if (activeCharacters.length === 0) {
        alert("该服务器没有启用的角色，无法创建排表。");
        return;
      }

      // Step 2. Get full pool from helper
      const poolRaw = await getDefaultAbilityPool();
      console.log("[CreateModal] Raw pool from helper:", poolRaw);

      // Step 3. Normalize to solver-ready format
      const fullPool: Ability[] = poolRaw.map((a) => ({
        ...a,
        available: true,
      }));
      console.log("[CreateModal] Full pool with available:", fullPool);

      // Step 4. Build payload
      const payload = {
        name: name || "未命名排表",
        server,
        checkedAbilities: fullPool, // 🔑 must match AbilitySchema in backend
        characterCount: activeCharacters.length,
        characters: activeCharacters.map((c: any) => c._id),
        groups: [],
      };
      console.log("[CreateModal] Submitting payload:", payload);

      // Step 5. Send to backend (via parent handler)
      onConfirm(payload);
      onClose();
    } catch (err) {
      console.error("❌ [CreateModal] Error creating schedule:", err);
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
