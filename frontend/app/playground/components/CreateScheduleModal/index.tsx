"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { getDefaultAbilityPool } from "@/utils/playgroundHelpers";
import {
  toastError,
  toastSuccess,
} from "@/app/components/toast/toast";

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
const ALL_SERVERS = "全服";

function generateTimestampName(server: string) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${server}${mm}${dd}-${hh}${min}`;
}

export default function CreateScheduleModal({ onClose, onConfirm }: Props) {
  // ✅ default: 全服
  const [server, setServer] = useState<string>(ALL_SERVERS);
  const [name, setName] = useState<string>("");

  // ✅ auto-select toast (success) + default name
  useEffect(() => {
    setName(generateTimestampName(ALL_SERVERS));
    toastSuccess("已自动选择全服");
  }, []);

  const handleSelectServer = (s: string) => {
    setServer(s);
    setName(generateTimestampName(s));
  };

  const handleSubmit = async () => {
    if (!server) {
      toastError("请选择服务器后再创建排表。");
      return;
    }

    try {
      const url =
        server === ALL_SERVERS
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/characters`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/characters?server=${server}`;

      const charRes = await fetch(url);
      if (!charRes.ok) throw new Error("Failed to fetch characters");
      const characters = await charRes.json();

      const activeCharacters = characters.filter((c: any) => c.active);
      if (activeCharacters.length === 0) {
        toastError("没有角色，无法创建排表。");
        return;
      }

      const poolRaw = await getDefaultAbilityPool();
      const fullPool: Ability[] = poolRaw.map((a) => ({
        ...a,
        available: true,
      }));

      const payload = {
        name: name || "未命名排表",
        server,
        checkedAbilities: fullPool,
        characterCount: activeCharacters.length,
        characters: activeCharacters.map((c: any) => c._id),
        groups: [],
      };

      onConfirm(payload);
      onClose();
    } catch (err) {
      console.error("❌ [CreateModal] Error creating schedule:", err);
    }
  };

  return (
    // ✅ click outside to close
    <div className={styles.overlay} onClick={onClose}>
      {/* ❌ prevent modal click from closing */}
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>新建排表</h2>

        <div className={styles.label}>服务器</div>
        <div className={styles.serverButtons}>
          {[ALL_SERVERS, ...SERVERS].map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.serverBtn} ${
                server === s ? styles.selected : ""
              }`}
              onClick={() => handleSelectServer(s)}
            >
              {s}
            </button>
          ))}
        </div>

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

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            取消
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
