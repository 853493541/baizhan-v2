"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "./styles.module.css";

import {
  toastSuccess,
  toastError,
  toastInfo,
} from "@/app/components/toast/toast";

interface Props {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const SERVERS = ["乾坤一掷", "唯我独尊", "梦江南"];
const ALL_SERVERS = "全服";
const BOSSES = ["拓跋思南", "青年谢云流", "公孙二娘"];

/* ✅ Name now only includes boss + date */
function generateTimestampName(boss: string) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${boss}-${mm}${dd}-${hh}${min}`;
}

export default function CreateTargetedPlanModal({ onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [server, setServer] = useState<string | null>(null);
  const [targetedBoss, setTargetedBoss] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  /* ✅ Instant guidance toast on modal open */
  useEffect(() => {
    toastInfo("请选择服务器和目标 Boss");
  }, []);

  const handleSelectServer = (s: string) => {
    setServer(s);
  };

  const handleSelectBoss = (b: string) => {
    setTargetedBoss(b);
    setName(generateTimestampName(b));
  };

  const handleSubmit = async () => {
    if (creating) {
      toastError("操作过快，请稍候再试");
      return;
    }
    setCreating(true);

    try {
      const planId = uuidv4();

      const url =
        server === ALL_SERVERS
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/characters`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/characters?server=${server}`;

      const charRes = await fetch(url);
      if (!charRes.ok) throw new Error("Failed to fetch characters");
      const characters = await charRes.json();

      const activeCharacters = characters.filter((c: any) => c.active);
      if (activeCharacters.length === 0) {
        toastError("没有角色，无法创建。");
        setCreating(false);
        return;
      }

      const payload = {
        planId,
        type: "targeted",
        name: name || generateTimestampName(targetedBoss!),
        server,
        targetedBoss,
        characterCount: activeCharacters.length,
        characters: activeCharacters.map((c: any) => c._id),
        groups: [],
      };

      console.log("🚀 Creating targeted plan:", payload);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to create targeted plan: ${errText}`);
      }

      const newPlan = await res.json();
      console.log("✅ Created targeted plan:", newPlan);

      toastSuccess("创建成功");
      onConfirm(newPlan);
      onClose();
    } catch (err) {
      console.error("❌ [CreateTargetedPlanModal] Error:", err);
      toastError("创建失败，请重试。");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>新建单体计划</h2>

        {/* === 服务器选择 === */}
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
              disabled={creating}
            >
              {s}
            </button>
          ))}
        </div>

        {/* === Boss 选择 === */}
        <div className={styles.label}>目标 Boss</div>
        <div className={styles.serverButtons}>
          {BOSSES.map((b) => (
            <button
              key={b}
              type="button"
              className={`${styles.serverBtn} ${
                targetedBoss === b ? styles.selected : ""
              }`}
              onClick={() => handleSelectBoss(b)}
              disabled={creating}
            >
              {b}
            </button>
          ))}
        </div>

        {/* === 名称输入 === */}
        <label className={styles.label}>
          计划名称
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入计划名称"
            className={styles.input}
            disabled={creating}
          />
        </label>

        {/* === 动作按钮 === */}
        <div className={styles.actions}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={creating}
          >
            取消
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={!server || !targetedBoss || creating}
          >
            {creating ? "创建中..." : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}
