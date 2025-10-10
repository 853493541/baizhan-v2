"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.css";

interface CharacterEditData {
  server: string;
  role: string;
  active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;        // refresh parent list
  characterId: string;
  initialData: CharacterEditData;
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const roles = [
  { key: "DPS", label: "输出" },
  { key: "Tank", label: "防御" },
  { key: "Healer", label: "治疗" },
];

export default function EditBasicInfoModal({
  isOpen,
  onClose,
  onSave,
  characterId,
  initialData,
}: Props) {
  const [server, setServer] = useState(initialData.server);
  const [role, setRole] = useState(initialData.role);
  const [active, setActive] = useState(initialData.active);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setServer(initialData.server);
    setRole(initialData.role);
    setActive(initialData.active);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) console.warn("⚠️ NEXT_PUBLIC_API_URL not defined!");

  // ✅ Auto-save helper (fixed URL)
  const autoSave = async (field: Partial<CharacterEditData>) => {
    console.log("🟡 AutoSave:", field);
    const url = `${API_URL}/api/characters/${characterId}`; // ✅ fixed path
    console.log("🔵 PUT →", url);

    setSaving(true);
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(field),
      });

      console.log("🟣 Status:", res.status);
      const text = await res.text();
      console.log("📩 Response:", text.slice(0, 150)); // print snippet only

      if (!res.ok) throw new Error(`Auto save failed: ${res.status}`);
      onSave();
    } catch (err) {
      console.error("❌ Auto save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleServerClick = (s: string) => {
    if (s === server) return;
    setServer(s);
    autoSave({ server: s });
  };

  const handleRoleClick = (r: string) => {
    if (r === role) return;
    setRole(r);
    autoSave({ role: r });
  };

  const handleToggle = () => {
    const newVal = !active;
    setActive(newVal);
    autoSave({ active: newVal });
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个角色吗？")) return;
    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      onSave();
      onClose();
    } catch (err) {
      console.error("❌ Failed to delete character:", err);
    }
  };

  // === Render ===
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>编辑基础信息</h2>

        {/* 区服 */}
        <div className={styles.field}>
          <label className={styles.label}>区服/分组:</label>
          <div className={styles.optionGroup}>
            {servers.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleServerClick(s)}
                className={`${styles.optionBtn} ${
                  server === s ? styles.active : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 定位 */}
        <div className={styles.field}>
          <label className={styles.label}>定位:</label>
          <div className={styles.optionGroup}>
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRoleClick(r.key)}
                className={`${styles.optionBtn} ${
                  role === r.key ? styles.active : ""
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 是否启用 */}
        <div className={styles.field}>
          <label className={styles.label}>是否启用:</label>
          <div
            className={`${styles.toggle} ${active ? styles.on : ""}`}
            onClick={handleToggle}
          >
            <div className={styles.knob}></div>
          </div>
        </div>

        {/* 删除 / 关闭 */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleDelete}
            className={styles.delete}
            disabled={saving}
          >
            删除角色
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.cancel}
            disabled={saving}
          >
            关闭
          </button>
        </div>

        {saving && <p className={styles.saving}>正在保存...</p>}
      </div>
    </div>
  );
}
